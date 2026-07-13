import type { ScanContext } from "@/lib/scanner/types";
import type { Finding, CategoryScores } from "@/lib/scanner/types";
import type { RecommendationDraft } from "@/lib/scoring/recommendations";
import type { AIReport } from "./report-schema";

export interface ReportInput {
  business: ScanContext & { websiteUrl: string };
  scores: CategoryScores;
  findings: Finding[];
  recommendations: RecommendationDraft[];
  /** Site text excerpt for tone/context only — facts must come from findings. */
  siteExcerpt: string;
  fetchErrors: Array<{ url: string; error: string }>;
}

export interface AIReportProvider {
  name: "anthropic" | "fallback";
  generateReport(input: ReportInput): Promise<AIReport>;
}

export async function generateReportWithFallback(
  input: ReportInput
): Promise<{ report: AIReport; source: "ai" | "fallback" }> {
  const { buildFallbackReport } = await import("./fallback");

  if (process.env.ANTHROPIC_API_KEY) {
    const { AnthropicReportProvider } = await import("./anthropic");
    const provider = new AnthropicReportProvider();
    // One initial attempt plus one retry, then deterministic fallback.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const report = await provider.generateReport(input);
        return { report, source: "ai" };
      } catch (error) {
        console.error(`AI report attempt ${attempt + 1} failed`, error);
      }
    }
  }

  return { report: buildFallbackReport(input), source: "fallback" };
}
