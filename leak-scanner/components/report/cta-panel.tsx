"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CtaPanel({
  token,
  bookingUrl,
  showPdf = false,
}: {
  token: string;
  bookingUrl: string | null;
  showPdf?: boolean;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(action: string, extra?: Record<string, string>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/report/${token}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
        return false;
      }
      return true;
    } catch {
      setMessage("Network error — please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="print-hidden rounded-2xl bg-charcoal p-8 text-white">
      <h2 className="text-2xl font-bold">Want Greenstar to fix these leaks for you?</h2>
      <p className="mt-2 max-w-2xl text-white/80">
        We can turn this report into a working growth system: website,
        automation, reviews, follow-up, and AI-ready content.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          size="lg"
          disabled={busy}
          onClick={async () => {
            const ok = await act("book_call");
            if (ok) {
              if (bookingUrl) window.open(bookingUrl, "_blank");
              else setMessage("Request received — we'll reach out to schedule your call.");
            }
          }}
        >
          Book Strategy Call
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/30 bg-transparent text-white hover:bg-white/10"
          disabled={busy}
          onClick={async () => {
            const ok = await act("request_fix_plan");
            if (ok) setMessage("Got it — Greenstar will send you a custom fix plan shortly.");
          }}
        >
          Request Fix Plan
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/30 bg-transparent text-white hover:bg-white/10"
          disabled={busy}
          onClick={() => setEmailOpen((v) => !v)}
        >
          Email Me This Report
        </Button>
        {showPdf && (
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => window.print()}
          >
            Download / Print PDF
          </Button>
        )}
      </div>
      {emailOpen && (
        <form
          className="mt-4 flex max-w-md gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await act("email_report", { email });
            if (ok) {
              setMessage("Report sent — check your inbox.");
              setEmailOpen(false);
            }
          }}
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className="bg-white text-foreground"
          />
          <Button type="submit" disabled={busy}>
            Send
          </Button>
        </form>
      )}
      {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
    </section>
  );
}
