"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CUSTOMER_VALUE_QUESTION } from "@/lib/scoring/intake";

const INDUSTRIES = [
  "HVAC",
  "Plumbing",
  "Roofing",
  "Electrical",
  "Landscaping",
  "Auto Repair",
  "Med Spa",
  "Dental",
  "Chiropractic",
  "Law Firm",
  "Real Estate",
  "Cleaning Services",
  "Pest Control",
  "Restaurant",
  "Salon / Barber",
  "Fitness / Gym",
  "Home Remodeling",
  "Painting",
  "Moving Company",
  "Other",
];

const SCAN_STAGES = [
  "Reading website",
  "Checking conversion signals",
  "Checking local visibility",
  "Checking AI-readiness",
  "Checking trust signals",
  "Building action plan",
];

const STAGE_COPY: Record<string, string> = {
  "Reading website": "Fetching your public pages the way a first-time visitor (or an AI system) sees them.",
  "Checking conversion signals": "Looking for the things that turn visitors into calls: CTAs, phone visibility, forms.",
  "Checking local visibility": "Checking whether your site clearly says where you work and who you serve.",
  "Checking AI-readiness": "Checking whether answer engines have enough clear information to understand you.",
  "Checking trust signals": "Looking for reviews, proof, credentials — the things skeptical buyers need.",
  "Building action plan": "Turning the findings into a prioritized fix roadmap.",
};

interface FormState {
  hasWebsite: "yes" | "no";
  websiteUrl: string;
  businessName: string;
  industry: string;
  city: string;
  state: string;
  customerValue: string;
  contactName: string;
  email: string;
}

