import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Greenstar Solutions about fixing your revenue leaks.",
};

export default function ContactPage() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Talk to Greenstar</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Whether you&apos;ve run a scan or not, we&apos;re happy to look at
          your situation and tell you honestly what&apos;s worth fixing first.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Book a strategy call</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              20 minutes, no pitch-slapping. We&apos;ll walk your report (or
              your website) together and agree on the highest-leverage fixes.
            </p>
            {bookingUrl ? (
              <a href={bookingUrl} target="_blank" rel="noreferrer" className={`${buttonClasses("primary", "md")} mt-4`}>
                Pick a time
              </a>
            ) : (
              <a href="mailto:hello@greenstarsolutions.com?subject=Strategy%20call%20request" className={`${buttonClasses("primary", "md")} mt-4`}>
                Email to schedule
              </a>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Email us</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send your website URL and what you&apos;re trying to grow —
              calls, bookings, or reviews — and we&apos;ll reply with next steps.
            </p>
            <a href="mailto:hello@greenstarsolutions.com" className={`${buttonClasses("outline", "md")} mt-4`}>
              hello@greenstarsolutions.com
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-xl bg-muted p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Haven&apos;t scanned yet? The report makes the conversation twice as useful.
          </p>
          <Link href="/scanner" className={`${buttonClasses("secondary", "md")} mt-3`}>
            Run Free Scan first
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
