export interface GreenstarService {
  id: string;
  name: string;
  description: string;
}

export const GREENSTAR_SERVICES: GreenstarService[] = [
  {
    id: "website_conversion_rebuild",
    name: "Website Conversion Rebuild",
    description:
      "For businesses with a weak homepage, weak CTAs, poor mobile layout, bad contact flow, or unclear service messaging.",
  },
  {
    id: "crm_follow_up_automation",
    name: "CRM & Follow-Up Automation",
    description:
      "For businesses losing leads because they lack instant response, nurturing, missed-call recovery, or quote follow-up.",
  },
  {
    id: "review_reputation_system",
    name: "Review & Reputation System",
    description:
      "For businesses with weak trust proof, low review volume, or no review generation process.",
  },
  {
    id: "local_seo_foundation",
    name: "Local SEO Foundation",
    description:
      "For businesses missing service pages, location pages, schema, or clear local relevance.",
  },
  {
    id: "ai_visibility_upgrade",
    name: "AI Visibility Upgrade",
    description:
      "For businesses whose website does not clearly explain services, differentiators, FAQs, proof, and buyer questions.",
  },
  {
    id: "lead_reactivation_campaign",
    name: "Lead Reactivation Campaign",
    description:
      "For businesses with old leads, past customers, or unsold inquiries that can be reactivated.",
  },
  {
    id: "booking_quote_funnel",
    name: "Booking / Quote Funnel",
    description:
      "For businesses that need a better path from visitor to booked call, estimate, appointment, or quote request.",
  },
];

export function serviceName(id: string): string {
  return GREENSTAR_SERVICES.find((s) => s.id === id)?.name ?? id;
}
