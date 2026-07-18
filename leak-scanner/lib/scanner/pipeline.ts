import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { extractSite } from "./extractor";
import {
  CATEGORY_LABELS,
  CATEGORY_SCORE_KEYS,
  runScoringEngine,
  verdictForScore,
} from "@/lib/scoring/engine";
import { buildRecommendations } from "@/lib/scoring/recommendations";
import {
  buildNoWebsiteRecommendations,
  buildNoWebsiteReport,
  buildNoWebsiteScoring,
} from "@/lib/scoring/no-website";
import type { FindingCategory, ScoringResult } from "@/lib/scanner/types";
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
  /** Null = the business has no website (scored as a leak, not an error). */
  websiteUrl: string | null;
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
  utmSource?: string | null;
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
      utmSource: input.utmSource ?? null,
    })
    .returning()
    .get();

  return { business, scan, lead };
}

const REPORT_CATEGORIES: FindingCategory[] = [
  "conversion",
  "local",
  "ai_visibility",
  "trust",
  "follow_up",
];

/** The lowest-scoring category — the headline weakness for outreach. */
export function weakestCategory(scoring: ScoringResult): {
  category: FindingCategory;
  label: string;
  score: number;
} {
  let weakest = REPORT_CATEGORIES[0];
  let weakestScore = scoring[CATEGORY_SCORE_KEYS[weakest]];
  for (const category of REPORT_CATEGORIES) {
    const score = scoring[CATEGORY_SCORE_KEYS[category]];
    if (score < weakestScore) {
      weakest = category;
      weakestScore = score;
    }
  }
  return { category: weakest, label: CATEGORY_LABELS[weakest], score: weakestScore };
}

interface LeadWebhookPayload {
  businessName: string;
  contactName: string | null;
  email: string | null;
  websiteUrl: string | null;
  industry: string;
  city: string | null;
  state: string | null;
  score: number;
  weakestCategory: string;
  topProblems: string[];
  reportUrl: string;
  source: string | null;
}

/**
 * Optional outbound webhook (e.g. GoHighLevel) fired when a scan completes.
 * No-op unless LEAD_WEBHOOK_URL is set. Never throws — lead capture must not
 * depend on a third-party endpoint being up.
 */
async function postLeadWebhook(payload: LeadWebhookPayload): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (error) {
    console.error("lead webhook failed", error);
  }
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
    let scoring: ScoringResult;
    let recommendations: ReturnType<typeof buildRecommendations>;
    let report: import("@/lib/ai/report-schema").AIReport;
    let source: "ai" | "fallback";
    let extractedText: string | null = null;
    let extractedMetadataJson: string;

    if (!scan.websiteUrl) {
      // No-website path: nothing to fetch. Honest zero scores, curated
      // opportunity-framed report — the missing site IS the critical leak.
      await setStage(scanId, SCAN_STAGES[5]);
      scoring = buildNoWebsiteScoring();
      recommendations = buildNoWebsiteRecommendations();
      report = buildNoWebsiteReport(ctx);
      source = "fallback";
      extractedMetadataJson = JSON.stringify({
        noWebsite: true,
        fetchedAt: new Date().toISOString(),
        pages: [],
        fetchErrors: [],
      });
    } else {
      await setStage(scanId, SCAN_STAGES[0]);
      const site = await extractSite(scan.websiteUrl, (stage) => {
        void setStage(scanId, stage);
      });

      await setStage(scanId, SCAN_STAGES[1]);
      scoring = runScoringEngine(site, ctx);

      await setStage(scanId, SCAN_STAGES[5]);
      recommendations = buildRecommendations(scoring.findings);

      ({ report, source } = await generateReportWithFallback({
        business: { ...ctx, websiteUrl: scan.websiteUrl },
        scores: scoring,
        findings: scoring.findings,
        recommendations,
        siteExcerpt: site.combinedText.slice(0, 6000),
        fetchErrors: site.fetchErrors,
      }));

      extractedText = site.combinedText.slice(0, 100_000);
      extractedMetadataJson = JSON.stringify({
        finalUrl: site.finalUrl,
        fetchedAt: site.fetchedAt,
        pages: site.pages.map((p) => ({
          url: p.url,
          kind: p.kind,
          title: p.title,
          wordCount: p.wordCount,
        })),
        fetchErrors: site.fetchErrors,
      });
    }

    await db
      .update(schema.scans)
      .set({
        // Sub-page fetch failures are recorded in metadata but the scan still
        // completes on homepage signals alone.
        status: "completed",
        progressStage: null,
        extractedText,
        extractedMetadataJson,
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
        websiteReachable: !!scan.websiteUrl,
        recommendations,
      });
      const weakest = weakestCategory(scoring);
      const topProblems = recommendations.slice(0, 3).map((r) => r.title);
      const reportUrl = appUrl(`/report/${scan.shareToken}`);

      await db
        .update(schema.leads)
        .set({
          score: scoring.revenueLeakScore,
          hotScore,
          weakestCategory: weakest.label,
          topProblemsJson: JSON.stringify(topProblems),
          reportUrl,
        })
        .where(eq(schema.leads.id, lead.id))
        .run();

      // Optional GoHighLevel-style webhook. Fire-and-forget; never blocks.
      void postLeadWebhook({
        businessName: lead.businessName,
        contactName: lead.contactName,
        email: lead.email,
        websiteUrl: lead.websiteUrl,
        industry: lead.industry,
        city: lead.city,
        state: lead.state,
        score: scoring.revenueLeakScore,
        weakestCategory: weakest.label,
        topProblems,
        reportUrl,
        source: lead.utmSource ?? lead.source,
      });
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
            contactName: lead.contactName,
            email: lead.email,
            websiteUrl: lead.websiteUrl,
            industry: lead.industry,
            city: lead.city,
            state: lead.state,
            score: scoring.revenueLeakScore,
            hotScore,
            weakestCategory: weakest.label,
            topProblems,
            reportUrl,
            adminUrl: appUrl(`/admin/leads/${lead.id}`),
          }),
          eventType: "admin_new_lead",
          scanId,
          leadId: lead.id,
        });
      }
    }

    trackEvent({
      eventType: "scan_completed",
      scanId,
      metadata: { industry: business.industry, score: scoring.revenueLeakScore },
    });
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
