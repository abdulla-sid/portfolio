import { addProtocol, type ErrorEvent, Map as MapLibre, Marker, setWorkerUrl } from 'maplibre-gl';
// without this the bundler leaves the worker out and the map never draws in production
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { Protocol } from 'pmtiles';
import { type City, cities, work } from '../../content/work';
import { boxIn } from '../dom';
import { type CityLabel, shotFor } from './camera';
import { colourPaint, type MapColors, mapStyle } from './style';

export interface MountOptions {
  colors: MapColors;
  /** Off on touch screens, so a swipe over the map scrolls the page. Pins stay tappable either way. */
  interactive: boolean;
  start: string;
  onPin(id: string): void;
  onMove(): void;
  onLabel(label: CityLabel): void;
}

export interface ShowOptions {
  jump: boolean;
  phone: boolean;
  /** Map width hidden under the job card, so the pins fit in what is left. */
  left: number;
}

/** A box inside the map, in CSS pixels. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MountedMap {
  show(id: string, opts: ShowOptions): void;
  repaint(colors: MapColors): void;
  /** A pin's position inside the map, in CSS pixels. */
  point(id: string): { x: number; y: number };
  /** Puts each label beside its pin, on the first side inside the frame and not `blocked` (by the line). */
  placeLabels(blocked: (box: Box) => boolean): void;
}

// room around the city's pins: the top clears the city name in the corner, the sides a pin and its halo
const FRAME = { top: 72, right: 36, bottom: 36, left: 36 };
const CARD_SHADOW = 8;
// where a label may sit around its pin, in order of preference; the active pin's is always on the right, away from the line
const SIDES = ['right', 'left', 'above', 'below'];
// past this the frame shows its failure message rather than waiting on a dead connection
const LOAD_TIMEOUT = 20_000;

/** Builds the MapLibre map with both cities and a pin per work entry. Resolves once the first frame has loaded. */
export async function mountMap(container: HTMLElement, opts: MountOptions): Promise<MountedMap> {
  setWorkerUrl(workerUrl);
  // tiles come over HTTP range requests, so only the visible part of each archive is downloaded
  addProtocol('pmtiles', new Protocol().tile);
  const sources = Object.fromEntries(
    Object.entries(cities).map(([id, c]) => [id, `pmtiles://${new URL(c.tiles, location.href).href}`]),
  );
  const entries = new Map(work.map((w) => [w.id, w]));
  const first = entries.get(opts.start) ?? work[0];
  if (!first) throw new Error('no work entries to show on the map');
  let here: City = first.pin.city;

  const map = new MapLibre({
    container,
    style: mapStyle(sources, opts.colors),
    center: [first.pin.lng, first.pin.lat],
    zoom: cities[here].zoom,
    interactive: opts.interactive,
    attributionControl: { compact: false },
    scrollZoom: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    // the tabs are the keyboard route, so the canvas is not a silent tab stop that pans the map
    keyboard: false,
  });
  map.getCanvas().tabIndex = -1;
  map.touchZoomRotate.disableRotation();

  const pins = new Map<string, HTMLButtonElement>();
  for (const entry of work) {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'pin';
    // the tabs are the keyboard route to the same places
    pin.tabIndex = -1;
    const dot = document.createElement('span');
    const label = document.createElement('em');
    label.textContent = entry.pin.label;
    pin.append(dot, label);
    pin.addEventListener('click', () => opts.onPin(entry.id));
    new Marker({ element: pin, anchor: 'center' }).setLngLat([entry.pin.lng, entry.pin.lat]).addTo(map);
    pins.set(entry.id, pin);
  }

  const point = (id: string) => {
    const pin = entries.get(id)?.pin ?? first.pin;
    return map.project([pin.lng, pin.lat]);
  };
  // the width under the job card, which labels keep out of too
  let covered = 0;
  let active = first.id;
  const labelBox = (pin: HTMLElement): Box => {
    const r = boxIn(pin.lastElementChild ?? container, container);
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const placeLabels = (blocked: (box: Box) => boolean) => {
    // the gap clears the job card's drop shadow, which its measured box leaves out
    const inside = (b: Box) =>
      b.x >= (covered && covered + CARD_SHADOW) &&
      b.x + b.w <= container.clientWidth &&
      b.y >= 0 &&
      b.y + b.h <= container.clientHeight;
    const placed: Box[] = [];
    const overlaps = (b: Box) =>
      placed.some((o) => b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h);
    // the active label goes first, so the others keep clear of it too
    const order = [...pins].sort(([a], [b]) => Number(b === active) - Number(a === active));
    for (const [id, pin] of order) {
      let side: string | undefined;
      // second best keeps clear of the other labels and lets the line pass under it; last resort is just inside
      let under: string | undefined;
      let fallback: string | undefined;
      for (const s of id === active ? ['right'] : SIDES) {
        pin.dataset.side = s;
        const box = labelBox(pin);
        if (!inside(box)) continue;
        fallback ??= s;
        if (overlaps(box)) continue;
        under ??= s;
        if (!blocked(box)) {
          side = s;
          break;
        }
      }
      pin.dataset.side = side ?? under ?? fallback ?? 'right';
      placed.push(labelBox(pin));
      // shortcut: a pin hemmed in by the line on every side lifts its label over the line instead, rerouting the line round it would be the full fix
      pin.classList.toggle('over', !side);
    }
  };
  map.on('move', opts.onMove);

  // a failed tile, or one city's archive, still leaves a usable map; only a broken style or no load at all fails
  await new Promise<void>((resolve, reject) => {
    let timer = 0;
    const settle = () => {
      clearTimeout(timer);
      map.off('error', onError);
    };
    const fail = (err: unknown) => {
      settle();
      map.remove();
      reject(err);
    };
    const onError = (e: ErrorEvent) => {
      if (!('sourceId' in e)) fail(e.error);
    };
    timer = window.setTimeout(() => fail(new Error('the map did not load in time')), LOAD_TIMEOUT);
    map.on('error', onError);
    map.once('load', () => {
      settle();
      resolve();
    });
  });

  let flight = 0;
  return {
    show(id, { jump, phone, left }) {
      const entry = entries.get(id);
      const pin = pins.get(id);
      if (!entry || !pin) return;
      for (const [pid, p] of pins) p.classList.toggle('is-active', pid === id);
      const shot = shotFor(entry, here, phone);
      here = shot.city;
      covered = left;
      active = id;
      // every pin in the city stays in the part of the map the job card leaves showing, with room on the right for
      // the active label, which any of them may be wearing
      pin.dataset.side = 'right';
      const label = labelBox(pin);
      const right = Math.max(FRAME.right, label.x + label.w - point(id).x + 8);
      const camera = { padding: { ...FRAME, right, left: left + FRAME.left }, maxZoom: shot.zoom };
      const ticket = ++flight;
      if (jump) {
        map.fitBounds(shot.bounds, { ...camera, animate: false });
        opts.onLabel(shot.after);
        return;
      }
      opts.onLabel(shot.during);
      // a newer pick may interrupt this flight; only the last one gets to name the city
      map.once('moveend', () => ticket === flight && opts.onLabel(shot.after));
      map.fitBounds(shot.bounds, {
        ...camera,
        duration: shot.far ? 2600 : 1100,
        curve: shot.far ? 1.5 : 1.2,
        essential: true,
      });
    },
    repaint(colors) {
      for (const [layer, prop, value] of colourPaint(mapStyle(sources, colors))) {
        map.setPaintProperty(layer, prop, value);
      }
    },
    point,
    placeLabels,
  };
}
