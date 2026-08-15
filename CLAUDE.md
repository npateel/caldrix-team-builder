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

## Open items (not yet decided)
- Testing framework.
- DB schema.
- Counter-team algorithm details.

@AGENTS.md
