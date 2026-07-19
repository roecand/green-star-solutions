import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScoreRing } from "@/components/report/score-ring";
import { CtaPanel } from "@/components/report/cta-panel";
import { DeepenForm } from "@/components/report/deepen-form";
import { LeakGauge } from "@/components/report/leak-gauge";
import {
  intakeSchema,
  buildIntakeInsights,
  customerValueSchema,
  opportunityLine,
} from "@/lib/scoring/intake";
import { Badge, severityTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { aiReportSchema, type AIReport } from "@/lib/ai/report-schema";
import { CATEGORY_LABELS, CATEGORY_SCORE_KEYS } from "@/lib/scoring/engine";
import { PLANS } from "@/lib/billing/plans";
import { billingEnabled, bookingUrl } from "@/lib/flags";
import { trackEvent } from "@/lib/analytics/track";
import { formatDate } from "@/lib/utils";
import type { FindingCategory } from "@/lib/scanner/types";

export const metadata: Metadata = { title: "Revenue Leak Report" };

const CATEGORIES: FindingCategory[] = [
  "conversion",
  "local",
  "ai_visibility",
  "trust",
  "follow_up",
];

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const scan = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.shareToken, token))
    .get();
  if (!scan) notFound();

  const business = await db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, scan.businessId))
    .get();
  const lead = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.scanId, scan.id))
    .get();

  // Mark the lead as having viewed the report (first view only).
  if (lead && lead.lifecycleStatus === "new") {
    await db.update(schema.leads)
      .set({ lifecycleStatus: "viewed_report" })
      .where(eq(schema.leads.id, lead.id))
      .run();
  }
  trackEvent({ eventType: "report_view", scanId: scan.id, leadId: lead?.id });

  const organization = business?.organizationId
    ? await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, business.organizationId))
        .get()
    : null;
  const plan = PLANS[organization?.plan ?? "free"];

  if (scan.status === "failed") {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">We couldn&apos;t complete this scan</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {scan.errorMessage ??
              "The website couldn't be read. That can itself be a leak — if automated systems can't read your site, AI and search tools may struggle too."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/scanner" className={buttonClasses("primary", "lg")}>
              Try another URL
            </Link>
            <Link href="/contact" className={buttonClasses("outline", "lg")}>
              Ask Greenstar for help
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (scan.status !== "completed" || !scan.aiReportJson) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">This report is still being generated</h1>
          <p className="mt-3 text-muted-foreground">
            Refresh in a few seconds — scans usually finish in under a minute.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  let report: AIReport;
  try {
    report = aiReportSchema.parse(JSON.parse(scan.aiReportJson));
  } catch {
    notFound();
  }

  const scores = {
    websiteConversionScore: scan.websiteConversionScore ?? 0,
    localVisibilityScore: scan.localVisibilityScore ?? 0,
    aiVisibilityScore: scan.aiVisibilityScore ?? 0,
    trustProofScore: scan.trustProofScore ?? 0,
    followUpReadinessScore: scan.followUpReadinessScore ?? 0,
  };
  const leakScore = scan.revenueLeakScore ?? 0;
  // Legacy paid-SaaS gating, only relevant if billing is ever re-enabled.
  const isFreePlan = billingEnabled() && plan.id === "free";

  // Ladder funnel: quick scans show the surface (score, categories, top 3
  // leaks); answering the deep questions upgrades to the comprehensive audit
  // (full leak list, roadmap, service matches, personalized insights).
  const isQuick = scan.depth !== "comprehensive";
  const noWebsite = !scan.websiteUrl;

  // Customer value: captured in the quick scan; older deep audits stored it
  // inside intakeJson, so fall back to that for pre-migration scans.
  const rawIntake: Record<string, unknown> | null = scan.intakeJson
    ? (JSON.parse(scan.intakeJson) as Record<string, unknown>)
    : null;
  const customerValueParse = customerValueSchema.safeParse(
    scan.customerValue ?? rawIntake?.customerValue
  );
  const customerValue = customerValueParse.success ? customerValueParse.data : null;
  const moneyLine = opportunityLine(customerValue, { noWebsite });

  let intakeInsights: ReturnType<typeof buildIntakeInsights> = [];
  if (!isQuick && rawIntake) {
    const parsedIntake = intakeSchema.safeParse(rawIntake);
    if (parsedIntake.success) {
      intakeInsights = buildIntakeInsights(parsedIntake.data, customerValue);
    }
  }

  const visibleLeaks =
    isQuick || isFreePlan ? report.top_revenue_leaks.slice(0, 3) : report.top_revenue_leaks;
  const hiddenLeakCount = report.top_revenue_leaks.length - visibleLeaks.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {/* Header */}
        <section className="flex flex-col items-center gap-8 rounded-2xl border border-border bg-card p-8 md:flex-row md:items-start">
          <LeakGauge score={leakScore} />
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-medium uppercase tracking-wider text-primary-strong">
              Revenue Leak Report
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {business?.businessName ?? "Your business"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {scan.websiteUrl ? scan.websiteUrl.replace(/^https?:\/\//, "") : "No website yet"} ·
              Scanned {formatDate(scan.completedAt)}
              {[scan.city, scan.state].filter(Boolean).length > 0 &&
                ` · ${[scan.city, scan.state].filter(Boolean).join(", ")}`}
            </p>
            <p className="mt-4 text-lg font-medium">{report.score_verdict}</p>
            {moneyLine && (
              <p className="mt-4 rounded-xl border-2 border-warning/40 bg-amber-50 p-4 text-sm font-medium leading-relaxed">
                💸{" "}
                {moneyLine}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {report.executive_summary}
            </p>
            <p className="mt-4 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              {noWebsite ? (
                <>
                  This report is based on <strong>publicly visible signals</strong>.
                  Because there&apos;s no website to scan, your score reflects the
                  <strong> untapped opportunity </strong> of being invisible online —
                  not a judgment of your business. Internal systems we can&apos;t see
                  from outside are treated as &ldquo;not publicly verifiable,&rdquo;
                  never counted against you.
                </>
              ) : (
                <>
                  This report is based on <strong>publicly visible signals</strong> from
                  your website. Your Revenue Leak Score reflects <strong>potential
                  revenue-capture risk</strong> — not verified financial loss. Internal
                  systems we can&apos;t see from outside (your CRM, phone handling, or
                  follow-up process) are treated as &ldquo;not publicly verifiable,&rdquo;
                  never counted against you.
                </>
              )}
            </p>
          </div>
        </section>

        {/* No-website: one fact, stated once — not five identical zero-cards.
            The category grid is replaced by a single what-this-means panel. */}
        {noWebsite ? (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-bold">What being offline is costing you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One root cause, five downstream effects — every one of them fixable
              with the same move.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {report.category_summaries.map((summary) => (
                <div key={summary.category} className="flex gap-3 rounded-xl bg-muted/60 p-4">
                  <span className="text-lg" aria-hidden>
                    💧
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {CATEGORY_LABELS[summary.category]}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {summary.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Where the leaks are</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => {
              const summary = report.category_summaries.find((c) => c.category === category);
              const score = scores[CATEGORY_SCORE_KEYS[category]];
              return (
                <div key={category} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{CATEGORY_LABELS[category]}</h3>
                    <ScoreRing score={score} size={56} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {summary?.summary}
                  </p>
                  {summary && (
                    <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                      <p>
                        <span className="font-medium text-danger">Top issue: </span>
                        {summary.top_issue}
                      </p>
                      <p>
                        <span className="font-medium text-primary-strong">Fix: </span>
                        {summary.suggested_fix}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Top revenue leaks */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Top revenue leaks</h2>
          <p className="mt-1 text-sm text-muted-foreground">{report.report_intro}</p>
          <div className="mt-4 space-y-3">
            {visibleLeaks.map((leak, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                  {i + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{leak.title}</h3>
                    <Badge tone={severityTone(leak.severity)}>{leak.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {leak.explanation}
                  </p>
                </div>
              </div>
            ))}
            {hiddenLeakCount > 0 && isQuick && (
              <div className="print-hidden rounded-xl border border-dashed border-primary/40 bg-accent/30 p-5 text-center">
                <p className="font-medium">
                  +{hiddenLeakCount} more leak{hiddenLeakCount === 1 ? "" : "s"} found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your full audit below unlocks every leak, your prioritized fix
                  roadmap, and insights personalized to your answers — free.
                </p>
              </div>
            )}
            {hiddenLeakCount > 0 && !isQuick && (
              <div className="print-hidden rounded-xl border border-dashed border-primary/40 bg-accent/30 p-5 text-center">
                <p className="font-medium">
                  +{hiddenLeakCount} more leak{hiddenLeakCount === 1 ? "" : "s"} found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paid plans unlock the full leak list, weekly monitoring, and the complete fix roadmap.
                </p>
                <Link href="/pricing" className={`${buttonClasses("primary", "sm")} mt-3`}>
                  Unlock full report
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Quick tier: the step-up to the comprehensive audit */}
        {isQuick && (
          <div className="mt-10">
            <DeepenForm token={token} />
          </div>
        )}

        {/* Comprehensive tier: personalized insights from their answers */}
        {!isQuick && intakeInsights.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold">Based on what you told us</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These insights come from your own answers — they personalize your
              plan and are separate from your publicly-observed score.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {intakeInsights.map((insight) => (
                <div key={insight.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge tone="muted">you said: {insight.youToldUs}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {insight.insight}
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-sm">
                    <span className="font-medium text-primary-strong">Move: </span>
                    {insight.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Priority roadmap — comprehensive tier only */}
        {!isQuick && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Priority fix roadmap</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(
              [
                ["Fix this week", report.priority_roadmap.this_week, "border-danger/40"],
                ["Fix this month", report.priority_roadmap.this_month, "border-warning/40"],
                ["Fix later", report.priority_roadmap.later, "border-border"],
              ] as const
            ).map(([title, items, borderClass], columnIndex) => {
              const gated = isFreePlan && columnIndex > 0;
              const shown = gated ? items.slice(0, 1) : items;
              return (
                <div key={title} className={`rounded-xl border-2 ${borderClass} bg-card p-5`}>
                  <h3 className="font-semibold">{title}</h3>
                  {items.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">Nothing urgent here. 🎉</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {shown.map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary-strong">→</span>
                          {item}
                        </li>
                      ))}
                      {gated && items.length > 1 && (
                        <li className="print-hidden rounded-lg bg-muted p-2 text-xs">
                          +{items.length - 1} more —{" "}
                          <Link href="/pricing" className="font-medium text-primary-strong underline">
                            unlock with a plan
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Green Star service match — comprehensive tier only */}
        {!isQuick && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">How Green Star fixes this</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every leak above maps to a specific Green Star service.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {report.greenstar_service_matches.map((match) => (
              <div key={match.service_id} className="rounded-xl border border-primary/30 bg-accent/20 p-5">
                <h3 className="font-semibold text-primary-strong">{match.service_name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{match.reason}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {!isQuick && (
          <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
            {report.report_conclusion}
          </p>
        )}

        <div className="mt-8">
          {isQuick ? (
            <CtaPanel token={token} bookingUrl={bookingUrl()} />
          ) : (
            <CtaPanel
              token={token}
              bookingUrl={bookingUrl()}
              heading="Let's walk through your fix plan together"
              body="You now have the full picture. The fastest next step: a free 20-minute walkthrough where Green Star turns this audit into a prioritized plan for your business — what to fix, in what order, and why it matters to your numbers."
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {noWebsite
            ? "Scores reflect the absence of a public web presence to check."
            : "Scores are produced by deterministic checks of your website's public content."}{" "}
          {scan.aiSource === "ai"
            ? "Explanations were written with AI assistance from those findings only."
            : "Explanations are generated from those findings."}{" "}
          Where something wasn&apos;t detected, we say so rather than guess.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
