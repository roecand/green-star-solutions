import { afterEach, describe, expect, it } from "vitest";
import { billingEnabled, bookingUrl } from "@/lib/flags";
import { weakestCategory } from "@/lib/scanner/pipeline";
import { REC_TEMPLATES } from "@/lib/scoring/recommendations";
import { runScoringEngine } from "@/lib/scoring/engine";
import { extractPage } from "@/lib/scanner/extractor";
import type { ExtractedSite } from "@/lib/scanner/types";
import { STRONG_HOME_HTML, WEAK_HOME_HTML } from "./fixtures/strong-site";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function siteFrom(html: string): ExtractedSite {
  const page = extractPage(html, "https://example.com/", "home");
  return {
    inputUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    fetchedAt: new Date().toISOString(),
    pages: [page],
    combinedText: page.text,
    fetchErrors: [],
  };
}

const ctx = { businessName: "Test", industry: "HVAC", city: "Las Vegas", state: "NV" };

describe("feature flags", () => {
  it("billing is off unless explicitly enabled", () => {
    delete process.env.NEXT_PUBLIC_BILLING_ENABLED;
    expect(billingEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_BILLING_ENABLED = "false";
    expect(billingEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_BILLING_ENABLED = "true";
    expect(billingEnabled()).toBe(true);
  });

  it("bookingUrl is null when unset or blank, trimmed otherwise", () => {
    delete process.env.NEXT_PUBLIC_BOOKING_URL;
    expect(bookingUrl()).toBeNull();
    process.env.NEXT_PUBLIC_BOOKING_URL = "   ";
    expect(bookingUrl()).toBeNull();
    process.env.NEXT_PUBLIC_BOOKING_URL = " https://cal.com/greenstar ";
    expect(bookingUrl()).toBe("https://cal.com/greenstar");
  });
});

describe("weakestCategory", () => {
  it("returns the lowest-scoring category with a human label", () => {
    const weak = runScoringEngine(siteFrom(WEAK_HOME_HTML), ctx);
    const result = weakestCategory(weak);
    expect(result.label).toBeTruthy();
    // No other category scores lower than the reported weakest.
    const scores = [
      weak.websiteConversionScore,
      weak.localVisibilityScore,
      weak.aiVisibilityScore,
      weak.trustProofScore,
      weak.followUpReadinessScore,
    ];
    expect(result.score).toBe(Math.min(...scores));
  });

  it("is stable for a strong site too", () => {
    const strong = runScoringEngine(siteFrom(STRONG_HOME_HTML), ctx);
    const result = weakestCategory(strong);
    expect(["conversion", "local", "ai_visibility", "trust", "follow_up"]).toContain(
      result.category
    );
  });
});

describe("report integrity", () => {
  it("no recommendation asserts an unverifiable internal system as fact", () => {
    const forbidden = [
      "leads live in a personal inbox",
      "you have no crm",
      "you don't have a crm",
      "no follow-up system detected",
    ];
    for (const [id, rec] of Object.entries(REC_TEMPLATES)) {
      const text = `${rec.title} ${rec.explanation}`.toLowerCase();
      for (const phrase of forbidden) {
        expect(text.includes(phrase), `${id} should not claim "${phrase}"`).toBe(false);
      }
    }
  });

  it("follow-up internal-system recs use public-signal framing", () => {
    const crm = REC_TEMPLATES["followup_crm_indicators"];
    expect(crm.explanation.toLowerCase()).toMatch(/public|from the outside|doesn't mean/);
  });
});
