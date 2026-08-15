# Plan of attack — Saturday

## Open gaps to fold in
- Task 2 (data-change notifications) wasn't scoped yet — needs its own schema objects
  and affects step 1.
- Counter-team algorithm design.
- README / demo prep (Task 3, and "must be demoable" for Task 2).

## Steps

1. **Schema scoping** — `teams`, `team_pokemon` (ordered join table), plus Task 2's
   needs: a `pokemon_snapshot`/`pokemon_changes` table to diff against on each scan.
2. **DB seeding** — pull/cache the PokéAPI pokemon list+details locally so dev doesn't
   hammer the live API; doubles as Task 2's "before" snapshot.
3. **Counter-team algorithm** — isolated logic (type effectiveness lookup → pick
   counters), buildable/testable independent of API wiring.
4. **Backend/API routes** — CRUD for teams (Task 1), counter-team endpoint, Task 2
   scan route (Vercel Cron target), and an endpoint the frontend polls for alerts.
5. **Frontend** — Pokémon grid, team builder UI, counter-team display, change-alert
   banner.
6. **Demo prep for Task 2** — real PokéAPI changes won't happen on our schedule;
   decide how to force a demoable change (seeded stale snapshot, or manual trigger).
7. **README** — write incrementally, not at the end, while decisions are fresh.
