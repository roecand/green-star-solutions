import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buttonClasses } from "@/components/ui/button";
import { ScoreRing } from "@/components/report/score-ring";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import { trackEvent } from "@/lib/analytics/track";

const CHECKS = [
  {
    title: "Website Conversion",
    description:
      "Does your site turn visitors into calls and bookings? CTAs, phone visibility, forms, mobile experience, and offer clarity.",
  },
  {
    title: "Local Visibility",
    description:
      "Can customers (and local search) tell where you work? City signals, service areas, NAP info, and local proof.",
  },
  {
    title: "AI Visibility",
    description:
      "Could AI answer engines understand and recommend you? Clear services, FAQs, differentiators, and structured content.",
  },
  {
    title: "Trust & Proof",
    description:
      "Would a skeptical visitor believe you? Reviews, credentials, guarantees, photos, and years in business.",
  },
  {
    title: "Follow-Up Readiness",
    description:
      "Do captured leads actually go anywhere? Forms, booking paths, response promises, and automation signals.",
  },
];

const FAQS = [
  {
    q: "Is the scan really free?",
    a: "Yes. One full scan with your Revenue Leak Score, category scores, and your top leaks — no credit card. Paid plans add monitoring, history, competitor comparison, and exports.",
  },
  {
    q: "What do you actually check?",
    a: "We read your website's public pages the way a first-time visitor or an AI system would, then run dozens of deterministic checks across conversion, local visibility, AI-readiness, trust, and follow-up. Every score is explainable — no black box.",
  },
  {
    q: "Do you log into my Google Business Profile or analytics?",
    a: "No. The scan only reads your public website. No logins, no embeds, no setup.",
  },
  {
    q: "Can you tell me exactly how AI tools rank me?",
    a: "No one can honestly promise that. What we measure is whether your public content gives AI and search-answer systems enough clear signals to understand and recommend you — and we use careful language about it.",
  },
  {
    q: "What happens after the scan?",
    a: "You get a shareable report with a prioritized fix roadmap. Fix things yourself, or have Greenstar Solutions implement them for you — every finding maps to a specific service.",
  },
];

export default function LandingPage() {
  trackEvent({ eventType: "landing_visit", path: "/" });

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/60 via-background to-background" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[3fr_2fr] md:items-center md:py-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent/50 px-3 py-1 text-xs font-medium text-primary-strong">
                Free diagnostic · No login · ~60 seconds
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Find where your local business is{" "}
                <span className="text-primary-strong">leaking leads.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Scan your website, local visibility, AI visibility, trust
                signals, and follow-up readiness. Get a clear Revenue Leak
                Score and a prioritized action plan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/scanner" className={buttonClasses("primary", "lg")}>
                  Run Free Scan
                </Link>
                <Link href="/demo" className={buttonClasses("outline", "lg")}>
                  See Demo Report
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Your business may not have a traffic problem. It may have a
                revenue leak problem.
              </p>
            </div>
            <div className="mx-auto flex max-w-xs flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
              <ScoreRing score={58} size={150} label="Revenue Leak Score" />
              <p className="mt-3 text-center text-sm text-muted-foreground">
                &ldquo;Your online presence is probably leaking meaningful
                revenue.&rdquo;
              </p>
              <div className="mt-4 w-full space-y-2 text-xs">
                {(
                  [
                    ["Website Conversion", 50, "bg-danger"],
                    ["Local Visibility", 65, "bg-warning"],
                    ["AI Visibility", 45, "bg-danger"],
                    ["Trust & Proof", 70, "bg-warning"],
                    ["Follow-Up Readiness", 60, "bg-warning"],
                  ] as const
                ).map(([label, value, color]) => (
                  <div key={label}>
                    <div className="flex justify-between">
                      <span>{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                      <div
                        className={`h-1.5 rounded-full ${color}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                Example scores for illustration
              </p>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-border bg-charcoal py-16 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold">
              Traffic is expensive. Missed leads are invisible.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/75">
              Most local businesses don&apos;t need more visitors — they need to
              stop wasting the ones they already have. A buried phone number, a
              slow reply, a site AI can&apos;t understand: each one quietly sends
              ready-to-buy customers to a competitor. You never see it happen.
            </p>
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              {[
                ["Visitors leave", "No clear next step above the fold means ready buyers bounce without calling."],
                ["Leads go cold", "Form submissions that wait hours for a reply usually buy from whoever answered first."],
                ["AI skips you", "Answer engines recommend businesses they can understand. Thin content makes you invisible."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl bg-white/5 p-5">
                  <h3 className="font-semibold text-emerald-300">{title}</h3>
                  <p className="mt-2 text-sm text-white/70">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What the scanner checks */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">What the scanner checks</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Five categories, dozens of deterministic checks, one clear score.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKS.map((check, i) => (
              <div key={check.title} className="rounded-xl border border-border bg-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold text-primary-strong">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{check.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {check.description}
                </p>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-primary to-primary-strong p-6 text-white">
              <h3 className="text-lg font-semibold">The Revenue Leak Score</h3>
              <p className="mt-2 text-sm text-white/85">
                All five categories roll into one 0–100 score with a
                plain-English verdict — so you know in seconds whether your
                online presence is working for you or against you.
              </p>
            </div>
          </div>
        </section>

        {/* How Greenstar fixes it */}
        <section className="border-t border-border bg-muted/50 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">
              Then we can fix the leaks for you
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              Every finding in your report maps to a specific Greenstar
              Solutions service — website rebuilds, follow-up automation,
              review systems, local SEO foundations, AI visibility upgrades,
              and lead reactivation.
            </p>
            <div className="mt-8 text-center">
              <Link href="/services" className={buttonClasses("secondary", "lg")}>
                See Greenstar services
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Start free. Upgrade when you want ongoing monitoring.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {PLAN_ORDER.map((planId) => {
              const plan = PLANS[planId];
              const highlight = planId === "growth";
              return (
                <div
                  key={planId}
                  className={
                    highlight
                      ? "relative rounded-xl border-2 border-primary bg-card p-6 shadow-lg shadow-primary/10"
                      : "rounded-xl border border-border bg-card p-6"
                  }
                >
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold">
                    ${plan.priceMonthly}
                    {plan.priceMonthly > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    )}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-primary-strong">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={planId === "free" ? "/scanner" : "/pricing"}
                    className={`${buttonClasses(highlight ? "primary" : "outline", "md")} mt-6 w-full`}
                  >
                    {planId === "free" ? "Run Free Scan" : "Choose plan"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/50 py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-3xl font-bold">Questions, answered</h2>
            <div className="mt-8 space-y-4">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-border bg-card p-5">
                  <summary className="cursor-pointer font-medium marker:content-none">
                    {faq.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold">
              Find your leaks before your competitors do
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Sixty seconds from now you&apos;ll know exactly where your online
              presence is costing you calls — and what to fix first.
            </p>
            <Link href="/scanner" className={`${buttonClasses("primary", "lg")} mt-8`}>
              Run Your Free Scan
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
