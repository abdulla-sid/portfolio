import { describe, expect, it } from 'vitest';
import { depthTable, lengthAbove, lengthAt } from './depth';

describe('depth table', () => {
  // a line that goes down to 100, back up to 50, then down to 200
  const ys = [0, 50, 100, 75, 50, 100, 150, 200];
  const table = depthTable(70, (len) => ({ x: 0, y: ys[Math.round(len / 10)] ?? 200 }), 10);

  it('spreads the way back up over the depths around it, so a loop draws round as you scroll', () => {
    // the deepest point so far would stall at 100 for the whole way back up, then draw it all in one step
    expect(table.map(([, depth]) => depth)).toEqual([0, 50, 70, 90, 110, 130, 150, 200]);
  });

  it('leaves a line that only heads down as it is', () => {
    const down = depthTable(30, (len) => ({ x: 0, y: [0, 40, 40, 90][len / 10] ?? 90 }), 10);
    expect(down.map(([, depth]) => depth)).toEqual([0, 40, 40, 90]);
  });

  it('finds how much line stays above a y', () => {
    expect(lengthAbove(table, 120)).toBe(45); // between the rows at 40 (depth 110) and 50 (depth 130)
    expect(lengthAbove(table, 100)).toBe(35);
    expect(lengthAbove(table, -5)).toBe(0);
    expect(lengthAbove(table, 999)).toBe(70);
  });

  it('finds where the line first reaches a y', () => {
    expect(lengthAt(table, 100)).toBe(35);
    expect(lengthAt(table, 75)).toBe(22.5);
    expect(lengthAt(table, 999)).toBe(70);
  });
});
