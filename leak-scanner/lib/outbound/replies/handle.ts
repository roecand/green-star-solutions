import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutboundLead, OutboundLeadStatus, ReplyClassification } from "@/lib/db/schema";
import { logActivity } from "../core/activity";
import { GHL_TAGS, syncLeadToGhl } from "../ghl/service";
import { getLLM } from "../llm";
import { classifyReply } from "../reply-classification/classify";
import type { ClassificationResult } from "../reply-classification/rules";
import { stopLeadSequences } from "../sending/stop";
import { notifyOwner } from "./notify";
import { suppress } from "./suppression";

export interface InboundReplyInput {
  fromEmail: string;
  content: string;
  subject?: string | null;
  receivedAt?: Date;
  /** Provider event/message id — makes webhook retries idempotent. */
  providerRef?: string | null;
  /** Optional explicit lead (manual entry from the lead page). */
  leadId?: string;
  /** Manual override of the classifier. */
  classification?: ReplyClassification;
}

export type ReplyOutcome =
  | { status: "processed"; leadId: string; replyId: string; classification: ReplyClassification }
  | { status: "duplicate" }
  | { status: "unmatched"; reason: string };

const LEAD_STATUS_FOR: Record<ReplyClassification, OutboundLeadStatus | null> = {
  INTERESTED: "INTERESTED",
  QUESTION: "REPLIED",
  NOT_NOW: "REPLIED",
  NOT_INTERESTED: "NOT_INTERESTED",
  DO_NOT_CONTACT: "DO_NOT_CONTACT",
  OUT_OF_OFFICE: null,
  UNKNOWN: "REPLIED",
};

/** Statuses a reply must never downgrade (e.g. a later "thanks!" after booking). */
const STICKY: OutboundLeadStatus[] = ["BOOKED", "CUSTOMER", "DO_NOT_CONTACT"];

export async function findLeadByEmail(email: string): Promise<OutboundLead | undefined> {
  return db
    .select()
    .from(schema.outboundLeads)
    .where(eq(schema.outboundLeads.email, email.trim().toLowerCase()))
    .orderBy(desc(schema.outboundLeads.createdAt))
    .get();
}

export async function handleInboundReply(input: InboundReplyInput): Promise<ReplyOutcome> {
  if (input.providerRef) {
    const dup = await db
      .select({ id: schema.outboundReplies.id })
      .from(schema.outboundReplies)
      .where(eq(schema.outboundReplies.providerRef, input.providerRef))
      .get();
    if (dup) return { status: "duplicate" };
  }
  const lead = input.leadId
    ? await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, input.leadId)).get()
    : await findLeadByEmail(input.fromEmail);
  if (!lead) return { status: "unmatched", reason: `no lead with email ${input.fromEmail}` };

  const result: ClassificationResult = input.classification
    ? { classification: input.classification, confidence: "high", source: "rule", reason: "set manually" }
    : await classifyReply(input.content, await getLLM());

  // Latest contacted campaign, for attribution.
  const lastCampaign = await db
    .select({ campaignId: schema.outboundCampaignLeads.campaignId })
    .from(schema.outboundCampaignLeads)
    .where(and(eq(schema.outboundCampaignLeads.leadId, lead.id), isNotNull(schema.outboundCampaignLeads.lastContactedAt)))
    .orderBy(desc(schema.outboundCampaignLeads.lastContactedAt))
    .get();

  const reply = await db
    .insert(schema.outboundReplies)
    .values({
      leadId: lead.id,
      campaignId: lastCampaign?.campaignId ?? null,
      fromEmail: input.fromEmail.toLowerCase(),
      subject: input.subject ?? null,
      content: input.content.slice(0, 20_000),
      classification: result.classification,
      classificationSource: input.classification ? "manual" : result.source,
      confidence: result.confidence,
      providerRef: input.providerRef ?? null,
      receivedAt: input.receivedAt ?? new Date(),
    })
    .returning()
    .get();
  await logActivity({
    leadId: lead.id,
    campaignId: reply.campaignId,
    type: "REPLY_RECEIVED",
    message: `${result.classification} (${result.confidence}, ${result.source}): ${result.reason}`,
  });

  await applyClassification(lead, reply.id, result);
  return { status: "processed", leadId: lead.id, replyId: reply.id, classification: result.classification };
}

