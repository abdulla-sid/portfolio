import { describe, expect, it } from 'vitest';
import { quantiseToRamp, snapToNearest, toRgb } from './quantise';

const pixels = (...rgb: number[][]) =>
  new Uint8ClampedArray(rgb.flatMap(([r = 0, g = 0, b = 0]) => [r, g, b, 128]));

describe('quantiser', () => {
  it('maps brightness onto the ramp, stretched so the darkest and lightest use its ends', () => {
    const px = pixels([40, 40, 40], [60, 60, 60], [120, 120, 120], [200, 200, 200]);
    quantiseToRamp(
      px,
      [
        [0, 0, 1],
        [0, 0, 2],
        [0, 0, 3],
      ],
      [0.3, 0.7],
    );
    expect([px[2], px[6], px[10], px[14]]).toEqual([1, 1, 2, 3]);
    expect(px[3]).toBe(255);
  });

  it('snaps to the nearest colour', () => {
    const px = pixels([250, 10, 10], [10, 10, 240]);
    snapToNearest(px, [
      [255, 0, 0],
      [0, 0, 255],
    ]);
    expect([...px]).toEqual([255, 0, 0, 255, 0, 0, 255, 255]);
  });
});

// A one-pixel stand-in for a canvas: it knows a few colours and, like a browser, ignores ones it cannot parse.
function fakeCanvas() {
  const known: Record<string, number[]> = { '#000': [0, 0, 0], 'oklch(70% 0.1 300)': [180, 150, 220] };
  let style = '#000';
  let pixel = [0, 0, 0, 0];
  return {
    get fillStyle() {
      return style;
    },
    set fillStyle(c: string) {
      if (c in known) style = c;
    },
    clearRect: () => {
      pixel = [0, 0, 0, 0];
    },
    fillRect: () => {
      pixel = [...(known[style] ?? []), 255];
    },
    getImageData: () => ({ data: new Uint8ClampedArray(pixel) }) as ImageData,
  };
}

describe('toRgb', () => {
  it('reads any colour the canvas understands from the painted pixel', () => {
    const ctx = fakeCanvas();
    expect(toRgb('oklch(70% 0.1 300)', ctx)).toEqual([180, 150, 220]);
  });

  it('gives black for a colour the canvas rejects, not the previous colour', () => {
    const ctx = fakeCanvas();
    toRgb('oklch(70% 0.1 300)', ctx);
    expect(toRgb('not-a-colour', ctx)).toEqual([0, 0, 0]);
  });
});
