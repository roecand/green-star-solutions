import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { HOT_LEAD_THRESHOLD } from "@/lib/leads/hot-score";
import { formatDate, scoreColorClass } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

const STATUS_TONES: Record<string, "success" | "warning" | "danger" | "muted"> = {
  new: "muted",
  viewed_report: "warning",
  requested_help: "danger",
  contacted: "warning",
  booked_call: "success",
  proposal_sent: "success",
  won: "success",
  lost: "muted",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  let leads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).all();
  if (status === "hot") {
    leads = leads
      .filter((l) => l.hotScore >= HOT_LEAD_THRESHOLD)
      .sort((a, b) => b.hotScore - a.hotScore);
  } else if (status === "outreach") {
    leads = leads.filter((l) => l.isOutreachTarget);
  } else if (status) {
    leads = leads.filter((l) => l.lifecycleStatus === status);
  }

  const filters = [
    ["", "All"],
    ["hot", "🔥 Hot"],
    ["new", "New"],
    ["requested_help", "Requested help"],
    ["outreach", "Outreach targets"],
    ["contacted", "Contacted"],
    ["won", "Won"],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/admin/leads?status=${value}` : "/admin/leads"}
            className={
              (status ?? "") === value
                ? "rounded-full bg-primary px-3 py-1 text-sm font-medium text-white"
                : "rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
            }
          >
            {label}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No leads match this filter yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Business</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Hot</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-4">
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:text-primary-strong">
                      {lead.businessName}
                    </Link>
                    {lead.isOutreachTarget && (
                      <span className="ml-2 text-xs text-primary-strong">🎯</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{lead.email ?? "—"}</td>
                  <td className="p-4 text-muted-foreground">{lead.industry}</td>
                  <td className={`p-4 font-medium ${lead.score != null ? scoreColorClass(lead.score) : ""}`}>
                    {lead.score ?? "—"}
                  </td>
                  <td className="p-4 font-medium">
                    {lead.hotScore >= HOT_LEAD_THRESHOLD ? `🔥 ${lead.hotScore}` : lead.hotScore}
                  </td>
                  <td className="p-4">
                    <Badge tone={STATUS_TONES[lead.lifecycleStatus] ?? "muted"}>
                      {lead.lifecycleStatus.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
