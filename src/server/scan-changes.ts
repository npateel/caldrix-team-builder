import { eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { changes, pokemon } from "@/db/schema";
import { diffPokemon, toChangeRows, type FieldDiff } from "@/lib/pokemon-diff";
import { POKEAPI_BASE, transformPokemon } from "@/lib/pokeapi-transform";
import { POKEMON_CACHE_TAG } from "@/server/pokemon-catalog";
import { getTeamPokemonIds } from "@/server/team-roster";

export type ScanResult = {
  checked: number;
  changed: number;
  changes: (FieldDiff & { pokemonId: number; name: string })[];
};

// Only refetches pokemon currently on at least one team, not the whole
// ~1300-row cache -- adr-006. The bulk reseed job (reseed.ts) covers the
// rest, and also logs to `changes` for this same subset (adr-008) so
// reseed running first can't hide a genuine change from this scan.
export async function scanForChanges(): Promise<ScanResult> {
  const ids = await getTeamPokemonIds();
  const result: ScanResult = { checked: 0, changed: 0, changes: [] };
  if (ids.length === 0) return result;

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

    await db.insert(changes).values(toChangeRows(id, diffs));
    await db
      .update(pokemon)
      .set({ ...fresh, lastFetchedAt: new Date() })
      .where(eq(pokemon.id, id));
  }

  if (result.changed > 0) revalidateTag(POKEMON_CACHE_TAG, { expire: 0 });

  return result;
}
