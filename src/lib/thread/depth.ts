import type { Pt } from './geometry';

/**
 * Lengths along the path paired with the lowest y reached so far. Since the line only ever heads down the page
 * overall, this answers "how much line reaches this far down?" with a binary search. Sampled coarsely (every
 * point is a slow getPointAtLength) and read between samples by interpolation, which is exact on the straight runs.
 */
export type DepthTable = Array<[length: number, depth: number]>;

/** How far above and below a backtrack's deepest point its reveal is spread, in px of scroll. */
const BACKTRACK_SPREAD = 40;

export function depthTable(total: number, pointAt: (len: number) => Pt, step = 32): DepthTable {
  const table: DepthTable = [];
  const back: number[] = [];
  let depth = Number.NEGATIVE_INFINITY;
  const lengths = Array.from({ length: Math.ceil(total / step) }, (_, i) => i * step).concat(total);
  for (const len of lengths) {
    const y = pointAt(len).y;
    depth = Math.max(depth, y);
    if (y < depth - 1) back.push(table.length);
    table.push([len, depth]);
  }
  // a loop's way back up reaches no deeper, so scrolling would draw all of it in one frame (and stop the pen at the
  // loop's bottom, a hook, the frame before): spread the depths around each backtrack evenly over its length instead,
  // so the pen goes round the loop as the page scrolls
  const deepest = table.map(([, d]) => d);
  for (const i of back) {
    const d = deepest[i] as number;
    let [a, b] = [i, i];
    while (a > 0 && (deepest[a] as number) > d - BACKTRACK_SPREAD) a--;
    while (b < table.length - 1 && (deepest[b] as number) < d + BACKTRACK_SPREAD) b++;
    const [l0, l1] = [(table[a] as [number, number])[0], (table[b] as [number, number])[0]];
    const [d0, d1] = [deepest[a] as number, deepest[b] as number];
    for (let j = a + 1; j < b; j++) {
      const row = table[j] as [number, number];
      row[1] = d0 + ((d1 - d0) * (row[0] - l0)) / (l1 - l0);
    }
  }
  return table;
}

/** The length at depth y between two rows, where a's depth <= y < b's. */
const between = ([l0, d0]: [number, number], [l1, d1]: [number, number], y: number): number =>
  l0 + ((l1 - l0) * (y - d0)) / (d1 - d0);

/** The longest stretch of line that stays above y. */
export function lengthAbove(table: DepthTable, y: number): number {
  let lo = 0;
  let hi = table.length - 1;
  if (!table[0] || table[0][1] > y) return 0;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if ((table[m] as [number, number])[1] <= y) lo = m;
    else hi = m - 1;
  }
  const row = table[lo] as [number, number];
  const next = table[lo + 1];
  return next ? between(row, next, y) : row[0];
}

/** The length at which the line first gets down to y (the whole line if it never does). */
export function lengthAt(table: DepthTable, y: number): number {
  const i = table.findIndex(([, depth]) => depth >= y - 1);
  const hit = table[i];
  if (!hit) return (table[table.length - 1] ?? [0])[0];
  const prev = table[i - 1];
  return prev && hit[1] > y ? between(prev, hit, y) : hit[0];
}
