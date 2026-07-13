import type { Metadata } from "next";
import Link from "next/link";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { businessesForOrg, scansForOrg } from "@/lib/db/queries";
import { ScoreRing } from "@/components/report/score-ring";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/billing/plans";
import { formatDate } from "@/lib/utils";
import { verdictForScore } from "@/lib/scoring/engine";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, organization } = await requireUserWithOrg();
  const businesses = businessesForOrg(organization.id);
  const scans = scansForOrg(organization.id);
  const completed = scans.filter((s) => s.status === "completed");
  const latest = completed[0] ?? null;
  const previous = completed[1] ?? null;
  const plan = PLANS[organization.plan];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {plan.name} plan ·{" "}
            {plan.scanFrequency === "one_time"
              ? "one free scan"
              : `${plan.scanFrequency} re-scans`}
          </p>
        </div>
        <Link href="/scanner" className={buttonClasses("primary", "md")}>
          Run a new scan
        </Link>
      </div>

      {latest ? (
        <section className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 sm:flex-row">
          <ScoreRing score={latest.revenueLeakScore ?? 0} size={130} label="Latest Revenue Leak Score" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold">{latest.businessName}</h2>
            <p className="text-sm text-muted-foreground">
              Scanned {formatDate(latest.completedAt)}
              {previous?.revenueLeakScore != null && latest.revenueLeakScore != null && (
                <>
                  {" · "}
                  {latest.revenueLeakScore > previous.revenueLeakScore
                    ? `up ${latest.revenueLeakScore - previous.revenueLeakScore} since last scan`
                    : latest.revenueLeakScore < previous.revenueLeakScore
                      ? `down ${previous.revenueLeakScore - latest.revenueLeakScore} since last scan`
                      : "unchanged since last scan"}
                </>
              )}
            </p>
            <p className="mt-3">{verdictForScore(latest.revenueLeakScore ?? 0)}</p>
            <Link
              href={`/report/${latest.shareToken}`}
              className={`${buttonClasses("outline", "sm")} mt-4`}
            >
              View full report
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">No scans yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Run your first scan to get your Revenue Leak Score and a
            prioritized fix roadmap.
          </p>
          <Link href="/scanner" className={`${buttonClasses("primary", "md")} mt-5`}>
            Run your free scan
          </Link>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Businesses</h2>
            <Badge tone="muted">
              {businesses.length}/{plan.maxBusinesses}
            </Badge>
          </div>
          {businesses.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Businesses appear here after your first scan.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {businesses.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <Link href={`/app/businesses/${b.id}`} className="hover:text-primary-strong">
                    {b.businessName}
                  </Link>
                  <span className="text-muted-foreground">{b.industry}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent scans</h2>
            <Link href="/app/scans" className="text-sm text-primary-strong hover:underline">
              View all
            </Link>
          </div>
          {scans.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No scans yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {scans.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <Link href={`/app/scans/${s.id}`} className="hover:text-primary-strong">
                    {s.businessName}
                  </Link>
                  <span className="font-medium">
                    {s.status === "completed" ? `${s.revenueLeakScore}/100` : s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {plan.id === "free" && (
        <section className="rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-8 text-white">
          <h2 className="text-xl font-bold">Keep your score moving</h2>
          <p className="mt-2 max-w-xl text-white/85">
            Paid plans re-scan automatically, track your score over time, and
            alert you when something regresses.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-primary-strong"
          >
            See plans
          </Link>
        </section>
      )}
    </div>
  );
}
