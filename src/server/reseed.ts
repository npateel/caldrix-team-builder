import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { changes, moves, pokemon, pokemonMoves, teamPokemon } from "@/db/schema";
import { fetchJson, pMap } from "@/lib/http";
import { diffPokemon } from "@/lib/pokemon-diff";
import { transformMove, transformPokemon, type FreshMove, type FreshPokemon } from "@/lib/pokeapi-transform";
import { POKEMON_CACHE_TAG } from "@/server/pokemon-catalog";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const CONCURRENCY = 20;
const BATCH_SIZE = 500;

type NamedApiResource = { name: string; url: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PokemonDetail = any;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type ReseedResult = {
  pokemon: number;
  moves: number;
  pokemonMoveLinks: number;
  changesLogged: number;
};

// Same team-pokemon scope as scan-changes.ts (adr-006) and the same
// diffPokemon -- diffs the pre-overwrite cached rows against the fresh
// data reseed already has in hand, so its blind upsert can't silently
// erase a discrepancy the scan job would otherwise have caught (adr-008).
export async function recordTeamPokemonChanges(freshRows: FreshPokemon[]): Promise<number> {
  const rows = await db
    .selectDistinct({ pokemon })
    .from(pokemon)
    .innerJoin(teamPokemon, eq(pokemon.id, teamPokemon.pokemonId));
  if (rows.length === 0) return 0;

  const currentById = new Map(rows.map((row) => [row.pokemon.id, row.pokemon]));
  const relevantFresh = freshRows.filter((row) => currentById.has(row.id));
  if (relevantFresh.length === 0) return 0;

  const changeRows = relevantFresh.flatMap((fresh) => {
    const current = currentById.get(fresh.id);
    if (!current) return [];
    return diffPokemon(current, fresh).map((diff) => ({
      entityType: "pokemon" as const,
      entityId: fresh.id,
      field: diff.field,
      oldValue: diff.oldValue,
      newValue: diff.newValue,
    }));
  });
  if (changeRows.length === 0) return 0;

  for (const batch of chunk(changeRows, BATCH_SIZE)) {
    await db.insert(changes).values(batch);
  }
  return changeRows.length;
}

// Full bulk refresh of the pokemon/moves cache, live from PokéAPI -- unlike
// scan-changes.ts, refreshes everything, not just team pokemon, but also
// logs team-pokemon changes (recordTeamPokemonChanges above) so reseed
// running before the next scan can't hide a genuine change. See adr-007
// for why this is a separate job (serverless timing/memory tradeoffs).
export async function reseed(): Promise<ReseedResult> {
  const [pokemonList, moveList] = await Promise.all([
    fetchJson<{ results: NamedApiResource[] }>(`${POKEAPI_BASE}/pokemon?limit=100000`),
    fetchJson<{ results: NamedApiResource[] }>(`${POKEAPI_BASE}/move?limit=100000`),
  ]);

  const pokemonDetails = await pMap<NamedApiResource, PokemonDetail>(
    pokemonList.results,
    (entry) => fetchJson(entry.url),
    CONCURRENCY,
  );
  const pokemonRows = pokemonDetails.map(transformPokemon);

  const moveDetails = await pMap<NamedApiResource, PokemonDetail>(
    moveList.results,
    (entry) => fetchJson(entry.url),
    CONCURRENCY,
  );
  const moveRows = moveDetails.map(transformMove).filter((move): move is FreshMove => move !== null);

  // Must run before the upsert below overwrites the rows it needs to diff
  // against.
  const changesLogged = await recordTeamPokemonChanges(pokemonRows);

  for (const batch of chunk(pokemonRows, BATCH_SIZE)) {
    await db
      .insert(pokemon)
      .values(batch)
      .onConflictDoUpdate({
        target: pokemon.id,
        set: {
          name: sql`excluded.name`,
          spriteUrl: sql`excluded.sprite_url`,
          types: sql`excluded.types`,
          hp: sql`excluded.hp`,
          attack: sql`excluded.attack`,
          defense: sql`excluded.defense`,
          specialAttack: sql`excluded.special_attack`,
          specialDefense: sql`excluded.special_defense`,
          speed: sql`excluded.speed`,
          lastFetchedAt: sql`now()`,
        },
      });
  }

  for (const batch of chunk(moveRows, BATCH_SIZE)) {
    await db
      .insert(moves)
      .values(batch)
      .onConflictDoUpdate({
        target: moves.id,
        set: {
          name: sql`excluded.name`,
          type: sql`excluded.type`,
          power: sql`excluded.power`,
          damageClass: sql`excluded.damage_class`,
          lastFetchedAt: sql`now()`,
        },
      });
  }

  const moveIdByName = new Map(moveRows.map((move) => [move.name, move.id]));
  const seen = new Set<string>();
  const linkRows: { pokemonId: number; moveId: number }[] = [];
  for (const detail of pokemonDetails) {
    for (const { move } of detail.moves as { move: { name: string } }[]) {
      const moveId = moveIdByName.get(move.name);
      if (moveId === undefined) continue;
      const key = `${detail.id}-${moveId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      linkRows.push({ pokemonId: detail.id, moveId });
    }
  }
  for (const batch of chunk(linkRows, BATCH_SIZE)) {
    await db.insert(pokemonMoves).values(batch).onConflictDoNothing();
  }

  revalidateTag(POKEMON_CACHE_TAG, { expire: 0 });

  return { pokemon: pokemonRows.length, moves: moveRows.length, pokemonMoveLinks: linkRows.length, changesLogged };
}
