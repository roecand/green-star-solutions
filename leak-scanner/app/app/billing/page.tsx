import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { UpgradeButton, PortalButton } from "@/components/upgrade-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  const { organization } = await requireUserWithOrg();
  const plan = PLANS[organization.plan];
  const stripeLive = isStripeConfigured();

  const history = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.organizationId, organization.id))
    .orderBy(desc(schema.subscriptions.createdAt))
    .limit(10)
    .all();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {upgraded && (
        <div className="rounded-xl border border-primary/40 bg-accent/40 p-4 text-sm">
          {upgraded === "mock"
            ? "Plan updated in test mode (no payment taken — Stripe keys not configured)."
            : "Thanks! Your subscription is active."}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Current plan</h2>
            <p className="mt-1 text-2xl font-bold">
              {plan.name}
              {plan.priceMonthly > 0 && (
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  · ${plan.priceMonthly}/mo
                </span>
              )}
            </p>
          </div>
          {stripeLive && organization.stripeCustomerId ? (
            <PortalButton />
          ) : (
            <Badge tone="muted">{stripeLive ? "no subscription" : "test mode"}</Badge>
          )}
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-primary-strong">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {organization.plan !== "pro" && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Upgrade</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PLAN_ORDER.filter(
              (p) => p !== "free" && PLANS[p].priceMonthly > plan.priceMonthly
            ).map((planId) => (
              <div key={planId} className="rounded-lg border border-border p-4">
                <p className="font-medium">{PLANS[planId].name}</p>
                <p className="text-xl font-bold">${PLANS[planId].priceMonthly}/mo</p>
                <div className="mt-3">
                  <UpgradeButton
                    plan={planId as "starter" | "growth" | "pro"}
                    label="Upgrade"
                    variant="outline"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Full plan comparison on the{" "}
            <Link href="/pricing" className="text-primary-strong underline">
              pricing page
            </Link>
            .
          </p>
        </section>
      )}

      {history.length > 0 && (
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Subscription history</h2>
          </div>
          <ul>
            {history.map((sub) => (
              <li key={sub.id} className="flex items-center gap-3 border-b border-border p-4 text-sm last:border-0">
                <span className="flex-1 font-medium capitalize">{sub.plan}</span>
                <Badge tone={sub.status.includes("active") ? "success" : "muted"}>{sub.status}</Badge>
                <span className="text-muted-foreground">{formatDate(sub.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Downgrades and cancellations{stripeLive ? " are handled in the subscription portal" : " apply at the end of the billing period once Stripe is configured"}. The free scan you already ran stays yours either way.
      </p>
    </div>
  );
}
