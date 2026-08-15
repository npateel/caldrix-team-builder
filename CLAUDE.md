# Pokémon Team Builder

Take-home coding interview case study. Graded primarily on **code quality** —
prefer small diffs, clarify assumptions before acting, and keep communication terse.

## Requirements

### Task 1 — Team Builder
- Responsive grid of all Pokémon (name, type(s), stats, sprite) from PokéAPI.
- Build/persist multiple teams, each up to 6 Pokémon, order-aware (add/remove/reorder).
- Teams persist across sessions.
- Create, update, delete multiple teams via the UI.
- Given a team, generate an "optimal counter team" of equal size (open-ended — use
  type effectiveness: https://pokemondb.net/type).

### Task 2 — Data Change Notifications
- Scheduled job scans PokéAPI for changes to data the app uses.
- If a user's own team Pokémon changed within the last 7 days, show a frontend alert
  describing the change.
- Must be demoable (prove it works end-to-end).

### Task 3 — Technical Document
- One-page `README.md`: key design decisions and assumptions. Separate from this file.

## Deliverables
- Shareable repo with all code + README.
- Frontend hosted at a public URL.

## Stack (decided)
- Next.js (App Router, TypeScript) — single app for frontend + API routes.
- Deployed on Vercel (project `caldrix-team-builder` already linked).
- Neon (Postgres) for storage, via Vercel's native integration.
- Drizzle ORM for schema + migrations.
- Vercel Cron → API route for the Task 2 scan job.

## PokéAPI
Base URL: `https://pokeapi.co/api/v2/`
- `GET /pokemon` — list
- `GET /pokemon/{id}` — `name`, `types[].type.name`, `stats[]`, `sprites.front_default`

## Decided (previously open items)
- Testing framework: Vitest, with manual `__mocks__` for `@/db` and
  `@/lib/user` so route tests don't need a live database.
- DB schema: see adr-004 (core), adr-005 (OAuth tables), adr-006 (admin +
  Task 2 scan), adr-007 (daily reseed).
- Counter-team algorithm: greedy, slot-0 pinned to the enemy's first
  Pokémon, remaining slots avoid stacking shared weaknesses. See
  `src/lib/counter-team.ts`.

## Open items
- Task 2 says a user should see a frontend alert when their own team's
  Pokémon changed in the last 7 days. The scan job and `changes` log exist
  (adr-006) and are visible at `/admin/changes`, but there's no user-facing
  surface for this yet -- a regular (non-admin) user currently has no way to
  see that a Pokémon on their team changed. Still needs building before
  Task 2 is actually complete.

@AGENTS.md
