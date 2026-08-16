import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { pokemon, teamPokemon } from "@/db/schema";
import { groupBy } from "@/lib/group-by";

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

  const byTeam = groupBy(rows, (row) => row.teamId);
  return new Map(
    [...byTeam].map(([teamId, teamRows]) => [
      teamId,
      teamRows.map((row) => ({ position: row.position, pokemon: row.pokemon })),
    ]),
  );
}

export async function getRoster(teamId: string): Promise<RosterEntry[]> {
  return (await getRosters([teamId])).get(teamId) ?? [];
}

// The distinct set of pokemon ids currently on *any* team -- shared by
// scan-changes.ts and reseed.ts, both of which scope their change
// detection to exactly this set (see adr-006/adr-008), so the definition
// of "team-scoped pokemon" can't drift between the two jobs.
export async function getTeamPokemonIds(): Promise<number[]> {
  const rows = await db.selectDistinct({ id: teamPokemon.pokemonId }).from(teamPokemon);
  return rows.map((row) => row.id);
}

export type RosterRow = { teamId: string; pokemonId: number; position: number; addedAt: Date };

// The rows a roster PUT should write: every pokemonId in the new list gets
// `now` as its addedAt, including ones that were already on the roster --
// a PUT always rewrites the whole roster (see the route's delete +
// reinsert), so addedAt tracks "last time this roster was saved with this
// pokemon on it," not "the first time this pokemon ever joined." See
// adr-008 for how that's used to scope Task 2's change alerts.
export function buildRosterRows(teamId: string, pokemonIds: number[], now: Date): RosterRow[] {
  return pokemonIds.map((pokemonId, position) => ({
    teamId,
    pokemonId,
    position,
    addedAt: now,
  }));
}
