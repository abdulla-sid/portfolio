import { describe, expect, it } from "vitest";
import { marqueeParams } from "./marquee";

describe("marqueeParams", () => {
  it("handles fitting text and scale-aware pixel animation geometry", () => {
    expect(marqueeParams(100, 100, 1)).toBeNull();
    expect(marqueeParams(100.4, 100, 1)).toBeNull();
    expect(marqueeParams(200, 100, 1)).toEqual({
      dist: 233,
      steps: 233,
      durationS: 9.32,
    });

    const p = marqueeParams(200, 100, 2)!;
    expect(p.dist).toBe(266);
    expect(p.steps).toBe(133);
    expect(p.durationS).toBeCloseTo(266 / 50);
  });
});
