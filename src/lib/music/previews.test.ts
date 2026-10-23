import { describe, expect, it } from 'vitest';
import { resolvePreviews } from './previews';

const url = (n: number) => `https://audio-ssl.itunes.apple.com/preview/${n}.m4a`;

describe('resolvePreviews', () => {
  it('looks ids up in one call and searches the rest by title and artist', async () => {
    const calls: string[] = [];
    const get = async (u: string) => {
      calls.push(u);
      if (u.includes('lookup')) return { results: [{ trackId: 1, previewUrl: url(1) }, { trackId: 2 }] };
      return { results: [{ trackId: 9, previewUrl: url(9) }] };
    };
    const tracks = [
      { title: 'A', artist: 'X', itunesId: 1 },
      { title: 'B', artist: 'Y', itunesId: 2 },
      { title: 'C & D', artist: 'Z' },
    ];
    expect(await resolvePreviews(tracks, get)).toEqual([url(1), null, url(9)]);
    expect(calls[0]).toBe('https://itunes.apple.com/lookup?id=1,2');
    expect(calls[1]).toContain('term=C%20%26%20D%20Z');
  });

  it('falls back to no preview on errors, odd bodies and non-Apple URLs', async () => {
    const tracks = [
      { title: 'A', artist: 'X', itunesId: 1 },
      { title: 'B', artist: 'Y' },
    ];
    expect(await resolvePreviews(tracks, () => Promise.reject(new Error('offline')))).toEqual([null, null]);
    expect(await resolvePreviews(tracks, async () => 'nope')).toEqual([null, null]);
    const evil = async () => ({ results: [{ trackId: 1, previewUrl: 'javascript:alert(1)' }] });
    expect(await resolvePreviews(tracks, evil)).toEqual([null, null]);
  });
});
