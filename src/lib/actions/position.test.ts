import { describe, expect, it } from "vitest";
import { clampToViewport } from "./position";

describe("clampToViewport", () => {
  it("passes through valid positions and clamps every viewport edge", () => {
    expect(clampToViewport(100, 50, 200, 100, 1000, 800)).toEqual({
      left: 100,
      top: 50,
    });
    expect(clampToViewport(-30, -5, 200, 100, 1000, 800)).toEqual({
      left: 0,
      top: 0,
    });
    expect(clampToViewport(950, 780, 200, 100, 1000, 800)).toEqual({
      left: 800,
      top: 700,
    });
    expect(clampToViewport(40, 40, 500, 400, 300, 200)).toEqual({
      left: 0,
      top: 0,
    });
  });
});
