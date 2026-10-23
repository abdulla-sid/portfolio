import type { Box } from '../dom';
import { LINE } from '../metrics';

export interface Pt {
  x: number;
  y: number;
}

/** Where the line has to go, in page-column pixels. Every stop but the start is optional. */
export interface Route {
  /** Centre of the full stop after the name. */
  start: Pt;
  /** A y in the gap between the name and the lede (the phone route turns there). */
  under: number;
  /** The x of the left gutter the line runs down. */
  gutter: number;
  /** How far the page column sits in from the screen's left edge (0 when it fills the screen). */
  edge: number;
  small: boolean;
  /** The device's red button, and the device body it runs through. */
  button?: Pt;
  device?: Box;
  /** The bottom of the hero's text: the line leaves the device below it, never through it. */
  clear?: number;
  /** Section headings, top to bottom. */
  headings: Box[];
  /** The About copy: when the iPod sits under it, the earbud cable branches off the gutter instead of crossing it. */
  copy?: Box;
  map?: Box;
  /** The projects shelf: its objects and captions left to right, the panel under them (absent when closed), and (ink only) the heading and
   * intro text above, as text extents. The line drops through the centre gap. */
  shelf?: Box[];
  caps?: Box[];
  panel?: Box;
  shelfText?: Box[];
  /** The margin note beside the contact card: ink ends in a full stop beside it; pixel ends beside it when it sits to
   * the card's right. */
  note?: Box;
  /** The contact card's send button: the line runs into its side. */
  end?: Box;
}

export interface ThreadPath {
  d: string;
  /** The part drawn even before any scrolling: down to the first heading. */
  rest: string;
  /** Where the line ends in a full stop of its own, rather than in the send button. */
  dot?: Pt;
}

export interface Pad extends Pt {
  /** The x a short stub runs to, towards the heading. */
  stub?: number;
}

const mid = (b: Box): number => b.top + b.height / 2;
/** Where the line turns from the device towards the gutter. */
const exitY = (device: Box, clear = 0): number => Math.max(device.bottom, clear) + LINE.deviceOutDrop;
const r = Math.round;
/** Where the line enters and leaves the map (y), and the x it runs down inside it. */
const mapStops = (m: Box): [y1: number, y2: number, x: number] => [
  r(m.top + m.height * LINE.mapEntry),
  r(m.top + m.height * LINE.mapExit),
  m.left + 6,
];

/** Ink's heading loops: how far they bulge out past the line and back in on the other side, and the room they keep
 * from the screen's edge and from the heading text. */
const LOOP = { out: 28, in: 1, room: 8 } as const;

/**
 * Where ink's line runs, and how wide its heading loops are (1 is full size): on the gutter while a full loop fits
 * on screen, else moved in just enough, and on narrow columns (tablets) a smaller loop centred between the edge and
 * the text.
 */
export function inkGutter(route: Route): { x: number; s: number } {
  const text = Math.min(...route.headings.map((h) => h.left));
  if (route.small || !Number.isFinite(text)) return { x: route.gutter, s: 1 };
  const s = Math.min(1, (route.edge + text - 2 * LOOP.room) / (LOOP.out + LOOP.in));
  return { x: Math.max(route.gutter, r(LOOP.room + LOOP.out * s - route.edge)), s };
}

/** The project panel; when closed, a zero-height box under the captions, so the line through the shelf just shrinks
 * as the panel folds away instead of switching route when it is gone. */
function panelOf(route: Route): Box | undefined {
  if (route.panel) return route.panel;
  const under = [...(route.caps ?? []), ...(route.shelf ?? [])];
  if (!under.length) return undefined;
  const y = Math.max(...under.map((b) => b.bottom));
  const left = Math.min(...under.map((b) => b.left));
  const right = Math.max(...under.map((b) => b.right));
  return { left, right, width: right - left, top: y, bottom: y, height: 0 };
}

/** Where the line comes out from under the device and turns for the gutter; the iPod's cable forks off here. */
export function forkPoint(route: Route): Pt | undefined {
  const { device } = route;
  if (!device) return undefined;
  return { x: device.left + LINE.deviceOutInset, y: exitY(device, route.clear) };
}

