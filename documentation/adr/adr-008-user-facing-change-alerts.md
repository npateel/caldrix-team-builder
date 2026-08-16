# User-facing change alerts

## Problem statement

Task 2 requires that "if a user's own team Pokémon changed within the last
7 days, show a frontend alert describing the change." adr-006 built the
scan job and `changes` log at `/admin/changes`, but that's admin-only -- a
regular user had no way to see it. Also needed: a way to demo this
end-to-end, since real PokéAPI data essentially never changes day to day.

## Proposed solution

- `src/server/team-changes.ts`: `getRecentTeamChanges(userId)` joins
  `changes` -> `pokemon` -> `team_pokemon` -> `teams`, grouped by team
  (mirrors `getRosters`). Requires `detectedAt` within the last 7 days
  *and* after `team_pokemon.added_at` for that team -- without the second
  condition, adding a pokemon whose change another team had already seen
  would surface a stale alert the user never actually witnessed on their
  own roster.
- `team_pokemon.added_at` (migration `0005`) is stamped to `now` on every
  roster PUT, for every pokemon in the new list -- a PUT always rewrites
  the whole roster (full delete + reinsert, see the route), so this
  tracks "last time this roster was saved with this pokemon on it," not
  strictly "first joined." Pre-migration rows got `now()` at migration
  time, since their true add time isn't known.
- `src/lib/consolidate-team-changes.ts`: nets every change to a pokemon's
  field within the window into one before/after pair (earliest old value,
  latest new value) instead of one row per detected diff. A field that
  round-trips back to its start (e.g. attack 87 -> 80 -> 87) nets to no
  real change and is dropped.
- `src/components/teams/team-change-badge.tsx`: a warning icon next to
  each team's name on `/`, shown only for teams with recent changes.
  Hover reveals a "View details" link (gated to real hover-capable
  devices -- mobile browsers simulate `:hover` on a first tap); the icon
  is also directly clickable as the touch/keyboard fallback. Either opens
  a centered `<dialog>` with an old/new table per changed pokemon. No
  read/dismissed state -- `changes` has nowhere to track that per-user,
  and the 7-day window rolls entries off on its own.
- Demo mechanism: `src/server/simulate-change.ts` (an admin-only
  `/api/admin/simulate-change` route plus a button on `/admin/changes`)
  desyncs one of the admin's own team pokemon's cached `attack` from its
  live value. Both "Run scan now" and "Reseed cache now" are real
  detection code paths that will catch it -- `diffPokemon`
  (`src/lib/pokemon-diff.ts`) is shared by both jobs so neither can
  silently miss a change the other would have caught.

## Alternatives

1. Insert a fabricated row directly into `changes` for the demo instead
   of going through the real scan/reseed jobs -- simpler, but proves
   nothing about whether the detection pipeline actually works.
2. A single banner listing every team's changes, or a per-team hover
   tooltip listing full detail -- both tried first. The banner doesn't
   scale once several teams have several changes each; a tooltip is the
   wrong place for a growing list and leaves no room for an old/new
   comparison.
3. Alerts on each team's own detail page instead of next to its name in
   the home list -- more contextual once already there, but `/` is the
   first thing a user sees, and a per-team-page alert needs its own
   placement decision for no real benefit over the icon.
4. A `changes_seen` table for dismissible alerts -- more typical for a
   real notifications feature, but adds a migration and read-state
   bookkeeping for a requirement that only asks for the alert to show up.
5. Show every individual detected diff instead of netting per field --
   matches `/admin/changes`' log exactly, but a value that round-tripped
   back to itself isn't a real change and would be misleading to show as
   one.
6. `teams.updatedAt` instead of a new per-pokemon `added_at` column -- no
   migration needed, but wrong granularity: team-wide, so removing one
   pokemon would bump it and suppress alerts for every other long-standing
   pokemon on that team.
