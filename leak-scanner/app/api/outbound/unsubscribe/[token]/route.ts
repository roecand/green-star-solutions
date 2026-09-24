import { NextResponse } from "next/server";
import { dbReady } from "@/lib/db";
import { unsubscribeByToken } from "@/lib/outbound/replies/unsubscribe";

/** RFC 8058 one-click unsubscribe (mail clients POST here directly). */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await dbReady();
  await unsubscribeByToken(token, "one-click header");
  // Always 200 — never reveal whether a token exists.
  return NextResponse.json({ ok: true });
}

/** Humans who open the header URL land on the confirmation page. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return NextResponse.redirect(new URL(`/u/${token}`, request.url));
}
