import type { AnalysisObservation } from "../website-analysis/types";
import { possessive } from "./text";
import type { DraftMessage } from "./lint";
import type { SequenceStep } from "./sequence";

export interface PersonalizationLead {
  id: string;
  companyName: string;
  contactFirstName: string | null;
  industry: string | null;
  city: string | null;
}

const ACRONYMS = new Set(["hvac"]);

export function industryLabel(industry: string | null): string {
  if (!industry) return "local";
  return industry
    .split(/\s+/)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.toLowerCase()))
    .join(" ");
}

export function greeting(firstName: string | null): string {
  const name = firstName?.trim();
  return name ? `Hey ${name[0].toUpperCase()}${name.slice(1)} —` : "Hi there —";
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

const WHY: Record<AnalysisObservation["type"], (industry: string) => string> = {
  brand: (industry) =>
    `When someone is comparing a few ${industry} companies, that first impression does a lot of the deciding — and right now the site undersells the business.`,
  conversion: () =>
    "Most people looking are on their phone and in a hurry, so every extra step between landing and reaching you quietly costs inquiries.",
  followup: () =>
    "Whoever answers first usually gets the job, so the minutes after someone reaches out matter more than most people think.",
};

/**
 * Deterministic sequence built from the analysis observations. Used when no
 * LLM is configured or the LLM output fails lint twice. Three rotating
 * phrasings so a batch never goes out word-for-word identical.
 */
export function buildFallbackSequence(
  lead: PersonalizationLead,
  observations: AnalysisObservation[],
  sequence: SequenceStep[]
): DraftMessage[] {
  const company = lead.companyName.trim();
  const industry = industryLabel(lead.industry);
  const hi = greeting(lead.contactFirstName);
  const primary = observations.find((o) => o.type !== "followup") ?? observations[0];
  const secondary =
    observations.find((o) => o !== primary && o.type === "followup") ?? observations.find((o) => o !== primary);
  const variant = hash(lead.id) % 3;

  const subjects = [`${possessive(company)} website`, `idea for ${company}`, `${company} — homepage`];
  const subject1 = subjects[variant];
  const openers = [
    `Took a look at ${possessive(company)} site.`,
    `I was looking through ${possessive(company)} website.`,
    `Spent a few minutes on ${possessive(company)} site.`,
  ];
  const leadsWithFollowup = primary?.type === "followup";
  const ctas = leadsWithFollowup
    ? [
        `Happy to show you what an instant text-back would look like for ${company}. Want me to send an example?`,
        "I can put together a quick example of how that would work for you. Would it be useful if I sent it over?",
        "If it's helpful, I'll sketch out what that flow could look like. Want me to show you?",
      ]
    : [
        "Happy to put together a quick mockup of what I'd change. Want me to send it?",
        "I can sketch out a couple of ideas for the homepage. Would it be useful if I sent them over?",
        "If it's helpful, I'll put together a rough mockup. Want me to show you?",
      ];

  const primaryText = primary
    ? primary.observation
    : "The site does the basics, but it doesn't really show off the quality of the work.";

  const messages: DraftMessage[] = [];
  for (const step of sequence) {
    if (step.intent === "initial") {
      messages.push({
        step: step.step,
        subject: subject1,
        body: [
          `${hi}`,
          `${openers[variant]} ${primaryText}`,
          WHY[primary?.type ?? "brand"](industry),
          "That's what we do at Greenstar — make strong service businesses look as good online as the work they actually do, then tighten up the follow-up so fewer inquiries slip away.",
          ctas[variant],
        ].join("\n\n"),
      });
    } else if (step.intent === "bump") {
      messages.push({
        step: step.step,
        subject: `Re: ${subject1}`,
        body: [
          hi,
          `Following up on my note about ${possessive(company)} site — the short version is ${lowerFirst(firstClause(primaryText))}.`,
          leadsWithFollowup
            ? "Still happy to send over an example if you'd like to see it. Want me to?"
            : "Still happy to send over a mockup if you'd like to see it. Want me to?",
        ].join("\n\n"),
      });
    } else if (step.intent === "new_observation") {
      messages.push({
        step: step.step,
        subject: `Re: ${subject1}`,
        body: [
          hi,
          secondary
            ? `One more thing I noticed: ${lowerFirst(secondary.observation)}`
            : `One more idea for ${company}: a simple automatic text-back when a call gets missed, so the person hears from you in seconds instead of calling the next company on the list.`,
          "That's usually a quick fix, and it pairs well with the website side. Worth a look?",
        ].join("\n\n"),
      });
    } else {
      messages.push({
        step: step.step,
        subject: `Re: ${subject1}`,
        body: [
          hi,
          "I'll close the loop here so I'm not cluttering your inbox.",
          `If refreshing how ${company} shows up online — or speeding up follow-up on new inquiries — ever makes the list, just reply and I'll send the ideas over.`,
        ].join("\n\n"),
      });
    }
  }
  return messages;
}

function firstClause(text: string): string {
  return text.split(/[,—;]| which /)[0].replace(/\.$/, "").trim();
}

function lowerFirst(text: string): string {
  if (/^I\b/.test(text)) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}
