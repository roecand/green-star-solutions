/**
 * DB-backed flow tests: scan/lead creation, account claiming, Stripe webhook
 * handlers, and plan limits. Runs against a throwaway SQLite file created via
 * the same migrate-on-boot path as production.
 */
import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "greenstar-test-"));
process.env.DATABASE_PATH = path.join(tmpDir, "test.db");

type Db = typeof import("@/lib/db");
type Pipeline = typeof import("@/lib/scanner/pipeline");
type Register = typeof import("@/lib/auth/register");
type Webhooks = typeof import("@/lib/billing/webhook-handlers");
type Plans = typeof import("@/lib/billing/plans");

let db: Db["db"];
let schema: Db["schema"];
let createScanRecords: Pipeline["createScanRecords"];
let registerUser: Register["registerUser"];
let webhooks: Webhooks;
let plans: Plans;

beforeAll(async () => {
  const dbModule = await import("@/lib/db");
  db = dbModule.db;
  schema = dbModule.schema;
  ({ createScanRecords } = await import("@/lib/scanner/pipeline"));
  ({ registerUser } = await import("@/lib/auth/register"));
  webhooks = await import("@/lib/billing/webhook-handlers");
  plans = await import("@/lib/billing/plans");
});

describe("scan and lead creation", () => {
  it("creates business, scan, and lead rows with a share token", () => {
    const { business, scan, lead } = createScanRecords({
      businessName: "Test Plumbing",
      websiteUrl: "https://testplumbing.example.com/",
      industry: "Plumbing",
      city: "Reno",
      state: "NV",
      email: "owner@testplumbing.example.com",
      competitorUrls: ["https://rival.example.com/"],
    });
    expect(business.id).toBeTruthy();
    expect(scan.businessId).toBe(business.id);
    expect(scan.shareToken).toMatch(/^[a-f0-9]{32}$/);
    expect(scan.status).toBe("pending");
    expect(lead.scanId).toBe(scan.id);
    expect(lead.lifecycleStatus).toBe("new");
    expect(lead.email).toBe("owner@testplumbing.example.com");

    const competitors = db.select().from(schema.competitors).all();
    expect(competitors.some((c) => c.businessId === business.id)).toBe(true);
  });
});

describe("registerUser", () => {
  it("creates a user with an organization and claims anonymous scans by email", async () => {
    const email = "claimer@example.com";
    createScanRecords({
      businessName: "Claim Me Detailing",
      websiteUrl: "https://claimme.example.com/",
      industry: "Auto Repair",
      email,
    });

    const user = registerUser({ email, password: "supersecret1", name: "Claimer" });
    expect(user.role).toBe("user");

    const { eq } = await import("drizzle-orm");
    const org = db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.ownerUserId, user.id))
      .get();
    expect(org).toBeTruthy();
    expect(org!.plan).toBe("free");

    const claimed = db
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.email, email))
      .get();
    expect(claimed!.organizationId).toBe(org!.id);
  });

  it("rejects duplicate emails", () => {
    registerUser({ email: "dupe@example.com", password: "supersecret1" });
    expect(() => registerUser({ email: "DUPE@example.com", password: "supersecret1" })).toThrow();
  });
});

describe("stripe webhook handlers", () => {
  function makeOrg() {
    const user = registerUser({
      email: `billing-${Math.random().toString(36).slice(2)}@example.com`,
      password: "supersecret1",
    });
    return db
      .select()
      .from(schema.organizations)
      .all()
      .find((o) => o.ownerUserId === user.id)!;
  }

  it("checkout.session.completed upgrades the org", async () => {
    const org = makeOrg();
    const handled = webhooks.handleCheckoutCompleted({
      organizationId: org.id,
      plan: "growth",
      customerId: "cus_123",
      subscriptionId: "sub_123",
    });
    expect(handled).toBe(true);

    const { eq } = await import("drizzle-orm");
    const updated = db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, org.id))
      .get()!;
    expect(updated.plan).toBe("growth");
    expect(updated.stripeCustomerId).toBe("cus_123");
    expect(updated.stripeSubscriptionId).toBe("sub_123");
  });

  it("ignores events with unknown org or invalid plan", () => {
    expect(webhooks.handleCheckoutCompleted({ organizationId: "nope", plan: "growth" })).toBe(false);
    const org = makeOrg();
    expect(webhooks.handleCheckoutCompleted({ organizationId: org.id, plan: "platinum" })).toBe(false);
  });

  it("subscription cancellation downgrades to free", async () => {
    const org = makeOrg();
    webhooks.handleCheckoutCompleted({
      organizationId: org.id,
      plan: "pro",
      customerId: "cus_x",
      subscriptionId: "sub_x",
    });
    const handled = webhooks.handleSubscriptionDeleted({ organizationId: org.id });
    expect(handled).toBe(true);

    const { eq } = await import("drizzle-orm");
    const updated = db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, org.id))
      .get()!;
    expect(updated.plan).toBe("free");
    expect(updated.stripeSubscriptionId).toBeNull();
  });

  it("subscription status updates adjust the plan appropriately", async () => {
    const org = makeOrg();
    webhooks.handleSubscriptionUpdated({
      organizationId: org.id,
      plan: "starter",
      status: "active",
      currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
    });
    const { eq } = await import("drizzle-orm");
    let updated = db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, org.id))
      .get()!;
    expect(updated.plan).toBe("starter");

    webhooks.handleSubscriptionUpdated({
      organizationId: org.id,
      plan: "starter",
      status: "canceled",
    });
    updated = db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, org.id))
      .get()!;
    expect(updated.plan).toBe("free");
  });
});

describe("plan limits", () => {
  it("defines sane scan limits per plan", () => {
    expect(plans.scanLimitFor("free")).toBe(1);
    expect(plans.scanLimitFor("starter")).toBeGreaterThan(plans.scanLimitFor("free"));
    expect(plans.scanLimitFor("growth")).toBeGreaterThan(plans.scanLimitFor("starter"));
    expect(plans.scanLimitFor("pro")).toBeGreaterThanOrEqual(plans.scanLimitFor("growth"));
  });

  it("plan definitions gate features by tier", () => {
    expect(plans.PLANS.free.pdfExport).toBe(false);
    expect(plans.PLANS.free.scoreHistory).toBe(false);
    expect(plans.PLANS.starter.scoreHistory).toBe(true);
    expect(plans.PLANS.growth.pdfExport).toBe(true);
    expect(plans.PLANS.growth.competitorComparison).toBe(true);
    expect(plans.PLANS.pro.maxBusinesses).toBe(5);
  });
});
