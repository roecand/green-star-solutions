import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary-strong">404</p>
        <h1 className="mt-2 text-3xl font-bold">That page doesn&apos;t exist</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          If you followed a report link, double-check the full URL — report
          links are long on purpose so only you can share them.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className={buttonClasses("outline", "md")}>
            Back home
          </Link>
          <Link href="/scanner" className={buttonClasses("primary", "md")}>
            Run a free scan
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
