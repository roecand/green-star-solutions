import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { logActivity } from "../core/activity";
import { getEmailProvider, listEmailProviders } from "../email";
import { lintMessage } from "../personalization/lint";
import { DEFAULT_SEQUENCE, parseSequence, sequenceSchema } from "../personalization/sequence";
import { senderConfig } from "../personalization/render";
import { isValidTimezone } from "../sending/window";

export const campaignInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    niche: z.string().trim().max(80).optional().nullable(),
    provider: z.enum(["mock", "n8n", "smartlead"]).default("mock"),
    providerCampaignRef: z.string().trim().max(120).optional().nullable(),
    dailyLimit: z.coerce.number().int().min(1).max(500).default(30),
    sendWindowStart: z.coerce.number().int().min(0).max(23).default(8),
    sendWindowEnd: z.coerce.number().int().min(1).max(24).default(16),
    timezone: z.string().refine(isValidTimezone, "unknown timezone").default("America/Los_Angeles"),
    sendDays: z.array(z.coerce.number().int().min(1).max(7)).min(1).default([1, 2, 3, 4, 5]),
    minDelaySeconds: z.coerce.number().int().min(0).max(3600).default(180),
    requireApproval: z.boolean().default(true),
    sequence: sequenceSchema.default(DEFAULT_SEQUENCE),
  })
  .refine((c) => c.sendWindowEnd > c.sendWindowStart, { message: "send window end must be after start" });
export type CampaignInput = z.input<typeof campaignInputSchema>;

export async function createCampaign(input: CampaignInput) {
  const c = campaignInputSchema.parse(input);
  const campaign = await db
    .insert(schema.outboundCampaigns)
    .values({
      name: c.name,
      niche: c.niche ?? null,
      provider: c.provider,
      providerCampaignRef: c.providerCampaignRef || null,
      sequenceJson: JSON.stringify(c.sequence),
      dailyLimit: c.dailyLimit,
      sendWindowStart: c.sendWindowStart,
      sendWindowEnd: c.sendWindowEnd,
      timezone: c.timezone,
      sendDaysJson: JSON.stringify([...new Set(c.sendDays)].sort()),
      minDelaySeconds: c.minDelaySeconds,
      requireApproval: c.requireApproval,
    })
    .returning()
    .get();
  await logActivity({ campaignId: campaign.id, type: "CAMPAIGN_CREATED", message: campaign.name });
  return campaign;
}

/**
 * Adds READY leads (with an email, not already in an open sequence) and
 * queues them for drafting. Returns counts for the UI.
 */
export async function addLeadsToCampaign(campaignId: string, leadIds: string[]) {
  const campaign = await db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.id, campaignId)).get();
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "COMPLETED") throw new Error("Campaign is completed");
  if (leadIds.length === 0) return { added: 0, skipped: 0 };

  const leads = await db.select().from(schema.outboundLeads).where(inArray(schema.outboundLeads.id, leadIds)).all();
  const open = await db
    .select({ leadId: schema.outboundCampaignLeads.leadId })
    .from(schema.outboundCampaignLeads)
    .where(
      and(
        inArray(schema.outboundCampaignLeads.leadId, leadIds),
        inArray(schema.outboundCampaignLeads.status, ["PENDING_DRAFT", "DRAFTED", "APPROVED", "ACTIVE"])
      )
    )
    .all();
  const busy = new Set(open.map((o) => o.leadId));

  let added = 0;
  for (const lead of leads) {
    if (lead.status !== "READY" || !lead.email || busy.has(lead.id)) continue;
    const inserted = await db
      .insert(schema.outboundCampaignLeads)
      .values({ campaignId, leadId: lead.id })
      .onConflictDoNothing()
      .returning({ id: schema.outboundCampaignLeads.id })
      .all();
    if (inserted.length) {
      added++;
      await logActivity({ leadId: lead.id, campaignId, type: "ADDED_TO_CAMPAIGN", message: campaign.name });
    }
  }
  return { added, skipped: leadIds.length - added };
}

/** Approves every DRAFT message for the given campaign leads (or all DRAFTED). */
export async function approveCampaignLeads(campaignId: string, campaignLeadIds: string[] | "all_drafted") {
  const rows = await db
    .select()
    .from(schema.outboundCampaignLeads)
    .where(
      and(
        eq(schema.outboundCampaignLeads.campaignId, campaignId),
        eq(schema.outboundCampaignLeads.status, "DRAFTED"),
        ...(campaignLeadIds === "all_drafted" ? [] : [inArray(schema.outboundCampaignLeads.id, campaignLeadIds)])
      )
    )
    .all();
  if (rows.length === 0) return 0;
  const ids = rows.map((r) => r.id);
  await db
    .update(schema.outboundMessages)
    .set({ status: "APPROVED", updatedAt: new Date() })
    .where(and(inArray(schema.outboundMessages.campaignLeadId, ids), eq(schema.outboundMessages.status, "DRAFT")))
    .run();
  await db
    .update(schema.outboundCampaignLeads)
    .set({ status: "APPROVED", updatedAt: new Date() })
    .where(inArray(schema.outboundCampaignLeads.id, ids))
    .run();
  for (const row of rows) {
    await logActivity({ leadId: row.leadId, campaignId, type: "MESSAGES_APPROVED" });
  }
  return rows.length;
}

