import { INK_IN } from '../ink-in/keys';
import { eachLetter } from '../letters';
import { prefersReducedMotion } from '../motion';
import { getSkin, onSkinChange, token } from '../skin';
import {
  canDisturb,
  capVector,
  cellRect,
  coverage,
  disturbanceCost,
  impulse,
  inkDrop,
  PIXEL_SETTLE_MS,
  scatterKick,
  spring,
  stepOffset,
} from './motion';

const root = document.documentElement;
const name = document.querySelector<HTMLElement>('[data-ink-in="name"]');

type State = {
  pixel: boolean;
  fs: number;
  cell: number;
  ox: number;
  oy: number;
  w: number;
  h: number;
  dpr: number;
  source: HTMLCanvasElement;
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  wet: HTMLCanvasElement | null;
  wg: CanvasRenderingContext2D | null;
  letters: Uint16Array;
  total: Float64Array;
  used: Float64Array;
  loose: Uint8Array;
  n: number;
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  a: Float32Array;
  spatter: Uint8Array;
  color: string;
  tail: string;
  dim: string;
  lastStep: number;
  lastDraw: number;
  touched: number;
};

let s: State | null = null;
let raf = 0;
let blur: SVGFEGaussianBlurElement | null = null;
let last: { x: number; y: number; t: number } | null = null;
const morphWatch = new MutationObserver(teardown);

/** Thresholding the softened alpha joins nearby drops into opaque wet ink. */
function gooFilter(): void {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0';
  svg.innerHTML =
    '<filter id="namehover-goo" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0.5"/>' +
    '<feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -5.5"/></filter>';
  document.body.append(svg);
  blur = svg.querySelector('feGaussianBlur');
}

/** The letters' own boxes (the h1 is column-wide). */
function letterRects(el: HTMLElement): DOMRect[] {
  const range = document.createRange();
  return [...el.querySelectorAll('span')].flatMap((span) => {
    range.selectNodeContents(span.firstChild ?? span);
    return [...range.getClientRects()];
  });
}

