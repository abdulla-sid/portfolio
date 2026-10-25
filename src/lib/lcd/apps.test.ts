import { describe, expect, it } from 'vitest';
import { savedExtra, verdict } from './apps';

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

describe('coffee verdict', () => {
  it('judges the count', () => {
    expect(verdict(0)).toBeUndefined();
    expect(verdict(1)).toBeUndefined();
    expect(verdict(2)).toBe('Productive');
    expect(verdict(4)).toBe('Very productive');
    expect(verdict(6)).toBe('This is a cry for help');
    expect(verdict(8)).toBe('Send help');
    expect(verdict(99)).toBe('Send help');
  });
});
