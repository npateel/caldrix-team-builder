import { TriangleAlert } from "lucide-react";
import { groupChangesByEvent } from "@/lib/group-team-changes";
import type { TeamChangeAlert } from "@/server/team-changes";

// Task 2's user-facing alert, scoped to one team -- a small warning icon
// next to the team name (rather than one banner listing every team's
// changes at once, which doesn't scale once several teams have several
// changes each) whose hover/focus tooltip lists what changed. Pure CSS
// (group-hover/group-focus), no client JS needed. `title` is a plain-text
// fallback for anywhere the styled tooltip doesn't apply (e.g. some
// screen readers, long-press on mobile).
export function TeamChangeBadge({ alerts }: { alerts: TeamChangeAlert[] }) {
  if (alerts.length === 0) return null;

  const events = groupChangesByEvent(alerts);
  const summary = events
    .map((event) => `${event.pokemonName}: ${event.fields.map((f) => `${f.field} ${f.oldValue}→${f.newValue}`).join(", ")}`)
    .join("\n");

  return (
    <span
      tabIndex={0}
      title={summary}
      aria-label={`${events.length === 1 ? "1 pokémon" : `${events.length} pokémon`} changed recently: ${summary}`}
      className="group/badge relative inline-flex shrink-0 outline-none"
    >
      <TriangleAlert size={14} className="text-amber-600 dark:text-amber-400" />
      <span
        className="pointer-events-none absolute left-full top-1/2 z-20 ml-1.5 hidden w-64 -translate-y-1/2 flex-col gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-left text-xs normal-case text-amber-900 shadow-lg group-hover/badge:flex group-focus-visible/badge:flex dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        {events.map((event) => (
          <span key={`${event.pokemonId}-${event.detectedAt.toISOString()}`}>
            <span className="font-medium capitalize">{event.pokemonName}</span>:{" "}
            {event.fields.map((f) => `${f.field} ${f.oldValue}→${f.newValue}`).join(", ")}
          </span>
        ))}
      </span>
    </span>
  );
}