/** Side effects of a classification. Re-run safely after a manual override. */
export async function applyClassification(lead: OutboundLead, replyId: string, result: ClassificationResult): Promise<void> {
  const c = result.classification;
  if (c === "OUT_OF_OFFICE") {
    // An auto-reply is not the prospect replying; keep the sequence running.
    return;
  }
  // Any human reply stops every open sequence immediately.
  // Medium-confidence "interested" is surfaced for review rather than auto-promoted.
  const leadStatus = STICKY.includes(lead.status)
    ? undefined
    : c === "INTERESTED" && result.confidence !== "high"
      ? "REPLIED"
      : (LEAD_STATUS_FOR[c] ?? undefined);
  await stopLeadSequences(lead.id, `reply: ${c}`, leadStatus);

  if (c === "DO_NOT_CONTACT" && lead.email) {
    await suppress(lead.email, "do_not_contact", `reply ${replyId}`);
    return;
  }
  if (c === "NOT_INTERESTED") return;

  const reply = await db.select().from(schema.outboundReplies).where(eq(schema.outboundReplies.id, replyId)).get();
  const original = await db
    .select({ subject: schema.outboundMessages.subject, body: schema.outboundMessages.body })
    .from(schema.outboundMessages)
    .where(and(eq(schema.outboundMessages.leadId, lead.id), inArray(schema.outboundMessages.status, ["SENT", "QUEUED_AT_PROVIDER"])))
    .orderBy(schema.outboundMessages.sequenceStep)
    .get();
  const freshLead = (await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, lead.id)).get()) ?? lead;

  let crm = "";
  if ((c === "INTERESTED" && result.confidence === "high") || c === "NOT_NOW") {
    const sync = await syncLeadToGhl(freshLead, {
      reply: reply ?? null,
      statusTag: c === "INTERESTED" ? GHL_TAGS.interested : GHL_TAGS.notNow,
      originalMessage: original ?? null,
    });
    crm = sync.status === "synced" ? "Pushed to GoHighLevel." : sync.status === "skipped" ? `GHL skipped: ${sync.reason}.` : `GHL sync FAILED: ${sync.error}`;
  }

  if (c === "INTERESTED" || c === "QUESTION" || c === "UNKNOWN") {
    const who = [lead.contactFirstName, lead.contactLastName].filter(Boolean).join(" ") || lead.email;
    await notifyOwner({
      leadId: lead.id,
      subject: `${c === "INTERESTED" ? "🟢 Interested" : c === "QUESTION" ? "❓ Question" : "Reply"}: ${lead.companyName}`,
      lines: [
        `${who} at ${lead.companyName} replied (${c}, ${result.confidence} confidence).`,
        reply?.content.slice(0, 1500) ?? "",
        crm,
      ].filter(Boolean),
    });
  }
}

/** Manual reclassification from the lead page. */
export async function reclassifyReply(replyId: string, classification: ReplyClassification): Promise<void> {
  const reply = await db.select().from(schema.outboundReplies).where(eq(schema.outboundReplies.id, replyId)).get();
  if (!reply) throw new Error("Reply not found");
  await db
    .update(schema.outboundReplies)
    .set({ classification, classificationSource: "manual", confidence: "high" })
    .where(eq(schema.outboundReplies.id, replyId))
    .run();
  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, reply.leadId)).get();
  if (!lead) return;
  // A manual correction may move the lead out of REPLIED/INTERESTED/NOT_INTERESTED.
  const unsticky = STICKY.includes(lead.status) ? lead : { ...lead, status: "REPLIED" as const };
  await logActivity({ leadId: lead.id, type: "REPLY_RECLASSIFIED", message: `${reply.classification} → ${classification}` });
  await applyClassification(unsticky, replyId, { classification, confidence: "high", source: "rule", reason: "manual" });
}

export async function handleBounce(email: string, detail: string | null): Promise<boolean> {
  const lead = await findLeadByEmail(email);
  await suppress(email, "bounced", detail ?? "provider bounce");
  if (!lead) return false;
  await stopLeadSequences(lead.id, "bounced", STICKY.includes(lead.status) ? undefined : "BOUNCED");
  await logActivity({ leadId: lead.id, type: "EMAIL_BOUNCED", level: "warn", message: detail ?? "Bounced" });
  return true;
}

export async function handleUnsubscribe(lead: OutboundLead, source: string): Promise<void> {
  if (lead.email) await suppress(lead.email, "unsubscribed", source);
  await stopLeadSequences(lead.id, "unsubscribed", "DO_NOT_CONTACT");
  await logActivity({ leadId: lead.id, type: "UNSUBSCRIBED", message: `Opted out via ${source}` });
}

/** sequence_push providers report each step as it actually goes out. */
export async function handleProviderSent(email: string, step: number | null, providerMessageId: string | null): Promise<void> {
  const lead = await findLeadByEmail(email);
  if (!lead) return;
  const cl = await db
    .select()
    .from(schema.outboundCampaignLeads)
    .where(and(eq(schema.outboundCampaignLeads.leadId, lead.id), eq(schema.outboundCampaignLeads.status, "ACTIVE")))
    .get();
  if (!cl) return;
  const stepNo = step ?? cl.currentStep + 1;
  const now = new Date();
  await db
    .update(schema.outboundMessages)
    .set({ status: "SENT", sentAt: now, providerMessageId, updatedAt: now })
    .where(and(eq(schema.outboundMessages.campaignLeadId, cl.id), eq(schema.outboundMessages.sequenceStep, stepNo)))
    .run();
  const remaining = await db
    .select({ id: schema.outboundMessages.id })
    .from(schema.outboundMessages)
    .where(and(eq(schema.outboundMessages.campaignLeadId, cl.id), eq(schema.outboundMessages.status, "QUEUED_AT_PROVIDER")))
    .all();
  await db
    .update(schema.outboundCampaignLeads)
    .set({ currentStep: Math.max(cl.currentStep, stepNo), lastContactedAt: now, status: remaining.length ? "ACTIVE" : "COMPLETED", updatedAt: now })
    .where(eq(schema.outboundCampaignLeads.id, cl.id))
    .run();
  await logActivity({ leadId: lead.id, campaignId: cl.campaignId, type: "EMAIL_SENT", message: `Step ${stepNo} sent by provider` });
}
