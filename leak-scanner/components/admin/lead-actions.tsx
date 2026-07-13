"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { LEAD_LIFECYCLE_STATUSES } from "@/lib/db/schema";

export function LeadActions({
  leadId,
  currentStatus,
  isOutreachTarget,
  outreachEmailOpener,
  reportUrl,
}: {
  leadId: string;
  currentStatus: string;
  isOutreachTarget: boolean;
  outreachEmailOpener: string;
  reportUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function update(payload: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Update failed.");
        return;
      }
      setMessage(successMessage);
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`${label} copied to clipboard.`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Status</h2>
        <div className="mt-3 flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {LEAD_LIFECYCLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Button
            disabled={busy || status === currentStatus}
            onClick={() => update({ lifecycleStatus: status }, "Status updated.")}
          >
            Save
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Outreach tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For the manual outreach workflow: scan → short opener → report link → call.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              update(
                { isOutreachTarget: !isOutreachTarget },
                isOutreachTarget ? "Removed from outreach targets." : "Marked as outreach target."
              )
            }
          >
            {isOutreachTarget ? "🎯 Remove outreach target" : "🎯 Mark outreach target"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(outreachEmailOpener, "Email opener")}
          >
            Copy email opener
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(reportUrl, "Report link")}
          >
            Copy report link
          </Button>
        </div>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          {outreachEmailOpener}
        </pre>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Add note</h2>
        <Textarea
          className="mt-3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Called and left voicemail…"
        />
        <Button
          className="mt-2"
          size="sm"
          disabled={busy || !note.trim()}
          onClick={async () => {
            await update({ note: note.trim() }, "Note added.");
            setNote("");
          }}
        >
          Save note
        </Button>
      </section>

      {message && <p className="text-sm text-primary-strong">{message}</p>}
    </div>
  );
}
