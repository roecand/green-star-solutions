import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, notInArray } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { launchBlockers } from "@/lib/outbound/campaigns/service";
import { parseSequence } from "@/lib/outbound/personalization/sequence";
import { renderEmailText } from "@/lib/outbound/personalization/render";
import { isWithinSendWindow } from "@/lib/outbound/sending/window";
import { addToCampaignAction, approveCampaignAction, campaignStatusAction } from "../../actions";
import { Notice, RunNowButton, Section, StatusBadge, buttonClass, fmtDateTime, primaryButtonClass } from "@/components/outbound/ui";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const { notice, tone } = await searchParams;
  await dbReady();
  const campaign = await db.select().from(schema.outboundCampaigns).where(eq(schema.outboundCampaigns.id, id)).get();
  if (!campaign) notFound();

  const members = await db
    .select()
    .from(schema.outboundCampaignLeads)
    .innerJoin(schema.outboundLeads, eq(schema.outboundLeads.id, schema.outboundCampaignLeads.leadId))
    .where(eq(schema.outboundCampaignLeads.campaignId, id))
    .orderBy(desc(schema.outboundLeads.priorityScore))
    .all();
  const memberIds = members.map((m) => m.outbound_leads.id);
  const available = await db
    .select()
    .from(schema.outboundLeads)
    .where(
      and(
        eq(schema.outboundLeads.status, "READY"),
        ...(campaign.niche ? [eq(schema.outboundLeads.industry, campaign.niche.toLowerCase())] : []),
        ...(memberIds.length ? [notInArray(schema.outboundLeads.id, memberIds)] : [])
      )
    )
    .orderBy(desc(schema.outboundLeads.priorityScore))
    .limit(200)
    .all();

  const sequence = parseSequence(campaign.sequenceJson);
  const previewMember = members.find((m) => ["DRAFTED", "APPROVED", "ACTIVE"].includes(m.outbound_campaign_leads.status));
  const preview = previewMember
    ? await db.select().from(schema.outboundMessages).where(eq(schema.outboundMessages.campaignLeadId, previewMember.outbound_campaign_leads.id)).orderBy(asc(schema.outboundMessages.sequenceStep)).all()
    : [];
  const blockers = launchBlockers(campaign);
  const days: number[] = JSON.parse(campaign.sendDaysJson);
  const windowOpen = isWithinSendWindow(new Date(), { timezone: campaign.timezone, startHour: campaign.sendWindowStart, endHour: campaign.sendWindowEnd, days });
  const drafted = members.filter((m) => m.outbound_campaign_leads.status === "DRAFTED").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/outbound/campaigns" className="text-sm text-muted-foreground hover:underline">
          ← Campaigns
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <StatusBadge status={campaign.status} />
          <div className="ml-auto flex items-center gap-2">
            {campaign.status !== "ACTIVE" && campaign.status !== "COMPLETED" ? (
              <form action={campaignStatusAction.bind(null, campaign.id)}>
                <input type="hidden" name="status" value="ACTIVE" />
                <button className={primaryButtonClass} disabled={blockers.length > 0}>
                  {campaign.launchedAt ? "Resume" : "Launch"}
                </button>
              </form>
            ) : null}
            {campaign.status === "ACTIVE" ? (
              <form action={campaignStatusAction.bind(null, campaign.id)}>
                <input type="hidden" name="status" value="PAUSED" />
                <button className={buttonClass}>Pause</button>
              </form>
            ) : null}
            <RunNowButton returnTo={`/outbound/campaigns/${campaign.id}`} />
          </div>
        </div>
      </div>
      <Notice notice={notice} tone={tone} />
      {blockers.length ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Can&apos;t launch yet:</p>
          <ul className="ml-5 list-disc">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {campaign.provider === "mock" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">Mock provider: sends are simulated and recorded; no email leaves the app.</p>
      ) : null}

      <Section title="Settings">
        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Provider</dt>
            <dd>
              {campaign.provider}
              {campaign.providerCampaignRef ? ` · #${campaign.providerCampaignRef}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Daily limit / spacing</dt>
            <dd>
              {campaign.dailyLimit}/day · {campaign.minDelaySeconds}s apart
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Window</dt>
            <dd>
              {campaign.sendWindowStart}:00–{campaign.sendWindowEnd}:00 {campaign.timezone} · days {days.join(",")} · {windowOpen ? "open now" : "closed now"}
            </dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-muted-foreground">Sequence</dt>
            <dd>{sequence.map((s) => `day ${s.dayOffset}: ${s.intent.replace("_", " ")}`).join(" → ")}</dd>
          </div>
        </dl>
      </Section>

      <Section
        title={`Leads in campaign (${members.length})`}
        actions={
          drafted > 0 ? (
            <form action={approveCampaignAction.bind(null, campaign.id)}>
              <button className={primaryButtonClass}>Approve all {drafted} drafted</button>
            </form>
          ) : null
        }
      >
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet — add READY leads below.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-2 font-medium">Company</th>
                  <th className="p-2 font-medium">Priority</th>
                  <th className="p-2 font-medium">Sequence</th>
                  <th className="p-2 font-medium">Step</th>
                  <th className="p-2 font-medium">Next send</th>
                  <th className="p-2 font-medium">Lead</th>
                </tr>
              </thead>
              <tbody>
                {members.map(({ outbound_campaign_leads: cl, outbound_leads: lead }) => (
                  <tr key={cl.id} className="border-b border-border last:border-0">
                    <td className="p-2 font-medium">
                      <Link href={`/outbound/leads/${lead.id}`} className="hover:underline">
                        {lead.companyName}
                      </Link>
                      {cl.stopReason ? <div className="text-xs text-muted-foreground">{cl.stopReason}</div> : null}
                    </td>
                    <td className="p-2 tabular-nums">{lead.priorityScore ?? "—"}</td>
                    <td className="p-2">
                      <StatusBadge status={cl.status} />
                    </td>
                    <td className="p-2 tabular-nums">
                      {cl.currentStep}/{sequence.length}
                    </td>
                    <td className="p-2 text-muted-foreground">{fmtDateTime(cl.nextSendAt)}</td>
                    <td className="p-2">
                      <StatusBadge status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {preview.length ? (
        <Section title={`Sequence preview · ${previewMember!.outbound_leads.companyName}`}>
          <div className="grid gap-4 lg:grid-cols-2">
            {preview.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  Step {m.sequenceStep} · day {sequence.find((s) => s.step === m.sequenceStep)?.dayOffset} <StatusBadge status={m.status} />
                </div>
                <div className="font-medium">{m.subject}</div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">{renderEmailText(m.body, previewMember!.outbound_leads.unsubscribeToken)}</pre>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {campaign.status !== "COMPLETED" ? (
        <Section title={`Add READY leads${campaign.niche ? ` · niche "${campaign.niche}"` : ""} (${available.length})`}>
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No READY leads{campaign.niche ? " in this niche" : ""}. Import and analyze leads on the <Link href="/outbound/leads" className="text-primary hover:underline">Leads</Link> page.
            </p>
          ) : (
            <form action={addToCampaignAction} className="space-y-3">
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input type="hidden" name="returnTo" value={`/outbound/campaigns/${campaign.id}`} />
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                {available.map((lead) => (
                  <label key={lead.id} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-muted/50">
                    <input type="checkbox" name="ids" value={lead.id} defaultChecked />
                    <span className="w-10 tabular-nums font-semibold">{lead.priorityScore}</span>
                    <span className="font-medium">{lead.companyName}</span>
                    <span className="text-muted-foreground">{lead.email}</span>
                    <span className="ml-auto text-muted-foreground">{lead.industry}</span>
                  </label>
                ))}
              </div>
              <button className={primaryButtonClass}>Add selected</button>
            </form>
          )}
        </Section>
      ) : null}
    </div>
  );
}
