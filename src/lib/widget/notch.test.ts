import { describe, expect, it } from "vitest";
import { notchedTab } from "./notch";

describe("notchedTab", () => {
  it("expresses the diagonal as axis-aligned steps only", () => {
    const { edge, face } = notchedTab(15, 54);

    for (const path of [edge, face]) {
      const commands = [...new Set(path.match(/[A-Za-z]/g))].sort();
      expect(commands).toEqual(["H", "M", "V", "Z"]);
    }
  });

  it("steps once per unit of height and strokes the diagonal twice as wide", () => {
    expect(notchedTab(3, 10)).toEqual({
      viewBox: "0 0 10 3",
      width: 10,
      height: 3,
      edge: "M0 0 V1 H1 V2 H2 V3 H3 H10 V0 Z",
      face: "M2 0 V1 H3 V2 H4 H9 V0 Z",
    });
  });
});
