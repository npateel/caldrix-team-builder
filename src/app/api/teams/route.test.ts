import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db");
vi.mock("@/server/user");

import { push, reset } from "@/db";
import { TEST_USER_ID } from "@/server/user";
import { GET, POST } from "./route";

const team = {
  id: "team-1",
  userId: TEST_USER_ID,
  name: "Test Team",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => reset());

describe("GET /api/teams", () => {
  it("returns an empty list without a roster lookup when the user has no teams", async () => {
    push([]); // teams select

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("attaches each team's roster", async () => {
    push([team]); // teams select
    push([{ teamId: "team-1", position: 0, pokemon: { id: 1, name: "bulbasaur" } }]); // roster join

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].roster).toEqual([{ position: 0, pokemon: { id: 1, name: "bulbasaur" } }]);
  });
});

describe("POST /api/teams", () => {
  it("rejects a missing name", async () => {
    const request = new NextRequest("http://localhost/api/teams", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(request);

    expect(res.status).toBe(400);
  });

  it("creates a team with an empty roster", async () => {
    push([team]); // insert returning

    const request = new NextRequest("http://localhost/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: "Test Team" }),
    });
    const res = await POST(request);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("Test Team");
    expect(body.roster).toEqual([]);
  });
});
