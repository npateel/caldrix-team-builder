import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");

import { push, reset } from "@/db";
import { getRoster, getRosters } from "./team-roster";

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
