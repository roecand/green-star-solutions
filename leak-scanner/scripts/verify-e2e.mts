/**
 * Full DB-backed pipeline verification against a real public website.
 * Uses a scratch DB + a mocked admin email so nothing external is required.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gss-verify-"));
process.env.DATABASE_PATH = path.join(tmp, "verify.db");
process.env.ADMIN_NOTIFICATION_EMAIL = "robert@greenstarsolutions.com";
process.env.NEXT_PUBLIC_APP_URL = "https://scan.green-starsolutions.com";
delete process.env.TURSO_DATABASE_URL;

const url = process.argv[2] ?? "https://www.example.com";

const { db, schema, dbReady } = await import("../lib/db/index.ts");
const { createScanRecords, runScanPipeline } = await import("../lib/scanner/pipeline.ts");
const { eq } = await import("drizzle-orm");

await dbReady();

const { scan } = await createScanRecords({
  businessName: "Verify Test Co",
  websiteUrl: url,
  industry: "Plumbing",
  city: "Las Vegas",
  state: "NV",
  contactName: "Casey Owner",
  email: "casey@verify-test.example",
  utmSource: "verify-script", // API route maps the client's `source` → utmSource
});

await runScanPipeline(scan.id);

const finalScan = await db.select().from(schema.scans).where(eq(schema.scans.id, scan.id)).get();
const lead = await db.select().from(schema.leads).where(eq(schema.leads.scanId, scan.id)).get();
const emailEvents = await db
  .select()
  .from(schema.emailEvents)
  .where(eq(schema.emailEvents.scanId, scan.id))
  .all();

const checks: Array<[string, boolean, unknown]> = [
  ["scan completed", finalScan?.status === "completed", finalScan?.status],
  ["ai report stored", !!finalScan?.aiReportJson, finalScan?.aiReportJson?.length],
  ["leak score set", typeof finalScan?.revenueLeakScore === "number", finalScan?.revenueLeakScore],
  ["lead saved", !!lead, lead?.id],
  ["lead email saved", lead?.email === "casey@verify-test.example", lead?.email],
  ["lead name saved", lead?.contactName === "Casey Owner", lead?.contactName],
  ["lead score saved", typeof lead?.score === "number", lead?.score],
  ["lead weakest category saved", !!lead?.weakestCategory, lead?.weakestCategory],
  ["lead top problems saved", !!lead?.topProblemsJson, lead?.topProblemsJson],
  ["lead report url saved", !!lead?.reportUrl, lead?.reportUrl],
  ["lead source saved", lead?.utmSource === "verify-script", lead?.utmSource],
  [
    "report email path fired",
    emailEvents.some((e) => e.eventType === "scan_completed_report"),
    emailEvents.map((e) => `${e.eventType}:${e.status}`),
  ],
  [
    "admin notification path fired",
    emailEvents.some((e) => e.eventType === "admin_new_lead"),
    undefined,
  ],
];

let allOk = true;
for (const [name, ok, detail] of checks) {
  if (!ok) allOk = false;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== undefined ? `  (${JSON.stringify(detail)})` : ""}`);
}
console.log(allOk ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
console.log("report token:", finalScan?.shareToken);
process.exit(allOk ? 0 : 1);
