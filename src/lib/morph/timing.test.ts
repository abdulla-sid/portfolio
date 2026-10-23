import { describe, expect, it } from 'vitest';
import { END, pullBack, redraw, SWAP, stagger, toneStep } from './timing';

describe('stagger', () => {
  it('spreads items over the span, capped', () => {
    expect(stagger(5, 200, 100)).toBe(50);
    expect(stagger(3, 200, 12)).toBe(12);
    expect(stagger(1, 200, 12)).toBe(12);
    expect(stagger(0, 200, 300)).toBe(200);
  });
});

describe('toneStep', () => {
  it('steps from the old paper to the new one', () => {
    expect([0, 60, 200, SWAP, 500].map(toneStep)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('pullBack', () => {
  it('starts full and is gone just before the swap', () => {
    expect(pullBack(400, 0)).toBe(400);
    expect(pullBack(400, SWAP - 20)).toBe(0);
    expect(pullBack(400, SWAP + 100)).toBe(0);
  });
});

describe('redraw', () => {
  it('grows from nothing to the full length by the end', () => {
    expect(redraw(500, SWAP, false)).toBe(0);
    expect(redraw(500, END, false)).toBe(500);
    expect(redraw(500, (SWAP + END) / 2, false)).toBeGreaterThan(250);
  });

  it('moves in whole 12px runs in pixel mode', () => {
    expect(redraw(500, 500, true) % 12).toBe(0);
  });
});
