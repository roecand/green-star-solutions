import type {
  ExtractedSite,
  Finding,
  FindingCategory,
  ScanContext,
} from "@/lib/scanner/types";

export interface RuleResult {
  detected: boolean;
  evidence: string | null;
}

export interface ScoringRule {
  id: string;
  category: FindingCategory;
  label: string;
  weight: number;
  detect: (site: ExtractedSite, ctx: ScanContext) => RuleResult;
}

// ---------- shared helpers ----------

const yes = (evidence: string): RuleResult => ({ detected: true, evidence: evidence.slice(0, 200) });
const no = (): RuleResult => ({ detected: false, evidence: null });

function textMatch(site: ExtractedSite, pattern: RegExp): RuleResult {
  const match = site.combinedText.match(pattern);
  return match ? yes(`"…${contextAround(site.combinedText, match.index ?? 0, match[0])}…"`) : no();
}

function contextAround(text: string, index: number, matched: string): string {
  const start = Math.max(0, index - 40);
  return text.slice(start, index + matched.length + 40).trim();
}

function home(site: ExtractedSite) {
  return site.pages.find((p) => p.kind === "home") ?? site.pages[0];
}

function hasPage(site: ExtractedSite, kind: string): boolean {
  return site.pages.some((p) => p.kind === kind);
}

function internalLinkMatching(site: ExtractedSite, pattern: RegExp): string | null {
  for (const page of site.pages) {
    for (const link of page.links) {
      if (link.internal && (pattern.test(link.href) || pattern.test(link.text))) {
        return link.text || link.href;
      }
    }
  }
  return null;
}

const CTA_PATTERN =
  /\b(call now|call us|call today|book (now|online|an? appointment)|schedule|get (a |your )?(free )?(quote|estimate|consultation)|request (a |your )?(quote|estimate|service|appointment)|free (quote|estimate|consultation|inspection)|contact us|get started|reserve|start today)\b/i;

const REVIEW_PATTERN =
  /\b(testimonial|reviews?|5[- ]star|five[- ]star|rated|what our (customers|clients|patients) say|google reviews?|customer stories)\b/i;

// ---------- Website Conversion (weights sum to 100) ----------

export const conversionRules: ScoringRule[] = [
  {
    id: "conv_phone_visible",
    category: "conversion",
    label: "Phone number visible on the website",
    weight: 10,
    detect: (site) => {
      const h = home(site);
      return h.phones.length > 0 ? yes(`Phone found: ${h.phones[0]}`) : no();
    },
  },
  {
    id: "conv_primary_cta",
    category: "conversion",
    label: "Clear primary call-to-action in the hero area",
    weight: 10,
    detect: (site) => {
      const h = home(site);
      // "Above the fold" approximation: CTA language in headings, buttons, or first links.
      const heroText = [...h.h1, ...h.h2, ...h.buttons, ...h.links.slice(0, 12).map((l) => l.text)].join(" | ");
      const match = heroText.match(CTA_PATTERN);
      return match ? yes(`CTA found: "${match[0]}"`) : no();
    },
  },
  {
    id: "conv_contact_form",
    category: "conversion",
    label: "Contact or booking form detected",
    weight: 10,
    detect: (site) => {
      const form = site.pages.flatMap((p) => p.forms).find((f) => f.fieldCount >= 2);
      return form ? yes(`Form with ${form.fieldCount} fields detected`) : no();
    },
  },
  {
    id: "conv_services_listed",
    category: "conversion",
    label: "Services clearly listed",
    weight: 10,
    detect: (site, ctx) => {
      if (hasPage(site, "services")) return yes("Dedicated services page detected");
      const h = home(site);
      const headings = [...h.h2, ...h.h3].join(" | ");
      if (/service|what we do|we offer|our work/i.test(headings)) {
        return yes(`Services section heading: "${headings.match(/[^|]*(service|what we do|we offer|our work)[^|]*/i)?.[0]?.trim()}"`);
      }
      if (ctx.industry && new RegExp(ctx.industry.split(/\s+/)[0], "i").test(headings)) {
        return yes("Industry services referenced in headings");
      }
      return no();
    },
  },
  {
    id: "conv_mobile_viewport",
    category: "conversion",
    label: "Mobile-friendly viewport configured",
    weight: 10,
    detect: (site) =>
      home(site).hasViewportMeta ? yes("Responsive viewport meta tag present") : no(),
  },
  {
    id: "conv_social_proof",
    category: "conversion",
    label: "Testimonials or reviews shown on the site",
    weight: 10,
    detect: (site) => textMatch(site, REVIEW_PATTERN),
  },
  {
    id: "conv_contact_page",
    category: "conversion",
    label: "Contact page detected",
    weight: 10,
    detect: (site) => {
      if (hasPage(site, "contact")) return yes("Contact page detected");
      const link = internalLinkMatching(site, /contact/i);
      return link ? yes(`Contact link: "${link}"`) : no();
    },
  },
  {
    id: "conv_offer_language",
    category: "conversion",
    label: "Clear offer or differentiator language",
    weight: 10,
    detect: (site) =>
      textMatch(
        site,
        /\b(free (quote|estimate|consultation|inspection)|same[- ]day|24\/7|guarantee[d]?|no obligation|financing|special offer|\$\d+ off|discount|warranty)\b/i
      ),
  },
  {
    id: "conv_low_friction_cta",
    category: "conversion",
    label: "Low-friction next step (call, book, or short form)",
    weight: 10,
    detect: (site) => {
      const buttons = site.pages.flatMap((p) => p.buttons).join(" | ");
      const match = buttons.match(CTA_PATTERN);
      if (match) return yes(`Action button: "${match[0]}"`);
      const shortForm = site.pages.flatMap((p) => p.forms).find((f) => f.fieldCount > 0 && f.fieldCount <= 5);
      return shortForm ? yes(`Short form (${shortForm.fieldCount} fields)`) : no();
    },
  },
  {
    id: "conv_meta_basics",
    category: "conversion",
    label: "Page title and description set (performance/SEO hygiene)",
    weight: 10,
    detect: (site) => {
      const h = home(site);
      return h.title && h.metaDescription
        ? yes(`Title: "${h.title.slice(0, 80)}"`)
        : no();
    },
  },
];

