import Stripe from "stripe";
import type { Plan } from "@/lib/db/schema";
import { PLANS } from "./plans";

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

let client: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  }
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function stripePriceIdFor(plan: Plan): string | null {
  const env = PLANS[plan].stripePriceEnv;
  if (!env) return null;
  return process.env[env] ?? null;
}
