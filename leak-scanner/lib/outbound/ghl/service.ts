import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutboundLead, OutboundReply } from "@/lib/db/schema";
import { errorMessage, logActivity } from "../core/activity";
import type { AnalysisObservation } from "../website-analysis/types";
import { GhlClient, ghlConfig } from "./client";

export const GHL_TAGS = {
  outbound: "greenstar-outbound",
  brand: "brand-opportunity",
  followup: "followup-opportunity",
  interested: "interested",
  notNow: "not-now",
} as const;

export function ghlConfigured(): boolean {
  return ghlConfig() !== null;
}

/** Tags derived from the lead's analysis, plus any extra status tags. */
export function tagsForLead(observations: AnalysisObservation[], extra: string[]): string[] {
  const tags = new Set<string>([GHL_TAGS.outbound, ...extra]);
  if (observations.some((o) => o.type === "brand" || o.type === "conversion")) tags.add(GHL_TAGS.brand);
  if (observations.some((o) => o.type === "followup")) tags.add(GHL_TAGS.followup);
  return [...tags];
}

export type SyncResult = { status: "synced"; contactId: string; opportunityId: string | null } | { status: "skipped"; reason: string } | { status: "failed"; error: string };

/**
 * Pushes an interested (or not-now) lead into GHL: upsert contact → tags →
 * note with the original email + reply + analysis → opportunity (once).
 * Idempotent: stored ghlContactId / ghlOpportunityId are reused.
 */
export async function syncLeadToGhl(
  lead: OutboundLead,
  context: { reply: OutboundReply | null; statusTag: string; originalMessage: { subject: string; body: string } | null },
  client?: GhlClient
): Promise<SyncResult> {
  const config = ghlConfig();
  if (!config) {
    await logActivity({ leadId: lead.id, type: "CRM_SYNC_SKIPPED", level: "warn", message: "GHL not configured (GHL_API_TOKEN / GHL_LOCATION_ID)" });
    return { status: "skipped", reason: "GHL not configured" };
  }
  const ghl = client ?? new GhlClient(config);
  try {
    const analysis = await db
      .select()
      .from(schema.outboundLeadAnalyses)
      .where(eq(schema.outboundLeadAnalyses.leadId, lead.id))
      .orderBy(schema.outboundLeadAnalyses.analyzedAt)
      .all()
      .then((rows) => rows[rows.length - 1]);
    const observations: AnalysisObservation[] = analysis ? JSON.parse(analysis.observationsJson) : [];
    const tags = tagsForLead(observations, [context.statusTag]);

    const contactId = await ghl.upsertContact({
      email: lead.email,
      phone: lead.phone,
      firstName: lead.contactFirstName,
      lastName: lead.contactLastName,
      companyName: lead.companyName,
      website: lead.website,
      city: lead.city,
      state: lead.state,
      tags,
      source: "Greenstar outbound",
    });
    await ghl.addTags(contactId, tags);
    await ghl.addNote(contactId, buildNote(lead, context, observations, analysis?.recommendedAngle ?? null));

    let opportunityId = lead.ghlOpportunityId;
    if (!opportunityId && context.statusTag === GHL_TAGS.interested) {
      opportunityId = await ghl.createOpportunity({ contactId, name: `${lead.companyName} — Greenstar outbound` });
    }
    await db
      .update(schema.outboundLeads)
      .set({ ghlContactId: contactId, ghlOpportunityId: opportunityId ?? null, updatedAt: new Date() })
      .where(eq(schema.outboundLeads.id, lead.id))
      .run();
    await logActivity({
      leadId: lead.id,
      type: "CRM_SYNCED",
      message: `GHL contact ${contactId}${opportunityId ? `, opportunity ${opportunityId}` : ""} (tags: ${tags.join(", ")})`,
    });
    return { status: "synced", contactId, opportunityId: opportunityId ?? null };
  } catch (error) {
    await logActivity({ leadId: lead.id, type: "CRM_SYNC_FAILED", level: "error", message: errorMessage(error) });
    return { status: "failed", error: errorMessage(error) };
  }
}

/** Settings-page connection check: token, location and pipeline lookup. */
export async function testGhlConnection(): Promise<string> {
  const config = ghlConfig();
  if (!config) return "GHL_API_TOKEN and GHL_LOCATION_ID are not both set.";
  const client = new GhlClient(config);
  const pipelines = await client.listPipelines();
  const r = await client.resolvePipeline();
  const pipeline = pipelines.find((p) => p.id === r.pipelineId)!;
  const stageName = (id: string | null) => pipeline.stages.find((s) => s.id === id)?.name ?? "not found";
  return `Connected. Pipeline "${pipeline.name}": new interested leads → "${stageName(r.stageInterestedId)}", booked → "${stageName(r.stageBookedId)}".`;
}

/** Moves an existing opportunity to the booked stage (manual "Booked" action). */
export async function markBookedInGhl(lead: OutboundLead): Promise<void> {
  const config = ghlConfig();
  if (!config || !lead.ghlOpportunityId) return;
  try {
    const client = new GhlClient(config);
    const { stageBookedId } = await client.resolvePipeline();
    if (!stageBookedId) return;
    await client.moveOpportunityStage(lead.ghlOpportunityId, stageBookedId);
    await logActivity({ leadId: lead.id, type: "CRM_STAGE_MOVED", message: "Opportunity moved to booked stage" });
  } catch (error) {
    await logActivity({ leadId: lead.id, type: "CRM_SYNC_FAILED", level: "error", message: errorMessage(error) });
  }
}

function buildNote(
  lead: OutboundLead,
  context: { reply: OutboundReply | null; originalMessage: { subject: string; body: string } | null },
  observations: AnalysisObservation[],
  angle: string | null
): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return [
    `Greenstar outbound — ${context.reply?.classification ?? "update"}`,
    context.reply ? `\nTHEIR REPLY:\n${context.reply.content.slice(0, 1500)}` : "",
    context.originalMessage ? `\nOUR EMAIL (${context.originalMessage.subject}):\n${context.originalMessage.body.slice(0, 1200)}` : "",
    observations.length ? `\nWEBSITE OBSERVATIONS:\n${observations.map((o) => `- [${o.type}] ${o.observation}`).join("\n")}` : "",
    angle ? `\nANGLE: ${angle}` : "",
    appUrl ? `\nFull record: ${appUrl}/outbound/leads/${lead.id}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
