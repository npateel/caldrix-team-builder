"use client";

import { useMemo, useState } from "react";
import type { TypeName } from "@/lib/type-chart";
import { TYPE_COLORS } from "@/lib/type-colors";

export type MoveRow = {
  id: number;
  name: string;
  type: TypeName;
  power: number | null;
  damageClass: "status" | "physical" | "special";
  lastFetchedAt: Date;
};

export function AdminMovesTable({ moves }: { moves: MoveRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? moves.filter((m) => m.name.includes(query)) : moves;
  }, [moves, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <input
        type="search"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length} of {moves.length} moves
      </p>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full max-w-3xl text-left text-sm">
          <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Class</th>
              <th className="py-2 pr-4 font-medium">Power</th>
              <th className="py-2 pr-4 font-medium">Last fetched</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((move) => (
              <tr key={move.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-1.5 pr-4 capitalize">{move.name}</td>
                <td className="py-1.5 pr-4">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize text-white"
                    style={{ backgroundColor: TYPE_COLORS[move.type] }}
                  >
                    {move.type}
                  </span>
                </td>
                <td className="py-1.5 pr-4 capitalize">{move.damageClass}</td>
                <td className="py-1.5 pr-4">{move.power ?? "—"}</td>
                <td className="py-1.5 pr-4">{move.lastFetchedAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