// ---------- Local Visibility (weights sum to 100) ----------

export const localRules: ScoringRule[] = [
  {
    id: "local_city_state",
    category: "local",
    label: "City and state mentioned on the website",
    weight: 15,
    detect: (site, ctx) => {
      if (!ctx.city) return no();
      const cityRe = new RegExp(`\\b${escapeRegExp(ctx.city)}\\b`, "i");
      return textMatch(site, cityRe);
    },
  },
  {
    id: "local_service_area",
    category: "local",
    label: "Service area described",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(service area|serving|we serve|proudly serv|areas we cover|locations? we|surrounding areas?|greater [A-Z])\b/i),
  },
  {
    id: "local_nap",
    category: "local",
    label: "Name, address, and phone (NAP) info present",
    weight: 10,
    detect: (site) => {
      const anyPhone = site.pages.some((p) => p.phones.length > 0);
      const address = site.combinedText.match(
        /\b\d{1,5}\s+[A-Za-z0-9.\s]{3,40}\b(street|st\.?|avenue|ave\.?|blvd\.?|boulevard|road|rd\.?|drive|dr\.?|lane|ln\.?|suite|ste\.?|way|pkwy|parkway)\b/i
      );
      if (anyPhone && address) return yes(`Address: "${address[0].trim()}"`);
      return no();
    },
  },
  {
    id: "local_location_page",
    category: "local",
    label: "Location or service-area page detected",
    weight: 10,
    detect: (site) => {
      const link = internalLinkMatching(site, /location|service-area|areas?-served|cities/i);
      return link ? yes(`Location link: "${link}"`) : no();
    },
  },
  {
    id: "local_reviews",
    category: "local",
    label: "Local reviews or testimonials referenced",
    weight: 10,
    detect: (site) => textMatch(site, REVIEW_PATTERN),
  },
  {
    id: "local_schema",
    category: "local",
    label: "LocalBusiness structured data (schema.org)",
    weight: 10,
    detect: (site) => {
      const types = site.pages.flatMap((p) => p.schemaTypes);
      const localType = types.find((t) =>
        /LocalBusiness|Organization|Dentist|Plumber|Electrician|HVACBusiness|AutoRepair|MedicalBusiness|HomeAndConstructionBusiness|LegalService|Restaurant/i.test(t)
      );
      return localType ? yes(`Structured data: ${localType}`) : no();
    },
  },
  {
    id: "local_service_city_pairing",
    category: "local",
    label: "Service + city keyword pairing",
    weight: 10,
    detect: (site, ctx) => {
      if (!ctx.city) return no();
      const industryWord = ctx.industry.split(/[\s/]+/)[0];
      const re = new RegExp(
        `(${escapeRegExp(industryWord)}[^.!?]{0,60}${escapeRegExp(ctx.city)})|(${escapeRegExp(ctx.city)}[^.!?]{0,60}${escapeRegExp(industryWord)})`,
        "i"
      );
      return textMatch(site, re);
    },
  },
  {
    id: "local_clear_category",
    category: "local",
    label: "Business category obvious from title/headline",
    weight: 10,
    detect: (site, ctx) => {
      const h = home(site);
      const headline = `${h.title ?? ""} | ${h.h1.join(" | ")}`;
      const industryWord = ctx.industry.split(/[\s/]+/)[0];
      return new RegExp(escapeRegExp(industryWord), "i").test(headline)
        ? yes(`Headline: "${headline.slice(0, 100)}"`)
        : no();
    },
  },
  {
    id: "local_map_contact",
    category: "local",
    label: "Map, directions, or clear location contact signal",
    weight: 10,
    detect: (site) => {
      const mapLink = site.pages
        .flatMap((p) => p.links)
        .find((l) => /maps\.google|google\.[a-z.]+\/maps|goo\.gl\/maps|directions/i.test(l.href));
      if (mapLink) return yes("Google Maps link detected");
      return textMatch(site, /\b(get directions|find us|visit us|our location)\b/i);
    },
  },
  {
    id: "local_proof_language",
    category: "local",
    label: "Local proof language (locally owned, community, since 19xx)",
    weight: 5,
    detect: (site) =>
      textMatch(site, /\b(locally owned|family[- ]owned|community|since (19|20)\d{2}|hometown|local experts?)\b/i),
  },
];

