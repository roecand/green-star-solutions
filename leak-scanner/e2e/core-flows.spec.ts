import { test, expect, type Page } from "@playwright/test";

/**
 * Core e2e flows against a dev server with a fresh seeded SQLite db
 * (see playwright.config.ts). Scans target /e2e-fixture.html served by the
 * app itself (SCANNER_ALLOW_PRIVATE=1 relaxes the SSRF guard in tests only).
 */

const FIXTURE_URL = "http://127.0.0.1:3105/e2e-fixture.html";
const visitorEmail = `owner-${Date.now()}@example.com`;
const password = "supersecret-e2e-1";
let reportUrl: string;

async function runScan(page: Page, email: string) {
  await page.goto("/scanner");

  // Re-fill and re-click until hydration has taken (dev-server hydration can
  // land after the first interaction, which would leave React state empty).
  let advanced = false;
  for (let attempt = 0; attempt < 4 && !advanced; attempt++) {
    await page.getByLabel("Business name").fill("Canyon Plumbing");
    await page.getByLabel("Website").fill(FIXTURE_URL);
    await page.getByRole("button", { name: "Continue" }).click();
    advanced = await page
      .getByLabel("Industry")
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(advanced, "scanner step 1 should advance after hydration").toBe(true);

  await page.getByLabel("Industry").selectOption("Plumbing");
  await page.getByLabel("City").fill("Boulder City");
  await page.getByLabel("State / region").fill("NV");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByText("More phone calls").click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Business email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Scan my website" }).click();
  await expect(page.getByText("Scanning your revenue leaks…")).toBeVisible();
  await page.waitForURL(/\/report\//, { timeout: 45_000 });
}

test.describe.configure({ mode: "serial" });

test("visitor runs a free scan and views the report", async ({ page }) => {
  await runScan(page, visitorEmail);
  reportUrl = page.url();

  await expect(page.getByText("Revenue Leak Report").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Canyon Plumbing" })).toBeVisible();
  await expect(page.getByText("Where the leaks are")).toBeVisible();
  await expect(page.getByText("Website Conversion").first()).toBeVisible();
  await expect(page.getByText("Follow-Up Readiness").first()).toBeVisible();
  await expect(page.getByText("Top revenue leaks")).toBeVisible();
  await expect(page.getByText("Priority fix roadmap")).toBeVisible();
  await expect(
    page.getByText("Want Greenstar to fix these leaks for you?")
  ).toBeVisible();
});

test("visitor requests Greenstar help from the report", async ({ page }) => {
  await page.goto(reportUrl);
  await page.getByRole("button", { name: "Request Fix Plan" }).click();
  await expect(
    page.getByText("Greenstar will send you a custom fix plan shortly.")
  ).toBeVisible();
});

test("visitor creates an account after the report and sees claimed history", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Casey Owner");
  await page.getByLabel("Email").fill(visitorEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/app\/dashboard/);

  // The anonymous scan was claimed by email at signup.
  await expect(page.getByText("Canyon Plumbing").first()).toBeVisible();
});

test("user upgrades to a paid plan (mock checkout) and views scan history", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(visitorEmail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/app\/dashboard/);

  await page.goto("/pricing");
  await page.getByRole("button", { name: "Choose Growth" }).click();
  await page.waitForURL(/\/app\/billing\?upgraded=mock/);
  await expect(page.getByText("Plan updated in test mode")).toBeVisible();
  await expect(page.getByText("Growth", { exact: true }).first()).toBeVisible();

  // Paid user views scan history.
  await page.goto("/app/scans");
  await expect(page.getByRole("cell", { name: "Canyon Plumbing" }).first()).toBeVisible();
  await expect(page.getByText(/\d+\/100/).first()).toBeVisible();
});

test("admin sees the lead with help-request status", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@greenstar.local");
  await page.getByLabel("Password").fill("greenstar-admin");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/admin/);

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.goto("/admin/leads");
  const leadRow = page.getByRole("row", { name: /Canyon Plumbing/ });
  await expect(leadRow.first()).toBeVisible();
  await expect(leadRow.first().getByText("requested help")).toBeVisible();

  // Lead detail: outreach tools present.
  await page.getByRole("link", { name: "Canyon Plumbing" }).first().click();
  await expect(page.getByText("Outreach tools")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy email opener" })).toBeVisible();
});
