import { describe, expect, it } from 'vitest';
import { DIGITS, FONT, parseGlyphs } from './glyphs';
import { bigWidth, mmss, painter, textWidth, truncate, wrap } from './paint';

describe('glyphs', () => {
  it('parses the compact table into 3x5 glyphs', () => {
    expect(parseGlyphs('A .#./#.# B ##./##.')).toEqual({ A: ['.#.', '#.#'], B: ['##.', '##.'] });
    for (const rows of Object.values(FONT)) expect(rows.map((r) => r.length)).toEqual([3, 3, 3, 3, 3]);
    expect(DIGITS).toHaveLength(10);
  });
});

describe('measuring and fitting text', () => {
  it('measures the small font and the big digits', () => {
    expect(textWidth('AB')).toBe(7);
    expect(textWidth('AB', 2)).toBe(14);
    expect(textWidth('')).toBe(0);
    expect(bigWidth('12:34')).toBe(4 * 24 + 8 - 4);
  });

  it('cuts long text with an ellipsis that still fits', () => {
    expect(truncate('Short', 40)).toBe('Short');
    const cut = truncate('Drunk Drivers/Killer Whales', 40);
    expect(cut.endsWith('...')).toBe(true);
    expect(textWidth(cut)).toBeLessThanOrEqual(40);
  });

  it('wraps at spaces and ends the last allowed line with an ellipsis', () => {
    expect(wrap("The Hitchhiker's Guide to the Galaxy", 21, 3)).toEqual([
      "The Hitchhiker's",
      'Guide to the Galaxy',
    ]);
    const lines = wrap('one two three four five six seven', 9, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1]?.endsWith('...')).toBe(true);
  });
});

describe('mmss', () => {
  it('formats seconds as m:ss', () => {
    expect(mmss(0)).toBe('0:00');
    expect(mmss(29.9)).toBe('0:29');
    expect(mmss(125)).toBe('2:05');
    expect(mmss(-3)).toBe('0:00');
  });
});

describe('painter icons', () => {
  const rects = (draw: (p: ReturnType<typeof painter>) => void) => {
    const out: number[][] = [];
    const ctx = { fillRect: (...r: number[]) => out.push(r) } as unknown as CanvasRenderingContext2D;
    draw(painter(ctx));
    return out;
  };

  it('steps the play triangle down to a point and spaces the pause bars one bar apart', () => {
    expect(rects((p) => p.playIcon(4, 40, 7, '#000'))).toEqual([
      [4, 40, 1, 7],
      [5, 41, 1, 5],
      [6, 42, 1, 3],
      [7, 43, 1, 1],
    ]);
    expect(rects((p) => p.pauseIcon(4, 40, 2, 7, '#000'))).toEqual([
      [4, 40, 2, 7],
      [8, 40, 2, 7],
    ]);
  });
});
