export const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

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
