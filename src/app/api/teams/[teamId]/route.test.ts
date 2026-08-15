import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/db");
vi.mock("@/lib/user");

import { push, reset } from "@/db";
import { TEST_USER_ID } from "@/lib/user";
import { DELETE, GET, PATCH } from "./route";

const team = {
  id: "team-1",
  userId: TEST_USER_ID,
  name: "Test Team",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const params = Promise.resolve({ teamId: "team-1" });

beforeEach(() => reset());

describe("GET /api/teams/[teamId]", () => {
  it("404s when the team doesn't exist (or isn't owned by this user)", async () => {
    push([]); // ownership select

    const res = await GET(new NextRequest("http://localhost"), { params });

    expect(res.status).toBe(404);
  });

  it("returns the team with its roster", async () => {
    push([team]); // ownership select
    push([]); // roster join

    const res = await GET(new NextRequest("http://localhost"), { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("Test Team");
    expect(body.roster).toEqual([]);
  });
});

describe("PATCH /api/teams/[teamId]", () => {
  it("rejects a missing name without touching the db", async () => {
    const request = new NextRequest("http://localhost", { method: "PATCH", body: JSON.stringify({}) });

    const res = await PATCH(request, { params });

    expect(res.status).toBe(400);
  });

  it("404s when the update matches no owned row", async () => {
    push([]); // update returning

    const request = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed" }),
    });
    const res = await PATCH(request, { params });

    expect(res.status).toBe(404);
  });

  it("renames the team", async () => {
    push([{ ...team, name: "Renamed" }]); // update returning
    push([]); // roster join

    const request = new NextRequest("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed" }),
    });
    const res = await PATCH(request, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("Renamed");
  });
});

describe("DELETE /api/teams/[teamId]", () => {
  it("404s when there's nothing to delete", async () => {
    push([]); // delete returning

    const res = await DELETE(new NextRequest("http://localhost"), { params });

    expect(res.status).toBe(404);
  });

  it("deletes the team", async () => {
    push([{ id: "team-1" }]); // delete returning

    const res = await DELETE(new NextRequest("http://localhost"), { params });

    expect(res.status).toBe(204);
  });
});
