import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient } from "./index";

export class AnthropicLLM implements LLMClient {
  provider = "anthropic";
  // The SDK already retries 429/5xx with backoff (maxRetries).
  private client = new Anthropic({ maxRetries: 3 });

  constructor(readonly model: string) {}

  async complete(req: { system: string; prompt: string; maxTokens?: number; temperature?: number }) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: req.maxTokens ?? 2000,
      // `temperature` is deliberately not sent: current Claude models reject
      // it (400 "temperature is deprecated for this model").
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
    });
    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
}
