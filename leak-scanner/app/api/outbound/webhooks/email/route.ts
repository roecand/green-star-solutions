import { NextResponse } from "next/server";
import { dbReady } from "@/lib/db";
import { logActivity } from "@/lib/outbound/core/activity";
import { requestSecret, secretMatches } from "@/lib/outbound/core/auth";
import {
  findLeadByEmail,
  handleBounce,
  handleInboundReply,
  handleProviderSent,
  handleUnsubscribe,
} from "@/lib/outbound/replies/handle";
import { normalizeWebhook } from "@/lib/outbound/replies/webhook";

/**
 * Inbound email events (replies, bounces, unsubscribes, provider sends).
 * Point Smartlead's webhook or your n8n reply workflow here:
 *   POST /api/outbound/webhooks/email?secret=$OUTBOUND_WEBHOOK_SECRET
 */
export async function POST(request: Request) {
  if (!secretMatches(requestSecret(request), process.env.OUTBOUND_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbReady();
  const body = await request.json().catch(() => null);
  const event = normalizeWebhook(body);

  switch (event.type) {
    case "reply": {
      const outcome = await handleInboundReply({
        fromEmail: event.email,
        content: event.content,
        subject: event.subject,
        providerRef: event.ref,
        receivedAt: event.receivedAt ?? undefined,
      });
      if (outcome.status === "unmatched") {
        await logActivity({ type: "WEBHOOK_REJECTED", level: "warn", message: `Reply from unknown sender ${event.email}` });
      }
      return NextResponse.json(outcome);
    }
    case "bounce":
      return NextResponse.json({ matched: await handleBounce(event.email, event.detail) });
    case "unsubscribe": {
      const lead = await findLeadByEmail(event.email);
      if (lead) await handleUnsubscribe(lead, "provider webhook");
      else {
        const { suppress } = await import("@/lib/outbound/replies/suppression");
        await suppress(event.email, "unsubscribed", "provider webhook");
      }
      return NextResponse.json({ ok: true });
    }
    case "sent":
      await handleProviderSent(event.email, event.step, event.ref);
      return NextResponse.json({ ok: true });
    default:
      await logActivity({
        type: "WEBHOOK_REJECTED",
        level: "warn",
        message: event.reason,
        metadata: { sample: JSON.stringify(body).slice(0, 1500) },
      });
      // 200 so providers don't retry payloads we deliberately ignore.
      return NextResponse.json({ ignored: event.reason });
  }
}
