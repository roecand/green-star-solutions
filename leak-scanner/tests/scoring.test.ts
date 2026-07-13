import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/scanner/extractor";
import type { ExtractedSite, ScanContext } from "@/lib/scanner/types";
import {
  CATEGORY_WEIGHTS,
  runScoringEngine,
  verdictForScore,
} from "@/lib/scoring/engine";
import {
  aiVisibilityRules,
  conversionRules,
  followUpRules,
  localRules,
  trustRules,
} from "@/lib/scoring/rules";
import { buildRecommendations } from "@/lib/scoring/recommendations";
import { REC_TEMPLATES } from "@/lib/scoring/recommendations";
import { allRules } from "@/lib/scoring/rules";
import { GREENSTAR_SERVICES } from "@/lib/services/catalog";
import { STRONG_HOME_HTML, WEAK_HOME_HTML } from "./fixtures/strong-site";

function siteFromHtml(html: string, url: string): ExtractedSite {
  const page = extractPage(html, url, "home");
  return {
    inputUrl: url,
    finalUrl: url,
    fetchedAt: new Date().toISOString(),
    pages: [page],
    combinedText: page.text,
    fetchErrors: [],
  };
}

const ctx: ScanContext = {
  businessName: "Desert Air",
  industry: "HVAC",
  city: "Las Vegas",
  state: "NV",
  primaryGoal: "more_calls",
};

describe("rule weights", () => {
  it("each category's weights sum to 100", () => {
    for (const [name, rules] of Object.entries({
      conversion: conversionRules,
      local: localRules,
      ai: aiVisibilityRules,
      trust: trustRules,
      followUp: followUpRules,
    })) {
      const sum = rules.reduce((s, r) => s + r.weight, 0);
      expect(sum, `${name} weights`).toBe(100);
    }
  });

  it("category weights for the leak score sum to 1", () => {
    const sum = Object.values(CATEGORY_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("every rule has a recommendation template and a valid service", () => {
    const serviceIds = new Set(GREENSTAR_SERVICES.map((s) => s.id));
    for (const rule of allRules) {
      const template = REC_TEMPLATES[rule.id];
      expect(template, `template for ${rule.id}`).toBeDefined();
      expect(serviceIds.has(template.greenstarService), `service for ${rule.id}`).toBe(true);
    }
  });
});

describe("runScoringEngine", () => {
  it("scores a strong site high across all categories", () => {
    const result = runScoringEngine(siteFromHtml(STRONG_HOME_HTML, "https://desertair.com/"), ctx);
    expect(result.websiteConversionScore).toBeGreaterThanOrEqual(80);
    expect(result.localVisibilityScore).toBeGreaterThanOrEqual(75);
    expect(result.aiVisibilityScore).toBeGreaterThanOrEqual(75);
    expect(result.trustProofScore).toBeGreaterThanOrEqual(80);
    expect(result.followUpReadinessScore).toBeGreaterThanOrEqual(70);
    expect(result.revenueLeakScore).toBeGreaterThanOrEqual(75);
  });

  it("scores a weak site low", () => {
    const result = runScoringEngine(siteFromHtml(WEAK_HOME_HTML, "https://weak.example.com/"), ctx);
    expect(result.revenueLeakScore).toBeLessThan(25);
    expect(result.websiteConversionScore).toBeLessThan(30);
  });

  it("is deterministic", () => {
    const site = siteFromHtml(STRONG_HOME_HTML, "https://desertair.com/");
    const a = runScoringEngine(site, ctx);
    const b = runScoringEngine(site, ctx);
    expect(a).toEqual(b);
  });

  it("attaches evidence to detected findings only", () => {
    const result = runScoringEngine(siteFromHtml(STRONG_HOME_HTML, "https://desertair.com/"), ctx);
    for (const finding of result.findings) {
      if (finding.detected) expect(finding.evidence, finding.id).toBeTruthy();
      else expect(finding.evidence, finding.id).toBeNull();
    }
  });
});

describe("buildRecommendations", () => {
  it("produces more recommendations for weaker sites, most severe first", () => {
    const weak = runScoringEngine(siteFromHtml(WEAK_HOME_HTML, "https://weak.example.com/"), ctx);
    const strong = runScoringEngine(siteFromHtml(STRONG_HOME_HTML, "https://desertair.com/"), ctx);
    const weakRecs = buildRecommendations(weak.findings);
    const strongRecs = buildRecommendations(strong.findings);
    expect(weakRecs.length).toBeGreaterThan(strongRecs.length);
    expect(weakRecs[0].severity).toBe("critical");
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < weakRecs.length; i++) {
      expect(order[weakRecs[i].severity]).toBeGreaterThanOrEqual(order[weakRecs[i - 1].severity]);
    }
  });
});

describe("verdictForScore", () => {
  it("returns the right band copy", () => {
    expect(verdictForScore(90)).toContain("Strong foundation");
    expect(verdictForScore(70)).toContain("Good business");
    expect(verdictForScore(50)).toContain("probably leaking");
    expect(verdictForScore(20)).toContain("harder for customers");
  });
});
