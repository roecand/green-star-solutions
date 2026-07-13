import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isStripeConfigured, stripeClient } from "@/lib/billing/stripe";
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/lib/billing/webhook-handlers";

export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        handleCheckoutCompleted({
          organizationId: session.metadata?.organizationId,
          plan: session.metadata?.plan,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        });
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        handleSubscriptionUpdated({
          organizationId: subscription.metadata?.organizationId,
          plan: subscription.metadata?.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        handleSubscriptionDeleted({
          organizationId: subscription.metadata?.organizationId,
        });
        break;
      }
      default:
        break; // ignore unhandled event types
    }
  } catch (error) {
    console.error("stripe webhook handling failed", error);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
