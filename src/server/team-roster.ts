import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { pokemon, teamPokemon } from "@/db/schema";

export type RosterEntry = {
  position: number;
  pokemon: typeof pokemon.$inferSelect;
};

// Fetches ordered rosters for multiple teams in one query and groups them by
// team id, rather than one query per team.
export async function getRosters(teamIds: string[]): Promise<Map<string, RosterEntry[]>> {
  if (teamIds.length === 0) return new Map();

  const rows = await db
    .select({ teamId: teamPokemon.teamId, position: teamPokemon.position, pokemon })
    .from(teamPokemon)
    .innerJoin(pokemon, eq(teamPokemon.pokemonId, pokemon.id))
    .where(inArray(teamPokemon.teamId, teamIds))
    .orderBy(asc(teamPokemon.position));

  const byTeam = new Map<string, RosterEntry[]>();
  for (const row of rows) {
    const entry = { position: row.position, pokemon: row.pokemon };
    const existing = byTeam.get(row.teamId);
    if (existing) existing.push(entry);
    else byTeam.set(row.teamId, [entry]);
  }
  return byTeam;
}

export async function getRoster(teamId: string): Promise<RosterEntry[]> {
  return (await getRosters([teamId])).get(teamId) ?? [];
}
