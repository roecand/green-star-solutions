import { z } from "zod";

export const observationSchema = z.object({
  type: z.enum(["brand", "conversion", "followup"]),
  observation: z.string().min(10).max(400),
  /** What on the site backs this up — quoted or paraphrased. */
  evidence: z.string().max(300).default(""),
  confidence: z.enum(["high", "medium", "low"]),
});
export type AnalysisObservation = z.infer<typeof observationSchema>;

export const llmAnalysisSchema = z.object({
  websiteSummary: z.string().min(10).max(800),
  observations: z.array(observationSchema).min(1).max(5),
  recommendedAngle: z.string().min(10).max(400),
});
export type LlmAnalysis = z.infer<typeof llmAnalysisSchema>;

export interface WebsiteAnalysisResult {
  websiteSummary: string;
  brandScore: number;
  conversionScore: number;
  followupOpportunityScore: number;
  observations: AnalysisObservation[];
  recommendedAngle: string;
  source: "ai" | "fallback";
  model: string | null;
}
