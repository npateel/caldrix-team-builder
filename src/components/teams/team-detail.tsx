"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { PokemonCardData } from "@/lib/pokemon-stats";
import { usePokemonFilters } from "@/lib/use-pokemon-filters";
import { useRosterDragReorder } from "@/lib/use-roster-drag-reorder";
import type { RosterEntry } from "@/server/team-roster";
import { PokemonFilterBar } from "../pokemon/filter-bar";
import { PokemonGrid } from "../pokemon/grid";
import { PokemonList } from "../pokemon/list";
import { DropLine, RosterCard, RosterRowControls, type RosterRowLayout } from "./roster-card";
import { TeamTypeCoverage } from "./type-coverage";

const MAX_TEAM_SIZE = 6;
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
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);
  const [pending, setPending] = useState(false);
  const [counterTeam, setCounterTeam] = useState<PokemonCardData[] | null>(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pokedex");
  const [quickAddQuery, setQuickAddQuery] = useState("");

  const outerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const isDesktop = containerWidth >= LAYOUT_BREAKPOINT;
  const rosterRowLayout: RosterRowLayout = isDesktop
    ? "desktop"
    : containerWidth >= NARROW_BREAKPOINT
      ? "phone"
      : "narrow";

  const filters = usePokemonFilters(allPokemon);
  const rosterIds = useMemo(() => roster.map((r) => r.pokemon.id), [roster]);
  const selectedIds = useMemo(() => new Set(rosterIds), [rosterIds]);

  // Sorted (order-independent) so reordering the roster doesn't retrigger
  // this -- only actual composition changes (add/remove) should.
  const rosterCompositionKey = useMemo(() => [...rosterIds].sort((a, b) => a - b).join(","), [rosterIds]);

  useEffect(() => {
    if (roster.length === 0) {
      setCounterTeam(null);
      return;
    }

    let cancelled = false;
    setCounterLoading(true);
    fetch(`/api/teams/${team.id}/counter`)
      .then(async (res) => ({ ok: res.ok, body: await res.json().catch(() => null) }))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body?.error ?? "Failed to generate counter team");
          setCounterTeam(null);
        } else {
          setCounterTeam(body.counterTeam);
        }
      })
      .finally(() => {
        if (!cancelled) setCounterLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterCompositionKey, team.id]);

  // Mobile Team tab's quick-add search -- separate from the pokedex picker's
  // own filters, and excludes anything already on the roster.
  const quickAddResults = useMemo(() => {
    const query = quickAddQuery.trim().toLowerCase();
    if (!query) return [];
    return allPokemon.filter((p) => !selectedIds.has(p.id) && p.name.includes(query)).slice(0, 6);
  }, [allPokemon, quickAddQuery, selectedIds]);

  async function updateRoster(pokemonIds: number[]) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/teams/${team.id}/pokemon`, {
      method: "PUT",
      body: JSON.stringify({ pokemonIds }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to update roster");
      return;
    }
    router.refresh();
  }

  function movePokemon(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rosterIds.length) return;
    const ids = [...rosterIds];
    [ids[index], ids[target]] = [ids[target], ids[index]];
    updateRoster(ids);
  }

  const { draggedIndex, insertIndex, handleDragStart, handleDragOver, handleDrop, resetDrag } = useRosterDragReorder(
    (from, to) => {
      const ids = [...rosterIds];
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      updateRoster(ids);
    },
  );

  function removePokemon(index: number) {
    updateRoster(rosterIds.filter((_, i) => i !== index));
  }

  // Click-to-toggle from the pokedex picker: add if there's room, remove if
  // it's already on the team.
  function togglePokemon(pokemonId: number) {
    if (rosterIds.includes(pokemonId)) {
      updateRoster(rosterIds.filter((id) => id !== pokemonId));
      return;
    }
    if (rosterIds.length >= MAX_TEAM_SIZE) {
      setError(`Team is full (max ${MAX_TEAM_SIZE})`);
      return;
    }
    updateRoster([...rosterIds, pokemonId]);
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setPending(true);
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: trimmed }),
    });
    setPending(false);
    if (res.ok) {
      setIsRenaming(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${team.name}"? This can't be undone.`)) return;
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  }

  const rosterPanel = (
    <div className="flex flex-col gap-3">
      {isDesktop ? null : (
        <div className="flex flex-col gap-2">
          <input
            type="search"
            placeholder="Quick add to team..."
            value={quickAddQuery}
            onChange={(e) => setQuickAddQuery(e.target.value)}
            disabled={roster.length >= MAX_TEAM_SIZE}
            className="w-full rounded border border-black/10 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-white/10 dark:bg-black"
          />
          {quickAddResults.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-1 dark:border-white/10">
              {quickAddResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    togglePokemon(p.id);
                    setQuickAddQuery("");
                  }}
                  className="rounded-lg p-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <RosterCard pokemon={p} layout={rosterRowLayout} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Roster ({roster.length}/{MAX_TEAM_SIZE})
        </h2>
        {roster.length > 0 ? (
          <p className="text-xs text-zinc-400">
            {isDesktop
              ? "Click to remove, drag to reorder"
              : roster.length > 1
                ? "Drag rows, or use the arrows"
                : null}
          </p>
        ) : null}
      </div>
      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No pokémon yet -- {isDesktop ? "click any pokémon in the pokédex" : "switch to the Pokédex tab"} to add
          one.
        </p>
      ) : (
        <div className="flex flex-col">
          {roster.map((entry, index) => (
            <div key={`${entry.pokemon.id}-${index}`}>
              <DropLine active={insertIndex === index} />
              <div
                draggable={!pending}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop();
                }}
                onDragEnd={resetDrag}
                onClick={isDesktop && !pending ? () => removePokemon(index) : undefined}
                className={`rounded-lg border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900 ${
                  draggedIndex === index ? "cursor-grabbing opacity-40" : "cursor-grab"
                } ${isDesktop ? "hover:border-red-300 dark:hover:border-red-900/60" : ""}`}
              >
                <RosterCard
                  pokemon={entry.pokemon}
                  layout={rosterRowLayout}
                  trailing={
                    isDesktop ? null : (
                      <RosterRowControls
                        onMoveUp={() => movePokemon(index, -1)}
                        onMoveDown={() => movePokemon(index, 1)}
                        onRemove={() => removePokemon(index)}
                        disableUp={index === 0}
                        disableDown={index === roster.length - 1}
                        disabled={pending}
                      />
                    )
                  }
                />
              </div>
            </div>
          ))}
          <DropLine active={insertIndex === roster.length} />
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-black/10 pt-3 dark:border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Counter team</h2>
          {counterLoading ? <span className="text-xs text-zinc-400">Generating…</span> : null}
        </div>
        {counterTeam ? (
          <div className="flex flex-col">
            <div className="flex flex-col gap-1">
              {counterTeam.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900"
                >
                  <RosterCard pokemon={p} layout="desktop" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
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
      <div className="flex items-center justify-between">
        {isRenaming ? (
          <form onSubmit={handleRename} className="flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="rounded border border-black/10 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-black"
            />
            <button type="submit" disabled={pending} className="text-sm font-medium">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRenaming(false);
                setNameInput(team.name);
              }}
              className="text-sm text-zinc-500 dark:text-zinc-400"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setIsRenaming(true)} className="text-xl font-semibold">
            {team.name} <span className="text-sm font-normal text-zinc-400">(rename)</span>
          </button>
        )}
        <button type="button" onClick={handleDelete} className="text-sm text-red-600 dark:text-red-400">
          Delete team
        </button>
      </div>

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
                  tab === t ? "bg-black text-white dark:bg-white dark:text-black" : ""
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
