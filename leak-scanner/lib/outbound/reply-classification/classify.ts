import { z } from "zod";
import { OUTBOUND_REPLY_CLASSIFICATIONS } from "@/lib/db/schema";
import { generateJson, type LLMClient } from "../llm";
import { classifyByRules, stripQuoted, type ClassificationResult } from "./rules";

const llmSchema = z.object({
  classification: z.enum(OUTBOUND_REPLY_CLASSIFICATIONS),
  confidence: z.enum(["high", "medium", "low"]),
  reason: z.string().max(300),
});

const SYSTEM = `Classify a prospect's reply to a cold email from Greenstar Solutions (a studio that redesigns local service businesses' websites and automates lead follow-up).

Categories:
- INTERESTED: wants to see the mockup/ideas, wants to talk, or otherwise says yes.
- QUESTION: asks something (price, who you are, what's involved) without a clear yes/no.
- NOT_NOW: open to it but timing is wrong.
- NOT_INTERESTED: declines.
- DO_NOT_CONTACT: asks to stop/unsubscribe/remove, or is hostile.
- OUT_OF_OFFICE: automatic reply.
- UNKNOWN: anything else.

When in doubt between a rejection and DO_NOT_CONTACT, choose DO_NOT_CONTACT. Only use INTERESTED with high confidence when the intent is unambiguous.
Respond with ONLY JSON: {"classification": "...", "confidence": "high|medium|low", "reason": "..."}`;

/**
 * Deterministic rules first (opt-outs are never left to a model), then the
 * LLM for anything the rules can't place, then UNKNOWN.
 */
export async function classifyReply(text: string, llm: LLMClient | null): Promise<ClassificationResult> {
  const byRule = classifyByRules(text);
  if (byRule && (byRule.confidence === "high" || !llm)) return byRule;
  if (!llm) return { classification: "UNKNOWN", confidence: "low", source: "rule", reason: "no rule matched and no LLM configured" };
  try {
    const result = await generateJson(llm, {
      system: SYSTEM,
      prompt: `Reply (quoted history removed):\n"""\n${stripQuoted(text).slice(0, 3000)}\n"""`,
      schema: llmSchema,
      maxTokens: 300,
      temperature: 0,
    });
    return { ...result, source: "ai" };
  } catch (error) {
    return byRule ?? { classification: "UNKNOWN", confidence: "low", source: "rule", reason: `LLM failed: ${(error as Error).message.slice(0, 120)}` };
  }
}
