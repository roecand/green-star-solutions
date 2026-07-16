import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { scanForOrg } from "@/lib/db/queries";
import { ScoreRing } from "@/components/report/score-ring";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/scoring/engine";
import { formatDate } from "@/lib/utils";
import type { FindingCategory } from "@/lib/scanner/types";

export const metadata: Metadata = { title: "Scan details" };

const SCORE_FIELDS: Array<{ category: FindingCategory; key: "websiteConversionScore" | "localVisibilityScore" | "aiVisibilityScore" | "trustProofScore" | "followUpReadinessScore" }> = [
  { category: "conversion", key: "websiteConversionScore" },
  { category: "local", key: "localVisibilityScore" },
  { category: "ai_visibility", key: "aiVisibilityScore" },
  { category: "trust", key: "trustProofScore" },
  { category: "follow_up", key: "followUpReadinessScore" },
];

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireUserWithOrg();
  const scan = await scanForOrg(organization.id, id);
  if (!scan) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{scan.businessName}</h1>
          <p className="text-sm text-muted-foreground">
            {scan.websiteUrl} · {formatDate(scan.createdAt)}
          </p>
        </div>
        <Badge
          tone={scan.status === "completed" ? "success" : scan.status === "failed" ? "danger" : "warning"}
        >
          {scan.status}
        </Badge>
      </div>

      {scan.status === "failed" && (
        <div className="rounded-xl border border-danger/30 bg-red-50 p-6">
          <p className="font-medium text-danger">This scan failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{scan.errorMessage}</p>
          <Link href="/scanner" className={`${buttonClasses("outline", "sm")} mt-4`}>
            Try again
          </Link>
        </div>
      )}

      {scan.status === "completed" && (
        <>
          <div className="flex flex-wrap items-center gap-8 rounded-2xl border border-border bg-card p-8">
            <ScoreRing score={scan.revenueLeakScore ?? 0} size={120} label="Revenue Leak Score" />
            <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-5">
              {SCORE_FIELDS.map(({ category, key }) => (
                <div key={category} className="text-center">
                  <ScoreRing score={scan[key] ?? 0} size={64} />
                  <p className="mt-1 text-xs text-muted-foreground">{CATEGORY_LABELS[category]}</p>
                </div>
              ))}
            </div>
          </div>
          <Link href={`/report/${scan.shareToken}`} className={buttonClasses("primary", "md")}>
            Open full report
          </Link>
        </>
      )}
    </div>
  );
}
