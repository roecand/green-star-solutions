import type { Finding, FindingCategory } from "@/lib/scanner/types";

export type Severity = "critical" | "high" | "medium" | "low";
export type Priority = "this_week" | "this_month" | "later";

export interface RecommendationDraft {
  ruleId: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  explanation: string;
  recommendedFix: string;
  greenstarService: string;
  priority: Priority;
}

interface RecTemplate {
  severity: Severity;
  title: string;
  explanation: string;
  recommendedFix: string;
  greenstarService: string;
}

/**
 * Plain-English recommendation copy for each rule that fails. All statements
 * are grounded in what the scanner did or did not detect — no invented facts.
 */
const REC_TEMPLATES: Record<string, RecTemplate> = {
  conv_phone_visible: {
    severity: "critical",
    title: "No visible phone number",
    explanation:
      "We couldn't detect a phone number on your homepage. Ready-to-buy visitors who want to call have no obvious way to do it, which can send them straight to a competitor.",
    recommendedFix:
      "Put a clickable phone number in the header of every page, especially on mobile.",
    greenstarService: "website_conversion_rebuild",
  },
  conv_primary_cta: {
    severity: "critical",
    title: "No clear call-to-action in the hero area",
    explanation:
      "Your main headline area doesn't appear to tell visitors what to do next (call, book, get a quote). Visitors who have to hunt for the next step often leave without taking it.",
    recommendedFix:
      "Add one obvious primary button above the fold — 'Call Now' or 'Get a Free Quote'.",
    greenstarService: "website_conversion_rebuild",
  },
  conv_contact_form: {
    severity: "high",
    title: "No contact or booking form detected",
    explanation:
      "Visitors who don't want to call — often the majority after hours — have no way to leave their information.",
    recommendedFix: "Add a short (3–4 field) quote or contact form on the homepage and contact page.",
    greenstarService: "booking_quote_funnel",
  },
  conv_services_listed: {
    severity: "high",
    title: "Services aren't clearly listed",
    explanation:
      "We couldn't find a clear list of what you offer. Visitors (and AI/search systems) that can't quickly confirm you do what they need will move on.",
    recommendedFix: "Add a services section with one short, specific block per service.",
    greenstarService: "local_seo_foundation",
  },
  conv_mobile_viewport: {
    severity: "high",
    title: "Site may not be mobile-friendly",
    explanation:
      "Your site doesn't declare a mobile viewport, which usually means it renders as a shrunken desktop page on phones — where most local searches happen.",
    recommendedFix: "Rebuild on a responsive layout with thumb-friendly buttons and click-to-call.",
    greenstarService: "website_conversion_rebuild",
  },
  conv_social_proof: {
    severity: "high",
    title: "No reviews or testimonials on the site",
    explanation:
      "We didn't detect testimonial or review content. Skeptical visitors look for proof before contacting anyone.",
    recommendedFix: "Add 3–5 real customer reviews to the homepage, with names and specifics.",
    greenstarService: "review_reputation_system",
  },
  conv_contact_page: {
    severity: "medium",
    title: "No contact page detected",
    explanation:
      "A dedicated contact page is one of the most-visited pages for buyers who are ready to act — we couldn't find one.",
    recommendedFix: "Add a contact page with phone, form, hours, and service area.",
    greenstarService: "website_conversion_rebuild",
  },
  conv_offer_language: {
    severity: "medium",
    title: "No clear offer or differentiator",
    explanation:
      "We didn't detect offer language like free estimates, guarantees, or financing. Without a reason to choose you, visitors compare on price alone.",
    recommendedFix: "Lead with one concrete offer (e.g., 'Free same-day estimates').",
    greenstarService: "website_conversion_rebuild",
  },
  conv_low_friction_cta: {
    severity: "medium",
    title: "Next step takes too much effort",
    explanation:
      "We didn't find a low-friction action like a one-tap call button, booking link, or short form.",
    recommendedFix: "Give visitors a next step that takes under 30 seconds.",
    greenstarService: "booking_quote_funnel",
  },
  conv_meta_basics: {
    severity: "low",
    title: "Missing page title or description",
    explanation:
      "Your homepage is missing basic metadata, which weakens how your business appears in search results and previews.",
    recommendedFix: "Write a title and description that name your service and city.",
    greenstarService: "local_seo_foundation",
  },
  local_city_state: {
    severity: "critical",
    title: "Your city isn't mentioned on your website",
    explanation:
      "We couldn't find your city on the pages we scanned. Search and AI systems have little evidence you serve your area.",
    recommendedFix: "Mention your city and service area in the headline, footer, and service pages.",
    greenstarService: "local_seo_foundation",
  },
  local_service_area: {
    severity: "high",
    title: "No service area described",
    explanation:
      "Visitors outside your immediate neighborhood can't tell whether you'll come to them.",
    recommendedFix: "Add a 'Proudly serving…' section listing the areas you cover.",
    greenstarService: "local_seo_foundation",
  },
  local_nap: {
    severity: "high",
    title: "Name, address, and phone info incomplete",
    explanation:
      "We couldn't detect a consistent business address and phone on your site. Consistent NAP info is a core local trust signal.",
    recommendedFix: "Add your full business name, address (or service area), and phone to the footer.",
    greenstarService: "local_seo_foundation",
  },
  local_location_page: {
    severity: "medium",
    title: "No location or service-area page",
    explanation:
      "A dedicated page for your location/service area helps both customers and search systems confirm where you work.",
    recommendedFix: "Create a service-area page for your main city (plus one per major suburb later).",
    greenstarService: "local_seo_foundation",
  },
  local_reviews: {
    severity: "medium",
    title: "No local reviews referenced",
    explanation: "Review content on your own site reinforces local credibility — we didn't detect any.",
    recommendedFix: "Feature recent Google reviews on the homepage with the reviewer's neighborhood.",
    greenstarService: "review_reputation_system",
  },
  local_schema: {
    severity: "medium",
    title: "No LocalBusiness structured data",
    explanation:
      "Schema markup is machine-readable proof of who you are, where you are, and what you do. We didn't detect any.",
    recommendedFix: "Add LocalBusiness JSON-LD with name, address, phone, hours, and service area.",
    greenstarService: "local_seo_foundation",
  },
  local_service_city_pairing: {
    severity: "medium",
    title: "Service and city never appear together",
    explanation:
      "Phrases like 'HVAC repair in Las Vegas' are how customers search — your site doesn't appear to pair your service with your city.",
    recommendedFix: "Work service-plus-city phrasing into headlines and page titles.",
    greenstarService: "local_seo_foundation",
  },
  local_clear_category: {
    severity: "high",
    title: "Business category isn't obvious",
    explanation:
      "Your title and main headline don't clearly say what kind of business this is. Visitors decide in seconds; ambiguity loses them.",
    recommendedFix: "Make your H1 say exactly what you do and where.",
    greenstarService: "website_conversion_rebuild",
  },
  local_map_contact: {
    severity: "low",
    title: "No map or directions signal",
    explanation: "We didn't detect a map, directions link, or 'find us' content.",
    recommendedFix: "Embed a Google Map or add a 'Get Directions' link on the contact page.",
    greenstarService: "local_seo_foundation",
  },
  local_proof_language: {
    severity: "low",
    title: "No local-roots language",
    explanation:
      "Phrases like 'locally owned' or 'serving [city] since 2005' build hometown trust — none detected.",
    recommendedFix: "Add one sentence about your local history or ownership.",
    greenstarService: "local_seo_foundation",
  },
  ai_clear_services: {
    severity: "critical",
    title: "Services aren't described in clear sections",
    explanation:
      "Based on your website's visible content, AI and search-answer systems may struggle to understand exactly what you offer.",
    recommendedFix: "Break services into clearly-headed sections with specific descriptions.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_faq: {
    severity: "high",
    title: "No FAQ content",
    explanation:
      "FAQ content is one of the strongest signals answer engines use. Your site likely lacks clear answers to common buyer questions.",
    recommendedFix: "Add an FAQ section answering the 6–10 questions customers actually ask.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_about_expertise: {
    severity: "medium",
    title: "Little about/expertise content",
    explanation:
      "We couldn't find content establishing who's behind the business and why you're qualified.",
    recommendedFix: "Add an about section with your experience, credentials, and team.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_differentiators: {
    severity: "medium",
    title: "No 'why choose us' content",
    explanation:
      "Nothing on the scanned pages explains what makes you different, so AI/search systems have no differentiators to repeat.",
    recommendedFix: "Add a 'Why choose us' section with 3–4 concrete differences.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_buyer_questions: {
    severity: "medium",
    title: "No pricing or comparison content",
    explanation:
      "Buyers ask 'how much does it cost' and 'how long does it take.' Your site doesn't appear to answer these, making it easy for answer engines to skip you.",
    recommendedFix: "Publish honest cost-range and process content for your main services.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_structured_headings: {
    severity: "medium",
    title: "Weak heading structure",
    explanation:
      "Your homepage lacks a clear H1-plus-sections structure, which makes the page harder for machines to summarize.",
    recommendedFix: "Use one clear H1 and descriptive section headings.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_location_service_clarity: {
    severity: "high",
    title: "Title doesn't pair your service with your location",
    explanation:
      "Your page title/headline doesn't clearly connect what you do with where you do it — the single clearest signal for local queries.",
    recommendedFix: "Set the title to '[Service] in [City] | [Business Name]'.",
    greenstarService: "local_seo_foundation",
  },
  ai_proof_reviews: {
    severity: "medium",
    title: "No proof content visible to crawlers",
    explanation:
      "Review and proof content that lives only on third-party platforms doesn't help your own site get recommended.",
    recommendedFix: "Publish real testimonials as text on your site (not just widgets or images).",
    greenstarService: "review_reputation_system",
  },
  ai_process_explanation: {
    severity: "low",
    title: "Your process isn't explained",
    explanation:
      "'How it works' content answers a top buyer question and gives answer engines a story to tell — none detected.",
    recommendedFix: "Add a simple 3-step 'How it works' section.",
    greenstarService: "ai_visibility_upgrade",
  },
  ai_structured_data: {
    severity: "low",
    title: "No structured data",
    explanation: "Schema.org markup helps machines read your business facts — none detected.",
    recommendedFix: "Add JSON-LD structured data for your business and services.",
    greenstarService: "local_seo_foundation",
  },
  trust_testimonials: {
    severity: "critical",
    title: "No testimonials or reviews",
    explanation:
      "A skeptical visitor scanning your site finds no evidence other customers chose you and were happy.",
    recommendedFix: "Add real, specific testimonials — and a system to keep collecting them.",
    greenstarService: "review_reputation_system",
  },
  trust_team_about: {
    severity: "medium",
    title: "No team or about page",
    explanation: "People hire people. We couldn't find who's behind the business.",
    recommendedFix: "Add an about page with real photos and a short story.",
    greenstarService: "website_conversion_rebuild",
  },
  trust_photos_portfolio: {
    severity: "medium",
    title: "No photo or portfolio proof",
    explanation: "We didn't detect gallery/portfolio content or descriptive project photos.",
    recommendedFix: "Add a gallery of real job photos with short captions.",
    greenstarService: "website_conversion_rebuild",
  },
  trust_certifications: {
    severity: "medium",
    title: "No license or certification info",
    explanation:
      "'Licensed and insured' is a baseline trust requirement in most local industries — not detected on your pages.",
    recommendedFix: "Display license numbers, insurance, and certifications in the footer.",
    greenstarService: "website_conversion_rebuild",
  },
  trust_guarantee: {
    severity: "medium",
    title: "No guarantee or warranty",
    explanation: "A clear guarantee removes the visitor's fear of choosing wrong — none detected.",
    recommendedFix: "State your workmanship guarantee or satisfaction policy plainly.",
    greenstarService: "website_conversion_rebuild",
  },
  trust_case_studies: {
    severity: "low",
    title: "No before/after or case study proof",
    explanation: "Concrete results content (before/after, case studies) wasn't detected.",
    recommendedFix: "Publish 2–3 short before/after stories with photos.",
    greenstarService: "review_reputation_system",
  },
  trust_years_in_business: {
    severity: "low",
    title: "Years in business not stated",
    explanation: "Longevity is instant credibility — we couldn't find how long you've been operating.",
    recommendedFix: "Add 'Serving [city] since [year]' to your header or footer.",
    greenstarService: "website_conversion_rebuild",
  },
  trust_clear_contact: {
    severity: "high",
    title: "Contact info is hard to find",
    explanation: "No phone or email was detectable on your homepage.",
    recommendedFix: "Put your phone and email in the header and footer of every page.",
    greenstarService: "website_conversion_rebuild",
  },
  trust_social_links: {
    severity: "low",
    title: "No social profiles linked",
    explanation: "Social links let visitors verify you're real and active — none detected.",
    recommendedFix: "Link your Google, Facebook, or Instagram profiles in the footer.",
    greenstarService: "review_reputation_system",
  },
  trust_meta_completeness: {
    severity: "low",
    title: "Incomplete site metadata",
    explanation: "Thin metadata makes search previews look unprofessional.",
    recommendedFix: "Complete your title and meta description.",
    greenstarService: "local_seo_foundation",
  },
  followup_form: {
    severity: "critical",
    title: "No lead capture form visible",
    explanation:
      "We couldn't find a contact or quote form on your public pages, so a visitor who doesn't want to call has no obvious way to leave their details there. (You may capture leads by other means we can't see from outside.)",
    recommendedFix: "Add a short lead form that captures name, phone, and email.",
    greenstarService: "crm_follow_up_automation",
  },
  followup_booking_link: {
    severity: "high",
    title: "No online booking option",
    explanation:
      "Customers increasingly expect to book online. We didn't detect a booking or scheduling path.",
    recommendedFix: "Add an online booking link (even a simple calendar) to your main CTA.",
    greenstarService: "booking_quote_funnel",
  },
  followup_quote_cta: {
    severity: "high",
    title: "No quote or estimate request path",
    explanation: "We didn't find a clear 'get a quote/estimate' path — a core conversion route for local services.",
    recommendedFix: "Add a prominent 'Get a Free Quote' flow.",
    greenstarService: "booking_quote_funnel",
  },
  followup_response_promise: {
    severity: "medium",
    title: "No response-time promise",
    explanation:
      "Visitors don't know if you'll reply in an hour or a week. Uncertainty kills form submissions.",
    recommendedFix: "Promise (and automate) a response window: 'We reply within 1 business hour.'",
    greenstarService: "crm_follow_up_automation",
  },
  followup_email_capture: {
    severity: "low",
    title: "No email capture",
    explanation: "There's no way to stay in front of visitors who aren't ready to buy today.",
    recommendedFix: "Offer a simple lead magnet or seasonal checklist for an email address.",
    greenstarService: "lead_reactivation_campaign",
  },
  followup_multiple_contact: {
    severity: "medium",
    title: "Only one way to contact you",
    explanation: "Different customers prefer different channels; we detected fewer than two working contact options.",
    recommendedFix: "Offer at least phone plus a form (text is even better).",
    greenstarService: "crm_follow_up_automation",
  },
  followup_crm_indicators: {
    severity: "medium",
    title: "No public follow-up signals",
    explanation:
      "From the outside we couldn't detect public signals of instant lead follow-up (auto-reply forms, a connected scheduler, marketing-platform integration). This doesn't mean you lack an internal system — it only means a visitor sees no evidence of fast follow-up, which is itself reassuring to add.",
    recommendedFix: "Surface your responsiveness publicly and connect forms/calls to instant replies.",
    greenstarService: "crm_follow_up_automation",
  },
  followup_language: {
    severity: "low",
    title: "No missed-call recovery mentioned",
    explanation:
      "Your public pages don't mention text-back or a way to reach you if a call is missed. Whatever you do internally, saying it plainly reassures visitors who'd otherwise move on.",
    recommendedFix: "Add missed-call text-back and mention it, so every caller gets an instant reply.",
    greenstarService: "crm_follow_up_automation",
  },
  followup_next_step: {
    severity: "low",
    title: "No 'what happens next' reassurance",
    explanation: "Visitors submitting a form don't know what to expect afterward.",
    recommendedFix: "Add one line under your form: 'We'll call you within X hours.'",
    greenstarService: "booking_quote_funnel",
  },
  followup_scheduler: {
    severity: "low",
    title: "No calendar/scheduler link",
    explanation: "A direct scheduling link removes back-and-forth — none detected.",
    recommendedFix: "Add a scheduling link for estimates or consultations.",
    greenstarService: "booking_quote_funnel",
  },
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function priorityForSeverity(severity: Severity): Priority {
  if (severity === "critical") return "this_week";
  if (severity === "high") return "this_month";
  return "later";
}

/** Builds recommendations for every failed rule, most severe first. */
export function buildRecommendations(findings: Finding[]): RecommendationDraft[] {
  const drafts: RecommendationDraft[] = [];
  for (const finding of findings) {
    if (finding.detected) continue;
    const template = REC_TEMPLATES[finding.id];
    if (!template) continue;
    drafts.push({
      ruleId: finding.id,
      category: finding.category,
      ...template,
      priority: priorityForSeverity(template.severity),
    });
  }
  drafts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return drafts;
}

export { REC_TEMPLATES, SEVERITY_ORDER };
