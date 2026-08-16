import { useMemo, useState } from "react";
import type { TypeName } from "./type-chart";
import { statTotal, type PokemonCardData, type SortDirection, type SortKey } from "./pokemon-stats";

export type View = "grid" | "list";

// Search/type-filter/sort/view state shared by every pokedex-style browser
// (the standalone /pokedex page, /admin/pokemon, and the team builder's
// center picker column). Grid view always shows pokedex order (filtered,
// unsorted); sorting is a list-view concept since that's where per-column
// headers exist.
export function usePokemonFilters(pokemon: PokemonCardData[]) {
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

  return {
    search,
    setSearch,
    selectedTypes,
    toggleType,
    view,
    setView,
    sortKey,
    sortDirection,
    handleSort,
    filtered,
    sorted,
  };
}
