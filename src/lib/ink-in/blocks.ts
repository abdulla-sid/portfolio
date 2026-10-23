/** One cell of the name, drawn from the first frame up to one step off its home, which it snaps to in turn. */
export interface Block {
  x: number;
  y: number;
  /** Start offset, in whole steps (the caller's unit: a pixel of the face). */
  dx: number;
  dy: number;
  /** When it starts moving home, in ms. */
  at: number;
}

export const SETTLE = 150; // with the cubic ease and rounding, a block is home within about a third of this
const DRIFT = 1;
const SWEEP = 500;
const JITTER = 150;

/**
 * Gives each group of cells (a letter) one start offset of at most one step and one start time, sweeping left to
 * right across width, so letters drop into place whole instead of fizzing cell by cell.
 */
export function scatter(
  cells: Array<{ x: number; y: number; group: number }>,
  width: number,
  random = Math.random,
): Block[] {
  const offset = () => Math.round((random() * 2 - 1) * DRIFT);
  const groups = new Map<number, Pick<Block, 'dx' | 'dy' | 'at'>>();
  return cells.map(({ x, y, group }) => {
    let g = groups.get(group);
    if (!g) {
      g = { dx: offset(), dy: offset(), at: (x / width) * SWEEP + random() * JITTER };
      groups.set(group, g);
    }
    return { x, y, ...g };
  });
}

/** Where a block is t ms in: its offset in whole cells until its start, then shrinking to zero (eased out, so it snaps). */
export function blockAt(b: Block, t: number): { dx: number; dy: number } {
  const left = (1 - Math.min(1, Math.max(0, (t - b.at) / SETTLE))) ** 3;
  return { dx: Math.round(b.dx * left) || 0, dy: Math.round(b.dy * left) || 0 };
}

/** When the last block is home. */
export const finishedAt = (blocks: Block[]): number => Math.max(0, ...blocks.map((b) => b.at)) + SETTLE;
