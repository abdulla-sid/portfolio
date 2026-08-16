<script module lang="ts">
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";
  import { Protocol } from "pmtiles";

  maplibregl.addProtocol("pmtiles", new Protocol().tile);
</script>

<script lang="ts">
  import { createMapStyle, readMapPalette, type MapPalette } from "./style";
  import { CITIES, type CityId, type MapFocus } from "./geo";
  import { EXPERIENCES } from "./experiences";
  import { LABELS } from "./labels";
  import { cellOrder, coverCounts } from "./dissolve";
  import {
    MARKER_HEIGHT_PX,
    MARKER_PATH,
    MARKER_VIEWBOX,
    MARKER_WIDTH_PX,
  } from "./marker";
  import { prefersReducedMotion } from "../../lib/motion";
  import { untrack } from "svelte";

  interface Props {
    focus?: MapFocus | null;
    selectedId?: string | null;
  }

  let { focus = null, selectedId = null }: Props = $props();

  const INITIAL_CITY: CityId = "lahore";

  const DISSOLVE_CELL_PX = 24;
  const DISSOLVE_STEPS = 4;
  const DISSOLVE_STEP_MS = 45;
  const TILE_IDLE_TIMEOUT_MS = 2000;
  const ATTRIBUTION_COLLAPSE_MS = 5000;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const FOCUS_ZOOM = 11.5;
  const FOCUS_FLY_SPEED = 0.65;
  const FOCUS_PULLBACK_DROP = 1.1;
  const FOCUS_PULLBACK_MIN_DROP = 0.4;
  const FOCUS_OUT_MS = 620;
  const FOCUS_IN_MS = 540;
  const reduceMotion = prefersReducedMotion();

  let failed = $state(false);
  let mapEl = $state<HTMLDivElement>();
  let overlayEl = $state<HTMLCanvasElement>();
  let covering = $state(false);
  let pinsHidden = $state(false);
  let attributionExpanded = $state(true);
  let map: maplibregl.Map | null = null;
  let mapPalette: MapPalette | null = null;
  let shownCity: CityId = INITIAL_CITY;
  let settledOnPin = false;
  let transitionGeneration = 0;
  let destroyed = false;
  const transitionCancels = new Set<() => void>();
  const pinById = new Map<string, HTMLElement>();

  function tileUrl(city: CityId): string {
    return `pmtiles://${new URL(CITIES[city].tilePath, document.baseURI)}`;
  }

  function cityBounds(city: CityId): [[number, number], [number, number]] {
    const b = CITIES[city].bbox;
    return [
      [b.west, b.south],
      [b.east, b.north],
    ];
  }

  function markerEl(className: string, text: string): HTMLElement {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    return el;
  }

  function pinEl(): HTMLElement {
    const el = document.createElement("div");
    el.className = "map-pin";

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", MARKER_VIEWBOX);
    svg.setAttribute("width", String(MARKER_WIDTH_PX));
    svg.setAttribute("height", String(MARKER_HEIGHT_PX));
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("aria-hidden", "true");

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", MARKER_PATH);

    svg.append(path);
    el.append(svg);
    return el;
  }

  $effect(() => {
    if (!mapEl) return;
    destroyed = false;
    attributionExpanded = true;
    const attributionTimer = setTimeout(() => {
      attributionExpanded = false;
    }, ATTRIBUTION_COLLAPSE_MS);
    const collapseAttribution = () => {
      attributionExpanded = false;
    };
    try {
      mapPalette = readMapPalette();
      shownCity = INITIAL_CITY;
      map = new maplibregl.Map({
        container: mapEl,
        style: createMapStyle(tileUrl(INITIAL_CITY), mapPalette),
        center: [
          CITIES[INITIAL_CITY].center.lng,
          CITIES[INITIAL_CITY].center.lat,
        ],
        zoom: 11,
        minZoom: 10,
        maxZoom: 16,
        maxBounds: cityBounds(INITIAL_CITY),
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();

      map.keyboard.disable();
      map.on("mousedown", collapseAttribution);
      map.on("touchstart", collapseAttribution);
      map.on("wheel", collapseAttribution);

      let loaded = false;
      map.on("load", () => {
        loaded = true;
      });
      map.on("error", () => {
        if (!loaded) failed = true;
      });

      for (const l of LABELS) {
        new maplibregl.Marker({ element: markerEl("map-label", l.name) })
          .setLngLat([l.location.lng, l.location.lat])
          .addTo(map);
      }
      const shownId = untrack(() => selectedId);
      for (const e of EXPERIENCES) {
        const el = pinEl();
        el.classList.toggle("selected", e.id === shownId);
        pinById.set(e.id, el);
        new maplibregl.Marker({ element: el })
          .setLngLat([e.location.lng, e.location.lat])
          .addTo(map);
      }
    } catch {
      failed = true;
    }
    return () => {
      clearTimeout(attributionTimer);
      destroyed = true;
      transitionGeneration += 1;
      cancelTransitionWaits();
      covering = false;
      pinsHidden = false;
      settledOnPin = false;
      map?.remove();
      map = null;
      mapPalette = null;
      pinById.clear();
    };
  });

  function cancelTransitionWaits() {
    for (const cancel of [...transitionCancels]) cancel();
    transitionCancels.clear();
  }

  function wait(ms: number, run: number): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (current: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        transitionCancels.delete(cancel);
        resolve(current);
      };
      const cancel = () => finish(false);
      const timer = setTimeout(
        () => finish(!destroyed && run === transitionGeneration),
        ms,
      );
      transitionCancels.add(cancel);
    });
  }

  function mapIdle(timeoutMs: number, run: number): Promise<boolean> {
    return new Promise((resolve) => {
      const m = map;
      if (!m || destroyed || run !== transitionGeneration) {
        resolve(false);
        return;
      }
      let settled = false;
      const finish = (current: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        m.off("idle", done);
        transitionCancels.delete(cancel);
        resolve(current);
      };
      const done = () => finish(!destroyed && run === transitionGeneration);
      const cancel = () => finish(false);
      const timer = setTimeout(done, timeoutMs);
      transitionCancels.add(cancel);
      m.once("idle", done);
    });
  }

  interface DissolveGrid {
    ctx: CanvasRenderingContext2D;
    cols: number;
    order: number[];
  }

  function prepareGrid(): DissolveGrid | null {
    const cvs = overlayEl;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return null;
    cvs.width = cvs.clientWidth;
    cvs.height = cvs.clientHeight;
    const cols = Math.ceil(cvs.width / DISSOLVE_CELL_PX);
    const rows = Math.ceil(cvs.height / DISSOLVE_CELL_PX);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    return { ctx, cols, order: cellOrder(cols * rows) };
  }

  function paintCells(
    g: DissolveGrid,
    from: number,
    to: number,
    erase: boolean,
  ) {
    g.ctx.fillStyle = mapPalette?.background ?? "";
    for (let i = from; i < to; i++) {
      const cell = g.order[i];
      const x = (cell % g.cols) * DISSOLVE_CELL_PX;
      const y = Math.floor(cell / g.cols) * DISSOLVE_CELL_PX;
      if (erase) g.ctx.clearRect(x, y, DISSOLVE_CELL_PX, DISSOLVE_CELL_PX);
      else g.ctx.fillRect(x, y, DISSOLVE_CELL_PX, DISSOLVE_CELL_PX);
    }
  }

  async function runDissolve(
    g: DissolveGrid,
    erase: boolean,
    run: number,
  ): Promise<boolean> {
    if (reduceMotion) {
      paintCells(g, 0, g.order.length, erase);
      return !destroyed && run === transitionGeneration;
    }
    const counts = coverCounts(g.order.length, DISSOLVE_STEPS);
    let done = 0;
    for (const target of counts) {
      paintCells(g, done, target, erase);
      done = target;
      if (!(await wait(DISSOLVE_STEP_MS, run))) return false;
    }
    return true;
  }

  async function swapCity(target: MapFocus, run: number) {
    const activeMap = map;
    if (!activeMap) return;
    try {
      const grid = prepareGrid();
      if (grid) {
        covering = true;
        if (!(await runDissolve(grid, false, run))) return;
      }
      if (destroyed || run !== transitionGeneration || map !== activeMap)
        return;
      shownCity = target.city;
      activeMap.setMaxBounds(cityBounds(target.city));
      if (!mapPalette) return;
      activeMap.setStyle(createMapStyle(tileUrl(target.city), mapPalette));

      activeMap.jumpTo({
        center: [target.lng, target.lat],
        zoom: FOCUS_ZOOM,
      });
      settledOnPin = true;
      if (!(await mapIdle(TILE_IDLE_TIMEOUT_MS, run))) return;
      if (grid) {
        if (!(await runDissolve(grid, true, run))) return;
      }
    } finally {
      if (run === transitionGeneration) covering = false;
    }
  }

  const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

  async function bounceTo(target: MapFocus, run: number) {
    const from = map?.getZoom() ?? 0;
    const pullback = Math.max(
      from - FOCUS_PULLBACK_DROP,
      map?.getMinZoom() ?? 0,
    );
    if (from - pullback >= FOCUS_PULLBACK_MIN_DROP) {
      pinsHidden = true;
      map?.easeTo({
        zoom: pullback,
        duration: FOCUS_OUT_MS,
        easing: easeOutCubic,
      });
      if (!(await wait(FOCUS_OUT_MS, run))) return;
      pinsHidden = false;
    }
    map?.easeTo({
      center: [target.lng, target.lat],
      zoom: FOCUS_ZOOM,
      duration: FOCUS_IN_MS,
      easing: easeInOutCubic,
    });
  }

  function applyFocus(target: MapFocus) {
    if (!map) return;
    transitionGeneration += 1;
    const run = transitionGeneration;
    cancelTransitionWaits();
    covering = false;
    pinsHidden = false;
    if (target.city !== shownCity) {
      void swapCity(target, run);
      return;
    }
    if (reduceMotion) {
      map.jumpTo({ center: [target.lng, target.lat], zoom: FOCUS_ZOOM });
    } else if (settledOnPin) {
      void bounceTo(target, run);
    } else {
      map.flyTo({
        center: [target.lng, target.lat],
        zoom: FOCUS_ZOOM,
        speed: FOCUS_FLY_SPEED,
      });
    }
    settledOnPin = true;
  }

  $effect(() => {
    if (focus) applyFocus(focus);
  });

  $effect(() => {
    for (const [id, el] of pinById)
      el.classList.toggle("selected", id === selectedId);
  });
