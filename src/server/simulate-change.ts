import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pokemon, teamPokemon, teams } from "@/db/schema";

export type SimulatedDrift = {
  pokemonId: number;
  pokemonName: string;
  field: "attack";
  oldValue: number;
  newValue: number;
};

// Demo-only aid for Task 2: real PokéAPI data rarely changes day to day,
// so this desyncs one of the admin's own team pokemon's cached `attack`
// to give the (otherwise untouched) scan job a real discrepancy to find
// on demand. Scoped to the admin's own teams so the resulting alert shows
// up on their own home page.
export async function simulateStatDrift(userId: string): Promise<SimulatedDrift | null> {
  const [row] = await db
    .select({ id: pokemon.id, name: pokemon.name, attack: pokemon.attack })
    .from(teamPokemon)
    .innerJoin(teams, eq(teamPokemon.teamId, teams.id))
    .innerJoin(pokemon, eq(teamPokemon.pokemonId, pokemon.id))
    .where(eq(teams.userId, userId))
    .orderBy(sql`random()`)
    .limit(1);
  if (!row) return null;

  const newValue = row.attack + 5;
  await db.update(pokemon).set({ attack: newValue }).where(eq(pokemon.id, row.id));

  return { pokemonId: row.id, pokemonName: row.name, field: "attack", oldValue: row.attack, newValue };
}
