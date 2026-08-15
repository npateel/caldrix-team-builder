# DB schema

## Problem statement

Need a Postgres schema (via Drizzle, see adr-003) that supports team building,
multi-team persistence, an eventual multi-user model, and Task 2's data-change
detection -- without building OAuth yet.

## Proposed solution

- `users` -- id (uuid), created_at. Populated via an anonymous cookie-assigned id
  for now, not real OAuth. Keeps `teams.user_id` real from day one so swapping in
  Auth.js later (adr pending) is a link/migrate step, not a schema change.
- `pokemon` -- pokedex_id, name, sprite_url, types (array of a Postgres enum
  covering all 18 Pokémon types plus `stellar`/`unknown`, order preserved for
  primary/secondary), stats as separate typed columns (`hp`, `attack`, `defense`,
  `special_attack`, `special_defense`, `speed`), `last_fetched_at`. Acts as a local
  cache of PokéAPI so team/counter-team queries don't hit the external API.
  Stats are split into columns rather than a json/array blob because the set of
  6 stats is fixed and the counter-team algorithm needs to sort/compare them
  numerically in SQL. Type is an enum rather than free text so bad/misspelled
  type values can't be inserted.
- `moves`, `pokemon_moves` -- moves cached the same way as pokemon, joined
  many-to-many. Lower priority than pokemon but explicitly in scope. Stores
  `type`, `power`, and `damage_class` (status/physical/special -- needed by the
  counter-team algorithm to know whether a move's damage compares against
  `attack`/`special_attack` or is non-damaging). Does not store `pp` -- not
  relevant to team building or the counter algorithm.
- `teams` -- id, user_id (FK), name, created_at, updated_at.
- `team_pokemon` -- team_id, pokemon_id, position (0-5). Position makes ordering
  explicit and caps team size at 6.
- `changes` -- entity_type ('pokemon' | 'move'), entity_id, field, old_value,
  new_value, detected_at. Single generic table rather than separate
  `pokemon_changes` / `move_changes` tables -- one alert query covers both, less
  schema surface for a feature where moves are lower priority.

Cron job behavior: refetches and updates every cached `pokemon` row (keeps the
cache accurate generally), but only inserts into `changes` when the changed
pokemon/move is currently referenced by at least one `team_pokemon` row --
scoped to "currently on any team, across all users", not just the requesting
user, since the job runs globally on a schedule. Alert query joins
`teams` -> `team_pokemon` -> `changes` filtered to the current user and
`detected_at` within the last 7 days.

Type effectiveness data is NOT modeled in the DB -- it's a static, small dataset
better shipped as a frontend JSON asset than queried from Postgres.

## Alternatives

1. JSON/JSONB for pokemon stats -- closer to the raw PokéAPI shape, single
   column, but loses SQL-level type safety and makes numeric comparisons
   (needed for the counter-team algorithm) require jsonb operators instead of
   plain columns.
2. Separate `pokemon_changes` / `move_changes` tables -- more explicit typing,
   but doubles migration/query surface for a feature (move changes) that's
   explicitly lower priority than pokemon changes.
3. Scan and log changes for all cached pokemon regardless of team membership --
   simpler cron logic, but generates alert-irrelevant noise and does more
   PokéAPI calls than the requirement (user's own team pokemon) needs.
4. Hardcoded single demo user instead of anonymous cookie-assigned users --
   simplest for grading, but doesn't exercise real multi-user behavior and
   needs rework once OAuth (see earlier discussion, no ADR yet) lands.
