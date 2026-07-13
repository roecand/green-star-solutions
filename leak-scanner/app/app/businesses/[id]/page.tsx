import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { businessForOrg } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { formatDate, scoreColorClass } from "@/lib/utils";

export const metadata: Metadata = { title: "Business" };

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireUserWithOrg();
  const business = businessForOrg(organization.id, id);
  if (!business) notFound();

  const scans = db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.businessId, business.id))
    .orderBy(desc(schema.scans.createdAt))
    .all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{business.businessName}</h1>
        <p className="text-sm text-muted-foreground">
          {business.industry} · {[business.city, business.state].filter(Boolean).join(", ") || "—"} ·{" "}
          {business.websiteUrl.replace(/^https?:\/\//, "")}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">Score history</h2>
          <Link href="/scanner" className={buttonClasses("outline", "sm")}>
            Re-scan
          </Link>
        </div>
        {scans.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No scans for this business yet.</p>
        ) : (
          <ul>
            {scans.map((scan) => (
              <li
                key={scan.id}
                className="flex items-center justify-between border-b border-border p-4 text-sm last:border-0"
              >
                <span className="text-muted-foreground">{formatDate(scan.createdAt)}</span>
                <Badge
                  tone={scan.status === "completed" ? "success" : scan.status === "failed" ? "danger" : "warning"}
                >
                  {scan.status}
                </Badge>
                <span className={`font-semibold ${scan.revenueLeakScore != null ? scoreColorClass(scan.revenueLeakScore) : ""}`}>
                  {scan.revenueLeakScore != null ? `${scan.revenueLeakScore}/100` : "—"}
                </span>
                <Link href={`/app/scans/${scan.id}`} className="text-primary-strong hover:underline">
                  Details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