const TRACE = {
  /** Extra drop below ink's exit from the device (on top of LINE.deviceOutDrop). */
  clear: 38,
  /** Phones: how far below ink's under-the-name y the trace runs, so it clears the name's descenders. */
  under: 8,
  /** How far above the shelf objects the trace runs across to its drop. */
  above: 36,
  /** The channel between the postcard and the clock note: this far left of the note. */
  channel: 28,
} as const;

/** The device sits under the hero text (phones, tablets), so the line goes round the text, not through it. */
export function stacked(route: Route): boolean {
  return route.small || (!!route.device && route.clear !== undefined && route.device.top >= route.clear);
}

/**
 * Pixel mode's turn under the device: lower than ink's, so the trace keeps a PCB-style clearance from the hero text
 * above it instead of running right under it.
 */
export function traceFork(route: Route): Pt | undefined {
  const f = forkPoint(route);
  return f && { x: f.x, y: f.y + TRACE.clear };
}

/**
 * Ink's way across from a to b, heading straight down at both: one S whose handles reach most of the drop, so both
 * turns are wide and the middle runs gently across. (Handles of half the drop turn on a pin when it crosses far in a
 * short drop; at 0.85 it still never heads back up.)
 */
export function sweep(a: Pt, b: Pt): string {
  const k = r((b.y - a.y) * 0.85);
  return ` C${a.x},${a.y + k} ${b.x},${b.y - k} ${b.x},${b.y}`;
}

/**
 * Ink mode: one line in a few long, deliberate pen strokes. It sweeps from the device to the gutter, runs down it,
 * loops at each heading, swoops into the map and back, drops down through the projects shelf, and ends in a full
 * stop beside the contact note (or, without the shelf, swings into the send button).
 */
