import { test, expect, type Page } from "@playwright/test";

/**
 * Core e2e flows for the two-tier lead-gen funnel, against a production build
 * with a fresh seeded SQLite db (see playwright.config.ts). Billing is OFF and
 * no NEXT_PUBLIC_BOOKING_URL is set, matching the public launch config. Scans
 * target /e2e-fixture.html served by the app itself (SCANNER_ALLOW_PRIVATE=1
 * relaxes the SSRF guard in tests only).
 */

const FIXTURE_URL = "http://127.0.0.1:3105/e2e-fixture.html";
const visitorEmail = `owner-${Date.now()}@example.com`;
let reportUrl: string;

async function fillContactAndScan(page: Page, name: string, email: string) {
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Business email").fill(email);
  await page.getByRole("button", { name: "Scan my website" }).click();
}

async function runQuickScan(page: Page, email: string) {
  await page.goto("/scanner");

  // Step 1: website + business name. Retry until hydration lands.
  let advanced = false;
  for (let attempt = 0; attempt < 4 && !advanced; attempt++) {
    await page.getByLabel("Website", { exact: true }).fill(FIXTURE_URL);
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

  // Step 3: contact before the report shows.
  await fillContactAndScan(page, "Casey Owner", email);
  await expect(page.getByText("Scanning your revenue leaks…")).toBeVisible();
  await page.waitForURL(/\/report\//, { timeout: 45_000 });
}

test.describe.configure({ mode: "serial" });

test("visitor runs a quick scan and sees the surface report", async ({ page }) => {
  await runQuickScan(page, visitorEmail);
  reportUrl = page.url();

  // Quick tier: score, categories, top leaks, integrity disclaimer.
  await expect(page.getByText("Revenue Leak Report").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Canyon Plumbing" })).toBeVisible();
  await expect(page.getByText("Where the leaks are")).toBeVisible();
  await expect(page.getByText("Website Conversion").first()).toBeVisible();
  await expect(page.getByText("Top revenue leaks")).toBeVisible();
  await expect(page.getByText(/publicly visible signals/i)).toBeVisible();

  // The step-up is offered; the deep sections are NOT shown yet.
  await expect(page.getByText("Unlock your full audit — free")).toBeVisible();
  await expect(page.getByText("Priority fix roadmap")).toHaveCount(0);
  await expect(page.getByText("Based on what you told us")).toHaveCount(0);

  // No paid-SaaS messaging anywhere on the report.
  await expect(page.getByRole("button", { name: "Get My Personalized Fix Plan" })).toBeVisible();
  await expect(page.getByText(/Unlock full report/i)).toHaveCount(0);
});

test("answering the deep questions unlocks the comprehensive audit", async ({ page }) => {
  await page.goto(reportUrl);

  // Answer all six intake questions.
  for (const label of [
    "More phone calls",
    "Word of mouth",
    "It goes to voicemail",
    "Same day",
    "Sometimes, when we remember",
    "$500 – $2,000",
  ]) {
    await page.getByRole("radio", { name: label }).click();
  }
  await page.getByRole("button", { name: "Unlock My Full Audit" }).click();

  // Full audit renders: insights, roadmap, service matches, harder CTA.
  await expect(page.getByText("Based on what you told us")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Priority fix roadmap")).toBeVisible();
  await expect(page.getByText("How Green Star fixes this")).toBeVisible();
  await expect(page.getByText("Let's walk through your fix plan together")).toBeVisible();
  await expect(page.getByText("you said: It goes to voicemail")).toBeVisible();

  // The step-up form is gone once comprehensive.
  await expect(page.getByText("Unlock your full audit — free")).toHaveCount(0);
});

test("fix-plan CTA captures the lead and confirms", async ({ page }) => {
  await page.goto(reportUrl);
  await page.getByRole("button", { name: "Get My Personalized Fix Plan" }).click();
  await expect(page.getByText(/reach out with your personalized fix plan/i)).toBeVisible();
});

test("a business with no website gets the opportunity report", async ({ page }) => {
  await page.goto("/scanner");

  let advanced = false;
  for (let attempt = 0; attempt < 4 && !advanced; attempt++) {
    await page.getByRole("radio", { name: "I don't have a website yet" }).click();
    await page.getByLabel("Business name").fill("Handshake Plumbing");
    await page.getByRole("button", { name: "Continue" }).click();
    advanced = await page
      .getByLabel("Industry")
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(advanced, "no-website step 1 should advance after hydration").toBe(true);

  await page.getByLabel("Industry").selectOption("Plumbing");
  await page.getByLabel("City").fill("Boulder City");
  await page.getByLabel("State / region").fill("NV");
  await page.getByRole("button", { name: "Continue" }).click();

  await fillContactAndScan(page, "Jordan Owner", `nosite-${Date.now()}@example.com`);
  await page.waitForURL(/\/report\//, { timeout: 45_000 });

  // Opportunity-framed no-website report.
  await expect(page.getByRole("heading", { name: "Handshake Plumbing" })).toBeVisible();
  await expect(page.getByText("No website yet").first()).toBeVisible();
  await expect(page.getByText("You don't have a website yet").first()).toBeVisible();
  await expect(page.getByText(/untapped opportunity/i)).toBeVisible();
  // Still gets the step-up and the CTA.
  await expect(page.getByText("Unlock your full audit — free")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get My Personalized Fix Plan" })).toBeVisible();
});

test("public funnel shows no subscription or Stripe messaging", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveURL(/\/scanner$/);

  await page.goto("/");
  await expect(page.locator("body")).not.toContainText("/mo");
  await expect(page.locator("body")).not.toContainText("$19");
  await expect(page.locator("body")).not.toContainText("$49");
  await expect(page.locator("body")).not.toContainText("$99");
  await expect(page.getByRole("link", { name: "Pricing" })).toHaveCount(0);
});

test("admin sees the lead with deep-audit answers", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@greenstar.local");
  await page.getByLabel("Password").fill("greenstar-admin");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/admin/);

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("Deep audits")).toBeVisible();

  await page.goto("/admin/leads");
  const leadRow = page.getByRole("row", { name: /Canyon Plumbing/ });
  await expect(leadRow.first()).toBeVisible();
  await expect(leadRow.first().getByText("requested help")).toBeVisible();

  // Lead detail: intake answers surfaced for call prep.
  await page.getByRole("link", { name: "Canyon Plumbing" }).first().click();
  await expect(page.getByText("Their deep-audit answers")).toBeVisible();
  await expect(page.getByText("It goes to voicemail")).toBeVisible();
  await expect(page.getByText("deep audit")).toBeVisible();
  await expect(page.getByText("Outreach tools")).toBeVisible();

  // The no-website lead is flagged as a build opportunity.
  await page.goto("/admin/leads");
  await page.getByRole("link", { name: "Handshake Plumbing" }).first().click();
  await expect(page.getByText("no website — build opportunity")).toBeVisible();
});
