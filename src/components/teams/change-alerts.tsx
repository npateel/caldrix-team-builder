import type { TeamChangeAlert } from "@/server/team-changes";

// Task 2's user-facing surface: pokemon on the signed-in user's own teams
// that PokéAPI changed within the last 7 days (see getRecentTeamChanges).
// Purely informational -- no dismiss/read state, since `changes` has
// nowhere to track that per-user and the window naturally rolls off after
// 7 days anyway.
export function ChangeAlerts({ alerts }: { alerts: TeamChangeAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
        {alerts.length === 1 ? "A pokémon on your team changed recently" : "Pokémon on your teams changed recently"}
      </p>
      <ul className="flex flex-col gap-1 text-sm text-amber-800 dark:text-amber-300">
        {alerts.map((alert) => (
          <li key={`${alert.id}-${alert.teamId}`}>
            <span className="font-medium capitalize">{alert.pokemonName}</span>&apos;s {alert.field} changed from{" "}
            <span className="font-medium">{alert.oldValue}</span> to <span className="font-medium">{alert.newValue}</span>{" "}
            on <span className="font-medium">{alert.teamName}</span>
            <span className="text-amber-700 dark:text-amber-400"> · {alert.detectedAt.toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