function build(el: HTMLElement): State | null {
  const pixel = getSkin().mode === 'pixel';
  const cs = getComputedStyle(el);
  const fs = Number.parseFloat(cs.fontSize);
  const color = token('--ink');
  // pixel: half of Pixelify's .13em pixel, the grid the ink-in uses; ink: fine enough to keep the hairlines
  const cell = pixel ? fs * 0.065 : Math.max(2, Math.round(fs * 0.02));
  const margin = Math.ceil(fs * (pixel ? 0.9 : 0.7));
  const box = el.getBoundingClientRect();
  // page coordinates, on whole pixels so the layer isn't resampled
  const [ox, oy] = [Math.round(box.left - margin + scrollX), Math.round(box.top - margin + scrollY)];
  const [w, h] = [Math.ceil(box.width + margin * 2), Math.ceil(box.height + margin * 2)];
  const dpr = Math.min(2, devicePixelRatio || 1);

  const source = document.createElement('canvas');
  source.width = w * dpr;
  source.height = h * dpr;
  const src = source.getContext('2d', { willReadFrequently: true });
  if (!src) return null;
  src.scale(dpr, dpr);
  src.fillStyle = color;
  const glyphs: Array<{ x: number; y: number; w: number; h: number }> = [];
  const lines: Array<{ x0: number; base: number }> = [];
  eachLetter(el, ox - scrollX, oy - scrollY, (ch, x, base, _i, holder) => {
    if (!ch.trim()) return;
    src.font = `${getComputedStyle(holder).fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    src.fillText(ch, x, base);
    const metrics = src.measureText(ch);
    glyphs.push({
      x: x - metrics.actualBoundingBoxLeft,
      y: base - metrics.actualBoundingBoxAscent,
      w: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
      h: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    });
    if (lines[lines.length - 1]?.base !== base) lines.push({ x0: x, base });
  });

  // one particle per grid cell the glyphs ink, keeping how much of it they ink
  const alpha = src.getImageData(0, 0, source.width, source.height).data;
  const hx: number[] = [];
  const hy: number[] = [];
  const as: number[] = [];
  const letters: number[] = [];
  for (const { x0, base } of pixel ? lines : [{ x0: 0, base: 0 }]) {
    const top = pixel ? base - Math.ceil(fs / cell) * cell : 0;
    for (let y = top; y < (pixel ? base + fs * 0.35 : h); y += cell) {
      for (let x = pixel ? x0 - Math.ceil((fs * 0.3) / cell) * cell : 0; x < w; x += cell) {
        const a = coverage(alpha, source.width, source.height, x * dpr, y * dpr, cell * dpr, pixel);
        if (a > 0.08) {
          hx.push(x + cell / 2);
          hy.push(y + cell / 2);
          as.push(a);
          let nearest = 0;
          let distance = Infinity;
          glyphs.forEach((glyph, i) => {
            const dx = Math.max(glyph.x - x - cell / 2, 0, x + cell / 2 - glyph.x - glyph.w);
            const dy = Math.max(glyph.y - y - cell / 2, 0, y + cell / 2 - glyph.y - glyph.h);
            const d = dx * dx + dy * dy;
            if (d < distance) {
              nearest = i;
              distance = d;
            }
          });
          letters.push(nearest);
        }
      }
    }
  }
  const n = hx.length;
  const layer = (css: string) => {
    const c = document.createElement('canvas');
    c.width = w * dpr;
    c.height = h * dpr;
    c.setAttribute('aria-hidden', 'true');
    c.dataset.namehover = '';
    c.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${w}px;height:${h}px;pointer-events:none;z-index:2;${css}`;
    document.body.append(c);
    const cg = c.getContext('2d');
    cg?.scale(dpr, dpr);
    return [c, cg] as const;
  };
  // The still strokes stay crisp; only moving ink passes through the liquid filter.
  const [canvas, g] = layer(pixel ? 'image-rendering:pixelated' : '');
  const [wet, wg] = pixel ? [null, null] : layer('filter:url(#namehover-goo)');
  if (!g || (!pixel && !wg)) {
    canvas.remove();
    wet?.remove();
    return null;
  }
  if (!pixel) gooFilter();
  el.style.color = 'transparent'; // the layer draws the name now; the full stop is its own element and stays

  const spatter = new Uint8Array(n);
  for (let i = 0; i < n; i++) spatter[i] = Math.random() < (pixel ? 0 : 0.035) ? 1 : 0;
  const total = new Float64Array(glyphs.length);
  as.forEach((alpha, i) => {
    const letter = letters[i] ?? 0;
    total[letter] = (total[letter] ?? 0) + (pixel ? 1 : alpha);
  });
  return {
    pixel,
    letters: Uint16Array.from(letters),
    total,
    used: new Float64Array(glyphs.length),
    loose: new Uint8Array(n),
    fs,
    cell,
    ox,
    oy,
    w,
    h,
    dpr,
    source,
    canvas,
    g,
    wet,
    wg,
    n,
    hx: Float32Array.from(hx),
    hy: Float32Array.from(hy),
    x: Float32Array.from(hx),
    y: Float32Array.from(hy),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    a: Float32Array.from(as),
    spatter,
    color,
    tail: token('--accent'),
    dim: token('--ink-2'),
    lastStep: 0,
    lastDraw: 0,
    touched: performance.now(),
  };
}

function teardown(): void {
  last = null;
  cancelAnimationFrame(raf);
  raf = 0;
  if (!s) return;
  s.canvas.remove();
  s.wet?.remove();
  if (name) name.style.color = '';
  s = null;
  blur?.closest('svg')?.remove();
  blur = null;
}

/** Pushes the particles near the pointer's path along its motion (px/ms). */
function push(st: State, x0: number, y0: number, x1: number, y1: number, dt: number): boolean {
  const motion = impulse(x1 - x0, y1 - y0, dt, st.pixel);
  if (!motion) return false;
  const { speed, nx, ny } = motion;
  let hit = false;
  const R = st.fs * (st.pixel ? 0.5 : 0.2);
  const [ax, ay, bx, by] = [x0 - st.ox, y0 - st.oy, x1 - st.ox, y1 - st.oy];
  const [dx, dy] = [bx - ax, by - ay];
  const len2 = dx * dx + dy * dy || 1;
  const gain = Math.min(speed * 550, st.fs * 5); // px/s handed to the ink
  for (let i = 0; i < st.n; i++) {
    const [px, py] = [st.x[i] ?? 0, st.y[i] ?? 0];
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const [qx, qy] = [px - (ax + dx * t), py - (ay + dy * t)];
    const d = Math.hypot(qx, qy);
    if (d >= R) continue;
    const letter = st.letters[i] ?? 0;
    if (!st.loose[i]) {
      const cost = disturbanceCost(st.pixel);
      if (!canDisturb(st.total[letter] ?? 0, st.used[letter] ?? 0, cost)) continue;
      st.used[letter] = (st.used[letter] ?? 0) + cost;
      st.loose[i] = 1;
    }
    hit = true;
    if (st.pixel) {
      const kick = scatterKick(
        nx,
        ny,
        qx,
        qy,
        d,
        R,
        speed,
        Math.random(),
        Math.random() * Math.PI * 2,
        0.8 + Math.random() * 0.45,
      );
      const velocity = capVector((st.vx[i] ?? 0) + kick.x, (st.vy[i] ?? 0) + kick.y, 5000);
      st.vx[i] = velocity.x;
      st.vy[i] = velocity.y;
      continue;
    }
    const f = (1 - d / R) ** 2 * (0.55 + Math.random() * 0.7);
    const k = st.spatter[i] ? 1.8 : 1;
    // the ink is dragged along, not shoved: each drop moves at most as fast as the pointer pulls it (no pile-up ahead)
    const want = gain * f * k;
    const along = (st.vx[i] ?? 0) * nx + (st.vy[i] ?? 0) * ny;
    const add = Math.max(0, want - along);
    const j = (Math.random() - 0.5) * 0.35 * k * add;
    const velocity = capVector(
      (st.vx[i] ?? 0) + nx * add - ny * j,
      (st.vy[i] ?? 0) + ny * add + nx * j,
      st.fs * (st.spatter[i] ? 10 : 6),
    );
    st.vx[i] = velocity.x;
    st.vy[i] = velocity.y;
  }
  if (hit) st.touched = performance.now();
  return hit;
}

function frame(now: number): void {
  const st = s;
  if (!st) return;
  if (busy() || now - st.touched > (st.pixel ? PIXEL_SETTLE_MS : 1100)) {
    teardown();
    return;
  }
  const dt = Math.min(1 / 30, (now - (st.lastStep || now - 16)) / 1000);
  st.lastStep = now;
  let maxD = 0;
  let maxV = 0;
  for (let i = 0; i < st.n; i++) {
    if (!st.loose[i]) continue;
    const [ex, ey] = [(st.x[i] ?? 0) - (st.hx[i] ?? 0), (st.y[i] ?? 0) - (st.hy[i] ?? 0)];
    const sx = spring(ex, st.vx[i] ?? 0, dt, st.pixel);
    const sy = spring(ey, st.vy[i] ?? 0, dt, st.pixel);
    let vx = sx.velocity;
    let vy = sy.velocity;
    const d = Math.hypot(ex, ey);
    if (d < (st.pixel ? st.cell * 0.5 : 0.05) && Math.hypot(vx, vy) < (st.pixel ? 20 : 1)) {
      vx = vy = 0;
      const letter = st.letters[i] ?? 0;
      st.used[letter] = Math.max(0, (st.used[letter] ?? 0) - disturbanceCost(st.pixel));
      st.loose[i] = 0;
      st.x[i] = st.hx[i] ?? 0;
      st.y[i] = st.hy[i] ?? 0;
    } else {
      const offset = st.pixel
        ? { x: sx.offset, y: sy.offset }
        : capVector(sx.offset, sy.offset, st.fs * (st.spatter[i] ? 0.3 : 0.18));
      st.x[i] = (st.hx[i] ?? 0) + offset.x;
      st.y[i] = (st.hy[i] ?? 0) + offset.y;
    }
    st.vx[i] = vx;
    st.vy[i] = vy;
    if (d > maxD) maxD = d;
    const v = Math.abs(vx) + Math.abs(vy);
    if (v > maxV) maxV = v;
  }
  if (maxD < 0.05 && maxV < 1) {
    teardown();
    return;
  }
  // pixel steps at ~20 a second, like the board's other motion
  if (!st.pixel || now - st.lastDraw > 48) {
    st.lastDraw = now;
    (st.pixel ? drawPixel : drawInk)(st, maxD);
  }
  raf = requestAnimationFrame(frame);
}

function drawInk(st: State, maxD: number): void {
  const { g, wg, cell, fs } = st;
  if (!wg) return;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, st.w, st.h);
  g.drawImage(st.source, 0, 0, st.w, st.h);
  wg.clearRect(0, 0, st.w, st.h);
  wg.fillStyle = st.color;
  const holes = new Path2D();
  const drops = new Path2D();
  for (let i = 0; i < st.n; i++) {
    if (!st.loose[i]) continue;
    const [x, y, hx, hy] = [st.x[i] ?? 0, st.y[i] ?? 0, st.hx[i] ?? 0, st.hy[i] ?? 0];
    const distance = Math.hypot(x - hx, y - hy);
    if (distance < 0.3) continue;
    holes.moveTo(hx + cell * 0.8, hy);
    holes.arc(hx, hy, cell * 0.8, 0, Math.PI * 2);
    const vx = st.vx[i] ?? 0;
    const vy = st.vy[i] ?? 0;
    const { rx, ry } = inkDrop(cell, st.a[i] ?? 1, distance, fs, Math.hypot(vx, vy), !!st.spatter[i]);
    const angle = Math.atan2(vy, vx);
    drops.moveTo(x + Math.cos(angle) * rx, y + Math.sin(angle) * rx);
    drops.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  }
  g.globalCompositeOperation = 'destination-out';
  g.fill(holes);
  wg.fill(drops);
  blur?.setAttribute('stdDeviation', (0.5 + 0.9 * Math.min(1, maxD / (fs * 0.12))).toFixed(2));
}

