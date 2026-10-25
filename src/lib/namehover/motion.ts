/** Reject stationary input and cap energy even when events arrive after a fast flick. */
export function impulse(dx: number, dy: number, ms: number, pixel = false) {
  const length = Math.hypot(dx, dy);
  if (ms <= 0 || length < 0.5 || length / ms < 0.08) return null;
  return { speed: Math.min(pixel ? 5 : 2.2, length / ms), nx: dx / length, ny: dy / length };
}

/** Small integration steps keep a returning stroke stable after a slow frame. */
export function spring(offset: number, velocity: number, seconds: number, pixel: boolean) {
  const frequency = pixel ? 9.5 : 11;
  const damping = pixel ? 0.78 : 1;
  let remaining = Math.min(0.05, Math.max(0, seconds));
  while (remaining > 0) {
    const dt = Math.min(1 / 120, remaining);
    velocity += (-frequency * frequency * offset - 2 * damping * frequency * velocity) * dt;
    offset += velocity * dt;
    remaining -= dt;
  }
  return { offset, velocity };
}

export const stepOffset = (offset: number, cell: number): number =>
  Math.round(Math.round(offset / cell) * cell);

/** Pixel cells keep edge ink; the mean alpha gives the actual ink mass in a fine tile. */
export function coverage(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  cell: number,
  pixel: boolean,
): number {
  const at = (xx: number, yy: number) => {
    const ix = Math.floor(xx);
    const iy = Math.floor(yy);
    return ix < 0 || iy < 0 || ix >= width || iy >= height ? 0 : (rgba[(iy * width + ix) * 4 + 3] ?? 0) / 255;
  };
  let alpha = 0;
  let count = 0;
  for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(height, Math.ceil(y + cell)); yy++) {
    for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(width, Math.ceil(x + cell)); xx++) {
      alpha = pixel ? Math.max(alpha, at(xx, yy)) : alpha + at(xx, yy);
      count++;
    }
  }
  return pixel ? alpha : alpha / (count || 1);
}

/** Repeated changes of direction cannot accumulate a larger smear. */
export function capVector(x: number, y: number, maximum: number) {
  const scale = Math.min(1, maximum / (Math.hypot(x, y) || 1));
  return { x: x * scale, y: y * scale };
}

/** Shared boundaries keep cutouts and translated cells on the same integer grid. */
export function cellRect(x: number, y: number, cell: number) {
  const left = Math.round(x - cell / 2);
  const top = Math.round(y - cell / 2);
  return { x: left, y: top, w: Math.round(x + cell / 2) - left, h: Math.round(y + cell / 2) - top };
}

export const PIXEL_SETTLE_MS = 650;

/** Budget the full circular hole, including any neighbouring stroke it could cut. */
export const disturbanceCost = (pixel: boolean): number => (pixel ? 1 : Math.PI * 0.8 ** 2);

/** Admission preserves solid strokes instead of fading every disturbed part of a letter. */
export const canDisturb = (total: number, used: number, cost: number): boolean =>
  cost > 0 && used + cost <= total * 0.35;

export function inkDrop(
  cell: number,
  alpha: number,
  distance: number,
  fs: number,
  speed: number,
  spatter: boolean,
) {
  const radius = spatter
    ? cell * (0.85 + 0.7 * Math.min(1, distance / (fs * 0.18)))
    : cell * Math.sqrt(alpha) * (0.8 - 0.32 * Math.min(1, distance / (fs * 0.15)));
  const stretch = 1 + Math.min(spatter ? 0.8 : 2.2, speed / (fs * 2.5));
  return { rx: radius * stretch, ry: radius / Math.sqrt(stretch) };
}

export function scatterKick(
  nx: number,
  ny: number,
  qx: number,
  qy: number,
  distance: number,
  radius: number,
  speed: number,
  random: number,
  angle: number,
  weight: number,
) {
  const outwardX = distance > 0.01 ? qx / distance : -ny;
  const outwardY = distance > 0.01 ? qy / distance : nx;
  const falloff = Math.max(0, 1 - distance / radius) ** 1.5 * (0.3 + random ** 2 * 1.4);
  const gain = speed * 500 * falloff * weight;
  const kick = 0.3 + random * 1.1;
  return {
    x: (nx * 0.6 + outwardX * 0.55 + Math.cos(angle) * kick) * gain,
    y: (ny * 0.6 + outwardY * 0.55 + Math.sin(angle) * kick) * gain,
  };
}
