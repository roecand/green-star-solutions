"use client";

import { useState } from "react";
import StarMark from "./StarMark";
import { NETLIFY_FORM_NAME } from "@/lib/config";

const TRADES = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Other home service",
];

const GOALS = [
  "A brand & site that look premium",
  "More phone calls & leads",
  "Run Google or Meta ads",
  "Automate follow-up & reviews",
  "Stop missing calls",
  "Not sure — I need a plan",
];

const MARKETING = [
  "Mostly word of mouth",
  "Running ads already",
  "Have a site, no ads",
  "Nothing consistent yet",
];

const BUDGETS = ["Under $1k/mo", "$1k–$3k/mo", "$3k–$6k/mo", "$6k+/mo", "Not sure yet"];
const TIMES = ["Morning", "Afternoon", "Evening", "Anytime"];

const STEPS = ["Business", "Goals", "Marketing", "Contact"];

type State = {
  business: string;
  trade: string;
  serviceArea: string;
  currentSite: string;
  goals: string[];
  goalNote: string;
  currentMarketing: string;
  adBudget: string;
  name: string;
  email: string;
  phone: string;
  bestTime: string;
};

const initial: State = {
  business: "",
  trade: "",
  serviceArea: "",
  currentSite: "",
  goals: [],
  goalNote: "",
  currentMarketing: "",
  adBudget: "",
  name: "",
  email: "",
  phone: "",
  bestTime: "",
};

