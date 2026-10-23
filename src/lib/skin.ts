import { STORAGE_KEYS } from './skin-keys';
import { createStore } from './store';

export type Mode = 'ink' | 'pixel';
export interface Skin {
  mode: Mode;
}

const root = document.documentElement;

// Base.astro's inline script already put the saved skin on <html> before first paint; start from there.
const store = createStore<Skin>({ mode: root.dataset.mode === 'pixel' ? 'pixel' : 'ink' });
// the URL shows a saved pixel skin too, as setSkin keeps it, so Back from a fragment (#work) lands on #pixel
if (store.get().mode === 'pixel' && !location.hash) history.replaceState(null, '', '#pixel');

export const getSkin = (): Skin => store.get();
export const onSkinChange = store.subscribe;

/** Applies a skin: attributes on <html> (CSS follows), storage, the #pixel hash, then subscribers. */
export function setSkin(patch: Partial<Skin>): void {
  const next = { ...store.get(), ...patch };
  root.dataset.mode = next.mode;
  try {
    localStorage.setItem(STORAGE_KEYS.mode, next.mode);
  } catch {
    // storage blocked (private mode): the choice just isn't remembered
  }
  const hash = next.mode === 'pixel' ? '#pixel' : '';
  if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
  store.set(next);
  syncThemeColor();
}

/** A colour or value from tokens.css for the current skin, for canvases and the map. */
export function token(name: `--${string}`): string {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

/** The phone browser's bar takes the page colour of the current skin. */
function syncThemeColor(): void {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', token('--paper'));
}

syncThemeColor();
