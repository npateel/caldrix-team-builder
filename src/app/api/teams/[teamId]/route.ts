import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getRoster } from "@/lib/team-roster";
import { getOrCreateUserId } from "@/lib/user";

type Params = { params: Promise<{ teamId: string }> };

async function getOwnedTeam(teamId: string, userId: string) {
  const [team] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .limit(1);
  return team;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const userId = await getOrCreateUserId();

  const team = await getOwnedTeam(teamId, userId);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  return NextResponse.json({ ...team, roster: await getRoster(teamId) });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const userId = await getOrCreateUserId();
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const [team] = await db
    .update(teams)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .returning();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  return NextResponse.json({ ...team, roster: await getRoster(teamId) });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const userId = await getOrCreateUserId();

  const [team] = await db
    .delete(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .returning({ id: teams.id });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