</script>

<div class="map-shell">
  {#if failed}
    <p class="fallback">MAP UNAVAILABLE</p>
  {:else}
    <div
      class="map"
      class:pins-hidden={pinsHidden}
      data-no-drag
      bind:this={mapEl}
    ></div>
    <canvas class="dissolve" class:active={covering} bind:this={overlayEl}
    ></canvas>
    <div class="attribution" class:expanded={attributionExpanded}>
      {#if attributionExpanded}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>
      {/if}
      <button
        type="button"
        aria-label="Map attribution"
        aria-expanded={attributionExpanded}
        onclick={() => (attributionExpanded = !attributionExpanded)}
      >
        (i)
      </button>
    </div>
  {/if}
</div>

<style>
  .map-shell {
    position: relative;
    width: 100%;
    height: 100%;
    border: 2px solid var(--ui-accent);
    background: var(--surface-page);
  }

  .map {
    position: absolute;
    inset: 0;
  }

  .dissolve {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    visibility: hidden;
    pointer-events: none;
  }

  .dissolve.active {
    visibility: visible;
  }

  .map :global(.map-label) {
    color: var(--ui-accent);
    font-family: "Press Start 2P", monospace;
    font-size: 8px;
    letter-spacing: 1px;
    text-shadow: 1px 1px 0 var(--ui-ink);
    pointer-events: none;
  }

  .map :global(.map-pin) {
    display: none;
    line-height: 0;
    pointer-events: none;
  }

  .map :global(.map-pin.selected) {
    display: block;
  }

  .map.pins-hidden :global(.map-pin.selected) {
    display: none;
  }

  .map :global(.map-pin svg) {
    display: block;
    fill: var(--map-pin);
  }

  .attribution {
    position: absolute;
    bottom: 4px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--ui-accent);
    font-family: "Press Start 2P", monospace;
    font-size: 6px;
    line-height: 1;
    opacity: 0.58;
    transition: opacity 120ms linear;
  }

  .attribution:focus-within {
    opacity: 1;
  }

  @media (hover: hover) and (pointer: fine) {
    .attribution:hover {
      opacity: 1;
    }
  }

  .attribution a {
    color: inherit;
    text-underline-offset: 2px;
  }

  .attribution button {
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: inherit;
    cursor: pointer;
  }

  .attribution a,
  .attribution button {
    position: relative;
  }

  .attribution a::before,
  .attribution button::before {
    content: "";
    position: absolute;
    inset: -12px -6px;
  }

  .attribution button:focus-visible {
    outline: 1px solid currentColor;
    outline-offset: 2px;
  }

  .fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--ui-accent);
    font-size: 10px;
  }
</style>
