import { describe, expect, it } from 'vitest';
import { playlist } from '../../content/music';
import { type Cover, coverFor, coverSvg } from './covers';

const inks = { p: '#fff', i: '#000', r: '#f00', h: '#888' };

describe('covers', () => {
  it('has a drawn cover for every song on the playlist, and a plain sleeve for others', () => {
    const plain = coverFor('a song nobody drew');
    for (const t of playlist) expect(coverFor(t.id)).not.toBe(plain);
  });

  it('keeps big words in ink, drops small ones, and escapes text', () => {
    const cover: Cover = [
      ['t', 'i', 0, 50, 40, 'a<b', 80],
      ['t', 'r', 0, 90, 10, 'tiny'],
    ];
    const svg = coverSvg(cover, inks, false);
    expect(svg).toContain('a&#60;b');
    expect(svg).toContain('textLength="80"');
    expect(svg).not.toContain('tiny');
  });

  it('turns words into bars in pixel mode, coloured from the given inks', () => {
    const svg = coverSvg([['t', 'r', 0, 50, 10, 'word']], inks, true);
    expect(svg).not.toContain('<text');
    expect(svg).toContain('<rect fill="#f00" x="0" y="43" width="20" height="6"/>');
  });
});
