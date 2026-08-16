import type { TeamChangeAlert } from "@/server/team-changes";

export type ConsolidatedFieldChange = { field: string; oldValue: string | null; newValue: string | null };
export type ConsolidatedPokemonChange = {
  pokemonId: number;
  pokemonName: string;
  fields: ConsolidatedFieldChange[];
};

// Collapses every change to a pokemon's given field within the alert
// window into one net before/after pair -- the value before the earliest
// recorded change vs. the value after the latest one. A field that ends
// up back where it started (e.g. attack 87 -> 80 -> 87) nets to no real
// change and is dropped; a pokemon left with no surviving fields is
// dropped too.
export function consolidateTeamChanges(alerts: TeamChangeAlert[]): ConsolidatedPokemonChange[] {
  const byPokemon = new Map<number, { pokemonName: string; byField: Map<string, TeamChangeAlert[]> }>();

  for (const alert of alerts) {
    let entry = byPokemon.get(alert.pokemonId);
    if (!entry) {
      entry = { pokemonName: alert.pokemonName, byField: new Map() };
      byPokemon.set(alert.pokemonId, entry);
    }
    const existing = entry.byField.get(alert.field);
    if (existing) existing.push(alert);
    else entry.byField.set(alert.field, [alert]);
  }

  const result: ConsolidatedPokemonChange[] = [];
  for (const [pokemonId, { pokemonName, byField }] of byPokemon) {
    const fields: ConsolidatedFieldChange[] = [];
    for (const [field, entries] of byField) {
      const chronological = [...entries].sort((a, b) => a.detectedAt.getTime() - b.detectedAt.getTime());
      const oldValue = chronological[0].oldValue;
      const newValue = chronological[chronological.length - 1].newValue;
      if (oldValue === newValue) continue;
      fields.push({ field, oldValue, newValue });
    }
    if (fields.length > 0) result.push({ pokemonId, pokemonName, fields });
  }
  return result;
}
