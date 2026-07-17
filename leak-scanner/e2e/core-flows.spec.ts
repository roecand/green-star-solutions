import { test, expect, type Page } from "@playwright/test";

/**
 * Core e2e flows for the free lead-gen funnel, against a production build with
 * a fresh seeded SQLite db (see playwright.config.ts). Billing is OFF (no
 * NEXT_PUBLIC_BILLING_ENABLED) and no NEXT_PUBLIC_BOOKING_URL is set, matching
 * the public launch config. Scans target /e2e-fixture.html served by the app
 * itself (SCANNER_ALLOW_PRIVATE=1 relaxes the SSRF guard in tests only).
 */

const FIXTURE_URL = "http://127.0.0.1:3105/e2e-fixture.html";
const visitorEmail = `owner-${Date.now()}@example.com`;
let reportUrl: string;

async function runScan(page: Page, email: string) {
  await page.goto("/scanner");

  // Step 1: website first, then business name. Retry until hydration lands.
  let advanced = false;
  for (let attempt = 0; attempt < 4 && !advanced; attempt++) {
    await page.getByLabel("Website").fill(FIXTURE_URL);
    await page.getByLabel("Business name").fill("Canyon Plumbing");
    await page.getByRole("button", { name: "Continue" }).click();
    advanced = await page
      .getByLabel("Industry")
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(advanced, "scanner step 1 should advance after hydration").toBe(true);

  // Step 2: industry + location.
  await page.getByLabel("Industry").selectOption("Plumbing");
  await page.getByLabel("City").fill("Boulder City");
  await page.getByLabel("State / region").fill("NV");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: contact (name + email) collected before the report shows.
  await page.getByLabel("Your name").fill("Casey Owner");
  await page.getByLabel("Business email").fill(email);
  await page.getByRole("button", { name: "Scan my website" }).click();

  await expect(page.getByText("Scanning your revenue leaks…")).toBeVisible();
  await page.waitForURL(/\/report\//, { timeout: 45_000 });
}

test.describe.configure({ mode: "serial" });

test("visitor runs a free scan and views the complete report", async ({ page }) => {
  await runScan(page, visitorEmail);
  reportUrl = page.url();

  // Core report content (score, categories, top problems, roadmap, CTA).
  await expect(page.getByText("Revenue Leak Report").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Canyon Plumbing" })).toBeVisible();
  await expect(page.getByText("Where the leaks are")).toBeVisible();
  await expect(page.getByText("Website Conversion").first()).toBeVisible();
  await expect(page.getByText("Follow-Up Readiness").first()).toBeVisible();
  await expect(page.getByText("Top revenue leaks")).toBeVisible();
  await expect(page.getByText("Priority fix roadmap")).toBeVisible();

  // Integrity disclaimer is present.
  await expect(page.getByText(/publicly visible signals/i)).toBeVisible();
  await expect(page.getByText(/potential/i).first()).toBeVisible();

  // Single primary CTA; no paid-SaaS upsell on the report.
  await expect(
    page.getByRole("button", { name: "Get My Personalized Fix Plan" })
  ).toBeVisible();
  await expect(page.getByText(/Unlock full report/i)).toHaveCount(0);
  await expect(page.getByText(/unlock with a plan/i)).toHaveCount(0);
});

test("fix-plan CTA captures the lead and confirms", async ({ page }) => {
  await page.goto(reportUrl);
  await page.getByRole("button", { name: "Get My Personalized Fix Plan" }).click();
  // No booking URL in the test env, so it shows the reach-out confirmation.
  await expect(page.getByText(/reach out with your personalized fix plan/i)).toBeVisible();
});

test("public funnel shows no subscription or Stripe messaging", async ({ page }) => {
  // /pricing is hidden while billing is off — it redirects to the scanner.
  await page.goto("/pricing");
  await expect(page).toHaveURL(/\/scanner$/);

  // Landing page carries no monthly pricing.
  await page.goto("/");
  await expect(page.locator("body")).not.toContainText("/mo");
  await expect(page.locator("body")).not.toContainText("$19");
  await expect(page.locator("body")).not.toContainText("$49");
  await expect(page.locator("body")).not.toContainText("$99");
  // Pricing nav link is hidden.
  await expect(page.getByRole("link", { name: "Pricing" })).toHaveCount(0);
});

test("admin sees the captured lead with fix-plan request", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@greenstar.local");
  await page.getByLabel("Password").fill("greenstar-admin");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/admin/);

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  // Funnel counts render.
  await expect(page.getByText("Scans started")).toBeVisible();

  await page.goto("/admin/leads");
  const leadRow = page.getByRole("row", { name: /Canyon Plumbing/ });
  await expect(leadRow.first()).toBeVisible();
  await expect(leadRow.first().getByText("requested help")).toBeVisible();

  // Lead detail: outreach tools present.
  await page.getByRole("link", { name: "Canyon Plumbing" }).first().click();
  await expect(page.getByText("Outreach tools")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy email opener" })).toBeVisible();
});
