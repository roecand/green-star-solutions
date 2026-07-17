/**
 * Feature flags.
 *
 * The scanner currently runs as a FREE lead-generation funnel for Green Star
 * Solutions. The paid-SaaS billing surface (pricing page, plan upgrades,
 * report gating, subscription checkout) is fully built but hidden by default.
 * Flip NEXT_PUBLIC_BILLING_ENABLED=true to expose it again later — no code was
 * deleted.
 *
 * NEXT_PUBLIC_ so both server and client components can read it identically.
 */
export function billingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
}

/**
 * The scheduling link the report's primary CTA ("Get My Personalized Fix
 * Plan") points at. Owned by Green Star — never invent one. When unset, the
 * report shows a graceful "we'll reach out" confirmation instead of a dead link.
 */
export function bookingUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  return url ? url : null;
}
