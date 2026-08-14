/**
 * How many numbered preset buttons the deck offers. The playlist is the source
 * of truth for how many exist, but the deck's chassis narrows to 294px on a
 * tall phone, which is where this ceiling comes from. Tracks past it stay
 * reachable through the transport buttons and the iPod menu.
 */
export const PRESET_LIMIT = 8;

export function nextPlayableIndex(
  playable: boolean[],
  current: number,
  dir: 1 | -1,
): number | null {
  const len = playable.length;
  for (let n = 1; n <= len; n++) {
    const i = (((current + dir * n) % len) + len) % len;
    if (playable[i]) return i;
  }
  return null;
}
