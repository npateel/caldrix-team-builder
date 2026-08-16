import { describe, expect, it } from "vitest";
import { consolidateTeamChanges } from "./consolidate-team-changes";
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

describe("consolidateTeamChanges", () => {
  it("passes through a single change to a field", () => {
    const result = consolidateTeamChanges([alert()]);

    expect(result).toEqual([{ pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "attack", oldValue: "49", newValue: "55" }] }]);
  });

  it("keeps distinct changed fields on the same pokemon separate", () => {
    const result = consolidateTeamChanges([
      alert({ field: "attack", oldValue: "49", newValue: "55" }),
      alert({ id: "c2", field: "hp", oldValue: "45", newValue: "50" }),
    ]);

    expect(result).toEqual([
      {
        pokemonId: 1,
        pokemonName: "bulbasaur",
        fields: [
          { field: "attack", oldValue: "49", newValue: "55" },
          { field: "hp", oldValue: "45", newValue: "50" },
        ],
      },
    ]);
  });

  it("nets a field changed twice into one before/after pair", () => {
    const result = consolidateTeamChanges([
      alert({ id: "c1", field: "attack", oldValue: "49", newValue: "55", detectedAt: new Date("2026-01-01") }),
      alert({ id: "c2", field: "attack", oldValue: "55", newValue: "60", detectedAt: new Date("2026-01-03") }),
    ]);

    expect(result).toEqual([{ pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "attack", oldValue: "49", newValue: "60" }] }]);
  });

  it("nets to the earliest/latest values regardless of input order", () => {
    const result = consolidateTeamChanges([
      alert({ id: "c2", field: "attack", oldValue: "55", newValue: "60", detectedAt: new Date("2026-01-03") }),
      alert({ id: "c1", field: "attack", oldValue: "49", newValue: "55", detectedAt: new Date("2026-01-01") }),
    ]);

    expect(result).toEqual([{ pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "attack", oldValue: "49", newValue: "60" }] }]);
  });

  it("drops a field that nets back to its starting value", () => {
    const result = consolidateTeamChanges([
      alert({ id: "c1", field: "attack", oldValue: "87", newValue: "80", detectedAt: new Date("2026-01-01") }),
      alert({ id: "c2", field: "attack", oldValue: "80", newValue: "87", detectedAt: new Date("2026-01-03") }),
    ]);

    expect(result).toEqual([]);
  });

  it("drops only the netted-out field, keeping a real change on the same pokemon", () => {
    const result = consolidateTeamChanges([
      alert({ id: "c1", field: "attack", oldValue: "87", newValue: "80", detectedAt: new Date("2026-01-01") }),
      alert({ id: "c2", field: "attack", oldValue: "80", newValue: "87", detectedAt: new Date("2026-01-03") }),
      alert({ id: "c3", field: "hp", oldValue: "45", newValue: "50", detectedAt: new Date("2026-01-02") }),
    ]);

    expect(result).toEqual([{ pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "hp", oldValue: "45", newValue: "50" }] }]);
  });

  it("returns separate entries for separate pokemon", () => {
    const result = consolidateTeamChanges([
      alert({ id: "c1", pokemonId: 1, pokemonName: "bulbasaur" }),
      alert({ id: "c2", pokemonId: 4, pokemonName: "charmander" }),
    ]);

    expect(result.map((r) => r.pokemonId)).toEqual([1, 4]);
  });
});
