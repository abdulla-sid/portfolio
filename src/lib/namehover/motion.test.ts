import { describe, expect, it } from 'vitest';
import {
  canDisturb,
  capVector,
  cellRect,
  coverage,
  disturbanceCost,
  impulse,
  inkDrop,
  PIXEL_SETTLE_MS,
  scatterKick,
  spring,
  stepOffset,
} from './motion';

describe('pointer energy', () => {
  it('ignores still, creeping and invalid input', () => {
    expect(impulse(0, 0, 16)).toBeNull();
    expect(impulse(1, 0, 100)).toBeNull();
    expect(impulse(5, 0, 0)).toBeNull();
  });
  it('caps fast flicks without changing their direction', () => {
    expect(impulse(300, 400, 1)).toEqual({ speed: 2.2, nx: 0.6, ny: 0.8 });
    expect(impulse(3, 4, 10)?.speed).toBe(0.5);
  });
});

for (const pixel of [false, true]) {
  it(`returns ${pixel ? 'pixels' : 'ink'} home within its settling time`, () => {
    let state = { offset: 0, velocity: 2200 };
    const frames = pixel ? 90 : 66;
    for (let i = 0; i < frames; i++) state = spring(state.offset, state.velocity, 1 / 60, pixel);
    expect(Math.abs(state.offset)).toBeLessThan(pixel ? 0.5 : 0.1);
    expect(Math.abs(state.velocity)).toBeLessThan(1);
  });
}

it('quantises both axes to complete cells', () => {
  expect(stepOffset(13, 5)).toBe(15);
  expect(stepOffset(-13, 5)).toBe(-15);
  expect(stepOffset(2, 5)).toBe(0);
});

it('samples edge ink for pixels and mean coverage for ink, including outside the raster', () => {
  const rgba = new Uint8ClampedArray(4 * 4 * 4);
  rgba[3] = 255;
  expect(coverage(rgba, 4, 4, 0, 0, 2, true)).toBe(1);
  expect(coverage(rgba, 4, 4, 0, 0, 2, false)).toBe(0.25);
  expect(coverage(rgba, 4, 4, -2, -2, 2, true)).toBe(0);
  expect(coverage(rgba, 4, 4, 4, 4, 2, true)).toBe(0);
});

it('caps accumulated smear energy while preserving its direction', () => {
  expect(capVector(300, 400, 10)).toEqual({ x: 6, y: 8 });
  expect(capVector(3, 4, 10)).toEqual({ x: 3, y: 4 });
  expect(capVector(0, 0, 10)).toEqual({ x: 0, y: 0 });
  expect(Number.isInteger(stepOffset(13, 5.3))).toBe(true);
});

it('lets pixel motion carry more energy without changing the ink cap', () => {
  expect(impulse(300, 400, 1, true)).toEqual({ speed: 5, nx: 0.6, ny: 0.8 });
  expect(impulse(300, 400, 1, false)?.speed).toBe(2.2);
});

it('scatters several cells out at normal speed and then overshoots and settles', () => {
  const kick = scatterKick(1, 0, 0, 0, 0, 50, 1.2, 0.7, 0.5, 1);
  let state = { offset: 0, velocity: kick.x };
  let peak = 0;
  let crossedHome = false;
  for (let frame = 0; frame < 90; frame++) {
    state = spring(state.offset, state.velocity, 1 / 60, true);
    peak = Math.max(peak, stepOffset(state.offset, 6.5));
    if (state.offset < 0) crossedHome = true;
  }
  expect(peak / 6.5).toBeGreaterThan(3);
  expect(kick.y).toBeGreaterThan(0);
  expect(crossedHome).toBe(true);
  expect(Math.abs(state.offset)).toBeLessThan(0.05);
  expect(Math.abs(state.velocity)).toBeLessThan(1);
});

