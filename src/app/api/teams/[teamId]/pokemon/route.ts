import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teamPokemon, teams } from "@/db/schema";
import { getRoster } from "@/lib/team-roster";
import { getOrCreateUserId } from "@/lib/user";

const MAX_TEAM_SIZE = 6;

type Params = { params: Promise<{ teamId: string }> };

// Replaces the team's full roster in one call rather than exposing separate
// add/remove/reorder endpoints -- the client sends the desired ordered list
// of pokemon ids and this makes it so in one transaction.
export async function PUT(request: NextRequest, { params }: Params) {
  const { teamId } = await params;
  const userId = await getOrCreateUserId();

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .limit(1);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const pokemonIds = body?.pokemonIds;
  if (
    !Array.isArray(pokemonIds) ||
    pokemonIds.length > MAX_TEAM_SIZE ||
    !pokemonIds.every((id) => Number.isInteger(id))
  ) {
    return NextResponse.json(
      { error: `pokemonIds must be an array of up to ${MAX_TEAM_SIZE} pokemon ids` },
      { status: 400 },
    );
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(teamPokemon).where(eq(teamPokemon.teamId, teamId));
      if (pokemonIds.length > 0) {
        await tx.insert(teamPokemon).values(
          pokemonIds.map((pokemonId: number, index: number) => ({
            teamId,
            pokemonId,
            position: index,
          })),
        );
      }
      await tx.update(teams).set({ updatedAt: new Date() }).where(eq(teams.id, teamId));
    });
  } catch {
    return NextResponse.json({ error: "One or more pokemonIds do not exist" }, { status: 400 });
  }

  return NextResponse.json({ teamId, roster: await getRoster(teamId) });
}