export function inkPath(route: Route): ThreadPath {
  const { start: s, under: yu, button: b, device } = route;
  const { x: cx, s: k } = inkGutter(route);
  /** A loop's x offset, scaled to the room it has. */
  const w = (x: number) => r(x * k);
  // outwards: away from the content, the side the heading loops bulge to
  const o = -1;
  let d = `M${s.x},${s.y}`;
  let at: Pt = s;
  const fork = forkPoint(route);
  if (b && device && fork) {
    d += stacked(route)
      ? ` C${s.x + 4},${yu} ${s.x - 10},${yu} ${s.x - 30},${yu} L${cx + 24},${yu} C${cx},${yu} ${cx},${yu + 4} ${cx},${yu + 30}` +
        ` L${cx},${b.y - 30} C${cx},${b.y} ${cx + 6},${b.y} ${b.x},${b.y}`
      : ` C${s.x + 60},${s.y + 10} ${b.x - 90},${b.y} ${b.x},${b.y}`;
    d += ` L${fork.x},${device.bottom - 20} L${fork.x},${fork.y}`;
    at = fork;
  }

  /** Down to (cx, y): one long S-sweep across if the pen is off the gutter, then straight down it. */
  const run = (y: number) => {
    if (at.x !== cx) {
      const sy = route.small ? Math.min(y, at.y + 90) : y;
      d += sweep(at, { x: cx, y: sy });
      at = { x: cx, y: sy };
    }
    if (y > at.y) d += ` L${cx},${y}`;
    at = { x: cx, y };
  };
  /** Down and round into (x, y), arriving level and heading inwards. */
  const into = (x: number, y: number) => {
    if (y - at.y > 320) run(y - 200);
    const dy = y - at.y;
    d += ` C${at.x},${at.y + dy * 0.6} ${x + o * Math.min(60, Math.abs(x - at.x) + 20)},${y} ${x},${y}`;
    at = { x, y };
  };
  const loop = (h: number) => {
    run(h - 40);
    d +=
      ` C${cx},${h - 10} ${cx + w(o * 4)},${h + 12} ${cx + w(o * 16)},${h + 11}` +
      ` C${cx + w(o * 30)},${h + 10} ${cx + w(o * 32)},${h - 20} ${cx + w(o * 17)},${h - 23} C${cx + w(o * 4)},${h - 26} ${cx - w(o * 4)},${h - 8} ${cx},${h + 40}`;
    at = { x: cx, y: h + 40 };
  };

  const map = route.map;
  const [y1, y2, inX] = map ? mapStops(map) : [0, 0, 0];
  let mapDone = !map;
  const throughMap = () => {
    if (mapDone) return;
    mapDone = true;
    if (y1 < at.y + 60) return;
    into(inX, y1);
    // under the map from entry to exit, then a swoop back out to the gutter
    d += ` L${inX},${y2} C${inX + o * 40},${y2} ${cx},${y2 + 20} ${cx},${y2 + 70}`;
    at = { x: cx, y: y2 + 70 };
  };
  /**
   * Down through the projects shelf: the pen leaves the gutter in one S (above the heading when the drop clears its
   * text, else just under the intro), drops straight down a gap between two objects, behind the plank, between their
   * captions and behind the panel, and stays on that side from then on. It never crosses text.
   */
  let off = false;
  let shelfDone = route.small || !route.shelf?.length || !route.caps?.length;
  const throughShelf = () => {
    if (shelfDone) return;
    shelfDone = true;
    const [items, caps, panel] = [route.shelf as Box[], route.caps as Box[], panelOf(route) as Box];
    const text = route.shelfText ?? [];
    const g = Math.floor((caps.length - 1) / 2);
    const [a, b] = [caps[g], caps[g + 1]];
    if (!a || !b) return;
    const gx = r((a.right + b.left) / 2);
    const top = Math.min(...text.map((t) => t.top), items[0]?.top ?? 0);
    const clear = text.every((t) => t.right + 24 < gx);
    const [from, to] = clear
      ? [top - 100, top - 8]
      : [Math.max(...text.map((t) => t.bottom)) + 6, Math.min(...items.map((i) => i.top)) - 4];
    if (from < at.y + 20) return;
    run(from);
    d += `${sweep({ x: cx, y: from }, { x: gx, y: to })} L${gx},${panel.bottom + 10}`;
    at = { x: gx, y: panel.bottom + 10 };
    off = true;
  };
  let rest = '';
  route.headings.forEach((head, i) => {
    const h = mid(head);
    if (map && y1 < h) throughMap();
    if (route.shelf?.[0] && route.shelf[0].top < h) throughShelf();
    // once the pen has left the gutter for good, it lets the headings below be
    if (!route.small && !off && h - 40 > at.y + 60) loop(h);
    if (i === 0) rest = d;
  });
  rest ||= d;
  throughMap();
  throughShelf();
  const note = off ? noteBeside(route, at.x) : undefined;
  const last = route.headings[route.headings.length - 1];
  if (off && !note) {
    // the note is stacked under Post it (narrower screens): back to the gutter, looping at the next heading as usual
    const next = route.headings.find((h) => h.top > at.y);
    if (next && mid(next) - 40 > at.y + 60) loop(mid(next));
    else run(at.y + 60);
  }
  if (note) {
    // across over the last heading's row (the text there is far left), down beside the card, and a full stop by
    // the margin note: the line ends the way it began
    const [xe, ye] = [note.left - 16, note.top + 16];
    const ys = Math.max(at.y + 60, (last?.bottom ?? at.y) + 10);
    d += `${sweep(at, { x: xe, y: ys })} L${xe},${ye}`;
    return { d, rest, dot: { x: xe, y: ye } };
  }
  if (route.end) {
    const e = route.end;
    const ey = r(mid(e));
    // the pen swings into the side of the send button, like the device's red button
    if (ey > at.y + 60) into(e.left, ey);
  }
  return { d, rest };
}

