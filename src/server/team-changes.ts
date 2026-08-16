import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { changes, pokemon, teamPokemon, teams } from "@/db/schema";
import { groupBy } from "@/lib/group-by";

const ALERT_WINDOW_DAYS = 7;

export type TeamChangeAlert = {
  teamId: string;
  pokemonId: number;
  pokemonName: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: Date;
};

// Task 2's alert query: pokemon changes from the last 7 days on the
// user's own teams, grouped by team (mirrors getRosters' shape). Also
// requires the change to be after team_pokemon.addedAt, so adding a
// pokemon someone else's team had already seen change doesn't surface a
// stale alert the user never actually witnessed.
export async function getRecentTeamChanges(userId: string): Promise<Map<string, TeamChangeAlert[]>> {
  const since = new Date(Date.now() - ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      teamId: teams.id,
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      field: changes.field,
      oldValue: changes.oldValue,
      newValue: changes.newValue,
      detectedAt: changes.detectedAt,
    })
    .from(changes)
    .innerJoin(pokemon, eq(changes.entityId, pokemon.id))
    .innerJoin(teamPokemon, eq(teamPokemon.pokemonId, pokemon.id))
    .innerJoin(teams, eq(teamPokemon.teamId, teams.id))
    .where(
      and(
        eq(changes.entityType, "pokemon"),
        eq(teams.userId, userId),
        gte(changes.detectedAt, since),
        gte(changes.detectedAt, teamPokemon.addedAt),
      ),
    )
    .orderBy(desc(changes.detectedAt));

  return groupBy(rows, (row) => row.teamId);
}