it('kicks outward on either side of the pointer path and varies with the random input', () => {
  const above = scatterKick(1, 0, 0, -10, 10, 50, 1, 0, 0, 1);
  const below = scatterKick(1, 0, 0, 10, 10, 50, 1, 0, 0, 1);
  expect(above.y).toBeLessThan(0);
  expect(below.y).toBeGreaterThan(0);
  expect(scatterKick(1, 0, 0, 10, 10, 50, 1, 0.8, 1, 1)).not.toEqual(below);
  expect(scatterKick(1, 0, 0, 50, 50, 50, 1, 0.8, 1, 1)).toEqual({ x: 0, y: 0 });
});

it('uses identical integer rectangles for cutouts and moved cells without gaps between neighbours', () => {
  const cell = 7.37;
  let previous = cellRect(10.2, 15.6, cell);
  for (let i = 1; i < 20; i++) {
    const next = cellRect(10.2 + i * cell, 15.6, cell);
    expect(previous.x + previous.w).toBe(next.x);
    for (const value of Object.values(next)) expect(Number.isInteger(value)).toBe(true);
    const offset = stepOffset(40 - i, cell);
    expect(next.x + offset - offset).toBe(next.x);
    previous = next;
  }
});

for (const pixel of [false, true]) {
  it(`caps ${pixel ? 'loose pixel cells' : 'round ink cutouts'} per letter through repeated scribbles`, () => {
    const totals = [8, 80, 300];
    const used = totals.map(() => 0);
    const active = totals.map(() => new Map<number, number>());
    for (let frame = 0; frame < 240; frame++) {
      totals.forEach((total, letter) => {
        const cells = active[letter];
        if (!cells) throw new Error('Missing letter');
        // Returning cells free capacity; further strokes can use it without exceeding the cap.
        if (frame % 3 === 0) {
          for (const [i, cost] of cells) {
            used[letter] = Math.max(0, (used[letter] ?? 0) - cost);
            cells.delete(i);
            break;
          }
        }
        for (let i = 0; i < total; i++) {
          if (cells.has(i)) continue;
          const cost = disturbanceCost(pixel);
          if (!canDisturb(total, used[letter] ?? 0, cost)) continue;
          cells.set(i, cost);
          used[letter] = (used[letter] ?? 0) + cost;
        }
        expect(cells.size).toBeGreaterThan(0);
        expect(used[letter]).toBeLessThanOrEqual(total * 0.35 + 1e-9);
        if (pixel) expect(cells.size).toBeLessThanOrEqual(Math.floor(total * 0.35));
      });
    }
    expect(canDisturb(0, 0, disturbanceCost(pixel))).toBe(false);
    expect(canDisturb(100, 35, disturbanceCost(pixel))).toBe(false);
    expect(canDisturb(100, 0, disturbanceCost(pixel))).toBe(true);
  });
}

it('caps opaque round drop sizes on fast flicks and shrinks droplets as they slide home', () => {
  const far = inkDrop(3, 1, 100, 100, 5000, true);
  const faster = inkDrop(3, 1, 100, 100, 50000, true);
  const home = inkDrop(3, 1, 0, 100, 0, true);
  expect(far).toEqual(faster);
  expect(home.rx).toBeLessThan(far.rx);
  expect(home.ry).toBeLessThan(far.ry);
  const smear = inkDrop(3, 1, 15, 100, 1000, false);
  expect(smear.rx).toBeGreaterThan(smear.ry);
  expect(smear.ry).toBeGreaterThan(0);
});

it('returns pixel cells to within one final grid step by the 650ms deadline', () => {
  expect(PIXEL_SETTLE_MS).toBeGreaterThanOrEqual(500);
  expect(PIXEL_SETTLE_MS).toBeLessThanOrEqual(700);
  for (const velocity of [-5000, -1000, 1000, 5000]) {
    let state = { offset: 0, velocity };
    for (let ms = 0; ms < PIXEL_SETTLE_MS; ms += 1000 / 60) {
      state = spring(state.offset, state.velocity, 1 / 60, true);
    }
    expect(Math.abs(stepOffset(state.offset, 3.9))).toBeLessThanOrEqual(4);
  }
});
