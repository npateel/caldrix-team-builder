import { sql } from "drizzle-orm";
import { db } from "@/db";
import { moves, pokemon, pokemonMoves } from "@/db/schema";
import { fetchJson, pMap } from "./http";
import { transformMove, transformPokemon, type FreshMove } from "./pokeapi-transform";

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
};

// Full bulk refresh of the pokemon/moves cache, live from PokéAPI -- unlike
// scan-changes.ts (team-scoped, writes to `changes`), this refreshes
// everything and doesn't touch the change log; the two jobs together are
// what adr-004 originally described as one. See adr-007 for why this is a
// separate job, and its serverless timing/memory tradeoffs.
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

  return { pokemon: pokemonRows.length, moves: moveRows.length, pokemonMoveLinks: linkRows.length };
}
