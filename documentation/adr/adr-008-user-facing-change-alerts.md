# User-facing change alerts

## Problem statement

Task 2 requires that "if a user's own team Pokémon changed within the last
7 days, show a frontend alert describing the change." adr-006 built the
scan job and the `changes` log, surfaced at `/admin/changes` -- but that's
admin-only. A regular signed-in user had no way to see that a Pokémon on
their own team changed. Also needed: a way to actually *demo* this working
end-to-end, since real PokéAPI data essentially never changes day to day,
so there's no way to trigger a genuine detected change on demand.

## Proposed solution

- `src/server/team-changes.ts`: `getRecentTeamChanges(userId)` joins
  `changes` -> `pokemon` -> `team_pokemon` -> `teams`, filtered to the
  given user's own teams and `detectedAt` within the last 7 days. One row
  per (change, team) pair -- if the same pokemon sits on two of a user's
  teams, both get their own alert, since the change is independently
  relevant to each.
- `src/components/teams/change-alerts.tsx`: a plain banner rendering that
  list, shown at the top of the home page (`/`) when non-empty. No
  read/dismissed state -- `changes` has nowhere to track that per-user, and
  the 7-day window already rolls entries off on its own.
- Demo mechanism (`src/server/simulate-change.ts`, wired to a new
  admin-only `/api/admin/simulate-change` route and a "Simulate a change
  (demo)" button on `/admin/changes`): deliberately bumps one of the
  admin's own team pokemon's cached `attack` stat by 5, desyncing it from
  the live PokéAPI value. Running the existing "Run scan now" afterward
  then does its normal, completely unmodified job -- fetches live data,
  finds the (now genuine) discrepancy between cache and source, logs it to
  `changes`, and writes the cache back to the true value. The detection
  and alerting code path being exercised is 100% production code; only the
  starting discrepancy is artificial. Scoped to the admin's own teams so
  the resulting alert shows up on their own home page immediately.

## Alternatives

1. Insert a fabricated row directly into `changes` for the demo, instead
   of going through the real scan job. Simpler, but proves nothing about
   whether the actual detection pipeline works -- exactly the kind of
   "testing the mock" this is trying to avoid at the feature level.
2. Show alerts per-team on each team's own detail page instead of one
   global banner on `/`. More contextual, but `/` already lists every team
   the user has and is the first thing they see after signing in --
   splitting alerts across N team pages makes them easier to miss and
   doesn't reduce the amount of code much, since the per-team query is a
   strict subset of the global one.
3. Add a `changes_seen` table (or a per-user `last_seen_at` marker) so
   alerts can be dismissed. More typical for a real notifications feature,
   but adds a schema migration and read-state bookkeeping for a
   requirement that only asks for the alert to *show up*, not to be
   dismissible. The 7-day window already bounds how long a stale alert
   lingers.
