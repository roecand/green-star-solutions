import type { ReplyClassification } from "@/lib/db/schema";

export interface ClassificationResult {
  classification: ReplyClassification;
  confidence: "high" | "medium" | "low";
  source: "rule" | "ai";
  reason: string;
}

/**
 * Removes quoted history and signatures so rules only see what the prospect
 * actually wrote ("On Tue, Robert wrote:" … and "> " lines).
 */
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) continue;
    if (/^\s*On .{3,120}wrote:\s*$/i.test(line)) break;
    if (/^\s*-{2,}\s*Original Message\s*-{2,}/i.test(line)) break;
    if (/^\s*From:\s.+/i.test(line) && out.length > 0) break;
    if (/^\s*(--|__)\s*$/.test(line)) break;
    if (/^\s*Sent from my (iPhone|Android|phone|iPad)/i.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

type Rule = { classification: ReplyClassification; pattern: RegExp; reason: string };

// Order matters: opt-outs beat everything, then auto-replies, then rejections
// (so "not interested, remove me" is DO_NOT_CONTACT, and "no thanks" never
// reads as interest).
const RULES: Rule[] = [
  {
    classification: "DO_NOT_CONTACT",
    pattern:
      /\b(unsubscribe|remove me|take me off|stop (emailing|contacting|sending)|do not (contact|email)|don'?t (contact|email) (me|us)( again)?|opt[- ]?out|lose my (email|number)|report(ing)? (you|this) (as|for) spam|cease and desist|^stop$)\b/im,
    reason: "explicit opt-out language",
  },
  {
    classification: "OUT_OF_OFFICE",
    pattern:
      /\b(out of (the )?office|auto(matic)?[- ]?reply|on (vacation|holiday|leave|pto)|away from (my|the) (desk|office)|limited access to (my )?email|i('| a)m currently (away|out)|will (return|be back) on|this (inbox|mailbox) is (not|no longer) monitored)\b/i,
    reason: "auto-reply / out-of-office language",
  },
  {
    classification: "NOT_INTERESTED",
    pattern:
      /\b(not interested|no thanks|no thank you|we'?re (all )?(set|good)|we('| a)re happy with|already (have|work with|use) (a|an|someone|our)|not (a fit|for us|looking)|pass on this|no need|we'?ll pass|please don'?t)\b/i,
    reason: "explicit rejection",
  },
  {
    classification: "NOT_NOW",
    pattern:
      /\b(not (right )?now|maybe later|bad time|busy season|reach (back )?out (in|next|after)|check back|try (me|us) (again )?(in|next|later)|next (month|quarter|year)|after (the )?(summer|winter|holidays?|season)|in a few (weeks|months)|not a priority)\b/i,
    reason: "timing objection",
  },
  {
    classification: "INTERESTED",
    pattern:
      /^\s*(yes|yeah|yep|sure|ok(ay)?|absolutely|definitely|please do|go ahead|sounds good|send (it|them|it over|them over|me)|i'?d (love|like) to see|let'?s (see|talk|chat)|interested)\b|\b(send (it|them|the mockup|the ideas|it over)|i'?d (love|like) to see|would love to see|please send|show me|let'?s (talk|chat|set up|hop on)|give me a call|call me|what('| i)s your availability|when are you free)\b/i,
    reason: "positive / asks to see more",
  },
];

/** Returns a rule-based result, or null when no rule is confident. */
export function classifyByRules(rawText: string): ClassificationResult | null {
  const text = stripQuoted(rawText);
  if (!text) return { classification: "UNKNOWN", confidence: "low", source: "rule", reason: "empty reply" };
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      // A positive keyword inside a question ("send what?") or with "but" hedging is weaker.
      const hedged = rule.classification === "INTERESTED" && /\b(but|how much|cost|price|what exactly|who are you)\b/i.test(text);
      return {
        classification: hedged ? "QUESTION" : rule.classification,
        confidence: hedged ? "medium" : "high",
        source: "rule",
        reason: hedged ? "positive signal mixed with a question" : rule.reason,
      };
    }
  }
  if (/\?\s*$/m.test(text) && text.length < 600) {
    return { classification: "QUESTION", confidence: "medium", source: "rule", reason: "reply is a question" };
  }
  return null;
}
