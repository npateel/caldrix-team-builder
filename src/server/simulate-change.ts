import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pokemon, teamPokemon, teams, typeEnum } from "@/db/schema";

export type SimulatedDrift = {
  pokemonId: number;
  pokemonName: string;
  field: string;
  oldValue: string;
  newValue: string;
};

const STAT_FIELDS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
type StatField = (typeof STAT_FIELDS)[number];

// Demo-only aid for Task 2: real PokéAPI data rarely changes day to day,
// so this desyncs one of the admin's own team pokemon's cached data (a
// random stat, or its type list) to give the (otherwise untouched) scan
// job a real discrepancy to find on demand. Scoped to the admin's own
// teams so the resulting alert shows up on their own home page.
export async function simulateStatDrift(userId: string): Promise<SimulatedDrift | null> {
  const [row] = await db
    .select({
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types,
      hp: pokemon.hp,
      attack: pokemon.attack,
      defense: pokemon.defense,
      specialAttack: pokemon.specialAttack,
      specialDefense: pokemon.specialDefense,
      speed: pokemon.speed,
    })
    .from(teamPokemon)
    .innerJoin(teams, eq(teamPokemon.teamId, teams.id))
    .innerJoin(pokemon, eq(teamPokemon.pokemonId, pokemon.id))
    .where(eq(teams.userId, userId))
    .orderBy(sql`random()`)
    .limit(1);
  if (!row) return null;

  const fieldPool: (StatField | "types")[] = [...STAT_FIELDS, "types"];
  const field = fieldPool[Math.floor(Math.random() * fieldPool.length)];

  if (field === "types") {
    const oldTypes = row.types;
    const otherOptions = typeEnum.enumValues.filter((t) => !oldTypes.includes(t));
    const swapIndex = Math.floor(Math.random() * oldTypes.length);
    const newType = otherOptions[Math.floor(Math.random() * otherOptions.length)];
    const newTypes = oldTypes.map((t, i) => (i === swapIndex ? newType : t));

    await db.update(pokemon).set({ types: newTypes }).where(eq(pokemon.id, row.id));

    return {
      pokemonId: row.id,
      pokemonName: row.name,
      field: "types",
      oldValue: oldTypes.join(","),
      newValue: newTypes.join(","),
    };
  }

  const oldValue = row[field] as number;
  const newValue = oldValue + 5;
  await db.update(pokemon).set({ [field]: newValue }).where(eq(pokemon.id, row.id));

  return {
    pokemonId: row.id,
    pokemonName: row.name,
    field,
    oldValue: String(oldValue),
    newValue: String(newValue),
  };
}
