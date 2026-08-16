import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { changes, pokemon, teamPokemon, teams } from "@/db/schema";

const ALERT_WINDOW_DAYS = 7;

export type TeamChangeAlert = {
  id: string;
  teamId: string;
  teamName: string;
  pokemonId: number;
  pokemonName: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: Date;
};

// Task 2's user-facing alert requirement: pokemon-entity changes detected
// in the last 7 days, scoped to whichever of the user's own teams
// currently have that pokemon on the roster, grouped by team (mirrors
// getRosters' shape) so each team's card can show only its own changes.
// One row per (change, team) pair before grouping -- if the same pokemon
// sits on two of the user's teams, that change is relevant to both.
//
// Also requires the change to have happened *after* team_pokemon.addedAt
// for that specific team -- otherwise adding a pokemon someone else
// changed last week onto a brand-new team would surface an alert for a
// change the user never actually saw happen on their own roster.
export async function getRecentTeamChanges(userId: string): Promise<Map<string, TeamChangeAlert[]>> {
  const since = new Date(Date.now() - ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: changes.id,
      teamId: teams.id,
      teamName: teams.name,
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

  const byTeam = new Map<string, TeamChangeAlert[]>();
  for (const row of rows) {
    const existing = byTeam.get(row.teamId);
    if (existing) existing.push(row);
    else byTeam.set(row.teamId, [row]);
  }
  return byTeam;
}
