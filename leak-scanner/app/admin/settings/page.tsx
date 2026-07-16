import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin settings" };

export default async function AdminSettingsPage() {
  const emailEvents = await db
    .select()
    .from(schema.emailEvents)
    .orderBy(desc(schema.emailEvents.createdAt))
    .limit(20)
    .all();

  const envChecks = [
    ["ANTHROPIC_API_KEY", !!process.env.ANTHROPIC_API_KEY, "AI report generation (falls back to deterministic copy)"],
    ["STRIPE_SECRET_KEY", !!process.env.STRIPE_SECRET_KEY, "Live billing (mock checkout without it)"],
    ["RESEND_API_KEY", !!process.env.RESEND_API_KEY, "Real email delivery (mocked/logged without it)"],
    ["ADMIN_NOTIFICATION_EMAIL", !!process.env.ADMIN_NOTIFICATION_EMAIL, "Lead + help-request notifications"],
    ["NEXT_PUBLIC_BOOKING_URL", !!process.env.NEXT_PUBLIC_BOOKING_URL, "Strategy-call booking link"],
  ] as const;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Admin settings</h1>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Integrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything runs without keys — these unlock the real services.
        </p>
        <ul className="mt-4 space-y-3">
          {envChecks.map(([name, configured, description]) => (
            <li key={name} className="flex items-center gap-3 text-sm">
              <Badge tone={configured ? "success" : "muted"}>
                {configured ? "configured" : "not set"}
              </Badge>
              <code className="font-mono text-xs">{name}</code>
              <span className="flex-1 text-right text-muted-foreground">{description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Recent email events</h2>
        </div>
        {emailEvents.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No email events yet.</p>
        ) : (
          <ul>
            {emailEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 border-b border-border p-3 text-sm last:border-0">
                <Badge tone={event.status === "sent" ? "success" : event.status === "failed" ? "danger" : "muted"}>
                  {event.status}
                </Badge>
                <span className="flex-1">{event.eventType}</span>
                <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
