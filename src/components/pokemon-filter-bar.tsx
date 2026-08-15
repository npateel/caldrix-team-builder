import type { TypeName } from "@/lib/type-chart";
import { POKEMON_TYPE_NAMES, TYPE_COLORS } from "@/lib/type-colors";
import type { usePokemonFilters } from "@/lib/use-pokemon-filters";

type Filters = ReturnType<typeof usePokemonFilters>;

export function PokemonFilterBar({
  search,
  setSearch,
  selectedTypes,
  toggleType,
  view,
  setView,
  filteredCount,
  totalCount,
}: Pick<Filters, "search" | "setSearch" | "selectedTypes" | "toggleType" | "view" | "setView"> & {
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
        />
        <div className="ml-auto flex overflow-hidden rounded border border-black/10 text-sm dark:border-white/10">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 ${view === "grid" ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 ${view === "list" ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
          >
            List
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {POKEMON_TYPE_NAMES.map((type: TypeName) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize text-white transition-opacity ${
              selectedTypes.size === 0 || selectedTypes.has(type) ? "opacity-100" : "opacity-40"
            }`}
            style={{ backgroundColor: TYPE_COLORS[type] }}
          >
            {type}
          </button>
        ))}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filteredCount} of {totalCount} pokémon
        {selectedTypes.size > 0 ? " (matching all selected types)" : ""}
      </p>
    </div>
  );
}
