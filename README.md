# Design Decisions & Assumptions

## Stack

Next.js on Vercel, Neon serverless Postgres + Drizzle, Auth.js v5
(GitHub/Google, JWT sessions). Optimized for time-to-deploy over scale
given the take-home's ~72h lifespan. Some badness here include:

1. The database is technically on the public internet, not great for security
2. Serverless will run into limitations if we start doing more complex calculations / crons
   (thankfully, we can pull most of the pokemon within a minute, but long-lived cron jobs
   don't play nice with the serverless time limits)
3. The whole next.js + vercel + neon + drizzle + authjs is so templatized at this point it
   it signals as AI genrated. Especially with the lucide symbols and the tailwindcss


However, I do quite like it for a few reasons -- some of the main ones:
1. No thought is required for CI/CD. This is the big one for me, I just really
   dislike having to think about pipelines and just having an easy deploy works.
   I just wished it worked for tests (need to integrate github actions for that, which
   I didn't want to implement)
2. I considered using a react components library (MUI / Blueprint.js), but decided against that 
   for flexibility. Seeing how much tailwind css is used in the final product, 
   I regret this a little bit




## Data model

- `pokemon`/`moves` are cached into the Neon database so that we're not hitting APIs
  directly (both as a respect for the devs + easier sorting / querying)

- `teams`/ `team_pokemon` track rosters with a `position` column for order-aware
add/remove/reorder. 

- Users start as an anonymous cookie-assigned row, and then can sign in and migrate
  their teams automatically

## Counter-team algorithm

Found in (`src/lib/counter-team.ts`). The current approach uses a greedy algorithm
to match up the ideal counter for each individual pokemon under a team-wide constraint
of having a well-balanced defensive team. 

The ideal counter is one that can:
- Wall an offensive pokemon (so high def if high atk, high SpDef if high SpAtk),
- Can attack against glass cannons (so high atk if low def, high SpAtk if low SpDef),
- Is faster 
- Has a type advantage
- Has high overall stats

The greedy algorithm is pretty simple -- here's an example:

1. I choose Arceus (Normal). The algorithm choose the worst possible counter Marshadow (Fighting / Ghost)
2. If I continue to choose normal types, we'll see Zamazenta (Fighting / Steel), Calyrex-Shadow (Psychic / Ghost),
   then Eternatus-Eternamax (Poison / Dragon) Notice how we're not spamming just fighting or just ghost types, we're
   trying to build a decent defensive team while being a menace to the pokemon already chosen
3. We're largely trying to assume that a users Pokemon will be attacking with the same types as the Pokemon's types to get
  a Same-Type-Attack-Bonus (STAB). In practice, this doesn't always happen, so the counter could get surprised by some unusual movesets
  (e.g. a water type that can learn ice beam can seriously ruin a dragon type's day)



I tried doing a beam search w/ pruning (similar to how NLP models predict the next word), but this seemed to produce bad results. 
Wonder if it would have been worth retrying with different weights

We're not addressing moves for now (ran out of time), but we could do that by
1. Checking out some of the most used movesets on Pikalytics, and countering those
2. Counter against specific move types (Rapid spin for spikes / hazards, Counter weather teams)
3. Guessing the role of a pokemon and answering threats based on that (Counter the sweep, tank, etc.)



## Task 2 -- change detection & alerts

A scan job refetches team Pokémon on a schedule and logs field-level
diffs. A popup display shows changes to the signed-in user's own team
Pokémon from the last 7 days, netted into one before/after pair per field
so round-trip changes don't falsely alert.

The alert clears when the team is modified. I wasn't sure whether to persist until dismissed or not,
but thought that less friction here is better

**To demo**: real PokéAPI data rarely changes day-to-day, so
`/admin/changes` has a "Simulate a change" button that writes a fake diff
through the same alert path.

## Assumptions

- Team size capped at 6, order-aware.
- A Pokemon team must have unique pokemon
  - This follows both tournament and Smogon rules. 
  - The project /currently/ allows for someone to put two of the same pokemon, different variants on the same team.
    This can be fixed by integrating with pokeapi.co/api/v2/pokedex/1/ and doing some joins off that data, but I ran out of time
- An optimal counter team has good stats and good type advantages (defending and attacking)
- A "change" alert requires the diff to be within 7 days *and* after the
  Pokémon was added to that roster, so another team's already-seen change
  can't surface as stale/new on a roster built later.
  - We do this to handle a case like a typo + fix, or multiple changes in a week. Either way, the net is what's important
  - Users can clear their change alert when they open and modify a stale team. This will automatically clear the alert
- OAuth is optional; anonymous users get persistent teams via cookie,
  re-pointed onto the account on sign-in.
- Admin access is granted by hand (flip a DB column) -- fine for a
  handful of admins on a take-home.

## With more time

- Weighted/exhaustive search for counter-team selection.
- Self-serve admin promotion flow.
- Faster-than-daily scan trigger for quicker demo feedback. (Not possible without paid tiers of vercel)
