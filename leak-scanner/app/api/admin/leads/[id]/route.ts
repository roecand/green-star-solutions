import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { apiAdmin } from "@/lib/auth/guards";
import { LEAD_LIFECYCLE_STATUSES } from "@/lib/db/schema";

const updateSchema = z.object({
  lifecycleStatus: z.enum(LEAD_LIFECYCLE_STATUSES).optional(),
  isOutreachTarget: z.boolean().optional(),
  note: z.string().min(1).max(4000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await apiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }

  const lead = db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const { lifecycleStatus, isOutreachTarget, note } = parsed.data;
  if (lifecycleStatus !== undefined || isOutreachTarget !== undefined) {
    db.update(schema.leads)
      .set({
        ...(lifecycleStatus !== undefined ? { lifecycleStatus } : {}),
        ...(isOutreachTarget !== undefined ? { isOutreachTarget } : {}),
      })
      .where(eq(schema.leads.id, id))
      .run();
  }
  if (note) {
    db.insert(schema.adminNotes).values({ leadId: id, note }).run();
  }

  db.insert(schema.auditEvents)
    .values({
      actorUserId: admin.id,
      eventType: "lead_updated",
      entityType: "lead",
      entityId: id,
      payloadJson: JSON.stringify(parsed.data),
    })
    .run();

  return NextResponse.json({ ok: true });
}
