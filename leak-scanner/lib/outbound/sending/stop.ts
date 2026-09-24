import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutboundLeadStatus } from "@/lib/db/schema";
import { errorMessage, logActivity } from "../core/activity";
import { getEmailProvider } from "../email";

const OPEN_STATUSES = ["PENDING_DRAFT", "DRAFTED", "APPROVED", "ACTIVE"] as const;

/**
 * Stops every open sequence for a lead — the single choke point for reply,
 * bounce, unsubscribe and do-not-contact. Local state is updated FIRST so a
 * provider API failure can never leave us thinking the lead is still active;
 * provider-side stops that fail are logged loudly for manual follow-up.
 */
export async function stopLeadSequences(
  leadId: string,
  reason: string,
  newLeadStatus?: OutboundLeadStatus
): Promise<number> {
  const open = await db
    .select()
    .from(schema.outboundCampaignLeads)
    .where(and(eq(schema.outboundCampaignLeads.leadId, leadId), inArray(schema.outboundCampaignLeads.status, [...OPEN_STATUSES])))
    .all();

  if (open.length > 0) {
    await db
      .update(schema.outboundCampaignLeads)
      .set({ status: "STOPPED", stopReason: reason, nextSendAt: null, updatedAt: new Date() })
      .where(inArray(schema.outboundCampaignLeads.id, open.map((c) => c.id)))
      .run();
    await db
      .update(schema.outboundMessages)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(
        and(
          inArray(schema.outboundMessages.campaignLeadId, open.map((c) => c.id)),
          inArray(schema.outboundMessages.status, ["DRAFT", "APPROVED", "QUEUED_AT_PROVIDER"])
        )
      )
      .run();
  }
  if (newLeadStatus) {
    await db
      .update(schema.outboundLeads)
      .set({ status: newLeadStatus, updatedAt: new Date() })
      .where(eq(schema.outboundLeads.id, leadId))
      .run();
  }

  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, leadId)).get();
  for (const cl of open) {
    if (cl.status !== "ACTIVE" && !cl.providerLeadRef) continue;
    const campaign = await db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.id, cl.campaignId)).get();
    if (!campaign) continue;
    const provider = getEmailProvider(campaign.provider);
    if (provider.mode !== "sequence_push" || !campaign.providerCampaignRef) continue;
    try {
      await provider.stopLead({
        providerCampaignRef: campaign.providerCampaignRef,
        providerLeadRef: cl.providerLeadRef,
        email: lead?.email ?? "",
      });
    } catch (error) {
      await logActivity({
        leadId,
        campaignId: campaign.id,
        type: "EMAIL_SEND_FAILED",
        level: "error",
        message: `Could not stop lead in ${provider.label}: ${errorMessage(error)} — PAUSE IT MANUALLY in the provider.`,
      });
    }
  }

  if (open.length > 0) {
    await logActivity({ leadId, type: "SEQUENCE_STOPPED", message: `${open.length} sequence(s) stopped: ${reason}` });
  }
  return open.length;
}
