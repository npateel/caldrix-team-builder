# Design Decisions & Assumptions

## Stack

Next.js on Vercel, Neon serverless Postgres + Drizzle, Auth.js v5
(GitHub/Google, JWT sessions). Optimized for time-to-deploy over scale
given the take-home's ~72h lifespan. Some downsides here:

1. The database is technically on the public internet, not great for security.
2. Serverless will run into limitations if we start doing more complex calculations / crons
   (thankfully, we can pull most of the Pokémon within a minute, but long-lived cron jobs
   don't play nice with serverless time limits).
3. The whole Next.js + Vercel + Neon + Drizzle + Auth.js stack is so templatized at this point
   that it signals as AI-generated, especially with the Lucide icons and Tailwind CSS.

However, I do quite like it for a few reasons — some of the main ones:
1. No thought is required for CI/CD. This is the big one for me — I just really
   dislike having to think about pipelines, and having an easy deploy just works.
   I just wish it worked for tests too (would need to integrate GitHub Actions for
   that, which I didn't have time to implement).
2. I considered using a React component library (MUI / Blueprint.js), but decided against
   it for flexibility. Seeing how much Tailwind CSS ended up in the final product,
   I regret this a little.

## Frontend design

- Tried to keep to minimal friction and few API calls.
  - Caches the API call to grab all Pokémon (preferred since it's relatively little data).
  - A DB scan or change can invalidate the cache.
- Wanted to implement a debounce + optimistic UI for team roster management, but it ended up
  being too much code to review at once.
- Wanted the grids to model what matters to competitive/Smogon Pokémon players.
- Added auth so that certain endpoints could be gated.
- The sprites aren't a consistent size the way the official artwork is. I kept this since
  scaling them looked pretty bad — if you want a consistent look, use the official artwork
  instead.
- Would be nice to add a stat bar chart to spot a lopsided team (e.g. only SpAtk, no SpDef).

## Data model

- `pokemon`/`moves` are cached into the Neon database so that we're not hitting APIs
  directly (both out of respect for the devs and for easier sorting/querying).

- `teams`/`team_pokemon` track rosters with a `position` column for order-aware
  add/remove/reorder.

- Users start as an anonymous cookie-assigned row, then can sign in and automatically
  migrate their teams.

## Counter-team algorithm

Found in `src/lib/counter-team.ts`. The current approach uses a greedy algorithm
to match the ideal counter for each individual Pokémon, under a team-wide constraint
of having a well-balanced defensive team.

The ideal counter is one that can:
- Wall an offensive Pokémon (high Def if high Atk, high SpDef if high SpAtk),
- Attack a glass cannon (high Atk if low Def, high SpAtk if low SpDef),
- Outspeed it,
- Hold a type advantage,
- And have high overall stats.

The greedy algorithm is pretty simple — here's an example:

1. I choose Arceus (Normal). The algorithm picks the ideal counter, Marshadow (Fighting/Ghost).
2. If I continue to choose Normal types, we'll see Zamazenta (Fighting/Steel), Calyrex-Shadow
   (Psychic/Ghost), then Eternatus-Eternamax (Poison/Dragon). Notice how we're not spamming
   just Fighting or just Ghost types — we're trying to build a decent defensive team while
   still being a menace to the Pokémon already chosen.
3. We largely assume a user's Pokémon will attack with the same types as its own typing, to
   get a Same-Type-Attack-Bonus (STAB). In practice this doesn't always happen, so the counter
   could get surprised by an unusual moveset (e.g. a Water type that knows Ice Beam can
   seriously ruin a Dragon type's day).

I tried a beam search with pruning (similar to how NLP models predict the next word), but
it produced worse results. Might have been worth retrying with different weights.

We're not addressing moves for now (ran out of time), but we could by:
1. Checking the most-used movesets on Pikalytics and countering those.
2. Countering specific move types (Rapid Spin for hazards, countering weather teams).
3. Guessing a Pokémon's role and answering the corresponding threat (sweeper, tank, etc.).

## Task 2 — change detection & alerts

A scan job refetches team Pokémon on a schedule and logs field-level
diffs. A popup display shows changes to the signed-in user's own team
Pokémon from the last 7 days, netted into one before/after pair per field
so round-trip changes don't falsely alert.

The alert clears when the team is modified. I wasn't sure whether to persist it until dismissed
or not, but decided less friction here is better.

**To demo**: real PokéAPI data rarely changes day-to-day, so
`/admin/changes` has a "Simulate a change" button that writes a fake diff
through the same alert path.

## Assumptions

- Team size capped at 6, order-aware.
- A team must have unique Pokémon.
  - This follows both tournament and Smogon rules.
  - The project *currently* allows someone to put two different variants of the same
    Pokémon on one team. This can be fixed by integrating with
    `pokeapi.co/api/v2/pokedex/1/` and joining off that data, but I ran out of time.
- An optimal counter team has good stats and good type advantages (both defending and
  attacking).
- A "change" alert requires the diff to be within 7 days *and* after the Pokémon was
  added to that roster, so another team's already-seen change can't surface as
  stale/new on a roster built later.
  - This handles cases like a typo + fix, or multiple changes in a week — either way,
    the net change is what's important.
  - Users can clear a change alert by opening and modifying a stale team; this
    automatically clears the alert.
- OAuth is optional; anonymous users get persistent teams via cookie,
  re-pointed onto the account on sign-in.
- Admin access is granted by hand (flip a DB column) — fine for a
  handful of admins on a take-home.

## With more time

- Weighted/exhaustive search for counter-team selection.
- More meta-aware counter-team selection.
- Consideration of Pokémon moves and abilities.
- Self-serve admin promotion flow.
- Faster-than-daily scan trigger for quicker demo feedback (not possible without a paid
  Vercel tier).
