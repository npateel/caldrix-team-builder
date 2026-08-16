import { describe, expect, it } from "vitest";
import { diffPokemon } from "./pokemon-diff";
import type { pokemon } from "@/db/schema";
import type { FreshPokemon } from "./pokeapi-transform";

type PokemonRow = typeof pokemon.$inferSelect;

function currentRow(overrides: Partial<PokemonRow> = {}): PokemonRow {
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
    lastFetchedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function freshFrom(current: PokemonRow, overrides: Partial<FreshPokemon> = {}): FreshPokemon {
  return {
    id: current.id,
    name: current.name,
    spriteUrl: current.spriteUrl,
    types: current.types,
    hp: current.hp,
    attack: current.attack,
    defense: current.defense,
    specialAttack: current.specialAttack,
    specialDefense: current.specialDefense,
    speed: current.speed,
    ...overrides,
  };
}

describe("diffPokemon", () => {
  it("returns no diffs when nothing changed", () => {
    const current = currentRow();
    expect(diffPokemon(current, freshFrom(current))).toEqual([]);
  });

  it("reports a single changed scalar field", () => {
    const current = currentRow();
    const fresh = freshFrom(current, { attack: 55 });

    expect(diffPokemon(current, fresh)).toEqual([{ field: "attack", oldValue: "49", newValue: "55" }]);
  });

  it("reports multiple changed fields", () => {
    const current = currentRow();
    const fresh = freshFrom(current, { attack: 55, hp: 50 });

    expect(diffPokemon(current, fresh)).toEqual(
      expect.arrayContaining([
        { field: "hp", oldValue: "45", newValue: "50" },
        { field: "attack", oldValue: "49", newValue: "55" },
      ]),
    );
  });

  it("reports a types change as a joined comma string, order-sensitive", () => {
    const current = currentRow({ types: ["grass", "poison"] });
    const fresh = freshFrom(current, { types: ["poison", "grass"] });

    expect(diffPokemon(current, fresh)).toEqual([{ field: "types", oldValue: "grass,poison", newValue: "poison,grass" }]);
  });
});
