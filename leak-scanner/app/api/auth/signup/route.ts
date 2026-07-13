import { NextResponse } from "next/server";
import { z } from "zod";
import { EmailTakenError, registerUser } from "@/lib/auth/register";
import { createSession } from "@/lib/auth/session";
import { trackEvent } from "@/lib/analytics/track";

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid email and a password of at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const user = registerUser(parsed.data);
    await createSession(user.id);
    trackEvent({ eventType: "signup", userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("signup failed", error);
    return NextResponse.json(
      { error: "Something went wrong creating your account." },
      { status: 500 }
    );
  }
}
