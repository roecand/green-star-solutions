import { z } from "zod";

export const categorySummarySchema = z.object({
  category: z.enum(["conversion", "local", "ai_visibility", "trust", "follow_up"]),
  summary: z.string().min(1).max(600),
  top_issue: z.string().min(1).max(300),
  suggested_fix: z.string().min(1).max(300),
});

export const revenueLeakSchema = z.object({
  title: z.string().min(1).max(160),
  explanation: z.string().min(1).max(500),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

export const serviceMatchSchema = z.object({
  service_id: z.string().min(1).max(60),
  service_name: z.string().min(1).max(120),
  reason: z.string().min(1).max(400),
});

export const aiReportSchema = z.object({
  executive_summary: z.string().min(1).max(1200),
  score_verdict: z.string().min(1).max(300),
  category_summaries: z.array(categorySummarySchema).length(5),
  top_revenue_leaks: z.array(revenueLeakSchema).min(1).max(7),
  priority_roadmap: z.object({
    this_week: z.array(z.string().min(1).max(300)).max(6),
    this_month: z.array(z.string().min(1).max(300)).max(6),
    later: z.array(z.string().min(1).max(300)).max(8),
  }),
  greenstar_service_matches: z.array(serviceMatchSchema).min(1).max(5),
  email_subject: z.string().min(1).max(140),
  report_intro: z.string().min(1).max(800),
  report_conclusion: z.string().min(1).max(800),
});

export type AIReport = z.infer<typeof aiReportSchema>;
export type CategorySummary = z.infer<typeof categorySummarySchema>;
