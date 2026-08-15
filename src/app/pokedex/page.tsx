import { asc } from "drizzle-orm";
import { db } from "@/db";
import { pokemon } from "@/db/schema";
import { PokemonBrowser } from "@/components/pokemon-browser";

export default async function PokedexPage() {
  const allPokemon = await db.select().from(pokemon).orderBy(asc(pokemon.id));

  return <PokemonBrowser pokemon={allPokemon} />;
}
