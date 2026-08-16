"use client";

import { useMemo, useState } from "react";
import type { TypeName } from "@/lib/type-chart";
import { AdminTable, AdminTableHead, AdminTh, AdminTr } from "./table";
import { TypeBadge } from "../type-badge";

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
        <AdminTable className="max-w-3xl">
          <AdminTableHead>
            <tr>
              <AdminTh>Name</AdminTh>
              <AdminTh>Type</AdminTh>
              <AdminTh>Class</AdminTh>
              <AdminTh>Power</AdminTh>
              <AdminTh>Last fetched</AdminTh>
            </tr>
          </AdminTableHead>
          <tbody>
            {filtered.map((move) => (
              <AdminTr key={move.id}>
                <td className="py-1.5 pr-4 capitalize">{move.name}</td>
                <td className="py-1.5 pr-4">
                  <TypeBadge type={move.type} />
                </td>
                <td className="py-1.5 pr-4 capitalize">{move.damageClass}</td>
                <td className="py-1.5 pr-4">{move.power ?? "—"}</td>
                <td className="py-1.5 pr-4">{move.lastFetchedAt.toLocaleDateString()}</td>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
