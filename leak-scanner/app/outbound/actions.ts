"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { db, dbReady, schema } from "@/lib/db";
import { OUTBOUND_REPLY_CLASSIFICATIONS } from "@/lib/db/schema";
import {
  addLeadsToCampaign,
  approveCampaignLeads,
  createCampaign,
  regenerateDrafts,
  setCampaignStatus,
  updateMessageContent,
} from "@/lib/outbound/campaigns/service";
import { errorMessage, logActivity } from "@/lib/outbound/core/activity";
import { getOutboundSettings, saveOutboundSettings } from "@/lib/outbound/core/settings";
import { markBookedInGhl, syncLeadToGhl, testGhlConnection, GHL_TAGS } from "@/lib/outbound/ghl/service";
import { importLeadsFromCsv, insertLeads } from "@/lib/outbound/leads/import";
import { normalizeRecord } from "@/lib/outbound/leads/normalize";
import { handleInboundReply, handleUnsubscribe, reclassifyReply } from "@/lib/outbound/replies/handle";
import { suppress } from "@/lib/outbound/replies/suppression";
import { runOutboundTick } from "@/lib/outbound/sending/scheduler";
import { stopLeadSequences } from "@/lib/outbound/sending/stop";
import { queueLeadsForAnalysis } from "@/lib/outbound/website-analysis/service";

async function guard() {
  await requireAdmin();
  await dbReady();
}

function back(path: string, notice: string, tone: "ok" | "error" = "ok"): never {
  revalidatePath("/outbound", "layout");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}notice=${encodeURIComponent(notice)}&tone=${tone}`);
}

const ids = (form: FormData) => form.getAll("ids").map(String).filter(Boolean);

// ---------------- leads ----------------

export async function importCsvAction(form: FormData) {
  await guard();
  const file = form.get("file");
  const pasted = String(form.get("csv") ?? "");
  const text = file instanceof File && file.size > 0 ? await file.text() : pasted;
  if (!text.trim()) back("/outbound/leads", "Choose a CSV file or paste CSV text.", "error");
  let summary: string;
  try {
    const r = await importLeadsFromCsv(text, String(form.get("source") || "csv"));
    summary = `Imported ${r.imported} of ${r.totalRows} rows · ${r.duplicates} duplicates · ${r.suppressed} suppressed · ${r.invalid.length} invalid${
      r.invalid.length ? ` (rows ${r.invalid.slice(0, 8).map((i) => `${i.row}: ${i.error}`).join("; ")})` : ""
    }`;
    if (form.get("autoQueue") === "on" && r.leadIds.length) {
      const queued = await queueLeadsForAnalysis(r.leadIds);
      summary += ` · ${queued} queued for analysis`;
    }
  } catch (error) {
    back("/outbound/leads", errorMessage(error), "error");
  }
  back("/outbound/leads", summary);
}

export async function createLeadAction(form: FormData) {
  await guard();
  const record = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const result = normalizeRecord(record, "manual");
  if (!result.ok) back("/outbound/leads/new", result.error, "error");
  const { leadIds, duplicates } = await insertLeads([result.lead]);
  if (duplicates) back("/outbound/leads/new", "A lead with that email/domain already exists.", "error");
  if (form.get("autoQueue") === "on") await queueLeadsForAnalysis(leadIds);
  back(`/outbound/leads/${leadIds[0]}`, "Lead created.");
}

export async function queueAnalysisAction(form: FormData) {
  await guard();
  const selected = ids(form);
  const n = await queueLeadsForAnalysis(selected.length ? selected : "all_new");
  back(String(form.get("returnTo") || "/outbound/leads"), `${n} lead(s) queued for analysis. They'll be processed on the next scheduler tick (or press "Run now").`);
}

export async function addToCampaignAction(form: FormData) {
  await guard();
  const campaignId = String(form.get("campaignId") ?? "");
  const selected = ids(form);
  if (!campaignId || selected.length === 0) back(String(form.get("returnTo") || "/outbound/leads"), "Pick a campaign and at least one lead.", "error");
  let r: Awaited<ReturnType<typeof addLeadsToCampaign>>;
  try {
    r = await addLeadsToCampaign(campaignId, selected);
  } catch (error) {
    back("/outbound/leads", errorMessage(error), "error");
  }
  back(`/outbound/campaigns/${campaignId}`, `Added ${r.added} lead(s); ${r.skipped} skipped (not READY, no email, or already in a sequence). Drafts generate on the next tick.`);
}

