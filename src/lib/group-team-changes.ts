import type { TeamChangeAlert } from "@/server/team-changes";

export type ChangeEvent = {
  pokemonId: number;
  pokemonName: string;
  detectedAt: Date;
  fields: { field: string; oldValue: string | null; newValue: string | null }[];
};

// Multiple scalar fields changing on the same pokemon in the same scan
// share one `detectedAt` -- a single multi-row INSERT gets one now() for
// the whole statement (see reseed.ts/scan-changes.ts) -- so group on
// (pokemonId, detectedAt) to show one line per pokemon per change event
// instead of one line per changed field. Most recent event first.
export function groupChangesByEvent(alerts: TeamChangeAlert[]): ChangeEvent[] {
  const events = new Map<string, ChangeEvent>();
  for (const alert of alerts) {
    const key = `${alert.pokemonId}-${alert.detectedAt.getTime()}`;
    const field = { field: alert.field, oldValue: alert.oldValue, newValue: alert.newValue };
    const existing = events.get(key);
    if (existing) {
      existing.fields.push(field);
    } else {
      events.set(key, {
        pokemonId: alert.pokemonId,
        pokemonName: alert.pokemonName,
        detectedAt: alert.detectedAt,
        fields: [field],
      });
    }
  }
  return [...events.values()].sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
}
