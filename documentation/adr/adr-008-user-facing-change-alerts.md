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
- `src/components/teams/team-change-badge.tsx`: a small warning icon next
  to each team's name on the home page (`/`), shown only for teams with
  recent changes, with a hover/focus tooltip listing what changed (see the
  UI update below for why this replaced an earlier banner design). No
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

## Update: reseed was silently erasing undetected changes

Found while using the demo mechanism above: clicking "Reseed cache now"
(adr-007) instead of "Run scan now" after "Simulate a change" made the
simulated discrepancy disappear with no alert -- reseed's upsert
unconditionally overwrites every field with the fresh PokéAPI value,
including whatever a real change would have left behind, and it never
touched `changes`. Outside the demo, this meant a genuine change to a team
pokemon could get silently wiped by reseed (which runs daily) before the
hourly scan job ever got a chance to detect and log it.

Fix: `diffPokemon` (previously private to scan-changes.ts) moved to
`src/lib/pokemon-diff.ts` so both jobs use identical change-detection
logic. `reseed.ts` now has `recordTeamPokemonChanges`, called with the
freshly-fetched rows *before* the upsert overwrites the cache -- same
team-pokemon scope as scan-changes.ts (adr-006), reusing the fresh data
reseed already fetched rather than making its own PokéAPI calls. Both jobs
now agree: whichever one happens to run first catches the change.

## Update: banner didn't scale, replaced with per-team warning badges

The first version was a single banner at the top of `/` listing every
changed pokemon across every team, one line per changed field. Two
problems in practice: it doesn't scale -- once several teams each have
several changes, the banner dominates the page above the team list it's
supposed to be annotating -- and a pokemon with 3 changed stats produced 3
separate lines instead of reading as one event.

Replaced with `TeamChangeBadge`: a small `TriangleAlert` icon next to each
team's name, shown only when that team has recent changes, sized to not
disrupt the layout regardless of how many teams have alerts. Hovering (or
focusing, for keyboard/touch users) reveals a tooltip with the details,
scoped to just that team. `src/lib/group-team-changes.ts` collapses
multiple field-diff rows for the same pokemon from the same scan/reseed
run (same `detectedAt`, since a single multi-row `INSERT` gets one
`now()`) into one line -- "bulbasaur: attack 49→55, hp 45→50" instead of
two. Pure CSS tooltip (`group-hover`/`group-focus-visible`), no client JS.

## Alternatives

1. Insert a fabricated row directly into `changes` for the demo, instead
   of going through the real scan job. Simpler, but proves nothing about
   whether the actual detection pipeline works -- exactly the kind of
   "testing the mock" this is trying to avoid at the feature level.
2. Show alerts on each team's own detail page instead of next to its name
   in the home page list. More contextual once you're already on that
   team's page, but `/` is the first thing a user sees after signing in,
   and the badge only costs one icon per team card -- a per-team-page
   alert would need its own placement decision on that page too, for no
   real benefit over just glancing at the icon from the team list.
3. Add a `changes_seen` table (or a per-user `last_seen_at` marker) so
   alerts can be dismissed. More typical for a real notifications feature,
   but adds a schema migration and read-state bookkeeping for a
   requirement that only asks for the alert to *show up*, not to be
   dismissible. The 7-day window already bounds how long a stale alert
   lingers.
