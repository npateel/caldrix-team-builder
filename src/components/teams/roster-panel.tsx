"use client";

import { useMemo, useState } from "react";
import type { PokemonCardData } from "@/lib/pokemon-stats";
import { MAX_TEAM_SIZE } from "@/lib/use-team-roster";
import type { useRosterDragReorder } from "@/lib/use-roster-drag-reorder";
import type { RosterEntry } from "@/server/team-roster";
import { DropLine, RosterCard, RosterRowControls, type RosterRowLayout } from "./roster-card";

// The editable roster list -- quick-add search (mobile only), drag/arrow
// reorder, and the counter-team preview underneath.
export function RosterPanel({
  roster,
  allPokemon,
  isDesktop,
  layout,
  pending,
  selectedIds,
  onToggle,
  onMove,
  onRemove,
  drag,
  counterTeam,
  counterLoading,
}: {
  roster: RosterEntry[];
  allPokemon: PokemonCardData[];
  isDesktop: boolean;
  layout: RosterRowLayout;
  pending: boolean;
  selectedIds: Set<number>;
  onToggle: (pokemonId: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  drag: ReturnType<typeof useRosterDragReorder>;
  counterTeam: PokemonCardData[] | null;
  counterLoading: boolean;
}) {
  const [quickAddQuery, setQuickAddQuery] = useState("");
  const { draggedIndex, insertIndex, handleDragStart, handleDragOver, handleDrop, resetDrag } = drag;

  // Mobile Team tab's quick-add search -- separate from the pokedex picker's
  // own filters, and excludes anything already on the roster.
  const quickAddResults = useMemo(() => {
    const query = quickAddQuery.trim().toLowerCase();
    if (!query) return [];
    return allPokemon.filter((p) => !selectedIds.has(p.id) && p.name.includes(query)).slice(0, 6);
  }, [allPokemon, quickAddQuery, selectedIds]);

  return (
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
                    onToggle(p.id);
                    setQuickAddQuery("");
                  }}
                  className="rounded-lg p-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <RosterCard pokemon={p} layout={layout} />
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
                onClick={isDesktop && !pending ? () => onRemove(index) : undefined}
                className={`rounded-lg border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900 ${
                  draggedIndex === index ? "cursor-grabbing opacity-40" : "cursor-grab"
                } ${isDesktop ? "hover:border-red-300 dark:hover:border-red-900/60" : ""}`}
              >
                <RosterCard
                  pokemon={entry.pokemon}
                  layout={layout}
                  trailing={
                    isDesktop ? null : (
                      <RosterRowControls
                        onMoveUp={() => onMove(index, -1)}
                        onMoveDown={() => onMove(index, 1)}
                        onRemove={() => onRemove(index)}
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
}
