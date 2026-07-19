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

async function fillStepTwo(page: Page, customerValueLabel: string) {
  await page.getByLabel("Industry").selectOption("Plumbing");
  await page.getByLabel("City").fill("Boulder City");
  await page.getByLabel("State / region").fill("NV");
  await page.getByRole("radio", { name: customerValueLabel }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

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

  // Step 2: industry + location + customer value (one tap).
  await fillStepTwo(page, "$500 – $2,000");

  // Step 3: contact before the report shows.
  await fillContactAndScan(page, "Casey Owner", email);
  await expect(page.getByText("Scanning your revenue leaks…")).toBeVisible();
  await page.waitForURL(/\/report\//, { timeout: 45_000 });
}

test.describe.configure({ mode: "serial" });

test("visitor runs a quick scan and sees the surface report with money framing", async ({ page }) => {
  await runQuickScan(page, visitorEmail);
  reportUrl = page.url();

  // Quick tier: leak gauge, categories, top leaks, integrity disclaimer.
  await expect(page.getByText("Revenue Leak Report").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Canyon Plumbing" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Revenue Leak Score/ })).toBeVisible();
  await expect(page.getByText("Where the leaks are")).toBeVisible();
  await expect(page.getByText("Top revenue leaks")).toBeVisible();
  await expect(page.getByText(/publicly visible signals/i)).toBeVisible();

  // The opportunity-cost line uses THEIR number, hedged and attributed.
  await expect(page.getByText(/\$12,000–\$48,000 a year at stake/)).toBeVisible();
  await expect(page.getByText(/Your numbers, not ours/)).toBeVisible();

  // The step-up is offered; the deep sections are NOT shown yet.
  await expect(page.getByText("Unlock your full audit — free")).toBeVisible();
  await expect(page.getByText("Priority fix roadmap")).toHaveCount(0);
  await expect(page.getByText("Based on what you told us")).toHaveCount(0);

  // No paid-SaaS messaging anywhere on the report.
  await expect(page.getByRole("button", { name: "Get My Personalized Fix Plan" })).toBeVisible();
  await expect(page.getByText(/Unlock full report/i)).toHaveCount(0);
});

test("the deep-audit modal asks one question at a time and unlocks the audit", async ({ page }) => {
  await page.goto(reportUrl);

  // Open the modal from the trigger card.
  await page.getByRole("button", { name: "Unlock My Full Audit" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("1 of 5")).toBeVisible();

  // Questions appear one at a time; tapping an answer auto-advances.
  for (const label of [
    "More phone calls",
    "Word of mouth",
    "It goes to voicemail",
    "Same day",
    "Sometimes, when we remember",
  ]) {
    await page.getByRole("radio", { name: label }).click();
  }

  // The earned reveal: diagnosing transition, then the full audit.
  await expect(page.getByText("Diagnosing your business…")).toBeVisible();
  await expect(page.getByText("Based on what you told us")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Priority fix roadmap")).toBeVisible();
  await expect(page.getByText("How Green Star fixes this")).toBeVisible();
  await expect(page.getByText("Let's walk through your fix plan together")).toBeVisible();
  await expect(page.getByText("you said: It goes to voicemail")).toBeVisible();
  // Customer value (from the quick scan) feeds the sixth insight.
  await expect(page.getByText("What a customer is worth")).toBeVisible();

  // The step-up trigger is gone once comprehensive.
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

  await fillStepTwo(page, "Over $2,000");
  await fillContactAndScan(page, "Jordan Owner", `nosite-${Date.now()}@example.com`);
  await page.waitForURL(/\/report\//, { timeout: 45_000 });

  // Opportunity-framed no-website report with its dedicated layout.
  await expect(page.getByRole("heading", { name: "Handshake Plumbing" })).toBeVisible();
  await expect(page.getByText("No website yet").first()).toBeVisible();
  await expect(page.getByText(/untapped opportunity/i)).toBeVisible();
  await expect(page.getByText("What being offline is costing you")).toBeVisible();
  // The five-zeros category grid is replaced, not repeated.
  await expect(page.getByText("Where the leaks are")).toHaveCount(0);
  // Money framing uses the no-website phrasing + their number.
  await expect(page.getByText(/can't find you because you're not online/)).toBeVisible();
  await expect(page.getByText(/\$48,000 or more a year at stake/)).toBeVisible();
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

test("admin sees the lead with deep-audit answers and customer value", async ({ page }) => {
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

  // Lead detail: intake answers + quick-scan customer value for call prep.
  await page.getByRole("link", { name: "Canyon Plumbing" }).first().click();
  await expect(page.getByText("Their deep-audit answers")).toBeVisible();
  await expect(page.getByText("It goes to voicemail")).toBeVisible();
  await expect(page.getByText("Roughly what is one new customer worth to you?")).toBeVisible();
  await expect(page.getByText("$500 – $2,000")).toBeVisible();
  await expect(page.getByText("deep audit")).toBeVisible();
  await expect(page.getByText("Outreach tools")).toBeVisible();

  // The no-website lead is flagged as a build opportunity.
  await page.goto("/admin/leads");
  await page.getByRole("link", { name: "Handshake Plumbing" }).first().click();
  await expect(page.getByText("no website — build opportunity")).toBeVisible();
});
