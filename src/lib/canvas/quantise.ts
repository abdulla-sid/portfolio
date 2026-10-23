/** A colour as [r, g, b], 0..255. */
type Rgb = [number, number, number];

type Probe = Pick<CanvasRenderingContext2D, 'fillStyle' | 'clearRect' | 'fillRect' | 'getImageData'>;
let probe: Probe | null | undefined;
const scratch = (): Probe | null => {
  probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  return probe;
};

/**
 * Any CSS colour a token may hold (hex, rgb(), oklch(), a name, color-mix()) as [r, g, b], read back from one
 * painted pixel so the browser does the parsing. Unreadable colours come back black.
 */
export function toRgb(colour: string, ctx = scratch()): Rgb {
  if (!ctx) return [0, 0, 0];
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000'; // the browser ignores an invalid colour, which would otherwise repeat the last one
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const luminance = (px: Uint8ClampedArray, i: number) =>
  0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0);

/**
 * Maps every pixel's brightness onto a ramp of flat shades, darkest first. Brightness is stretched between the
 * 2nd and 98th percentile first, so any photo uses the whole ramp. `steps` are the thresholds between shades
 * (one fewer than the ramp), on that stretched 0..1 scale. Works in place on RGBA data.
 */
export function quantiseToRamp(px: Uint8ClampedArray, ramp: readonly Rgb[], steps: readonly number[]): void {
  const n = px.length / 4;
  const lum = Array.from({ length: n }, (_, k) => luminance(px, k * 4));
  const sorted = [...lum].sort((a, b) => a - b);
  const lo = sorted[Math.floor(n * 0.02)] ?? 0;
  const hi = sorted[Math.floor(n * 0.98)] ?? 255;
  const span = hi - lo || 1;
  lum.forEach((v, k) => {
    const t = Math.max(0, Math.min(1, (v - lo) / span)) ** 0.8;
    let i = steps.findIndex((s) => t < s);
    if (i < 0) i = steps.length;
    paint(px, k * 4, ramp[Math.min(i, ramp.length - 1)]);
  });
}

/** Snaps every pixel to the nearest of `colours` (straight RGB distance). Works in place on RGBA data. */
export function snapToNearest(px: Uint8ClampedArray, colours: readonly Rgb[]): void {
  for (let q = 0; q < px.length; q += 4) {
    let best = colours[0];
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of colours) {
      const d = (c[0] - (px[q] ?? 0)) ** 2 + (c[1] - (px[q + 1] ?? 0)) ** 2 + (c[2] - (px[q + 2] ?? 0)) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    paint(px, q, best);
  }
}

function paint(px: Uint8ClampedArray, i: number, c: Rgb | undefined): void {
  if (!c) return;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = 255;
}
