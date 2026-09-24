import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { errorMessage, logActivity } from "../core/activity";
import { getLLM } from "../llm";
import { latestAnalysis } from "../website-analysis/service";
import type { AnalysisObservation } from "../website-analysis/types";
import { generateSequence } from "./generate";
import { parseSequence } from "./sequence";

const MAX_DRAFT_ATTEMPTS = 2;

/** Generates DRAFT messages for every step of one campaign lead. */
export async function draftCampaignLead(campaignLeadId: string): Promise<boolean> {
  const claim = await db
    .update(schema.outboundCampaignLeads)
    .set({ draftAttempts: sql`${schema.outboundCampaignLeads.draftAttempts} + 1`, updatedAt: new Date() })
    .where(and(eq(schema.outboundCampaignLeads.id, campaignLeadId), eq(schema.outboundCampaignLeads.status, "PENDING_DRAFT")))
    .run();
  if (claim.rowsAffected !== 1) return false;

  const cl = await db.select().from(schema.outboundCampaignLeads).where(eq(schema.outboundCampaignLeads.id, campaignLeadId)).get();
  if (!cl) return false;
  const [lead, campaign, analysis] = await Promise.all([
    db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, cl.leadId)).get(),
    db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.id, cl.campaignId)).get(),
    latestAnalysis(cl.leadId),
  ]);
  if (!lead || !campaign) return false;

  try {
    if (!analysis) throw new Error("Lead has no website analysis yet");
    const sequence = parseSequence(campaign.sequenceJson);
    const generated = await generateSequence({
      lead,
      observations: JSON.parse(analysis.observationsJson) as AnalysisObservation[],
      recommendedAngle: analysis.recommendedAngle,
      websiteSummary: analysis.websiteSummary,
      sequence,
      llm: await getLLM(),
    });
    if (generated.llmError) {
      await logActivity({
        leadId: lead.id,
        campaignId: campaign.id,
        type: "MESSAGE_GENERATION_FAILED",
        level: "warn",
        message: `LLM draft unusable, used template fallback. ${generated.llmError.slice(0, 400)}`,
      });
    }

    const initialStatus = campaign.requireApproval ? "DRAFT" : "APPROVED";
    // Replace any earlier unsent drafts (regeneration).
    await db
      .delete(schema.outboundMessages)
      .where(
        and(
          eq(schema.outboundMessages.campaignLeadId, cl.id),
          inArray(schema.outboundMessages.status, ["DRAFT", "APPROVED"])
        )
      )
      .run();
    for (const message of generated.messages) {
      await db
        .insert(schema.outboundMessages)
        .values({
          leadId: lead.id,
          campaignId: campaign.id,
          campaignLeadId: cl.id,
          sequenceStep: message.step,
          subject: message.subject,
          body: message.body,
          status: initialStatus,
          generationSource: generated.source,
          lintJson: JSON.stringify(generated.lint[message.step] ?? []),
        })
        .run();
    }
    await db
      .update(schema.outboundCampaignLeads)
      .set({ status: campaign.requireApproval ? "DRAFTED" : "APPROVED", updatedAt: new Date() })
      .where(eq(schema.outboundCampaignLeads.id, cl.id))
      .run();
    await logActivity({
      leadId: lead.id,
      campaignId: campaign.id,
      type: "MESSAGES_DRAFTED",
      message: `${generated.messages.length} messages drafted (${generated.source}) for "${campaign.name}"`,
    });
    return true;
  } catch (error) {
    const giveUp = cl.draftAttempts + 1 >= MAX_DRAFT_ATTEMPTS;
    if (giveUp) {
      await db
        .update(schema.outboundCampaignLeads)
        .set({ status: "FAILED", stopReason: errorMessage(error), updatedAt: new Date() })
        .where(eq(schema.outboundCampaignLeads.id, cl.id))
        .run();
    }
    await logActivity({
      leadId: lead.id,
      campaignId: campaign.id,
      type: "MESSAGE_GENERATION_FAILED",
      level: "error",
      message: `${errorMessage(error)}${giveUp ? " — giving up" : " — will retry"}`,
    });
    return false;
  }
}

export async function processDraftQueue(limit: number): Promise<number> {
  const pending = await db
    .select({ id: schema.outboundCampaignLeads.id })
    .from(schema.outboundCampaignLeads)
    .where(eq(schema.outboundCampaignLeads.status, "PENDING_DRAFT"))
    .orderBy(asc(schema.outboundCampaignLeads.createdAt))
    .limit(limit)
    .all();
  let drafted = 0;
  for (const row of pending) if (await draftCampaignLead(row.id)) drafted++;
  return drafted;
}
