import { type Box, boxIn } from '../dom';
import { layoutChanged, onLayoutChange, perFrame } from '../layout';
import { LINE, PHONE_QUERY } from '../metrics';
import { prefersReducedMotion } from '../motion';
import { getSkin, onSkinChange } from '../skin';
import { type DepthTable, depthTable, lengthAbove, lengthAt } from './depth';
import {
  branchPath,
  cableFromGutter,
  cablePath,
  forkPoint,
  inkPath,
  type Pad,
  type Pt,
  padsFor,
  type Route,
  traceFork,
  tracePath,
  viasFor,
} from './geometry';

export interface ThreadController {
  /** Caps how much line is drawn (Infinity hands it back to scrolling). */
  setDrawn(len: number): void;
  /** How much line scrolling would show right now, ignoring the cap. */
  length(): number;
  rebuild(): void;
}

const SVG = 'http://www.w3.org/2000/svg';

function createThread(svg: SVGSVGElement, page: HTMLElement): ThreadController {
  const part = <T extends SVGElement>(name: string) => svg.querySelector(`[data-part="${name}"]`) as T;
  const ink = part<SVGPathElement>('ink');
  const ghost = part<SVGPathElement>('ghost');
  const cable = part<SVGPathElement>('cable');
  const padsGroup = part<SVGGElement>('pads');
  const tip = part<SVGRectElement>('tip');

  let total = 0;
  let rest = 0;
  let table: DepthTable = [];
  let pads: Array<{ el: SVGGElement; len: number }> = [];
  let cableJoin = Number.POSITIVE_INFINITY;
  let cableLen = 0;
  // the line starts undrawn; the hero's intro (or a reduced-motion visitor) releases it
  let dot = false;
  let cap = prefersReducedMotion() ? Number.POSITIVE_INFINITY : 0;

  const anchor = (name: string) => page.querySelector<HTMLElement>(`[data-thread="${name}"]`);
  const shown = (el: Element | null): el is HTMLElement => !!el && el.getClientRects().length > 0;
  const round = (b: Box): Box => ({
    ...b,
    left: Math.round(b.left),
    right: Math.round(b.right),
    top: Math.round(b.top),
    bottom: Math.round(b.bottom),
  });
  const rounded = (el: Element): Box => round(boxIn(el, page));
  // an element's own box, before any transform (a tilted note's bounds would grow): its offset box in its offset parent
  const untilted = (el: HTMLElement): Box => {
    const p = el.offsetParent ?? page;
    const o = boxIn(p, page);
    const [left, top] = [o.left + p.clientLeft + el.offsetLeft, o.top + p.clientTop + el.offsetTop];
    const [width, height] = [el.offsetWidth, el.offsetHeight];
    return round({ left, top, right: left + width, bottom: top + height, width, height });
  };
  const centre = (b: Box): Pt => ({
    x: Math.round(b.left + b.width / 2),
    y: Math.round(b.top + b.height / 2),
  });
  const measure = (d: string) => {
    ink.setAttribute('d', d);
    return ink.getTotalLength();
  };

  function route(start: HTMLElement): Route {
    const small = matchMedia(PHONE_QUERY).matches;
    const fs = Number.parseFloat(getComputedStyle(start).fontSize);
    const opt = (name: string) => {
      const el = anchor(name);
      return shown(el) ? rounded(el) : undefined;
    };
    const button = opt('device-in');
    const note = anchor('note');
    const all = (name: string, box = rounded) =>
      [...page.querySelectorAll(`[data-thread="${name}"]`)].filter(shown).map(box);
    // the extent of an element's text, not its box (a paragraph's box runs the full measure)
    const textBox = (el: Element): Box => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return boxIn(range, page);
    };
    return {
      start: centre(rounded(start)),
      // the line the full stop sits on ends just above the lede
      under: Math.round(rounded(start.parentElement ?? start).bottom + fs * 0.15),
      gutter: small ? 8 : Math.round(Number.parseFloat(getComputedStyle(page).paddingLeft) / 2),
      edge: Math.round(page.getBoundingClientRect().left),
      small,
      button: button && centre(button),
      device: opt('device-out'),
      clear: opt('clear')?.bottom,
      headings: all('heading').sort((a, b) => a.top - b.top),
      copy: opt('copy'),
      map: opt('map'),
      shelf: all('shelf'),
      caps: all('shelf-cap'),
      panel: opt('panel'),
      shelfText: all('shelf-text', textBox),
      note: shown(note) ? untilted(note) : undefined,
      end: opt('end'),
    };
  }

  function padElement({ x, y, stub }: Pad, size: number, hole: number): SVGGElement {
    const g = document.createElementNS(SVG, 'g');
    g.classList.add('pad');
    const shape = (tag: string, attrs: Record<string, number | string>) => {
      const el = document.createElementNS(SVG, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      g.append(el);
    };
    if (stub !== undefined) shape('path', { class: 'stub', d: `M${x},${y} H${stub}` });
    shape('rect', { class: 'plate', x: x - size / 2, y: y - size / 2, width: size, height: size });
    shape('rect', { class: 'hole', x: x - hole / 2, y: y - hole / 2, width: hole, height: hole });
    return g;
  }

  let built = '';

  function rebuild(): void {
    const start = anchor('start');
    const jack = anchor('jack');
    const width = page.offsetWidth;
    const height = page.offsetHeight;
    const pixel = getSkin().mode === 'pixel';
    const r = shown(start) ? route(start) : undefined;
    const j = shown(jack) ? rounded(jack) : undefined;
    // measuring the path is slow, and a tap often asks twice (layoutChanged, then the ResizeObserver): skip a repeat
    const key = JSON.stringify([pixel, width, height, r, j]);
    if (key === built) {
      draw();
      return;
    }
    built = key;
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    padsGroup.replaceChildren();
    pads = [];
    total = 0;
    if (!r) {
      for (const p of [ink, ghost, cable]) p.removeAttribute('d');
      draw();
      return;
    }

    const path = pixel ? tracePath(r, r.small ? 12 : 18) : inkPath(r);
    dot = !!path.dot;
    rest = measure(path.rest);
    total = measure(path.d);
    ink.style.strokeDasharray = String(total);
    ghost.setAttribute('d', path.d);
    table = depthTable(total, (len) => ink.getPointAtLength(len));

    if (pixel) {
      const size = r.small ? 12 : 24;
      pads = [
        ...padsFor(r).map((p) => ({ el: padElement(p, size, 6), len: lengthAt(table, p.y) })),
        ...viasFor(r).map((p) => ({ el: padElement(p, p.size, 4), len: lengthAt(table, p.y) })),
      ];
      padsGroup.append(...pads.map((p) => p.el));
    }

    // the iPod's earbud cable forks off the line where it turns under the device (pixel: a T off the trace's corner);
    // when the iPod sits under the About copy (phones, tablets) the cable branches off the gutter just above the jack
    // instead, so it never crosses the copy
    const fork = pixel ? traceFork(r) : forkPoint(r);
    if (j && r.device && fork) {
      const to = { x: Math.round(j.left + j.width / 2), y: j.top + 1 };
      let c: string;
      if (cableFromGutter(r, j)) {
        cableJoin = lengthAt(table, to.y - 28);
        const p = ink.getPointAtLength(cableJoin);
        c = branchPath({ x: Math.round(p.x), y: Math.round(p.y) }, to, pixel);
      } else {
        // pixel: from the top of the trace's corner, so the cable carries straight on down where the trace turns
        const from = pixel ? { x: fork.x, y: fork.y - 18 } : fork;
        cableJoin = lengthAt(table, from.y);
        c = cablePath(from, to, pixel);
      }
      cable.setAttribute('d', c);
      cableLen = cable.getTotalLength();
      // a gap 2px longer than the dash, so the hidden cable keeps no zero-length dash (a round cap's dot) on it
      cable.style.strokeDasharray = `${cableLen} ${cableLen + 2}`;
    } else {
      cable.removeAttribute('d');
      cableJoin = Number.POSITIVE_INFINITY;
    }
    draw();
  }

  function length(): number {
    if (!total) return 0;
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
    if (prefersReducedMotion() || atEnd) return total;
    const reach = innerHeight * LINE.reveal - page.getBoundingClientRect().top;
    return Math.max(lengthAbove(table, reach), rest);
  }

  function draw(): void {
    const len = Math.min(length(), cap, total);
    ink.style.strokeDashoffset = String(total - len);
    const p = ink.getPointAtLength(len);
    const pixel = getSkin().mode === 'pixel';
    const size = pixel ? 12 : dot && len >= total - 1 ? 10 : 6.8;
    tip.setAttribute('x', String(p.x - size / 2));
    tip.setAttribute('y', String(p.y - size / 2));
    tip.setAttribute('width', String(size));
    tip.setAttribute('height', String(size));
    tip.setAttribute('rx', String(pixel ? 0 : size / 2));
    // a line that ends in its own full stop keeps the pen's dot there once it is drawn
    tip.style.opacity = len > 1 && (len < total - 1 || dot) ? '1' : '0';
    for (const pad of pads) pad.el.classList.toggle('on', len >= pad.len);
    // the cable grows from the device down to the jack once the line has left the device
    if (cable.hasAttribute('d'))
      cable.style.strokeDashoffset = String(
        cableLen + 1 - Math.min(cableLen + 1, Math.max(0, len - cableJoin)),
      );
  }

  addEventListener('scroll', perFrame(draw), { passive: true });
  onLayoutChange(rebuild);
  onSkinChange(rebuild);
  // images and late content change the page's height without telling anyone
  new ResizeObserver(layoutChanged).observe(page);
  rebuild();

  return {
    setDrawn(len) {
      cap = len;
      draw();
    },
    length,
    rebuild,
  };
}

const svg = document.querySelector<SVGSVGElement>('svg.thread');
const page = svg?.parentElement;

/** The line from the full stop to the email. A no-op when the page has no thread. */
export const thread: ThreadController =
  svg && page ? createThread(svg, page) : { setDrawn() {}, length: () => 0, rebuild() {} };
