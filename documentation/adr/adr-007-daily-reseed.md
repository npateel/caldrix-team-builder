# Daily full cache reseed

## Problem statement

adr-006 narrowed the Task 2 scan job to only refetch pokemon currently on a
team, to fit serverless time limits -- but that leaves the other ~1250+
cached pokemon (and all moves) never refreshed except by manually rerunning
the local `seed:fetch`/`db:seed` scripts. Want the whole cache kept
reasonably current automatically.

## Proposed solution

- `src/server/reseed.ts`: refetches every pokemon and move live from
  PokéAPI (concurrency 20, same `pMap`/`fetchJson` helpers the local
  `seed:fetch` script uses -- moved to `src/lib/http.ts` so both can
  share them) and upserts into `pokemon`/`moves`/`pokemon_moves`.
  Together with the scan job, this is what adr-004 originally described
  as one ("refresh everything, log changes for team pokemon"), split in
  two so each fits its constraints. (Originally reseed didn't write to
  `changes` at all -- adr-008 revised that once a real gap showed up.)
- `/api/cron/reseed`, same dual-trigger pattern as `/api/cron/scan-changes`
  (adr-006): Vercel Cron via `CRON_SECRET`, or an admin's "Reseed cache now"
  button on `/admin/pokemon`.
- Runs daily (`vercel.json`, 3am) rather than hourly like the scan job --
  the underlying PokéAPI data changes rarely; daily is enough to catch it
  without needlessly hammering the API every hour for ~2200 calls.
- `export const maxDuration = 300` on the route. ~2200 sequential-ish
  PokéAPI calls, even concurrent, realistically take on the order of a
  minute or more -- this requires a Vercel plan whose function duration
  ceiling covers that (Hobby's default won't). Documented in the README;
  if that's not available, falling back to a scheduled CI job (e.g. GitHub
  Actions running the existing local scripts against the live DB) is the
  alternative -- more headroom, no serverless timeout risk, at the cost of
  a second CI/scheduling system instead of one.

## Alternatives

1. GitHub Actions scheduled workflow instead of Vercel Cron -- no timeout
   pressure at all (Actions jobs get hours, not seconds), and reuses
   `scripts/fetch.ts`/`scripts/seed.ts` completely unchanged. Passed over
   only because Vercel Cron + a dedicated route was explicitly preferred,
   to keep the scheduling/trigger story in one place (Vercel) rather than
   split across two platforms. Worth reconsidering if the duration limit
   turns out to be a real problem in practice.
2. Chunk the reseed across multiple invocations (e.g. resume from a cursor
   stored in the DB) to stay under a stricter duration cap -- avoids
   needing a higher-tier plan, but meaningfully more complex (resumability,
   partial-run bookkeeping) for a job that only needs to run once a day.
3. Also commit the refreshed data back to the checked-in
   `scripts/data/*.jsonl` (LFS) files -- would keep the fresh-clone
   baseline current too, but means the job needs write access to the repo
   and adds daily bot commits. Decided the live DB is what actually needs
   to stay fresh; the LFS snapshot is just a one-time seeding convenience.
