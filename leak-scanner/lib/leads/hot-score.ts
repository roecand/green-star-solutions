import type { RecommendationDraft } from "@/lib/scoring/recommendations";

const HIGH_VALUE_INDUSTRIES = [
  "hvac",
  "roofing",
  "plumbing",
  "med spa",
  "medspa",
  "dental",
  "dentist",
  "law",
  "attorney",
  "legal",
  "auto repair",
  "landscaping",
  "remodeling",
  "electrical",
  "pest control",
  "solar",
];

/**
 * Hot-lead score (0–100). Deterministic, recomputed whenever lead signals
 * change. A lead is "hot" at >= 50.
 */
export function computeHotScore(input: {
  revenueLeakScore: number | null;
  emailProvided: boolean;
  clickedCta: boolean;
  requestedHelp: boolean;
  viewedReport: boolean;
  industry: string;
  websiteReachable: boolean;
  recommendations: Pick<RecommendationDraft, "severity">[];
}): number {
  let score = 0;
  if (input.revenueLeakScore !== null && input.revenueLeakScore < 65) score += 25;
  if (input.emailProvided) score += 15;
  if (input.clickedCta) score += 10;
  if (input.viewedReport) score += 5;
  if (input.requestedHelp) score += 25;
  const industry = input.industry.toLowerCase();
  if (HIGH_VALUE_INDUSTRIES.some((h) => industry.includes(h))) score += 10;
  if (input.websiteReachable) score += 5;
  const severeCount = input.recommendations.filter(
    (r) => r.severity === "critical" || r.severity === "high"
  ).length;
  if (severeCount >= 3) score += 5;
  return Math.min(100, score);
}

export const HOT_LEAD_THRESHOLD = 50;
