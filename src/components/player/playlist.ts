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
