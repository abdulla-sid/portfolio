import { describe, expect, it } from 'vitest';
import { marqueeOffset, scrollTop } from './screen';

describe('iPod list', () => {
  it('scrolls only as far as needed to keep the selection on screen', () => {
    expect(scrollTop(2, 0, 5)).toBe(0);
    expect(scrollTop(5, 0, 5)).toBe(1);
    expect(scrollTop(1, 3, 5)).toBe(1);
  });

  it('rests a marquee on its start, then scrolls and loops', () => {
    expect(marqueeOffset(0, 40)).toBe(0);
    expect(marqueeOffset(12, 40)).toBe(0);
    expect(marqueeOffset(20, 40)).toBe(8);
    expect(marqueeOffset(68, 40)).toBe(0);
  });
});
