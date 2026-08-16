import { PokemonBrowser } from "@/components/pokemon/browser";
import { getAllPokemon } from "@/server/pokemon-catalog";

export default async function PokedexPage() {
  const allPokemon = await getAllPokemon();

  return <PokemonBrowser pokemon={allPokemon} />;
}
