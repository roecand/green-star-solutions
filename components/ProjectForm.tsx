"use client";

import { useRef, useState } from "react";
import StarMark from "./StarMark";
import { NETLIFY_FORM_NAME } from "@/lib/config";

const INDUSTRIES = [
  "Medical / dental practice",
  "Med spa & aesthetics",
  "Law firm",
  "Chiropractic / clinic",
  "Contractor / trades",
  "Other professional service",
];

const GOALS = [
  "More booked appointments",
  "Look more credible & premium",
  "Stop missing calls & leads",
  "Run Google / Meta ads",
  "Replace an old website",
  "Not sure yet — help me figure it out",
];

const STYLES = [
  { id: "modern", name: "Modern / Minimal", note: "Clean, spacious, restrained." },
  { id: "editorial", name: "Bold / Editorial", note: "Big type, strong point of view." },
  { id: "classic", name: "Classic / Trustworthy", note: "Established, credible, calm." },
  { id: "warm", name: "Warm / Approachable", note: "Friendly, human, inviting." },
];

const BUDGETS = ["Under $5k", "$5k – $10k", "$10k – $20k", "$20k+", "Not sure yet"];
const TIMELINES = ["As soon as possible", "Next 1–3 months", "Just exploring"];

const STEPS = ["Business", "Goals", "Style", "Assets", "Contact"];

type State = {
  business: string;
  industry: string;
  location: string;
  currentSite: string;
  goals: string[];
  goalNote: string;
  style: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  timeline: string;
};

const initial: State = {
  business: "",
  industry: "",
  location: "",
  currentSite: "",
  goals: [],
  goalNote: "",
  style: "",
  name: "",
  email: "",
  phone: "",
  budget: "",
  timeline: "",
};

