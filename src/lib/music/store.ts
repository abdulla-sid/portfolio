import { createStore } from '../store';

export interface MusicState {
  /** Index into the playlist in content/music.ts. */
  track: number;
  playing: boolean;
  /** Seconds into the track. */
  position: number;
}

/** iTunes previews run 30 seconds; tracks without one simulate the same length. */
export const TRACK_SECONDS = 30;

/** Under this many seconds in, "previous" goes to the previous track instead of restarting this one. */
const RESTART_AFTER = 3;

/** The one music state shared by the LCD's music app and the iPod. Change it through player.ts. */
export const music = createStore<MusicState>({ track: 0, playing: false, position: 0 });

/** Where skipping by `delta` lands: the next or previous track from the start, or the start of this one. */
export function skipTarget(
  state: MusicState,
  delta: 1 | -1,
  count: number,
): Pick<MusicState, 'track' | 'position'> {
  if (delta < 0 && state.position > RESTART_AFTER) return { track: state.track, position: 0 };
  return { track: (((state.track + delta) % count) + count) % count, position: 0 };
}
