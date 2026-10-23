import { layoutChanged } from '../layout';
import { prefersReducedMotion } from '../motion';
import { getSkin, onSkinChange, token } from '../skin';
import { thread } from '../thread/thread';
import { blockAt, finishedAt, scatter } from './blocks';
import { INK_IN } from './keys';

/*
  The hero's intro. On the first visit of a session the name inks itself in (ink: a pen outlines each letter, left to
  right, and the ink pools up inside it; pixel: the letters assemble from pixels), the full stop is pressed, and the
  line grows out of it. Later visits just grow the line after the name's rise. Double-click the name to watch it again.
*/

const root = document.documentElement;
const SVG = 'http://www.w3.org/2000/svg';
const name = document.querySelector<HTMLElement>('[data-ink-in="name"]');
const stop = name?.querySelector<HTMLElement>('[data-ink-in="stop"]');

// each intro gets an id; a newer intro, or a mode switch, retires the older one
let current = 0;
let cancelOverlay = () => {};

const nextFrame = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));

/** The line grows out of the full stop until it catches up with scrolling, which then takes over. */
async function growLine(delay: number, id: number): Promise<void> {
  const from = performance.now() + delay;
  while (id === current) {
    const len = Math.max(0, (performance.now() - from) * 1.4);
    if (len >= thread.length()) {
      thread.setDrawn(Number.POSITIVE_INFINITY);
      return;
    }
    thread.setDrawn(len);
    await nextFrame();
  }
}

/** The y of the baseline of el's line: an empty inline-block's top sits on it. */
function baselineOf(el: Element): number {
  const probe = document.createElement('i');
  probe.style.cssText = 'display:inline-block;width:0;height:0';
  el.append(probe);
  const y = probe.getBoundingClientRect().top;
  probe.remove();
  return y;
}

/**
 * Calls fn for each letter of el with its left edge and baseline, relative to (ox, oy), its index in the name, and
 * the element it sits in (whose style it takes: ink's surname is italic).
 */
function eachLetter(
  el: HTMLElement,
  ox: number,
  oy: number,
  fn: (ch: string, x: number, base: number, i: number, holder: Element) => void,
): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let i = 0;
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    const holder = text.parentElement ?? el;
    const base = baselineOf(holder) - oy;
    [...text.data].forEach((ch, k) => {
      range.setStart(text, k);
      range.setEnd(text, k + 1);
      fn(ch, range.getBoundingClientRect().left - ox, base, i++, holder);
    });
  }
}

/** A layer laid exactly over the name, for an intro to draw on while the name itself stays hidden. */
function overlay<T extends HTMLElement | SVGElement>(el: T, box: DOMRect, margin: number): T {
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    `position:absolute;left:${box.left - margin + scrollX}px;top:${box.top - margin + scrollY}px;` +
    `width:${Math.ceil(box.width + margin * 2)}px;height:${Math.ceil(box.height + margin * 2)}px;` +
    'pointer-events:none;overflow:visible;z-index:2';
  document.body.append(el);
  return el;
}

/** Waits up to `ms` for a face to load. */
const fontLoaded = (font: string, ms: number) =>
  Promise.race([document.fonts?.load(font).catch(() => undefined), new Promise((r) => setTimeout(r, ms))]);

const PEN = { stagger: 70, outline: 900, poolAfter: 480, pool: 520 }; // ms

/**
 * Ink mode: each letter is outlined by a pen, left to right, then its ink pools up from the baseline. It waits briefly
 * for the display face so the pen never traces a fallback.
 */
