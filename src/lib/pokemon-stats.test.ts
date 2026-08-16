import { describe, expect, it } from "vitest";
import { highestStatKeys, statTotal, type PokemonCardData } from "./pokemon-stats";

function makeStats(overrides: Partial<Record<string, number>> = {}) {
  return {
    hp: 50,
    attack: 50,
    defense: 50,
    specialAttack: 50,
    specialDefense: 50,
    speed: 50,
    ...overrides,
  };
}

describe("statTotal", () => {
  it("sums all six stats", () => {
    const pokemon = { id: 1, name: "test", spriteUrl: null, types: [], ...makeStats() } as PokemonCardData;
    expect(statTotal(pokemon)).toBe(300);
  });
});

describe("highestStatKeys", () => {
  it("calls out a single standout stat", () => {
    const stats = makeStats({ attack: 120 });
    expect(highestStatKeys(stats)).toEqual(new Set(["attack"]));
  });

  it("calls out multiple stats tied near the max", () => {
    const stats = makeStats({ attack: 120, specialAttack: 118 });
    expect(highestStatKeys(stats)).toEqual(new Set(["attack", "specialAttack"]));
  });

  it("excludes a stat outside the similarity threshold", () => {
    // attack (120) and specialAttack (100) differ by 20, well past the
    // 5-point threshold -- only attack should be called out.
    const stats = makeStats({ attack: 120, specialAttack: 100 });
    expect(highestStatKeys(stats)).toEqual(new Set(["attack"]));
  });

  it("calls out nothing when 3+ stats are near the max (no real standout)", () => {
    const stats = makeStats({ attack: 100, specialAttack: 98, defense: 97 });
    expect(highestStatKeys(stats)).toEqual(new Set());
  });

  it("calls out nothing for perfectly even stats", () => {
    expect(highestStatKeys(makeStats())).toEqual(new Set());
  });
});
