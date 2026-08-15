import { moves, pokemon } from "@/db/schema";
import type { TypeName } from "./type-chart";

export type FreshPokemon = Omit<typeof pokemon.$inferSelect, "lastFetchedAt">;
export type FreshMove = Omit<typeof moves.$inferSelect, "lastFetchedAt">;

type PokemonStat = { base_stat: number; stat: { name: string } };

function statValue(stats: PokemonStat[], name: string): number {
  const entry = stats.find((s) => s.stat.name === name);
  if (!entry) throw new Error(`Missing stat "${name}"`);
  return entry.base_stat;
}

// Shape returned by GET /pokemon/{id}.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformPokemon(detail: any): FreshPokemon {
  return {
    id: detail.id,
    name: detail.name,
    spriteUrl: detail.sprites?.front_default ?? null,
    types: [...detail.types]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.slot - b.slot)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any) => t.type.name as TypeName),
    hp: statValue(detail.stats, "hp"),
    attack: statValue(detail.stats, "attack"),
    defense: statValue(detail.stats, "defense"),
    specialAttack: statValue(detail.stats, "special-attack"),
    specialDefense: statValue(detail.stats, "special-defense"),
    speed: statValue(detail.stats, "speed"),
  };
}

const VALID_DAMAGE_CLASSES = new Set(["status", "physical", "special"]);

// Shape returned by GET /move/{id}. Returns null for the handful of moves
// without a usable type/damage class (see scripts/seed.ts's original note).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformMove(detail: any): FreshMove | null {
  const damageClass = detail.damage_class?.name;
  if (!detail.type?.name || !VALID_DAMAGE_CLASSES.has(damageClass)) return null;

  return {
    id: detail.id,
    name: detail.name,
    type: detail.type.name as TypeName,
    power: detail.power ?? null,
    damageClass,
  };
}
