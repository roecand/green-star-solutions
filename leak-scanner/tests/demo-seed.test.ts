import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.DATABASE_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "greenstar-demo-")), "t.db");

describe("demo reports on a fresh database", () => {
  it("seeds all demo reports once, and re-running is a no-op", async () => {
    const { db, dbReady, schema } = await import("@/lib/db");
    await dbReady();
    const { seedDemoBusinesses } = await import("@/lib/db/demo-seed");
    const { DEMO_BUSINESSES } = await import("@/lib/db/demo-fixtures");
    await seedDemoBusinesses(() => {});
    await seedDemoBusinesses(() => {});
    const scans = await db.select().from(schema.scans).all();
    expect(scans).toHaveLength(DEMO_BUSINESSES.length);
    expect(scans.every((s) => s.status === "completed" && s.revenueLeakScore !== null)).toBe(true);
  });
});
