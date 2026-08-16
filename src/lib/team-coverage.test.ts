import { describe, expect, it } from "vitest";
import { defensiveCoverage, offensiveCoverage } from "./team-coverage";
import type { TypeName } from "./type-chart";

describe("defensiveCoverage", () => {
  it("counts weak/resist/immune across the team for each attacking type", () => {
    const team: TypeName[][] = [["fire"], ["water"], ["grass"]];

    const rows = defensiveCoverage(team);
    const fireRow = rows.find((r) => r.type === "fire")!;
    // fire vs fire = 0.5 (resist), fire vs water = 0.5 (resist), fire vs grass = 2 (weak)
    expect(fireRow).toEqual({ type: "fire", weak: 1, resist: 2, immune: 0 });
  });

  it("counts an immunity separately from a resistance", () => {
    const team: TypeName[][] = [["ghost"], ["normal"]];
    const rows = defensiveCoverage(team);
    const normalRow = rows.find((r) => r.type === "normal")!;
    // normal vs ghost = 0 (immune), normal vs normal = 1 (neither)
    expect(normalRow).toEqual({ type: "normal", weak: 0, resist: 0, immune: 1 });
  });

  it("returns one row per real pokemon type", () => {
    const rows = defensiveCoverage([["fire"]]);
    const typeNames = rows.map((r) => r.type);
    expect(new Set(typeNames).size).toBe(rows.length);
    expect(typeNames).toContain("fire");
    // shadow/stellar/unknown aren't real battle types.
    expect(typeNames).not.toContain("shadow");
  });
});

describe("offensiveCoverage", () => {
  it("includes a type the team hits super-effectively", () => {
    const covered = offensiveCoverage([["water"]]);
    expect(covered.has("fire")).toBe(true);
  });

  it("excludes a type nothing on the team is super-effective against", () => {
    const covered = offensiveCoverage([["normal"]]);
    // normal-type attacks are never super-effective against anything.
    expect(covered.size).toBe(0);
  });

  it("unions coverage across every team member", () => {
    const covered = offensiveCoverage([["water"], ["grass"]]);
    expect(covered.has("fire")).toBe(true); // from water
    expect(covered.has("ground")).toBe(true); // from grass
  });
});
