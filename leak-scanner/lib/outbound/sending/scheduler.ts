import { and, asc, eq, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { OutboundCampaign, OutboundCampaignLead } from "@/lib/db/schema";
import { errorMessage, logActivity } from "../core/activity";
import { acquireLock, releaseLock } from "../core/lock";
import { getOutboundSettings } from "../core/settings";
import { getEmailProvider } from "../email";
import { ProviderError, type PerMessageProvider, type SequencePushProvider } from "../email/types";
import { oneClickUnsubscribeUrl, renderEmailText, senderConfig, textToHtml, unsubscribeUrl } from "../personalization/render";
import { parseSequence } from "../personalization/sequence";
import { processDraftQueue } from "../personalization/service";
import { isEmailSuppressed } from "../replies/suppression";
import { processAnalysisQueue } from "../website-analysis/service";
import { stopLeadSequences } from "./stop";
import { isWithinSendWindow, nextStepDueAt } from "./window";

const DAY_MS = 86_400_000;
/** Lead statuses that are still allowed to receive email. */
const SENDABLE_LEAD_STATUSES = new Set(["READY", "ACTIVE_SEQUENCE"]);

export interface TickReport {
  ran: boolean;
  analyzed: number;
  analysisFailed: number;
  drafted: number;
  sent: number;
  enrolled: number;
  skipped: string[];
}

/**
 * One scheduler pass. Called by n8n/cron (POST /api/outbound/tick) every few
 * minutes and by the "Run now" button. A DB lease prevents overlap.
 */
export async function runOutboundTick(now: Date = new Date()): Promise<TickReport> {
  const report: TickReport = { ran: false, analyzed: 0, analysisFailed: 0, drafted: 0, sent: 0, enrolled: 0, skipped: [] };
  if (!(await acquireLock("outbound_tick", 5 * 60_000))) {
    report.skipped.push("another tick is running");
    return report;
  }
  report.ran = true;
  try {
    const settings = await getOutboundSettings();
    const analysis = await processAnalysisQueue(settings.analysisBatchSize);
    report.analyzed = analysis.analyzed;
    report.analysisFailed = analysis.failed;
    report.drafted = await processDraftQueue(settings.draftBatchSize);
    const sends = await processDueSends(now, settings.mailboxDailyLimit);
    report.sent = sends.sent;
    report.enrolled = sends.enrolled;
    report.skipped.push(...sends.skipped);
  } finally {
    await releaseLock("outbound_tick");
  }
  return report;
}

export async function sentInLast24h(now: Date, campaignId?: string): Promise<number> {
  const since = new Date(now.getTime() - DAY_MS);
  const row = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.outboundMessages)
    .where(
      and(
        eq(schema.outboundMessages.status, "SENT"),
        gte(schema.outboundMessages.sentAt, since),
        ...(campaignId ? [eq(schema.outboundMessages.campaignId, campaignId)] : [])
      )
    )
    .get();
  return Number(row?.n ?? 0);
}

async function lastSentAt(campaignId: string): Promise<Date | null> {
  const row = await db
    .select({ at: sql<number>`max(${schema.outboundMessages.sentAt})` })
    .from(schema.outboundMessages)
    .where(and(eq(schema.outboundMessages.campaignId, campaignId), isNotNull(schema.outboundMessages.sentAt)))
    .get();
  return row?.at ? new Date(Number(row.at)) : null;
}

