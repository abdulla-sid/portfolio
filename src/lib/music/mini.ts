import { player, playlist } from '../../content/music';
import { toggle } from './player';
import { music } from './store';

/** Binds a top-bar player: one play/pause button and the current track's name. */
export function mountMini(root: HTMLElement): void {
  const button = root.querySelector('button');
  const label = root.querySelector('[data-track]');
  if (!button || !label) return;
  const sync = () => {
    const { track, playing } = music.get();
    const t = playlist[track];
    button.setAttribute('aria-pressed', String(playing));
    label.textContent = t ? player.track(t) : '';
  };
  button.addEventListener('click', toggle);
  music.subscribe((next, prev) => {
    if (next.track !== prev.track || next.playing !== prev.playing) sync();
  });
  sync();
}
