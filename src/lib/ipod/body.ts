import { FONT } from '../canvas/glyphs';

type Inside = (x: number, y: number) => boolean;

/**
 * A shape drawn on a 1px grid but sampled in `unit`-px cells, so curves come out as stairs.
 * Returns SVG path data for [fill, edge], where edge is a 2px outline: any cell with a cell 2px away (or a
 * diagonal neighbour) outside the shape. Runs of identical rows merge into one rectangle.
 */
export function stepShape(w: number, h: number, inside: Inside, unit: number): [string, string] {
  const at = (i: number, j: number) =>
    i >= 0 &&
    j >= 0 &&
    i < w &&
    j < h &&
    inside((Math.floor(i / unit) + 0.5) * unit, (Math.floor(j / unit) + 0.5) * unit);
  const kind = (i: number, j: number) => {
    if (!at(i, j)) return '';
    const solid =
      at(i - 2, j) &&
      at(i + 2, j) &&
      at(i, j - 2) &&
      at(i, j + 2) &&
      at(i - 1, j - 1) &&
      at(i + 1, j + 1) &&
      at(i - 1, j + 1) &&
      at(i + 1, j - 1);
    return solid ? 'f' : 'e';
  };
  const rowRuns = (j: number) => {
    const runs: [number, number, string][] = [];
    for (let i = 0; i < w; i++) {
      const k = kind(i, j);
      const last = runs[runs.length - 1];
      if (last && last[2] === k && last[0] + last[1] === i) last[1]++;
      else if (k) runs.push([i, 1, k]);
    }
    return runs;
  };
  let fill = '';
  let edge = '';
  let j = 0;
  while (j < h) {
    const runs = rowRuns(j);
    const key = JSON.stringify(runs);
    let rows = 1;
    while (j + rows < h && JSON.stringify(rowRuns(j + rows)) === key) rows++;
    for (const [x, len, k] of runs) {
      const d = `M${x} ${j}h${len}v${rows}h${-len}z`;
      if (k === 'f') fill += d;
      else edge += d;
    }
    j += rows;
  }
  return [fill, edge];
}

/** A rounded rectangle test for stepShape. */
export const roundedRect =
  (w: number, h: number, r: number): Inside =>
  (x, y) => {
    const dx = Math.max(r - x, 0, x - (w - r));
    const dy = Math.max(r - y, 0, y - (h - r));
    return dx * dx + dy * dy <= r * r;
  };

/** A disc test for stepShape. */
export const disc =
  (cx: number, cy: number, r: number): Inside =>
  (x, y) =>
    (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

/** Path data for bitmap rows at 2px per cell, '#' cells only. */
export const glyphPath = (rows: readonly string[], x: number, y: number): string =>
  rows
    .flatMap((row, j) => [...row].map((ch, i) => (ch === '#' ? `M${x + i * 2} ${y + j * 2}h2v2h-2z` : '')))
    .join('');

const UNIT = 2; // the pixel skin's step: corners stair in 2px, matching the page's frames

/** Path data for every data-path in the pixel iPod: body and wheel as stepped shapes, labels in the LCD font. */
export function pixelIpod(): Record<string, string> {
  const [bodyFill, bodyEdge] = stepShape(200, 335, roundedRect(200, 335, 26), UNIT);
  const [ringFill, ringEdge] = stepShape(136, 136, disc(68, 68, 66.4), UNIT);
  const [hubFill, hubEdge] = stepShape(136, 136, disc(68, 68, 24.8), UNIT);
  // the ring between its edge and the hub's, one quarter per key, in the same steps; dx, dy point at the key
  const lit = (dx: number, dy: number) =>
    stepShape(
      136,
      136,
      (x, y) => {
        const [u, v] = [x - 68, y - 68];
        const r = Math.hypot(u, v);
        const along = u * dx + v * dy;
        return r > 27 && r < 64 && along > 0 && Math.abs(u * dy - v * dx) <= along;
      },
      UNIT,
    ).join('');
  return {
    'lit-menu': lit(0, -1),
    'lit-next': lit(1, 0),
    'lit-play': lit(0, 1),
    'lit-prev': lit(-1, 0),
    'body-fill': bodyFill,
    'body-edge': bodyEdge,
    'ring-fill': ringFill,
    'ring-edge': ringEdge,
    'hub-fill': hubFill,
    'hub-edge': hubEdge,
    labels:
      [...'MENU'].map((ch, k) => glyphPath(FONT[ch] ?? [], 53 + k * 8, 13)).join('') +
      glyphPath(['#..#..#', '##.##.#', '#######', '##.##.#', '#..#..#'], 106, 63) +
      glyphPath(['#..#..#', '#.##.##', '#######', '#.##.##', '#..#..#'], 16, 63) +
      glyphPath(['#...#.#', '##..#.#', '###.#.#', '##..#.#', '#...#.#'], 61, 109),
  };
}
