# Pokémon Team Builder

## Setup

- `npm install`
- `npm run db:migrate` -- apply the schema to your Neon database
- `npm run seed:fetch` -- fetches all Pokémon and moves from PokéAPI into
  `scripts/data/*.jsonl` (gitignored, not checked in -- run this once per
  clone/environment; it's cached locally afterward and safe to rerun)
- `npm run db:seed` -- reads that cache and upserts it into the database
