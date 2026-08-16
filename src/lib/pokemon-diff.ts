import type { pokemon } from "@/db/schema";
import type { FreshPokemon } from "./pokeapi-transform";

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

export type FieldDiff = { field: string; oldValue: string; newValue: string };

export type PokemonChangeRow = { entityType: "pokemon"; entityId: number } & FieldDiff;

// Shared by both jobs' `changes` inserts (reseed.ts, scan-changes.ts) so the
// row shape can't drift between them.
export function toChangeRows(entityId: number, diffs: FieldDiff[]): PokemonChangeRow[] {
  return diffs.map((diff) => ({ entityType: "pokemon" as const, entityId, ...diff }));
}

// Shared by both jobs that can discover a pokemon changed -- scan-changes.ts
// (team-scoped, live per-id fetches) and reseed.ts (whole-cache, already has
// fresh data in hand) -- so "what counts as a change" can't drift between
// the two.
export function diffPokemon(current: PokemonRow, fresh: FreshPokemon): FieldDiff[] {
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