const MANUAL_STATUSES = ["BOOKED", "CUSTOMER", "DO_NOT_CONTACT", "NOT_INTERESTED", "READY"] as const;

export async function setLeadStatusAction(leadId: string, form: FormData) {
  await guard();
  const status = z.enum(MANUAL_STATUSES).parse(form.get("status"));
  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, leadId)).get();
  if (!lead) back("/outbound/leads", "Lead not found", "error");
  if (status === "DO_NOT_CONTACT") {
    await handleUnsubscribe(lead, "manual");
  } else {
    if (status !== "READY") await stopLeadSequences(leadId, `manually marked ${status}`);
    await db.update(schema.outboundLeads).set({ status, updatedAt: new Date() }).where(eq(schema.outboundLeads.id, leadId)).run();
    await logActivity({ leadId, type: "STATUS_CHANGED", message: `${lead.status} → ${status} (manual)` });
    if (status === "BOOKED") await markBookedInGhl({ ...lead, status });
  }
  back(`/outbound/leads/${leadId}`, `Marked ${status}.`);
}

export async function pushToGhlAction(leadId: string) {
  await guard();
  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, leadId)).get();
  if (!lead) back("/outbound/leads", "Lead not found", "error");
  const r = await syncLeadToGhl(lead, { reply: null, statusTag: GHL_TAGS.interested, originalMessage: null });
  back(`/outbound/leads/${leadId}`, r.status === "synced" ? `Synced to GHL (contact ${r.contactId}).` : r.status === "skipped" ? r.reason : r.error, r.status === "failed" ? "error" : "ok");
}

export async function logReplyAction(leadId: string, form: FormData) {
  await guard();
  const content = String(form.get("content") ?? "").trim();
  if (!content) back(`/outbound/leads/${leadId}`, "Paste the reply text.", "error");
  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, leadId)).get();
  const override = String(form.get("classification") ?? "");
  const outcome = await handleInboundReply({
    leadId,
    fromEmail: lead?.email ?? "unknown@unknown",
    content,
    classification: (OUTBOUND_REPLY_CLASSIFICATIONS as readonly string[]).includes(override) ? (override as (typeof OUTBOUND_REPLY_CLASSIFICATIONS)[number]) : undefined,
  });
  back(`/outbound/leads/${leadId}`, outcome.status === "processed" ? `Reply logged as ${outcome.classification}; sequences stopped where needed.` : outcome.status);
}

export async function reclassifyReplyAction(leadId: string, replyId: string, form: FormData) {
  await guard();
  const classification = z.enum(OUTBOUND_REPLY_CLASSIFICATIONS).parse(form.get("classification"));
  await reclassifyReply(replyId, classification);
  back(`/outbound/leads/${leadId}`, `Reply reclassified as ${classification}.`);
}

// ---------------- messages ----------------

export async function updateMessageAction(leadId: string, messageId: string, form: FormData) {
  await guard();
  let issues: string[];
  try {
    issues = await updateMessageContent(messageId, String(form.get("subject") ?? ""), String(form.get("body") ?? ""));
  } catch (error) {
    back(`/outbound/leads/${leadId}`, errorMessage(error), "error");
  }
  back(`/outbound/leads/${leadId}`, issues.length ? `Saved with warnings: ${issues.join("; ")}` : "Message saved.", issues.length ? "error" : "ok");
}

export async function approveLeadMessagesAction(leadId: string, campaignId: string, campaignLeadId: string) {
  await guard();
  const n = await approveCampaignLeads(campaignId, [campaignLeadId]);
  back(`/outbound/leads/${leadId}`, n ? "Sequence approved — it will send once the campaign is live." : "Nothing to approve.");
}

export async function regenerateAction(leadId: string, campaignLeadId: string) {
  await guard();
  await regenerateDrafts(campaignLeadId);
  back(`/outbound/leads/${leadId}`, "Drafts will be regenerated on the next tick.");
}

// ---------------- campaigns ----------------

