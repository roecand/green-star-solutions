import type { FindingCategory } from "@/lib/scanner/types";
import { CATEGORY_LABELS, CATEGORY_SCORE_KEYS, verdictForScore } from "@/lib/scoring/engine";
import { serviceName } from "@/lib/services/catalog";
import type { AIReport, CategorySummary } from "./report-schema";
import type { ReportInput } from "./provider";

const CATEGORIES: FindingCategory[] = [
  "conversion",
  "local",
  "ai_visibility",
  "trust",
  "follow_up",
];

const CATEGORY_HEALTHY_COPY: Record<FindingCategory, string> = {
  conversion:
    "Your website gives visitors clear ways to take action. Keep your main call-to-action prominent as you make changes.",
  local:
    "Your site clearly signals where you operate, which helps local customers and local search confirm you serve their area.",
  ai_visibility:
    "Based on your website's visible content, AI and search-answer systems have solid material to understand what you do.",
  trust:
    "Your site shows meaningful proof — a skeptical visitor can find reasons to trust you.",
  follow_up:
    "You give visitors ways to leave their information and take the next step, which protects the leads you're already earning.",
};

const CATEGORY_WEAK_COPY: Record<FindingCategory, string> = {
  conversion:
    "Visitors who are ready to act don't have an obvious, easy next step. This is usually the fastest leak to fix.",
  local:
    "The pages we scanned don't clearly signal where you operate, so local customers and local search have to guess.",
  ai_visibility:
    "Based on your website's visible content, AI and search-answer systems may struggle to understand and recommend your business.",
  trust:
    "A skeptical first-time visitor doesn't find much proof that others chose you and were happy.",
  follow_up:
    "There's little evidence of a system for capturing and following up with interested visitors, so leads likely slip away silently.",
};

/**
 * Deterministic report copy assembled from findings — used when no AI key is
 * configured or AI output fails validation twice. Every sentence is grounded
 * in detected/not-detected findings.
 */
export function buildFallbackReport(input: ReportInput): AIReport {
  const { business, scores, findings, recommendations } = input;

  const categorySummaries: CategorySummary[] = CATEGORIES.map((category) => {
    const score = scores[CATEGORY_SCORE_KEYS[category]];
    const missed = recommendations.filter((r) => r.category === category);
    const top = missed[0];
    return {
      category,
      summary: `${CATEGORY_LABELS[category]} scored ${score}/100. ${
        score >= 70 ? CATEGORY_HEALTHY_COPY[category] : CATEGORY_WEAK_COPY[category]
      }`,
      top_issue: top ? top.title : `No major ${CATEGORY_LABELS[category].toLowerCase()} issues detected.`,
      suggested_fix: top
        ? top.recommendedFix
        : "Keep this area strong and re-scan after major site changes.",
    };
  });

  const topLeaks = recommendations.slice(0, 7).map((r) => ({
    title: r.title,
    explanation: r.explanation,
    severity: r.severity,
  }));

  const roadmap = {
    this_week: recommendations
      .filter((r) => r.priority === "this_week")
      .slice(0, 6)
      .map((r) => `${r.title}: ${r.recommendedFix}`),
    this_month: recommendations
      .filter((r) => r.priority === "this_month")
      .slice(0, 6)
      .map((r) => `${r.title}: ${r.recommendedFix}`),
    later: recommendations
      .filter((r) => r.priority === "later")
      .slice(0, 8)
      .map((r) => `${r.title}: ${r.recommendedFix}`),
  };

  // Rank services by how many recommendations point at them.
  const serviceCounts = new Map<string, { count: number; reasons: string[] }>();
  for (const rec of recommendations) {
    const entry = serviceCounts.get(rec.greenstarService) ?? { count: 0, reasons: [] };
    entry.count += 1;
    if (entry.reasons.length < 2) entry.reasons.push(rec.title.toLowerCase());
    serviceCounts.set(rec.greenstarService, entry);
  }
  const serviceMatches = [...serviceCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, { count, reasons }]) => ({
      service_id: id,
      service_name: serviceName(id),
      reason: `Addresses ${count} issue${count === 1 ? "" : "s"} found in this scan, including: ${reasons.join("; ")}.`,
    }));
  if (serviceMatches.length === 0) {
    serviceMatches.push({
      service_id: "crm_follow_up_automation",
      service_name: serviceName("crm_follow_up_automation"),
      reason:
        "Your site scored well; ongoing monitoring plus follow-up automation protects the leads you're already generating.",
    });
  }

  const detectedCount = findings.filter((f) => f.detected).length;
  const issueCount = recommendations.length;
  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;
  const place = [business.city, business.state].filter(Boolean).join(", ");

  const executiveSummary =
    `We scanned ${business.websiteUrl} across ${findings.length} revenue-leak checks. ` +
    `${detectedCount} signals were detected and ${issueCount} improvement opportunities were found` +
    `${criticalCount > 0 ? `, including ${criticalCount} critical issue${criticalCount === 1 ? "" : "s"} that likely cost you leads every week` : ""}. ` +
    `Your Revenue Leak Score is ${scores.revenueLeakScore}/100. ${verdictForScore(scores.revenueLeakScore)}`;

  return {
    executive_summary: executiveSummary,
    score_verdict: verdictForScore(scores.revenueLeakScore),
    category_summaries: categorySummaries,
    top_revenue_leaks:
      topLeaks.length > 0
        ? topLeaks
        : [
            {
              title: "No major leaks detected",
              explanation:
                "Your site passed all of our checks. Re-scan after site changes to make sure it stays that way.",
              severity: "low" as const,
            },
          ],
    priority_roadmap: roadmap,
    greenstar_service_matches: serviceMatches,
    email_subject: `${business.businessName}: your Revenue Leak Score is ${scores.revenueLeakScore}/100`,
    report_intro:
      `This report looks at ${business.businessName}${place ? ` in ${place}` : ""} the way a ready-to-buy customer would: ` +
      `can they understand you, trust you, and take action fast? Everything below is based on what we could detect on your website's public pages — ` +
      `where something wasn't detected, we say so rather than guess.`,
    report_conclusion:
      issueCount > 0
        ? `The good news: none of this requires more traffic. Fixing the ${Math.min(issueCount, 3)} biggest leaks above turns visitors you already have into calls and bookings. ` +
          `Start with the "fix this week" items, and re-scan to watch your score move.`
        : `Your foundation is strong. The next win is consistency: keep collecting reviews, keep content fresh, and monitor for regressions with scheduled re-scans.`,
  };
}
