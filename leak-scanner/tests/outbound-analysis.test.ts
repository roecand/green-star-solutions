import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/scanner/extractor";
import type { ExtractedSite } from "@/lib/scanner/types";
import { computePriority } from "@/lib/outbound/lead-scoring/priority";
import { deriveObservations } from "@/lib/outbound/website-analysis/observations";
import { analyzeSignalsDeterministic, analyzeWebsite } from "@/lib/outbound/website-analysis/analyze";
import { extractCopyrightYear, extractReviewCount, extractSignals, scoreSignals } from "@/lib/outbound/website-analysis/signals";
import { DATED_SITE_HTML, POLISHED_SITE_HTML } from "./fixtures/outbound-sites";

function site(html: string, url: string): ExtractedSite {
  const page = extractPage(html, url, "home");
  return { inputUrl: url, finalUrl: url, fetchedAt: new Date().toISOString(), pages: [page], combinedText: page.text, fetchErrors: [] };
}

const NOW = new Date("2026-09-22T17:00:00Z");
const dated = extractSignals(site(DATED_SITE_HTML, "https://mikesheating.example.com/"));
const polished = extractSignals(site(POLISHED_SITE_HTML, "https://summitplumbing.example.com/"));

describe("signal helpers", () => {
  it("reads copyright years, ranges and review counts", () => {
    expect(extractCopyrightYear("© 2011 - 2019 Foo")).toBe(2019);
    expect(extractCopyrightYear("Copyright 2015. Also © 2023")).toBe(2023);
    expect(extractCopyrightYear("no year here")).toBeNull();
    expect(extractReviewCount("over 1,200+ five-star reviews")).toBe(1200);
    expect(extractReviewCount("3 reviews")).toBeNull();
  });
});

describe("extractSignals", () => {
  it("captures the weaknesses of a dated site", () => {
    expect(dated.copyrightYear).toBe(2014);
    expect(dated.headlineIsGeneric).toBe(true);
    expect(dated.hasViewportMeta).toBe(false);
    expect(dated.reviewCountClaim).toBe(180);
    expect(dated.reviewsPosition).toBeGreaterThan(0.5);
    expect(dated.maxFormFields).toBeGreaterThanOrEqual(8);
    expect(dated.phoneClickable).toBe(false);
    expect(dated.chatWidget).toBeNull();
    expect(dated.onlineBooking).toBeNull();
  });

  it("detects widgets and trust signals on a polished site", () => {
    expect(polished.chatWidget).toBe("Podium");
    expect(polished.onlineBooking).toBe("Housecall Pro");
    expect(polished.licenseOrInsured).toBe(true);
    expect(polished.ratingClaim).toBe(4.9);
    expect(polished.textOption).toBe(true);
    expect(polished.responseTimePromise).toBe(true);
    expect(polished.phoneNearTop).toBe(true);
  });
});

describe("scoreSignals", () => {
  it("scores the polished site stronger with less follow-up opportunity", () => {
    const a = scoreSignals(dated, NOW);
    const b = scoreSignals(polished, NOW);
    expect(b.brandScore).toBeGreaterThan(a.brandScore);
    expect(b.conversionScore).toBeGreaterThan(a.conversionScore);
    expect(a.followupOpportunityScore).toBeGreaterThan(b.followupOpportunityScore);
    for (const s of [a, b]) for (const v of Object.values(s)) expect(v).toBeGreaterThanOrEqual(0);
  });
});

