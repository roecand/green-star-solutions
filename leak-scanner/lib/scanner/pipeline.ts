import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { extractSite } from "./extractor";
import { runScoringEngine, verdictForScore } from "@/lib/scoring/engine";
import { buildRecommendations } from "@/lib/scoring/recommendations";
import { generateReportWithFallback } from "@/lib/ai/provider";
import { computeHotScore } from "@/lib/leads/hot-score";
import { sendEmail, appUrl } from "@/lib/email/send";
import { adminNewLeadEmail, reportReadyEmail } from "@/lib/email/templates";
import { trackEvent } from "@/lib/analytics/track";
import type { ScanContext } from "./types";
import { UnsafeUrlError } from "./url";
import { FetchFailedError } from "./fetcher";

export const SCAN_STAGES = [
  "Reading website",
  "Checking conversion signals",
  "Checking local visibility",
  "Checking AI-readiness",
  "Checking trust signals",
  "Building action plan",
] as const;

export interface CreateScanInput {
  businessName: string;
  websiteUrl: string;
  industry: string;
  city?: string;
  state?: string;
  email?: string;
  contactName?: string;
  phone?: string;
  primaryGoal?: string;
  competitorUrls?: string[];
  organizationId?: string | null;
  source?: "self_serve" | "outreach" | "demo";
}

/** Creates business + scan + lead rows and returns identifiers. */
export async function createScanRecords(input: CreateScanInput) {
  const business = await db
    .insert(schema.businesses)
    .values({
      organizationId: input.organizationId ?? null,
      businessName: input.businessName,
      websiteUrl: input.websiteUrl,
      industry: input.industry,
      city: input.city ?? null,
      state: input.state ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      primaryGoal: input.primaryGoal ?? null,
    })
    .returning()
    .get();

  for (const url of input.competitorUrls ?? []) {
    await db
      .insert(schema.competitors)
      .values({ businessId: business.id, competitorUrl: url })
      .run();
  }

  const scan = await db
    .insert(schema.scans)
    .values({
      businessId: business.id,
      status: "pending",
      shareToken: randomBytes(16).toString("hex"),
      websiteUrl: input.websiteUrl,
      industry: input.industry,
      city: input.city ?? null,
      state: input.state ?? null,
    })
    .returning()
    .get();

  const lead = await db
    .insert(schema.leads)
    .values({
      scanId: scan.id,
      businessName: input.businessName,
      contactName: input.contactName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl,
      industry: input.industry,
      city: input.city ?? null,
      state: input.state ?? null,
      source: input.source ?? "self_serve",
    })
    .returning()
    .get();

  return { business, scan, lead };
}

async function setStage(scanId: string, stage: string): Promise<void> {
  await db
    .update(schema.scans)
    .set({ progressStage: stage, status: "running" })
    .where(eq(schema.scans.id, scanId))
    .run();
}

/**
 * Runs the full scan pipeline for an already-created scan row. Designed to be
 * awaited from the API route (typical runtime: a few seconds of fetching plus
 * optional AI call). All failures are captured on the scan row.
 */
