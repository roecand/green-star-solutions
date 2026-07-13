import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { buttonClasses } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur print-hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-semibold">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            ★
          </span>
          <span className="max-[420px]:hidden">
            Greenstar <span className="text-primary-strong">Leak Scanner</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/demo" className="hover:text-foreground">
            Demo report
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/services" className="hover:text-foreground">
            Services
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <Link
              href={user.role === "admin" ? "/admin" : "/app/dashboard"}
              className={`${buttonClasses("outline", "sm")} whitespace-nowrap`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Log in
            </Link>
          )}
          <Link
            href="/scanner"
            className={`${buttonClasses("primary", "sm")} whitespace-nowrap`}
          >
            Run Free Scan
          </Link>
        </div>
      </div>
    </header>
  );
}
