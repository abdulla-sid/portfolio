import { describe, expect, it } from 'vitest';
import { alongRing, angleDelta, onRing, touchSpins } from './wheel';

describe('click wheel geometry', () => {
  it('wraps angle differences across the -PI/PI seam', () => {
    expect(angleDelta(0, 0.5)).toBeCloseTo(0.5);
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleDelta(-3, 3)).toBeCloseTo(6 - 2 * Math.PI);
  });

  it('knows the ring from the centre button and the outside', () => {
    expect(onRing(0, 50, 68)).toBe(true);
    expect(onRing(0, 10, 68)).toBe(false);
    expect(onRing(0, 80, 68)).toBe(false);
  });

  it('tells a move along the ring from one across it', () => {
    expect(alongRing(50, 0, 0, 10)).toBe(true);
    expect(alongRing(50, 0, 10, 0)).toBe(false);
    expect(alongRing(0, 50, 0, 12)).toBe(false);
  });

  it('waits 12px before judging a touch', () => {
    expect(touchSpins(-45, 0, 0, 8)).toBe(null);
    expect(touchSpins(0, -45, 13, 0)).toBe(true); // top of the ring, sideways: a spin
    expect(touchSpins(-32, -32, 9, -9)).toBe(true); // between the two, along the ring
    expect(touchSpins(0, -45, 0, 13)).toBe(false); // top of the ring, towards the centre
  });

  it('on the side of the ring, tells a circle from a straight upright flick', () => {
    expect(touchSpins(-45, 0, 0, 14)).toBe(null); // too early to tell
    expect(touchSpins(-45, 0, 3, 12)).toBe(null);
    expect(touchSpins(-45, 0, 0, 25)).toBe(false); // straight down: drifted outwards, a scroll
    const a = (35 * Math.PI) / 180; // 35 degrees round the ring, up from 9 o'clock
    expect(touchSpins(-45, 0, 45 - 45 * Math.cos(a), -45 * Math.sin(a))).toBe(true);
  });
});
