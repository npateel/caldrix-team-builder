# Admin portal

## Problem statement

Need a `/admin` area to view/manage DB contents (users, teams, the pokemon/
moves cache, and Task 2's change log), gated so it isn't reachable by any
signed-in user.

## Proposed solution

- `users.isAdmin` boolean column (default false), checked by a
  `requireAdmin()` helper (`src/server/admin.ts`) that every admin route calls.
  No self-serve way to become an admin -- flip the column by hand (db:studio
  or a one-off query) for whoever needs access. Reasonable for a take-home
  with a handful of admins; a real product would want an invite/promotion
  flow.
- `requireAdmin()` calls `notFound()` (404), not a 403/redirect-to-login,
  when the check fails -- doesn't reveal that `/admin` exists to non-admins.
- Admin routes are plain Server Components reading straight from the DB
  (same pattern as the main pokedex page) rather than a separate admin API
  layer, except where an action is needed (delete user/team, trigger a
  scan) -- those get their own `/api/admin/*` routes, also gated by
  `requireAdmin()`.
- Admin delete routes for teams don't reuse the existing
  `/api/teams/[teamId]` DELETE route -- that route intentionally scopes
  deletes to the requesting user's own teams (ownership check via
  `session.user.id`). An admin deleting *someone else's* team needs a
  separate route without that check, gated by admin-ness instead of
  ownership.
- Building the admin "changes" view surfaced that Task 2's actual scan job
  didn't exist yet (only the empty `changes` table did) -- built as part of
  this work rather than stubbing the admin view against nothing. See the
  scan-changes implementation notes below.
- Scan job scope: only pokemon currently referenced by at least one
  `team_pokemon` row are refetched live from PokéAPI, not the full ~1300
  cached pokemon. This narrows adr-004's original "refresh everything,
  log changes for team pokemon" plan -- refetching the whole cache inside a
  request/cron-triggered serverless function risks execution time limits
  and hammers PokéAPI for no benefit, since Task 2 only cares about pokemon
  actually on a team. Bulk cache refresh is still what the local
  `seed:fetch`/`db:seed` pipeline is for. Move-level diffing is left out of
  this pass too, consistent with moves being lower priority throughout.
- The scan route (`/api/cron/scan-changes`) accepts either a Vercel Cron
  request (validated via `CRON_SECRET`) or an authenticated admin session,
  so the same route serves the scheduled job and the admin panel's manual
  "run scan now" button -- one implementation, two triggers.

## Alternatives

1. Redirect non-admins to `/login` or return 403 instead of 404 -- more
   conventional, but confirms `/admin` exists to anyone who tries it.
2. Role enum instead of a boolean -- more room to grow (e.g. moderator vs
   admin), but there's only one tier of access needed right now.
3. Reuse the existing per-user team routes for admin deletes by adding an
   `isAdmin` bypass inside them -- less new code, but mixes "acting as
   yourself" and "acting as an admin on someone else's data" into the same
   route/auth check, which is easy to get wrong. Separate routes keep the
   two concerns apart.
