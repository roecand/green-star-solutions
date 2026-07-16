import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate, scoreColorClass } from "@/lib/utils";

export const metadata: Metadata = { title: "All scans" };

export default async function AdminScansPage() {
  const scans = await db.select().from(schema.scans).orderBy(desc(schema.scans.createdAt)).all();

  return (
    <div>
      <h1 className="text-2xl font-bold">All scans</h1>
      {scans.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No scans yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Website</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">City</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-4 font-medium">{scan.websiteUrl.replace(/^https?:\/\//, "")}</td>
                  <td className="p-4 text-muted-foreground">{scan.industry}</td>
                  <td className="p-4 text-muted-foreground">{scan.city ?? "—"}</td>
                  <td className="p-4">
                    <Badge tone={scan.status === "completed" ? "success" : scan.status === "failed" ? "danger" : "warning"}>
                      {scan.status}
                    </Badge>
                  </td>
                  <td className={`p-4 font-medium ${scan.revenueLeakScore != null ? scoreColorClass(scan.revenueLeakScore) : ""}`}>
                    {scan.revenueLeakScore ?? "—"}
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(scan.createdAt)}</td>
                  <td className="p-4">
                    <Link href={`/admin/scans/${scan.id}`} className="text-primary-strong hover:underline">
                      View
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
