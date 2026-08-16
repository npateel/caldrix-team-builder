import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");

import { push, reset } from "@/db";
import { getRecentTeamChanges } from "./team-changes";

beforeEach(() => reset());

describe("getRecentTeamChanges", () => {
  it("returns an empty map when there are no recent changes", async () => {
    push([]); // joined select

    const result = await getRecentTeamChanges("user-1");

    expect(result.size).toBe(0);
  });

  it("groups joined rows by team id", async () => {
    push([
      { id: "c1", teamId: "t1", teamName: "Team One", pokemonId: 1, pokemonName: "bulbasaur", field: "attack" },
      { id: "c2", teamId: "t1", teamName: "Team One", pokemonId: 4, pokemonName: "charmander", field: "hp" },
      { id: "c3", teamId: "t2", teamName: "Team Two", pokemonId: 7, pokemonName: "squirtle", field: "speed" },
    ]);

    const result = await getRecentTeamChanges("user-1");

    expect(result.get("t1")?.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(result.get("t2")?.map((c) => c.id)).toEqual(["c3"]);
  });
});
