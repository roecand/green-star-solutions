"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-danger">
        Something went wrong
      </p>
      <h1 className="mt-2 text-3xl font-bold">That wasn&apos;t supposed to happen</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        The error has been logged. Try again — and if it keeps happening,
        email hello@greenstarsolutions.com.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClasses("outline", "md")}>
          Back home
        </Link>
      </div>
    </main>
  );
}
