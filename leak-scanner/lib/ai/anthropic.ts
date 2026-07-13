import Anthropic from "@anthropic-ai/sdk";
import { GREENSTAR_SERVICES } from "@/lib/services/catalog";
import { aiReportSchema, type AIReport } from "./report-schema";
import type { AIReportProvider, ReportInput } from "./provider";

const SYSTEM_PROMPT = `You are the report writer for the Greenstar Revenue Leak Scanner, a diagnostic tool for local small businesses.

You receive STRUCTURED FINDINGS from a deterministic scanner. Your job is to explain, summarize, and prioritize — never to invent.

Hard rules:
- Use ONLY the provided findings, scores, and recommendations. Do not invent business facts, reviews, rankings, competitors, or revenue numbers.
- If something was not detected, say "not detected" or "we couldn't find" — never assert it doesn't exist anywhere.
- For AI visibility, use hedged language: "may struggle to recommend", "likely lacks clear signals", "based on your website's visible content". Never claim to know what ChatGPT, Google, Perplexity, or other systems actually rank or recommend.
- Never guarantee revenue results.
- Scores are fixed inputs. Repeat them exactly; never change or re-estimate them.
- Write in plain English for a busy business owner. Confident, specific, warm, zero jargon.
- Respond with a single JSON object matching the requested schema. No markdown, no commentary.`;

function buildUserPrompt(input: ReportInput): string {
  const services = GREENSTAR_SERVICES.map(
    (s) => `- ${s.id}: ${s.name} — ${s.description}`
  ).join("\n");

  return JSON.stringify(
    {
      instructions:
        "Produce the report JSON. category_summaries must contain exactly 5 entries, one per category: conversion, local, ai_visibility, trust, follow_up. top_revenue_leaks: 3-7 items drawn from the recommendations, most severe first. priority_roadmap items are short imperative sentences. greenstar_service_matches: 2-4 services from the catalog that map to the biggest issues, with reasons grounded in findings.",
      output_schema_hint: {
        executive_summary: "string (3-5 sentences)",
        score_verdict: "string (one sentence)",
        category_summaries: [
          { category: "conversion|local|ai_visibility|trust|follow_up", summary: "string", top_issue: "string", suggested_fix: "string" },
        ],
        top_revenue_leaks: [{ title: "string", explanation: "string", severity: "critical|high|medium|low" }],
        priority_roadmap: { this_week: ["string"], this_month: ["string"], later: ["string"] },
        greenstar_service_matches: [{ service_id: "string", service_name: "string", reason: "string" }],
        email_subject: "string",
        report_intro: "string",
        report_conclusion: "string",
      },
      business: input.business,
      scores: input.scores,
      findings: input.findings,
      recommendations: input.recommendations,
      fetch_errors: input.fetchErrors,
      site_excerpt: input.siteExcerpt.slice(0, 4000),
      greenstar_service_catalog: services,
    },
    null,
    2
  );
}

export class AnthropicReportProvider implements AIReportProvider {
  name = "anthropic" as const;
  private client = new Anthropic();

  async generateReport(input: ReportInput): Promise<AIReport> {
    const response = await this.client.messages.create({
      model: process.env.AI_MODEL ?? "claude-sonnet-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Tolerate accidental code fences.
    const jsonText = text.replace(/^\s*```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
    const parsed = JSON.parse(jsonText);
    return aiReportSchema.parse(parsed);
  }
}
