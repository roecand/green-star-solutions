import { z } from "zod";

/**
 * Trims over-long model text at a sentence (or word) boundary instead of
 * rejecting the whole report. Required-ness, enums and section counts stay
 * strict; a paragraph that runs 40 characters long must not throw away an
 * otherwise good AI report (it used to, silently falling back to templates).
 */
export function fitText(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentenceEnd > max * 0.5) return cut.slice(0, sentenceEnd + 1);
  const wordEnd = cut.lastIndexOf(" ");
  return `${cut.slice(0, wordEnd > 0 ? wordEnd : max - 1).replace(/[,;:\s]+$/, "")}…`;
}

const text = (max: number) => z.string().trim().min(1).transform((v) => fitText(v, max));
const list = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).transform((a) => a.slice(0, max));

export const categorySummarySchema = z.object({
  category: z.enum(["conversion", "local", "ai_visibility", "trust", "follow_up"]),
  summary: text(600),
  top_issue: text(300),
  suggested_fix: text(300),
});

export const revenueLeakSchema = z.object({
  title: text(160),
  explanation: text(500),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

export const serviceMatchSchema = z.object({
  service_id: text(60),
  service_name: text(120),
  reason: text(400),
});

export const aiReportSchema = z.object({
  executive_summary: text(1200),
  score_verdict: text(300),
  category_summaries: z.array(categorySummarySchema).length(5),
  top_revenue_leaks: list(revenueLeakSchema, 7).refine((a) => a.length >= 1, "at least one leak"),
  priority_roadmap: z.object({
    this_week: list(text(300), 6),
    this_month: list(text(300), 6),
    later: list(text(300), 8),
  }),
  greenstar_service_matches: list(serviceMatchSchema, 5).refine((a) => a.length >= 1, "at least one service match"),
  email_subject: text(140),
  report_intro: text(800),
  report_conclusion: text(800),
});

export type AIReport = z.infer<typeof aiReportSchema>;
export type CategorySummary = z.infer<typeof categorySummarySchema>;
