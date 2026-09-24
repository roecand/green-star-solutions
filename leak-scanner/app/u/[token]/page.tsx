import type { Metadata } from "next";
import { dbReady } from "@/lib/db";
import { leadByUnsubscribeToken, unsubscribeByToken } from "@/lib/outbound/replies/unsubscribe";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Public opt-out page. Opting out takes a button press (POST via server
 * action) rather than happening on GET, so link scanners that pre-fetch URLs
 * can't unsubscribe people by accident.
 */
export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;
  await dbReady();
  const lead = await leadByUnsubscribeToken(token);

  async function confirm() {
    "use server";
    await dbReady();
    await unsubscribeByToken(token, "unsubscribe page");
    redirect(`/u/${token}?done=1`);
  }

  const alreadyOut = lead?.status === "DO_NOT_CONTACT";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold">Greenstar Solutions</h1>
      {!lead ? (
        <p className="mt-4 text-muted-foreground">This link isn&apos;t valid. If you&apos;d like us to stop emailing you, just reply to any email with &ldquo;unsubscribe&rdquo; and we&apos;ll remove you.</p>
      ) : done || alreadyOut ? (
        <p className="mt-4 text-muted-foreground">You&apos;re unsubscribed. We won&apos;t email {lead.email} again.</p>
      ) : (
        <>
          <p className="mt-4 text-muted-foreground">Stop all emails from Greenstar Solutions to <strong className="text-foreground">{lead.email}</strong>?</p>
          <form action={confirm} className="mt-6">
            <button type="submit" className="h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">
              Unsubscribe
            </button>
          </form>
        </>
      )}
    </main>
  );
}