export default function ProjectForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<State>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (s === 0 && !data.business.trim()) return "Add your business name to continue.";
    if (s === 4) {
      if (!data.name.trim()) return "We need a name to know who we’re talking to.";
      if (!validEmail(data.email)) return "Add a valid email so we can reply.";
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

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 12));
  }

  async function submit() {
    const err = validate(4);
    if (err) return setError(err);
    setStatus("sending");
    setError("");

    const fd = new FormData();
    fd.append("form-name", NETLIFY_FORM_NAME);
    fd.append("business", data.business);
    fd.append("industry", data.industry);
    fd.append("location", data.location);
    fd.append("current_site", data.currentSite);
    fd.append("goals", data.goals.join(", "));
    fd.append("goal_notes", data.goalNote);
    fd.append("style", data.style);
    fd.append("name", data.name);
    fd.append("email", data.email);
    fd.append("phone", data.phone);
    fd.append("budget", data.budget);
    fd.append("timeline", data.timeline);
    files.forEach((file) => fd.append("uploads", file, file.name));

    try {
      // Netlify intercepts same-origin POSTs that carry a matching form-name.
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
              Got it. We’re reading every word.
            </h2>
            <p className="lead measure-wide" style={{ marginInline: "auto" }}>
              Thanks, {data.name.split(" ")[0] || "there"}. We’ll review what you
              sent and reply personally within one business day — with a straight
              read on whether we’re the right fit and what it would take.
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
            <StarMark size={14} /> Book a working session
          </p>
          <h2 className="display h-lg">
            Tell us about the business.
          </h2>
          <p className="lead measure-wide">
            Five short steps. No obligation — at the end you’ll get a candid read
            on what’s capping growth and what it would take to fix it, not a hard
            sell.
          </p>
        </div>

        <div className="form__shell">
          {/* progress */}
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
            {/* STEP 0 — business basics */}
            {step === 0 && (
              <Fieldset legend="The basics" hint="Step 1 of 5">
                <Field label="Business name" required>
                  <input
                    autoFocus
                    value={data.business}
                    onChange={(e) => set("business", e.target.value)}
                    placeholder="e.g. Desert Sky Dental"
                  />
                </Field>
                <div className="grid2">
                  <Field label="Industry">
                    <div className="select">
                      <select
                        value={data.industry}
                        onChange={(e) => set("industry", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {INDUSTRIES.map((i) => (
                          <option key={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Location">
                    <input
                      value={data.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="Las Vegas, NV"
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
              <Fieldset legend="What should this do?" hint="Step 2 of 5">
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
                    placeholder="What does winning look like in 6 months?"
                  />
                </Field>
              </Fieldset>
            )}

            {/* STEP 2 — style */}
            {step === 2 && (
              <Fieldset legend="Which direction feels like you?" hint="Step 3 of 5">
                <p className="form__sublabel">
                  No wrong answer — it just gives us a starting point.
                </p>
                <div className="styles">
                  {STYLES.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={`stylecard ${data.style === s.name ? "is-on" : ""}`}
                      onClick={() => set("style", s.name)}
                      aria-pressed={data.style === s.name}
                    >
                      <span className={`styleprev styleprev--${s.id}`}>
                        <i />
                        <i />
                        <i />
                      </span>
                      <span className="stylecard__name">{s.name}</span>
                      <span className="stylecard__note">{s.note}</span>
                    </button>
                  ))}
                </div>
              </Fieldset>
            )}

            {/* STEP 3 — assets */}
            {step === 3 && (
              <Fieldset legend="Send over anything you have" hint="Step 4 of 5">
                <p className="form__sublabel">
                  Logo, photos, brand colors, existing copy — whatever exists.
                  Don’t have it yet? Skip this.
                </p>
                <div
                  className={`drop ${dragging ? "is-drag" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                  }}
                  onClick={() => inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                  }}
                >
                  <StarMark size={22} />
                  <p className="drop__title">
                    Drag files here, or <span className="accent">browse</span>
                  </p>
                  <p className="drop__hint">Up to 12 files · images, PDF, docs</p>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </div>

                {files.length > 0 && (
                  <ul className="filelist">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`}>
                        <span className="filelist__name">{f.name}</span>
                        <span className="filelist__size">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${f.name}`}
                          onClick={() =>
                            setFiles((arr) => arr.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Fieldset>
            )}

            {/* STEP 4 — contact */}
            {step === 4 && (
              <Fieldset legend="Where do we reach you?" hint="Step 5 of 5">
                <div className="grid2">
                  <Field label="Your name" required>
                    <input
                      autoFocus
                      value={data.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="First and last"
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@business.com"
                      inputMode="email"
                    />
                  </Field>
                </div>
                <Field label="Phone" hint="optional">
                  <input
                    value={data.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(702) 555-0142"
                    inputMode="tel"
                  />
                </Field>
                <div className="grid2">
                  <Field label="Budget">
                    <div className="select">
                      <select
                        value={data.budget}
                        onChange={(e) => set("budget", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {BUDGETS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Timeline">
                    <div className="select">
                      <select
                        value={data.timeline}
                        onChange={(e) => set("timeline", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {TIMELINES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                </div>
              </Fieldset>
            )}

            {error && <p className="form__error" role="alert">{error}</p>}
            {status === "error" && (
              <p className="form__error" role="alert">
                Something went wrong sending that. Email us directly and we’ll
                sort it out.
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
                  {status === "sending" ? "Sending…" : "Send project brief"}
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
          grid-template-columns: 220px 1fr;
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
        .styles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .stylecard {
          font: inherit;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          padding: 1rem;
          border-radius: 14px;
          border: 1px solid var(--line-strong);
          background: var(--paper);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .stylecard:hover {
          border-color: var(--forest);
          transform: translateY(-2px);
        }
        .stylecard.is-on {
          border-color: var(--forest);
          box-shadow: inset 0 0 0 1px var(--forest);
        }
        .styleprev {
          height: 64px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          overflow: hidden;
        }
        .styleprev i {
          display: block;
          height: 6px;
          border-radius: 3px;
          background: currentColor;
          opacity: 0.85;
        }
        .styleprev--modern {
          background: #f4f4f2;
          color: #2b2b2b;
        }
        .styleprev--modern i:nth-child(1) { width: 40%; height: 4px; }
        .styleprev--modern i:nth-child(2) { width: 22%; opacity: 0.4; }
        .styleprev--modern i:nth-child(3) { width: 14%; opacity: 0.25; }
        .styleprev--editorial {
          background: #161616;
          color: #f5f3ee;
        }
        .styleprev--editorial i:nth-child(1) { width: 78%; height: 13px; }
        .styleprev--editorial i:nth-child(2) { width: 35%; height: 4px; opacity: 0.5; }
        .styleprev--editorial i:nth-child(3) { display: none; }
        .styleprev--classic {
          background: #f3f1ea;
          color: #1b2a44;
          align-items: center;
        }
        .styleprev--classic i:nth-child(1) { width: 55%; height: 5px; }
        .styleprev--classic i:nth-child(2) { width: 30%; height: 5px; }
        .styleprev--classic i:nth-child(3) { width: 18%; height: 3px; opacity: 0.4; }
        .styleprev--warm {
          background: #fbe9dc;
          color: #c2603a;
        }
        .styleprev--warm i { border-radius: 999px; }
        .styleprev--warm i:nth-child(1) { width: 60%; height: 8px; }
        .styleprev--warm i:nth-child(2) { width: 44%; height: 8px; opacity: 0.6; }
        .styleprev--warm i:nth-child(3) { width: 30%; height: 8px; opacity: 0.35; }
        .stylecard__name {
          font-weight: 600;
          font-size: 0.98rem;
        }
        .stylecard__note {
          font-size: 0.85rem;
          color: var(--stone);
          margin-top: -0.3rem;
        }
        .drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
          padding: 2.5rem 1.5rem;
          border: 1.5px dashed var(--line-strong);
          border-radius: 14px;
          background: var(--paper);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .drop:hover,
        .drop.is-drag {
          border-color: var(--forest);
          background: color-mix(in srgb, var(--forest) 5%, var(--paper));
        }
        .drop__title {
          font-weight: 600;
          margin-top: 0.3rem;
        }
        .drop__hint {
          font-size: 0.85rem;
          color: var(--stone);
        }
        .filelist {
          list-style: none;
          margin: 1.1rem 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .filelist li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.85rem;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 10px;
          font-size: 0.9rem;
        }
        .filelist__name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .filelist__size {
          color: var(--stone);
          font-variant-numeric: tabular-nums;
        }
        .filelist li button {
          border: none;
          background: none;
          font-size: 1.3rem;
          line-height: 1;
          color: var(--stone);
          cursor: pointer;
          padding: 0 0.2rem;
        }
        .filelist li button:hover {
          color: var(--ink);
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
          .grid2,
          .styles {
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