export async function runScanPipeline(scanId: string): Promise<void> {
  const scan = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.id, scanId))
    .get();
  if (!scan) throw new Error(`scan ${scanId} not found`);
  const business = await db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, scan.businessId))
    .get();
  if (!business) throw new Error(`business for scan ${scanId} not found`);

  const ctx: ScanContext = {
    businessName: business.businessName,
    industry: business.industry,
    city: business.city,
    state: business.state,
    primaryGoal: business.primaryGoal,
  };

  try {
    await setStage(scanId, SCAN_STAGES[0]);
    const site = await extractSite(scan.websiteUrl, (stage) => {
      void setStage(scanId, stage);
    });

    await setStage(scanId, SCAN_STAGES[1]);
    const scoring = runScoringEngine(site, ctx);

    await setStage(scanId, SCAN_STAGES[5]);
    const recommendations = buildRecommendations(scoring.findings);

    const { report, source } = await generateReportWithFallback({
      business: { ...ctx, websiteUrl: scan.websiteUrl },
      scores: scoring,
      findings: scoring.findings,
      recommendations,
      siteExcerpt: site.combinedText.slice(0, 6000),
      fetchErrors: site.fetchErrors,
    });

    await db
      .update(schema.scans)
      .set({
        // Sub-page fetch failures are recorded in metadata but the scan still
        // completes on homepage signals alone.
        status: "completed",
        progressStage: null,
        extractedText: site.combinedText.slice(0, 100_000),
        extractedMetadataJson: JSON.stringify({
          finalUrl: site.finalUrl,
          fetchedAt: site.fetchedAt,
          pages: site.pages.map((p) => ({
            url: p.url,
            kind: p.kind,
            title: p.title,
            wordCount: p.wordCount,
          })),
          fetchErrors: site.fetchErrors,
        }),
        deterministicFindingsJson: JSON.stringify(scoring.findings),
        aiReportJson: JSON.stringify(report),
        aiSource: source,
        revenueLeakScore: scoring.revenueLeakScore,
        websiteConversionScore: scoring.websiteConversionScore,
        localVisibilityScore: scoring.localVisibilityScore,
        aiVisibilityScore: scoring.aiVisibilityScore,
        trustProofScore: scoring.trustProofScore,
        followUpReadinessScore: scoring.followUpReadinessScore,
        completedAt: new Date(),
      })
      .where(eq(schema.scans.id, scanId))
      .run();

    for (const rec of recommendations) {
      await db
        .insert(schema.recommendations)
        .values({
          scanId,
          category: rec.category,
          severity: rec.severity,
          title: rec.title,
          explanation: rec.explanation,
          recommendedFix: rec.recommendedFix,
          greenstarService: rec.greenstarService,
          priority: rec.priority,
        })
        .run();
    }

    const lead = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.scanId, scanId))
      .get();
    if (lead) {
      const hotScore = computeHotScore({
        revenueLeakScore: scoring.revenueLeakScore,
        emailProvided: !!lead.email,
        clickedCta: false,
        requestedHelp: false,
        viewedReport: false,
        industry: lead.industry,
        websiteReachable: true,
        recommendations,
      });
      await db
        .update(schema.leads)
        .set({ score: scoring.revenueLeakScore, hotScore })
        .where(eq(schema.leads.id, lead.id))
        .run();

      const reportUrl = appUrl(`/report/${scan.shareToken}`);
      if (lead.email && lead.source !== "outreach") {
        await sendEmail({
          to: lead.email,
          subject: `${business.businessName}: your Revenue Leak Score is ${scoring.revenueLeakScore}/100`,
          html: reportReadyEmail({
            businessName: business.businessName,
            score: scoring.revenueLeakScore,
            verdict: verdictForScore(scoring.revenueLeakScore),
            reportUrl,
          }),
          eventType: "scan_completed_report",
          scanId,
          leadId: lead.id,
        });
      }
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await sendEmail({
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: `New lead: ${business.businessName} (${scoring.revenueLeakScore}/100)`,
          html: adminNewLeadEmail({
            businessName: business.businessName,
            email: lead.email,
            industry: lead.industry,
            city: lead.city,
            score: scoring.revenueLeakScore,
            hotScore,
            adminUrl: appUrl(`/admin/leads/${lead.id}`),
          }),
          eventType: "admin_new_lead",
          scanId,
          leadId: lead.id,
        });
      }
    }

    trackEvent({ eventType: "scanner_complete", scanId });
  } catch (error) {
    const message =
      error instanceof UnsafeUrlError || error instanceof FetchFailedError
        ? error.message
        : "The scan hit an unexpected error. Please try again.";
    console.error(`scan ${scanId} failed`, error);
    await db
      .update(schema.scans)
      .set({ status: "failed", progressStage: null, errorMessage: message })
      .where(eq(schema.scans.id, scanId))
      .run();
  }
}
