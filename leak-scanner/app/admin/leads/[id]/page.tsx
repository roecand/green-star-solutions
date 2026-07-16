import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge, severityTone } from "@/components/ui/badge";
import { ScoreRing } from "@/components/report/score-ring";
import { LeadActions } from "@/components/admin/lead-actions";
import { appUrl } from "@/lib/email/send";
import { serviceName } from "@/lib/services/catalog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Lead" };

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();
  if (!lead) notFound();

  const scan = await db.select().from(schema.scans).where(eq(schema.scans.id, lead.scanId)).get();
  const recommendations = scan
    ? await db
        .select()
        .from(schema.recommendations)
        .where(eq(schema.recommendations.scanId, scan.id))
        .all()
    : [];
  const notes = await db
    .select()
    .from(schema.adminNotes)
    .where(eq(schema.adminNotes.leadId, lead.id))
    .orderBy(desc(schema.adminNotes.createdAt))
    .all();

  const firstName = lead.contactName?.split(" ")[0];
  const outreachEmailOpener = `Hey${firstName ? ` ${firstName}` : ""},

I ran ${lead.websiteUrl.replace(/^https?:\/\//, "")} through our Revenue Leak Scanner and found a few things that may be costing you calls${lead.score != null ? ` — it scored ${lead.score}/100` : ""}. Want me to send over the report? It's free and takes 2 minutes to read.

— Robert, Greenstar Solutions`;

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{lead.businessName}</h1>
            {lead.hotScore >= 50 && <Badge tone="danger">🔥 hot {lead.hotScore}</Badge>}
            <Badge tone="muted">{lead.source}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.industry} · {[lead.city, lead.state].filter(Boolean).join(", ") || "—"} ·
            created {formatDate(lead.createdAt)}
          </p>
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{lead.contactName ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{lead.email ?? "not provided"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{lead.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Website</dt>
              <dd>
                <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="text-primary-strong hover:underline">
                  {lead.websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        {scan && (
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Scan result</h2>
              {scan.status === "completed" && (
                <Link href={`/report/${scan.shareToken}`} className="text-sm text-primary-strong hover:underline">
                  Open report
                </Link>
              )}
            </div>
            {scan.status === "completed" ? (
              <div className="mt-4 flex flex-wrap items-center gap-6">
                <ScoreRing score={scan.revenueLeakScore ?? 0} size={90} label="Leak Score" />
                <div className="grid flex-1 grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  {(
                    [
                      ["Conversion", scan.websiteConversionScore],
                      ["Local", scan.localVisibilityScore],
                      ["AI", scan.aiVisibilityScore],
                      ["Trust", scan.trustProofScore],
                      ["Follow-up", scan.followUpReadinessScore],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted p-2 text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Scan status: {scan.status}
                {scan.errorMessage && ` — ${scan.errorMessage}`}
              </p>
            )}
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Top issues → Greenstar services</h2>
            <ul className="mt-3 space-y-2">
              {recommendations.slice(0, 6).map((rec) => (
                <li key={rec.id} className="flex items-center gap-3 text-sm">
                  <Badge tone={severityTone(rec.severity)}>{rec.severity}</Badge>
                  <span className="flex-1">{rec.title}</span>
                  <span className="text-xs text-primary-strong">{serviceName(rec.greenstarService)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {notes.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Notes</h2>
            <ul className="mt-3 space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-lg bg-muted p-3 text-sm">
                  <p>{note.note}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div>
        <LeadActions
          leadId={lead.id}
          currentStatus={lead.lifecycleStatus}
          isOutreachTarget={lead.isOutreachTarget}
          outreachEmailOpener={outreachEmailOpener}
          reportUrl={scan ? appUrl(`/report/${scan.shareToken}`) : ""}
        />
      </div>
    </div>
  );
}
