import { describe, expect, it } from "vitest";
import { ANNOTATIONS, PAIR_COUNT, rerollPair } from "./daveAnnotations";

describe("daveAnnotations", () => {
  it("never rerolls to the pair already showing", () => {
    for (let current = 0; current < PAIR_COUNT; current += 1) {
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const next = rerollPair(current);
        expect(next).not.toBe(current);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(PAIR_COUNT);
      }
    }
  });

  it("leaves no annotation line unreachable", () => {
    for (const annotation of ANNOTATIONS) {
      expect(annotation.lines).toHaveLength(PAIR_COUNT);
    }
  });
});
