import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/logout-button";
import { llmProviderName } from "@/lib/outbound/llm";

export const metadata: Metadata = { title: { default: "Outbound", template: "%s · Greenstar Outbound" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OutboundLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const nav = [
    { href: "/outbound", label: "Dashboard" },
    { href: "/outbound/leads", label: "Leads" },
    { href: "/outbound/campaigns", label: "Campaigns" },
    { href: "/outbound/settings", label: "Settings" },
  ];
  const llm = llmProviderName();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-charcoal text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/outbound" className="font-semibold">
              Greenstar Outbound
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-white/60 sm:inline">LLM: {llm === "none" ? "off (templates)" : llm}</span>
            <Link href="/admin" className="text-white/70 hover:text-white">
              Scanner admin
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
