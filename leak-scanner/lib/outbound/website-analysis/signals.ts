import type { ExtractedPage, ExtractedSite } from "@/lib/scanner/types";

/**
 * Deterministic, customer's-eye signals read from a fetched website. Every
 * observation and score the outbound engine produces is grounded in these —
 * the LLM phrases findings, it never gets to invent them.
 */
export interface WebsiteSignals {
  finalUrl: string;
  pagesFetched: string[];
  title: string | null;
  metaDescription: string | null;
  headline: string | null;
  headlineIsGeneric: boolean;
  hasViewportMeta: boolean;
  phoneOnHomepage: string | null;
  phoneClickable: boolean;
  phoneNearTop: boolean;
  ctaTexts: string[];
  hasPrimaryCta: boolean;
  formCount: number;
  maxFormFields: number;
  formOnHomepage: boolean;
  onlineBooking: string | null;
  chatWidget: string | null;
  textOption: boolean;
  responseTimePromise: boolean;
  afterHoursLanguage: boolean;
  reviewsMentioned: boolean;
  reviewCountClaim: number | null;
  ratingClaim: number | null;
  /** 0–1: where review language first appears in homepage text (null = absent). */
  reviewsPosition: number | null;
  reviewWidget: string | null;
  licenseOrInsured: boolean;
  certifications: string[];
  yearsInBusinessClaim: string | null;
  copyrightYear: number | null;
  servicesClear: boolean;
  socialLinkCount: number;
  contactPage: boolean;
  wordCount: number;
  parkedOrPlaceholder: string | null;
}

const GENERIC_HEADLINE =
  /^(welcome( to)?|home|quality (service|work)|your (trusted|local|#1)|we('re| are) (the best|here)|best (service|in town)|excellence|professional services?|serving you)\b/i;

const CTA_PATTERN =
  /\b(call( now| us| today)?|book( now| online| an? appointment)?|schedule( service| now| online)?|get (a |your )?(free )?(quote|estimate|consultation)|request (a |your )?(quote|estimate|service|appointment)|free (quote|estimate|consultation|inspection)|contact us|get started)\b/i;

const BOOKING_HOSTS: Array<[RegExp, string]> = [
  [/housecallpro/, "Housecall Pro"],
  [/servicetitan/, "ServiceTitan"],
  [/jobber|getjobber/, "Jobber"],
  [/calendly/, "Calendly"],
  [/acuityscheduling/, "Acuity"],
  [/zocdoc/, "Zocdoc"],
  [/vagaro/, "Vagaro"],
  [/booksy/, "Booksy"],
  [/mindbodyonline|mindbody/, "Mindbody"],
  [/nexhealth/, "NexHealth"],
  [/localmed/, "LocalMed"],
  [/jane\.app/, "Jane"],
  [/boulevard|joinblvd/, "Boulevard"],
  [/schedulicity/, "Schedulicity"],
  [/squareup\.com\/appointments|square\.site/, "Square Appointments"],
  [/setmore/, "Setmore"],
  [/leadconnectorhq|msgsndr|gohighlevel/, "GoHighLevel booking"],
];

const CHAT_HOSTS: Array<[RegExp, string]> = [
  [/podium/, "Podium"],
  [/birdeye/, "Birdeye"],
  [/tawk\.to/, "Tawk.to"],
  [/intercom/, "Intercom"],
  [/drift/, "Drift"],
  [/livechatinc|livechat/, "LiveChat"],
  [/tidio/, "Tidio"],
  [/zendesk|zopim/, "Zendesk chat"],
  [/hubspot|hs-scripts/, "HubSpot"],
  [/leadconnectorhq|msgsndr/, "GoHighLevel chat"],
  [/crisp\.chat/, "Crisp"],
  [/olark/, "Olark"],
  [/signpost/, "Signpost"],
  [/smith\.ai/, "Smith.ai"],
  [/ngage|apexchat|websitealive/, "Live chat"],
];

const REVIEW_WIDGET_HOSTS: Array<[RegExp, string]> = [
  [/elfsight/, "Elfsight reviews"],
  [/birdeye/, "Birdeye"],
  [/trustindex/, "Trustindex"],
  [/nicejob/, "NiceJob"],
  [/grade\.us/, "Grade.us"],
  [/embedsocial/, "EmbedSocial"],
  [/reviewsonmywebsite/, "Reviews on my website"],
];

const REVIEW_PATTERN =
  /\b(testimonials?|reviews?|5[- ]star|five[- ]star|what our (customers|clients|patients) (are )?say(ing)?|google rating)\b/i;

function home(site: ExtractedSite): ExtractedPage {
  return site.pages.find((p) => p.kind === "home") ?? site.pages[0];
}

function matchHost(hosts: string[], table: Array<[RegExp, string]>): string | null {
  for (const host of hosts) {
    for (const [pattern, label] of table) if (pattern.test(host)) return label;
  }
  return null;
}

export function extractCopyrightYear(text: string): number | null {
  const matches = [...text.matchAll(/(?:©|\(c\)|copyright)\s*(?:\d{4}\s*[-–—]\s*)?((?:19|20)\d{2})/gi)];
  if (matches.length === 0) return null;
  return Math.max(...matches.map((m) => Number(m[1])));
}

export function extractReviewCount(text: string): number | null {
  const match = text.match(
    /(\d{1,3}(?:,\d{3})*|\d+)\s*\+?\s*(?:verified |5[- ]star |five[- ]star |google |customer |happy )*reviews/i
  );
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ""));
  return n >= 5 && n < 100_000 ? n : null;
}

