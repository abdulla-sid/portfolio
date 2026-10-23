import { describe, expect, it } from 'vitest';
import { savedExtra } from './apps';

describe('saved coffee', () => {
  it("counts only today's taps", () => {
    expect(savedExtra('2026-10-23:2', '2026-10-23')).toBe(2);
    expect(savedExtra('2026-10-22:2', '2026-10-23')).toBe(0);
  });

  it('ignores missing or malformed values', () => {
    for (const bad of [null, '', '7', '2026-10-23:x', '2026-10-23:-1', '2026-10-23:1.5']) {
      expect(savedExtra(bad, '2026-10-23')).toBe(0);
    }
  });
});
