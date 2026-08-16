import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { AdminTable, AdminTableHead, AdminTh, AdminTr } from "@/components/admin/table";
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
        <div className="flex items-center gap-2">
          <ActionButton
            url="/api/admin/simulate-change"
            label="Simulate a change (demo)"
            pendingLabel="Simulating…"
            summaryTemplate="Bumped {pokemonName}'s {field} {oldValue} → {newValue} -- run a scan to detect it"
            errorMessage="Simulate failed"
          />
          <ActionButton
            url="/api/cron/scan-changes"
            label="Run scan now"
            pendingLabel="Scanning…"
            summaryTemplate="Checked {checked}, {changed} changed"
            errorMessage="Scan failed"
          />
        </div>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Only pokemon currently on at least one team are scanned (see adr-006). Showing the most recent 200 changes.
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Real PokéAPI data rarely changes day to day -- &quot;Simulate a change&quot; desyncs one of your own team
        pokemon&apos;s cached stat from its live value so &quot;Run scan now&quot; has something genuine to detect.
        Check your{" "}
        <Link href="/" className="underline">
          home page
        </Link>{" "}
        afterward for the resulting alert.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No changes detected yet.</p>
      ) : (
        <AdminTable className="max-w-3xl">
          <AdminTableHead>
            <tr>
              <AdminTh>Detected</AdminTh>
              <AdminTh>Pokémon</AdminTh>
              <AdminTh>Field</AdminTh>
              <AdminTh>Old</AdminTh>
              <AdminTh>New</AdminTh>
            </tr>
          </AdminTableHead>
          <tbody>
            {rows.map(({ change, pokemonName }) => (
              <AdminTr key={change.id}>
                <td className="py-1.5 pr-4">{change.detectedAt.toLocaleString()}</td>
                <td className="py-1.5 pr-4 capitalize">{pokemonName ?? `#${change.entityId}`}</td>
                <td className="py-1.5 pr-4">{change.field}</td>
                <td className="py-1.5 pr-4 text-zinc-500 dark:text-zinc-400">{change.oldValue}</td>
                <td className="py-1.5 pr-4 font-medium">{change.newValue}</td>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