async function pen(el: HTMLElement, id: number): Promise<void> {
  const cs = getComputedStyle(el);
  await fontLoaded(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, 1000);
  if (id !== current) return;

  const fs = Number.parseFloat(cs.fontSize);
  const margin = 20;
  const box = el.getBoundingClientRect();
  const svg = overlay(document.createElementNS(SVG, 'svg'), box, margin);
  const dash = Math.round(fs * 6); // longer than any letter's outline
  const anims: Animation[] = [];
  eachLetter(el, box.left - margin, box.top - margin, (ch, x, base, i, holder) => {
    const font = `font:${getComputedStyle(holder).fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily};fill:none`;
    const [outline, ink] = [0, 1].map(() => {
      const t = document.createElementNS(SVG, 'text');
      t.textContent = ch;
      t.setAttribute('x', String(x));
      t.setAttribute('y', String(base));
      t.style.cssText = font;
      svg.append(t);
      return t;
    }) as [SVGTextElement, SVGTextElement];
    outline.style.stroke = 'var(--ink)';
    outline.style.strokeWidth = `${Math.max(1, fs * 0.007)}px`;
    outline.style.strokeDasharray = `${dash}px`;
    ink.style.fill = 'var(--ink)';
    const delay = i * PEN.stagger;
    anims.push(
      outline.animate([{ strokeDashoffset: `${dash}px` }, { strokeDashoffset: '0px' }], {
        duration: PEN.outline,
        delay,
        easing: 'cubic-bezier(.45,0,.25,1)',
        fill: 'both',
      }),
      ink.animate([{ clipPath: 'inset(100% 0 0 0) fill-box' }, { clipPath: 'inset(0 0 0 0) fill-box' }], {
        duration: PEN.pool,
        delay: delay + PEN.poolAfter,
        easing: 'cubic-bezier(.3,0,.2,1)',
        fill: 'both',
      }),
    );
  });
  // the name itself stays hidden (Hero's CSS) until done() drops the ink-in class and this layer together
  cancelOverlay = () => {
    for (const a of anims) a.cancel();
    svg.remove();
  };
  await Promise.all(anims.map((a) => a.finished)).catch(() => undefined);
}

/**
 * Pixel mode: cuts the name into half-pixels of the face, draws each letter at once up to one pixel of the face off
 * home, and snaps the letters home on the grid, left to right. It waits briefly for the pixel face, then samples the
 * name as the page shows it.
 */
async function assemble(el: HTMLElement, id: number): Promise<void> {
  const cs = getComputedStyle(el);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  await fontLoaded(font, 300);
  if (id !== current) return;

  const fs = Number.parseFloat(cs.fontSize);
  const cell = fs * 0.065; // Pixelify's pixel is .13em; half of it stays on its grid
  const margin = Math.ceil(fs * 0.3);
  const box = el.getBoundingClientRect();
  const [ox, oy] = [box.left - margin, box.top - margin];
  const [w, h] = [Math.ceil(box.width + margin * 2), Math.ceil(box.height + margin * 2)];
  const dpr = devicePixelRatio || 1;

  const source = document.createElement('canvas');
  source.width = w * dpr;
  source.height = h * dpr;
  const src = source.getContext('2d', { willReadFrequently: true });
  if (!src) return;
  src.scale(dpr, dpr);
  src.font = font;
  src.fillStyle = token('--ink');

  // draw each letter where the page put it, then keep the grid cells it inks
  const cells: Array<{ x: number; y: number; group: number }> = [];
  // each line's letters by left edge, numbered across the whole name
  const lines: Array<{ x0: number; base: number; lefts: number[]; first: number }> = [];
  eachLetter(el, ox, oy, (ch, x, base, i) => {
    const line = lines[lines.length - 1];
    if (line?.base === base) line.lefts.push(x);
    else lines.push({ x0: x, base, lefts: [x], first: i });
    src.fillText(ch, x, base);
  });
  const alpha = src.getImageData(0, 0, source.width, source.height).data;
  for (const { x0, base, lefts, first } of lines) {
    for (let y = base - Math.ceil(fs / cell) * cell; y < base + fs * 0.3; y += cell) {
      let k = 0;
      for (let x = x0 - cell; x < w; x += cell) {
        while ((lefts[k + 1] ?? Number.POSITIVE_INFINITY) <= x + cell / 2) k++;
        const [cx, cy] = [Math.round((x + cell / 2) * dpr), Math.round((y + cell / 2) * dpr)];
        if (
          cx >= 0 &&
          cy >= 0 &&
          cx < source.width &&
          cy < source.height &&
          (alpha[(cy * source.width + cx) * 4 + 3] ?? 0) > 100
        )
          cells.push({ x, y, group: first + k });
      }
    }
  }
  const blocks = scatter(cells, w);

  const canvas = document.createElement('canvas');
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.scale(dpr, dpr);
  overlay(canvas, box, margin);
  // the text itself stays hidden (Hero's CSS) until done() drops the ink-in class
  cancelOverlay = () => canvas.remove();

  const end = finishedAt(blocks);
  const t0 = performance.now();
  for (let now = t0; id === current; now = await nextFrame()) {
    const t = now - t0;
    g.clearRect(0, 0, w, h);
    for (const b of blocks) {
      const p = blockAt(b, t);
      g.drawImage(
        source,
        b.x * dpr,
        b.y * dpr,
        cell * dpr,
        cell * dpr,
        b.x + p.dx * cell * 2,
        b.y + p.dy * cell * 2,
        cell,
        cell,
      );
    }
    if (t >= end) break;
  }
  cancelOverlay();
}

