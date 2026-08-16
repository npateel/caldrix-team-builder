import { useEffect, useMemo, useState } from "react";
import type { PokemonCardData } from "./pokemon-stats";

// Fetches the "optimal counter team" for the given roster, refetching only
// when the roster's *composition* changes.
export function useCounterTeam(teamId: string, rosterIds: number[]) {
  const [counterTeam, setCounterTeam] = useState<PokemonCardData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorted (order-independent) so reordering the roster doesn't retrigger
  // this -- only actual composition changes (add/remove) should.
  const rosterCompositionKey = useMemo(() => [...rosterIds].sort((a, b) => a - b).join(","), [rosterIds]);

  useEffect(() => {
    if (rosterIds.length === 0) return;

    let cancelled = false;
    setLoading(true);
    fetch(`/api/teams/${teamId}/counter`)
      .then(async (res) => ({ ok: res.ok, body: await res.json().catch(() => null) }))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body?.error ?? "Failed to generate counter team");
          setCounterTeam(null);
        } else {
          setCounterTeam(body.counterTeam);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterCompositionKey, teamId]);

  // Derived rather than cleared from the effect above: an empty roster has no
  // counter team, and clearing it with setState in an effect body is exactly
  // the cascading render react-hooks/set-state-in-effect warns about. This
  // also stops "Generating…" sticking around when the roster empties
  // mid-request, since that request's own cleanup suppresses its state
  // updates.
  const displayedCounterTeam = rosterIds.length > 0 ? counterTeam : null;
  const showLoading = rosterIds.length > 0 && loading;

  return { counterTeam: displayedCounterTeam, loading: showLoading, error };
}
