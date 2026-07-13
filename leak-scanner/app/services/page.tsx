import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { GREENSTAR_SERVICES } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Greenstar services",
  description: "The implementation services behind every Revenue Leak Report recommendation.",
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">
            We don&apos;t just find leaks. We fix them.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every recommendation in a Revenue Leak Report maps to one of these
            Greenstar Solutions services. Run a scan, see what applies to you,
            and we&apos;ll handle the rest.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {GREENSTAR_SERVICES.map((service, i) => (
            <div key={service.id} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold text-primary-strong">
                {i + 1}
              </span>
              <h2 className="mt-4 text-lg font-semibold">{service.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-charcoal p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Not sure which you need?</h2>
          <p className="mx-auto mt-2 max-w-md text-white/75">
            The free scan tells you. It maps every leak it finds to the exact
            service that fixes it.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/scanner" className={buttonClasses("primary", "lg")}>
              Run Free Scan
            </Link>
            <Link href="/contact" className="inline-flex h-12 items-center rounded-lg border border-white/30 px-6 text-base font-medium hover:bg-white/10">
              Talk to us first
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
