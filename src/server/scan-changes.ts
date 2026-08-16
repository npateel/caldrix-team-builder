import { eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { changes, pokemon } from "@/db/schema";
import { diffPokemon, type FieldDiff } from "@/lib/pokemon-diff";
import { transformPokemon } from "@/lib/pokeapi-transform";
import { POKEMON_CACHE_TAG } from "@/server/pokemon-catalog";
import { getTeamPokemonIds } from "@/server/team-roster";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

export type ScanResult = {
  checked: number;
  changed: number;
  changes: (FieldDiff & { pokemonId: number; name: string })[];
};

// Only refetches pokemon currently on at least one team, live from PokéAPI --
// not the whole ~1300-row cache. See adr-006 for why: this runs inside a
// request/cron-triggered serverless function, and Task 2 only cares about
// pokemon actually in use. The full cache is kept fresh separately by the
// bulk reseed job (reseed.ts), which also logs to `changes` for this same
// team-pokemon subset (see adr-008) so a genuine change can't slip through
// undetected just because reseed ran before the next scan.
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

  if (result.changed > 0) revalidateTag(POKEMON_CACHE_TAG, { expire: 0 });

  return result;
}
