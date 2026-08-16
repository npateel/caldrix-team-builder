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

export type RosterRow = { teamId: string; pokemonId: number; position: number; addedAt: Date };

// The rows a roster PUT should write: each pokemonId keeps the addedAt it
// already had (reorders and add/remove of *other* slots shouldn't reset
// it -- see adr-008), and only a genuinely new pokemonId gets `now`.
export function buildRosterRows(
  teamId: string,
  pokemonIds: number[],
  existing: { pokemonId: number; addedAt: Date }[],
  now: Date,
): RosterRow[] {
  const addedAtByPokemonId = new Map(existing.map((row) => [row.pokemonId, row.addedAt]));
  return pokemonIds.map((pokemonId, position) => ({
    teamId,
    pokemonId,
    position,
    addedAt: addedAtByPokemonId.get(pokemonId) ?? now,
  }));
}
