import { groupBy } from "./group-by";
import type { TeamChangeAlert } from "@/server/team-changes";

export type ConsolidatedFieldChange = {
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: Date;
};
export type ConsolidatedPokemonChange = {
  pokemonId: number;
  pokemonName: string;
  fields: ConsolidatedFieldChange[];
};

// Collapses every change to a pokemon's given field within the alert
// window into one net before/after pair -- the value before the earliest
// recorded change vs. the value after the latest one, with `detectedAt`
// from that latest change (when the field last actually moved, not when
// it first started drifting). A field that ends up back where it started
// (e.g. attack 87 -> 80 -> 87) nets to no real change and is dropped; a
// pokemon left with no surviving fields is dropped too.
export function consolidateTeamChanges(alerts: TeamChangeAlert[]): ConsolidatedPokemonChange[] {
  const result: ConsolidatedPokemonChange[] = [];

  for (const [pokemonId, pokemonAlerts] of groupBy(alerts, (alert) => alert.pokemonId)) {
    const fields: ConsolidatedFieldChange[] = [];
    for (const [field, entries] of groupBy(pokemonAlerts, (alert) => alert.field)) {
      const chronological = [...entries].sort((a, b) => a.detectedAt.getTime() - b.detectedAt.getTime());
      const oldValue = chronological[0].oldValue;
      const latest = chronological[chronological.length - 1];
      if (oldValue === latest.newValue) continue;
      fields.push({ field, oldValue, newValue: latest.newValue, detectedAt: latest.detectedAt });
    }
    if (fields.length > 0) result.push({ pokemonId, pokemonName: pokemonAlerts[0].pokemonName, fields });
  }
  return result;
}
