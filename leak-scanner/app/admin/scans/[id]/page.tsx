import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Finding } from "@/lib/scanner/types";
import { CATEGORY_LABELS } from "@/lib/scoring/engine";

export const metadata: Metadata = { title: "Scan detail" };

export default async function AdminScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = db.select().from(schema.scans).where(eq(schema.scans.id, id)).get();
  if (!scan) notFound();

  const lead = db.select().from(schema.leads).where(eq(schema.leads.scanId, scan.id)).get();
  let findings: Finding[] = [];
  try {
    findings = scan.deterministicFindingsJson ? JSON.parse(scan.deterministicFindingsJson) : [];
  } catch {
    findings = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{scan.websiteUrl.replace(/^https?:\/\//, "")}</h1>
          <p className="text-sm text-muted-foreground">
            {scan.industry} · {formatDate(scan.createdAt)} · {scan.aiSource === "ai" ? "AI report" : "deterministic report"}
          </p>
        </div>
        <div className="flex gap-2">
          {lead && (
            <Link href={`/admin/leads/${lead.id}`} className={buttonClasses("outline", "sm")}>
              View lead
            </Link>
          )}
          {scan.status === "completed" && (
            <Link href={`/report/${scan.shareToken}`} className={buttonClasses("primary", "sm")}>
              Open report
            </Link>
          )}
        </div>
      </div>

      {scan.errorMessage && (
        <div className="rounded-xl border border-danger/30 bg-red-50 p-4 text-sm text-danger">
          {scan.errorMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            ["Leak Score", scan.revenueLeakScore],
            ["Conversion", scan.websiteConversionScore],
            ["Local", scan.localVisibilityScore],
            ["AI", scan.aiVisibilityScore],
            ["Trust", scan.trustProofScore],
            ["Follow-up", scan.followUpReadinessScore],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      {findings.length > 0 && (
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Raw findings ({findings.length} checks)</h2>
            <p className="text-sm text-muted-foreground">
              Exactly what the deterministic engine detected — useful for sales calls.
            </p>
          </div>
          <ul>
            {findings.map((finding) => (
              <li key={finding.id} className="flex items-start gap-3 border-b border-border p-3 text-sm last:border-0">
                <Badge tone={finding.detected ? "success" : "danger"}>
                  {finding.detected ? "✓" : "✗"}
                </Badge>
                <div className="flex-1">
                  <p>{finding.label}</p>
                  {finding.evidence && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{finding.evidence}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABELS[finding.category]} · {finding.weight}pt
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
