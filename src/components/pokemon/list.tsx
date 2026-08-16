"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { useContainerWidth } from "@/lib/use-container-width";
import { TypeBadge } from "../type-badge";
import {
  highestStatKeys,
  STAT_KEYS,
  statTotal,
  type PokemonCardData,
  type SortDirection,
  type SortKey,
  type StatSortKey,
} from "@/lib/pokemon-stats";

const STAT_COLUMNS: { key: StatSortKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "specialAttack", label: "Sp. Atk" },
  { key: "specialDefense", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
  { key: "total", label: "Total" },
];

// Two layouts: "full" (id + separate types column, desktop) and "compact"
// (name/types merged into one cell, no id -- narrow windows/phones). Which
// one renders is driven by measured container width, not a CSS breakpoint,
// since it also changes cell structure, not just column widths.
const FULL_TEMPLATE = "40px 56px 140px 140px repeat(7, 64px)";
const COMPACT_TEMPLATE = "40px 160px repeat(7, 64px)";
export const FULL_TABLE_MAX_WIDTH = 920;
const COMPACT_TABLE_WIDTH = 720;
const LAYOUT_BREAKPOINT = 860;
const ROW_HEIGHT_ESTIMATE = 56;

export function PokemonList({
  pokemon,
  sortKey,
  sortDirection,
  onSort,
  onSelect,
  selectedIds,
}: {
  pokemon: PokemonCardData[];
  sortKey: SortKey | null;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onSelect?: (id: number) => void;
  selectedIds?: Set<number>;
}) {
  const [outerRef, containerWidth] = useContainerWidth();
  const parentRef = useRef<HTMLDivElement>(null);

  const layout: "full" | "compact" = containerWidth >= LAYOUT_BREAKPOINT ? "full" : "compact";
  const template = layout === "full" ? FULL_TEMPLATE : COMPACT_TEMPLATE;

  const rowVirtualizer = useVirtualizer({
    count: pokemon.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 10,
  });

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  function SortButton({ column, label }: { column: SortKey; label: string }) {
    return (
      <button
        type="button"
        onClick={() => onSort(column)}
        className="text-left hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {label}
        {sortIndicator(column)}
      </button>
    );
  }

  return (
    <div ref={outerRef} className="flex min-h-0 flex-1 flex-col overflow-x-auto">
      <div
        className="mx-auto flex min-h-0 w-full flex-1 flex-col"
        style={
          layout === "full"
            ? { maxWidth: FULL_TABLE_MAX_WIDTH }
            : { width: COMPACT_TABLE_WIDTH, minWidth: COMPACT_TABLE_WIDTH }
        }
      >
        <div
          className="grid w-full gap-2 border-b border-black/10 pb-2 text-xs font-medium text-zinc-500 dark:border-white/10 dark:text-zinc-400"
          style={{ gridTemplateColumns: template }}
        >
          <span />
          {layout === "full" && <SortButton column="id" label="#" />}
          <SortButton column="name" label="Name" />
          {layout === "full" && <span>Types</span>}
          {STAT_COLUMNS.map(({ key, label }) => (
            <SortButton key={key} column={key} label={label} />
          ))}
        </div>

        <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
          <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const p = pokemon[virtualRow.index];
              const boldStats = highestStatKeys(p);
              const selected = selectedIds?.has(p.id);
              return (
                <div
                  key={p.id}
                  role={onSelect ? "button" : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  onClick={onSelect ? () => onSelect(p.id) : undefined}
                  onKeyDown={
                    onSelect
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(p.id);
                          }
                        }
                      : undefined
                  }
                  className={`grid items-center gap-2 border-b border-black/5 text-sm dark:border-white/5 ${
                    onSelect ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""
                  } ${selected ? "bg-emerald-50 dark:bg-emerald-950/30" : ""}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: template,
                  }}
                >
                  <span className="relative">
                    {p.spriteUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.spriteUrl}
                        alt={p.name}
                        width={32}
                        height={32}
                        loading="lazy"
                        className="scale-110"
                      />
                    ) : null}
                    {selected ? (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                        ✓
                      </span>
                    ) : null}
                  </span>
                  {layout === "full" && <span className="text-zinc-400">{p.id}</span>}
                  {layout === "full" ? (
                    <span className="truncate capitalize">{p.name}</span>
                  ) : (
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="truncate capitalize">{p.name}</span>
                      <TypeBadges types={p.types} />
                    </div>
                  )}
                  {layout === "full" && <TypeBadges types={p.types} />}
                  {STAT_KEYS.map((key) => (
                    <span
                      key={key}
                      className={`w-fit rounded px-1 ${
                        boldStats.has(key)
                          ? "bg-emerald-100 font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : ""
                      }`}
                    >
                      {p[key]}
                    </span>
                  ))}
                  <span className="font-medium">{statTotal(p)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeBadges({ types }: { types: PokemonCardData["types"] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => (
        <TypeBadge key={type} type={type} />
      ))}
    </div>
  );
}
