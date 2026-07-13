import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScannerForm } from "@/components/scanner-form";

export const metadata: Metadata = {
  title: "Run your free scan",
  description:
    "Scan your website, local visibility, AI visibility, trust signals, and follow-up readiness in minutes.",
};

export default function ScannerPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="mb-8 max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Free Revenue Leak Scan
          </h1>
          <p className="mt-2 text-muted-foreground">
            Five quick questions, then we scan your website the way a
            ready-to-buy customer — and an AI answer engine — sees it.
          </p>
        </div>
        <ScannerForm />
      </main>
      <SiteFooter />
    </>
  );
}