// ---------- AI Visibility (weights sum to 100) ----------

export const aiVisibilityRules: ScoringRule[] = [
  {
    id: "ai_clear_services",
    category: "ai_visibility",
    label: "Services described in clear, specific language",
    weight: 15,
    detect: (site) => {
      const serviceHeadings = site.pages
        .flatMap((p) => [...p.h2, ...p.h3])
        .filter((h) => h.length > 3 && h.length < 80);
      return serviceHeadings.length >= 4
        ? yes(`Structured sections: ${serviceHeadings.slice(0, 3).join("; ")}`)
        : no();
    },
  },
  {
    id: "ai_faq",
    category: "ai_visibility",
    label: "FAQ content answering buyer questions",
    weight: 10,
    detect: (site) => {
      const types = site.pages.flatMap((p) => p.schemaTypes);
      if (types.some((t) => /FAQPage|Question/i.test(t))) return yes("FAQ structured data detected");
      return textMatch(site, /\b(frequently asked|faqs?|common questions)\b/i);
    },
  },
  {
    id: "ai_about_expertise",
    category: "ai_visibility",
    label: "About/expertise content",
    weight: 10,
    detect: (site) => {
      if (hasPage(site, "about")) return yes("About page detected");
      return textMatch(site, /\b(about us|our (story|mission|team)|who we are|years? of experience)\b/i);
    },
  },
  {
    id: "ai_differentiators",
    category: "ai_visibility",
    label: "Clear differentiators (why choose us)",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(why choose|what (makes|sets) us|unlike other|the difference|our promise|why us)\b/i),
  },
  {
    id: "ai_buyer_questions",
    category: "ai_visibility",
    label: "Comparison or buyer-question content (cost, how long, vs)",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(how much (does|is|will)|what does .{0,30}cost|cost of|pricing|how long (does|will)|vs\.?|compared to|which is (better|right))\b/i),
  },
  {
    id: "ai_structured_headings",
    category: "ai_visibility",
    label: "Well-structured headings (H1 + section headings)",
    weight: 10,
    detect: (site) => {
      const h = home(site);
      return h.h1.length >= 1 && h.h2.length >= 2
        ? yes(`H1: "${h.h1[0]}" plus ${h.h2.length} section headings`)
        : no();
    },
  },
  {
    id: "ai_location_service_clarity",
    category: "ai_visibility",
    label: "Location and service clarity for answer engines",
    weight: 10,
    detect: (site, ctx) => {
      const h = home(site);
      const headline = `${h.title ?? ""} ${h.metaDescription ?? ""} ${h.h1.join(" ")}`;
      const hasIndustry = new RegExp(escapeRegExp(ctx.industry.split(/[\s/]+/)[0]), "i").test(headline);
      const hasPlace = ctx.city ? new RegExp(escapeRegExp(ctx.city), "i").test(headline) : false;
      if (hasIndustry && hasPlace) return yes(`Title/headline pairs service + location`);
      return no();
    },
  },
  {
    id: "ai_proof_reviews",
    category: "ai_visibility",
    label: "Proof and review content visible to crawlers",
    weight: 10,
    detect: (site) => textMatch(site, REVIEW_PATTERN),
  },
  {
    id: "ai_process_explanation",
    category: "ai_visibility",
    label: "Specific process explained (how it works, steps)",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(how it works|our process|step [123]|what to expect|first,? we|(then|next),? we)\b/i),
  },
  {
    id: "ai_structured_data",
    category: "ai_visibility",
    label: "Structured data present (schema.org)",
    weight: 5,
    detect: (site) => {
      const types = site.pages.flatMap((p) => p.schemaTypes);
      return types.length > 0 ? yes(`Schema types: ${types.slice(0, 4).join(", ")}`) : no();
    },
  },
];

