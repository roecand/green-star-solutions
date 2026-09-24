/**
 * End-to-end outbound pipeline against a throwaway SQLite db and a local HTTP
 * server standing in for prospects' websites. No network, no LLM (template
 * fallback), mock email provider.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { DATED_SITE_HTML, POLISHED_SITE_HTML } from "./fixtures/outbound-sites";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "greenstar-outbound-"));
process.env.DATABASE_PATH = path.join(tmpDir, "test.db");
process.env.SCANNER_ALLOW_PRIVATE = "1";
process.env.OUTBOUND_LLM_PROVIDER = "none";
delete process.env.GHL_API_TOKEN;
delete process.env.ADMIN_NOTIFICATION_EMAIL;
delete process.env.OUTBOUND_NOTIFY_EMAIL;

// Tue 2026-09-22 10:00 America/Los_Angeles
const TUESDAY_10AM = new Date("2026-09-22T17:00:00Z");

let server: http.Server;
let base = "";
type M = typeof import("@/lib/db");
let db: M["db"];
let schema: M["schema"];
let eq: typeof import("drizzle-orm").eq;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const html = req.url?.startsWith("/polished") ? POLISHED_SITE_HTML : req.url?.startsWith("/dated") ? DATED_SITE_HTML : null;
    if (!html) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": "text/html" }).end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const m = await import("@/lib/db");
  await m.dbReady();
  db = m.db;
  schema = m.schema;
  ({ eq } = await import("drizzle-orm"));
});

afterAll(() => {
  server?.close();
});

async function leadByEmail(email: string) {
  return (await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.email, email)).get())!;
}

describe("outbound pipeline", () => {
  let campaignId = "";

  it("imports a CSV with dedupe, validation and suppression", async () => {
    const { suppress } = await import("@/lib/outbound/replies/suppression");
    await suppress("blocked@nope.example", "manual", "test");
    const { importLeadsFromCsv } = await import("@/lib/outbound/leads/import");
    const csv = [
      "company_name,first_name,email,website,industry,city,state",
      `Mike's Heating,Mike,mike@mikes.example,${base}/dated,hvac,Reno,NV`,
      `Summit Plumbing,Dana,dana@summit.example,${base}/polished,plumbing,Denver,CO`,
      `Dead Site Roofing,Al,al@dead.example,${base}/missing,roofing,Reno,NV`,
      `Mike's Heating (dup),Mike,MIKE@mikes.example,${base}/dated,hvac,Reno,NV`,
      `Blocked Co,B,blocked@nope.example,${base}/dated,hvac,Reno,NV`,
      `No Contact,,,,hvac,,`,
    ].join("\n");
    const report = await importLeadsFromCsv(csv);
    expect(report).toMatchObject({ totalRows: 6, imported: 4, duplicates: 1, suppressed: 1 });
    expect(report.invalid).toHaveLength(1);
    expect((await leadByEmail("blocked@nope.example")).status).toBe("DO_NOT_CONTACT");

    // Re-importing the same file creates nothing new.
    expect((await importLeadsFromCsv(csv)).imported).toBe(0);
  });

  it("queues and analyzes websites, scoring and qualifying leads", async () => {
    const { queueLeadsForAnalysis } = await import("@/lib/outbound/website-analysis/service");
    const { runOutboundTick } = await import("@/lib/outbound/sending/scheduler");
    expect(await queueLeadsForAnalysis("all_new")).toBe(3);
    const tick = await runOutboundTick(TUESDAY_10AM);
    expect(tick.ran).toBe(true);

    const mike = await leadByEmail("mike@mikes.example");
    expect(mike.status).toBe("READY");
    expect(mike.priorityScore).toBeGreaterThan(50);
    const summit = await leadByEmail("dana@summit.example");
    expect(mike.priorityScore!).toBeGreaterThan(summit.priorityScore!);

    // 404 site: first failure re-queues, second gives up.
    let dead = await leadByEmail("al@dead.example");
    expect(dead.status).toBe("QUEUED");
    await runOutboundTick(TUESDAY_10AM);
    dead = await leadByEmail("al@dead.example");
    expect(dead.status).toBe("ANALYSIS_FAILED");
    const logs = await db.select().from(schema.outboundActivities).where(eq(schema.outboundActivities.leadId, dead.id)).all();
    expect(logs.some((l) => l.type === "WEBSITE_FETCH_FAILED" && l.level === "error")).toBe(true);

    const analysis = await db.select().from(schema.outboundLeadAnalyses).where(eq(schema.outboundLeadAnalyses.leadId, mike.id)).get();
    expect(JSON.parse(analysis!.observationsJson).length).toBeGreaterThan(0);
  });

  it("creates a campaign, drafts personalized messages, and requires approval", async () => {
    const { createCampaign, addLeadsToCampaign, launchBlockers } = await import("@/lib/outbound/campaigns/service");
    const { runOutboundTick } = await import("@/lib/outbound/sending/scheduler");
    const campaign = await createCampaign({ name: "Reno HVAC test", niche: "hvac", minDelaySeconds: 0 });
    campaignId = campaign.id;
    expect(launchBlockers(campaign)).toEqual([]);

    const mike = await leadByEmail("mike@mikes.example");
    const dead = await leadByEmail("al@dead.example");
    const result = await addLeadsToCampaign(campaignId, [mike.id, dead.id]);
    expect(result).toEqual({ added: 1, skipped: 1 }); // dead lead isn't READY

    await runOutboundTick(TUESDAY_10AM);
    const messages = await db.select().from(schema.outboundMessages).where(eq(schema.outboundMessages.leadId, mike.id)).all();
    expect(messages).toHaveLength(4);
    expect(messages.every((m) => m.status === "DRAFT")).toBe(true);
    const first = messages.find((m) => m.sequenceStep === 1)!;
    expect(first.body).toContain("Mike's Heating");
    expect(JSON.parse(first.lintJson!)).toEqual([]);
  });

  it("does not send until the campaign is launched and messages approved", async () => {
    const { runOutboundTick } = await import("@/lib/outbound/sending/scheduler");
    const { setCampaignStatus, approveCampaignLeads } = await import("@/lib/outbound/campaigns/service");
    await setCampaignStatus(campaignId, "ACTIVE");
    expect((await runOutboundTick(TUESDAY_10AM)).sent).toBe(0); // still DRAFTED

    expect(await approveCampaignLeads(campaignId, "all_drafted")).toBe(1);
    const saturday = new Date("2026-09-20T17:00:00Z"); // Sunday before: outside the send window
    const sat = await runOutboundTick(saturday);
    expect(sat.sent).toBe(0);
    expect(sat.skipped.join()).toContain("outside send window");

    const tick = await runOutboundTick(TUESDAY_10AM);
    expect(tick.sent).toBe(1);
    const mike = await leadByEmail("mike@mikes.example");
    expect(mike.status).toBe("ACTIVE_SEQUENCE");
    const cl = (await db.select().from(schema.outboundCampaignLeads).where(eq(schema.outboundCampaignLeads.leadId, mike.id)).get())!;
    expect(cl.currentStep).toBe(1);
    expect(cl.nextSendAt!.toISOString()).toBe("2026-09-25T17:00:00.000Z"); // day 3

    // Same tick again: follow-up not due yet → no double send.
    expect((await runOutboundTick(TUESDAY_10AM)).sent).toBe(0);
    // Day 3 (Friday 10am): step 2 goes out.
    expect((await runOutboundTick(new Date("2026-09-25T17:00:00Z"))).sent).toBe(1);
    const sent = await db.select().from(schema.outboundMessages).where(eq(schema.outboundMessages.status, "SENT")).all();
    expect(sent.map((m) => m.sequenceStep).sort()).toEqual([1, 2]);
  });

  it("enforces the campaign daily limit", async () => {
    const { sentInLast24h } = await import("@/lib/outbound/sending/scheduler");
    expect(await sentInLast24h(new Date("2026-09-25T18:00:00Z"), campaignId)).toBe(1);
  });

  it("stops the sequence on a positive reply, marks INTERESTED, and notifies", async () => {
    const { handleInboundReply } = await import("@/lib/outbound/replies/handle");
    const outcome = await handleInboundReply({
      fromEmail: "Mike@Mikes.example",
      content: "Yeah send it over.\n\nOn Tue, Robert wrote:\n> Want me to send it?",
      providerRef: "evt-1",
    });
    expect(outcome).toMatchObject({ status: "processed", classification: "INTERESTED" });
    expect(await handleInboundReply({ fromEmail: "mike@mikes.example", content: "dup", providerRef: "evt-1" })).toEqual({ status: "duplicate" });

    const mike = await leadByEmail("mike@mikes.example");
    expect(mike.status).toBe("INTERESTED");
    const cl = (await db.select().from(schema.outboundCampaignLeads).where(eq(schema.outboundCampaignLeads.leadId, mike.id)).get())!;
    expect(cl.status).toBe("STOPPED");
    const remaining = await db.select().from(schema.outboundMessages).where(eq(schema.outboundMessages.leadId, mike.id)).all();
    expect(remaining.filter((m) => m.status === "CANCELLED").map((m) => m.sequenceStep).sort()).toEqual([3, 4]);
    const acts = await db.select().from(schema.outboundActivities).where(eq(schema.outboundActivities.leadId, mike.id)).all();
    expect(acts.map((a) => a.type)).toEqual(expect.arrayContaining(["REPLY_RECEIVED", "SEQUENCE_STOPPED", "CRM_SYNC_SKIPPED", "OWNER_NOTIFIED"]));

    // Nothing more goes out even when step 3 would have been due.
    const { runOutboundTick } = await import("@/lib/outbound/sending/scheduler");
    expect((await runOutboundTick(new Date("2026-09-29T17:00:00Z"))).sent).toBe(0);
  });

  it("pushes interested leads to GHL through the service layer", async () => {
    process.env.GHL_API_TOKEN = "test-token";
    process.env.GHL_LOCATION_ID = "loc1";
    // Pipeline/stages resolved by name via the API.
    const { GhlClient, ghlConfig } = await import("@/lib/outbound/ghl/client");
    const { syncLeadToGhl } = await import("@/lib/outbound/ghl/service");
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body ?? "{}"));
      calls.push({ url: String(url), body });
      if (String(url).endsWith("/contacts/upsert")) return new Response(JSON.stringify({ new: true, contact: { id: "c1" } }));
      if (String(url).endsWith("/opportunities/")) return new Response(JSON.stringify({ opportunity: { id: "o1" } }));
      if (String(url).includes("/opportunities/pipelines"))
        return new Response(JSON.stringify({ pipelines: [{ id: "other", name: "Client Funnel", stages: [] }, { id: "pipe1", name: "Greenstar Outbound", stages: [{ id: "stage1", name: "Interested" }, { id: "stage2", name: "Call Booked" }] }] }));
      return new Response("{}");
    }) as unknown as typeof fetch;
    const mike = await leadByEmail("mike@mikes.example");
    const result = await syncLeadToGhl(mike, { reply: null, statusTag: "interested", originalMessage: { subject: "s", body: "b" } }, new GhlClient(ghlConfig()!, fetchImpl));
    expect(result).toEqual({ status: "synced", contactId: "c1", opportunityId: "o1" });
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual(["/contacts/upsert", "/contacts/c1/tags", "/contacts/c1/notes", "/opportunities/pipelines", "/opportunities/"]);
    expect(calls[4].body).toMatchObject({ pipelineId: "pipe1", pipelineStageId: "stage1", locationId: "loc1", status: "open" });
    expect(calls[0].body.tags).toEqual(expect.arrayContaining(["greenstar-outbound", "interested", "brand-opportunity", "followup-opportunity"]));
    expect((await leadByEmail("mike@mikes.example")).ghlOpportunityId).toBe("o1");
    delete process.env.GHL_API_TOKEN;
  });

  it("unsubscribe suppresses the address and blocks future campaigns", async () => {
    const { unsubscribeByToken } = await import("@/lib/outbound/replies/unsubscribe");
    const { isEmailSuppressed } = await import("@/lib/outbound/replies/suppression");
    const { addLeadsToCampaign } = await import("@/lib/outbound/campaigns/service");
    const summit = await leadByEmail("dana@summit.example");
    expect(await unsubscribeByToken("not-a-real-token-xyz", "test")).toBe(false);
    expect(await unsubscribeByToken(summit.unsubscribeToken, "test")).toBe(true);
    expect((await leadByEmail("dana@summit.example")).status).toBe("DO_NOT_CONTACT");
    expect(await isEmailSuppressed("DANA@summit.example")).toBe(true);
    expect((await addLeadsToCampaign(campaignId, [summit.id])).added).toBe(0);
  });

  it("bounces suppress and stop; opt-out replies suppress", async () => {
    const { insertLeads } = await import("@/lib/outbound/leads/import");
    const { handleBounce, handleInboundReply } = await import("@/lib/outbound/replies/handle");
    const { isEmailSuppressed } = await import("@/lib/outbound/replies/suppression");
    const base = { contactFirstName: null, contactLastName: null, phone: null, website: null, industry: "hvac", city: null, state: null, source: "test" };
    await insertLeads([
      { ...base, companyName: "Bouncy", email: "bounce@x.example" },
      { ...base, companyName: "Angry", email: "angry@x.example" },
    ]);
    expect(await handleBounce("bounce@x.example", "mailbox does not exist")).toBe(true);
    expect((await leadByEmail("bounce@x.example")).status).toBe("BOUNCED");
    expect(await isEmailSuppressed("bounce@x.example")).toBe(true);

    await handleInboundReply({ fromEmail: "angry@x.example", content: "Take me off your list." });
    expect((await leadByEmail("angry@x.example")).status).toBe("DO_NOT_CONTACT");
    expect(await isEmailSuppressed("angry@x.example")).toBe(true);
  });

  it("reports dashboard metrics", async () => {
    const { getOutboundMetrics } = await import("@/lib/outbound/metrics");
    const m = await getOutboundMetrics();
    expect(m).toMatchObject({ leadsImported: 6, emailsSent: 2, leadsContacted: 1, positiveReplies: 1, responseRate: 100, positiveResponseRate: 100 });
    expect(m.leadsAnalyzed).toBe(2);
  });

  it("the tick lock prevents overlapping runs", async () => {
    const { acquireLock, releaseLock } = await import("@/lib/outbound/core/lock");
    expect(await acquireLock("outbound_tick", 60_000)).toBe(true);
    const { runOutboundTick } = await import("@/lib/outbound/sending/scheduler");
    expect((await runOutboundTick(TUESDAY_10AM)).ran).toBe(false);
    await releaseLock("outbound_tick");
  });
});
