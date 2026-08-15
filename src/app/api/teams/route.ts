import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getRosters } from "@/lib/team-roster";
import { getOrCreateUserId } from "@/lib/user";

export async function GET() {
  const userId = await getOrCreateUserId();
  const userTeams = await db.select().from(teams).where(eq(teams.userId, userId)).orderBy(asc(teams.createdAt));
  const rosters = await getRosters(userTeams.map((team) => team.id));

  return NextResponse.json(userTeams.map((team) => ({ ...team, roster: rosters.get(team.id) ?? [] })));
}

export async function POST(request: NextRequest) {
  const userId = await getOrCreateUserId();
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const [team] = await db.insert(teams).values({ userId, name }).returning();
  return NextResponse.json({ ...team, roster: [] }, { status: 201 });
}
