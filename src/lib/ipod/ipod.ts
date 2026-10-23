import { ipod } from '../../content/ipod';
import { playlist } from '../../content/music';
import { lcdColours } from '../canvas/colours';
import { whileVisible } from '../canvas/loop';
import { painter } from '../canvas/paint';
import { snapToNearest, toRgb } from '../canvas/quantise';
import { prefersReducedMotion } from '../motion';
import { play, seek, skip, toggle } from '../music/player';
import { music } from '../music/store';
import { getSkin, onSkinChange, token } from '../skin';
import { pixelIpod } from './body';
import { coverFor, coverSvg, type Ink } from './covers';
import { drawIpod, type IpodView, ROWS, scrollTop } from './screen';
import { clickWheel } from './wheel';

/** Wires one iPod: its screen, its click wheel and its buttons, all on the shared music store. */
export function mountIpod(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-lcd]');
  const art = root.querySelector<HTMLCanvasElement>('[data-cover]');
  const wheel = root.querySelector<HTMLElement>('[data-wheel]');
  const live = root.querySelector('[data-say]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !art || !wheel || !live || !ctx) return;

  const p = painter(ctx);
  let c = lcdColours();
  const v: IpodView = { now: false, sel: 0, top: 0, t: 0, t0: 0, still: prefersReducedMotion() };
  let coverKey = '';

  const say = (msg: string) => {
    live.textContent = msg;
  };
  const sayPlaying = () => {
    const { track, playing } = music.get();
    const t = playlist[track];
    if (t) say(ipod.sayPlaying(t.title, t.artist, playing));
  };

  function render(): void {
    v.still = prefersReducedMotion();
    drawIpod(p, c, v, music.get());
    drawCover();
  }

  // Now Playing art sits on its own canvas over the LCD: 72px drawn in ink, 18px snapped to the LCD shades in pixel
  const drawCover = (): void => {
    art.hidden = !v.now;
    const pixel = getSkin().mode === 'pixel';
    const { track } = music.get();
    const size = pixel ? 18 : 72;
    const key = `${track}/${c.bg}/${c.accent}/${size}`;
    if (!v.now || key === coverKey) return;
    coverKey = key;
    const colours: Record<Ink, string> = pixel
      ? { p: c.fg, i: c.bg, r: c.accent, h: c.dim }
      : { p: token('--card'), i: c.fg, r: c.accent, h: c.dim };
    const img = new Image();
    img.onload = () => {
      const g = art.getContext('2d', { willReadFrequently: pixel });
      if (coverKey !== key || !g) return;
      art.width = size;
      art.height = size;
      g.drawImage(img, 0, 0, size, size);
      if (!pixel) return;
      const data = g.getImageData(0, 0, size, size);
      snapToNearest(
        data.data,
        Object.values(colours).map((colour) => toRgb(colour)),
      );
      g.putImageData(data, 0, 0);
    };
    img.src = `data:image/svg+xml,${encodeURIComponent(coverSvg(coverFor(playlist[track]?.id ?? ''), colours, pixel))}`;
  };

  function show(now: boolean): void {
    v.now = now;
    if (!now) {
      v.sel = music.get().track;
      v.top = Math.max(0, Math.min(v.sel - 2, playlist.length - ROWS));
    }
    v.t0 = v.t;
    render();
  }

  function spin(step: 1 | -1): void {
    if (v.now)
      seek(music.get().position + step * 5); // on Now Playing the wheel scrubs
    else {
      v.sel = Math.max(0, Math.min(playlist.length - 1, v.sel + step));
      v.top = scrollTop(v.sel, v.top);
      v.t0 = v.t;
      const t = playlist[v.sel];
      if (t) say(ipod.sayRow(v.sel + 1, playlist.length, t.title, t.artist));
    }
    render();
  }

  const andSay = (act: () => void) => () => {
    act();
    sayPlaying();
  };
  const actions: Record<string, () => void> = {
    menu: () => show(!v.now),
    centre: andSay(() => {
      if (v.now) toggle();
      else {
        play(v.sel);
        show(true);
      }
    }),
    next: andSay(() => skip(1)),
    prev: andSay(() => skip(-1)),
    play: andSay(toggle),
  };

  for (const b of wheel.querySelectorAll<HTMLButtonElement>('[data-key]')) {
    b.addEventListener('click', () => actions[b.dataset.key ?? '']?.());
  }
  clickWheel(wheel, spin);
  root.addEventListener('keydown', (e) => {
    const step = ({ ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as Record<string, 1 | -1>)[
      e.key
    ];
    if (step) {
      e.preventDefault();
      spin(step);
    } else if (e.target === canvas.parentElement && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      actions.centre?.();
    }
  });

  music.subscribe((next, prev) => {
    if (next.track !== prev.track) v.t0 = v.t; // a new track starts its marquee from the top
    render();
  });

  let bodyDrawn = false;
  const paintBody = () => {
    if (bodyDrawn || getSkin().mode !== 'pixel') return;
    bodyDrawn = true;
    for (const [name, d] of Object.entries(pixelIpod()))
      root.querySelector(`[data-path="${name}"]`)?.setAttribute('d', d);
  };
  onSkinChange(() => {
    c = lcdColours();
    paintBody();
    render();
  });
  paintBody();

  whileVisible(canvas, (_, ticked) => {
    if (!ticked) return;
    v.t++;
    render();
  });
  render();
}
