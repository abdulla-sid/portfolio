import { describe, expect, it } from "vitest";
import {
  HAND_DRAWN_FRAMES,
  createHorizontalSlices,
  createMobileFrameSlices,
} from "./frame";

describe("widget frame geometry", () => {
  it("assigns contiguous source positions to horizontal slices", () => {
    const slices = createHorizontalSlices(66, [
      { width: 65 },
      { width: 128, flexible: true },
      { width: 50 },
    ]);

    expect(slices).toEqual([
      { width: 65, sourceX: 66 },
      { width: 128, flexible: true, sourceX: 131 },
      { width: 50, sourceX: 259 },
    ]);
  });

  it("creates the existing nine mobile frame cells", () => {
    const slices = createMobileFrameSlices(HAND_DRAWN_FRAMES.xl.band);
    expect(slices).toHaveLength(9);
    expect(slices[0]).toEqual({
      sourceX: 66,
      sourceY: 147,
      width: 40,
      height: 40,
    });
    expect(slices[4]).toEqual({
      sourceX: 106,
      sourceY: 187,
      width: 571,
      height: 283,
    });
    expect(slices[8]).toEqual({
      sourceX: 677,
      sourceY: 470,
      width: 40,
      height: 40,
    });
  });
});
