import { describe, expect, it } from 'vitest';
import { skipTarget } from './store';

describe('skipTarget', () => {
  const at = (track: number, position: number) => ({ track, position, playing: true });

  it('moves to the next track from its start, wrapping at the end', () => {
    expect(skipTarget(at(1, 12), 1, 8)).toEqual({ track: 2, position: 0 });
    expect(skipTarget(at(7, 12), 1, 8)).toEqual({ track: 0, position: 0 });
  });

  it('restarts the track when a few seconds in, else goes back one', () => {
    expect(skipTarget(at(3, 12), -1, 8)).toEqual({ track: 3, position: 0 });
    expect(skipTarget(at(3, 1), -1, 8)).toEqual({ track: 2, position: 0 });
    expect(skipTarget(at(0, 0), -1, 8)).toEqual({ track: 7, position: 0 });
  });
});
