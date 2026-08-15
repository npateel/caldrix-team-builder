# Pokémon Team Builder

## Setup

- [Install Git LFS](https://git-lfs.com), then `git lfs install` (one-time
  per machine) -- `scripts/data/*.jsonl` is checked in via LFS so the raw
  PokéAPI cache doesn't bloat the regular git history
- `npm install`
- `npm run db:migrate` -- apply the schema to your Neon database
- `npm run seed:fetch` -- refreshes `scripts/data/*.jsonl` from PokéAPI.
  Not required on a fresh clone (the cache is already checked in via LFS);
  rerun it if you want to pick up new PokéAPI data, it skips ids already
  cached
- `npm run db:seed` -- reads that cache and upserts it into the database
- `npm run dev` -- start the Next.js dev server
