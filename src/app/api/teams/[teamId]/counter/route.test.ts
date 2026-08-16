import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db");
vi.mock("@/server/user");
vi.mock("@/server/pokemon-catalog");

import { push, reset } from "@/db";
import { getAllPokemon } from "@/server/pokemon-catalog";
import { GET } from "./route";

const params = Promise.resolve({ teamId: "team-1" });

function makeRequest() {
  return new NextRequest("http://localhost");
}

function pokemonRow(id: number, types: string[]) {
  return {
    id,
    name: types.join("-"),
    spriteUrl: null,
    types,
    hp: 50,
    attack: 50,
    defense: 50,
    specialAttack: 50,
    specialDefense: 50,
    speed: 50,
    // A fixed string (rather than a real Date) so it round-trips through
    // NextResponse.json unchanged and toEqual comparisons stay exact.
    lastFetchedAt: "2026-01-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  reset();
  vi.mocked(getAllPokemon).mockReset();
});

describe("GET /api/teams/[teamId]/counter", () => {
  it("404s when the team doesn't exist (or isn't owned by this user)", async () => {
    push([]); // ownership select

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(404);
  });

  it("400s when the team has no roster to counter", async () => {
    push([{ id: "team-1" }]); // ownership select
    push([]); // roster join

    const res = await GET(makeRequest(), { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/no pokemon/i);
  });

  it("generates a real counter team from the roster and candidate pool", async () => {
    push([{ id: "team-1" }]); // ownership select
    push([{ teamId: "team-1", position: 0, pokemon: pokemonRow(1, ["bug"]) }]); // roster join

    const fireCounter = pokemonRow(2, ["fire"]);
    const badCandidate = pokemonRow(3, ["ground"]);
    vi.mocked(getAllPokemon).mockResolvedValue([fireCounter, badCandidate]);

    const res = await GET(makeRequest(), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.teamId).toBe("team-1");
    // Fire clearly beats a bug-type enemy (2x offense, 0.5x incoming) --
    // this is the real generateCounterTeam algorithm, not a stub.
    expect(body.counterTeam).toEqual([fireCounter]);
  });
});
