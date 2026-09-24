import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { OUTBOUND_REPLY_CLASSIFICATIONS } from "@/lib/db/schema";
import type { PriorityReason } from "@/lib/outbound/lead-scoring/priority";
import type { AnalysisObservation } from "@/lib/outbound/website-analysis/types";
import type { WebsiteSignals } from "@/lib/outbound/website-analysis/signals";
import { ghlConfigured } from "@/lib/outbound/ghl/service";
import { wordCount } from "@/lib/outbound/personalization/lint";
import {
  approveLeadMessagesAction,
  logReplyAction,
  pushToGhlAction,
  queueAnalysisAction,
  reclassifyReplyAction,
  regenerateAction,
  setLeadStatusAction,
  updateMessageAction,
} from "../../actions";
import { Notice, Section, StatusBadge, buttonClass, fmtDateTime, inputClass, primaryButtonClass, selectClass } from "@/components/outbound/ui";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const { notice, tone } = await searchParams;
  await dbReady();
  const lead = await db.select().from(schema.outboundLeads).where(eq(schema.outboundLeads.id, id)).get();
  if (!lead) notFound();

  const [analysis, campaignLeads, messages, replies, activity] = await Promise.all([
    db.select().from(schema.outboundLeadAnalyses).where(eq(schema.outboundLeadAnalyses.leadId, id)).orderBy(desc(schema.outboundLeadAnalyses.analyzedAt)).get(),
    db
      .select()
      .from(schema.outboundCampaignLeads)
      .innerJoin(schema.outboundCampaigns, eq(schema.outboundCampaigns.id, schema.outboundCampaignLeads.campaignId))
      .where(eq(schema.outboundCampaignLeads.leadId, id))
      .orderBy(desc(schema.outboundCampaignLeads.createdAt))
      .all(),
    db.select().from(schema.outboundMessages).where(eq(schema.outboundMessages.leadId, id)).orderBy(asc(schema.outboundMessages.sequenceStep)).all(),
    db.select().from(schema.outboundReplies).where(eq(schema.outboundReplies.leadId, id)).orderBy(desc(schema.outboundReplies.receivedAt)).all(),
    db.select().from(schema.outboundActivities).where(eq(schema.outboundActivities.leadId, id)).orderBy(desc(schema.outboundActivities.createdAt)).limit(60).all(),
  ]);
  const observations: AnalysisObservation[] = analysis ? JSON.parse(analysis.observationsJson) : [];
  const signals: WebsiteSignals | null = analysis ? JSON.parse(analysis.signalsJson) : null;
  const reasons: PriorityReason[] = lead.priorityReasonsJson ? JSON.parse(lead.priorityReasonsJson) : [];
  const contact = [lead.contactFirstName, lead.contactLastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/outbound/leads" className="text-sm text-muted-foreground hover:underline">
          ← Leads
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{lead.companyName}</h1>
          <StatusBadge status={lead.status} />
          {lead.priorityScore !== null ? <span className="text-sm text-muted-foreground">priority {lead.priorityScore}/100</span> : null}
        </div>
      </div>
      <Notice notice={notice} tone={tone} />
      {lead.lastError ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">{lead.lastError}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section
            title="Website analysis"
            actions={
              <form action={queueAnalysisAction}>
                <input type="hidden" name="ids" value={lead.id} />
                <input type="hidden" name="returnTo" value={`/outbound/leads/${lead.id}`} />
                <button className={buttonClass}>{analysis ? "Re-analyze" : "Queue analysis"}</button>
              </form>
            }
          >
            {!analysis ? (
              <p className="text-sm text-muted-foreground">Not analyzed yet.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <p>{analysis.websiteSummary}</p>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span>Brand {analysis.brandScore}</span>
                  <span>Conversion {analysis.conversionScore}</span>
                  <span>Follow-up opportunity {analysis.followupOpportunityScore}</span>
                  <span>
                    {analysis.source === "ai" ? `AI (${analysis.model})` : "deterministic"} · {fmtDateTime(analysis.analyzedAt)}
                  </span>
                </div>
                <ol className="space-y-2">
                  {observations.map((o, i) => (
                    <li key={i} className="rounded-lg bg-muted p-3">
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        {o.type} · {o.confidence} confidence
                      </div>
                      <div className="mt-1">{o.observation}</div>
                      {o.evidence ? <div className="mt-1 text-xs text-muted-foreground">Evidence: {o.evidence}</div> : null}
                    </li>
                  ))}
                </ol>
                <p>
                  <span className="font-medium">Angle:</span> {analysis.recommendedAngle}
                </p>
                {signals ? (
                  <details>
                    <summary className="cursor-pointer text-muted-foreground">Raw signals</summary>
                    <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(signals, null, 2)}</pre>
                  </details>
                ) : null}
              </div>
            )}
          </Section>

          {campaignLeads.map(({ outbound_campaign_leads: cl, outbound_campaigns: campaign }) => {
            const own = messages.filter((m) => m.campaignLeadId === cl.id);
            return (
              <Section
                key={cl.id}
                title={`Sequence · ${campaign.name}`}
                actions={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={cl.status} />
                    {cl.status === "DRAFTED" ? (
                      <form action={approveLeadMessagesAction.bind(null, lead.id, campaign.id, cl.id)}>
                        <button className={primaryButtonClass}>Approve sequence</button>
                      </form>
                    ) : null}
                    {["DRAFTED", "APPROVED", "FAILED"].includes(cl.status) && cl.currentStep === 0 ? (
                      <form action={regenerateAction.bind(null, lead.id, cl.id)}>
                        <button className={buttonClass}>Regenerate</button>
                      </form>
                    ) : null}
                  </div>
                }
              >
                <p className="mb-3 text-xs text-muted-foreground">
                  Step {cl.currentStep} sent · next {fmtDateTime(cl.nextSendAt)} · last contacted {fmtDateTime(cl.lastContactedAt)}
                  {cl.stopReason ? ` · ${cl.stopReason}` : ""}
                </p>
                {own.length === 0 ? <p className="text-sm text-muted-foreground">Drafts are generated on the next scheduler tick.</p> : null}
                <div className="space-y-4">
                  {own.map((m) => {
                    const lint: string[] = m.lintJson ? JSON.parse(m.lintJson) : [];
                    const editable = m.status === "DRAFT" || m.status === "APPROVED";
                    return (
                      <form key={m.id} action={updateMessageAction.bind(null, lead.id, m.id)} className="space-y-2 rounded-lg border border-border p-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Step {m.sequenceStep}</span>
                          <StatusBadge status={m.status} />
                          <span>{m.generationSource}</span>
                          <span>{wordCount(m.body)} words</span>
                          {m.sentAt ? <span>sent {fmtDateTime(m.sentAt)}</span> : null}
                          {m.error ? <span className="text-danger">{m.error}</span> : null}
                        </div>
                        <input name="subject" defaultValue={m.subject} readOnly={!editable} className={inputClass} />
                        <textarea
                          name="body"
                          defaultValue={m.body}
                          readOnly={!editable}
                          rows={Math.min(14, m.body.split("\n").length + 2)}
                          className="w-full rounded-lg border border-border bg-card p-3 text-sm leading-relaxed"
                        />
                        {lint.length ? <p className="text-xs text-warning">Review: {lint.join("; ")}</p> : null}
                        {editable ? <button className={buttonClass}>Save edits</button> : null}
                      </form>
                    );
                  })}
                </div>
              </Section>
            );
          })}

          <Section title="Replies">
            {replies.length === 0 ? <p className="mb-4 text-sm text-muted-foreground">No replies yet.</p> : null}
            <div className="space-y-3">
              {replies.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={r.classification} />
                    <span>
                      {r.classificationSource} · {r.confidence}
                    </span>
                    <span>{fmtDateTime(r.receivedAt)}</span>
                    <form action={reclassifyReplyAction.bind(null, lead.id, r.id)} className="ml-auto flex items-center gap-1">
                      <select name="classification" defaultValue={r.classification} className={selectClass}>
                        {OUTBOUND_REPLY_CLASSIFICATIONS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <button className={buttonClass}>Reclassify</button>
                    </form>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
            </div>
            <form action={logReplyAction.bind(null, lead.id)} className="mt-4 space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium">Log a reply manually (e.g. it landed in your inbox)</p>
              <textarea name="content" rows={3} className="w-full rounded-lg border border-border bg-card p-3 text-sm" placeholder="Paste their reply" />
              <div className="flex items-center gap-2">
                <select name="classification" defaultValue="" className={selectClass}>
                  <option value="">Auto-classify</option>
                  {OUTBOUND_REPLY_CLASSIFICATIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button className={buttonClass}>Log reply</button>
              </div>
            </form>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Company">
            <dl className="space-y-2 text-sm">
              {(
                [
                  ["Contact", contact || "—"],
                  ["Email", lead.email ?? "—"],
                  ["Phone", lead.phone ?? "—"],
                  ["Industry", lead.industry ?? "—"],
                  ["Location", [lead.city, lead.state].filter(Boolean).join(", ") || "—"],
                  ["Source", lead.source ?? "—"],
                  ["Added", fmtDateTime(lead.createdAt)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right break-all">{v}</dd>
                </div>
              ))}
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noreferrer" className="block text-primary hover:underline">
                  {lead.website}
                </a>
              ) : null}
            </dl>
          </Section>

          <Section title="Status">
            <form action={setLeadStatusAction.bind(null, lead.id)} className="flex items-center gap-2">
              <select name="status" className={selectClass} defaultValue="BOOKED">
                <option value="BOOKED">Booked</option>
                <option value="CUSTOMER">Customer</option>
                <option value="NOT_INTERESTED">Not interested</option>
                <option value="DO_NOT_CONTACT">Do not contact</option>
                <option value="READY">Back to ready</option>
              </select>
              <button className={buttonClass}>Set</button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">Anything other than &ldquo;ready&rdquo; stops open sequences. Do-not-contact also suppresses the address.</p>
          </Section>

          <Section title="GoHighLevel">
            <p className="text-sm">
              {lead.ghlContactId ? `Contact ${lead.ghlContactId}` : "Not synced"}
              {lead.ghlOpportunityId ? ` · opportunity ${lead.ghlOpportunityId}` : ""}
            </p>
            {ghlConfigured() ? (
              <form action={pushToGhlAction.bind(null, lead.id)} className="mt-3">
                <button className={buttonClass}>{lead.ghlContactId ? "Re-sync" : "Push to GHL"}</button>
              </form>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">GHL not configured (see Settings).</p>
            )}
          </Section>

          <Section title="Priority">
            {reasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Scored after analysis.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {reasons.map((r, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{r.detail}</span>
                    <span className={r.points < 0 ? "text-danger tabular-nums" : "tabular-nums"}>{r.points > 0 ? `+${r.points}` : r.points}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Timeline">
            <ol className="space-y-2 text-sm">
              {activity.map((a) => (
                <li key={a.id}>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className={a.level === "error" ? "font-mono text-danger" : a.level === "warn" ? "font-mono text-warning" : "font-mono text-muted-foreground"}>{a.type}</span>
                    <span className="text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
                  </div>
                  {a.message ? <div className="text-muted-foreground">{a.message}</div> : null}
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}