export default function ProjectForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<State>(initial);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const toggleGoal = (g: string) =>
    setData((d) => ({
      ...d,
      goals: d.goals.includes(g)
        ? d.goals.filter((x) => x !== g)
        : [...d.goals, g],
    }));

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function validate(s: number): string {
    if (s === 0 && !data.business.trim())
      return "Add your business name to continue.";
    if (s === 3) {
      if (!data.name.trim()) return "We need a name to know who we're calling.";
      if (!validEmail(data.email)) return "Add a valid email so we can confirm.";
      if (!data.phone.trim()) return "Add a phone number — it's a call, after all.";
    }
    return "";
  }

  function next() {
    const err = validate(step);
    if (err) return setError(err);
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const err = validate(3);
    if (err) return setError(err);
    setStatus("sending");
    setError("");

    const fd = new FormData();
    fd.append("form-name", NETLIFY_FORM_NAME);
    fd.append("business", data.business);
    fd.append("trade", data.trade);
    fd.append("service_area", data.serviceArea);
    fd.append("current_site", data.currentSite);
    fd.append("goals", data.goals.join(", "));
    fd.append("goal_notes", data.goalNote);
    fd.append("current_marketing", data.currentMarketing);
    fd.append("ad_budget", data.adBudget);
    fd.append("name", data.name);
    fd.append("email", data.email);
    fd.append("phone", data.phone);
    fd.append("best_time", data.bestTime);

    try {
      const res = await fetch("/", { method: "POST", body: fd });
      if (res.ok) setStatus("done");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <section id="start" className="form section">
        <div className="container">
          <div className="form__success">
            <StarMark size={48} className="star--spin" />
            <h2 className="display form__success-head">
              You&rsquo;re on the calendar.
            </h2>
            <p className="lead measure-wide" style={{ marginInline: "auto" }}>
              Thanks, {data.name.split(" ")[0] || "there"}. We&rsquo;ll reach out
              within one business day to lock in your free strategy call — and
              come ready with a few ideas for {data.business || "your business"}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="start" className="form section">
      <div className="container">
        <div className="form__head">
          <p className="eyebrow eyebrow--ink">
            <StarMark size={14} /> Book a free strategy call
          </p>
          <h2 className="display h-lg">Let&rsquo;s map out your transformation.</h2>
          <p className="lead measure-wide">
            Four quick questions. On the call we&rsquo;ll show you exactly how
            your company reads to a homeowner today — and where the jobs are
            leaking. No obligation, no hard sell.
          </p>
        </div>

        <div className="form__shell">
          <div className="form__progress" aria-hidden>
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`pdot ${i === step ? "is-active" : ""} ${
                  i < step ? "is-done" : ""
                }`}
              >
                <span className="pdot__no">
                  {i < step ? <StarMark size={12} /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className="pdot__label">{label}</span>
              </div>
            ))}
          </div>

          <div className="form__panel">
            {/* STEP 0 — business */}
            {step === 0 && (
              <Fieldset legend="Your business" hint="Step 1 of 4">
                <Field label="Business name" required>
                  <input
                    autoFocus
                    value={data.business}
                    onChange={(e) => set("business", e.target.value)}
                    placeholder="e.g. Sunstate Heating & Air"
                  />
                </Field>
                <div className="grid2">
                  <Field label="Trade">
                    <div className="select">
                      <select
                        value={data.trade}
                        onChange={(e) => set("trade", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {TRADES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Service area">
                    <input
                      value={data.serviceArea}
                      onChange={(e) => set("serviceArea", e.target.value)}
                      placeholder="City or metro"
                    />
                  </Field>
                </div>
                <Field label="Current website" hint="if you have one">
                  <input
                    value={data.currentSite}
                    onChange={(e) => set("currentSite", e.target.value)}
                    placeholder="https://"
                    inputMode="url"
                  />
                </Field>
              </Fieldset>
            )}

            {/* STEP 1 — goals */}
            {step === 1 && (
              <Fieldset legend="What are you after?" hint="Step 2 of 4">
                <p className="form__sublabel">Pick anything that fits.</p>
                <div className="chips">
                  {GOALS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      className={`chip ${data.goals.includes(g) ? "is-on" : ""}`}
                      onClick={() => toggleGoal(g)}
                      aria-pressed={data.goals.includes(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <Field label="Anything specific?" hint="optional">
                  <textarea
                    rows={3}
                    value={data.goalNote}
                    onChange={(e) => set("goalNote", e.target.value)}
                    placeholder="What would a great next 6 months look like?"
                  />
                </Field>
              </Fieldset>
            )}

            {/* STEP 2 — current marketing */}
            {step === 2 && (
              <Fieldset legend="Where are you now?" hint="Step 3 of 4">
                <p className="form__sublabel">
                  Helps us come to the call with the right plan.
                </p>
                <div className="chips">
                  {MARKETING.map((m) => (
                    <button
                      type="button"
                      key={m}
                      className={`chip ${
                        data.currentMarketing === m ? "is-on" : ""
                      }`}
                      onClick={() => set("currentMarketing", m)}
                      aria-pressed={data.currentMarketing === m}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Field label="Monthly marketing budget" hint="ballpark is fine">
                  <div className="select">
                    <select
                      value={data.adBudget}
                      onChange={(e) => set("adBudget", e.target.value)}
                    >
                      <option value="">Select…</option>
                      {BUDGETS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </Fieldset>
            )}

            {/* STEP 3 — contact */}
            {step === 3 && (
              <Fieldset legend="Where do we reach you?" hint="Step 4 of 4">
                <div className="grid2">
                  <Field label="Your name" required>
                    <input
                      autoFocus
                      value={data.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="First and last"
                    />
                  </Field>
                  <Field label="Phone" required>
                    <input
                      value={data.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="(702) 555-0142"
                      inputMode="tel"
                    />
                  </Field>
                </div>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@business.com"
                    inputMode="email"
                  />
                </Field>
                <Field label="Best time to call">
                  <div className="select">
                    <select
                      value={data.bestTime}
                      onChange={(e) => set("bestTime", e.target.value)}
                    >
                      <option value="">Select…</option>
                      {TIMES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </Fieldset>
            )}

            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}
            {status === "error" && (
              <p className="form__error" role="alert">
                Something went wrong sending that. Call or email us directly and
                we&rsquo;ll sort it out.
              </p>
            )}

            <div className="form__actions">
              {step > 0 ? (
                <button type="button" className="btn btn--ghost" onClick={back}>
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" className="btn" onClick={next}>
                  Continue <span className="arrow">→</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={submit}
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending…" : "Book my call"}
                  <span className="arrow">↗</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form__head {
          max-width: 640px;
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
        }
        .form__head h2 {
          margin: 0.7rem 0 1rem;
        }
        .form__shell {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: start;
        }
        .form__progress {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: sticky;
          top: 96px;
        }
        .pdot {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.55rem 0;
          color: var(--stone);
          border-left: 2px solid var(--line);
          padding-left: 1rem;
          transition: color 0.3s ease, border-color 0.3s ease;
        }
        .pdot.is-active {
          color: var(--ink);
          border-left-color: var(--forest);
        }
        .pdot.is-done {
          color: var(--forest);
          border-left-color: var(--forest);
        }
        .pdot__no {
          font-family: var(--font-mono), monospace;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          width: 1.6em;
          display: inline-flex;
          justify-content: center;
        }
        .pdot__label {
          font-size: 0.95rem;
          font-weight: 500;
        }
        .form__panel {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: clamp(1.5rem, 3.5vw, 2.75rem);
          box-shadow: 0 1px 0 rgba(22, 32, 27, 0.02),
            0 24px 60px -40px rgba(22, 32, 27, 0.35);
        }
        .form__sublabel {
          color: var(--ink-soft);
          margin: -0.4rem 0 1.4rem;
        }
        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-bottom: 1.6rem;
        }
        .chip {
          font: inherit;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.6em 1.05em;
          border-radius: 999px;
          border: 1px solid var(--line-strong);
          background: var(--paper);
          color: var(--ink-soft);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .chip:hover {
          border-color: var(--forest);
          color: var(--ink);
        }
        .chip.is-on {
          background: var(--forest);
          border-color: var(--forest);
          color: var(--paper);
        }
        .form__error {
          margin-top: 1.2rem;
          color: #a8421f;
          font-weight: 500;
          font-size: 0.95rem;
        }
        .form__actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          gap: 1rem;
        }
        .form__success {
          text-align: center;
          max-width: 640px;
          margin-inline: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
        }
        .form__success-head {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          letter-spacing: -0.02em;
        }
        @media (max-width: 760px) {
          .form__shell {
            grid-template-columns: 1fr;
          }
          .form__progress {
            position: static;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.4rem 1rem;
            margin-bottom: 0.5rem;
          }
          .pdot {
            border-left: none;
            border-top: 2px solid var(--line);
            padding: 0.5rem 0 0;
          }
          .pdot.is-active {
            border-top-color: var(--forest);
          }
          .pdot.is-done {
            border-top-color: var(--forest);
          }
          .pdot__label {
            display: none;
          }
          .pdot.is-active .pdot__label {
            display: inline;
          }
          .grid2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fieldset">
      <div className="fieldset__head">
        <h3 className="display fieldset__legend">{legend}</h3>
        <span className="fieldset__hint">{hint}</span>
      </div>
      {children}
      <style jsx>{`
        .fieldset__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.6rem;
        }
        .fieldset__legend {
          font-size: clamp(1.4rem, 2.6vw, 1.9rem);
          letter-spacing: -0.02em;
        }
        .fieldset__hint {
          font-family: var(--font-mono), monospace;
          font-size: 0.74rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--stone);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && <span className="field__req"> *</span>}
        {hint && <span className="field__hint"> — {hint}</span>}
      </span>
      {children}
      <style jsx>{`
        .field {
          display: block;
          margin-bottom: 1.1rem;
        }
        .field__label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-bottom: 0.45rem;
          color: var(--ink);
        }
        .field__req {
          color: var(--forest);
        }
        .field__hint {
          font-weight: 400;
          color: var(--stone);
          text-transform: none;
          letter-spacing: 0;
        }
      `}</style>
    </label>
  );
}
