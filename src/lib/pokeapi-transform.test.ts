import { describe, expect, it } from "vitest";
import { transformMove, transformPokemon } from "./pokeapi-transform";

function statList(stats: Record<string, number>) {
  return Object.entries(stats).map(([name, base_stat]) => ({ base_stat, stat: { name } }));
}

const STAT_NAMES = {
  hp: 45,
  attack: 49,
  defense: 49,
  "special-attack": 65,
  "special-defense": 65,
  speed: 45,
};

describe("transformPokemon", () => {
  it("maps a well-formed PokéAPI detail response", () => {
    const detail = {
      id: 1,
      name: "bulbasaur",
      sprites: { front_default: "https://example.com/1.png" },
      types: [
        { slot: 2, type: { name: "poison" } },
        { slot: 1, type: { name: "grass" } },
      ],
      stats: statList(STAT_NAMES),
    };

    expect(transformPokemon(detail)).toEqual({
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
    });
  });

  it("sorts types by slot regardless of input order", () => {
    const detail = {
      id: 6,
      name: "charizard",
      sprites: {},
      types: [
        { slot: 2, type: { name: "flying" } },
        { slot: 1, type: { name: "fire" } },
      ],
      stats: statList(STAT_NAMES),
    };

    expect(transformPokemon(detail).types).toEqual(["fire", "flying"]);
  });

  it("falls back to a null sprite when missing", () => {
    const detail = {
      id: 1,
      name: "bulbasaur",
      sprites: { front_default: null },
      types: [{ slot: 1, type: { name: "grass" } }],
      stats: statList(STAT_NAMES),
    };

    expect(transformPokemon(detail).spriteUrl).toBeNull();
  });

  it("throws when a stat is missing", () => {
    const detail = {
      id: 1,
      name: "bulbasaur",
      sprites: {},
      types: [{ slot: 1, type: { name: "grass" } }],
      stats: statList({ hp: 45 }), // missing attack/defense/etc.
    };

    expect(() => transformPokemon(detail)).toThrow('Missing stat "attack"');
  });
});

describe("transformMove", () => {
  it("maps a well-formed PokéAPI move detail response", () => {
    const detail = {
      id: 1,
      name: "pound",
      type: { name: "normal" },
      power: 40,
      damage_class: { name: "physical" },
    };

    expect(transformMove(detail)).toEqual({
      id: 1,
      name: "pound",
      type: "normal",
      power: 40,
      damageClass: "physical",
    });
  });

  it("returns a null power for status moves without one", () => {
    const detail = {
      id: 10,
      name: "growl",
      type: { name: "normal" },
      power: null,
      damage_class: { name: "status" },
    };

    expect(transformMove(detail)?.power).toBeNull();
  });

  it("returns null for an unusable damage class", () => {
    const detail = {
      id: 165,
      name: "struggle",
      type: { name: "normal" },
      power: 50,
      damage_class: { name: "weird-unknown-class" },
    };

    expect(transformMove(detail)).toBeNull();
  });

  it("returns null when the type is missing", () => {
    const detail = {
      id: 1,
      name: "unknown-move",
      type: null,
      power: null,
      damage_class: { name: "status" },
    };

    expect(transformMove(detail)).toBeNull();
  });
});