export async function processDueSends(now: Date, mailboxDailyLimit: number) {
  const out = { sent: 0, enrolled: 0, skipped: [] as string[] };
  const campaigns = await db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.status, "ACTIVE")).all();

  for (const campaign of campaigns) {
    // APPROVED leads join the sequence as soon as their campaign is live.
    await db
      .update(schema.outboundCampaignLeads)
      .set({ status: "ACTIVE", nextSendAt: now, updatedAt: now })
      .where(and(eq(schema.outboundCampaignLeads.campaignId, campaign.id), eq(schema.outboundCampaignLeads.status, "APPROVED")))
      .run();

    const provider = getEmailProvider(campaign.provider);
    if (provider.mode === "sequence_push") {
      out.enrolled += await enrollDueLeads(campaign, provider, now);
      continue;
    }

    const window = {
      timezone: campaign.timezone,
      startHour: campaign.sendWindowStart,
      endHour: campaign.sendWindowEnd,
      days: JSON.parse(campaign.sendDaysJson) as number[],
    };
    if (!isWithinSendWindow(now, window)) {
      out.skipped.push(`${campaign.name}: outside send window`);
      continue;
    }
    if ((await sentInLast24h(now)) >= mailboxDailyLimit) {
      out.skipped.push(`mailbox daily limit (${mailboxDailyLimit}) reached`);
      break;
    }
    if ((await sentInLast24h(now, campaign.id)) >= campaign.dailyLimit) {
      out.skipped.push(`${campaign.name}: daily limit (${campaign.dailyLimit}) reached`);
      continue;
    }
    const last = await lastSentAt(campaign.id);
    if (last && now.getTime() - last.getTime() < campaign.minDelaySeconds * 1000) {
      out.skipped.push(`${campaign.name}: waiting ${campaign.minDelaySeconds}s between sends`);
      continue;
    }

    // One send per campaign per tick keeps spacing natural (tick every 2–5 min).
    const due = await db
      .select()
      .from(schema.outboundCampaignLeads)
      .innerJoin(schema.outboundLeads, eq(schema.outboundLeads.id, schema.outboundCampaignLeads.leadId))
      .where(
        and(
          eq(schema.outboundCampaignLeads.campaignId, campaign.id),
          eq(schema.outboundCampaignLeads.status, "ACTIVE"),
          lte(schema.outboundCampaignLeads.nextSendAt, now)
        )
      )
      .orderBy(asc(schema.outboundCampaignLeads.nextSendAt), sql`${schema.outboundLeads.priorityScore} desc`)
      .limit(1)
      .get();
    if (!due) continue;
    if (await sendNextStep(campaign, due.outbound_campaign_leads, provider, now)) out.sent++;
  }
  return out;
}

/** Pre-send safety gate. Returns a stop reason, or null when OK to send. */
async function stopReasonFor(cl: OutboundCampaignLead): Promise<string | null> {
  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, cl.leadId)).get();
  if (!lead) return "lead deleted";
  if (!lead.email) return "no email address";
  if (!SENDABLE_LEAD_STATUSES.has(lead.status)) return `lead status is ${lead.status}`;
  if (await isEmailSuppressed(lead.email)) return "address is suppressed";
  const reply = await db
    .select({ id: schema.outboundReplies.id })
    .from(schema.outboundReplies)
    .where(and(eq(schema.outboundReplies.leadId, lead.id), gte(schema.outboundReplies.receivedAt, cl.createdAt)))
    .limit(1)
    .get();
  if (reply) return "lead has replied";
  return null;
}

