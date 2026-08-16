"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { PokemonCardData } from "@/lib/pokemon-stats";
import { useContainerWidth } from "@/lib/use-container-width";
import { PokemonCard } from "./card";
import { FULL_TABLE_MAX_WIDTH } from "./list";

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
  const [parentRef, containerWidth] = useContainerWidth();
  // Derived rather than stored: at containerWidth 0 (pre-measure) this is 1,
  // matching the old initial state.
  const columnCount = Math.max(1, Math.floor((containerWidth + GAP) / (MIN_CARD_WIDTH + GAP)));

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
