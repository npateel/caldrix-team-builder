import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db");
vi.mock("@/server/user");

import { push, reset } from "@/db";
import { PUT } from "./route";

const params = Promise.resolve({ teamId: "team-1" });

function putRequest(body: unknown) {
  return new NextRequest("http://localhost", { method: "PUT", body: JSON.stringify(body) });
}

beforeEach(() => reset());

describe("PUT /api/teams/[teamId]/pokemon", () => {
  it("404s when the team doesn't exist (or isn't owned by this user)", async () => {
    push([]); // ownership select

    const res = await PUT(putRequest({ pokemonIds: [1] }), { params });

    expect(res.status).toBe(404);
  });

  it("rejects more than 6 pokemon", async () => {
    push([{ id: "team-1" }]); // ownership select

    const res = await PUT(putRequest({ pokemonIds: [1, 2, 3, 4, 5, 6, 7] }), { params });

    expect(res.status).toBe(400);
  });

  it("rejects a non-array body", async () => {
    push([{ id: "team-1" }]); // ownership select

    const res = await PUT(putRequest({ pokemonIds: "1" }), { params });

    expect(res.status).toBe(400);
  });

  it("replaces the roster and returns it", async () => {
    push([{ id: "team-1" }]); // ownership select
    push([]); // tx: existing addedAt select
    push(undefined); // tx.delete
    push(undefined); // tx.insert
    push(undefined); // tx.update (teams.updatedAt)
    push([{ teamId: "team-1", position: 0, pokemon: { id: 1, name: "bulbasaur" } }]); // roster join

    const res = await PUT(putRequest({ pokemonIds: [1] }), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.roster).toEqual([{ position: 0, pokemon: { id: 1, name: "bulbasaur" } }]);
  });

  it("clears the roster when given an empty list, skipping the insert", async () => {
    push([{ id: "team-1" }]); // ownership select
    push([]); // tx: existing addedAt select
    push(undefined); // tx.delete
    push(undefined); // tx.update (teams.updatedAt) -- no tx.insert since pokemonIds is empty
    push([]); // roster join

    const res = await PUT(putRequest({ pokemonIds: [] }), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.roster).toEqual([]);
  });

  it("returns 400 when a pokemonId doesn't exist (simulated FK violation)", async () => {
    push([{ id: "team-1" }]); // ownership select
    push([]); // tx: existing addedAt select
    push(undefined); // tx.delete
    push(new Error("insert or update on table violates foreign key constraint")); // tx.insert fails

    const res = await PUT(putRequest({ pokemonIds: [999999] }), { params });

    expect(res.status).toBe(400);
  });
});
