import { describe, expect, it } from "vitest";
import { effectiveness, isWeakTo } from "./type-chart";

describe("effectiveness", () => {
  it("is neutral (1x) for an unlisted matchup", () => {
    expect(effectiveness("normal", ["normal"])).toBe(1);
  });

  it("returns 2x for a single super-effective matchup", () => {
    expect(effectiveness("water", ["fire"])).toBe(2);
  });

  it("returns 0.5x for a single not-very-effective matchup", () => {
    expect(effectiveness("fire", ["water"])).toBe(0.5);
  });

  it("returns 0x for a listed immunity", () => {
    expect(effectiveness("normal", ["ghost"])).toBe(0);
    expect(effectiveness("ground", ["flying"])).toBe(0);
  });

  it("multiplies across a dual-type defender (4x)", () => {
    expect(effectiveness("electric", ["water", "flying"])).toBe(4);
  });

  it("multiplies across a dual-type defender (0.25x)", () => {
    expect(effectiveness("fire", ["water", "dragon"])).toBe(0.25);
  });

  it("stays 0x if either defending type is immune, regardless of the other", () => {
    expect(effectiveness("ground", ["flying", "rock"])).toBe(0);
  });
});

describe("isWeakTo", () => {
  it("is true only when the multiplier exceeds 1x", () => {
    expect(isWeakTo(["grass"], "fire")).toBe(true);
    expect(isWeakTo(["fire"], "grass")).toBe(false);
    expect(isWeakTo(["normal"], "normal")).toBe(false);
  });

  it("is true for a quad-weakness", () => {
    expect(isWeakTo(["ice", "flying"], "rock")).toBe(true);
  });
});
