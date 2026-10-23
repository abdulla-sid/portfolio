import { describe, expect, it } from 'vitest';
import { projects } from '../../content/projects';
import { labelArt, spritePath } from './sprites';

describe('spritePath', () => {
  it('draws one rectangle per run of lit pixels', () => {
    expect(spritePath(['##.#', '....', '.###'])).toBe('M0,0h2v1h-2zM3,0h1v1h-1zM1,2h3v1h-3z');
  });

  it('draws nothing for an empty grid', () => {
    expect(spritePath(['...'])).toBe('');
  });
});

describe('labelArt', () => {
  it('has art for every project, each a clean rectangle of pixels', () => {
    for (const { id } of projects) {
      const rows = labelArt[id];
      expect(rows, id).toBeDefined();
      expect(new Set(rows?.map((r) => r.length)).size, id).toBe(1);
      expect(rows?.join('').replace(/[#.]/g, ''), id).toBe('');
    }
  });
});
