"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UpgradeButton({
  plan,
  label,
  variant = "primary",
}: {
  plan: "starter" | "growth" | "pro";
  label: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <Button
        variant={variant}
        className="w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (data.redirect) {
              if (data.redirect.startsWith("/")) router.push(data.redirect);
              else window.location.href = data.redirect;
              return;
            }
            setError(data.error ?? "Checkout failed.");
          } catch {
            setError("Network error — please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "One moment…" : label}
      </Button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function PortalButton() {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          setError(null);
          const res = await fetch("/api/billing/portal", { method: "POST" });
          const data = await res.json();
          if (data.redirect) window.location.href = data.redirect;
          else setError(data.error ?? "Portal unavailable.");
        }}
      >
        Manage subscription
      </Button>
      {error && <p className="mt-2 text-xs text-muted-foreground">{error}</p>}
    </div>
  );
}
