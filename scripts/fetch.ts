// Fetches every Pokémon and every move from PokéAPI and appends the raw JSON
// as one line per entry to scripts/data/{pokemon,moves}.jsonl, so `db:seed`
// (and reruns of this script) don't hit the external API again. Safe to
// interrupt and rerun -- ids already present in the jsonl file are skipped.
import fs from "node:fs";
import path from "node:path";
import cliProgress from "cli-progress";
import { fetchJson, idFromUrl, pMap } from "./lib/http";

const BASE = "https://pokeapi.co/api/v2";
const CONCURRENCY = 8;
const DATA_DIR = path.join("scripts", "data");
const POKEMON_FILE = path.join(DATA_DIR, "pokemon.jsonl");
const MOVES_FILE = path.join(DATA_DIR, "moves.jsonl");

type NamedApiResource = { name: string; url: string };

function existingIds(file: string): Set<number> {
  if (!fs.existsSync(file)) return new Set();
  return new Set(
    fs
      .readFileSync(file, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line).id as number),
  );
}

// Fetches a PokéAPI resource list (e.g. /pokemon or /move) and appends each
// entry's detail JSON as a line to `file`, skipping ids already present.
async function fetchAllResources(listUrl: string, file: string, label: string) {
  const list = await fetchJson<{ results: NamedApiResource[] }>(listUrl);
  const cached = existingIds(file);

  let fetched = 0;
  let skipped = 0;
  const bar = new cliProgress.SingleBar(
    { format: `${label} |{bar}| {value}/{total} | fetched {fetched}, skipped {skipped}` },
    cliProgress.Presets.shades_classic,
  );
  bar.start(list.results.length, 0, { fetched, skipped });

  await pMap(
    list.results,
    async (entry) => {
      const id = idFromUrl(entry.url);
      if (cached.has(id)) {
        skipped++;
      } else {
        const detail = await fetchJson(entry.url);
        fs.appendFileSync(file, JSON.stringify(detail) + "\n");
        fetched++;
      }
      bar.increment(1, { fetched, skipped });
    },
    CONCURRENCY,
  );
  bar.stop();
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  await fetchAllResources(`${BASE}/pokemon?limit=100000`, POKEMON_FILE, "pokemon");
  await fetchAllResources(`${BASE}/move?limit=100000`, MOVES_FILE, "moves");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
