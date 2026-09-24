import { extractSite } from "@/lib/scanner/extractor";
import type { ExtractedSite } from "@/lib/scanner/types";
import { generateJson, getLLM, type LLMClient } from "../llm";
import { deriveAngle, deriveObservations, summarizeSignals } from "./observations";
import { extractSignals, scoreSignals, type WebsiteSignals } from "./signals";
import { llmAnalysisSchema, type WebsiteAnalysisResult } from "./types";

export class WebsiteFetchError extends Error {}

export interface AnalyzeContext {
  companyName: string;
  industry: string | null;
  city: string | null;
  state: string | null;
}

const SYSTEM_PROMPT = `You review local service businesses' websites for Greenstar Solutions, from the point of view of a potential customer comparing a few companies.

You receive DETERMINISTIC SIGNALS extracted from the site, a list of CANDIDATE OBSERVATIONS derived from those signals, and a text excerpt.

Rules:
- Every observation must be backed by the signals or a direct quote from the excerpt. Put that backing in "evidence".
- Never claim to know internal systems. Say "I couldn't find…", "the site doesn't show…", "there may be an opportunity to…". Never say "you don't follow up" or "you lose calls".
- No statistics, percentages, or revenue numbers. No invented reviews, awards, or facts.
- Prefer specific, visual, verifiable observations (a quote from their headline, where reviews sit, a dated footer) over generic advice.
- Observation types: brand (how established/trustworthy it looks), conversion (how easy it is to take the next step), followup (speed/availability of response after someone reaches out).
- Return 1-3 observations, strongest first. Plain English, one or two sentences each.
- recommendedAngle: one sentence on how a cold email should open for THIS business.
- Respond with a single JSON object: {"websiteSummary": string, "observations": [{"type","observation","evidence","confidence"}], "recommendedAngle": string}. No markdown.`;

export async function fetchSite(url: string): Promise<ExtractedSite> {
  try {
    return await extractSite(url);
  } catch (error) {
    throw new WebsiteFetchError((error as Error).message);
  }
}

/** Deterministic analysis — always available, used as the LLM fallback. */
export function analyzeSignalsDeterministic(signals: WebsiteSignals, ctx: AnalyzeContext, now = new Date()): WebsiteAnalysisResult {
  const observations = deriveObservations(signals, now);
  const top = pickTop(observations);
  return {
    websiteSummary: summarizeSignals(signals, ctx.companyName),
    ...scoreSignals(signals, now),
    observations: top,
    recommendedAngle: deriveAngle(top),
    source: "fallback",
    model: null,
  };
}

/** Top 3 with at least one brand and one follow-up observation when available. */
function pickTop(observations: ReturnType<typeof deriveObservations>) {
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...observations].sort((a, b) => rank[a.confidence] - rank[b.confidence]);
  const picked = sorted.slice(0, 3);
  const followup = sorted.find((o) => o.type === "followup");
  if (followup && !picked.includes(followup)) picked[picked.length - 1] = followup;
  return picked;
}

export async function analyzeWebsite(
  url: string,
  ctx: AnalyzeContext,
  options: { llm?: LLMClient | null; site?: ExtractedSite } = {}
): Promise<{ result: WebsiteAnalysisResult; signals: WebsiteSignals; llmError: string | null }> {
  const site = options.site ?? (await fetchSite(url));
  const signals = extractSignals(site);
  const deterministic = analyzeSignalsDeterministic(signals, ctx);
  const llm = options.llm === undefined ? await getLLM() : options.llm;
  if (!llm || signals.parkedOrPlaceholder) {
    return { result: deterministic, signals, llmError: null };
  }

  try {
    const ai = await generateJson(llm, {
      system: SYSTEM_PROMPT,
      maxTokens: 1500,
      temperature: 0.2,
      schema: llmAnalysisSchema,
      prompt: JSON.stringify(
        {
          business: ctx,
          signals,
          candidate_observations: deriveObservations(signals),
          homepage_excerpt: (site.pages[0]?.text ?? "").slice(0, 3500),
          other_pages: site.pages.slice(1).map((p) => ({ kind: p.kind, title: p.title, excerpt: p.text.slice(0, 800) })),
        },
        null,
        2
      ),
    });
    return {
      result: {
        ...deterministic,
        websiteSummary: ai.websiteSummary,
        observations: ai.observations.slice(0, 3),
        recommendedAngle: ai.recommendedAngle,
        source: "ai",
        model: llm.model,
      },
      signals,
      llmError: null,
    };
  } catch (error) {
    return { result: deterministic, signals, llmError: (error as Error).message };
  }
}
