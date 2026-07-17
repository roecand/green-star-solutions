import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UpgradeButton } from "@/components/upgrade-button";
import { buttonClasses } from "@/components/ui/button";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { billingEnabled } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start with a free scan. Upgrade for monitoring, history, competitor comparison, and exports.",
};

export default function PricingPage() {
  // Paid SaaS is hidden while the scanner runs as a free lead-gen funnel.
  if (!billingEnabled()) redirect("/scanner");
  const stripeLive = isStripeConfigured();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Simple pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            The first scan is free — see real value before paying anything.
            Paid plans keep watch so leaks don&apos;t creep back.
          </p>
          {!stripeLive && (
            <p className="mx-auto mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Test mode: plan changes apply instantly without payment
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const highlight = planId === "growth";
            return (
              <div
                key={planId}
                className={
                  highlight
                    ? "relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-xl shadow-primary/10"
                    : "flex flex-col rounded-2xl border border-border bg-card p-6"
                }
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                    Most popular
                  </span>
                )}
                <h2 className="font-semibold">{plan.name}</h2>
                <p className="mt-2 text-4xl font-bold">
                  ${plan.priceMonthly}
                  {plan.priceMonthly > 0 && (
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {planId === "free"
                    ? "One scan, real answers"
                    : planId === "starter"
                      ? "Stay on top of your score"
                      : planId === "growth"
                        ? "Outpace your competitors"
                        : "For multi-location operators"}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-primary-strong">✓</span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {planId === "free" ? (
                    <Link href="/scanner" className={`${buttonClasses("outline", "md")} w-full`}>
                      Run Free Scan
                    </Link>
                  ) : (
                    <UpgradeButton
                      plan={planId}
                      label={`Choose ${plan.name}`}
                      variant={highlight ? "primary" : "outline"}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-border bg-muted/50 p-8 text-center">
          <h2 className="text-xl font-bold">Rather have it all done for you?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Greenstar Solutions implements everything the scanner finds —
            website, follow-up automation, reviews, local SEO, and AI-ready
            content. Monitoring plans are included with every engagement.
          </p>
          <Link href="/contact" className={`${buttonClasses("secondary", "md")} mt-5`}>
            Talk to Greenstar
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
