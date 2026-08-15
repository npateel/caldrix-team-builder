"use client";

import { useMemo, useState } from "react";
import type { TypeName } from "@/lib/type-chart";
import { POKEMON_TYPE_NAMES, TYPE_COLORS } from "@/lib/type-colors";
import type { PokemonCardData } from "./pokemon-card";
import { PokemonGrid } from "./pokemon-grid";
import { PokemonList, statTotal, type SortDirection, type SortKey } from "./pokemon-list";

type View = "grid" | "list";

// Owns search/type-filter/sort/view-toggle state. Grid view always shows
// pokedex order (filtered, unsorted); sorting is a list-view concept since
// that's where per-column headers exist.
export function PokemonBrowser({ pokemon }: { pokemon: PokemonCardData[] }) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<TypeName>>(new Set());
  const [view, setView] = useState<View>("grid");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const types = Array.from(selectedTypes);
    return pokemon.filter((p) => {
      if (query && !p.name.includes(query)) return false;
      if (types.length > 0 && !types.every((t) => p.types.includes(t))) return false;
      return true;
    });
  }, [pokemon, search, selectedTypes]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortKey === "total" ? statTotal(a) : sortKey === "name" ? a.name : a[sortKey];
      const bv = sortKey === "total" ? statTotal(b) : sortKey === "name" ? b.name : b[sortKey];
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return 0;
    });
  }, [filtered, sortKey, sortDirection]);

  function toggleType(type: TypeName) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "name" || key === "id" ? "asc" : "desc");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
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
          {POKEMON_TYPE_NAMES.map((type) => (
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
          {filtered.length} of {pokemon.length} pokémon
          {selectedTypes.size > 0 ? " (matching all selected types)" : ""}
        </p>
      </div>

      {view === "grid" ? (
        <PokemonGrid pokemon={filtered} />
      ) : (
        <PokemonList pokemon={sorted} sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
      )}
    </div>
  );
}
