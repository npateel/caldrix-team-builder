import { describe, expect, it } from "vitest";
import { consolidateTeamChanges } from "./consolidate-team-changes";
import type { TeamChangeAlert } from "@/server/team-changes";

function alert(overrides: Partial<TeamChangeAlert> = {}): TeamChangeAlert {
  return {
    teamId: "team-1",
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
  it("passes through a single change to a field, including its detectedAt", () => {
    const detectedAt = new Date("2026-01-01T00:00:00.000Z");
    const result = consolidateTeamChanges([alert({ detectedAt })]);

    expect(result).toEqual([
      { pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "attack", oldValue: "49", newValue: "55", detectedAt }] },
    ]);
  });

  it("keeps distinct changed fields on the same pokemon separate", () => {
    const result = consolidateTeamChanges([
      alert({ field: "attack", oldValue: "49", newValue: "55" }),
      alert({ field: "hp", oldValue: "45", newValue: "50" }),
    ]);

    expect(result[0].fields.map((f) => f.field)).toEqual(["attack", "hp"]);
  });

  it("nets a field changed twice into one before/after pair, dated to the latest change", () => {
    const latest = new Date("2026-01-03");
    const result = consolidateTeamChanges([
      alert({ field: "attack", oldValue: "49", newValue: "55", detectedAt: new Date("2026-01-01") }),
      alert({ field: "attack", oldValue: "55", newValue: "60", detectedAt: latest }),
    ]);

    expect(result).toEqual([
      { pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "attack", oldValue: "49", newValue: "60", detectedAt: latest }] },
    ]);
  });

  it("nets to the earliest/latest values regardless of input order", () => {
    const latest = new Date("2026-01-03");
    const result = consolidateTeamChanges([
      alert({ field: "attack", oldValue: "55", newValue: "60", detectedAt: latest }),
      alert({ field: "attack", oldValue: "49", newValue: "55", detectedAt: new Date("2026-01-01") }),
    ]);

    expect(result).toEqual([
      { pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "attack", oldValue: "49", newValue: "60", detectedAt: latest }] },
    ]);
  });

  it("drops a field that nets back to its starting value", () => {
    const result = consolidateTeamChanges([
      alert({ field: "attack", oldValue: "87", newValue: "80", detectedAt: new Date("2026-01-01") }),
      alert({ field: "attack", oldValue: "80", newValue: "87", detectedAt: new Date("2026-01-03") }),
    ]);

    expect(result).toEqual([]);
  });

  it("drops only the netted-out field, keeping a real change on the same pokemon", () => {
    const hpDetectedAt = new Date("2026-01-02");
    const result = consolidateTeamChanges([
      alert({ field: "attack", oldValue: "87", newValue: "80", detectedAt: new Date("2026-01-01") }),
      alert({ field: "attack", oldValue: "80", newValue: "87", detectedAt: new Date("2026-01-03") }),
      alert({ field: "hp", oldValue: "45", newValue: "50", detectedAt: hpDetectedAt }),
    ]);

    expect(result).toEqual([
      { pokemonId: 1, pokemonName: "bulbasaur", fields: [{ field: "hp", oldValue: "45", newValue: "50", detectedAt: hpDetectedAt }] },
    ]);
  });

  it("returns separate entries for separate pokemon", () => {
    const result = consolidateTeamChanges([
      alert({ pokemonId: 1, pokemonName: "bulbasaur" }),
      alert({ pokemonId: 4, pokemonName: "charmander" }),
    ]);

    expect(result.map((r) => r.pokemonId)).toEqual([1, 4]);
  });
});
