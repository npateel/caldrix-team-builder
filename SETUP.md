# Pokémon Team Builder

## Directory structure

```
├── documentation/adr/    Architecture decision records (adr-001..008)
├── drizzle/               Generated SQL migrations (drizzle-kit)
├── scripts/
│   ├── fetch.ts           Builds the raw PokéAPI cache (npm run seed:fetch)
│   └── seed.ts            Upserts that cache into the database (npm run db:seed)
├── src/
│   ├── app/                Next.js App Router routes
│   │   ├── admin/          Admin portal pages (changes, moves, pokemon, teams, users)
│   │   ├── api/            Route handlers (admin, auth, cron, teams)
│   │   ├── pokedex/        Pokémon browsing grid
│   │   └── teams/[teamId]/ Team roster + counter-team pages
│   ├── components/         React components (admin, pokemon, teams)
│   ├── db/                 Drizzle client + schema (schema.ts); __mocks__ for tests
│   ├── lib/                 Framework-agnostic logic: counter-team algorithm,
│   │                        type chart, pokemon diff/stats, hooks, etc. — plus
│   │                        their co-located *.test.ts files
│   ├── server/              DB-backed server functions (teams, users, scans,
│   │                        reseed); __mocks__ so route tests don't need a
│   │                        live database
│   └── types/               Shared TypeScript types
├── vercel.json              Cron schedules (scan-changes hourly, reseed daily)
└── vitest.config.ts
```

## Setup

- `npm install`
- `npm run db:migrate` -- apply the schema to your Neon database
- `npm run seed:fetch` -- builds the raw PokéAPI cache at
  `scripts/data/*.jsonl` (~190MB, gitignored -- it's derived data, so it's
  regenerated rather than checked in). Required once on a fresh clone, and
  it takes a few minutes. Safe to interrupt and rerun; ids already cached
  are skipped, so rerunning later just picks up new PokéAPI data
- `npm run db:seed` -- reads that cache and upserts it into the database
- `npm run dev` -- start the Next.js dev server
- `npm test` -- run the route/unit tests (Vitest; DB and auth are mocked, no
  live database needed)

## OAuth (GitHub + Google)

Requires these vars in `.env.local` (see adr-005):

- `AUTH_SECRET` -- any random string, e.g. `openssl rand -base64 33`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` -- from a GitHub OAuth App
  ([github.com/settings/developers](https://github.com/settings/developers)).
  Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
  (and your deployed URL's equivalent)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` -- from a Google OAuth Client
  ([console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)).
  Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
  (and your deployed URL's equivalent)

## Admin portal (`/admin`)

Gated by `users.isAdmin` (see adr-006) -- there's no self-serve way to
become an admin. To grant yourself access: sign in once via OAuth so your
`users` row exists, then flip the column by hand, e.g. via `npm run
db:studio` or:

```sql
update users set is_admin = true where email = 'you@example.com';
```

The "Admin" link only shows up in the nav once your account has it.

### Task 2 change-detection scan

`/admin/changes` shows the `changes` log and a "Run scan now" button that
hits `/api/cron/scan-changes` -- the same route Vercel Cron calls on the
schedule in `vercel.json` (hourly). Only pokemon currently on at least one
team are checked against live PokéAPI data (see adr-006 for why).

- `CRON_SECRET` -- any random string, set in your Vercel project's env vars.
  Vercel Cron sends it as `Authorization: Bearer $CRON_SECRET`; not needed
  locally since the admin "Run scan now" button authenticates via your
  admin session instead.

Signed-in users see a small warning icon next to any of their teams that
had a pokemon change in the last 7 days on `/` -- click it for an old-vs-
new detail dialog (see adr-008). Since real PokéAPI data rarely changes
day to day, `/admin/changes` also has a "Simulate a change (demo)" button
that desyncs one of your own team pokemon's cached stat from its live
value -- click it, then "Run scan now" (the real, unmodified scan job),
then check `/` for the resulting alert.

### Daily full cache reseed

`/api/cron/reseed` refetches the *entire* pokemon/moves cache from PokéAPI
(not just team pokemon like the scan job above) and upserts it -- see
adr-007. Vercel Cron runs it daily at 3am (`vercel.json`); `/admin/pokemon`
also has a "Reseed cache now" button for triggering it manually. Same
`CRON_SECRET`/admin-session auth as the scan route. It also logs to
`changes` for whichever pokemon it refetches that happen to be on a team
(see adr-008's update) -- so either this or "Run scan now" will pick up
the demo change above; a real change no longer goes undetected just
because reseed happened to run before the next scan.

This does ~2200 PokéAPI calls and realistically takes a minute or more, so
`export const maxDuration = 300` is set on the route -- **this needs a
Vercel plan whose function duration ceiling actually covers that** (Hobby's
default won't). If it times out in practice, see adr-007's alternatives
(a scheduled CI job has no such limit).
