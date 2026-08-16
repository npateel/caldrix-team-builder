"use client";

import type { PokemonCardData } from "@/lib/pokemon-stats";
import { usePokemonFilters } from "@/lib/use-pokemon-filters";
import { PokemonFilterBar } from "./filter-bar";
import { PokemonGrid } from "./grid";
import { PokemonList } from "./list";

// Standalone pokedex browser (search/filter/sort/grid-or-list), used as-is
// on /pokedex and /admin/pokemon. The team builder's center picker column
// uses usePokemonFilters/PokemonFilterBar/PokemonGrid/PokemonList directly
// instead of this, since it needs a different layout (bar spans a header
// above 3 columns, not stacked above its own content).
export function PokemonBrowser({ pokemon }: { pokemon: PokemonCardData[] }) {
  const filters = usePokemonFilters(pokemon);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <PokemonFilterBar {...filters} filteredCount={filters.filtered.length} totalCount={pokemon.length} />
      {filters.view === "grid" ? (
        <PokemonGrid pokemon={filters.filtered} />
      ) : (
        <PokemonList
          pokemon={filters.sorted}
          sortKey={filters.sortKey}
          sortDirection={filters.sortDirection}
          onSort={filters.handleSort}
        />
      )}
    </div>
  );
}
