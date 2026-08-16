import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");

import { push, reset } from "@/db";
import { buildRosterRows, getRoster, getRosters } from "./team-roster";

beforeEach(() => reset());

describe("getRosters", () => {
  it("returns an empty map without querying when given no team ids", async () => {
    const result = await getRosters([]);

    expect(result.size).toBe(0);
  });

  it("groups joined rows by team id, preserving position order", async () => {
    push([
      { teamId: "t1", position: 0, pokemon: { id: 1 } },
      { teamId: "t1", position: 1, pokemon: { id: 4 } },
      { teamId: "t2", position: 0, pokemon: { id: 7 } },
    ]);

    const result = await getRosters(["t1", "t2"]);

    expect(result.get("t1")).toEqual([
      { position: 0, pokemon: { id: 1 } },
      { position: 1, pokemon: { id: 4 } },
    ]);
    expect(result.get("t2")).toEqual([{ position: 0, pokemon: { id: 7 } }]);
  });
});

describe("getRoster", () => {
  it("returns [] for a team with no rows", async () => {
    push([]);

    expect(await getRoster("missing")).toEqual([]);
  });
});

describe("buildRosterRows", () => {
  const now = new Date("2026-01-10");

  it("stamps every pokemonId with now", () => {
    const rows = buildRosterRows("t1", [1], now);

    expect(rows).toEqual([{ teamId: "t1", pokemonId: 1, position: 0, addedAt: now }]);
  });

  it("positions rows by array order", () => {
    const rows = buildRosterRows("t1", [2, 1], now);

    expect(rows).toEqual([
      { teamId: "t1", pokemonId: 2, position: 0, addedAt: now },
      { teamId: "t1", pokemonId: 1, position: 1, addedAt: now },
    ]);
  });
});
