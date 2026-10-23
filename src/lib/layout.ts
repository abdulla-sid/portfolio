const listeners = new Set<() => void>();

/** fn, run at most once per animation frame however often it is called. */
export function perFrame(fn: () => void): () => void {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}

/** Call after anything changes the page's height or positions (a tab switch, a panel opening). */
export const layoutChanged = perFrame(() => {
  for (const fn of listeners) fn();
});

/** Runs fn after layout changes, window resizes and web fonts finishing loading. */
export function onLayoutChange(fn: () => void): void {
  listeners.add(fn);
}

addEventListener('resize', layoutChanged);
document.fonts?.addEventListener('loadingdone', layoutChanged);
