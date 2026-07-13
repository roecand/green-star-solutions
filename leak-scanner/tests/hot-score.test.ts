import { describe, expect, it } from "vitest";
import { computeHotScore, HOT_LEAD_THRESHOLD } from "@/lib/leads/hot-score";

const base = {
  revenueLeakScore: 80 as number | null,
  emailProvided: false,
  clickedCta: false,
  requestedHelp: false,
  viewedReport: false,
  industry: "Consulting",
  websiteReachable: true,
  recommendations: [] as Array<{ severity: "critical" | "high" | "medium" | "low" }>,
};

describe("computeHotScore", () => {
  it("scores a cold lead below the hot threshold", () => {
    expect(computeHotScore(base)).toBeLessThan(HOT_LEAD_THRESHOLD);
  });

  it("low leak score + email + help request is hot", () => {
    const score = computeHotScore({
      ...base,
      revenueLeakScore: 42,
      emailProvided: true,
      requestedHelp: true,
    });
    expect(score).toBeGreaterThanOrEqual(HOT_LEAD_THRESHOLD);
  });

  it("high-value industry and severe recommendations add heat", () => {
    const withoutBoosts = computeHotScore({ ...base, revenueLeakScore: 50, emailProvided: true });
    const withBoosts = computeHotScore({
      ...base,
      revenueLeakScore: 50,
      emailProvided: true,
      industry: "HVAC",
      recommendations: [
        { severity: "critical" },
        { severity: "high" },
        { severity: "high" },
      ],
    });
    expect(withBoosts).toBeGreaterThan(withoutBoosts);
  });

  it("caps at 100", () => {
    const score = computeHotScore({
      revenueLeakScore: 10,
      emailProvided: true,
      clickedCta: true,
      requestedHelp: true,
      viewedReport: true,
      industry: "Roofing",
      websiteReachable: true,
      recommendations: Array(6).fill({ severity: "critical" }),
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});