/** The corner points of pixel mode's trace; see tracePath. */
function tracePoints(route: Route): { points: Pt[]; restAt: number } {
  const { start: s, gutter: cx, button: b, device } = route;
  const yu = route.under + (stacked(route) ? TRACE.under : 0);
  const points: Pt[] = [s];
  const add = (x: number, y: number) => points.push({ x, y });
  if (b && device) {
    if (stacked(route)) {
      add(s.x, yu);
      add(cx, yu);
      add(cx, b.y);
    } else {
      const mx = r((s.x + b.x) / 2);
      add(mx, s.y);
      add(mx, b.y);
    }
    const { x: ex, y: outY } = traceFork(route) as Pt;
    add(b.x, b.y);
    add(ex, b.y);
    add(ex, outY);
    add(cx, outY);
  } else {
    add(s.x, yu);
    add(cx, yu);
  }
  const lastY = () => points[points.length - 1]?.y ?? s.y;
  const first = route.headings[0];
  if (first && mid(first) > lastY()) add(cx, r(mid(first)));
  const restAt = points.length;
  if (route.map) {
    const [y1, y2, inX] = mapStops(route.map);
    if (y1 > lastY()) {
      add(cx, y1);
      add(inX, y1);
      add(inX, y2);
      add(cx, y2);
    }
  }
  // through the projects shelf: across above the objects, then straight down the centre gap, through the plank,
  // between two captions and behind the panel; then either on down the right to the clock note, or back to the gutter
  const sd = shelfDrop(route);
  if (sd && sd.top > lastY()) {
    add(cx, sd.top);
    add(sd.x, sd.top);
    if (sd.note) {
      add(sd.x, sd.row);
      add(sd.note.x, sd.row);
      add(sd.note.x, sd.note.y);
      return { points, restAt };
    }
    add(sd.x, sd.back);
    add(cx, sd.back);
  }
  // the trace plugs into the side of the send button, like the device's red button
  const { end } = route;
  if (end && r(mid(end)) > lastY()) {
    add(cx, r(mid(end)));
    add(end.left, r(mid(end)));
  }
  return { points, restAt };
}

interface ShelfDrop {
  /** The drop's x, the y it runs across at above the shelf, and the via's y under the plank. */
  x: number;
  top: number;
  plank: number;
  /** Staying right: the y of the heading row it steps across, and where it ends beside the clock note. */
  row: number;
  note?: Pt;
  /** Otherwise: the y it comes back to the gutter at, midway between the panel and the next heading. */
  back: number;
}

/** The iPod sits under the About copy (or the device under the hero text): its cable branches off the gutter. */
export function cableFromGutter(route: Route, jack: Box): boolean {
  return stacked(route) || (!!route.copy && jack.top >= route.copy.bottom);
}

/**
 * The contact note when it sits beside the card, right of x (not stacked under it, as on narrower screens): it starts
 * above the send button. Both skins end beside it then, and fall back to the gutter and the send button otherwise.
 */
export function noteBeside(route: Route, x: number): Box | undefined {
  const { note, end } = route;
  return note && end && note.top < end.top && note.left > x ? note : undefined;
}

/** Pixel mode's way through the shelf (desktop only). */
function shelfDrop(route: Route): ShelfDrop | undefined {
  const items = route.shelf ?? [];
  const panel = panelOf(route);
  if (stacked(route) || items.length < 2 || !panel) return undefined;
  const k = (items.length >> 1) - 1;
  const [a, b] = [items[k] as Box, items[k + 1] as Box];
  const [ca, cb] = [route.caps?.[k], route.caps?.[k + 1]];
  // the middle of what is clear both between the objects and between their captions
  const lo = Math.max(a.right, ca?.right ?? a.right);
  const hi = Math.min(b.left, cb?.left ?? b.left);
  const x = r((lo + hi) / 2);
  const next = route.headings.find((h) => h.top > panel.bottom);
  const row = next ? r(mid(next)) : panel.bottom + 40;
  const back = next ? r((panel.bottom + next.top) / 2) : panel.bottom + 40;
  const note = noteBeside(route, x);
  return {
    x,
    top: Math.min(...items.map((i) => i.top)) - TRACE.above,
    // just under the plank (which hides the trace), where the trace comes out through it
    plank: Math.max(...items.map((i) => i.bottom)) + 24,
    row,
    note: note ? { x: note.left - TRACE.channel, y: r(mid(note)) } : undefined,
    back,
  };
}

