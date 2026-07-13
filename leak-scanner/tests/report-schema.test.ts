import { describe, expect, it } from "vitest";
import { aiReportSchema } from "@/lib/ai/report-schema";
import { buildFallbackReport } from "@/lib/ai/fallback";
import type { ReportInput } from "@/lib/ai/provider";
import { extractPage } from "@/lib/scanner/extractor";
import { runScoringEngine } from "@/lib/scoring/engine";
import { buildRecommendations } from "@/lib/scoring/recommendations";
import type { ExtractedSite } from "@/lib/scanner/types";
import { STRONG_HOME_HTML, WEAK_HOME_HTML } from "./fixtures/strong-site";

function reportInputFor(html: string): ReportInput {
  const page = extractPage(html, "https://example.com/", "home");
  const site: ExtractedSite = {
    inputUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    fetchedAt: new Date().toISOString(),
    pages: [page],
    combinedText: page.text,
    fetchErrors: [],
  };
  const ctx = {
    businessName: "Test Biz",
    industry: "HVAC",
    city: "Las Vegas",
    state: "NV",
    primaryGoal: "more_calls",
  };
  const scores = runScoringEngine(site, ctx);
  return {
    business: { ...ctx, websiteUrl: site.finalUrl },
    scores,
    findings: scores.findings,
    recommendations: buildRecommendations(scores.findings),
    siteExcerpt: site.combinedText,
    fetchErrors: [],
  };
}

describe("aiReportSchema", () => {
  it("accepts the fallback report for a weak site", () => {
    const report = buildFallbackReport(reportInputFor(WEAK_HOME_HTML));
    expect(() => aiReportSchema.parse(report)).not.toThrow();
    expect(report.category_summaries).toHaveLength(5);
    expect(report.top_revenue_leaks.length).toBeGreaterThanOrEqual(3);
    expect(report.greenstar_service_matches.length).toBeGreaterThanOrEqual(1);
  });

  it("accepts the fallback report for a strong site (few recommendations)", () => {
    const report = buildFallbackReport(reportInputFor(STRONG_HOME_HTML));
    expect(() => aiReportSchema.parse(report)).not.toThrow();
    expect(report.top_revenue_leaks.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects reports with missing sections or wrong categories", () => {
    const good = buildFallbackReport(reportInputFor(WEAK_HOME_HTML));
    expect(() =>
      aiReportSchema.parse({ ...good, executive_summary: "" })
    ).toThrow();
    expect(() =>
      aiReportSchema.parse({ ...good, category_summaries: good.category_summaries.slice(0, 3) })
    ).toThrow();
    expect(() =>
      aiReportSchema.parse({
        ...good,
        top_revenue_leaks: [{ title: "x", explanation: "y", severity: "catastrophic" }],
      })
    ).toThrow();
    expect(() => aiReportSchema.parse({})).toThrow();
  });

  it("fallback executive summary repeats the deterministic score verbatim", () => {
    const input = reportInputFor(WEAK_HOME_HTML);
    const report = buildFallbackReport(input);
    expect(report.executive_summary).toContain(`${input.scores.revenueLeakScore}/100`);
  });
});
