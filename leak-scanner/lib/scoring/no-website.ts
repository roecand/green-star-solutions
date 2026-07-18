import type { Finding, ScoringResult } from "@/lib/scanner/types";
import type { RecommendationDraft } from "./recommendations";
import type { AIReport } from "@/lib/ai/report-schema";

/**
 * Scoring + report path for businesses WITHOUT a website.
 *
 * Principles:
 * - Honest score: with no public web presence there is nothing observable, so
 *   every category scores 0 and the missing website is THE critical leak.
 * - Empowering tone: the copy frames this as the single biggest (and most
 *   fixable) growth opportunity — never as shaming.
 * - Curated recommendations only: the 40+ website-specific checks would be
 *   nonsense here, so we generate a focused set that maps to Green Star's
 *   core services.
 */

export function buildNoWebsiteScoring(): ScoringResult {
  const findings: Finding[] = [
    {
      id: "no_website",
      category: "conversion",
      label: "Public website",
      detected: false,
      weight: 100,
      evidence: null,
    },
    {
      id: "no_local_web_presence",
      category: "local",
      label: "Findable web presence for local searches",
      detected: false,
      weight: 100,
      evidence: null,
    },
    {
      id: "no_ai_visibility_surface",
      category: "ai_visibility",
      label: "Public content AI/search systems can read",
      detected: false,
      weight: 100,
      evidence: null,
    },
    {
      id: "no_trust_surface",
      category: "trust",
      label: "Public proof a skeptical buyer can check",
      detected: false,
      weight: 100,
      evidence: null,
    },
    {
      id: "no_online_capture",
      category: "follow_up",
      label: "24/7 online lead capture",
      detected: false,
      weight: 100,
      evidence: null,
    },
  ];
  return {
    findings,
    websiteConversionScore: 0,
    localVisibilityScore: 0,
    aiVisibilityScore: 0,
    trustProofScore: 0,
    followUpReadinessScore: 0,
    revenueLeakScore: 0,
  };
}

export function buildNoWebsiteRecommendations(): RecommendationDraft[] {
  return [
    {
      ruleId: "no_website",
      category: "conversion",
      severity: "critical",
      title: "You don't have a website yet",
      explanation:
        "Right now, people searching for what you do can't find you, compare you, or contact you online. This is the single most fixable thing we found — and fixing it unlocks every other improvement in this report.",
      recommendedFix:
        "Launch a simple, conversion-focused site: what you do, where you work, proof, and one clear way to contact you.",
      greenstarService: "website_conversion_rebuild",
      priority: "this_week",
    },
    {
      ruleId: "no_local_web_presence",
      category: "local",
      severity: "critical",
      title: "Invisible in local searches",
      explanation:
        "When someone nearby searches for your service, businesses with a web presence fill the results. Without one, that demand flows to competitors by default — you never even see the customers you're losing.",
      recommendedFix:
        "Pair a basic site with a claimed local business profile so you show up where neighbors are already searching.",
      greenstarService: "local_seo_foundation",
      priority: "this_week",
    },
    {
      ruleId: "no_trust_surface",
      severity: "high",
      category: "trust",
      title: "No public proof for skeptical buyers",
      explanation:
        "Great work builds reputation — but without a public home for reviews, photos, and credentials, every new customer has to take your word for it. Word of mouth stops at the first person who wants to verify you online.",
      recommendedFix:
        "Give your proof a home: real reviews, job photos, and credentials on a page you control.",
      greenstarService: "review_reputation_system",
      priority: "this_month",
    },
    {
      ruleId: "no_online_capture",
      severity: "high",
      category: "follow_up",
      title: "No way to capture after-hours demand",
      explanation:
        "A meaningful share of buying decisions happen at night and on weekends. With no online form or booking path, interested people have no way to reach you until business hours — and by then many have moved on.",
      recommendedFix:
        "Add a simple quote/booking path that works 24/7, so interest becomes a captured lead instead of a missed one.",
      greenstarService: "booking_quote_funnel",
      priority: "this_month",
    },
    {
      ruleId: "no_ai_visibility_surface",
      severity: "medium",
      category: "ai_visibility",
      title: "AI and answer engines can't recommend you",
      explanation:
        "Based on public signals, AI/search-answer systems have nothing to read about your business — so when people ask them for recommendations, you can't be part of the answer.",
      recommendedFix:
        "Publish clear public content about your services, area, and proof so answer engines have something to work with.",
      greenstarService: "ai_visibility_upgrade",
      priority: "later",
    },
  ];
}

