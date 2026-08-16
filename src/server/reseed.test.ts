import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));

import { push, reset } from "@/db";
import type { FreshPokemon } from "@/lib/pokeapi-transform";
import { recordTeamPokemonChanges } from "./reseed";

function fresh(overrides: Partial<FreshPokemon> = {}): FreshPokemon {
  return {
    id: 1,
    name: "bulbasaur",
    spriteUrl: "https://example.com/1.png",
    types: ["grass", "poison"],
    hp: 45,
    attack: 49,
    defense: 49,
    specialAttack: 65,
    specialDefense: 65,
    speed: 45,
    ...overrides,
  };
}

function currentRow(overrides: Record<string, unknown> = {}) {
  return { ...fresh(), lastFetchedAt: new Date("2026-01-01"), ...overrides };
}

beforeEach(() => reset());

describe("recordTeamPokemonChanges", () => {
  it("logs nothing when no pokemon are on any team", async () => {
    push([]); // joined selectDistinct

    expect(await recordTeamPokemonChanges([fresh()])).toBe(0);
    // No further db calls pushed -- would throw "no queued result" if the
    // code queried/wrote anyway.
  });

  it("logs nothing when none of the freshly fetched rows are team pokemon", async () => {
    push([{ pokemon: currentRow({ id: 999 }) }]); // joined selectDistinct -- not id 1

    expect(await recordTeamPokemonChanges([fresh({ id: 1 })])).toBe(0);
  });

  it("logs nothing when a team pokemon's data didn't actually change", async () => {
    push([{ pokemon: currentRow() }]); // joined selectDistinct

    expect(await recordTeamPokemonChanges([fresh()])).toBe(0);
  });

  it("logs one row per changed field for a team pokemon that did change", async () => {
    push([{ pokemon: currentRow({ attack: 49, hp: 45 }) }]); // joined selectDistinct
    push(undefined); // changes insert

    const count = await recordTeamPokemonChanges([fresh({ attack: 55, hp: 50 })]);

    expect(count).toBe(2);
  });
});
