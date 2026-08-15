import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { changes, pokemon, teamPokemon } from "@/db/schema";
import { transformPokemon, type FreshPokemon } from "./pokeapi-transform";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

type PokemonRow = typeof pokemon.$inferSelect;

const SCALAR_FIELDS = [
  "name",
  "spriteUrl",
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
] as const;

type FieldDiff = { field: string; oldValue: string; newValue: string };

function diffPokemon(current: PokemonRow, fresh: FreshPokemon): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of SCALAR_FIELDS) {
    const oldValue = current[field];
    const newValue = fresh[field];
    if (oldValue !== newValue) {
      diffs.push({ field, oldValue: String(oldValue), newValue: String(newValue) });
    }
  }
  const oldTypes = current.types.join(",");
  const newTypes = fresh.types.join(",");
  if (oldTypes !== newTypes) {
    diffs.push({ field: "types", oldValue: oldTypes, newValue: newTypes });
  }
  return diffs;
}

export type ScanResult = {
  checked: number;
  changed: number;
  changes: (FieldDiff & { pokemonId: number; name: string })[];
};

// Only refetches pokemon currently on at least one team, live from PokéAPI --
// not the whole ~1300-row cache. See adr-006 for why: this runs inside a
// request/cron-triggered serverless function, and Task 2 only cares about
// pokemon actually in use. The full cache is kept fresh separately by the
// bulk reseed job (src/lib/reseed.ts), which doesn't write to `changes`.
export async function scanForChanges(): Promise<ScanResult> {
  const teamPokemonIds = await db.selectDistinct({ id: teamPokemon.pokemonId }).from(teamPokemon);
  const result: ScanResult = { checked: 0, changed: 0, changes: [] };
  if (teamPokemonIds.length === 0) return result;

  const ids = teamPokemonIds.map((row) => row.id);
  const currentRows = await db.select().from(pokemon).where(inArray(pokemon.id, ids));
  const currentById = new Map(currentRows.map((row) => [row.id, row]));

  for (const id of ids) {
    const current = currentById.get(id);
    if (!current) continue;
    result.checked++;

    const res = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
    if (!res.ok) continue;
    const fresh = transformPokemon(await res.json());

    const diffs = diffPokemon(current, fresh);
    if (diffs.length === 0) continue;

    result.changed++;
    result.changes.push(...diffs.map((diff) => ({ pokemonId: id, name: fresh.name, ...diff })));

    await db.insert(changes).values(
      diffs.map((diff) => ({
        entityType: "pokemon" as const,
        entityId: id,
        field: diff.field,
        oldValue: diff.oldValue,
        newValue: diff.newValue,
      })),
    );
    await db
      .update(pokemon)
      .set({ ...fresh, lastFetchedAt: new Date() })
      .where(eq(pokemon.id, id));
  }

  return result;
}
