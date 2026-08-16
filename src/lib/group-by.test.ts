import { describe, expect, it } from "vitest";
import { groupBy } from "./group-by";

describe("groupBy", () => {
  it("returns an empty map for an empty input", () => {
    expect(groupBy([], (x: number) => x).size).toBe(0);
  });

  it("groups items by key, preserving each group's input order", () => {
    const items = [
      { team: "t1", id: 1 },
      { team: "t1", id: 2 },
      { team: "t2", id: 3 },
    ];

    const result = groupBy(items, (item) => item.team);

    expect(result.get("t1")).toEqual([
      { team: "t1", id: 1 },
      { team: "t1", id: 2 },
    ]);
    expect(result.get("t2")).toEqual([{ team: "t2", id: 3 }]);
  });

  it("omits keys with no matching items rather than mapping to []", () => {
    const result = groupBy([{ team: "t1" }], (item) => item.team);

    expect(result.has("missing")).toBe(false);
  });
});
