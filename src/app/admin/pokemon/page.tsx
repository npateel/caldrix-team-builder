import { PokemonBrowser } from "@/components/pokemon/browser";
import { ActionButton } from "@/components/action-button";
import { getAllPokemon } from "@/server/pokemon-catalog";

// Reuses the same browser as the public pokedex -- admin's "view" need here
// is exactly what that already does (search/filter/sort a virtualized list).
export default async function AdminPokemonPage() {
  const allPokemon = await getAllPokemon();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pokémon cache ({allPokemon.length})</h1>
        <ActionButton
          url="/api/cron/reseed"
          label="Reseed cache now"
          pendingLabel="Reseeding… (this takes a while)"
          confirmMessage="Refetch the entire pokemon/moves cache from PokéAPI? This can take a minute or two."
          summaryTemplate="{pokemon} pokemon, {moves} moves, {pokemonMoveLinks} links"
          errorMessage="Reseed failed"
        />
      </div>
      <div className="min-h-0 flex-1">
        <PokemonBrowser pokemon={allPokemon} />
      </div>
    </div>
  );
}
