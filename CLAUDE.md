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

## Decided (previously open items)
- Testing framework: Vitest, with manual `__mocks__` for `@/db` and
  `@/server/user` so route tests don't need a live database.
- DB schema: see adr-004 (core), adr-005 (OAuth tables), adr-006 (admin +
  Task 2 scan), adr-007 (daily reseed).
- Counter-team algorithm: greedy, slot-0 pinned to the enemy's first
  Pokémon, remaining slots avoid stacking shared weaknesses. See
  `src/lib/counter-team.ts`.
- Task 2's user-facing alert (previously the one open item -- now built,
  see adr-008): a banner on `/` for pokemon changed on the signed-in
  user's own teams in the last 7 days, plus a "Simulate a change (demo)"
  button on `/admin/changes` so it's demoable without waiting for real
  PokéAPI data to change.

@AGENTS.md