export function buildNoWebsiteReport(business: {
  businessName: string;
  industry: string;
  city?: string | null;
  state?: string | null;
}): AIReport {
  const place = [business.city, business.state].filter(Boolean).join(", ");
  const recs = buildNoWebsiteRecommendations();

  return {
    executive_summary:
      `${business.businessName} doesn't have a website yet, so there are no public signals for us to score — ` +
      `your Revenue Leak Score is 0/100 by definition, not by judgment. Here's the good news: this is the most ` +
      `fixable situation we ever see. Every point of that score is sitting on the table waiting to be claimed, ` +
      `and businesses in exactly this position typically see the fastest, most visible gains from getting online properly.`,
    score_verdict:
      "You're invisible online right now — which makes this the biggest, most fixable growth opportunity on the table.",
    category_summaries: [
      {
        category: "conversion",
        summary:
          "There's no website to convert visitors into calls or bookings — so today, online demand has nowhere to land. A simple, focused site changes this immediately.",
        top_issue: "No website for ready-to-buy visitors to act on.",
        suggested_fix: "Launch a conversion-focused one-page site with one clear way to contact you.",
      },
      {
        category: "local",
        summary: place
          ? `People in ${place} searching for ${business.industry.toLowerCase()} services can't find you — the businesses that do appear absorb that demand by default.`
          : "People searching locally for your services can't find you — the businesses that do appear absorb that demand by default.",
        top_issue: "Invisible in local search results.",
        suggested_fix: "Establish a findable local web presence (site + claimed business profile).",
      },
      {
        category: "ai_visibility",
        summary:
          "AI and search-answer systems recommend businesses they can read about. With no public content, you can't be part of their answers yet.",
        top_issue: "Nothing public for answer engines to read.",
        suggested_fix: "Publish clear service, area, and proof content on your own domain.",
      },
      {
        category: "trust",
        summary:
          "Your reputation likely lives in word of mouth — powerful, but invisible to a stranger trying to verify you online before calling.",
        top_issue: "No public home for reviews, photos, or credentials.",
        suggested_fix: "Give your proof a page you control: reviews, job photos, credentials.",
      },
      {
        category: "follow_up",
        summary:
          "With no online form or booking path, after-hours and browse-first customers have no way to leave their info — that interest evaporates instead of becoming a lead.",
        top_issue: "No 24/7 way to capture interested customers.",
        suggested_fix: "Add a simple always-on quote or booking path.",
      },
    ],
    top_revenue_leaks: recs.map((r) => ({
      title: r.title,
      explanation: r.explanation,
      severity: r.severity,
    })),
    priority_roadmap: {
      this_week: [
        "Get a simple, professional one-page website live: what you do, where you work, and one clear contact action.",
        "Claim your local business profile so you start appearing where neighbors already search.",
      ],
      this_month: [
        "Collect your first wave of public reviews and put them on your new site.",
        "Add a 24/7 quote or booking path so after-hours interest becomes captured leads.",
      ],
      later: [
        "Build out service and area pages so search and AI systems can understand and recommend you.",
        "Add photos, credentials, and proof content to deepen trust with skeptical buyers.",
      ],
    },
    greenstar_service_matches: [
      {
        service_id: "website_conversion_rebuild",
        service_name: "Website Conversion Rebuild",
        reason:
          "The foundational fix: a conversion-focused website gives every other improvement a place to live — and makes you findable, checkable, and contactable for the first time.",
      },
      {
        service_id: "local_seo_foundation",
        service_name: "Local SEO Foundation",
        reason: "Puts your new presence in front of the local searches already happening in your area.",
      },
      {
        service_id: "review_reputation_system",
        service_name: "Review & Reputation System",
        reason: "Turns your word-of-mouth reputation into public proof that closes skeptical buyers.",
      },
    ],
    email_subject: `${business.businessName}: your Revenue Leak Report (big opportunity inside)`,
    report_intro:
      "This report looks at your business the way a ready-to-buy customer would: can they find you, trust you, and take action fast? Because you don't have a website yet, the findings below focus on what that's costing you — and exactly what claiming this opportunity looks like.",
    report_conclusion:
      "None of this requires being a tech person — it requires deciding to be visible. Businesses that start from zero see the clearest before-and-after of anyone we work with. The roadmap above is the order we'd do it in; the fastest path is to have Green Star build it with you.",
  };
}
