import type { Plan } from "@/lib/db/schema";

export interface PlanDefinition {
  id: Plan;
  name: string;
  priceMonthly: number;
  scanFrequency: "one_time" | "monthly" | "weekly";
  maxBusinesses: number;
  features: string[];
  /** Env var holding the Stripe price id. */
  stripePriceEnv: string | null;
  competitorComparison: boolean;
  pdfExport: boolean;
  scoreHistory: boolean;
  priorityAlerts: boolean;
}

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free Scan",
    priceMonthly: 0,
    scanFrequency: "one_time",
    maxBusinesses: 1,
    stripePriceEnv: null,
    competitorComparison: false,
    pdfExport: false,
    scoreHistory: false,
    priorityAlerts: false,
    features: [
      "1 full website scan",
      "Revenue Leak Score + 5 category scores",
      "Top revenue leaks in plain English",
      "Shareable report link",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 19,
    scanFrequency: "monthly",
    maxBusinesses: 1,
    stripePriceEnv: "STRIPE_PRICE_STARTER",
    competitorComparison: false,
    pdfExport: false,
    scoreHistory: true,
    priorityAlerts: false,
    features: [
      "Monthly re-scans",
      "Score history and trends",
      "Email report delivery",
      "Full fix roadmap",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceMonthly: 49,
    scanFrequency: "weekly",
    maxBusinesses: 1,
    stripePriceEnv: "STRIPE_PRICE_GROWTH",
    competitorComparison: true,
    pdfExport: true,
    scoreHistory: true,
    priorityAlerts: false,
    features: [
      "Weekly re-scans",
      "Competitor comparison (up to 3)",
      "AI visibility deep-dive",
      "Improvement checklist",
      "PDF export",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 99,
    scanFrequency: "weekly",
    maxBusinesses: 5,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    competitorComparison: true,
    pdfExport: true,
    scoreHistory: true,
    priorityAlerts: true,
    features: [
      "Up to 5 businesses or locations",
      "Weekly re-scans on every site",
      "Deeper competitor tracking",
      "Priority alerts on score drops",
      "Monthly strategy call with Greenstar",
    ],
  },
};

export const PLAN_ORDER: Plan[] = ["free", "starter", "growth", "pro"];

/** Max user-triggered scans per business per rolling 30 days. */
export function scanLimitFor(plan: Plan): number {
  switch (plan) {
    case "free":
      return 1;
    case "starter":
      return 2; // monthly cadence with one manual retry
    case "growth":
    case "pro":
      return 8; // weekly cadence with headroom
  }
}
