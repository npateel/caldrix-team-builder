import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db");

import { push, reset } from "@/db";
import { simulateStatDrift } from "./simulate-change";

beforeEach(() => reset());

describe("simulateStatDrift", () => {
  it("returns null when the user has no team pokemon to drift", async () => {
    push([]); // join select

    expect(await simulateStatDrift("user-1")).toBeNull();
  });

  it("bumps attack by 5 and reports the before/after values", async () => {
    push([{ id: 1, name: "bulbasaur", attack: 49 }]); // join select
    push(undefined); // pokemon update

    const drift = await simulateStatDrift("user-1");

    expect(drift).toEqual({
      pokemonId: 1,
      pokemonName: "bulbasaur",
      field: "attack",
      oldValue: 49,
      newValue: 54,
    });
  });
});
