/**
 * Two-tier funnel tests: no-website scoring/report path, intake insight
 * engine, and the full no-website pipeline against a scratch DB.
 */
import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { aiReportSchema } from "@/lib/ai/report-schema";
import {
  buildNoWebsiteRecommendations,
  buildNoWebsiteReport,
  buildNoWebsiteScoring,
} from "@/lib/scoring/no-website";
import {
  INTAKE_QUESTIONS,
  buildIntakeInsights,
  intakeAnswerLabel,
  intakeSchema,
  type IntakeAnswers,
} from "@/lib/scoring/intake";
import { GREENSTAR_SERVICES } from "@/lib/services/catalog";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "greenstar-tier-"));
process.env.DATABASE_PATH = path.join(tmpDir, "tier-test.db");
delete process.env.TURSO_DATABASE_URL;

describe("no-website scoring", () => {
  it("scores zero across the board with all findings not-detected", () => {
    const scoring = buildNoWebsiteScoring();
    expect(scoring.revenueLeakScore).toBe(0);
    expect(scoring.websiteConversionScore).toBe(0);
    expect(scoring.localVisibilityScore).toBe(0);
    expect(scoring.aiVisibilityScore).toBe(0);
    expect(scoring.trustProofScore).toBe(0);
    expect(scoring.followUpReadinessScore).toBe(0);
    expect(scoring.findings.length).toBeGreaterThanOrEqual(5);
    expect(scoring.findings.every((f) => !f.detected)).toBe(true);
    // One finding per category so every score card has a basis.
    const categories = new Set(scoring.findings.map((f) => f.category));
    expect(categories.size).toBe(5);
  });

  it("recommendations lead with the missing website and map to real services", () => {
    const recs = buildNoWebsiteRecommendations();
    expect(recs[0].ruleId).toBe("no_website");
    expect(recs[0].severity).toBe("critical");
    expect(recs[0].greenstarService).toBe("website_conversion_rebuild");
    const serviceIds = new Set(GREENSTAR_SERVICES.map((s) => s.id));
    for (const rec of recs) {
      expect(serviceIds.has(rec.greenstarService), rec.ruleId).toBe(true);
    }
  });

  it("report validates against the strict schema and stays empowering", () => {
    const report = buildNoWebsiteReport({
      businessName: "Fresh Start Detailing",
      industry: "Auto Repair",
      city: "Henderson",
      state: "NV",
    });
    expect(() => aiReportSchema.parse(report)).not.toThrow();
    expect(report.category_summaries).toHaveLength(5);
    const allCopy = JSON.stringify(report).toLowerCase();
    expect(allCopy).toContain("opportunity");
    // Empowering, not shaming: no failure-blame language.
    expect(allCopy).not.toContain("you failed");
    expect(allCopy).not.toContain("your fault");
    // Website build is the lead service match.
    expect(report.greenstar_service_matches[0].service_id).toBe("website_conversion_rebuild");
  });
});

describe("intake engine", () => {
  const validAnswers: IntakeAnswers = {
    mainGoal: "more_calls",
    discovery: "word_of_mouth",
    missedCalls: "voicemail",
    responseSpeed: "same_day",
    reviewHabit: "sometimes",
    customerValue: "v500_2000",
  };

  it("accepts valid answers and rejects invalid ones", () => {
    expect(() => intakeSchema.parse(validAnswers)).not.toThrow();
    expect(() => intakeSchema.parse({ ...validAnswers, mainGoal: "world_domination" })).toThrow();
    expect(() => intakeSchema.parse({})).toThrow();
  });

  it("every possible answer combination produces six complete insights", () => {
    // Vary each question across all of its options (others held at valid).
    for (const q of INTAKE_QUESTIONS) {
      for (const option of q.options) {
        const answers = intakeSchema.parse({ ...validAnswers, [q.id]: option.value });
        const insights = buildIntakeInsights(answers);
        expect(insights).toHaveLength(6);
        for (const insight of insights) {
          expect(insight.title.length, `${q.id}=${option.value}`).toBeGreaterThan(0);
          expect(insight.youToldUs.length, `${q.id}=${option.value}`).toBeGreaterThan(0);
          expect(insight.insight.length, `${q.id}=${option.value}`).toBeGreaterThan(20);
          expect(insight.recommendation.length, `${q.id}=${option.value}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it("insights quote the lead's own answer labels", () => {
    const insights = buildIntakeInsights(validAnswers);
    expect(insights[0].youToldUs).toBe(intakeAnswerLabel("mainGoal", "more_calls"));
    expect(insights[2].youToldUs).toBe("It goes to voicemail");
  });

  it("customer-value framing uses their number, no invented revenue claims", () => {
    const insights = buildIntakeInsights(validAnswers);
    const value = insights.find((i) => i.title === "What a customer is worth")!;
    expect(value.insight).toContain("your own numbers");
  });
});

describe("no-website pipeline (scratch DB, no network)", () => {
  let db: typeof import("@/lib/db")["db"];
  let schema: typeof import("@/lib/db")["schema"];
  let createScanRecords: typeof import("@/lib/scanner/pipeline")["createScanRecords"];
  let runScanPipeline: typeof import("@/lib/scanner/pipeline")["runScanPipeline"];

  beforeAll(async () => {
    const dbModule = await import("@/lib/db");
    db = dbModule.db;
    schema = dbModule.schema;
    await dbModule.dbReady();
    ({ createScanRecords, runScanPipeline } = await import("@/lib/scanner/pipeline"));
  });

  it("completes a scan with no website and enriches the lead", async () => {
    const { scan } = await createScanRecords({
      businessName: "Handshake Plumbing",
      websiteUrl: null,
      industry: "Plumbing",
      city: "Boulder City",
      state: "NV",
      contactName: "Alex",
      email: "alex@handshake.example",
    });
    expect(scan.websiteUrl).toBeNull();
    expect(scan.depth).toBe("quick");

    await runScanPipeline(scan.id);

    const { eq } = await import("drizzle-orm");
    const done = await db.select().from(schema.scans).where(eq(schema.scans.id, scan.id)).get();
    expect(done!.status).toBe("completed");
    expect(done!.revenueLeakScore).toBe(0);
    expect(done!.aiSource).toBe("fallback");
    const report = aiReportSchema.parse(JSON.parse(done!.aiReportJson!));
    expect(report.top_revenue_leaks[0].title).toContain("website");

    const lead = await db.select().from(schema.leads).where(eq(schema.leads.scanId, scan.id)).get();
    expect(lead!.score).toBe(0);
    expect(lead!.websiteUrl).toBeNull();
    expect(lead!.weakestCategory).toBeTruthy();
    expect(JSON.parse(lead!.topProblemsJson!)).toContain("You don't have a website yet");
  });
});
