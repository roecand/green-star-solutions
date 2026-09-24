import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { getOutboundSettings } from "@/lib/outbound/core/settings";
import { listEmailProviders } from "@/lib/outbound/email";
import { ghlConfig } from "@/lib/outbound/ghl/client";
import { llmProviderName } from "@/lib/outbound/llm";
import { senderConfig } from "@/lib/outbound/personalization/render";
import { addSuppressionAction, saveSettingsAction } from "../actions";
import { Notice, Section, fmtDateTime, inputClass, primaryButtonClass, buttonClass } from "@/components/outbound/ui";

export const metadata: Metadata = { title: "Settings" };

/** Shows configuration status only — secret values never reach the browser. */
export default async function OutboundSettingsPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { notice, tone } = await searchParams;
  await dbReady();
  const [settings, suppressions] = await Promise.all([
    getOutboundSettings(),
    db.select().from(schema.outboundSuppressions).orderBy(desc(schema.outboundSuppressions.createdAt)).limit(100).all(),
  ]);
  const ghl = ghlConfig();
  const sender = senderConfig();
  const has = (key: string) => !!process.env[key]?.trim();
  const rows: Array<[string, boolean, string]> = [
    ["LLM", llmProviderName() !== "none", `${llmProviderName()} · model ${process.env.OUTBOUND_LLM_MODEL || process.env.AI_MODEL || "default"} (OUTBOUND_LLM_PROVIDER, ANTHROPIC_API_KEY / OPENAI_API_KEY)`],
    ...listEmailProviders().map((p): [string, boolean, string] => [`Email: ${p.id}`, p.configured, p.label]),
    ["Sender address (CAN-SPAM)", !!sender.postalAddress, sender.postalAddress ?? "OUTBOUND_SENDER_ADDRESS missing — required before real sends"],
    ["Sender name", has("OUTBOUND_SENDER_NAME"), `${sender.name} · ${sender.company}`],
    ["Public app URL", has("NEXT_PUBLIC_APP_URL"), `${sender.appUrl} (used in unsubscribe links)`],
    ["Cron secret", has("OUTBOUND_CRON_SECRET"), "OUTBOUND_CRON_SECRET — lets n8n/cron call /api/outbound/tick"],
    ["Webhook secret", has("OUTBOUND_WEBHOOK_SECRET"), "OUTBOUND_WEBHOOK_SECRET — protects /api/outbound/webhooks/email"],
    ["GoHighLevel", !!ghl, ghl ? `location ${ghl.locationId}` : "GHL_API_TOKEN + GHL_LOCATION_ID"],
    ["GHL pipeline", !!ghl?.pipelineId && !!ghl?.stageInterestedId, "GHL_PIPELINE_ID + GHL_STAGE_INTERESTED_ID (opportunities)"],
    ["Owner notifications", has("OUTBOUND_NOTIFY_EMAIL") || has("ADMIN_NOTIFICATION_EMAIL"), `${process.env.OUTBOUND_NOTIFY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "not set"} via Resend (${has("RESEND_API_KEY") ? "live" : "mocked"})`],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Notice notice={notice} tone={tone} />

      <Section title="Integrations (environment variables)">
        <p className="mb-3 text-sm text-muted-foreground">Secrets live in env vars only (see .env.example). This page shows whether each is set, never the value.</p>
        <ul className="divide-y divide-border text-sm">
          {rows.map(([label, ok, detail]) => (
            <li key={label} className="flex flex-wrap items-baseline gap-3 py-2">
              <span className={ok ? "w-5 text-primary" : "w-5 text-danger"}>{ok ? "✓" : "✗"}</span>
              <span className="w-56 font-medium">{label}</span>
              <span className="text-muted-foreground">{detail}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Sending & qualification">
        <form action={saveSettingsAction} className="grid gap-4 text-sm sm:grid-cols-2">
          <label className="space-y-1">
            <span className="font-medium">Mailbox daily limit (all campaigns, rolling 24h)</span>
            <input name="mailboxDailyLimit" type="number" min={0} defaultValue={settings.mailboxDailyLimit} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Minimum priority score to be READY</span>
            <input name="minPriorityScore" type="number" min={0} max={100} defaultValue={settings.minPriorityScore} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Leads analyzed per tick</span>
            <input name="analysisBatchSize" type="number" min={1} max={50} defaultValue={settings.analysisBatchSize} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">Sequences drafted per tick</span>
            <input name="draftBatchSize" type="number" min={1} max={50} defaultValue={settings.draftBatchSize} className={inputClass} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="font-medium">Target industries (comma-separated)</span>
            <input name="targetIndustries" defaultValue={settings.targetIndustries.join(", ")} className={inputClass} />
          </label>
          <div>
            <button className={primaryButtonClass}>Save</button>
          </div>
        </form>
      </Section>

      <Section title={`Suppression list (${suppressions.length}${suppressions.length === 100 ? "+" : ""})`}>
        <form action={addSuppressionAction} className="mb-4 flex gap-2">
          <input name="value" placeholder="email@domain.com or @domain.com" className={`${inputClass} max-w-sm`} />
          <button className={buttonClass}>Suppress</button>
        </form>
        <ul className="divide-y divide-border text-sm">
          {suppressions.map((s) => (
            <li key={s.id} className="flex gap-3 py-1.5">
              <span className="font-mono">{s.value}</span>
              <span className="text-muted-foreground">{s.reason}</span>
              <span className="ml-auto text-muted-foreground">{fmtDateTime(s.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
