"use client";

import { TriangleAlert, X } from "lucide-react";
import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { consolidateTeamChanges } from "@/lib/consolidate-team-changes";
import type { TeamChangeAlert } from "@/server/team-changes";

// Task 2's user-facing alert, scoped to one team -- a small warning icon
// next to the team name (rather than one banner listing every team's
// changes at once, which doesn't scale once several teams have several
// changes each). Hovering shows a short prompt; clicking opens a dialog
// with the actual old-vs-new detail. Nested inside the team card's own
// `<Link>`, so the trigger is a `role="button"` span (not a real
// `<button>`, which browsers handle badly nested inside an `<a>`) with
// stopPropagation/preventDefault so clicking it opens the dialog instead
// of navigating, plus its own keydown handling for Enter/Space since
// non-native buttons don't get that for free. The `<dialog>` itself
// renders in the browser's top layer regardless of where it sits in the
// DOM, so nesting it inside the anchor doesn't affect its own layout.
//
// No separate mobile treatment needed: touch has no hover, so the CSS
// hover prompt simply never appears there -- a tap goes straight to
// the click handler and opens the dialog, which is the natural touch
// equivalent of "hover, then click" on desktop.
export function TeamChangeBadge({ alerts }: { alerts: TeamChangeAlert[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const changes = consolidateTeamChanges(alerts);

  if (changes.length === 0) return null;

  function openDialog(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dialogRef.current?.showModal();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    dialogRef.current?.showModal();
  }

  function closeOnBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) dialogRef.current?.close();
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        aria-label="Pokémon on your team have changed. Click for more details."
        className="group/badge relative inline-flex shrink-0 cursor-pointer outline-none"
      >
        <TriangleAlert size={14} className="text-amber-600 dark:text-amber-400" />
        <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-1.5 hidden w-56 -translate-y-1/2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-left text-xs normal-case text-amber-900 shadow-lg group-hover/badge:block dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Pokémon on your team have changed. Click for more details.
        </span>
      </span>

      <dialog
        ref={dialogRef}
        onClick={closeOnBackdropClick}
        className="w-full max-w-md rounded-lg border border-black/10 bg-white p-0 text-black normal-case backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent changes</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {changes.map((pokemon) => (
              <div key={pokemon.pokemonId}>
                <p className="mb-1 text-sm font-medium capitalize">{pokemon.pokemonName}</p>
                <table className="w-full text-xs">
                  <thead className="text-zinc-500 dark:text-zinc-400">
                    <tr>
                      <th className="pb-1 text-left font-medium">Field</th>
                      <th className="pb-1 text-left font-medium">Old</th>
                      <th className="pb-1 text-left font-medium">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pokemon.fields.map((f) => (
                      <tr key={f.field} className="border-t border-black/5 dark:border-white/5">
                        <td className="py-1 pr-3 capitalize">{f.field}</td>
                        <td className="py-1 pr-3 text-zinc-500 dark:text-zinc-400">{f.oldValue}</td>
                        <td className="py-1 font-medium">{f.newValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
