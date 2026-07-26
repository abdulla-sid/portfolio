import { describe, expect, it } from "vitest";
import { nextPlayableIndex } from "./playlist";

describe("nextPlayableIndex", () => {
  it("skips unavailable tracks, wraps, and reports no playable result", () => {
    expect(nextPlayableIndex([true, true, true], 0, 1)).toBe(1);
    expect(nextPlayableIndex([true, false, true], 0, 1)).toBe(2);
    expect(nextPlayableIndex([true, false, true], 2, 1)).toBe(0);
    expect(nextPlayableIndex([true, false, true], 0, -1)).toBe(2);
    expect(nextPlayableIndex([false, true, false], 1, 1)).toBe(1);
    expect(nextPlayableIndex([false, false], 0, 1)).toBeNull();
  });
});
