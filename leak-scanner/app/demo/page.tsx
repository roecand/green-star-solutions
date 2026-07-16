import type { Metadata } from "next";
import Link from "next/link";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScoreRing } from "@/components/report/score-ring";
import { buttonClasses } from "@/components/ui/button";
import { verdictForScore } from "@/lib/scoring/engine";
import { DEMO_BUSINESSES } from "@/lib/db/demo-fixtures";

export const metadata: Metadata = {
  title: "Demo reports",
  description: "Example Revenue Leak Reports for five fictional local businesses.",
};

export default async function DemoPage() {
  const scans = await db
    .select({
      shareToken: schema.scans.shareToken,
      revenueLeakScore: schema.scans.revenueLeakScore,
      industry: schema.scans.industry,
      city: schema.scans.city,
      state: schema.scans.state,
      businessId: schema.scans.businessId,
    })
    .from(schema.scans)
    .where(
      inArray(
        schema.scans.shareToken,
        DEMO_BUSINESSES.map((d) => d.shareToken)
      )
    )
    .all();

  const businesses = await db
    .select()
    .from(schema.businesses)
    .where(inArray(schema.businesses.id, scans.map((s) => s.businessId)))
    .all();
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Demo reports</h1>
          <p className="mt-2 text-muted-foreground">
            Five fictional local businesses, scanned with the exact same engine
            you&apos;ll get. Notice how different weaknesses show up in
            different categories — then run your own.
          </p>
        </div>

        {scans.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Demo data hasn&apos;t been seeded yet. Run <code>npm run db:seed</code>.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...scans]
              .sort((a, b) => (b.revenueLeakScore ?? 0) - (a.revenueLeakScore ?? 0))
              .map((scan) => {
                const business = businessById.get(scan.businessId);
                return (
                  <Link
                    key={scan.shareToken}
                    href={`/report/${scan.shareToken}`}
                    className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-primary-strong">
                          {scan.industry}
                        </p>
                        <h2 className="mt-1 font-semibold group-hover:text-primary-strong">
                          {business?.businessName}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[scan.city, scan.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <ScoreRing score={scan.revenueLeakScore ?? 0} size={64} />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {verdictForScore(scan.revenueLeakScore ?? 0)}
                    </p>
                    <p className="mt-4 text-sm font-medium text-primary-strong">
                      View full report →
                    </p>
                  </Link>
                );
              })}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-charcoal p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Now see your own leaks</h2>
          <p className="mx-auto mt-2 max-w-md text-white/75">
            Your real report takes about a minute and costs nothing.
          </p>
          <Link href="/scanner" className={`${buttonClasses("primary", "lg")} mt-6`}>
            Run Free Scan
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
