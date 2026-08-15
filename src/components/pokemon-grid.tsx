"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { PokemonCard, type PokemonCardData } from "./pokemon-card";

const MIN_CARD_WIDTH = 200;
const GAP = 16;
const ROW_HEIGHT_ESTIMATE = 220;

// Always renders `pokemon` in the order given -- sorting/filtering is the
// caller's job (see PokemonBrowser).
export function PokemonGrid({ pokemon }: { pokemon: PokemonCardData[] }) {
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
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const start = virtualRow.index * columnCount;
          const rowItems = pokemon.slice(start, start + columnCount);
          return (
            <div
              key={virtualRow.key}
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
                <PokemonCard key={p.id} pokemon={p} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
