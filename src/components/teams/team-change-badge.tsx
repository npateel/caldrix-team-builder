"use client";

import { TriangleAlert, X } from "lucide-react";
import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { consolidateTeamChanges } from "@/lib/consolidate-team-changes";
import type { TeamChangeAlert } from "@/server/team-changes";

// Task 2's user-facing alert, scoped to one team -- a small warning icon
// next to the team name (rather than one banner listing every team's
// changes at once, which doesn't scale once several teams have several
// changes each). Hovering (or focusing, for keyboard users) reveals a
// small popover with a "View details" link; clicking it opens a dialog,
// centered on screen, with the actual old-vs-new detail.
//
// The popover is deliberately *not* pointer-events-none like a plain
// tooltip -- it needs to stay open while the mouse travels from the icon
// onto the link inside it. CSS keeps `group-hover/badge` active for as
// long as the pointer is over the icon OR any descendant (the popover
// included) that can receive pointer events, regardless of the
// popover's own position, so this "hover, then move onto the popover
// itself" works without any JS -- as long as the two boxes actually
// touch. There's no `ml-*`/gap between the icon and the popover for
// exactly that reason: `:hover` has no grace period, so a real gap
// between them is a dead zone where the pointer is over neither, and
// the popover vanishes the instant it's crossed, before the mouse ever
// reaches the link. The `px-2.5` on the popover still gives the text
// its own visual breathing room from the icon, just as internal padding
// instead of external margin.
//
// Both the icon and the inner link are nested inside the team card's own
// `<Link>`, so both are `role="button"` spans (not real `<button>`s,
// which browsers handle badly nested inside an `<a>`) with
// stopPropagation/preventDefault so clicking either opens the dialog
// instead of navigating the card, plus their own keydown handling since
// non-native buttons don't get Enter/Space activation for free. The icon
// itself stays independently clickable (not just the link) since it's
// the only thing reachable without hover -- the necessary fallback for
// keyboard and touch, where there's no "hover the icon" step at all.
//
// The same nesting problem applies to *closing* the dialog: `<dialog>`
// only renders in the browser's top layer (paint/stacking), it's still
// a DOM descendant of that same `<Link>` -- so a backdrop click or the
// close button's click bubbles right back up to it too, unless stopped.
// closeDialog carries the same stopPropagation/preventDefault as
// opening it, for that reason.
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

  function closeDialog(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dialogRef.current?.close();
  }

  function closeOnBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target !== dialogRef.current) return;
    closeDialog(e);
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
        <span className="absolute left-full top-1/2 z-20 hidden w-56 -translate-y-1/2 flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-left text-xs normal-case text-amber-900 shadow-lg group-hover/badge:flex group-focus-visible/badge:flex dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span>Pokémon on your team have changed.</span>
          <span
            role="button"
            tabIndex={0}
            onClick={openDialog}
            onKeyDown={handleKeyDown}
            className="w-fit cursor-pointer font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View details
          </span>
        </span>
      </span>

      <dialog
        ref={dialogRef}
        onClick={closeOnBackdropClick}
        className="fixed inset-0 m-auto w-full max-w-md rounded-lg border border-black/10 bg-white p-0 text-black normal-case backdrop:bg-black/40 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
      >
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent changes</h2>
            <button
              type="button"
              onClick={closeDialog}
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