/** Pixel mode's extra pads: a via where the trace crosses the plank, and the terminal pad beside the clock note. */
export function viasFor(route: Route): Array<Pt & { size: number }> {
  const sd = shelfDrop(route);
  if (!sd) return [];
  const vias = [{ x: sd.x, y: sd.plank, size: 14 }];
  if (sd.note) vias.push({ ...sd.note, size: 18 });
  return vias;
}

/** Pixel mode: an orthogonal PCB trace through the same stops. */
export function tracePath(route: Route, cut: number): ThreadPath {
  const { points, restAt } = tracePoints(route);
  return { d: ortho(points, cut), rest: ortho(points.slice(0, restAt), cut) };
}

/** Pixel mode's pads: one at each heading the trace passes, with a stub that stops well short of it. */
export function padsFor(route: Route): Pad[] {
  const sd = shelfDrop(route);
  const below = sd?.note ? sd.top : Number.POSITIVE_INFINITY;
  return route.headings
    .filter((h) => h.top < below)
    .map((h) => ({ x: route.gutter, y: r(mid(h)), stub: h.left - 20 }));
}

/** Straight runs through the points, each corner cut at 45 degrees like a PCB track. */
export function ortho(points: Pt[], cut: number): string {
  const [first, ...rest] = points;
  if (!first) return '';
  let d = `M${r(first.x)},${r(first.y)}`;
  rest.forEach((p, i) => {
    const prev = points[i] as Pt;
    const next = rest[i + 1];
    if (!next) {
      d += ` L${r(p.x)},${r(p.y)}`;
      return;
    }
    const l1 = Math.hypot(p.x - prev.x, p.y - prev.y);
    const l2 = Math.hypot(next.x - p.x, next.y - p.y);
    if (!l1 || !l2) return;
    const a = Math.min(cut, l1 / 2, l2 / 2);
    d += ` L${r(p.x - ((p.x - prev.x) / l1) * a)},${r(p.y - ((p.y - prev.y) / l1) * a)}`;
    d += ` L${r(p.x + ((next.x - p.x) / l2) * a)},${r(p.y + ((next.y - p.y) / l2) * a)}`;
  });
  return d;
}

/**
 * The earbud cable: its own line, out of the underside of the device and down to the iPod's jack. Ink: one S-curve.
 * Pixel: down, a 45-degree run across (level for whatever the diagonal cannot cover), down into the jack.
 */
export function cablePath(from: Pt, jack: Pt, pixel: boolean): string {
  const dy = jack.y - from.y;
  if (pixel) {
    // as much of the way across as fits runs at 45 degrees, the rest level, with a straight drop at each end
    const dx = jack.x - from.x;
    // a straight 40px first, so the fork reads as a T off the trace before the diagonal leaves
    const dd = Math.min(Math.abs(dx), Math.max(0, dy - 70));
    const ya = r(from.y + Math.max(40, (dy - dd) / 2));
    const xd = from.x + Math.sign(dx) * dd;
    const pts = [from, { x: from.x, y: ya }, { x: xd, y: ya + dd }, { x: jack.x, y: ya + dd }, jack];
    return ortho(
      pts.filter((p, i) => i === 0 || p.x !== pts[i - 1]?.x || p.y !== pts[i - 1]?.y),
      8,
    );
  }
  const k = r(dy * 0.55);
  return `M${from.x},${from.y} C${from.x},${from.y + k} ${jack.x},${jack.y - k} ${jack.x},${jack.y}`;
}

/** Phones, where the iPod sits under the text: the cable branches off the gutter line just above the jack. */
export function branchPath(join: Pt, jack: Pt, pixel: boolean): string {
  if (pixel) return ortho([join, { x: jack.x, y: join.y }, jack], 8);
  return `M${join.x},${join.y} C${join.x + 30},${join.y} ${jack.x},${jack.y - 40} ${jack.x},${jack.y}`;
}
