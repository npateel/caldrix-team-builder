import { asc } from "drizzle-orm";
import { PokemonBrowser } from "@/components/pokemon-browser";
import { ReseedButton } from "@/components/reseed-button";
import { db } from "@/db";
import { pokemon } from "@/db/schema";

// Reuses the same browser as the public pokedex -- admin's "view" need here
// is exactly what that already does (search/filter/sort a virtualized list).
export default async function AdminPokemonPage() {
  const allPokemon = await db.select().from(pokemon).orderBy(asc(pokemon.id));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pokémon cache ({allPokemon.length})</h1>
        <ReseedButton />
      </div>
      <div className="min-h-0 flex-1">
        <PokemonBrowser pokemon={allPokemon} />
      </div>
    </div>
  );
}
