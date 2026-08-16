import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");
// scan-changes.ts imports POKEMON_CACHE_TAG from pokemon-catalog.ts, which
// calls unstable_cache() (unused here, but still needs a stub) at module
// load time -- only revalidateTag is actually exercised by these tests.
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));

import { push, reset } from "@/db";
import { revalidateTag } from "next/cache";
import { POKEMON_CACHE_TAG } from "./pokemon-catalog";
import { scanForChanges } from "./scan-changes";

function statList(overrides: Partial<Record<string, number>> = {}) {
  const stats = { hp: 45, attack: 49, defense: 49, "special-attack": 65, "special-defense": 65, speed: 45, ...overrides };
  return Object.entries(stats).map(([name, base_stat]) => ({ base_stat, stat: { name } }));
}

function fetchDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "bulbasaur",
    sprites: { front_default: "https://example.com/1.png" },
    types: [{ slot: 1, type: { name: "grass" } }],
    stats: statList(),
    ...overrides,
  };
}

function currentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "bulbasaur",
    spriteUrl: "https://example.com/1.png",
    types: ["grass"],
    hp: 45,
    attack: 49,
    defense: 49,
    specialAttack: 65,
    specialDefense: 65,
    speed: 45,
    lastFetchedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

beforeEach(() => {
  reset();
  vi.mocked(revalidateTag).mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

describe("scanForChanges", () => {
  it("does nothing when no pokemon are on any team", async () => {
    push([]); // selectDistinct teamPokemon

    const result = await scanForChanges();

    expect(result).toEqual({ checked: 0, changed: 0, changes: [] });
    expect(fetch).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("reports no change when live data matches the cached row", async () => {
    push([{ id: 1 }]); // selectDistinct teamPokemon
    push([currentRow()]); // current pokemon rows
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(fetchDetail()), { status: 200 }));

    const result = await scanForChanges();

    expect(result).toEqual({ checked: 1, changed: 0, changes: [] });
    expect(revalidateTag).not.toHaveBeenCalled();
    // No insert/update pushed -- would throw "no queued result" if the
    // code tried to write anyway.
  });

  it("logs a diff and updates the cached row when live data changed", async () => {
    push([{ id: 1 }]); // selectDistinct teamPokemon
    push([currentRow({ hp: 45 })]); // stale cached hp
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(fetchDetail({ stats: statList({ hp: 50 }) })), { status: 200 }));
    push(undefined); // changes insert
    push(undefined); // pokemon update

    const result = await scanForChanges();

    expect(result.checked).toBe(1);
    expect(result.changed).toBe(1);
    expect(result.changes).toEqual([{ pokemonId: 1, name: "bulbasaur", field: "hp", oldValue: "45", newValue: "50" }]);
    expect(revalidateTag).toHaveBeenCalledWith(POKEMON_CACHE_TAG, { expire: 0 });
  });

  it("skips a pokemon PokéAPI can't currently serve", async () => {
    push([{ id: 1 }]); // selectDistinct teamPokemon
    push([currentRow()]); // current pokemon rows
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

    const result = await scanForChanges();

    expect(result).toEqual({ checked: 1, changed: 0, changes: [] });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
