import type { Metadata } from "next";
import Link from "next/link";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { PLANS } from "@/lib/billing/plans";
import { buttonClasses } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, organization } = await requireUserWithOrg();
  const plan = PLANS[organization.plan];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Plan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re on the <strong className="text-foreground">{plan.name}</strong> plan
          {plan.priceMonthly > 0 && ` ($${plan.priceMonthly}/mo)`}.
        </p>
        <Link href="/app/billing" className={`${buttonClasses("outline", "sm")} mt-4`}>
          Manage billing
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Email notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Report and re-scan emails go to {user.email}. Reply to any report
          email to reach Greenstar directly.
        </p>
      </section>
    </div>
  );
}
