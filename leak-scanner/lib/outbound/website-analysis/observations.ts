import { possessive } from "../personalization/text";
import type { WebsiteSignals } from "./signals";
import type { AnalysisObservation } from "./types";

/**
 * Deterministic observation candidates, phrased as things a person noticed
 * while looking at the site — never claims about the business's internal
 * systems. Ordered strongest-first. Used directly when no LLM is configured,
 * and handed to the LLM as the only facts it may build on.
 */
export function deriveObservations(s: WebsiteSignals, now: Date = new Date()): AnalysisObservation[] {
  const out: AnalysisObservation[] = [];
  const year = now.getFullYear();

  if (s.reviewCountClaim && s.reviewsPosition !== null && s.reviewsPosition > 0.5) {
    out.push({
      type: "brand",
      observation: `The site mentions ${s.reviewCountClaim}+ reviews, but they don't show up until well down the homepage — someone comparing a few companies may never scroll that far.`,
      evidence: `Review mention at ~${Math.round(s.reviewsPosition * 100)}% down the homepage`,
      confidence: "high",
    });
  } else if (s.reviewsMentioned && s.reviewsPosition !== null && s.reviewsPosition > 0.6) {
    out.push({
      type: "brand",
      observation: "Reviews/testimonials are on the site, but they sit far down the homepage instead of near the top where people decide who to call.",
      evidence: `Review language first appears ~${Math.round(s.reviewsPosition * 100)}% down the homepage`,
      confidence: "medium",
    });
  } else if (!s.reviewsMentioned && !s.reviewWidget) {
    out.push({
      type: "brand",
      observation: "I couldn't find reviews or testimonials anywhere on the pages I looked at, which is usually the first thing people check when comparing companies.",
      evidence: "No review/testimonial language or review widget detected",
      confidence: "medium",
    });
  }

  if (s.copyrightYear !== null && s.copyrightYear <= year - 3) {
    out.push({
      type: "brand",
      observation: `The footer still says © ${s.copyrightYear}, which can make the site read as unmaintained to a first-time visitor — even if the business is busier than ever.`,
      evidence: `Copyright year ${s.copyrightYear}`,
      confidence: "high",
    });
  }

  if (!s.hasViewportMeta) {
    out.push({
      type: "brand",
      observation: "The site doesn't appear to be set up for phones (no mobile viewport), so on a phone it likely loads as a shrunken desktop page.",
      evidence: "No viewport meta tag on the homepage",
      confidence: "high",
    });
  }

  if (s.headline && s.headlineIsGeneric) {
    out.push({
      type: "brand",
      observation: `The main headline ("${s.headline.slice(0, 80)}") doesn't say what the company does or where, so the first impression is generic.`,
      evidence: `H1: "${s.headline.slice(0, 80)}"`,
      confidence: "medium",
    });
  } else if (!s.headline) {
    out.push({
      type: "brand",
      observation: "The homepage doesn't lead with a clear headline, so it takes a moment to tell what the company actually does.",
      evidence: "No H1 on the homepage",
      confidence: "low",
    });
  }

  if (!s.licenseOrInsured) {
    out.push({
      type: "brand",
      observation: "I didn't see licensing or insurance mentioned on the pages I checked — a cheap trust signal a lot of homeowners look for.",
      evidence: "No licensed/insured/license # language detected",
      confidence: "medium",
    });
  }

  if (!s.hasPrimaryCta) {
    out.push({
      type: "conversion",
      observation: "There isn't an obvious next step near the top of the homepage (like \"Get a free estimate\" or \"Book service\"), so visitors have to figure out how to reach you.",
      evidence: "No call-to-action language in homepage buttons/top links",
      confidence: "high",
    });
  }

  if (!s.phoneOnHomepage) {
    out.push({
      type: "conversion",
      observation: "I couldn't find a phone number on the homepage — for someone with an urgent problem, that's often the one thing they're looking for.",
      evidence: "No phone number detected on the homepage",
      confidence: "high",
    });
  } else if (!s.phoneClickable) {
    out.push({
      type: "conversion",
      observation: `The phone number (${s.phoneOnHomepage}) isn't tap-to-call, so on a phone people have to copy it by hand.`,
      evidence: "Phone shown as text, no tel: link",
      confidence: "medium",
    });
  }

  if (s.formCount > 0 && s.maxFormFields >= 8) {
    out.push({
      type: "conversion",
      observation: `The contact form asks for ${s.maxFormFields} fields, which is a lot to fill out on a phone — shorter forms usually get more people to finish.`,
      evidence: `Form with ${s.maxFormFields} fields`,
      confidence: "medium",
    });
  } else if (s.formCount === 0 && !s.onlineBooking) {
    out.push({
      type: "conversion",
      observation: "I didn't spot a quick quote/contact form or online booking on the pages I checked — people who don't want to call right then may not have an easy way to reach out.",
      evidence: "No multi-field form or booking link in the page HTML",
      // Script-rendered forms can be invisible to a static fetch — never lead with this.
      confidence: "low",
    });
  }

  if (!s.chatWidget && !s.textOption) {
    out.push({
      type: "followup",
      observation: "I couldn't find an obvious way to text the business or get an instant reply — there may be an opportunity to respond to new inquiries faster.",
      evidence: "No chat widget, sms: link, or \"text us\" language detected",
      confidence: "medium",
    });
  }

  if (s.formCount > 0 && !s.responseTimePromise) {
    out.push({
      type: "followup",
      observation: "The form doesn't say when someone will hear back, so people who submit it may keep calling competitors in the meantime.",
      evidence: "No response-time language near forms",
      confidence: "low",
    });
  }

  if (!s.onlineBooking && s.phoneOnHomepage) {
    out.push({
      type: "followup",
      observation: "Booking seems to happen by phone only, so calls that come in while the team is on a job may be worth catching with an automatic text-back.",
      evidence: "No online booking detected; phone is the main contact path",
      confidence: "low",
    });
  }

  return out;
}

