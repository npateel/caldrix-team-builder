"use client";

import { TriangleAlert, X } from "lucide-react";
import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import { TypeBadge } from "@/components/type-badge";
import { consolidateTeamChanges } from "@/lib/consolidate-team-changes";
import type { TypeName } from "@/lib/type-chart";
import type { TeamChangeAlert } from "@/server/team-changes";

// `types` diffs store their old/new value as a comma-joined type list
// (see diffPokemon/simulateStatDrift) -- render those as the same colored
// pills used everywhere else, instead of raw text.
function ChangeValue({ field, value }: { field: string; value: string | null }) {
  if (field !== "types" || value === null) return <>{value}</>;
  return (
    <span className="flex flex-wrap gap-1">
      {value.split(",").map((type) => (
        <TypeBadge key={type} type={type as TypeName} size="xs" />
      ))}
    </span>
  );
}

// Task 2's per-team change alert: a warning icon whose hover popover (or,
// on touch/keyboard, a direct tap/Enter) opens a centered dialog with the
// old-vs-new detail.
//
// The hover popover is gated behind `@media (hover: hover)` -- ungated
// `:hover` gets simulated by mobile browsers on a first tap, which would
// eat that tap instead of firing the click. It's also not
// pointer-events-none and sits flush against the icon (no `ml-*` gap), so
// the mouse can travel from icon to link without `:hover` dropping
// mid-transit -- a real gap is a dead zone `:hover` has no grace period
// for.
//
// Everything here (icon, link, dialog) is nested inside the team card's
// own `<Link>`, which browsers handle badly with a real nested `<button>`.
// Triggers are `role="button"` spans instead, and every open/close path
// (click, keydown, backdrop click, close button) calls stopPropagation/
// preventDefault so it doesn't also navigate the card -- including dialog
// close, since `<dialog>` only escapes the DOM visually (top layer), not
// for event bubbling.
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

  // Both the icon and the "View details" link open the dialog the same
  // way -- shared here so there's one place to update if a third trigger
  // (or a new handler) is ever added.
  const triggerProps = { role: "button" as const, tabIndex: 0, onClick: openDialog, onKeyDown: handleKeyDown };

  return (
    <>
      <span
        {...triggerProps}
        aria-label="Pokémon on your team have changed. Click for more details."
        className="group/badge relative inline-flex shrink-0 cursor-pointer p-1.5 outline-none"
      >
        <TriangleAlert size={14} className="text-amber-600 dark:text-amber-400" />
        <span className="absolute left-full top-1/2 z-20 hidden w-56 -translate-y-1/2 flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-left text-xs normal-case text-amber-900 shadow-lg [@media(hover:hover)]:group-hover/badge:flex group-focus-visible/badge:flex dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span>Pokémon on your team have changed.</span>
          <span
            {...triggerProps}
            className="w-fit cursor-pointer font-medium text-violet-600 underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
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
                      <th className="pb-1 text-left font-medium">Detected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pokemon.fields.map((f) => (
                      <tr key={f.field} className="border-t border-black/5 dark:border-white/5">
                        <td className="py-1 pr-3 capitalize">{f.field}</td>
                        <td className="py-1 pr-3 text-zinc-500 dark:text-zinc-400">
                          <ChangeValue field={f.field} value={f.oldValue} />
                        </td>
                        <td className="py-1 pr-3 font-medium">
                          <ChangeValue field={f.field} value={f.newValue} />
                        </td>
                        <td className="py-1 text-zinc-500 dark:text-zinc-400">{f.detectedAt.toLocaleDateString()}</td>
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
