import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
