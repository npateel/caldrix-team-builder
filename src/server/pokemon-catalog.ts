import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { pokemon } from "@/db/schema";

export const POKEMON_CACHE_TAG = "pokemon";

// The full pokemon table -- identical query the pokédex, every team page,
// and the admin cache view all ran independently. Cached via Next's Data
// Cache (persists across requests/instances, unlike a plain in-memory
// memo) so navigating between those pages doesn't re-run the same
// ~1300-row query each time. reseed.ts and scan-changes.ts invalidate this
// with revalidateTag(POKEMON_CACHE_TAG) whenever they actually write to
// the table, so it never serves data older than the last real change.
export const getAllPokemon = unstable_cache(
  async () => db.select().from(pokemon).orderBy(asc(pokemon.id)),
  ["all-pokemon"],
  { tags: [POKEMON_CACHE_TAG] },
);
