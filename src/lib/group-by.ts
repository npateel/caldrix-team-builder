// Groups items into a Map keyed by keyFn, preserving each group's input
// order. Shared by every "fetch joined rows, group by an id" query
// (getRosters, getRecentTeamChanges, and consolidateTeamChanges' per-field
// grouping) so the grouping idiom can't drift between them.
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = groups.get(key);
    if (existing) existing.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
