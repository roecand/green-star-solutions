import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Plan } from "@/lib/db/schema";

const VALID_PLANS = new Set(["starter", "growth", "pro"]);

/**
 * Pure-ish webhook handlers, separated from signature verification so they
 * can be unit-tested with plain event objects.
 */

export async function handleCheckoutCompleted(event: {
  organizationId?: string;
  plan?: string;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<boolean> {
  const { organizationId, plan } = event;
  if (!organizationId || !plan || !VALID_PLANS.has(plan)) return false;
  const org = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .get();
  if (!org) return false;

  await db
    .update(schema.organizations)
    .set({
      plan: plan as Plan,
      stripeCustomerId: event.customerId ?? org.stripeCustomerId,
      stripeSubscriptionId: event.subscriptionId ?? org.stripeSubscriptionId,
    })
    .where(eq(schema.organizations.id, organizationId))
    .run();
  await db
    .insert(schema.subscriptions)
    .values({ organizationId, plan: plan as Plan, status: "active" })
    .run();
  await db
    .insert(schema.auditEvents)
    .values({
      organizationId,
      eventType: "subscription_started",
      entityType: "organization",
      entityId: organizationId,
      payloadJson: JSON.stringify({ plan }),
    })
    .run();
  return true;
}

export async function handleSubscriptionUpdated(event: {
  organizationId?: string;
  plan?: string;
  status: string;
  currentPeriodEnd?: number | null;
}): Promise<boolean> {
  const { organizationId } = event;
  if (!organizationId) return false;
  const org = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .get();
  if (!org) return false;

  const active = event.status === "active" || event.status === "trialing";
  if (active && event.plan && VALID_PLANS.has(event.plan)) {
    await db
      .update(schema.organizations)
      .set({ plan: event.plan as Plan })
      .where(eq(schema.organizations.id, organizationId))
      .run();
  }
  if (!active && ["canceled", "unpaid", "incomplete_expired"].includes(event.status)) {
    await db
      .update(schema.organizations)
      .set({ plan: "free", stripeSubscriptionId: null })
      .where(eq(schema.organizations.id, organizationId))
      .run();
  }
  await db
    .insert(schema.subscriptions)
    .values({
      organizationId,
      plan: (VALID_PLANS.has(event.plan ?? "") ? event.plan : org.plan) as Plan,
      status: event.status,
      currentPeriodEnd: event.currentPeriodEnd ? new Date(event.currentPeriodEnd * 1000) : null,
    })
    .run();
  return true;
}

export async function handleSubscriptionDeleted(event: {
  organizationId?: string;
}): Promise<boolean> {
  const { organizationId } = event;
  if (!organizationId) return false;
  const org = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .get();
  if (!org) return false;

  await db
    .update(schema.organizations)
    .set({ plan: "free", stripeSubscriptionId: null })
    .where(eq(schema.organizations.id, organizationId))
    .run();
  await db
    .insert(schema.subscriptions)
    .values({ organizationId, plan: "free", status: "canceled" })
    .run();
  await db
    .insert(schema.auditEvents)
    .values({
      organizationId,
      eventType: "subscription_canceled",
      entityType: "organization",
      entityId: organizationId,
    })
    .run();
  return true;
}
