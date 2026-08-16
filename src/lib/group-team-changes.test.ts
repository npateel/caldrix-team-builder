import { describe, expect, it } from "vitest";
import { groupChangesByEvent } from "./group-team-changes";
import type { TeamChangeAlert } from "@/server/team-changes";

function alert(overrides: Partial<TeamChangeAlert> = {}): TeamChangeAlert {
  return {
    id: "change-1",
    teamId: "team-1",
    teamName: "My Team",
    pokemonId: 1,
    pokemonName: "bulbasaur",
    field: "attack",
    oldValue: "49",
    newValue: "55",
    detectedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("groupChangesByEvent", () => {
  it("returns one event per alert when nothing shares a (pokemon, detectedAt) key", () => {
    const events = groupChangesByEvent([
      alert({ id: "c1", pokemonId: 1, field: "attack" }),
      alert({ id: "c2", pokemonId: 2, field: "hp", detectedAt: new Date("2026-01-02T00:00:00.000Z") }),
    ]);

    expect(events).toHaveLength(2);
  });

  it("merges multiple field diffs for the same pokemon and timestamp into one event", () => {
    const events = groupChangesByEvent([
      alert({ id: "c1", field: "attack", oldValue: "49", newValue: "55" }),
      alert({ id: "c2", field: "hp", oldValue: "45", newValue: "50" }),
      alert({ id: "c3", field: "defense", oldValue: "49", newValue: "60" }),
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].fields).toEqual([
      { field: "attack", oldValue: "49", newValue: "55" },
      { field: "hp", oldValue: "45", newValue: "50" },
      { field: "defense", oldValue: "49", newValue: "60" },
    ]);
  });

  it("keeps the same pokemon's changes from two different events separate", () => {
    const events = groupChangesByEvent([
      alert({ id: "c1", detectedAt: new Date("2026-01-01T00:00:00.000Z") }),
      alert({ id: "c2", detectedAt: new Date("2026-01-05T00:00:00.000Z") }),
    ]);

    expect(events).toHaveLength(2);
  });

  it("orders events most recent first", () => {
    const events = groupChangesByEvent([
      alert({ id: "c1", pokemonId: 1, detectedAt: new Date("2026-01-01T00:00:00.000Z") }),
      alert({ id: "c2", pokemonId: 2, detectedAt: new Date("2026-01-10T00:00:00.000Z") }),
    ]);

    expect(events.map((e) => e.pokemonId)).toEqual([2, 1]);
  });
});
