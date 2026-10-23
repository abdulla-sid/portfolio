/*
  Drawn album covers for Now Playing: abstract nods to each record, not the real art. Each cover is a list of
  rectangles and words on a 100x100 board in four inks: p(aper), i(nk), r(ed accent), h(alf tone).
*/

export type Ink = 'p' | 'i' | 'r' | 'h';
type Rect = readonly ['r', Ink, number, number, number, number];
/** A word: ink, x, baseline y, font size, text, and an optional width it is stretched to. */
type Word = readonly ['t', Ink, number, number, number, string, number?];
export type Cover = readonly (Rect | Word)[];

const bg = (ink: Ink): Rect => ['r', ink, 0, 0, 100, 100];

/** Keyed by track id (content/music.ts). */
const COVERS: Record<string, Cover> = {
  detonate: [
    bg('r'),
    ['t', 'p', 7, 45, 40, 'deto', 84],
    ['t', 'i', 7, 80, 40, 'nate', 86],
    ['r', 'i', 7, 87, 86, 4],
  ],
  'you-lose': [
    bg('i'),
    ['r', 'r', 42, 18, 16, 48],
    ['r', 'r', 42, 74, 16, 14],
    ['t', 'p', 8, 16, 11, 'you lose'],
  ],
  'ipod-touch': [
    bg('p'),
    ...[16, 40, 64].flatMap((x, a) =>
      [8, 32, 56].map(
        (y, b): Rect => ['r', a === 1 && b === 1 ? 'r' : (a + b) % 2 ? 'i' : 'h', x, y, 18, 18],
      ),
    ),
    ['t', 'i', 16, 94, 15, 'touch', 66],
  ],
  'drunk-drivers': [
    bg('p'),
    ['r', 'i', 0, 0, 100, 58],
    ...[4, 29, 54, 79].map((x): Rect => ['r', 'r', x, 27, 15, 4]),
    ['t', 'i', 7, 77, 12, 'drunk drivers /', 86],
    ['t', 'r', 7, 92, 12, 'killer whales', 80],
  ],
  'all-the-time': [
    bg('p'),
    ...[...'ihirih'].map((ink, k): Word => ['t', ink as Ink, 7, 19 + k * 14, 13, 'all the time', 86]),
  ],
  'under-pressure': [
    bg('p'),
    ['r', 'r', 0, 0, 100, 22],
    ...[
      [30, 11],
      [46, 7],
      [58, 5],
      [67, 3],
      [73, 2],
      [78, 1],
    ].map(([y, h]): Rect => ['r', 'i', 7, y ?? 0, 86, h ?? 0]),
    ['t', 'i', 7, 94, 11, 'under pressure', 86],
  ],
  'feel-good-inc': [
    bg('i'),
    ['r', 'r', 62, 8, 26, 54],
    ...[66, 73, 80].flatMap((x) => [13, 22, 31, 40, 49].map((y): Rect => ['r', 'i', x, y, 4, 5])),
    ['t', 'p', 7, 90, 44, 'inc.', 78],
  ],
  'not-strong-enough': [
    bg('p'),
    ['r', 'i', 16, 10, 16, 68],
    ['r', 'i', 42, 10, 16, 68],
    ['r', 'r', 68, 40, 16, 38],
    ['t', 'i', 16, 93, 10, 'not strong enough', 68],
  ],
};

// a song added later without its own cover still gets a record sleeve
const PLAIN: Cover = [bg('p'), ['r', 'i', 14, 14, 72, 72], ['r', 'r', 42, 42, 16, 16]];

export const coverFor = (id: string): Cover => COVERS[id] ?? PLAIN;

const escapeXml = (s: string) => s.replace(/[<>&"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

/**
 * The cover as an SVG document. `pixel` turns each word into a bar (no letters survive 18px); otherwise small
 * words are left out, as they would only blur.
 */
export function coverSvg(cover: Cover, colours: Record<Ink, string>, pixel: boolean): string {
  const body = cover
    .map((s) => {
      if (s[0] === 'r')
        return `<rect fill="${colours[s[1]]}" x="${s[2]}" y="${s[3]}" width="${s[4]}" height="${s[5]}"/>`;
      const [, ink, x, y, size, text, width] = s;
      if (pixel) {
        const w = width ?? text.length * size * 0.5;
        return `<rect fill="${colours[ink]}" x="${x}" y="${y - size * 0.7}" width="${w}" height="${size * 0.6}"/>`;
      }
      if (size <= 12) return '';
      const stretch = width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : '';
      return `<text fill="${colours[ink]}" x="${x}" y="${y}" font-size="${size}"${stretch}>${escapeXml(text)}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" font-family="Georgia,serif" font-weight="700">${body}</svg>`;
}
