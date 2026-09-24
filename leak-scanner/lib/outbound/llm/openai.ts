import { z } from "zod";
import { fetchJson } from "../core/http";
import type { LLMClient } from "./index";

const chatResponseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
});

/** Any OpenAI-compatible /chat/completions endpoint (OpenAI, OpenRouter, Groq…). */
export class OpenAICompatibleLLM implements LLMClient {
  provider = "openai";
  constructor(readonly model: string) {}

  async complete(req: { system: string; prompt: string; maxTokens?: number; temperature?: number }) {
    const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const raw = await fetchJson(`${base}/chat/completions`, {
      method: "POST",
      timeoutMs: 60_000,
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: {
        model: this.model,
        max_tokens: req.maxTokens ?? 2000,
        ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.prompt },
        ],
      },
    });
    return chatResponseSchema.parse(raw).choices[0].message.content ?? "";
  }
}
