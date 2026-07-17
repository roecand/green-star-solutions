"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CtaPanel({
  token,
  bookingUrl,
}: {
  token: string;
  bookingUrl: string | null;
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
      <h2 className="text-2xl font-bold">Want Green Star to fix these leaks for you?</h2>
      <p className="mt-2 max-w-2xl text-white/80">
        Green Star Solutions turns this report into a working growth system —
        website, follow-up, reviews, local visibility, and AI-ready content.
        Get a personalized plan for your business, free.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          disabled={busy}
          onClick={async () => {
            // Records the lead's intent + notifies Green Star, then opens the
            // scheduler if one is configured.
            const ok = await act("request_fix_plan");
            if (ok) {
              if (bookingUrl) window.open(bookingUrl, "_blank", "noopener");
              else
                setMessage(
                  "Got it — Green Star will reach out with your personalized fix plan shortly."
                );
            }
          }}
        >
          Get My Personalized Fix Plan
        </Button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setEmailOpen((v) => !v)}
          className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          Email me this report
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          Print / save PDF
        </button>
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
