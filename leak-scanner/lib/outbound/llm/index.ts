import type { z } from "zod";

/**
 * Provider-agnostic LLM access for the outbound engine. Everything upstream
 * asks for "JSON matching this Zod schema" — nothing imports a vendor SDK.
 *
 * Env:
 *   OUTBOUND_LLM_PROVIDER = anthropic | openai | none
 *     (default: anthropic when ANTHROPIC_API_KEY is set, else none)
 *   OUTBOUND_LLM_MODEL    = model id (provider default otherwise)
 *   OPENAI_API_KEY / OPENAI_BASE_URL for any OpenAI-compatible endpoint.
 *
 * `none` is a real mode: every caller has a deterministic fallback.
 */
export interface JsonRequest<T> {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMClient {
  provider: string;
  model: string;
  /** Raw completion text. */
  complete(req: { system: string; prompt: string; maxTokens?: number; temperature?: number }): Promise<string>;
}

export class LLMOutputError extends Error {}

export function llmProviderName(): "anthropic" | "openai" | "none" {
  const explicit = process.env.OUTBOUND_LLM_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "openai" || explicit === "none") return explicit;
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "none";
}

export async function getLLM(): Promise<LLMClient | null> {
  const provider = llmProviderName();
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const { AnthropicLLM } = await import("./anthropic");
    return new AnthropicLLM(process.env.OUTBOUND_LLM_MODEL || process.env.AI_MODEL || "claude-sonnet-5");
  }
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    const { OpenAICompatibleLLM } = await import("./openai");
    return new OpenAICompatibleLLM(process.env.OUTBOUND_LLM_MODEL || "gpt-4o-mini");
  }
  return null;
}

/** Strips accidental code fences / prose around a JSON object. */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/^\s*```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new LLMOutputError("Model did not return valid JSON");
  }
}

/**
 * One attempt + one retry (with the validation error fed back), then throws.
 * Callers catch and fall back to deterministic output.
 */
export async function generateJson<T>(llm: LLMClient, req: JsonRequest<T>): Promise<T> {
  let prompt = req.prompt;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await llm.complete({
      system: req.system,
      prompt,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
    });
    try {
      return req.schema.parse(extractJson(text));
    } catch (error) {
      lastError = error;
      prompt = `${req.prompt}\n\nYour previous answer was rejected: ${(error as Error).message.slice(0, 600)}\nReturn ONLY the corrected JSON object.`;
    }
  }
  throw new LLMOutputError(`Invalid model output: ${(lastError as Error)?.message?.slice(0, 300)}`);
}
