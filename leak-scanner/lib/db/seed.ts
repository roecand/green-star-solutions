/**
 * Seeds demo data: an admin user (from ADMIN_EMAIL, default password below),
 * plus five fictional demo businesses run through the REAL extraction +
 * scoring + fallback-report pipeline so demo reports are genuine outputs.
 *
 * Run: npm run db:seed   (idempotent — safe to re-run)
 */
import { eq } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { extractPage } from "@/lib/scanner/extractor";
import { runScoringEngine } from "@/lib/scoring/engine";
import { buildRecommendations } from "@/lib/scoring/recommendations";
import { buildFallbackReport } from "@/lib/ai/fallback";
import { computeHotScore } from "@/lib/leads/hot-score";
import { DEMO_BUSINESSES } from "./demo-fixtures";
import type { ExtractedSite } from "@/lib/scanner/types";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@greenstar.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "greenstar-admin";

async function ensureAdmin(): Promise<string> {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL))
    .get();
  if (existing) {
    if (existing.role !== "admin") {
      await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, existing.id)).run();
    }
    return existing.id;
  }
  const user = await db
    .insert(schema.users)
    .values({
      email: ADMIN_EMAIL,
      name: "Greenstar Admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
    })
    .returning()
    .get();
  await db
    .insert(schema.organizations)
    .values({ ownerUserId: user.id, name: "Greenstar Solutions", plan: "pro" })
    .run();
  console.log(`created admin user ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);
  return user.id;
}

async function seedDemoBusinesses(): Promise<void> {
  for (const demo of DEMO_BUSINESSES) {
    const existing = await db
      .select({ id: schema.scans.id })
      .from(schema.scans)
      .where(eq(schema.scans.shareToken, demo.shareToken))
      .get();
    if (existing) {
      console.log(`demo ${demo.slug} already seeded, skipping`);
      continue;
    }

    const page = extractPage(demo.html, demo.websiteUrl, "home");
    const site: ExtractedSite = {
      inputUrl: demo.websiteUrl,
      finalUrl: demo.websiteUrl,
      fetchedAt: new Date().toISOString(),
      pages: [page],
      combinedText: page.text,
      fetchErrors: [],
    };
    const ctx = {
      businessName: demo.businessName,
      industry: demo.industry,
      city: demo.city,
      state: demo.state,
      primaryGoal: demo.primaryGoal,
    };
    const scoring = runScoringEngine(site, ctx);
    const recommendations = buildRecommendations(scoring.findings);
    const report = buildFallbackReport({
      business: { ...ctx, websiteUrl: demo.websiteUrl },
      scores: scoring,
      findings: scoring.findings,
      recommendations,
      siteExcerpt: site.combinedText,
      fetchErrors: [],
    });

    const business = await db
      .insert(schema.businesses)
      .values({
        businessName: demo.businessName,
        websiteUrl: demo.websiteUrl,
        industry: demo.industry,
        city: demo.city,
        state: demo.state,
        email: demo.email,
        primaryGoal: demo.primaryGoal,
      })
      .returning()
      .get();

    const scan = await db
      .insert(schema.scans)
      .values({
        businessId: business.id,
        status: "completed",
        shareToken: demo.shareToken,
        websiteUrl: demo.websiteUrl,
        industry: demo.industry,
        city: demo.city,
        state: demo.state,
        extractedText: site.combinedText.slice(0, 100_000),
        extractedMetadataJson: JSON.stringify({
          finalUrl: demo.websiteUrl,
          fetchedAt: site.fetchedAt,
          pages: [{ url: page.url, kind: page.kind, title: page.title, wordCount: page.wordCount }],
          fetchErrors: [],
          demo: true,
        }),
        deterministicFindingsJson: JSON.stringify(scoring.findings),
        aiReportJson: JSON.stringify(report),
        aiSource: "fallback",
        revenueLeakScore: scoring.revenueLeakScore,
        websiteConversionScore: scoring.websiteConversionScore,
        localVisibilityScore: scoring.localVisibilityScore,
        aiVisibilityScore: scoring.aiVisibilityScore,
        trustProofScore: scoring.trustProofScore,
        followUpReadinessScore: scoring.followUpReadinessScore,
        completedAt: new Date(),
      })
      .returning()
      .get();

    for (const rec of recommendations) {
      await db.insert(schema.recommendations)
        .values({
          scanId: scan.id,
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

    const hotScore = computeHotScore({
      revenueLeakScore: scoring.revenueLeakScore,
      emailProvided: true,
      clickedCta: false,
      requestedHelp: false,
      viewedReport: false,
      industry: demo.industry,
      websiteReachable: true,
      recommendations,
    });
    await db.insert(schema.leads)
      .values({
        scanId: scan.id,
        businessName: demo.businessName,
        email: demo.email,
        websiteUrl: demo.websiteUrl,
        industry: demo.industry,
        city: demo.city,
        state: demo.state,
        score: scoring.revenueLeakScore,
        hotScore,
        source: "demo",
      })
      .run();

    console.log(
      `seeded demo ${demo.slug}: leak score ${scoring.revenueLeakScore} ` +
        `(conv ${scoring.websiteConversionScore}, local ${scoring.localVisibilityScore}, ` +
        `ai ${scoring.aiVisibilityScore}, trust ${scoring.trustProofScore}, followup ${scoring.followUpReadinessScore})`
    );
  }
}

async function main() {
  await dbReady();
  await ensureAdmin();
  await seedDemoBusinesses();
  console.log("seed complete");
}

main().catch((error) => {
  console.error("seed failed", error);
  process.exit(1);
});
