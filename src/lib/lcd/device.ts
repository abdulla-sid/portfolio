import { device } from '../../content/device';
import { lcdColours } from '../canvas/colours';
import { whileVisible } from '../canvas/loop';
import { painter } from '../canvas/paint';
import { prefersReducedMotion } from '../motion';
import { music } from '../music/store';
import { onSkinChange } from '../skin';
import { apps, H, W } from './apps';
import { registerLcd } from './controller';

// The screen redraws top to bottom behind a scanline. An app change sweeps quickly. A reboot (the mode switch) stays
// dark while the device is drawn back in, then sweeps slower, finishing as the switch does.
const SWEEP = { app: { hold: 0, row: 2 }, reboot: { hold: 260, row: 4 } }; // ms

/** Wires one device: the screen, the app dots, the red button and arrow keys. */
export function mountDevice(root: HTMLElement): void {
  const canvas = root.querySelector('canvas');
  const screen = root.querySelector<HTMLButtonElement>('[data-screen]');
  const red = root.querySelector<HTMLButtonElement>('[data-red]');
  const live = root.querySelector('[data-say]');
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-app]')];
  const ctx = canvas?.getContext('2d');
  if (!canvas || !screen || !red || !live || !ctx) return;

  const p = painter(ctx);
  let c = lcdColours();
  let app = 0;
  let t = 0;
  let boot = H; // rows redrawn so far
  let sweepAt = 0; // when the current sweep's first row is drawn
  let row = 0; // ms per row

  function render(): void {
    p.rect(0, 0, W, H, c.bg);
    apps[app]?.draw({ p, c, t, still: prefersReducedMotion() });
    if (boot < H) {
      // not yet redrawn below the scanline
      p.rect(0, boot, W, H - boot, c.bg);
      p.rect(0, boot, W, 1, c.mid);
    }
  }

  function announce(): void {
    const a = apps[app];
    if (!a) return;
    dots.forEach((d, i) => {
      d.setAttribute('aria-current', String(i === app));
    });
    screen?.setAttribute('aria-label', device.screen(a.name, !!a.tap));
    const said = a.say();
    if (live && live.textContent !== said) live.textContent = said;
  }

  function sweep({ hold, row: ms }: { hold: number; row: number }): void {
    if (prefersReducedMotion()) boot = H;
    else [boot, sweepAt, row] = [0, performance.now() + hold, ms];
  }

  const reboot = () => {
    sweep(SWEEP.reboot);
    render();
  };

  function go(i: number): void {
    app = (i + apps.length) % apps.length;
    sweep(SWEEP.app);
    announce();
    render();
  }

  red.addEventListener('click', () => go(app + 1));
  dots.forEach((d, i) => {
    d.addEventListener('click', () => go(i));
  });
  screen.addEventListener('click', () => {
    const tap = apps[app]?.tap;
    if (!tap) return go(app + 1);
    tap();
    announce();
    render();
  });
  root.addEventListener('keydown', (e) => {
    const delta = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[e.key];
    if (!delta) return;
    e.preventDefault();
    go(app + delta);
    red.classList.add('pressed');
    setTimeout(() => red.classList.remove('pressed'), 120);
  });

  music.subscribe((next, prev) => {
    if (apps[app]?.id === 'music' && (next.playing !== prev.playing || next.track !== prev.track)) announce();
  });
  onSkinChange(() => {
    c = lcdColours();
    render();
  });
  registerLcd({ reboot });

  whileVisible(canvas, (now, ticked) => {
    if (ticked) t++;
    // from the clock, not frame by frame, so a slow frame never skips rows
    if (boot < H) boot = Math.max(0, Math.min(H, (now - sweepAt) / row));
    else if (!ticked) return;
    render();
  });
  announce();
  render();
}
