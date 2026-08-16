import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { generateCounterTeam } from "@/lib/counter-team";
import { getAllPokemon } from "@/server/pokemon-catalog";
import { getRoster } from "@/server/team-roster";
import { getOrCreateUserId } from "@/server/user";

type Params = { params: Promise<{ teamId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const userId = await getOrCreateUserId();

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .limit(1);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const roster = await getRoster(teamId);
  if (roster.length === 0) {
    return NextResponse.json({ error: "Team has no pokemon to counter" }, { status: 400 });
  }

  // Whole cached pokemon table as the candidate pool -- fine at this scale
  // (~1300 rows), reconsider if that ever changes.
  const candidatePool = await getAllPokemon();
  const counterTeam = generateCounterTeam(roster, candidatePool);

  return NextResponse.json({ teamId, counterTeam });
}
