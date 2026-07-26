import { describe, expect, it } from "vitest";
import { cellOrder, coverCounts } from "./dissolve";

describe("dissolve", () => {
  it("cellOrder is a deterministic permutation", () => {
    const order = cellOrder(100);
    expect(new Set(order).size).toBe(100);
    expect(Math.min(...order)).toBe(0);
    expect(Math.max(...order)).toBe(99);

    const makeRng = (seed: number) => () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    expect(cellOrder(8, makeRng(42))).toEqual(cellOrder(8, makeRng(42)));
  });

  it("coverCounts steps monotonically and ends fully covered", () => {
    const counts = coverCounts(97, 4);
    expect(counts).toHaveLength(4);
    for (let i = 1; i < counts.length; i++)
      expect(counts[i]).toBeGreaterThan(counts[i - 1]);
    expect(counts.at(-1)).toBe(97);
  });
});
