const STEP: Record<string, (i: number, n: number) => number> = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
};

/** The tab a key moves to from tab i of n, or null when the key is not a tab key. */
export function tabAfterKey(key: string, i: number, n: number): number | null {
  const step = STEP[key];
  return step ? step(i, n) : null;
}
