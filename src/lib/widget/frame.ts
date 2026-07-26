import handDrawnSmall from "../../assets/widget2-ds.png";
import handDrawnXl from "../../assets/widget2-xl-ds.png";

export type FrameArtId = "small" | "xl";

export interface HorizontalSliceSegment {
  width: number;
  flexible?: boolean;
}

export interface FrameBand {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MOBILE_FRAME_CORNER_PX = 40;

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

export function createHorizontalSlices(
  bandX: number,
  segments: readonly HorizontalSliceSegment[],
) {
  let sourceX = bandX;
  return segments.map((segment) => {
    const slice = { ...segment, sourceX };
    sourceX += segment.width;
    return slice;
  });
}

export function createSliceColumns(
  segments: readonly HorizontalSliceSegment[],
): string {
  return segments
    .map((segment) =>
      segment.flexible
        ? `minmax(0, ${segment.width}fr)`
        : `calc(${segment.width}px * var(--hd-scale))`,
    )
    .join(" ");
}

export function createMobileFrameSlices(
  band: FrameBand,
  corner = MOBILE_FRAME_CORNER_PX,
) {
  const columns = [
    { source: band.x, size: corner },
    { source: band.x + corner, size: band.w - corner * 2 },
    { source: band.x + band.w - corner, size: corner },
  ];
  const rows = [
    { source: band.y, size: corner },
    { source: band.y + corner, size: band.h - corner * 2 },
    { source: band.y + band.h - corner, size: corner },
  ];

  return rows.flatMap((row) =>
    columns.map((column) => ({
      sourceX: column.source,
      sourceY: row.source,
      width: column.size,
      height: row.size,
    })),
  );
}

export function cssSize(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}