export async function createCampaignAction(form: FormData) {
  await guard();
  const parsed = {
    name: String(form.get("name") ?? ""),
    niche: String(form.get("niche") ?? "") || null,
    provider: String(form.get("provider") ?? "mock") as "mock",
    providerCampaignRef: String(form.get("providerCampaignRef") ?? "") || null,
    dailyLimit: form.get("dailyLimit"),
    sendWindowStart: form.get("sendWindowStart"),
    sendWindowEnd: form.get("sendWindowEnd"),
    timezone: String(form.get("timezone") ?? "America/Los_Angeles"),
    sendDays: form.getAll("sendDays").map(Number),
    minDelaySeconds: form.get("minDelaySeconds"),
    requireApproval: form.get("requireApproval") === "on",
  } as unknown as Parameters<typeof createCampaign>[0];
  let id: string;
  try {
    id = (await createCampaign(parsed)).id;
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : errorMessage(error);
    back("/outbound/campaigns", message, "error");
  }
  back(`/outbound/campaigns/${id}`, "Campaign created. Add READY leads below.");
}

export async function campaignStatusAction(campaignId: string, form: FormData) {
  await guard();
  const status = z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).parse(form.get("status"));
  try {
    await setCampaignStatus(campaignId, status);
  } catch (error) {
    back(`/outbound/campaigns/${campaignId}`, errorMessage(error), "error");
  }
  back(`/outbound/campaigns/${campaignId}`, status === "ACTIVE" ? "Campaign is live. Approved leads send on the next ticks, inside the send window." : `Campaign ${status.toLowerCase()}.`);
}

export async function approveCampaignAction(campaignId: string, form: FormData) {
  await guard();
  const selected = ids(form);
  const n = await approveCampaignLeads(campaignId, selected.length ? selected : "all_drafted");
  back(`/outbound/campaigns/${campaignId}`, `Approved ${n} lead sequence(s).`);
}

// ---------------- system ----------------

export async function runTickAction(form: FormData) {
  await guard();
  // Up to ~45s of back-to-back ticks so a fresh import gets through quickly.
  const deadline = Date.now() + 45_000;
  const totals = { analyzed: 0, drafted: 0, sent: 0, enrolled: 0 };
  let skipped: string[] = [];
  for (let i = 0; i < 20 && Date.now() < deadline; i++) {
    const r = await runOutboundTick();
    if (!r.ran) {
      skipped = r.skipped;
      break;
    }
    totals.analyzed += r.analyzed + r.analysisFailed;
    totals.drafted += r.drafted;
    totals.sent += r.sent;
    totals.enrolled += r.enrolled;
    skipped = r.skipped;
    if (r.analyzed + r.analysisFailed + r.drafted + r.sent + r.enrolled === 0) break;
  }
  back(
    String(form.get("returnTo") || "/outbound"),
    `Tick: ${totals.analyzed} analyzed · ${totals.drafted} drafted · ${totals.sent} sent · ${totals.enrolled} enrolled${skipped.length ? ` · ${[...new Set(skipped)].join("; ")}` : ""}`
  );
}

export async function saveSettingsAction(form: FormData) {
  await guard();
  const current = await getOutboundSettings();
  const num = (key: string, fallback: number, max: number) => {
    const n = Number(form.get(key));
    return Number.isFinite(n) && n >= 0 ? Math.min(Math.round(n), max) : fallback;
  };
  await saveOutboundSettings({
    mailboxDailyLimit: num("mailboxDailyLimit", current.mailboxDailyLimit, 1000),
    analysisBatchSize: Math.max(1, num("analysisBatchSize", current.analysisBatchSize, 50)),
    draftBatchSize: Math.max(1, num("draftBatchSize", current.draftBatchSize, 50)),
    minPriorityScore: num("minPriorityScore", current.minPriorityScore, 100),
    targetIndustries: String(form.get("targetIndustries") ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  });
  back("/outbound/settings", "Settings saved.");
}

export async function addSuppressionAction(form: FormData) {
  await guard();
  const value = String(form.get("value") ?? "").trim().toLowerCase();
  if (!/^(@[a-z0-9.-]+\.[a-z]{2,}|[^@\s]+@[a-z0-9.-]+\.[a-z]{2,})$/.test(value)) back("/outbound/settings", "Enter an email or @domain.com", "error");
  await suppress(value, "manual", "settings page");
  back("/outbound/settings", `${value} suppressed.`);
}

export async function testGhlAction() {
  await guard();
  let result: string;
  let ok = true;
  try {
    result = await testGhlConnection();
  } catch (error) {
    ok = false;
    result = `GHL test failed: ${errorMessage(error)}`;
  }
  back("/outbound/settings", result, ok ? "ok" : "error");
}