export async function sendNextStep(
  campaign: OutboundCampaign,
  cl: OutboundCampaignLead,
  provider: PerMessageProvider,
  now: Date
): Promise<boolean> {
  const stop = await stopReasonFor(cl);
  if (stop) {
    await stopLeadSequences(cl.leadId, stop);
    return false;
  }
  const step = cl.currentStep + 1;
  const message = await db
    .select()
    .from(schema.outboundMessages)
    .where(and(eq(schema.outboundMessages.campaignLeadId, cl.id), eq(schema.outboundMessages.sequenceStep, step)))
    .get();
  if (!message || message.status !== "APPROVED") {
    // Unapproved follow-up: hold the lead instead of sending unreviewed copy.
    await db
      .update(schema.outboundCampaignLeads)
      .set({ nextSendAt: new Date(now.getTime() + 6 * 3_600_000), updatedAt: now })
      .where(eq(schema.outboundCampaignLeads.id, cl.id))
      .run();
    await logActivity({
      leadId: cl.leadId,
      campaignId: campaign.id,
      type: "SEND_HELD",
      level: "warn",
      message: `Step ${step} is not approved (${message?.status ?? "missing"}) — holding`,
    });
    return false;
  }

  // Atomic claim: a message can only ever move APPROVED → SENDING once.
  const claim = await db
    .update(schema.outboundMessages)
    .set({ status: "SENDING", updatedAt: now })
    .where(and(eq(schema.outboundMessages.id, message.id), eq(schema.outboundMessages.status, "APPROVED")))
    .run();
  if (claim.rowsAffected !== 1) return false;

  const lead = (await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, cl.leadId)).get())!;
  const first = step > 1
    ? await db
        .select({ id: schema.outboundMessages.providerMessageId })
        .from(schema.outboundMessages)
        .where(and(eq(schema.outboundMessages.campaignLeadId, cl.id), eq(schema.outboundMessages.sequenceStep, 1)))
        .get()
    : null;
  const sender = senderConfig();
  const text = renderEmailText(message.body, lead.unsubscribeToken, sender);

  try {
    const { providerMessageId } = await provider.send({
      to: lead.email!,
      toName: [lead.contactFirstName, lead.contactLastName].filter(Boolean).join(" ") || null,
      subject: message.subject,
      text,
      html: textToHtml(text),
      unsubscribeUrl: unsubscribeUrl(lead.unsubscribeToken, sender),
      oneClickUnsubscribeUrl: oneClickUnsubscribeUrl(lead.unsubscribeToken, sender),
      messageId: message.id,
      leadId: lead.id,
      sequenceStep: step,
      threadProviderMessageId: first?.id ?? null,
    });
    await db
      .update(schema.outboundMessages)
      .set({ status: "SENT", providerMessageId, sentAt: now, error: null, updatedAt: now })
      .where(eq(schema.outboundMessages.id, message.id))
      .run();
    const sequence = parseSequence(campaign.sequenceJson);
    const nextAt = nextStepDueAt(sequence, step, now);
    await db
      .update(schema.outboundCampaignLeads)
      .set({
        currentStep: step,
        lastContactedAt: now,
        nextSendAt: nextAt,
        status: nextAt ? "ACTIVE" : "COMPLETED",
        updatedAt: now,
      })
      .where(eq(schema.outboundCampaignLeads.id, cl.id))
      .run();
    if (lead.status === "READY") {
      await db.update(schema.outboundLeads).set({ status: "ACTIVE_SEQUENCE", updatedAt: now }).where(eq(schema.outboundLeads.id, lead.id)).run();
    }
    await logActivity({
      leadId: lead.id,
      campaignId: campaign.id,
      type: "EMAIL_SENT",
      message: `Step ${step} sent via ${provider.label}: "${message.subject}"`,
      metadata: { providerMessageId },
    });
    return true;
  } catch (error) {
    const retryable = error instanceof ProviderError ? error.retryable : true;
    // Bounded: one retry for transient errors, then the lead is failed.
    const finalFailure = !retryable || message.error !== null;
    await db
      .update(schema.outboundMessages)
      .set({ status: finalFailure ? "FAILED" : "APPROVED", error: errorMessage(error).slice(0, 500), updatedAt: now })
      .where(eq(schema.outboundMessages.id, message.id))
      .run();
    await db
      .update(schema.outboundCampaignLeads)
      .set(
        finalFailure
          ? { status: "FAILED", stopReason: `send failed: ${errorMessage(error).slice(0, 200)}`, nextSendAt: null, updatedAt: now }
          : { nextSendAt: new Date(now.getTime() + 30 * 60_000), updatedAt: now }
      )
      .where(eq(schema.outboundCampaignLeads.id, cl.id))
      .run();
    await logActivity({
      leadId: lead.id,
      campaignId: campaign.id,
      type: "EMAIL_SEND_FAILED",
      level: "error",
      message: `${errorMessage(error)}${finalFailure ? " — lead marked FAILED" : " — retrying in 30 min"}`,
    });
    return false;
  }
}

