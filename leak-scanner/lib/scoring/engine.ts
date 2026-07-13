import type {
  ExtractedSite,
  Finding,
  FindingCategory,
  ScanContext,
  ScoringResult,
} from "@/lib/scanner/types";
import { allRules } from "./rules";

/**
 * Weights for combining category scores into the Revenue Leak Score.
 * Conversion matters most: it is closest to lost calls/bookings.
 */
export const CATEGORY_WEIGHTS: Record<FindingCategory, number> = {
  conversion: 0.25,
  local: 0.2,
  ai_visibility: 0.2,
  trust: 0.2,
  follow_up: 0.15,
};

export function runScoringEngine(site: ExtractedSite, ctx: ScanContext): ScoringResult {
  const findings: Finding[] = allRules.map((rule) => {
    let detected = false;
    let evidence: string | null = null;
    try {
      const result = rule.detect(site, ctx);
      detected = result.detected;
      evidence = result.evidence;
    } catch (error) {
      // A single broken rule must never sink a scan; treat as not detected.
      console.error(`scoring rule ${rule.id} threw`, error);
    }
    return {
      id: rule.id,
      category: rule.category,
      label: rule.label,
      detected,
      weight: rule.weight,
      evidence,
    };
  });

  const categoryScore = (category: FindingCategory): number => {
    const rules = findings.filter((f) => f.category === category);
    const total = rules.reduce((sum, f) => sum + f.weight, 0);
    const earned = rules.reduce((sum, f) => sum + (f.detected ? f.weight : 0), 0);
    if (total === 0) return 0;
    return Math.min(100, Math.round((earned / total) * 100));
  };

  const websiteConversionScore = categoryScore("conversion");
  const localVisibilityScore = categoryScore("local");
  const aiVisibilityScore = categoryScore("ai_visibility");
  const trustProofScore = categoryScore("trust");
  const followUpReadinessScore = categoryScore("follow_up");

  const revenueLeakScore = Math.round(
    websiteConversionScore * CATEGORY_WEIGHTS.conversion +
      localVisibilityScore * CATEGORY_WEIGHTS.local +
      aiVisibilityScore * CATEGORY_WEIGHTS.ai_visibility +
      trustProofScore * CATEGORY_WEIGHTS.trust +
      followUpReadinessScore * CATEGORY_WEIGHTS.follow_up
  );

  return {
    findings,
    websiteConversionScore,
    localVisibilityScore,
    aiVisibilityScore,
    trustProofScore,
    followUpReadinessScore,
    revenueLeakScore,
  };
}

export function verdictForScore(score: number): string {
  if (score >= 80) return "Strong foundation. A few leaks may still be costing you easy wins.";
  if (score >= 60) return "Good business, but several conversion leaks are likely reducing calls and bookings.";
  if (score >= 40) return "Your online presence is probably leaking meaningful revenue.";
  return "Your website and follow-up system may be making it harder for customers to choose you.";
}

export const CATEGORY_LABELS: Record<FindingCategory, string> = {
  conversion: "Website Conversion",
  local: "Local Visibility",
  ai_visibility: "AI Visibility",
  trust: "Trust & Proof",
  follow_up: "Follow-Up Readiness",
};

export const CATEGORY_SCORE_KEYS: Record<
  FindingCategory,
  keyof Omit<ScoringResult, "findings" | "revenueLeakScore">
> = {
  conversion: "websiteConversionScore",
  local: "localVisibilityScore",
  ai_visibility: "aiVisibilityScore",
  trust: "trustProofScore",
  follow_up: "followUpReadinessScore",
};
