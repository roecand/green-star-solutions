"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { INTAKE_QUESTIONS } from "@/lib/scoring/intake";

/**
 * The quick→comprehensive step-up: six multiple-choice questions asked inline
 * on the quick report. Completing them unlocks the full audit.
 */
export function DeepenForm({ token }: { token: string }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = Object.keys(answers).length;
  const total = INTAKE_QUESTIONS.length;
  const complete = answered === total;

  async function submit() {
    if (!complete) {
      setError("Answer all six — each one changes your report.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/report/${token}/deepen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — please try again.");
        setSubmitting(false);
        return;
      }
      // Server flipped the scan to comprehensive; re-render with full audit.
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <section className="print-hidden rounded-2xl border-2 border-primary/50 bg-accent/20 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Unlock your full audit — free</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer six quick questions and we&apos;ll unlock the complete leak
            list, your prioritized fix roadmap, and insights personalized to how
            your business actually runs.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-strong">
          {answered}/{total} answered
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {INTAKE_QUESTIONS.map((q, qi) => (
          <fieldset key={q.id}>
            <legend className="text-sm font-semibold">
              {qi + 1}. {q.question}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.options.map((o) => {
                const selected = answers[q.id] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                    className={
                      selected
                        ? "rounded-full border-2 border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary-strong"
                        : "rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex items-center gap-4">
        <Button size="lg" onClick={submit} disabled={submitting}>
          {submitting ? "Building your full audit…" : "Unlock My Full Audit"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Your answers never change your score — they personalize your plan.
        </p>
      </div>
    </section>
  );
}
