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
  given user's own teams and `detectedAt` within the last 7 days, grouped
  by team (mirrors `getRosters`' `Map<teamId, ...>` shape). One row per
  (change, team) pair before grouping -- if the same pokemon sits on two
  of a user's teams, both get their own alert.
- `src/components/teams/team-change-badge.tsx`: a small warning icon next
  to each team's name on the home page (`/`), shown only for teams with
  recent changes. Hovering (or focusing, for keyboard users) reveals a
  popover with a "View details" link; clicking it -- or the icon itself,
  which stays independently clickable as the keyboard/touch fallback --
  opens a `<dialog>`, centered on screen, with the actual detail: one
  old/new table per changed pokemon, old on the left and new on the right.
  The popover isn't `pointer-events-none` like a plain tooltip -- it needs
  to stay open while the mouse travels from the icon onto the link inside
  it, which works because CSS keeps an element's `:hover` state active for
  as long as the pointer is over it or any pointer-events-enabled
  descendant, regardless of that descendant's own position. Both the icon
  and the inner link are nested inside the team card's own link, so both
  are `role="button"` spans (a real `<button>` nested inside an `<a>`
  behaves badly) with `stopPropagation`/`preventDefault` so clicking
  either opens the dialog instead of navigating the card, plus their own
  keydown handling since a non-native button doesn't get Enter/Space
  activation for free. No
  read/dismissed state -- `changes` has nowhere to track that per-user,
  and the 7-day window already rolls entries off on its own. No separate
  mobile handling needed: touch has no hover, so the prompt just never
  appears there and a tap goes straight to the click handler -- the
  natural touch equivalent of "hover, then click."
- `src/lib/consolidate-team-changes.ts`: collapses every change to a given
  pokemon's field within the 7-day window into one net before/after pair
  (earliest recorded old value vs. latest new value), rather than showing
  one row per detected diff. A field that round-trips back to its
  starting value within the window (e.g. attack 87 -> 80 -> 87) nets to no
  real change and is dropped entirely; a pokemon left with no surviving
  fields is dropped too.
- Demo mechanism (`src/server/simulate-change.ts`, wired to a new
  admin-only `/api/admin/simulate-change` route and a "Simulate a change
  (demo)" button on `/admin/changes`): deliberately bumps one of the
  admin's own team pokemon's cached `attack` stat by 5, desyncing it from
  the live PokéAPI value. Running the existing "Run scan now" (or "Reseed
  cache now" -- see the update below) afterward then does its normal,
  completely unmodified job -- fetches live data, finds the (now genuine)
  discrepancy between cache and source, logs it to `changes`, and writes
  the cache back to the true value. The detection and alerting code path
  being exercised is 100% production code; only the starting discrepancy
  is artificial. Scoped to the admin's own teams so the resulting alert
  shows up on their own home page immediately.

Design iteration: the alert UI went through two earlier shapes before
this one -- first a single banner at the top of `/` listing every team's
changes at once (didn't scale once several teams had several changes
each, and a pokemon with 3 changed stats read as 3 separate lines), then
a per-team icon whose hover tooltip listed the same one-line-per-field
detail (readable for one or two fields, but a tooltip is the wrong place
for a growing list, and doesn't leave room for the old/new comparison
this settled on).

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

## Update: alerts weren't scoped to when the pokemon actually joined the team

Found separately: `getRecentTeamChanges` only checked whether a pokemon
was *currently* on one of the user's teams and whether the change was
detected in the last 7 days -- not whether the pokemon was already on
that team *when the change happened*. So creating a new team and adding a
pokemon someone else had owned (and that PokéAPI had changed) a few days
earlier would show an alert for a change the user never actually saw
happen on their own roster.

Fix: added `team_pokemon.added_at` (migration `0005`), stamped `now()` on
insert. The tricky part is that the roster PUT route always does a full
delete-and-reinsert of a team's `team_pokemon` rows (see the route's own
comment for why), so naively inserting with a fresh `defaultNow()` would
reset every pokemon's `addedAt` on *any* roster edit, including a plain
reorder. `buildRosterRows` (`src/server/team-roster.ts`) fixes that: it
reads each pokemon's existing `addedAt` before the delete and carries it
forward for anything still on the roster, only stamping `now()` for a
pokemonId that wasn't there before. `getRecentTeamChanges` then adds
`changes.detectedAt >= team_pokemon.added_at` to its `WHERE` clause.
Existing rows before the migration all get `addedAt = now()` at migration
time (no way to know their true historical add time), which is a one-time
imprecision for pre-existing rosters, not an ongoing one.

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
4. Show every individual detected diff rather than netting per-field
   changes down to one before/after pair. More literal (matches
   `/admin/changes`' log exactly), but for a user-facing alert the net
   effect -- "this is different from what you last saw" -- is what
   actually matters, and showing a value that round-tripped back to
   itself as a "change" would be actively misleading.
5. Use `teams.updatedAt` (already bumped on every roster PUT) instead of a
   new per-pokemon `added_at` column. No migration needed, but it's the
   wrong granularity -- it's team-wide, so removing one pokemon would
   bump it and make every *other* pokemon on that team look freshly
   added too, suppressing alerts for changes to pokemon that had been on
   the roster for months.
