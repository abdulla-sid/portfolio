import { describe, expect, it } from "vitest";
import { notchedTab, steppedCorner } from "./notch";

describe("notchedTab", () => {
  it("expresses the diagonal as axis-aligned steps only", () => {
    const { edge, face } = notchedTab(15, 54);

    for (const path of [edge, face]) {
      const commands = [...new Set(path.match(/[A-Za-z]/g))].sort();
      expect(commands).toEqual(["H", "M", "V", "Z"]);
    }
  });

  it("insets the face so every side of the rim carries the same weight", () => {
    expect(notchedTab(3, 10)).toEqual({
      viewBox: "0 0 10 3",
      width: 10,
      height: 3,
      edge: "M0 0 V1 H1 V2 H2 V3 H3 H10 V0 Z",
      face: "M1 0 V1 H2 V2 H3 H9 V0 Z",
    });
  });

  it("can move the diagonal without changing the tab bounds", () => {
    expect(notchedTab(3, 12, 4)).toEqual({
      viewBox: "0 0 12 3",
      width: 12,
      height: 3,
      edge: "M4 0 V1 H5 V2 H6 V3 H7 H12 V0 Z",
      face: "M5 0 V1 H6 V2 H7 H11 V0 Z",
    });
  });
});

describe("steppedCorner", () => {
  it("expresses the cut corner as axis-aligned steps only", () => {
    const { path } = steppedCorner(120, 90, 15);
    const commands = [...new Set(path.match(/[A-Za-z]/g))].sort();

    expect(commands).toEqual(["H", "M", "V", "Z"]);
  });

  it("gives back one unit of width for every unit of height it descends", () => {
    expect(steppedCorner(10, 8, 3)).toEqual({
      viewBox: "0 0 10 8",
      width: 10,
      height: 8,
      path: "M0 0 H10 V5 H9 V6 H8 V7 H7 V8 H0 Z",
    });
  });
});
