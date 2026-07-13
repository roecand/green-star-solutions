import Link from "next/link";
import { requireUserWithOrg } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/logout-button";
import { PLANS } from "@/lib/billing/plans";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization } = await requireUserWithOrg();
  const plan = PLANS[organization.plan];

  const nav = [
    { href: "/app/dashboard", label: "Dashboard" },
    { href: "/app/scans", label: "Scans" },
    { href: "/app/businesses", label: "Businesses" },
    { href: "/app/billing", label: "Billing" },
    { href: "/app/settings", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                ★
              </span>
              <span className="hidden sm:inline">Greenstar Leak Scanner</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-1.5 font-medium text-primary-strong hover:bg-accent/50"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={plan.id === "free" ? "muted" : "success"}>{plan.name}</Badge>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
