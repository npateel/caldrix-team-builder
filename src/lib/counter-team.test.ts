import { describe, expect, it } from "vitest";
import { generateCounterTeam } from "./counter-team";
import type { pokemon } from "@/db/schema";
import type { TypeName } from "./type-chart";
import type { RosterEntry } from "@/server/team-roster";

type PokemonRow = typeof pokemon.$inferSelect;

let nextId = 1;

// Every stat (including speed) defaults equal across fixtures, so the
// speed term in the scoring formula is always 0 and every test's expected
// winner is decided purely by type matchups (offense/incoming/synergy).
function makePokemon(types: TypeName[], overrides: Partial<PokemonRow> = {}): PokemonRow {
  return {
    id: nextId++,
    name: types.join("-"),
    spriteUrl: null,
    types,
    hp: 50,
    attack: 50,
    defense: 50,
    specialAttack: 50,
    specialDefense: 50,
    speed: 50,
    lastFetchedAt: new Date(),
    ...overrides,
  };
}

function roster(...types: TypeName[][]): RosterEntry[] {
  return types.map((t, position) => ({ position, pokemon: makePokemon(t) }));
}

describe("generateCounterTeam", () => {
  it("pins slot 0 to the best individual counter for the enemy's first pokemon", () => {
    // Fire crushes bug (2x offense, 0.5x incoming) -- clearly better than
    // ground or psychic against a bug-type enemy.
    const fireCounter = makePokemon(["fire"]);
    const groundCandidate = makePokemon(["ground"]);
    const psychicCandidate = makePokemon(["psychic"]);

    const result = generateCounterTeam(roster(["bug"]), [fireCounter, groundCandidate, psychicCandidate]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(fireCounter.id);
  });

  it("avoids stacking a shared weakness onto a later pick when it would otherwise tie", () => {
    const fireCounter = makePokemon(["fire"]); // weak to water/rock/ground
    const groundCandidate = makePokemon(["ground"]); // also weak to water -- stacks
    const psychicCandidate = makePokemon(["psychic"]); // not weak to water/rock/ground

    // Against a plain normal-type second enemy, ground and psychic score
    // identically on pure offense/incoming/speed (both neutral) -- only
    // the synergy penalty for stacking onto fire's water-weakness
    // distinguishes them.
    const result = generateCounterTeam(
      roster(["bug"], ["normal"]),
      [fireCounter, groundCandidate, psychicCandidate],
    );

    expect(result.map((p) => p.id)).toEqual([fireCounter.id, psychicCandidate.id]);
  });

  it("never picks the same candidate twice, even when it's the best fit for multiple slots", () => {
    const bestCounter = makePokemon(["fire"]);
    const fallbackCounter = makePokemon(["ground"]);

    const result = generateCounterTeam(roster(["bug"], ["bug"]), [bestCounter, fallbackCounter]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(bestCounter.id);
    expect(result[1].id).toBe(fallbackCounter.id);
  });

  it("returns fewer picks than the enemy roster once the candidate pool is exhausted", () => {
    const onlyCandidate = makePokemon(["fire"]);

    const result = generateCounterTeam(roster(["bug"], ["bug"], ["bug"]), [onlyCandidate]);

    expect(result).toEqual([onlyCandidate]);
  });

  it("returns an empty team for an empty enemy roster", () => {
    expect(generateCounterTeam([], [makePokemon(["fire"])])).toEqual([]);
  });
});
