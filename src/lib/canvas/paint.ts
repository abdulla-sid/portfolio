import { type Bitmap, DIGITS, FONT } from './glyphs';

/** The LCD's six shades, read from the --lcd-* tokens by lcdColours(). */
export interface LcdColours {
  bg: string;
  ghost: string;
  dim: string;
  mid: string;
  fg: string;
  accent: string;
}

/** Width in LCD pixels of a string in the 3x5 font: 3 per glyph plus 1 between, times the scale. */
export const textWidth = (str: string, scale = 1): number => Math.max(0, str.length * 4 * scale - scale);

/** Width of a string in the big digits (':' is narrow). */
export const bigWidth = (str: string, scale = 4): number =>
  [...str].reduce((w, ch) => w + (ch === ':' ? 2 : 6) * scale, 0) - scale;

/** Cuts a string to fit maxWidth pixels at scale 1, ending in '...' when cut. */
export function truncate(str: string, maxWidth: number): string {
  const max = Math.floor((maxWidth + 1) / 4);
  return str.length <= max ? str : `${str.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

/** Splits text into lines of at most `width` characters at spaces, at most `lines` of them. */
export function wrap(str: string, width: number, lines: number): string[] {
  const out: string[] = [];
  for (const word of str.split(' ')) {
    const last = out.length - 1;
    if (last >= 0 && `${out[last]} ${word}`.length <= width) out[last] += ` ${word}`;
    else out.push(word);
  }
  if (out.length > lines) out.splice(lines - 1, out.length, out.slice(lines - 1).join(' '));
  return out.map((line) => truncate(line, width * 4 - 1));
}

/** Seconds as m:ss. */
export const mmss = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Drawing helpers on one canvas, in whole LCD pixels. */
export function painter(ctx: CanvasRenderingContext2D) {
  const rect = (x: number, y: number, w: number, h: number, colour: string) => {
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
  };
  const sprite = (rows: Bitmap, x: number, y: number, colours: Record<string, string>, scale = 1) => {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        const c = colours[ch];
        if (c) rect(x0 + i * scale, y0 + j * scale, scale, scale, c);
      });
    });
  };
  const text = (str: string, x: number, y: number, colour: string, scale = 1) => {
    [...str.toUpperCase()].forEach((ch, i) => {
      const glyph = FONT[ch];
      if (glyph) sprite(glyph, x + i * 4 * scale, y, { '#': colour }, scale);
    });
  };
  /** Big digits; `ghost` draws an unlit 8 behind each one, like a segment display. */
  const big = (str: string, x: number, y: number, colour: string, ghost?: string, scale = 4) => {
    let cx = x;
    for (const ch of str) {
      if (ch === ':') {
        rect(cx, y + 2 * scale, scale, scale, colour);
        rect(cx, y + 4 * scale, scale, scale, colour);
        cx += 2 * scale;
        continue;
      }
      if (ghost) sprite(DIGITS[8] as Bitmap, cx, y, { '#': ghost }, scale);
      const digit = DIGITS[Number(ch)];
      if (digit) sprite(digit, cx, y, { '#': colour }, scale);
      cx += 6 * scale;
    }
  };
  /** The play icon: a right-pointing triangle `h` tall. */
  const playIcon = (x: number, y: number, h: number, colour: string) => {
    for (let i = 0; i * 2 < h; i++) rect(x + i, y + i, 1, h - i * 2, colour);
  };
  /** The pause icon: two bars `w` wide, one bar apart. */
  const pauseIcon = (x: number, y: number, w: number, h: number, colour: string) => {
    rect(x, y, w, h, colour);
    rect(x + 2 * w, y, w, h, colour);
  };
  return { ctx, rect, sprite, text, big, playIcon, pauseIcon };
}

export type Painter = ReturnType<typeof painter>;
