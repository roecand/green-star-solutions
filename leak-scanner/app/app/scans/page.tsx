import type { Metadata } from "next";
import Link from "next/link";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { scansForOrg } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { formatDate, scoreColorClass } from "@/lib/utils";

export const metadata: Metadata = { title: "Scan history" };

export default async function ScansPage() {
  const { organization } = await requireUserWithOrg();
  const scans = await scansForOrg(organization.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scan history</h1>
        <Link href="/scanner" className={buttonClasses("primary", "sm")}>
          New scan
        </Link>
      </div>
      {scans.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No scans yet — run your first one to see it here.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Business</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Leak Score</th>
                <th className="p-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{scan.businessName}</td>
                  <td className="p-4 text-muted-foreground">{formatDate(scan.createdAt)}</td>
                  <td className="p-4">
                    <Badge
                      tone={
                        scan.status === "completed"
                          ? "success"
                          : scan.status === "failed"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {scan.status}
                    </Badge>
                  </td>
                  <td className={`p-4 font-semibold ${scan.revenueLeakScore != null ? scoreColorClass(scan.revenueLeakScore) : ""}`}>
                    {scan.revenueLeakScore != null ? `${scan.revenueLeakScore}/100` : "—"}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/app/scans/${scan.id}`} className="text-primary-strong hover:underline">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
