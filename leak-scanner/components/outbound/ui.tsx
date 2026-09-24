import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { runTickAction } from "@/app/outbound/actions";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger" | "muted"> = {
  NEW: "muted",
  QUEUED: "warning",
  ANALYZING: "warning",
  ANALYSIS_FAILED: "danger",
  READY: "default",
  DISQUALIFIED: "muted",
  ACTIVE_SEQUENCE: "warning",
  REPLIED: "warning",
  INTERESTED: "success",
  NOT_INTERESTED: "muted",
  DO_NOT_CONTACT: "danger",
  BOUNCED: "danger",
  BOOKED: "success",
  CUSTOMER: "success",
  // campaign / campaign-lead / message / reply statuses
  DRAFT: "muted",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "muted",
  PENDING_DRAFT: "warning",
  DRAFTED: "warning",
  APPROVED: "default",
  STOPPED: "muted",
  FAILED: "danger",
  SENDING: "warning",
  SENT: "success",
  QUEUED_AT_PROVIDER: "default",
  CANCELLED: "muted",
  QUESTION: "warning",
  NOT_NOW: "warning",
  OUT_OF_OFFICE: "muted",
  UNKNOWN: "muted",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "muted"}>{status.replace(/_/g, " ").toLowerCase()}</Badge>;
}

export function Notice({ notice, tone }: { notice?: string; tone?: string }) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className={cn(
        "mb-6 rounded-lg border px-4 py-3 text-sm",
        tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-border bg-accent text-primary-strong"
      )}
    >
      {notice}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function RunNowButton({ returnTo }: { returnTo: string }) {
  return (
    <form action={runTickAction}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-strong">
        Run now
      </button>
    </form>
  );
}

export function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-primary underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}

export function fmtDateTime(value: Date | number | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";
export const inputClass =
  "h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";
export const buttonClass =
  "inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted disabled:opacity-50";
export const primaryButtonClass =
  "inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-strong";
