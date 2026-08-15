import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { requireAdminUserId } from "@/lib/admin";

type Params = { params: Promise<{ id: string }> };

// Admin-scoped delete -- unlike /api/teams/[teamId], this doesn't check
// ownership, only admin-ness (see adr-006).
export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await requireAdminUserId())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;
  const [deleted] = await db.delete(teams).where(eq(teams.id, id)).returning({ id: teams.id });
  if (!deleted) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