describe("deriveObservations", () => {
  const obs = deriveObservations(dated, NOW);
  it("produces specific, evidence-backed observations", () => {
    const text = obs.map((o) => o.observation).join(" ");
    expect(text).toContain("180+ reviews");
    expect(text).toContain("© 2014");
    expect(obs.every((o) => o.evidence.length > 0)).toBe(true);
  });
  it("never makes accusatory or statistical claims", () => {
    for (const o of obs) {
      expect(o.observation).not.toMatch(/\d+\s?%|you don't follow up|you lose/i);
    }
  });
  it("deterministic analysis keeps top 3 and includes a follow-up angle", () => {
    const result = analyzeSignalsDeterministic(dated, { companyName: "Mike's Heating", industry: "hvac", city: "Reno", state: "NV" }, NOW);
    expect(result.observations.length).toBe(3);
    expect(result.observations.some((o) => o.type === "followup")).toBe(true);
    expect(result.source).toBe("fallback");
    expect(result.recommendedAngle.length).toBeGreaterThan(10);
  });
});

describe("analyzeWebsite with an LLM", () => {
  it("uses validated LLM output but keeps deterministic scores", async () => {
    const llm = {
      provider: "test",
      model: "test-model",
      complete: async () =>
        JSON.stringify({
          websiteSummary: "Family HVAC company in Reno with a dated site.",
          observations: [{ type: "brand", observation: "Their 180 reviews are buried near the footer.", evidence: "review text low on page", confidence: "high" }],
          recommendedAngle: "Open with the buried reviews.",
        }),
    };
    const { result } = await analyzeWebsite("https://x.example.com", { companyName: "Mike's", industry: "hvac", city: null, state: null }, { llm, site: site(DATED_SITE_HTML, "https://x.example.com/") });
    expect(result.source).toBe("ai");
    expect(result.observations[0].observation).toContain("buried");
    expect(result.brandScore).toBe(scoreSignals(dated).brandScore);
  });

  it("falls back to deterministic analysis on invalid LLM output", async () => {
    const llm = { provider: "test", model: "m", complete: async () => "not json at all" };
    const { result, llmError } = await analyzeWebsite("https://x.example.com", { companyName: "M", industry: null, city: null, state: null }, { llm, site: site(DATED_SITE_HTML, "https://x.example.com/") });
    expect(result.source).toBe("fallback");
    expect(llmError).toBeTruthy();
  });
});

describe("computePriority", () => {
  const base = { targetIndustries: ["hvac", "plumbing"], suppressed: false, websiteReachable: true };
  it("ranks a dated high-value target above a polished one", () => {
    const weak = computePriority({ ...base, email: "mike@mikes.com", industry: "hvac", signals: dated, scores: scoreSignals(dated, NOW) });
    const strong = computePriority({ ...base, email: "owner@summit.com", industry: "plumbing", signals: polished, scores: scoreSignals(polished, NOW) });
    expect(weak.priorityScore).toBeGreaterThan(strong.priorityScore);
    expect(weak.reasons.some((r) => r.factor === "target_industry")).toBe(true);
    expect(weak.priorityScore).toBeLessThanOrEqual(100);
  });
  it("disqualifies missing email, suppression, and parked sites", () => {
    expect(computePriority({ ...base, email: null, industry: "hvac", signals: dated, scores: null }).disqualified).toBe("No email address");
    expect(computePriority({ ...base, suppressed: true, email: "a@b.com", industry: "hvac", signals: dated, scores: null }).priorityScore).toBe(0);
    expect(
      computePriority({ ...base, email: "a@b.com", industry: "hvac", signals: { ...dated, parkedOrPlaceholder: "buy this domain" }, scores: scoreSignals(dated) }).disqualified
    ).toContain("Parked");
  });
  it("penalizes off-target industries and unreachable sites", () => {
    const off = computePriority({ ...base, email: "a@b.com", industry: "crypto", signals: dated, scores: scoreSignals(dated) });
    const on = computePriority({ ...base, email: "a@b.com", industry: "hvac", signals: dated, scores: scoreSignals(dated) });
    expect(on.priorityScore - off.priorityScore).toBeGreaterThanOrEqual(25);
    const dead = computePriority({ ...base, websiteReachable: false, email: "a@b.com", industry: "hvac", signals: null, scores: null });
    expect(dead.reasons.some((r) => r.factor === "no_website")).toBe(true);
  });
});

describe("regressions found on live sites", () => {
  it("keeps words apart across <br> and doesn't treat 'Homeowners…' as generic", () => {
    const html = `<html><body><h1>Homeowners decide<br>in eight seconds.</h1><p>${"Real content about roofing work in Las Vegas. ".repeat(10)}</p></body></html>`;
    const s = extractSignals(site(html, "https://x.example.com/"));
    expect(s.headline).toBe("Homeowners decide in eight seconds.");
    expect(s.headlineIsGeneric).toBe(false);
    expect(extractSignals(site("<h1>Home</h1>", "https://y.example.com/")).headlineIsGeneric).toBe(true);
  });

  it("counts a radio/checkbox group as one form field", () => {
    const html = `<form><input name="name"><input name="email"><input type="radio" name="trade" value="a"><input type="radio" name="trade" value="b"><input type="radio" name="trade" value="c"><input type="checkbox" name="goals" value="1"><input type="checkbox" name="goals" value="2"><button>Send</button><input type="submit" value="Go"></form>`;
    expect(extractPage(html, "https://z.example.com/", "home").forms[0].fieldCount).toBe(4);
  });

  it("a near-empty placeholder page can't outrank an established business", () => {
    const empty = extractSignals(site("<html><head><title>Example Domain</title></head><body><h1>Example Domain</h1><p>This domain is for use in documentation examples.</p></body></html>", "https://example.com/"));
    const base = { targetIndustries: ["hvac"], suppressed: false, websiteReachable: true, industry: "hvac" };
    const placeholder = computePriority({ ...base, email: "pat@example.org", signals: empty, scores: scoreSignals(empty, NOW) });
    const real = computePriority({ ...base, email: "mike@mikes.com", signals: dated, scores: scoreSignals(dated, NOW) });
    expect(real.priorityScore - placeholder.priorityScore).toBeGreaterThanOrEqual(20);
    expect(placeholder.reasons.some((r) => r.factor === "low_legitimacy")).toBe(true);
  });

  it("uses correct possessives", async () => {
    const { possessive } = await import("@/lib/outbound/personalization/text");
    expect(possessive("Green Star Solutions")).toBe("Green Star Solutions'");
    expect(possessive("Mike's Heating")).toBe("Mike's Heating's");
  });
});

describe("hidden forms and honeypots", () => {
  it("ignores hidden detection forms and honeypot fields", () => {
    const html = `<body>
      <form hidden name="strategy-call">${Array.from({ length: 12 }, (_, i) => `<input name="f${i}">`).join("")}</form>
      <div style="display: none"><form>${Array.from({ length: 9 }, (_, i) => `<input name="g${i}">`).join("")}</form></div>
      <form><input name="bot-field"><input name="name"><input name="email"><textarea name="msg"></textarea></form>
    </body>`;
    const page = extractPage(html, "https://h.example.com/", "home");
    expect(page.forms).toHaveLength(1);
    expect(page.forms[0].fieldCount).toBe(3);
  });
});

describe("script-built forms", () => {
  it("treats visible inputs outside a <form> as a form", () => {
    const html = `<div class="form"><input name="business"><input name="trade"><button type="button">Continue</button></div>`;
    const page = extractPage(html, "https://j.example.com/", "home");
    expect(page.forms).toHaveLength(1);
    expect(page.forms[0].fieldCount).toBe(2);
  });
});
