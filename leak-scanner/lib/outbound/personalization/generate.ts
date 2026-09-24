import { z } from "zod";
import { generateJson, type LLMClient } from "../llm";
import type { AnalysisObservation } from "../website-analysis/types";
import { buildFallbackSequence, greeting, industryLabel, type PersonalizationLead } from "./fallback";
import { BANNED_PHRASES, lintSequence, type DraftMessage } from "./lint";
import type { SequenceStep } from "./sequence";

const POSITIONING =
  "We help strong service businesses look as good online as the work they actually do, then automate the follow-up so fewer opportunities slip away.";

const SYSTEM_PROMPT = `You write cold outreach emails for Robert at Greenstar Solutions, a small studio that serves local service businesses (HVAC, plumbing, roofing, electrical, landscaping, med spas, dentists).

Greenstar's positioning: "${POSITIONING}"
Two services: (1) brand/perception — website redesign, messaging, trust signals, social proof, mobile UX; (2) lead follow-up automation — CRM, missed-call text-back, reminders, reactivation.

The email must prove a human actually looked at THIS business's website.

Initial email structure (60–130 words, plain text, short paragraphs):
1. Greeting, then a highly specific observation about their site (use the provided observations/evidence — quote their headline, say where their reviews sit, mention the dated footer, etc.).
2. Why it matters from their customer's point of view.
3. One or two sentences on what Greenstar does (not "we're an agency").
4. A low-friction, permission-based question CTA as the final line, e.g. "Want me to send it?", "Would it be useful if I sent over a mockup?". Never ask for a call or a time.

Follow-ups: short (under 80 words), reply-style, same thread. Step intents:
- bump: brief nudge that restates the original observation in a new way.
- new_observation: a different useful observation (prefer follow-up/speed-to-lead) or concept.
- close_loop: polite final note, no guilt-tripping, leaves the door open.

Hard rules:
- Only use facts from the provided observations/evidence/business info. Never invent reviews, numbers, awards, owners' names, or anything about their internal systems.
- Phrase follow-up findings carefully: "I couldn't find an obvious way to text you" — never "you don't follow up" or "you're losing leads".
- No statistics or percentages. No mention of scores. No fake compliments. No exclamation-mark hype.
- Never claim a mockup already exists; offer to make or send one.
- Do not include a signature, sign-off name, or unsubscribe line — they are added automatically.
- Never use: ${BANNED_PHRASES.slice(0, 20).join("; ")}.
- Vary wording; don't reuse template phrasing across businesses.
- Follow-up subjects are "Re: <initial subject>". Initial subject: short, lowercase-ish, specific (e.g. "abc heating's homepage"), no clickbait.

Respond with ONLY a JSON object: {"messages":[{"step":1,"subject":"...","body":"..."}, ...]} with one entry per requested step. Use \\n\\n between paragraphs.`;

const llmMessagesSchema = z.object({
  messages: z
    .array(z.object({ step: z.number().int(), subject: z.string().min(1).max(120), body: z.string().min(20).max(2000) }))
    .min(1),
});

export interface GeneratedSequence {
  messages: DraftMessage[];
  source: "ai" | "fallback";
  lint: Record<number, string[]>;
  llmError: string | null;
}

export async function generateSequence(input: {
  lead: PersonalizationLead;
  observations: AnalysisObservation[];
  recommendedAngle: string;
  websiteSummary: string;
  sequence: SequenceStep[];
  llm: LLMClient | null;
}): Promise<GeneratedSequence> {
  const lintCtx = { companyName: input.lead.companyName, sequence: input.sequence };
  const fallback = () => {
    const messages = buildFallbackSequence(input.lead, input.observations, input.sequence);
    return { messages, lint: lintSequence(messages, lintCtx) };
  };

  if (!input.llm) return { ...fallback(), source: "fallback", llmError: null };

  const basePrompt = JSON.stringify(
    {
      business: {
        companyName: input.lead.companyName,
        contactFirstName: input.lead.contactFirstName,
        industry: industryLabel(input.lead.industry),
        city: input.lead.city,
      },
      greeting_to_use: greeting(input.lead.contactFirstName),
      website_summary: input.websiteSummary,
      observations: input.observations,
      recommended_angle: input.recommendedAngle,
      steps: input.sequence,
    },
    null,
    2
  );

  let prompt = basePrompt;
  let lastIssues = "";
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const { messages } = await generateJson(input.llm, {
        system: SYSTEM_PROMPT,
        prompt,
        schema: llmMessagesSchema,
        maxTokens: 2500,
        temperature: 0.7,
      });
      const cleaned = messages.map((m) => ({ ...m, body: m.body.replace(/\r\n/g, "\n").trim(), subject: m.subject.trim() }));
      const lint = lintSequence(cleaned, lintCtx);
      const failing = Object.entries(lint).filter(([, issues]) => issues.length > 0);
      if (failing.length === 0) return { messages: cleaned, source: "ai", lint, llmError: null };
      lastIssues = failing.map(([step, issues]) => `step ${step}: ${issues.join("; ")}`).join("\n");
      prompt = `${basePrompt}\n\nYour previous draft failed review:\n${lastIssues}\nRewrite ALL steps fixing these issues. Return only the JSON.`;
    }
    return { ...fallback(), source: "fallback", llmError: `Draft failed lint twice: ${lastIssues}` };
  } catch (error) {
    return { ...fallback(), source: "fallback", llmError: (error as Error).message };
  }
}
