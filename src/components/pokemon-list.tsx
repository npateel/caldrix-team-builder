"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { TYPE_COLORS } from "@/lib/type-colors";
import { highestStatKeys, STAT_KEYS } from "@/lib/pokemon-stats";
import type { PokemonCardData } from "./pokemon-card";

export type StatSortKey = "hp" | "attack" | "defense" | "specialAttack" | "specialDefense" | "speed" | "total";
export type SortKey = "id" | "name" | StatSortKey;
export type SortDirection = "asc" | "desc";

const STAT_COLUMNS: { key: StatSortKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Atk" },
  { key: "defense", label: "Def" },
  { key: "specialAttack", label: "SpA" },
  { key: "specialDefense", label: "SpD" },
  { key: "speed", label: "Spe" },
  { key: "total", label: "Total" },
];

// Two layouts: "full" (id + separate types column, desktop) and "compact"
// (name/types merged into one cell, no id -- narrow windows/phones). Which
// one renders is driven by measured container width, not a CSS breakpoint,
// since it also changes cell structure, not just column widths.
const FULL_TEMPLATE = "40px 56px 140px 140px repeat(7, 56px)";
const COMPACT_TEMPLATE = "40px 160px repeat(7, 56px)";
const FULL_TABLE_MAX_WIDTH = 900;
const COMPACT_TABLE_WIDTH = 660;
const LAYOUT_BREAKPOINT = 860;
const ROW_HEIGHT_ESTIMATE = 56;

export function statTotal(p: PokemonCardData): number {
  return p.hp + p.attack + p.defense + p.specialAttack + p.specialDefense + p.speed;
}

export function PokemonList({
  pokemon,
  sortKey,
  sortDirection,
  onSort,
}: {
  pokemon: PokemonCardData[];
  sortKey: SortKey | null;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
              return (
                <div
                  key={p.id}
                  className="grid items-center gap-2 border-b border-black/5 text-sm dark:border-white/5"
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.spriteUrl ? (
                    <img src={p.spriteUrl} alt={p.name} width={32} height={32} loading="lazy" />
                  ) : (
                    <span />
                  )}
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
                      className={
                        boldStats.has(key)
                          ? "w-fit rounded bg-emerald-100 px-1 font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : undefined
                      }
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
        <span
          key={type}
          className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize text-white"
          style={{ backgroundColor: TYPE_COLORS[type] }}
        >
          {type}
        </span>
      ))}
    </div>
  );
}