// ---------- Trust & Proof (weights sum to 100) ----------

export const trustRules: ScoringRule[] = [
  {
    id: "trust_testimonials",
    category: "trust",
    label: "Testimonials or reviews on the website",
    weight: 15,
    detect: (site) => textMatch(site, REVIEW_PATTERN),
  },
  {
    id: "trust_team_about",
    category: "trust",
    label: "Team or about page",
    weight: 10,
    detect: (site) => {
      if (hasPage(site, "about")) return yes("About page detected");
      const link = internalLinkMatching(site, /about|team|meet/i);
      return link ? yes(`About link: "${link}"`) : no();
    },
  },
  {
    id: "trust_photos_portfolio",
    category: "trust",
    label: "Photos, gallery, or portfolio proof",
    weight: 10,
    detect: (site) => {
      const link = internalLinkMatching(site, /gallery|portfolio|our[- ]work|projects/i);
      if (link) return yes(`Gallery link: "${link}"`);
      const alts = site.pages.flatMap((p) => p.imageAlts);
      return alts.length >= 5 ? yes(`${alts.length} descriptive images detected`) : no();
    },
  },
  {
    id: "trust_certifications",
    category: "trust",
    label: "Certifications or license info",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(licensed|insured|certified|accredited|bonded|bbb|license #?\s?[a-z0-9]|board[- ]certified|epa|nate|ase)\b/i),
  },
  {
    id: "trust_guarantee",
    category: "trust",
    label: "Guarantees or warranties",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(guarantee[d]?|warrant(y|ies)|satisfaction|money[- ]back|risk[- ]free)\b/i),
  },
  {
    id: "trust_case_studies",
    category: "trust",
    label: "Before/after or case study proof",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(before (and|&) after|case stud(y|ies)|results?|success stor(y|ies)|transformation)\b/i),
  },
  {
    id: "trust_years_in_business",
    category: "trust",
    label: "Years in business stated",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(\d{1,2}\+? years?|since (19|20)\d{2}|decades? of|established (19|20)\d{2})\b/i),
  },
  {
    id: "trust_clear_contact",
    category: "trust",
    label: "Clear contact info (phone or email visible)",
    weight: 10,
    detect: (site) => {
      const h = home(site);
      if (h.phones.length > 0) return yes(`Phone: ${h.phones[0]}`);
      if (h.emails.length > 0) return yes(`Email: ${h.emails[0]}`);
      return no();
    },
  },
  {
    id: "trust_social_links",
    category: "trust",
    label: "Social media presence linked",
    weight: 10,
    detect: (site) => {
      const socials = site.pages.flatMap((p) => p.socialLinks);
      return socials.length > 0 ? yes(`${socials.length} social profile links`) : no();
    },
  },
  {
    id: "trust_meta_completeness",
    category: "trust",
    label: "Professional metadata (title + description complete)",
    weight: 5,
    detect: (site) => {
      const h = home(site);
      return h.title && h.metaDescription && h.metaDescription.length > 50
        ? yes("Complete title and meta description")
        : no();
    },
  },
];

// ---------- Follow-Up Readiness (weights sum to 100) ----------

