/** The mode switch's clock, in ms from the click: the old skin is gone by SWAP, the new one is drawn by END. */
export const SWAP = 240;
export const END = 820;

/** Delay between staggered items: spread n over span ms, but never more than max apart. */
export const stagger = (n: number, span: number, max: number): number =>
  Math.min(max, span / Math.max(1, n - 1));

/** The page's background moves between the two papers in four hard steps (0 = old paper, 4 = new). */
export function toneStep(t: number): number {
  if (t < 50) return 0;
  if (t < 150) return 1;
  if (t < SWAP) return 2;
  if (t < 400) return 3;
  return 4;
}

/** How much line is left as it pulls back into the full stop before the swap. */
export const pullBack = (from: number, t: number): number => from * (1 - Math.min(1, t / (SWAP - 20))) ** 2;

/** How much line is redrawn after the swap; the pixel trace routes in 12px runs, the ink line flows. */
export function redraw(to: number, t: number, pixel: boolean): number {
  const k = Math.max(0, Math.min(1, (t - SWAP - 20) / (END - SWAP - 60)));
  const len = to * (1 - (1 - k) ** 2);
  return pixel ? Math.floor(len / 12) * 12 : len;
}