function drawPixel(st: State): void {
  const { g, cell } = st;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, st.w, st.h);
  g.drawImage(st.source, 0, 0, st.w, st.h);
  const moved: number[] = [];
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < st.n; i++) {
    const dx = stepOffset((st.x[i] ?? 0) - (st.hx[i] ?? 0), cell);
    const dy = stepOffset((st.y[i] ?? 0) - (st.hy[i] ?? 0), cell);
    if (!dx && !dy) continue;
    const rect = cellRect(st.hx[i] ?? 0, st.hy[i] ?? 0, cell);
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    moved.push(i);
  }
  g.globalCompositeOperation = 'source-over';
  for (const i of moved) {
    const dx = stepOffset((st.x[i] ?? 0) - (st.hx[i] ?? 0), cell);
    const dy = stepOffset((st.y[i] ?? 0) - (st.hy[i] ?? 0), cell);
    const far = Math.max(Math.abs(dx), Math.abs(dy)) / cell;
    g.fillStyle = far > 3 ? st.tail : far > 1 ? st.dim : st.color;
    const rect = cellRect(st.hx[i] ?? 0, st.hy[i] ?? 0, cell);
    g.fillRect(rect.x + dx, rect.y + dy, rect.w, rect.h);
  }
}

const busy = () =>
  prefersReducedMotion() ||
  root.classList.contains(INK_IN.className) ||
  !!name?.getAnimations({ subtree: true }).some((a) => a.playState === 'running');

