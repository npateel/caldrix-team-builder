import type { TypeName } from "@/lib/type-chart";
import { POKEMON_TYPE_NAMES } from "@/lib/type-colors";
import type { usePokemonFilters } from "@/lib/use-pokemon-filters";
import { TypeBadge } from "../type-badge";

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
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 max-w-lg flex-1 rounded border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
        />
        <div className="ml-auto flex shrink-0 overflow-hidden rounded border border-black/10 text-sm dark:border-white/10">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 ${view === "grid" ? "bg-violet-600 text-white dark:bg-violet-500" : ""}`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 ${view === "list" ? "bg-violet-600 text-white dark:bg-violet-500" : ""}`}
          >
            List
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {POKEMON_TYPE_NAMES.map((type: TypeName) => (
          <TypeBadge
            key={type}
            type={type}
            size="lg"
            onClick={() => toggleType(type)}
            className={`transition-opacity ${
              selectedTypes.size === 0 || selectedTypes.has(type) ? "opacity-100" : "opacity-40"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filteredCount} of {totalCount} pokémon
        {selectedTypes.size > 0 ? " (matching all selected types)" : ""}
      </p>
    </div>
  );
}
