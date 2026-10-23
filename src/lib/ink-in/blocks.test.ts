import { describe, expect, it } from 'vitest';
import { blockAt, finishedAt, SETTLE, scatter } from './blocks';

const cells = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 20) * 10,
  y: Math.floor(i / 20) * 10,
  group: i % 20,
}));

describe('scatter', () => {
  it('starts every block at most one cell away', () => {
    for (const b of scatter(cells, 200)) {
      expect(Math.abs(b.dx)).toBeLessThanOrEqual(1);
      expect(Math.abs(b.dy)).toBeLessThanOrEqual(1);
    }
  });

  it('moves each letter as one', () => {
    const blocks = scatter(cells, 200);
    for (const b of blocks) {
      const first = blocks.find((o) => o.x === b.x);
      expect([b.dx, b.dy, b.at]).toEqual([first?.dx, first?.dy, first?.at]);
    }
  });

  it('sweeps left to right', () => {
    const [left, right] = scatter(
      [
        { x: 0, y: 0, group: 0 },
        { x: 200, y: 0, group: 1 },
      ],
      200,
      () => 0.5,
    );
    expect(left?.at).toBeLessThan(right?.at ?? 0);
  });
});

describe('blockAt', () => {
  const b = { x: 0, y: 0, dx: 1, dy: -1, at: 100 };

  it('is drawn from the first frame, waits off home until its start, then settles home', () => {
    expect(blockAt(b, 0)).toEqual({ dx: 1, dy: -1 });
    expect(blockAt(b, 100)).toEqual({ dx: 1, dy: -1 });
    expect(blockAt(b, 100 + SETTLE)).toEqual({ dx: 0, dy: 0 });
  });

  it('only ever sits on whole cells', () => {
    for (let t = 0; t < 500; t += 7) {
      const p = blockAt(b, t);
      expect(Number.isInteger(p?.dx) && Number.isInteger(p?.dy)).toBe(true);
    }
  });
});

describe('finishedAt', () => {
  it('waits for the latest block', () => {
    expect(finishedAt([{ x: 0, y: 0, dx: 0, dy: 0, at: 400 }])).toBe(400 + SETTLE);
    expect(finishedAt([])).toBe(SETTLE);
  });
});