/** Sends the campaign lead back through drafting (e.g. after editing analysis). */
export async function regenerateDrafts(campaignLeadId: string) {
  await db
    .update(schema.outboundCampaignLeads)
    .set({ status: "PENDING_DRAFT", draftAttempts: 0, updatedAt: new Date() })
    .where(
      and(
        eq(schema.outboundCampaignLeads.id, campaignLeadId),
        inArray(schema.outboundCampaignLeads.status, ["DRAFTED", "APPROVED", "FAILED"]),
        eq(schema.outboundCampaignLeads.currentStep, 0)
      )
    )
    .run();
}

export async function updateMessageContent(messageId: string, subject: string, body: string) {
  const message = await db.select().from(schema.outboundMessages).where(eq(schema.outboundMessages.id, messageId)).get();
  if (!message) throw new Error("Message not found");
  if (!["DRAFT", "APPROVED"].includes(message.status)) throw new Error(`Can't edit a ${message.status} message`);
  const [lead, campaign] = await Promise.all([
    db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, message.leadId)).get(),
    db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.id, message.campaignId)).get(),
  ]);
  const issues = lintMessage(
    { step: message.sequenceStep, subject, body },
    { companyName: lead?.companyName ?? "", sequence: parseSequence(campaign?.sequenceJson ?? "[]") }
  );
  await db
    .update(schema.outboundMessages)
    .set({ subject: subject.trim(), body: body.trim(), generationSource: "manual", lintJson: JSON.stringify(issues), updatedAt: new Date() })
    .where(eq(schema.outboundMessages.id, messageId))
    .run();
  return issues;
}

/** Everything that must be true before a campaign may send. */
export function launchBlockers(campaign: typeof schema.outboundCampaigns.$inferSelect): string[] {
  const blockers: string[] = [];
  const provider = listEmailProviders().find((p) => p.id === campaign.provider);
  if (!provider) blockers.push(`Unknown provider "${campaign.provider}"`);
  else if (!provider.configured) blockers.push(`${provider.label} is not configured (missing env vars)`);
  if (campaign.provider !== "mock" && !senderConfig().postalAddress) {
    blockers.push("OUTBOUND_SENDER_ADDRESS (physical mailing address) is required by CAN-SPAM before real sends");
  }
  if (getEmailProvider(campaign.provider).mode === "sequence_push" && !campaign.providerCampaignRef) {
    blockers.push("Set the provider campaign id (the Smartlead campaign that holds the {{gs_…}} template)");
  }
  return blockers;
}

export async function setCampaignStatus(campaignId: string, status: "ACTIVE" | "PAUSED" | "COMPLETED") {
  const campaign = await db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.id, campaignId)).get();
  if (!campaign) throw new Error("Campaign not found");
  if (status === "ACTIVE") {
    const blockers = launchBlockers(campaign);
    if (blockers.length) throw new Error(blockers.join("; "));
  }
  const provider = getEmailProvider(campaign.provider);
  if (provider.mode === "sequence_push" && provider.setCampaignPaused && campaign.providerCampaignRef && campaign.launchedAt) {
    await provider.setCampaignPaused(campaign.providerCampaignRef, status !== "ACTIVE");
  }
  await db
    .update(schema.outboundCampaigns)
    .set({
      status,
      ...(status === "ACTIVE" && !campaign.launchedAt ? { launchedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.outboundCampaigns.id, campaignId))
    .run();
  if (status === "COMPLETED") {
    await db
      .update(schema.outboundCampaignLeads)
      .set({ status: "STOPPED", stopReason: "campaign completed", nextSendAt: null, updatedAt: new Date() })
      .where(and(eq(schema.outboundCampaignLeads.campaignId, campaignId), inArray(schema.outboundCampaignLeads.status, ["PENDING_DRAFT", "DRAFTED", "APPROVED", "ACTIVE"])))
      .run();
    await db
      .update(schema.outboundMessages)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(schema.outboundMessages.campaignId, campaignId), inArray(schema.outboundMessages.status, ["DRAFT", "APPROVED"])))
      .run();
  }
  await logActivity({ campaignId, type: `CAMPAIGN_${status}`, message: campaign.name });
}
