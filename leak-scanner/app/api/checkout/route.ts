import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSessionUser, getUserOrganization } from "@/lib/auth/session";
import { isStripeConfigured, stripeClient, stripePriceIdFor } from "@/lib/billing/stripe";
import { appUrl } from "@/lib/email/send";
import { trackEvent } from "@/lib/analytics/track";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Create an account first — it takes 30 seconds.", redirect: "/signup?next=/pricing" },
      { status: 401 }
    );
  }
  const organization = getUserOrganization(user.id);
  if (!organization) {
    return NextResponse.json({ error: "No organization found." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const plan = parsed.data.plan;

  // Mock mode: no Stripe keys — apply the plan directly, clearly labeled.
  if (!isStripeConfigured()) {
    db.update(schema.organizations)
      .set({ plan })
      .where(eq(schema.organizations.id, organization.id))
      .run();
    db.insert(schema.subscriptions)
      .values({ organizationId: organization.id, plan, status: "mock_active" })
      .run();
    db.insert(schema.auditEvents)
      .values({
        organizationId: organization.id,
        actorUserId: user.id,
        eventType: "plan_changed_mock",
        entityType: "organization",
        entityId: organization.id,
        payloadJson: JSON.stringify({ plan }),
      })
      .run();
    trackEvent({ eventType: "upgrade", userId: user.id, metadata: { plan, mode: "mock" } });
    return NextResponse.json({ mock: true, redirect: "/app/billing?upgraded=mock" });
  }

  const priceId = stripePriceIdFor(plan);
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for the ${plan} plan is not configured.` },
      { status: 500 }
    );
  }

  const stripe = stripeClient();
  let customerId = organization.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: organization.name,
      metadata: { organizationId: organization.id },
    });
    customerId = customer.id;
    db.update(schema.organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.organizations.id, organization.id))
      .run();
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl("/app/billing?upgraded=1"),
    cancel_url: appUrl("/pricing"),
    metadata: { organizationId: organization.id, plan },
    subscription_data: {
      metadata: { organizationId: organization.id, plan },
    },
  });

  trackEvent({ eventType: "upgrade", userId: user.id, metadata: { plan, mode: "checkout_started" } });
  return NextResponse.json({ redirect: session.url });
}
