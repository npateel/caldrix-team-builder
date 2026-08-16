"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import type { PokemonCardData } from "@/lib/pokemon-stats";
import { PokemonCard } from "./pokemon-card";
import { FULL_TABLE_MAX_WIDTH } from "./pokemon-list";

const MIN_CARD_WIDTH = 200;
const GAP = 16;
const ROW_HEIGHT_ESTIMATE = 220;

// Always renders `pokemon` in the order given -- sorting/filtering is the
// caller's job (see PokemonBrowser). `onSelect`/`selectedIds` are optional --
// when given, cards become clickable and show a marker for selected ids
// (used by the team builder's picker column; unused on the plain pokedex).
export function PokemonGrid({
  pokemon,
  onSelect,
  selectedIds,
}: {
  pokemon: PokemonCardData[];
  onSelect?: (id: number) => void;
  selectedIds?: Set<number>;
}) {
  const [columnCount, setColumnCount] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumnCount(Math.max(1, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(pokemon.length / columnCount);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    // Real row height (card height + the pb-4 gap below) doesn't reliably
    // match this estimate, which made rows overlap slightly and swallow
    // their own bottom margin -- measureElement (wired up on each row
    // below) corrects positions from actual rendered height instead of
    // trusting this guess.
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="mx-auto min-h-0 w-full flex-1 overflow-auto"
      style={{ maxWidth: FULL_TABLE_MAX_WIDTH }}
    >
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * columnCount;
          const rowItems = pokemon.slice(start, start + columnCount);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="grid gap-4 pb-4"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              }}
            >
              {rowItems.map((p) => (
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  onClick={onSelect ? () => onSelect(p.id) : undefined}
                  selected={selectedIds?.has(p.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
