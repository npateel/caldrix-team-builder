"use client";

import { useMemo, useState } from "react";
import type { PokemonCardData } from "@/lib/pokemon-stats";
import { useContainerWidth } from "@/lib/use-container-width";
import { useCounterTeam } from "@/lib/use-counter-team";
import { usePokemonFilters } from "@/lib/use-pokemon-filters";
import { useTeamRoster } from "@/lib/use-team-roster";
import type { RosterEntry } from "@/server/team-roster";
import { PokemonFilterBar } from "../pokemon/filter-bar";
import { PokemonGrid } from "../pokemon/grid";
import { PokemonList } from "../pokemon/list";
import type { RosterRowLayout } from "./roster-card";
import { RosterPanel } from "./roster-panel";
import { TeamHeader } from "./team-header";
import { TeamTypeCoverage } from "./type-coverage";

// 3 columns (roster | pokedex | coverage) above this container width, tabs
// below -- measured, like PokemonList's full/compact switch, since this
// changes structure (simultaneous columns vs one-at-a-time tabs), not just
// column widths.
const LAYOUT_BREAKPOINT = 1024;
// Below this, sprite + labeled stats + the 3 touch buttons don't comfortably
// fit on one line -- stats move to their own full-width line under
// sprite/name/buttons instead. 375 = iPhone SE width, the narrowest common
// phone. (Rough math on padding/sprite/button widths vs. the stats row's own
// width put the strict threshold closer to ~400px -- if the single-line
// version still looks cramped in the 375-400 range, bump this back up.)
const NARROW_BREAKPOINT = 375;

type Team = { id: string; name: string };
type Tab = "team" | "pokedex" | "coverage";

export function TeamDetail({
  team,
  roster,
  allPokemon,
}: {
  team: Team;
  roster: RosterEntry[];
  allPokemon: PokemonCardData[];
}) {
  const [tab, setTab] = useState<Tab>("team");
  const [renamePending, setRenamePending] = useState(false);

  const [outerRef, containerWidth] = useContainerWidth();
  const isDesktop = containerWidth >= LAYOUT_BREAKPOINT;
  const rosterRowLayout: RosterRowLayout = isDesktop
    ? "desktop"
    : containerWidth >= NARROW_BREAKPOINT
      ? "phone"
      : "narrow";

  const filters = usePokemonFilters(allPokemon);
  const rosterIds = useMemo(() => roster.map((r) => r.pokemon.id), [roster]);
  const selectedIds = useMemo(() => new Set(rosterIds), [rosterIds]);

  const {
    pending,
    error: rosterError,
    movePokemon,
    removePokemon,
    togglePokemon,
    drag,
  } = useTeamRoster(team.id, rosterIds);
  const { counterTeam, loading: counterLoading, error: counterError } = useCounterTeam(team.id, rosterIds);
  const error = rosterError ?? counterError;

  const rosterPanel = (
    <RosterPanel
      roster={roster}
      allPokemon={allPokemon}
      isDesktop={isDesktop}
      layout={rosterRowLayout}
      pending={pending || renamePending}
      selectedIds={selectedIds}
      onToggle={togglePokemon}
      onMove={movePokemon}
      onRemove={removePokemon}
      drag={drag}
      counterTeam={counterTeam}
      counterLoading={counterLoading}
    />
  );

  const pokedexPanel = (
    <div className="flex min-h-0 flex-1 flex-col">
      {filters.view === "grid" ? (
        <PokemonGrid pokemon={filters.filtered} onSelect={togglePokemon} selectedIds={selectedIds} />
      ) : (
        <PokemonList
          pokemon={filters.sorted}
          sortKey={filters.sortKey}
          sortDirection={filters.sortDirection}
          onSort={filters.handleSort}
          onSelect={togglePokemon}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );

  const coveragePanel = <TeamTypeCoverage roster={roster} />;

  return (
    <div ref={outerRef} className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <TeamHeader teamId={team.id} teamName={team.name} onPendingChange={setRenamePending} />

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {isDesktop ? (
        <>
          <PokemonFilterBar {...filters} filteredCount={filters.filtered.length} totalCount={allPokemon.length} />
          <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr_320px] gap-4">
            <div className="min-h-0 flex flex-col overflow-y-auto">{rosterPanel}</div>
            <div className="min-h-0 flex flex-col">{pokedexPanel}</div>
            <div className="min-h-0 flex flex-col overflow-y-auto">{coveragePanel}</div>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex overflow-hidden rounded border border-black/10 text-sm dark:border-white/10">
            {(["team", "pokedex", "coverage"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-1.5 capitalize ${
                  tab === t ? "bg-blue-600 text-white dark:bg-blue-500" : ""
                }`}
              >
                {t === "team" ? `Team (${roster.length})` : t}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex flex-1 flex-col">
            {tab === "team" ? <div className="min-h-0 flex-1 overflow-y-auto">{rosterPanel}</div> : null}
            {tab === "pokedex" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <PokemonFilterBar {...filters} filteredCount={filters.filtered.length} totalCount={allPokemon.length} />
                {pokedexPanel}
              </div>
            ) : null}
            {tab === "coverage" ? <div className="min-h-0 flex-1 overflow-y-auto">{coveragePanel}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}
