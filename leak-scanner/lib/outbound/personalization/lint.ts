import type { SequenceStep } from "./sequence";

export interface DraftMessage {
  step: number;
  subject: string;
  body: string;
}

/**
 * Phrases that make cold email read as generic AI/agency outreach. Checked
 * case-insensitively against subject + body.
 */
export const BANNED_PHRASES = [
  "hope this email finds you well",
  "hope this finds you well",
  "hope you're doing well",
  "hope you are doing well",
  "i came across your",
  "i stumbled upon",
  "ai automation agency",
  "we're an ai",
  "we are an ai",
  "digital marketing agency",
  "i wanted to reach out",
  "just reaching out",
  "touching base",
  "circle back",
  "synergy",
  "revolutionize",
  "game-changer",
  "game changer",
  "skyrocket",
  "10x",
  "take your business to the next level",
  "next level",
  "unlock",
  "leverage",
  "cutting-edge",
  "state-of-the-art",
  "guarantee",
  "guaranteed",
  "impressive website",
  "love your website",
  "amazing work",
  "i noticed you're a leader",
  "as an industry leader",
  "don't miss out",
  "act now",
  "limited time",
];

const MEETING_ASK =
  /\b(monday|tuesday|wednesday|thursday|friday)\b|\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b(15|20|30)[- ]?min(ute)?s?\b|\b(calendar|calendly|book a (call|meeting|time)|hop on a call|jump on a call|quick call|schedule a (call|meeting))\b/i;
const STATISTIC = /\b\d+(\.\d+)?\s?%|\b\d+x\b|\bpercent\b/i;
const PLACEHOLDER = /\{\{|\}\}|\[(first ?name|company|name|business|city)\]|<(first|company)/i;
const SCORE_TALK = /\b(score|scored|\/100|out of 100|grade[ds]?)\b/i;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface LintContext {
  companyName: string;
  sequence: SequenceStep[];
}

/** Returns human-readable issues; empty array = passes. Pure. */
export function lintMessage(message: DraftMessage, ctx: LintContext): string[] {
  const issues: string[] = [];
  const step = ctx.sequence.find((s) => s.step === message.step);
  const combined = `${message.subject}\n${message.body}`.toLowerCase();
  const words = wordCount(message.body);

  for (const phrase of BANNED_PHRASES) {
    if (combined.includes(phrase)) issues.push(`banned phrase: "${phrase}"`);
  }
  if (PLACEHOLDER.test(combined)) issues.push("contains an unfilled placeholder");
  if (STATISTIC.test(message.body)) issues.push("contains a statistic/percentage (never fabricate numbers)");
  if (SCORE_TALK.test(message.body)) issues.push("mentions internal scores");
  if (!message.subject.trim()) issues.push("empty subject");
  if (message.subject.length > 70) issues.push("subject longer than 70 characters");
  if (/unsubscribe/i.test(message.body)) issues.push("body contains an unsubscribe line (the footer adds it)");

  if (step?.intent === "initial") {
    if (words < 60 || words > 130) issues.push(`initial email is ${words} words (target 60–130)`);
    const nameCore = ctx.companyName.toLowerCase().replace(/\b(llc|inc|co|corp|company|ltd)\.?$/i, "").trim();
    if (nameCore && !combined.includes(nameCore.split(/\s+/)[0])) issues.push("initial email never names the company");
    if (!/\?\s*$/.test(lastParagraph(message.body))) issues.push("initial email should end with a permission-based question CTA");
  } else if (words > 100) {
    issues.push(`follow-up is ${words} words (keep under 100)`);
  }
  if ((step?.intent === "initial" || step?.intent === "bump") && MEETING_ASK.test(message.body)) {
    issues.push("asks for a meeting/time before any interest was shown");
  }
  return issues;
}

function lastParagraph(body: string): string {
  const paragraphs = body.trim().split(/\n\s*\n/);
  return paragraphs[paragraphs.length - 1] ?? "";
}

export function lintSequence(messages: DraftMessage[], ctx: LintContext): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (const step of ctx.sequence) {
    const message = messages.find((m) => m.step === step.step);
    out[step.step] = message ? lintMessage(message, ctx) : ["missing message for this step"];
  }
  return out;
}