if (name) {
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') {
        teardown();
        return;
      }
      const prev = last;
      last = { x: e.pageX, y: e.pageY, t: e.timeStamp };
      if (
        !prev ||
        e.timeStamp - prev.t > 120 ||
        !impulse(e.pageX - prev.x, e.pageY - prev.y, e.timeStamp - prev.t)
      )
        return;
      if (!s) {
        // only from the letters, and never over the intro, the replay or the mode switch
        const m = Number.parseFloat(getComputedStyle(name).fontSize) * 0.05;
        const hit = letterRects(name).some(
          (r) =>
            Math.max(e.clientX, prev.x - scrollX) > r.left - m &&
            Math.min(e.clientX, prev.x - scrollX) < r.right + m &&
            Math.max(e.clientY, prev.y - scrollY) > r.top - m &&
            Math.min(e.clientY, prev.y - scrollY) < r.bottom + m,
        );
        if (!hit || busy()) return;
        s = build(name);
        morphWatch.takeRecords(); // eachLetter's own baseline probes
        if (!s) return;
      }
      const hit = push(s, prev.x, prev.y, e.pageX, e.pageY, Math.max(1, e.timeStamp - prev.t));
      if (!hit && !raf) {
        teardown();
        return;
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
  name.addEventListener('dblclick', teardown, { capture: true });
  addEventListener('resize', teardown);
  addEventListener('scroll', teardown, { passive: true });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', teardown);
  new MutationObserver(() => {
    if (busy()) teardown();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  onSkinChange(teardown);
  // the mode switch splits the name into letters before it swaps the skin: step aside as soon as it starts
  morphWatch.observe(name, { childList: true, subtree: true, characterData: true });
}