export function extractRating(text: string): number | null {
  const match = text.match(/\b([3-5]\.\d)\s*(?:\/\s*5|stars?|★|out of 5|star rating|rating)/i);
  return match ? Number(match[1]) : null;
}

const PARKED_PATTERN =
  /\b(this domain (is|may be) for sale|buy this domain|domain parking|parked (free|domain)|website coming soon|site (is )?under construction|lorem ipsum dolor|account (has been )?suspended|default web page|it works!)\b/i;

export function extractSignals(site: ExtractedSite): WebsiteSignals {
  const h = home(site);
  const allHosts = site.pages.flatMap((p) => p.thirdPartyScripts ?? []);
  const allLinks = site.pages.flatMap((p) => p.links);
  const linkHosts = allLinks
    .filter((l) => !l.internal)
    .map((l) => {
      try {
        return new URL(l.href).hostname.replace(/^www\./, "") + new URL(l.href).pathname;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
  const text = site.combinedText;
  const homeText = h.text;

  const headline = h.h1[0] ?? null;
  const ctaTexts = [...h.buttons, ...h.links.slice(0, 25).map((l) => l.text)]
    .filter((t) => t && t.length < 60 && CTA_PATTERN.test(t))
    .slice(0, 6);

  const firstPhone = h.phones[0] ?? null;
  const phoneClickable = h.links.some((l) => l.href.startsWith("tel:"));
  const phoneNearTop =
    h.links.slice(0, 15).some((l) => l.href.startsWith("tel:")) ||
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(homeText.slice(0, 400));

  const forms = site.pages.flatMap((p) => p.forms).filter((f) => f.fieldCount >= 2);
  const reviewMatch = homeText.match(REVIEW_PATTERN);

  const bookingByHost = matchHost([...allHosts, ...linkHosts], BOOKING_HOSTS);
  const bookingByText = /\b(book (online|now|an appointment online)|schedule online|online (booking|scheduling))\b/i.test(
    [...h.buttons, ...allLinks.map((l) => l.text)].join(" | ")
  )
    ? "Online booking link"
    : null;

  const certifications = [
    ...new Set(
      (text.match(/\b(NATE|EPA|BBB|A\+ rating|Angi|HomeAdvisor|Better Business Bureau|Diamond Certified|Lennox Premier|Carrier Factory Authorized|Trane Comfort Specialist|GAF (Master|Certified)|Owens Corning Preferred|CertainTeed|Board[- ]Certified|ADA|AAOMS|Invisalign)\b/g) ?? []).map(
        (s) => s.trim()
      )
    ),
  ].slice(0, 8);

  const parked = text.match(PARKED_PATTERN);

  return {
    finalUrl: site.finalUrl,
    pagesFetched: site.pages.map((p) => p.kind),
    title: h.title,
    metaDescription: h.metaDescription,
    headline,
    headlineIsGeneric: !headline || GENERIC_HEADLINE.test(headline.trim()) || headline.trim().length < 12,
    hasViewportMeta: h.hasViewportMeta,
    phoneOnHomepage: firstPhone,
    phoneClickable,
    phoneNearTop: !!firstPhone && phoneNearTop,
    ctaTexts,
    hasPrimaryCta: ctaTexts.length > 0,
    formCount: forms.length,
    maxFormFields: forms.reduce((max, f) => Math.max(max, f.fieldCount), 0),
    formOnHomepage: h.forms.some((f) => f.fieldCount >= 2),
    onlineBooking: bookingByHost ?? bookingByText,
    chatWidget: matchHost(allHosts, CHAT_HOSTS),
    textOption:
      allLinks.some((l) => l.href.startsWith("sms:")) ||
      /\b(text us|text (?:or call|us at)|send us a text|txt us)\b/i.test(text),
    responseTimePromise: /\b(respond|get back to you|reply|call you back)\b[^.]{0,40}\b(within|in under|in less than)\s+\d+\s*(minutes?|mins?|hours?|hrs?)\b|\binstant (quote|response|reply)\b/i.test(
      text
    ),
    afterHoursLanguage: /\b(24\/7|24 hours|after[- ]hours|emergency service|nights and weekends|around the clock)\b/i.test(text),
    reviewsMentioned: REVIEW_PATTERN.test(text),
    reviewCountClaim: extractReviewCount(text),
    ratingClaim: extractRating(text),
    reviewsPosition:
      reviewMatch && homeText.length > 0 ? Number(((reviewMatch.index ?? 0) / homeText.length).toFixed(2)) : null,
    reviewWidget: matchHost(allHosts, REVIEW_WIDGET_HOSTS),
    licenseOrInsured: /\b(licen[sc]ed|license\s*(#|no\.?|number)|lic\.?\s*#|bonded|insured|ROC\s*#?\d+|contractor'?s license)\b/i.test(text),
    certifications,
    yearsInBusinessClaim:
      text.match(/\b(since (19|20)\d{2}|(over |more than )?\d{1,3}\+? years (of experience|in business|serving))\b/i)?.[0] ?? null,
    copyrightYear: extractCopyrightYear(text),
    servicesClear:
      site.pages.some((p) => p.kind === "services") ||
      /service|what we do|we offer|treatments|our work/i.test([...h.h2, ...h.h3].join(" | ")),
    socialLinkCount: new Set(site.pages.flatMap((p) => p.socialLinks)).size,
    contactPage: site.pages.some((p) => p.kind === "contact"),
    wordCount: site.pages.reduce((sum, p) => sum + p.wordCount, 0),
    parkedOrPlaceholder: parked ? parked[0] : null,
  };
}

export interface AnalysisScores {
  /** How established/trustworthy the business looks (higher = stronger). */
  brandScore: number;
  /** How hard the site pushes visitors to act (higher = stronger). */
  conversionScore: number;
  /** How much room there appears to be for faster follow-up (higher = MORE opportunity). */
  followupOpportunityScore: number;
}

/** Internal prioritization scores. Never shown to prospects. */
export function scoreSignals(s: WebsiteSignals, now: Date = new Date()): AnalysisScores {
  const year = now.getFullYear();
  let brand = 0;
  if (!s.headlineIsGeneric) brand += 15;
  if (s.metaDescription) brand += 5;
  if (s.hasViewportMeta) brand += 10;
  if (s.reviewsMentioned) brand += s.reviewsPosition !== null && s.reviewsPosition <= 0.5 ? 15 : 8;
  if (s.licenseOrInsured) brand += 12;
  if (s.certifications.length > 0) brand += 5;
  if (s.yearsInBusinessClaim) brand += 8;
  if (s.copyrightYear === null) brand += 5;
  else if (s.copyrightYear >= year - 1) brand += 10;
  if (s.socialLinkCount > 0) brand += 5;
  if (s.servicesClear) brand += 10;
  if (s.phoneOnHomepage) brand += 5;
  if (s.parkedOrPlaceholder) brand = Math.min(brand, 10);

  let conversion = 0;
  if (s.hasPrimaryCta) conversion += 20;
  if (s.phoneOnHomepage) conversion += s.phoneNearTop ? 15 : 8;
  if (s.phoneClickable) conversion += 10;
  if (s.formCount > 0) conversion += 15;
  if (s.formCount > 0 && s.maxFormFields <= 7) conversion += 10;
  if (s.onlineBooking) conversion += 15;
  if (s.chatWidget || s.textOption) conversion += 10;
  if (s.contactPage) conversion += 5;

  let followup = 0;
  if (!s.chatWidget && !s.textOption) followup += 25;
  if (!s.onlineBooking) followup += 20;
  if (s.formCount > 0 && !s.responseTimePromise) followup += 15;
  if (!s.afterHoursLanguage) followup += 10;
  if (s.phoneOnHomepage) followup += 15; // calls are the main channel → missed-call recovery matters
  if (s.formCount === 0 && !s.onlineBooking) followup += 15;

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return {
    brandScore: clamp(brand),
    conversionScore: clamp(conversion),
    followupOpportunityScore: clamp(followup),
  };
}