const TOTAL_STEPS = 3;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function ScannerForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    hasWebsite: "yes",
    websiteUrl: "",
    businessName: "",
    industry: "",
    city: "",
    state: "",
    customerValue: "",
    contactName: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState<string>(SCAN_STAGES[0]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sourceRef = useRef<string | null>(null);

  useEffect(() => {
    // Capture marketing attribution once on mount (utm_source or ?src=).
    try {
      const params = new URLSearchParams(window.location.search);
      sourceRef.current =
        params.get("utm_source") || params.get("src") || params.get("source") || null;
    } catch {
      sourceRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function validateStep(): string | null {
    if (step === 0) {
      if (form.hasWebsite === "yes" && !form.websiteUrl.trim())
        return "Enter your website address, or choose “I don't have a website yet.”";
      if (!form.businessName.trim()) return "What's your business called?";
    }
    if (step === 1) {
      if (!form.industry) return "Pick the closest industry so we score you fairly.";
      if (!form.customerValue)
        return "Pick a rough customer value — it turns your report into dollars. ('Not sure' is fine.)";
    }
    if (step === 2) {
      if (!form.contactName.trim()) return "Your name lets us personalize your fix plan.";
      if (!EMAIL_RE.test(form.email.trim()))
        return "Enter the email where we should send your report.";
    }
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setScanning(true);
    setStage(SCAN_STAGES[0]);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName.trim(),
          hasWebsite: form.hasWebsite === "yes",
          websiteUrl: form.hasWebsite === "yes" ? form.websiteUrl.trim() : undefined,
          industry: form.industry,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          customerValue: form.customerValue || undefined,
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          source: sourceRef.current || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanning(false);
        setError(data.error ?? "Something went wrong starting the scan.");
        return;
      }

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/scans/${data.scanId}/status`);
          const status = await statusRes.json();
          if (status.progressStage) setStage(status.progressStage);
          if (status.status === "completed") {
            if (pollRef.current) clearInterval(pollRef.current);
            router.push(`/report/${data.shareToken}`);
          } else if (status.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setScanning(false);
            setError(status.errorMessage ?? "The scan failed. Please check the URL and try again.");
          }
        } catch {
          // transient poll errors are fine; keep polling
        }
      }, 1500);
    } catch {
      setScanning(false);
      setError("Network error. Please try again.");
    }
  }

  if (scanning && form.hasWebsite === "no") {
    return (
      <Card className="w-full max-w-xl">
        <CardContent className="p-8 text-center">
          <h2 className="text-lg font-semibold">Building your report…</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mapping the opportunity for {form.businessName || "your business"} —
            this only takes a few seconds.
          </p>
          <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-1.5 w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanning) {
    const activeIndex = Math.max(0, SCAN_STAGES.indexOf(stage));
    return (
      <Card className="w-full max-w-xl">
        <CardContent className="p-8">
          <h2 className="text-lg font-semibold">Scanning your revenue leaks…</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.websiteUrl.replace(/^https?:\/\//, "")}
          </p>
          <ol className="mt-6 space-y-3">
            {SCAN_STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    i < activeIndex
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white"
                      : i === activeIndex
                        ? "flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary text-xs text-primary-strong animate-pulse"
                        : "flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground"
                  }
                >
                  {i < activeIndex ? "✓" : i + 1}
                </span>
                <span className={i <= activeIndex ? "text-foreground" : "text-muted-foreground"}>
                  {s}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {STAGE_COPY[stage] ?? "Working…"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={
                i <= step ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-muted"
              }
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Let&apos;s find your leaks</h2>
              <p className="text-sm text-muted-foreground">Start with your online presence — this takes about a minute.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Do you have a website?</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Do you have a website?">
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.hasWebsite === "yes"}
                  onClick={() => setForm((f) => ({ ...f, hasWebsite: "yes" }))}
                  className={
                    form.hasWebsite === "yes"
                      ? "rounded-lg border-2 border-primary bg-accent/40 p-3 text-sm font-medium"
                      : "rounded-lg border border-border p-3 text-sm hover:bg-muted"
                  }
                >
                  Yes, scan my site
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.hasWebsite === "no"}
                  onClick={() => setForm((f) => ({ ...f, hasWebsite: "no" }))}
                  className={
                    form.hasWebsite === "no"
                      ? "rounded-lg border-2 border-primary bg-accent/40 p-3 text-sm font-medium"
                      : "rounded-lg border border-border p-3 text-sm hover:bg-muted"
                  }
                >
                  I don&apos;t have a website yet
                </button>
              </div>
            </div>
            {form.hasWebsite === "yes" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input id="websiteUrl" value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="yourbusiness.com" inputMode="url" autoFocus />
              </div>
            ) : (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                No problem — we&apos;ll show you exactly what having no website is
                costing you, and what claiming that opportunity looks like.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" value={form.businessName} onChange={set("businessName")} placeholder="Desert Air HVAC" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Where do you work?</h2>
              <p className="text-sm text-muted-foreground">We score local visibility against your actual market.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Select id="industry" value={form.industry} onChange={set("industry")}>
                <option value="">Choose your industry…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={set("city")} placeholder="Las Vegas" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state">State / region</Label>
                <Input id="state" value={form.state} onChange={set("state")} placeholder="NV" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{CUSTOMER_VALUE_QUESTION.question}</span>
              <p className="text-xs text-muted-foreground">
                One tap — it turns your report into dollars instead of scores.
              </p>
              <div
                className="mt-1 flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={CUSTOMER_VALUE_QUESTION.question}
              >
                {CUSTOMER_VALUE_QUESTION.options.map((o) => {
                  const selected = form.customerValue === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setForm((f) => ({ ...f, customerValue: o.value }))}
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
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Where should we send your report?</h2>
              <p className="text-sm text-muted-foreground">
                You&apos;ll see the report immediately — the email is your permanent link to it.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactName">Your name</Label>
              <Input id="contactName" value={form.contactName} onChange={set("contactName")} placeholder="Robert" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Business email</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@business.com" />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</div>
        )}

        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={back}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} size="lg">
              Continue
            </Button>
          ) : (
            <Button onClick={submit} size="lg">
              Scan my website
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
