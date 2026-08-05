import { describe, expect, it } from "vitest";
import { frameCellBackground, framePerimeterCells, sliceTracks } from "./frame";

const BAND = { x: 66, y: 147, w: 651, h: 363 };

describe("widget frame geometry", () => {
  it("pins fixed tracks to the art scale and lets flexible tracks absorb the slack", () => {
    const tracks = sliceTracks([
      { width: 65 },
      { width: 128, flexible: true },
      { width: 50 },
    ]);

    expect(tracks).toBe(
      "calc(65px * var(--hd-scale)) minmax(0, 128fr) calc(50px * var(--hd-scale))",
    );
  });

  it("walks source offsets across both axes", () => {
    const cells = framePerimeterCells(
      BAND,
      [{ width: 26 }, { width: 599, flexible: true }, { width: 26 }],
      [{ width: 26 }, { width: 311, flexible: true }, { width: 26 }],
    );

    expect(cells[0]).toEqual({
      column: 1,
      row: 1,
      sourceX: 66,
      sourceY: 147,
      width: 26,
      height: 26,
    });
    expect(cells.at(-1)).toEqual({
      column: 3,
      row: 3,
      sourceX: 691,
      sourceY: 484,
      width: 26,
      height: 26,
    });
  });

  it("crops a slice with percentages that ignore the rendered cell size", () => {
    const background = frameCellBackground(
      { column: 1, row: 1, sourceX: 66, sourceY: 147, width: 65, height: 26 },
      { w: 810, h: 810 },
    );

    expect(background).toEqual({
      size: "1246.1538% 3115.3846%",
      position: "8.8591% 18.75%",
    });
  });

  it("anchors a slice spanning a whole axis instead of dividing by zero", () => {
    const background = frameCellBackground(
      { column: 1, row: 1, sourceX: 0, sourceY: 147, width: 810, height: 26 },
      { w: 810, h: 810 },
    );

    expect(background.position).toBe("0% 18.75%");
  });

  it("emits only the perimeter, leaving the uniform interior to a background fill", () => {
    const columns = Array.from({ length: 13 }, () => ({ width: 1 }));
    const rows = Array.from({ length: 11 }, () => ({ width: 1 }));

    const cells = framePerimeterCells(BAND, columns, rows);

    expect(cells).toHaveLength(13 * 2 + (11 - 2) * 2);
    expect(
      cells.some(
        (cell) =>
          cell.row > 1 && cell.row < 11 && cell.column > 1 && cell.column < 13,
      ),
    ).toBe(false);
  });
});
