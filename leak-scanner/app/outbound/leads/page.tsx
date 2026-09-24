import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db, dbReady, schema } from "@/lib/db";
import { OUTBOUND_LEAD_STATUSES } from "@/lib/db/schema";
import { addToCampaignAction, importCsvAction, queueAnalysisAction } from "../actions";
import {
  Notice,
  RunNowButton,
  StatusBadge,
  buttonClass,
  fmtDateTime,
  inputClass,
  primaryButtonClass,
  selectClass,
} from "@/components/outbound/ui";

export const metadata: Metadata = { title: "Leads" };

const SORTS = {
  priority: schema.outboundLeads.priorityScore,
  company: schema.outboundLeads.companyName,
  created: schema.outboundLeads.createdAt,
  activity: schema.outboundLeads.lastActivityAt,
} as const;

type Params = { status?: string; niche?: string; q?: string; sort?: string; dir?: string; notice?: string; tone?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  await dbReady();
  const filters: SQL[] = [];
  if (params.status && (OUTBOUND_LEAD_STATUSES as readonly string[]).includes(params.status)) {
    filters.push(eq(schema.outboundLeads.status, params.status as (typeof OUTBOUND_LEAD_STATUSES)[number]));
  }
  if (params.niche) filters.push(eq(schema.outboundLeads.industry, params.niche));
  if (params.q?.trim()) {
    const q = `%${params.q.trim().toLowerCase()}%`;
    filters.push(or(like(schema.outboundLeads.companyName, q), like(schema.outboundLeads.email, q), like(schema.outboundLeads.websiteDomain, q))!);
  }
  const sortKey = (params.sort && params.sort in SORTS ? params.sort : "priority") as keyof typeof SORTS;
  const dir = params.dir === "asc" ? asc : desc;

  const [leads, niches, campaigns] = await Promise.all([
    db
      .select()
      .from(schema.outboundLeads)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(dir(SORTS[sortKey]), desc(schema.outboundLeads.createdAt))
      .limit(500)
      .all(),
    db.selectDistinct({ industry: schema.outboundLeads.industry }).from(schema.outboundLeads).all(),
    db.select().from(schema.outboundCampaigns).where(or(eq(schema.outboundCampaigns.status, "DRAFT"), eq(schema.outboundCampaigns.status, "ACTIVE"), eq(schema.outboundCampaigns.status, "PAUSED"))).all(),
  ]);

  const sortLink = (key: keyof typeof SORTS, label: string) => {
    const nextDir = sortKey === key && params.dir !== "asc" ? "asc" : "desc";
    const qs = new URLSearchParams({ ...(params.status ? { status: params.status } : {}), ...(params.niche ? { niche: params.niche } : {}), ...(params.q ? { q: params.q } : {}), sort: key, dir: nextDir });
    return (
      <Link href={`/outbound/leads?${qs}`} className="hover:text-foreground">
        {label}
        {sortKey === key ? (params.dir === "asc" ? " ↑" : " ↓") : ""}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex items-center gap-2">
          <Link href="/outbound/leads/new" className={buttonClass}>
            Add lead
          </Link>
          <RunNowButton returnTo="/outbound/leads" />
        </div>
      </div>
      <Notice notice={params.notice} tone={params.tone} />

      <details className="rounded-xl border border-border bg-card p-5" open={leads.length === 0}>
        <summary className="cursor-pointer font-semibold">Import CSV</summary>
        <form action={importCsvAction} className="mt-4 space-y-3 text-sm">
          <p className="text-muted-foreground">
            Columns (any order, common aliases accepted): company_name, first_name, last_name, email, website, phone, city, state, industry, source.
            Duplicates (same email, or same domain when no email) and suppressed addresses are handled automatically.
          </p>
          <input type="file" name="file" accept=".csv,text/csv" className="block text-sm" />
          <textarea name="csv" rows={4} placeholder="…or paste CSV text here" className="w-full rounded-lg border border-border bg-card p-3 font-mono text-xs" />
          <div className="flex flex-wrap items-center gap-4">
            <input name="source" placeholder="source label (optional)" className={`${inputClass} max-w-xs`} />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="autoQueue" defaultChecked /> Queue for website analysis
            </label>
            <button className={primaryButtonClass}>Import</button>
          </div>
        </form>
      </details>

      <form method="get" className="flex flex-wrap items-center gap-2 text-sm">
        <input name="q" defaultValue={params.q} placeholder="Search company, email, domain" className={`${inputClass} max-w-xs`} />
        <select name="status" defaultValue={params.status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {OUTBOUND_LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
        <select name="niche" defaultValue={params.niche ?? ""} className={selectClass}>
          <option value="">All niches</option>
          {niches
            .map((n) => n.industry)
            .filter((n): n is string => !!n)
            .sort()
            .map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
        </select>
        <input type="hidden" name="sort" value={sortKey} />
        <button className={buttonClass}>Filter</button>
        {(params.q || params.status || params.niche) && (
          <Link href="/outbound/leads" className="text-muted-foreground hover:underline">
            Clear
          </Link>
        )}
        <span className="ml-auto text-muted-foreground">{leads.length} shown{leads.length === 500 ? " (max)" : ""}</span>
      </form>

      <form className="space-y-3">
        <input type="hidden" name="returnTo" value="/outbound/leads" />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button formAction={queueAnalysisAction} className={buttonClass}>
            Analyze selected (or all NEW)
          </button>
          <select name="campaignId" className={selectClass} defaultValue="">
            <option value="">Add selected to campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status.toLowerCase()})
              </option>
            ))}
          </select>
          <button formAction={addToCampaignAction} className={buttonClass}>
            Add
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="w-8 p-3" />
                <th className="p-3 font-medium">{sortLink("company", "Company")}</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Niche</th>
                <th className="p-3 font-medium">Website</th>
                <th className="p-3 font-medium">{sortLink("priority", "Priority")}</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">{sortLink("activity", "Last activity")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No leads yet. Import a CSV above.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <input type="checkbox" name="ids" value={lead.id} aria-label={`Select ${lead.companyName}`} />
                    </td>
                    <td className="p-3 font-medium">
                      <Link href={`/outbound/leads/${lead.id}`} className="hover:underline">
                        {lead.companyName}
                      </Link>
                      {lead.city ? <div className="text-xs text-muted-foreground">{[lead.city, lead.state].filter(Boolean).join(", ")}</div> : null}
                    </td>
                    <td className="p-3">
                      <div>{[lead.contactFirstName, lead.contactLastName].filter(Boolean).join(" ") || "—"}</div>
                      <div className="text-xs text-muted-foreground">{lead.email ?? "no email"}</div>
                    </td>
                    <td className="p-3">{lead.industry ?? "—"}</td>
                    <td className="max-w-48 truncate p-3">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {lead.websiteDomain}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 font-semibold tabular-nums">{lead.priorityScore ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="p-3 text-muted-foreground">{fmtDateTime(lead.lastActivityAt ?? lead.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
}