export const followUpRules: ScoringRule[] = [
  {
    id: "followup_form",
    category: "follow_up",
    label: "Lead capture form detected",
    weight: 15,
    detect: (site) => {
      const form = site.pages.flatMap((p) => p.forms).find((f) => f.hasEmailField || f.hasPhoneField);
      return form ? yes(`Form captures ${form.hasEmailField ? "email" : "phone"}`) : no();
    },
  },
  {
    id: "followup_booking_link",
    category: "follow_up",
    label: "Online booking or scheduling link",
    weight: 15,
    detect: (site) => {
      const bookingLink = site.pages
        .flatMap((p) => p.links)
        .find((l) =>
          /calendly|acuity|housecallpro|jobber|servicetitan|square\.site|setmore|booksy|vagaro|schedul|book(ing)?[-./]/i.test(l.href)
        );
      if (bookingLink) return yes(`Booking link: ${bookingLink.href.slice(0, 80)}`);
      const bookButton = site.pages.flatMap((p) => p.buttons).find((b) => /book|schedule/i.test(b));
      return bookButton ? yes(`Booking button: "${bookButton}"`) : no();
    },
  },
  {
    id: "followup_quote_cta",
    category: "follow_up",
    label: "Quote or estimate request path",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(request (a |your )?(quote|estimate)|get (a |your )?(free )?(quote|estimate)|free estimate)\b/i),
  },
  {
    id: "followup_response_promise",
    category: "follow_up",
    label: "Response-time promise",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(within (24|48|one|1|2) (hours?|business days?)|same[- ]day (response|service|quote)|we('ll| will) (get back|respond|call you back)|fast response|respond (quickly|promptly))\b/i),
  },
  {
    id: "followup_email_capture",
    category: "follow_up",
    label: "Email capture (newsletter or lead magnet)",
    weight: 10,
    detect: (site) => {
      if (textMatch(site, /\b(newsletter|subscribe|sign up for|free (guide|checklist|download))\b/i).detected) {
        return yes("Email capture language detected");
      }
      const emailOnlyForm = site.pages.flatMap((p) => p.forms).find((f) => f.hasEmailField && f.fieldCount <= 2);
      return emailOnlyForm ? yes("Email signup form detected") : no();
    },
  },
  {
    id: "followup_multiple_contact",
    category: "follow_up",
    label: "Multiple contact options (phone + form/email)",
    weight: 10,
    detect: (site) => {
      const anyPhone = site.pages.some((p) => p.phones.length > 0);
      const anyForm = site.pages.some((p) => p.forms.length > 0);
      const anyEmail = site.pages.some((p) => p.emails.length > 0);
      const count = [anyPhone, anyForm, anyEmail].filter(Boolean).length;
      return count >= 2 ? yes("Multiple contact channels available") : no();
    },
  },
  {
    id: "followup_crm_indicators",
    category: "follow_up",
    label: "CRM or automation indicators",
    weight: 10,
    detect: (site) => {
      const crmLink = site.pages
        .flatMap((p) => p.links)
        .find((l) => /hubspot|gohighlevel|leadconnector|mailchimp|activecampaign|klaviyo|keap|jobber|servicetitan|housecallpro/i.test(l.href));
      if (crmLink) return yes("Marketing/CRM platform integration detected");
      const crmForm = site.pages
        .flatMap((p) => p.forms)
        .find((f) => f.action && /hubspot|gohighlevel|leadconnector|mailchimp|activecampaign|formspree|typeform/i.test(f.action));
      return crmForm ? yes("Form posts to an automation platform") : no();
    },
  },
  {
    id: "followup_language",
    category: "follow_up",
    label: "Follow-up or missed-call recovery language",
    weight: 10,
    detect: (site) =>
      textMatch(site, /\b(we('ll| will) follow up|text us|leave a message and|missed (your )?call|call you back|we return (all|every) calls?)\b/i),
  },
  {
    id: "followup_next_step",
    category: "follow_up",
    label: "Confirmation or next-step language",
    weight: 5,
    detect: (site) =>
      textMatch(site, /\b(what happens next|next steps?|here's how|after you (submit|call|book)|you('ll| will) (receive|get|hear))\b/i),
  },
  {
    id: "followup_scheduler",
    category: "follow_up",
    label: "Calendar or scheduler embed/link",
    weight: 5,
    detect: (site) => {
      const link = site.pages
        .flatMap((p) => p.links)
        .find((l) => /calendly|acuity|cal\.com|appointlet|youcanbook|setmore/i.test(l.href));
      return link ? yes(`Scheduler: ${link.href.slice(0, 80)}`) : no();
    },
  },
];

export const allRules: ScoringRule[] = [
  ...conversionRules,
  ...localRules,
  ...aiVisibilityRules,
  ...trustRules,
  ...followUpRules,
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type { Finding };