/** sequence_push: hand the whole approved sequence to the provider once. */
async function enrollDueLeads(campaign: OutboundCampaign, provider: SequencePushProvider, now: Date): Promise<number> {
  if (!campaign.providerCampaignRef) return 0;
  const due = await db
    .select()
    .from(schema.outboundCampaignLeads)
    .where(
      and(
        eq(schema.outboundCampaignLeads.campaignId, campaign.id),
        eq(schema.outboundCampaignLeads.status, "ACTIVE"),
        eq(schema.outboundCampaignLeads.currentStep, 0),
        lte(schema.outboundCampaignLeads.nextSendAt, now)
      )
    )
    .limit(Math.max(1, Math.min(campaign.dailyLimit, 25)))
    .all();
  let enrolled = 0;
  const sender = senderConfig();
  for (const cl of due) {
    const stop = await stopReasonFor(cl);
    if (stop) {
      await stopLeadSequences(cl.leadId, stop);
      continue;
    }
    const lead = (await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, cl.leadId)).get())!;
    const messages = await db
      .select()
      .from(schema.outboundMessages)
      .where(eq(schema.outboundMessages.campaignLeadId, cl.id))
      .orderBy(asc(schema.outboundMessages.sequenceStep))
      .all();
    if (messages.length === 0 || messages.some((m) => m.status !== "APPROVED")) {
      await db.update(schema.outboundCampaignLeads).set({ nextSendAt: new Date(now.getTime() + 6 * 3_600_000) }).where(eq(schema.outboundCampaignLeads.id, cl.id)).run();
      continue;
    }
    try {
      const { providerLeadRef } = await provider.enrollLead({
        providerCampaignRef: campaign.providerCampaignRef,
        lead: {
          email: lead.email!,
          firstName: lead.contactFirstName,
          lastName: lead.contactLastName,
          companyName: lead.companyName,
          website: lead.website,
          phone: lead.phone,
        },
        steps: messages.map((m) => {
          const text = renderEmailText(m.body, lead.unsubscribeToken, sender);
          return { step: m.sequenceStep, subject: m.subject, text, html: textToHtml(text) };
        }),
      });
      await db
        .update(schema.outboundMessages)
        .set({ status: "QUEUED_AT_PROVIDER", updatedAt: now })
        .where(inArray(schema.outboundMessages.id, messages.map((m) => m.id)))
        .run();
      await db
        .update(schema.outboundCampaignLeads)
        .set({ providerLeadRef, nextSendAt: null, lastContactedAt: now, updatedAt: now })
        .where(eq(schema.outboundCampaignLeads.id, cl.id))
        .run();
      await db.update(schema.outboundLeads).set({ status: "ACTIVE_SEQUENCE", updatedAt: now }).where(eq(schema.outboundLeads.id, lead.id)).run();
      await logActivity({ leadId: lead.id, campaignId: campaign.id, type: "PROVIDER_ENROLLED", message: `Enrolled in ${provider.label} campaign ${campaign.providerCampaignRef}` });
      enrolled++;
    } catch (error) {
      // Bounded: one retry for transient errors (marked via stopReason).
      const retryable = (error instanceof ProviderError ? error.retryable : true) && !cl.stopReason?.startsWith("retry:");
      await db
        .update(schema.outboundCampaignLeads)
        .set(
          retryable
            ? { nextSendAt: new Date(now.getTime() + 30 * 60_000), stopReason: `retry: ${errorMessage(error).slice(0, 180)}`, updatedAt: now }
            : { status: "FAILED", stopReason: errorMessage(error).slice(0, 200), nextSendAt: null, updatedAt: now }
        )
        .where(eq(schema.outboundCampaignLeads.id, cl.id))
        .run();
      await logActivity({ leadId: lead.id, campaignId: campaign.id, type: "EMAIL_SEND_FAILED", level: "error", message: errorMessage(error) });
    }
  }
  return enrolled;
}
