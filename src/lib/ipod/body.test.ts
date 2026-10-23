import { describe, expect, it } from 'vitest';
import { disc, glyphPath, pixelIpod, roundedRect, stepShape } from './body';

describe('stepShape', () => {
  it('fills a square inside a 2px edge and merges identical rows', () => {
    const [fill, edge] = stepShape(8, 8, () => true, 1);
    expect(fill).toBe('M2 2h4v4h-4z');
    // top two rows, the four middle rows (left and right edge), bottom two rows
    expect(edge).toBe('M0 0h8v2h-8zM0 2h2v4h-2zM6 2h2v4h-2zM0 6h8v2h-8z');
  });

  it('draws nothing outside the shape', () => {
    expect(stepShape(10, 10, () => false, 2)).toEqual(['', '']);
  });

  it('has shape tests for rounded rectangles and discs', () => {
    const rr = roundedRect(100, 100, 20);
    expect(rr(1, 1)).toBe(false);
    expect(rr(50, 1)).toBe(true);
    expect(disc(10, 10, 5)(10, 14)).toBe(true);
    expect(disc(10, 10, 5)(14, 14)).toBe(false);
  });

  it('draws bitmap glyphs at 2px', () => {
    expect(glyphPath(['#.', '.#'], 10, 20)).toBe('M10 20h2v2h-2zM12 22h2v2h-2z');
  });

  it('gives the pixel iPod a path for every part, small enough to build on the fly', () => {
    const paths = pixelIpod();
    expect(Object.keys(paths).sort()).toEqual(
      [
        'body-edge',
        'body-fill',
        'hub-edge',
        'hub-fill',
        'labels',
        'lit-menu',
        'lit-next',
        'lit-play',
        'lit-prev',
        'ring-edge',
        'ring-fill',
      ].sort(),
    );
    for (const d of Object.values(paths)) expect(d.length).toBeGreaterThan(0);
  });
});
