import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { HOT_LEAD_THRESHOLD } from "@/lib/leads/hot-score";
import { formatDate, scoreColorClass } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const leads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).all();
  const scans = await db.select().from(schema.scans).orderBy(desc(schema.scans.createdAt)).all();

  const completedScans = scans.filter((s) => s.status === "completed");
  const avgScore =
    completedScans.length > 0
      ? Math.round(
          completedScans.reduce((sum, s) => sum + (s.revenueLeakScore ?? 0), 0) /
            completedScans.length
        )
      : null;
  const hotLeads = leads
    .filter((l) => l.hotScore >= HOT_LEAD_THRESHOLD && !["won", "lost"].includes(l.lifecycleStatus))
    .sort((a, b) => b.hotScore - a.hotScore);
  const helpRequests = leads.filter((l) => l.lifecycleStatus === "requested_help");
  const newLeads = leads.filter((l) => l.lifecycleStatus === "new");

  const byIndustry = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const lead of leads) {
    byIndustry.set(lead.industry, (byIndustry.get(lead.industry) ?? 0) + 1);
    if (lead.city) byCity.set(lead.city, (byCity.get(lead.city) ?? 0) + 1);
  }
  const topIndustries = [...byIndustry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topCities = [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const lowestScoring = completedScans
    .filter((s) => s.revenueLeakScore != null)
    .sort((a, b) => (a.revenueLeakScore ?? 0) - (b.revenueLeakScore ?? 0))
    .slice(0, 5);

  const stats = [
    ["Total scans", scans.length],
    ["New leads", newLeads.length],
    ["Average score", avgScore ?? "—"],
    ["Help requests", helpRequests.length],
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">🔥 Hottest leads</h2>
          <Link href="/admin/leads" className="text-sm text-primary-strong hover:underline">
            All leads
          </Link>
        </div>
        {hotLeads.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No hot leads yet. Leads heat up when they score below 65, leave an
            email, view their report, or ask for help.
          </p>
        ) : (
          <ul>
            {hotLeads.slice(0, 8).map((lead) => (
              <li key={lead.id} className="flex items-center gap-4 border-b border-border p-4 text-sm last:border-0">
                <span className="w-14 font-bold text-danger">{lead.hotScore}°</span>
                <Link href={`/admin/leads/${lead.id}`} className="flex-1 font-medium hover:text-primary-strong">
                  {lead.businessName}
                </Link>
                <span className="text-muted-foreground">{lead.industry}</span>
                <span className={lead.score != null ? scoreColorClass(lead.score) : ""}>
                  {lead.score != null ? `${lead.score}/100` : "—"}
                </span>
                <Badge tone={lead.lifecycleStatus === "requested_help" ? "danger" : "muted"}>
                  {lead.lifecycleStatus.replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Leads by industry</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topIndustries.length === 0 && <li className="text-muted-foreground">No leads yet.</li>}
            {topIndustries.map(([industry, count]) => (
              <li key={industry} className="flex justify-between">
                <span>{industry}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Leads by city</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topCities.length === 0 && <li className="text-muted-foreground">No city data yet.</li>}
            {topCities.map(([city, count]) => (
              <li key={city} className="flex justify-between">
                <span>{city}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Lowest scores</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lowestScoring.length === 0 && <li className="text-muted-foreground">No completed scans.</li>}
            {lowestScoring.map((scan) => (
              <li key={scan.id} className="flex justify-between">
                <Link href={`/admin/scans/${scan.id}`} className="truncate hover:text-primary-strong">
                  {scan.websiteUrl.replace(/^https?:\/\//, "")}
                </Link>
                <span className={`font-medium ${scoreColorClass(scan.revenueLeakScore ?? 0)}`}>
                  {scan.revenueLeakScore}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Recent scans</h2>
        </div>
        <ul>
          {scans.slice(0, 8).map((scan) => (
            <li key={scan.id} className="flex items-center gap-4 border-b border-border p-4 text-sm last:border-0">
              <span className="flex-1 truncate">{scan.websiteUrl.replace(/^https?:\/\//, "")}</span>
              <span className="text-muted-foreground">{formatDate(scan.createdAt)}</span>
              <Badge tone={scan.status === "completed" ? "success" : scan.status === "failed" ? "danger" : "warning"}>
                {scan.status}
              </Badge>
              <span className="w-16 text-right font-medium">
                {scan.revenueLeakScore != null ? `${scan.revenueLeakScore}/100` : "—"}
              </span>
              <Link href={`/admin/scans/${scan.id}`} className="text-primary-strong hover:underline">
                View
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