/** Picks a concise outreach angle from the strongest observations. */
export function deriveAngle(observations: AnalysisObservation[]): string {
  const brand = observations.find((o) => o.type === "brand" && o.confidence !== "low");
  const conversion = observations.find((o) => o.type === "conversion" && o.confidence !== "low");
  const followup = observations.find((o) => o.type === "followup");
  if (brand) {
    return `Lead with presentation (${brand.evidence}), then bridge to follow-up${followup ? " — no instant text/chat option seen" : ""}.`;
  }
  if (conversion) {
    return `Lead with the conversion gap (${conversion.evidence})${followup ? ", then the follow-up opportunity" : ""}.`;
  }
  if (followup) return "Site looks solid — lead with speed-to-lead: missed calls and after-hours inquiries.";
  return "Site looks strong — only reach out with a specific concept (e.g. a mockup), not a critique.";
}

export function summarizeSignals(s: WebsiteSignals, companyName: string): string {
  const parts: string[] = [];
  parts.push(s.title ? `${possessive(companyName)} site ("${s.title.slice(0, 80)}")` : `${possessive(companyName)} site`);
  parts.push(s.servicesClear ? "lists its services clearly" : "doesn't make its services obvious");
  const trust = [
    s.reviewsMentioned ? "reviews" : null,
    s.licenseOrInsured ? "licensing/insurance" : null,
    s.yearsInBusinessClaim ? `experience ("${s.yearsInBusinessClaim}")` : null,
  ].filter(Boolean);
  parts.push(trust.length ? `and shows ${trust.join(", ")}` : "and shows few trust signals");
  const paths = [
    s.phoneOnHomepage ? "phone" : null,
    s.formCount ? "form" : null,
    s.onlineBooking ? `online booking (${s.onlineBooking})` : null,
    s.chatWidget ? `chat (${s.chatWidget})` : null,
  ].filter(Boolean);
  return `${parts.join(" ")}. Contact paths: ${paths.length ? paths.join(", ") : "none obvious"}.`;
}
