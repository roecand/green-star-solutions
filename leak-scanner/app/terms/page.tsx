import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 9, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
          <section>
            <h2>The service</h2>
            <p>
              The Greenstar Revenue Leak Scanner analyzes the publicly visible
              content of a website you submit and produces diagnostic scores,
              findings, and recommendations. You may only scan websites you own
              or are authorized to evaluate.
            </p>
          </section>
          <section>
            <h2>No guarantees</h2>
            <p>
              Reports are diagnostic opinions generated from detectable website
              signals. They are not guarantees of revenue, rankings, lead volume,
              or any business outcome. References to AI or search visibility
              describe content signals on your website, not the actual behavior of
              any third-party AI or search platform.
            </p>
          </section>
          <section>
            <h2>Subscriptions</h2>
            <p>
              Paid plans renew monthly until canceled. You can cancel anytime via
              the billing portal; access continues through the end of the paid
              period. Prices may change with 30 days&apos; notice.
            </p>
          </section>
          <section>
            <h2>Acceptable use</h2>
            <p>
              No scanning of websites you have no rights to evaluate, no attempts
              to overload or abuse the scanner, no reselling of reports without
              permission.
            </p>
          </section>
          <section>
            <h2>Liability</h2>
            <p>
              The service is provided &ldquo;as is.&rdquo; To the maximum extent
              permitted by law, Greenstar Solutions&apos; total liability is limited
              to the amount you paid in the twelve months before a claim.
            </p>
          </section>
          <section>
            <h2>Contact</h2>
            <p>hello@greenstarsolutions.com</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
