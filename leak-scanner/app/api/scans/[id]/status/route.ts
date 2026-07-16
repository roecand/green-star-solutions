import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = await db
    .select({
      id: schema.scans.id,
      status: schema.scans.status,
      progressStage: schema.scans.progressStage,
      shareToken: schema.scans.shareToken,
      errorMessage: schema.scans.errorMessage,
      revenueLeakScore: schema.scans.revenueLeakScore,
    })
    .from(schema.scans)
    .where(eq(schema.scans.id, id))
    .get();

  if (!scan) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }
  return NextResponse.json(scan);
}
