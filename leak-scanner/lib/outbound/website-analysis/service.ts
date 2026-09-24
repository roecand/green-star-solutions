import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutboundLead } from "@/lib/db/schema";
import { errorMessage, logActivity } from "../core/activity";
import { getOutboundSettings } from "../core/settings";
import { computePriority } from "../lead-scoring/priority";
import { isEmailSuppressed } from "../replies/suppression";
import { analyzeWebsite, WebsiteFetchError } from "./analyze";

export const MAX_ANALYSIS_ATTEMPTS = 2;

/** Statuses from which a lead may be (re)queued for analysis. */
const QUEUEABLE = ["NEW", "ANALYSIS_FAILED", "READY", "DISQUALIFIED"] as const;

export async function queueLeadsForAnalysis(leadIds: string[] | "all_new"): Promise<number> {
  const where =
    leadIds === "all_new"
      ? eq(schema.outboundLeads.status, "NEW")
      : and(inArray(schema.outboundLeads.id, leadIds), inArray(schema.outboundLeads.status, [...QUEUEABLE]));
  const result = await db
    .update(schema.outboundLeads)
    .set({ status: "QUEUED", analysisAttempts: 0, lastError: null, updatedAt: new Date() })
    .where(where)
    .run();
  return result.rowsAffected;
}

/** Claims up to `limit` QUEUED leads and analyzes them sequentially. */
export async function processAnalysisQueue(limit: number): Promise<{ analyzed: number; failed: number }> {
  const queued = await db
    .select()
    .from(schema.outboundLeads)
    .where(eq(schema.outboundLeads.status, "QUEUED"))
    .orderBy(asc(schema.outboundLeads.createdAt))
    .limit(limit)
    .all();
  let analyzed = 0;
  let failed = 0;
  for (const lead of queued) {
    const ok = await analyzeLead(lead);
    if (ok) analyzed++;
    else failed++;
  }
  return { analyzed, failed };
}

/** Full per-lead pipeline. Returns true when the lead got an analysis. */
export async function analyzeLead(lead: OutboundLead): Promise<boolean> {
  // Atomic claim so two ticks can never analyze the same lead.
  const claim = await db
    .update(schema.outboundLeads)
    .set({
      status: "ANALYZING",
      analysisAttempts: sql`${schema.outboundLeads.analysisAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.outboundLeads.id, lead.id), inArray(schema.outboundLeads.status, ["QUEUED", ...QUEUEABLE])))
    .run();
  if (claim.rowsAffected !== 1) return false;
  const attempts = lead.analysisAttempts + 1;
  const settings = await getOutboundSettings();
  const suppressed = await isEmailSuppressed(lead.email);

  if (!lead.website) {
    const priority = computePriority({
      email: lead.email,
      industry: lead.industry,
      targetIndustries: settings.targetIndustries,
      websiteReachable: false,
      signals: null,
      scores: null,
      suppressed,
    });
    await finish(lead.id, "DISQUALIFIED", priority, "No website to analyze — handle manually (website build opportunity)");
    await logActivity({ leadId: lead.id, type: "ANALYSIS_SKIPPED", level: "warn", message: "No website on record" });
    return false;
  }

  try {
    const { result, signals, llmError } = await analyzeWebsite(lead.website, {
      companyName: lead.companyName,
      industry: lead.industry,
      city: lead.city,
      state: lead.state,
    });
    if (llmError) {
      await logActivity({
        leadId: lead.id,
        type: "ANALYSIS_FAILED",
        level: "warn",
        message: `LLM analysis failed; used deterministic analysis. ${llmError}`,
      });
    }

    await db
      .insert(schema.outboundLeadAnalyses)
      .values({
        leadId: lead.id,
        websiteSummary: result.websiteSummary,
        brandScore: result.brandScore,
        conversionScore: result.conversionScore,
        followupOpportunityScore: result.followupOpportunityScore,
        observationsJson: JSON.stringify(result.observations),
        recommendedAngle: result.recommendedAngle,
        signalsJson: JSON.stringify(signals),
        source: result.source,
        model: result.model,
      })
      .run();

    const priority = computePriority({
      email: lead.email,
      industry: lead.industry,
      targetIndustries: settings.targetIndustries,
      websiteReachable: true,
      signals,
      scores: result,
      suppressed,
    });
    const status =
      suppressed
        ? "DO_NOT_CONTACT"
        : priority.disqualified || priority.priorityScore < settings.minPriorityScore
          ? "DISQUALIFIED"
          : "READY";
    await finish(lead.id, status, priority, priority.disqualified);
    await logActivity({
      leadId: lead.id,
      type: "ANALYSIS_COMPLETED",
      message: `Priority ${priority.priorityScore}/100 → ${status} (${result.source})`,
      metadata: { brand: result.brandScore, conversion: result.conversionScore, followup: result.followupOpportunityScore },
    });
    return true;
  } catch (error) {
    const isFetch = error instanceof WebsiteFetchError;
    const retry = attempts < MAX_ANALYSIS_ATTEMPTS;
    await db
      .update(schema.outboundLeads)
      .set({ status: retry ? "QUEUED" : "ANALYSIS_FAILED", lastError: errorMessage(error), updatedAt: new Date() })
      .where(eq(schema.outboundLeads.id, lead.id))
      .run();
    await logActivity({
      leadId: lead.id,
      type: isFetch ? "WEBSITE_FETCH_FAILED" : "ANALYSIS_FAILED",
      level: "error",
      message: `${errorMessage(error)}${retry ? " — will retry once" : " — giving up"}`,
    });
    return false;
  }
}

async function finish(
  leadId: string,
  status: OutboundLead["status"],
  priority: ReturnType<typeof computePriority>,
  lastError: string | null
) {
  await db
    .update(schema.outboundLeads)
    .set({
      status,
      priorityScore: priority.priorityScore,
      priorityReasonsJson: JSON.stringify(priority.reasons),
      lastError,
      updatedAt: new Date(),
    })
    .where(eq(schema.outboundLeads.id, leadId))
    .run();
}

export async function latestAnalysis(leadId: string) {
  return db
    .select()
    .from(schema.outboundLeadAnalyses)
    .where(eq(schema.outboundLeadAnalyses.leadId, leadId))
    .orderBy(sql`${schema.outboundLeadAnalyses.analyzedAt} desc`)
    .limit(1)
    .get();
}
