"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { INTAKE_QUESTIONS } from "@/lib/scoring/intake";

/**
 * The quick→comprehensive step-up, quiz-style: a trigger card opens a modal
 * that asks the five deep-audit questions ONE at a time. Tapping an answer
 * auto-advances; finishing runs a brief "diagnosing" transition, then the
 * server flips the scan to comprehensive and the page re-renders unlocked.
 *
 * Answer state lives in this component, so closing the modal mid-way and
 * reopening it resumes where they left off.
 */
export function DeepenForm({ token }: { token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"asking" | "diagnosing">("asking");
  const [error, setError] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = INTAKE_QUESTIONS.length;
  const question = INTAKE_QUESTIONS[Math.min(questionIndex, total - 1)];
  const answeredCount = Object.keys(answers).length;

  // Lock page scroll + close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "asking") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, phase]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  async function submit(finalAnswers: Record<string, string>) {
    setPhase("diagnosing");
    setError(null);
    try {
      // Run the request alongside a minimum "diagnosing" beat (~1.6s) so the
      // reveal feels earned rather than instant.
      const [res] = await Promise.all([
        fetch(`/api/report/${token}/deepen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: finalAnswers }),
        }),
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase("asking");
        setError(data.error ?? "Something went wrong — please try again.");
        return;
      }
      // Re-render the page with the full audit unlocked.
      router.refresh();
    } catch {
      setPhase("asking");
      setError("Network error — please try again.");
    }
  }

  function choose(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    setError(null);
    // Brief beat so the selection registers visually before advancing.
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (questionIndex < total - 1) {
        setQuestionIndex(questionIndex + 1);
      } else {
        void submit(next);
      }
    }, 220);
  }

  return (
    <>
      {/* Trigger card */}
      <section className="print-hidden rounded-2xl border-2 border-primary/50 bg-accent/20 p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold">Unlock your full audit — free</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Five quick taps about how your business actually runs, and we&apos;ll
          unlock the complete leak list, your prioritized fix roadmap, and
          insights built from your answers.
        </p>
        <Button size="lg" className="mt-5" onClick={() => setOpen(true)}>
          {answeredCount > 0 && answeredCount < total
            ? `Continue (${answeredCount}/${total} answered)`
            : "Unlock My Full Audit"}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          ~20 seconds · your answers never change your score — they personalize your plan
        </p>
      </section>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Deep audit questions"
        >
          <div className="flex h-[100dvh] w-full max-w-lg flex-col bg-card p-6 sm:h-auto sm:min-h-[420px] sm:rounded-2xl sm:border sm:border-border sm:p-8 sm:shadow-2xl">
            {phase === "asking" ? (
              <>
                {/* Progress + close */}
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${(questionIndex / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {questionIndex + 1} of {total}
                  </span>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                {/* One question at a time */}
                <div key={question.id} className="animate-fade-up mt-8 flex-1">
                  <h2 className="text-xl font-bold leading-snug">{question.question}</h2>
                  <div className="mt-5 flex flex-col gap-2" role="radiogroup" aria-label={question.question}>
                    {question.options.map((o) => {
                      const selected = answers[question.id] === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => choose(o.value)}
                          className={
                            selected
                              ? "rounded-xl border-2 border-primary bg-primary/10 p-3.5 text-left text-sm font-medium text-primary-strong"
                              : "rounded-xl border border-border bg-card p-3.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted"
                          }
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  {error && <p className="mt-4 text-sm text-danger">{error}</p>}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  {questionIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => setQuestionIndex(questionIndex - 1)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      ← Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground">tap an answer to continue</p>
                </div>
              </>
            ) : (
              /* Diagnosing transition — the reveal should feel earned. */
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--muted)" strokeWidth="6" />
                  <circle
                    cx="36"
                    cy="36"
                    r="30"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="60 130"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 36 36"
                      to="360 36 36"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
                <h2 className="mt-6 text-xl font-bold">Diagnosing your business…</h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Matching your answers against the leaks we found and building
                  your personalized fix plan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