/** Writes the name in, presses the full stop, then starts the line. */
async function inkIn(el: HTMLElement, id: number): Promise<void> {
  root.classList.add(INK_IN.className);
  await (getSkin().mode === 'pixel' ? assemble(el, id) : pen(el, id));
  if (id !== current) return;
  done();
  const pixel = getSkin().mode === 'pixel';
  stop?.animate(
    pixel
      ? [{ transform: 'scale(2)' }, { transform: 'scale(1)' }]
      : [{ transform: 'scale(0)' }, { transform: 'scale(1.35)', offset: 0.55 }, { transform: 'scale(1)' }],
    pixel
      ? { duration: 240, easing: 'steps(3, end)' }
      : { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' },
  );
  growLine(320, id);
}

function done(): void {
  cancelOverlay();
  root.classList.remove(INK_IN.className);
  try {
    sessionStorage.setItem(INK_IN.sessionKey, '1');
  } catch {
    // storage blocked: it plays again next load, which is harmless
  }
}

/** Again on demand: the line pulls back into the full stop, the name lifts off, and it writes itself anew. */
async function replay(el: HTMLElement): Promise<void> {
  if (prefersReducedMotion() || root.classList.contains(INK_IN.className)) return;
  // something (the rise, the mode switch, the last replay) is still moving the name
  if (el.getAnimations({ subtree: true }).some((a) => a.playState === 'running')) return;
  const id = ++current;
  const from = thread.length();
  const t0 = performance.now();
  const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 260,
    easing: getSkin().mode === 'pixel' ? 'steps(3, end)' : 'ease-in',
    fill: 'forwards',
  });
  for (let k = 0; k < 1; await nextFrame()) {
    if (id !== current) {
      fade.cancel();
      return;
    }
    k = Math.min(1, (performance.now() - t0) / 260);
    thread.setDrawn(from * (1 - k) ** 2);
  }
  fade.cancel();
  inkIn(el, id);
}

if (name && !prefersReducedMotion()) {
  if (root.classList.contains(INK_IN.className)) inkIn(name, ++current);
  else growLine(1000, ++current); // after the name's rise
  // the rise moves the full stop, so the line has to be re-anchored when it lands
  name.addEventListener('animationend', layoutChanged);
  // a double-click replays it; keep that double-click from selecting a word
  name.addEventListener('mousedown', (e) => {
    if (e.detail > 1) e.preventDefault();
  });
  name.addEventListener('dblclick', () => replay(name));
  // the mode switch retypes the name and redraws the line itself
  onSkinChange((next, prev) => {
    if (next.mode === prev.mode) return;
    current++;
    done();
  });
}
