import { ALL_TYPES, type TypeName } from "./type-chart";

export const TYPE_NAMES = ALL_TYPES;

// stellar/unknown/shadow only ever appear on moves, never on a pokemon's own
// types -- excluded here since this list drives the pokemon type filter UI.
const MOVE_ONLY_TYPES = new Set<TypeName>(["stellar", "unknown", "shadow"]);
export const POKEMON_TYPE_NAMES = ALL_TYPES.filter((type) => !MOVE_ONLY_TYPES.has(type));

// Standard Pokémon type colors, used for badges in the UI.
export const TYPE_COLORS: Record<TypeName, string> = {
  normal: "#A8A878",
  fighting: "#C03028",
  flying: "#A890F0",
  poison: "#A040A0",
  ground: "#E0C068",
  rock: "#B8A038",
  bug: "#A8B820",
  ghost: "#705898",
  steel: "#B8B8D0",
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  psychic: "#F85888",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  fairy: "#EE99AC",
  stellar: "#40B5A5",
  unknown: "#68A090",
  shadow: "#493963",
};
