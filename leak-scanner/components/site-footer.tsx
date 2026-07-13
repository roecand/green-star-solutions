import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-charcoal text-white print-hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-semibold">Greenstar Revenue Leak Scanner</p>
          <p className="mt-2 text-sm text-white/70">
            Find where your local business is leaking leads — and what to fix
            first. Built by Greenstar Solutions.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium text-white/90">Product</p>
          <ul className="space-y-2 text-white/70">
            <li><Link href="/scanner" className="hover:text-white">Run a free scan</Link></li>
            <li><Link href="/demo" className="hover:text-white">Demo report</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/services" className="hover:text-white">Greenstar services</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium text-white/90">Company</p>
          <ul className="space-y-2 text-white/70">
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms of service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Greenstar Solutions. Reports are diagnostics based on
        publicly visible website content — not guarantees of results.
      </div>
    </footer>
  );
}
