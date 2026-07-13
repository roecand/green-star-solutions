import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 9, 2026</p>
        <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
          <section>
            <h2>What we collect</h2>
            <p>
              When you run a scan we collect the information you enter: business
              name, website URL, industry, location, your name (optional), email,
              and phone (optional). We also store the analysis of your website&apos;s
              publicly visible content — extracted text, detected signals, and the
              resulting scores and recommendations.
            </p>
          </section>
          <section>
            <h2>Website scanning</h2>
            <p>
              The scanner reads only publicly accessible pages of the website you
              submit, the same way a normal visitor&apos;s browser or a search engine
              would. It does not log into anything, execute site scripts, or access
              private data. We fetch at most five pages per scan.
            </p>
          </section>
          <section>
            <h2>How we use your information</h2>
            <p>
              To generate and deliver your report, to operate your account and
              subscription, and — if you request help or run a free scan — to
              contact you about Greenstar Solutions services related to your
              report. We do not sell your data.
            </p>
          </section>
          <section>
            <h2>Payments</h2>
            <p>
              Payments are processed by Stripe. We never see or store your full
              card details. Emails are delivered via Resend.
            </p>
          </section>
          <section>
            <h2>Retention and deletion</h2>
            <p>
              You can ask us to delete your account, scans, and lead records at
              any time by emailing hello@greenstarsolutions.com. We&apos;ll confirm
              deletion within 30 days.
            </p>
          </section>
          <section>
            <h2>Contact</h2>
            <p>Questions? Email hello@greenstarsolutions.com.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
