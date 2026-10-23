/** Pixel art for each project's cartridge label in pixel mode, keyed by project id. '#' is a lit pixel. */
export const labelArt: Record<string, string[]> = {
  // a ticket checked off
  pipeline: [
    '...........',
    '..........#',
    '.........##',
    '#.......##.',
    '##.....##..',
    '.##...##...',
    '..##.##....',
    '...###.....',
    '....#......',
  ],
  // the clinic's appointment book
  frontdesk: [
    '..#.....#..',
    '###########',
    '###########',
    '#.........#',
    '#.##.##.#.#',
    '#.........#',
    '#.##.#.##.#',
    '#.........#',
    '###########',
  ],
  // a tiny desktop
  tinydesktop: [
    '###########',
    '#.........#',
    '#.##......#',
    '#.##..###.#',
    '#.....#.#.#',
    '#.....###.#',
    '###########',
    '....###....',
    '..#######..',
  ],
  // the RISC-V chip
  prefetch: [
    '.#.#.#.#.#.',
    '###########',
    '.#.......#.',
    '##.#####.##',
    '.#.#...#.#.',
    '##.#####.##',
    '.#.......#.',
    '###########',
    '.#.#.#.#.#.',
  ],
};

/** One SVG path that fills every lit pixel, a rectangle per horizontal run, in grid units. */
export function spritePath(rows: string[]): string {
  const runs: string[] = [];
  rows.forEach((row, y) => {
    for (const m of row.matchAll(/#+/g)) runs.push(`M${m.index},${y}h${m[0].length}v1h-${m[0].length}z`);
  });
  return runs.join('');
}
