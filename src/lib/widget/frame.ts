import handDrawnSmall from "../../assets/widget2-ds.png";
import handDrawnXl from "../../assets/widget2-xl-ds.png";

export type FrameArtId = "small" | "xl";

export interface SliceSegment {
  width: number;
  flexible?: boolean;
}

export interface FrameBand {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameCell {
  column: number;
  row: number;
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
}

export const HAND_DRAWN_FRAMES = {
  small: {
    src: handDrawnSmall,
    source: { w: 180, h: 180 },
    band: { x: 14, y: 32, w: 146, h: 82 },
  },
  xl: {
    src: handDrawnXl,
    source: { w: 810, h: 810 },
    band: { x: 66, y: 147, w: 651, h: 363 },
  },
} as const;

export function sliceTracks(segments: readonly SliceSegment[]): string {
  return segments
    .map((segment) =>
      segment.flexible
        ? `minmax(0, ${segment.width}fr)`
        : `calc(${segment.width}px * var(--hd-scale))`,
    )
    .join(" ");
}

function sliceOffsets(start: number, segments: readonly SliceSegment[]) {
  let source = start;
  return segments.map((segment) => {
    const offset = { source, size: segment.width };
    source += segment.width;
    return offset;
  });
}

export function framePerimeterCells(
  band: FrameBand,
  columns: readonly SliceSegment[],
  rows: readonly SliceSegment[],
): FrameCell[] {
  const columnOffsets = sliceOffsets(band.x, columns);
  const rowOffsets = sliceOffsets(band.y, rows);
  const lastColumn = columns.length - 1;
  const lastRow = rows.length - 1;

  return rowOffsets.flatMap((row, rowIndex) =>
    columnOffsets
      .map((column, columnIndex) => ({ column, columnIndex }))
      .filter(
        ({ columnIndex }) =>
          rowIndex === 0 ||
          rowIndex === lastRow ||
          columnIndex === 0 ||
          columnIndex === lastColumn,
      )
      .map(({ column, columnIndex }) => ({
        column: columnIndex + 1,
        row: rowIndex + 1,
        sourceX: column.source,
        sourceY: row.source,
        width: column.size,
        height: row.size,
      })),
  );
}

export interface FrameCellBackground {
  size: string;
  position: string;
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function coverPercent(source: number, region: number): number {
  return round((source / region) * 100);
}

function anchorPercent(start: number, source: number, region: number): number {
  const slack = source - region;
  return slack === 0 ? 0 : round((start / slack) * 100);
}

export function frameCellBackground(
  cell: FrameCell,
  source: { w: number; h: number },
): FrameCellBackground {
  return {
    size: `${coverPercent(source.w, cell.width)}% ${coverPercent(source.h, cell.height)}%`,
    position: `${anchorPercent(cell.sourceX, source.w, cell.width)}% ${anchorPercent(cell.sourceY, source.h, cell.height)}%`,
  };
}

export function cssSize(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}
