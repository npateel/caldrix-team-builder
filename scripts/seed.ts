// Reads scripts/data/{pokemon,moves}.jsonl (see fetch.ts) and upserts it into
// pokemon, moves, and pokemon_moves. Idempotent -- safe to rerun.
import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { pokemon, moves, pokemonMoves } from "../src/db/schema";

const POKEMON_FILE = path.join("scripts", "data", "pokemon.jsonl");
const MOVES_FILE = path.join("scripts", "data", "moves.jsonl");
const BATCH_SIZE = 500;
const VALID_DAMAGE_CLASSES = new Set(["status", "physical", "special"]);

type PokemonStat = { base_stat: number; stat: { name: string } };

function statValue(stats: PokemonStat[], name: string): number {
  const entry = stats.find((s) => s.stat.name === name);
  if (!entry) throw new Error(`Missing stat "${name}"`);
  return entry.base_stat;
}

function readJsonl(file: string): any[] {
  return fs
    .readFileSync(file, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function seedPokemon() {
  const rows = readJsonl(POKEMON_FILE).map((d) => ({
    id: d.id as number,
    name: d.name as string,
    spriteUrl: d.sprites?.front_default ?? null,
    types: [...d.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    hp: statValue(d.stats, "hp"),
    attack: statValue(d.stats, "attack"),
    defense: statValue(d.stats, "defense"),
    specialAttack: statValue(d.stats, "special-attack"),
    specialDefense: statValue(d.stats, "special-defense"),
    speed: statValue(d.stats, "speed"),
  }));

  for (const batch of chunk(rows, BATCH_SIZE)) {
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
  console.log(`Seeded ${rows.length} pokemon`);
}

// Returns a name -> id map so seedPokemonMoves can resolve the move names
// referenced on each cached pokemon file to the ids we just seeded.
async function seedMoves(): Promise<Map<string, number>> {
  let skipped = 0;
  const rows = readJsonl(MOVES_FILE).flatMap((d) => {
    const damageClass = d.damage_class?.name;
    if (!d.type?.name || !VALID_DAMAGE_CLASSES.has(damageClass)) {
      skipped++;
      return [];
    }
    return [
      {
        id: d.id as number,
        name: d.name as string,
        type: d.type.name as string,
        power: d.power as number | null,
        damageClass: damageClass as string,
      },
    ];
  });

  for (const batch of chunk(rows, BATCH_SIZE)) {
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
  console.log(`Seeded ${rows.length} moves (skipped ${skipped} without a usable damage class)`);
  return new Map(rows.map((r) => [r.name, r.id]));
}

async function seedPokemonMoves(moveIdByName: Map<string, number>) {
  const seen = new Set<string>();
  const rows: { pokemonId: number; moveId: number }[] = [];
  for (const d of readJsonl(POKEMON_FILE)) {
    for (const { move } of d.moves as { move: { name: string } }[]) {
      const moveId = moveIdByName.get(move.name);
      if (moveId === undefined) continue;
      const key = `${d.id}-${moveId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ pokemonId: d.id, moveId });
    }
  }

  for (const batch of chunk(rows, BATCH_SIZE)) {
    await db.insert(pokemonMoves).values(batch).onConflictDoNothing();
  }
  console.log(`Seeded ${rows.length} pokemon-move links`);
}

async function main() {
  await seedPokemon();
  const moveIdByName = await seedMoves();
  await seedPokemonMoves(moveIdByName);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
