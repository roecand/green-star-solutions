import { NextResponse } from "next/server";
import { getSessionUser, getUserOrganization } from "@/lib/auth/session";
import { isStripeConfigured, stripeClient } from "@/lib/billing/stripe";
import { appUrl } from "@/lib/email/send";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const organization = getUserOrganization(user.id);
  if (!organization) return NextResponse.json({ error: "No organization." }, { status: 400 });

  if (!isStripeConfigured() || !organization.stripeCustomerId) {
    return NextResponse.json(
      { error: "Billing portal is available once Stripe is configured and a subscription exists." },
      { status: 400 }
    );
  }

  const session = await stripeClient().billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: appUrl("/app/billing"),
  });
  return NextResponse.json({ redirect: session.url });
}
