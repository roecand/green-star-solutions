import Link from "next/link";
import { dbReady } from "@/lib/db";
import { getOutboundMetrics, interestedLeads, recentActivity } from "@/lib/outbound/metrics";
import { Notice, RunNowButton, Section, Stat, StatusBadge, fmtDateTime } from "@/components/outbound/ui";

export default async function OutboundDashboard({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  const { notice, tone } = await searchParams;
  await dbReady();
  const [m, hot, errors] = await Promise.all([getOutboundMetrics(), interestedLeads(), recentActivity(12, true)]);
  const pct = (v: number | null) => (v === null ? "—" : `${v}%`);
  const s = m.statusCounts;
  const pipeline: Array<[string, number]> = [
    ["New", s.NEW ?? 0],
    ["Queued / analyzing", (s.QUEUED ?? 0) + (s.ANALYZING ?? 0)],
    ["Ready", s.READY ?? 0],
    ["In sequence", s.ACTIVE_SEQUENCE ?? 0],
    ["Disqualified", s.DISQUALIFIED ?? 0],
    ["Analysis failed", s.ANALYSIS_FAILED ?? 0],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Import → analyze → draft → approve → send → replies → GoHighLevel.</p>
        </div>
        <RunNowButton returnTo="/outbound" />
      </div>
      <Notice notice={notice} tone={tone} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <Stat label="Leads imported" value={m.leadsImported} />
        <Stat label="Leads analyzed" value={m.leadsAnalyzed} />
        <Stat label="Active sequences" value={m.activeSequences} />
        <Stat label="Emails sent" value={m.emailsSent} hint={`${m.leadsContacted} leads contacted`} />
        <Stat label="Replies" value={m.leadsReplied} />
        <Stat label="Positive replies" value={m.positiveReplies} />
        <Stat label="Booked" value={m.booked} hint="BOOKED + CUSTOMER" />
        <Stat label="Response rate" value={pct(m.responseRate)} />
        <Stat label="Positive rate" value={pct(m.positiveResponseRate)} />
        <Stat label="Awaiting review" value={m.awaitingReview} hint="drafted sequences" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Needs you">
          {hot.length === 0 ? (
            <p className="text-sm text-muted-foreground">No replies waiting. Interested and replied leads show up here.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {hot.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/outbound/leads/${lead.id}`} className="font-medium hover:underline">
                    {lead.companyName}
                  </Link>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    {fmtDateTime(lead.lastActivityAt)} <StatusBadge status={lead.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {m.awaitingReview > 0 ? (
            <p className="mt-3 text-sm">
              {m.awaitingReview} drafted sequence(s) waiting for approval — open a <Link href="/outbound/campaigns" className="text-primary hover:underline">campaign</Link> to review.
            </p>
          ) : null}
        </Section>

        <Section title="Pipeline">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {pipeline.map(([label, n]) => (
              <div key={label} className="flex justify-between rounded-lg bg-muted px-3 py-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>

      <Section title="Automation problems">
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No warnings or errors logged.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {errors.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-3">
                <span className={e.level === "error" ? "font-mono text-xs text-danger" : "font-mono text-xs text-warning"}>{e.type}</span>
                {e.leadId ? (
                  <Link href={`/outbound/leads/${e.leadId}`} className="font-medium hover:underline">
                    {e.companyName}
                  </Link>
                ) : null}
                <span className="text-muted-foreground">{e.message}</span>
                <span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
