import type { Metadata } from "next";
import Link from "next/link";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { businessesForOrg } from "@/lib/db/queries";
import { buttonClasses } from "@/components/ui/button";
import { PLANS } from "@/lib/billing/plans";

export const metadata: Metadata = { title: "Businesses" };

export default async function BusinessesPage() {
  const { organization } = await requireUserWithOrg();
  const businesses = await businessesForOrg(organization.id);
  const plan = PLANS[organization.plan];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Businesses</h1>
          <p className="text-sm text-muted-foreground">
            {businesses.length} of {plan.maxBusinesses} on the {plan.name} plan
          </p>
        </div>
        {businesses.length < plan.maxBusinesses && (
          <Link href="/scanner" className={buttonClasses("primary", "sm")}>
            Scan a business
          </Link>
        )}
      </div>
      {businesses.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Your businesses appear here after your first scan.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/app/businesses/${b.id}`}
              className="rounded-xl border border-border bg-card p-6 hover:shadow-md"
            >
              <h2 className="font-semibold">{b.businessName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.industry} · {[b.city, b.state].filter(Boolean).join(", ") || "—"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {b.websiteUrl.replace(/^https?:\/\//, "")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
