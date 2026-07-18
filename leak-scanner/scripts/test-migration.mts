/**
 * Migration safety test: applies pending migrations to a POPULATED copy of an
 * old-schema database (as exists on Railway) and verifies no data is lost,
 * new columns exist with correct defaults, and FK integrity holds.
 *
 * Usage: npx tsx scripts/test-migration.mts /path/to/populated-old-schema.db
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const source = process.argv[2];
if (!source || !fs.existsSync(source)) {
  console.error("usage: tsx scripts/test-migration.mts <populated-old-db>");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gss-mig-"));
const dbPath = path.join(tmp, "migrate-test.db");
fs.copyFileSync(source, dbPath);
process.env.DATABASE_PATH = dbPath;
delete process.env.TURSO_DATABASE_URL;

// Capture pre-migration counts with a raw client (no schema assumptions).
const { createClient } = await import("@libsql/client");
const raw = createClient({ url: `file:${dbPath}` });
const preCounts: Record<string, number> = {};
for (const table of ["scans", "leads", "businesses", "recommendations", "users"]) {
  const r = await raw.execute(`SELECT COUNT(*) AS n FROM ${table}`);
  preCounts[table] = Number(r.rows[0].n);
}
const preTokens = (await raw.execute("SELECT share_token, revenue_leak_score FROM scans ORDER BY share_token")).rows;
raw.close();

// Boot the app db (runs migrations).
const { db, schema, dbReady } = await import("../lib/db/index.ts");
await dbReady();

const checks: Array<[string, boolean, unknown]> = [];

// Row counts survive.
const { count } = await import("drizzle-orm");
for (const [table, tbl] of [
  ["scans", schema.scans],
  ["leads", schema.leads],
  ["businesses", schema.businesses],
  ["recommendations", schema.recommendations],
  ["users", schema.users],
] as const) {
  const row = await db.select({ n: count() }).from(tbl).get();
  checks.push([`${table} rows survive`, row?.n === preCounts[table], `${row?.n} vs ${preCounts[table]}`]);
}

// Scan data survives with correct values + new defaults.
const scans = await db.select().from(schema.scans).all();
checks.push(["all migrated scans depth='quick'", scans.every((s) => s.depth === "quick"), scans.map((s) => s.depth)]);
checks.push(["intakeJson null on migrated scans", scans.every((s) => s.intakeJson === null), undefined]);
const postTokens = scans
  .map((s) => ({ share_token: s.shareToken, revenue_leak_score: s.revenueLeakScore }))
  .sort((a, b) => a.share_token.localeCompare(b.share_token));
checks.push([
  "share tokens + scores identical",
  JSON.stringify(postTokens) === JSON.stringify(preTokens.map((r) => ({ share_token: r.share_token, revenue_leak_score: Number(r.revenue_leak_score) }))),
  undefined,
]);

// FK integrity + nullable website works.
const raw2 = createClient({ url: `file:${dbPath}` });
const fk = await raw2.execute("PRAGMA foreign_key_check");
checks.push(["foreign_key_check clean", fk.rows.length === 0, fk.rows]);
const nullInsert = await raw2
  .execute("INSERT INTO businesses (id, business_name, website_url, industry, created_at) VALUES ('mig-test-null', 'No Site Co', NULL, 'HVAC', 0)")
  .then(() => true)
  .catch((e) => String(e));
checks.push(["website_url now nullable", nullInsert === true, nullInsert]);
await raw2.execute("DELETE FROM businesses WHERE id='mig-test-null'");
raw2.close();

let ok = true;
for (const [name, pass, detail] of checks) {
  if (!pass) ok = false;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  (${JSON.stringify(detail)})`}`);
}
console.log(ok ? "\nMIGRATION TEST PASSED" : "\nMIGRATION TEST FAILED");
process.exit(ok ? 0 : 1);
