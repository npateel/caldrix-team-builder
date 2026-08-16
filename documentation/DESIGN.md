# Design Decisions & Assumptions

## Stack

Next.js on Vercel, Neon serverless Postgres + Drizzle, Auth.js v5
(GitHub/Google, JWT sessions). Optimized for time-to-deploy over scale
given the take-home's ~week lifespan.

## Data model

`pokemon`/`moves` are cached locally from PokéAPI (typed stat columns,
not JSON, so the counter-team algorithm can sort/compare in SQL), so
team-building never hits the external API directly. `teams`/
`team_pokemon` track rosters with a `position` column for order-aware
add/remove/reorder. Users start as an anonymous cookie-assigned row so
`teams.user_id` was a real FK from day one -- adding OAuth later was one
helper change, not a schema migration.

## Counter-team algorithm

Greedy: slot 0 counters the enemy's first Pokémon, remaining slots cover
its types while avoiding shared weaknesses across the team
(`src/lib/counter-team.ts`). An exhaustive search would be more optimal
but isn't worth the complexity here.

## Task 2 -- change detection & alerts

A scan job refetches team Pokémon on a schedule and logs field-level
diffs. A banner on `/` shows changes to the signed-in user's own team
Pokémon from the last 7 days, netted into one before/after pair per field
so round-trip changes don't falsely alert.

**To demo**: real PokéAPI data rarely changes day-to-day, so
`/admin/changes` has a "Simulate a change" button that writes a fake diff
through the same alert path.

## Assumptions

- Team size capped at 6, order-aware.
- A "change" alert requires the diff to be within 7 days *and* after the
  Pokémon was added to that roster, so another team's already-seen change
  can't surface as stale/new on a roster built later.
- OAuth is optional; anonymous users get persistent teams via cookie,
  re-pointed onto the account on sign-in.
- Admin access is granted by hand (flip a DB column) -- fine for a
  handful of admins on a take-home.

## With more time

- Weighted/exhaustive search for counter-team selection.
- Self-serve admin promotion flow.
- Faster-than-hourly scan trigger for quicker demo feedback.
