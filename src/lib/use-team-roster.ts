import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRosterDragReorder } from "./use-roster-drag-reorder";

export const MAX_TEAM_SIZE = 6;

// Roster mutation state shared by the desktop and mobile roster panels --
// every edit (add/remove/reorder) goes through the same PUT and shares one
// `pending`/`error` pair so simultaneous clicks can't race.
export function useTeamRoster(teamId: string, rosterIds: number[]) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateRoster(pokemonIds: number[]) {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/teams/${teamId}/pokemon`, {
      method: "PUT",
      body: JSON.stringify({ pokemonIds }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to update roster");
      return;
    }
    router.refresh();
  }

  function movePokemon(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rosterIds.length) return;
    const ids = [...rosterIds];
    [ids[index], ids[target]] = [ids[target], ids[index]];
    updateRoster(ids);
  }

  function removePokemon(index: number) {
    updateRoster(rosterIds.filter((_, i) => i !== index));
  }

  // Click-to-toggle from the pokedex picker: add if there's room, remove if
  // it's already on the team.
  function togglePokemon(pokemonId: number) {
    if (rosterIds.includes(pokemonId)) {
      updateRoster(rosterIds.filter((id) => id !== pokemonId));
      return;
    }
    if (rosterIds.length >= MAX_TEAM_SIZE) {
      setError(`Team is full (max ${MAX_TEAM_SIZE})`);
      return;
    }
    updateRoster([...rosterIds, pokemonId]);
  }

  const drag = useRosterDragReorder((from, to) => {
    const ids = [...rosterIds];
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    updateRoster(ids);
  });

  return { pending, error, movePokemon, removePokemon, togglePokemon, drag };
}
