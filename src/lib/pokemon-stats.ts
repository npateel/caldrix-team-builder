import type { TypeName } from "./type-chart";

export const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

// The pokemon shape every browser view renders (grid cards, list rows,
// roster slots). Lives here rather than next to one of those components so
// the shared hooks/helpers below don't have to import from @/components.
export type PokemonCardData = {
  id: number;
  name: string;
  spriteUrl: string | null;
  types: TypeName[];
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};

export type StatSortKey = StatKey | "total";
export type SortKey = "id" | "name" | StatSortKey;
export type SortDirection = "asc" | "desc";

export function statTotal(p: PokemonCardData): number {
  return p.hp + p.attack + p.defense + p.specialAttack + p.specialDefense + p.speed;
}

// Stats within this many points of the max count as "tied for largest".
const SIMILAR_THRESHOLD = 5;

// Which stat(s) to call out as a pokemon's standout stat(s): the highest,
// plus any others within SIMILAR_THRESHOLD of it. If that leaves 3+ stats
// (i.e. no real standout), none are called out.
export function highestStatKeys(stats: Record<StatKey, number>): Set<StatKey> {
  const max = Math.max(...STAT_KEYS.map((key) => stats[key]));
  const nearMax = STAT_KEYS.filter((key) => max - stats[key] <= SIMILAR_THRESHOLD);
  return nearMax.length <= 2 ? new Set(nearMax) : new Set();
}
