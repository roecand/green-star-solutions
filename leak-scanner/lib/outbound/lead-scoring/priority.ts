import type { WebsiteSignals } from "../website-analysis/signals";
import type { AnalysisScores } from "../website-analysis/signals";

export interface PriorityReason {
  factor: string;
  points: number;
  detail: string;
}

export interface PriorityResult {
  priorityScore: number;
  reasons: PriorityReason[];
  /** Hard stop regardless of score (no email, parked site, suppressed…). */
  disqualified: string | null;
}

export interface PriorityInput {
  email: string | null;
  industry: string | null;
  targetIndustries: string[];
  websiteReachable: boolean;
  signals: WebsiteSignals | null;
  scores: AnalysisScores | null;
  suppressed: boolean;
}

/** Ticket-size tiers: bigger jobs → more budget for brand + automation. */
const HIGH_VALUE = /hvac|heating|air condition|roof|solar|remodel|restoration|foundation|med ?spa|aesthetic|dental|dentist|orthodont|implant|pool|plumb|electric|garage door|window|siding|kitchen|bath/;
const MID_VALUE = /landscap|pest|tree|fenc|paint|concrete|pav|flooring|cleaning|chiropract|vet|law|attorney|auto/;

const ROLE_INBOX = /^(info|office|contact|admin|hello|sales|service|support|team|mail|inquiries|frontdesk)@/;

export function computePriority(input: PriorityInput): PriorityResult {
  const reasons: PriorityReason[] = [];
  const add = (factor: string, points: number, detail: string) => reasons.push({ factor, points, detail });

  if (input.suppressed) return result(reasons, "On the suppression list");
  if (!input.email) return result(reasons, "No email address");
  if (input.signals?.parkedOrPlaceholder) {
    return result(reasons, `Parked/placeholder site ("${input.signals.parkedOrPlaceholder}")`);
  }

  // Baseline: a reachable business with an email.
  add("baseline", 20, "Has an email address");

  const industry = (input.industry ?? "").toLowerCase();
  const isTarget = !!industry && input.targetIndustries.some((t) => industry.includes(t) || t.includes(industry));
  if (isTarget) add("target_industry", 15, `"${input.industry}" is a Greenstar target industry`);
  else if (!industry) add("unknown_industry", 0, "Industry not provided");
  else add("off_target_industry", -10, `"${input.industry}" is outside target industries`);

  if (HIGH_VALUE.test(industry)) add("ticket_size", 10, "Higher-value service category");
  else if (MID_VALUE.test(industry)) add("ticket_size", 5, "Mid-value service category");

  if (ROLE_INBOX.test(input.email)) add("role_inbox", -5, "Generic inbox (info@/office@) — lower reply odds");
  else add("named_inbox", 5, "Named inbox");

  if (!input.websiteReachable || !input.signals || !input.scores) {
    add("no_website", -15, "Website missing or unreachable — can't personalize on it");
    return result(reasons, null);
  }
  add("active_website", 10, "Website reachable");

  const s = input.signals;
  // Real customer volume → can afford + benefits from fixes.
  if (s.reviewCountClaim && s.reviewCountClaim >= 50) add("social_proof", 12, `Claims ${s.reviewCountClaim}+ reviews`);
  else if (s.reviewCountClaim || s.reviewWidget || s.ratingClaim) add("social_proof", 7, "Shows review volume/rating");
  else if (s.reviewsMentioned) add("social_proof", 3, "Mentions reviews");
  if (s.yearsInBusinessClaim) add("established", 5, `Established ("${s.yearsInBusinessClaim}")`);
  if (s.wordCount < 150) add("thin_site", -20, "Very little content — may be inactive or a placeholder");

  // Visible weaknesses = something concrete to talk about — but only worth
  // much when the business looks real. Weakness points scale with legitimacy
  // so a near-empty page can't outrank an established business.
  const legitimacy = legitimacyRatio(s);
  if (legitimacy < 0.4) add("low_legitimacy", 0, `Few signs of an operating business (${Math.round(legitimacy * 100)}% of checks)`);
  const scale = 0.25 + 0.75 * legitimacy;
  const { brandScore, conversionScore, followupOpportunityScore } = input.scores;
  const brandGap = Math.round(((100 - brandScore) / 100) * 15 * scale);
  const conversionGap = Math.round(((100 - conversionScore) / 100) * 15 * scale);
  const followupGap = Math.round((followupOpportunityScore / 100) * 13 * scale);
  if (brandGap) add("brand_opportunity", brandGap, `Brand score ${brandScore}/100`);
  if (conversionGap) add("conversion_opportunity", conversionGap, `Conversion score ${conversionScore}/100`);
  if (followupGap) add("followup_opportunity", followupGap, `Follow-up opportunity ${followupOpportunityScore}/100`);

  if (brandScore >= 85 && conversionScore >= 85 && followupOpportunityScore < 30) {
    add("already_sophisticated", -25, "Already strong branding + automation");
  }

  return result(reasons, null);
}

/** Share of "this is a real, operating local business" checks that pass. */
export function legitimacyRatio(s: WebsiteSignals): number {
  const checks = [
    !!s.phoneOnHomepage,
    s.servicesClear,
    s.reviewsMentioned || !!s.reviewWidget || s.reviewCountClaim !== null,
    !!s.yearsInBusinessClaim || s.licenseOrInsured,
    s.wordCount >= 300,
    s.socialLinkCount > 0,
    s.formCount > 0 || s.contactPage || !!s.onlineBooking,
  ];
  return checks.filter(Boolean).length / checks.length;
}

function result(reasons: PriorityReason[], disqualified: string | null): PriorityResult {
  if (disqualified) {
    return { priorityScore: 0, reasons: [...reasons, { factor: "disqualified", points: 0, detail: disqualified }], disqualified };
  }
  const total = reasons.reduce((sum, r) => sum + r.points, 0);
  return { priorityScore: Math.max(0, Math.min(100, total)), reasons, disqualified: null };
}
