import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");

import { push, reset } from "@/db";
import { simulateStatDrift } from "./simulate-change";

beforeEach(() => reset());
afterEach(() => vi.restoreAllMocks());

const ROW = {
  id: 1,
  name: "bulbasaur",
  types: ["grass", "poison"],
  hp: 45,
  attack: 49,
  defense: 49,
  specialAttack: 65,
  specialDefense: 65,
  speed: 45,
} as const;

describe("simulateStatDrift", () => {
  it("returns null when the user has no team pokemon to drift", async () => {
    push([]); // join select

    expect(await simulateStatDrift("user-1")).toBeNull();
  });

  it("bumps a random stat by 5 and reports the before/after values", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // picks "hp" (first of STAT_FIELDS + "types")
    push([ROW]); // join select
    push(undefined); // pokemon update

    const drift = await simulateStatDrift("user-1");

    expect(drift).toEqual({
      pokemonId: 1,
      pokemonName: "bulbasaur",
      field: "hp",
      oldValue: "45",
      newValue: "50",
    });
  });

  it("swaps one of the pokemon's types and reports the before/after values", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999); // picks the last pool entry: "types"
    push([ROW]); // join select
    push(undefined); // pokemon update

    const drift = await simulateStatDrift("user-1");

    expect(drift?.pokemonId).toBe(1);
    expect(drift?.pokemonName).toBe("bulbasaur");
    expect(drift?.field).toBe("types");
    expect(drift?.oldValue).toBe("grass,poison");
    expect(drift?.newValue).not.toBe(drift?.oldValue);
    const [, secondType] = drift!.newValue.split(",");
    expect(secondType).not.toBe("poison");
  });
});
