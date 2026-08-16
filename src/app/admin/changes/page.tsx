import { and, desc, eq } from "drizzle-orm";
import { ActionButton } from "@/components/action-button";
import { db } from "@/db";
import { changes, pokemon } from "@/db/schema";

export default async function AdminChangesPage() {
  const rows = await db
    .select({ change: changes, pokemonName: pokemon.name })
    .from(changes)
    .leftJoin(pokemon, and(eq(changes.entityType, "pokemon"), eq(changes.entityId, pokemon.id)))
    .orderBy(desc(changes.detectedAt))
    .limit(200);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Change log</h1>
        <ActionButton
          url="/api/cron/scan-changes"
          label="Run scan now"
          pendingLabel="Scanning…"
          summaryTemplate="Checked {checked}, {changed} changed"
          errorMessage="Scan failed"
        />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Only pokemon currently on at least one team are scanned (see adr-006). Showing the most recent 200 changes.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No changes detected yet.</p>
      ) : (
        <table className="w-full max-w-3xl text-left text-sm">
          <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="py-2 pr-4 font-medium">Detected</th>
              <th className="py-2 pr-4 font-medium">Pokémon</th>
              <th className="py-2 pr-4 font-medium">Field</th>
              <th className="py-2 pr-4 font-medium">Old</th>
              <th className="py-2 pr-4 font-medium">New</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ change, pokemonName }) => (
              <tr key={change.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-1.5 pr-4">{change.detectedAt.toLocaleString()}</td>
                <td className="py-1.5 pr-4 capitalize">{pokemonName ?? `#${change.entityId}`}</td>
                <td className="py-1.5 pr-4">{change.field}</td>
                <td className="py-1.5 pr-4 text-zinc-500 dark:text-zinc-400">{change.oldValue}</td>
                <td className="py-1.5 pr-4 font-medium">{change.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
