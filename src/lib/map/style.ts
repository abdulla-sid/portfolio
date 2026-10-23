import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

/** The map's colours, read from tokens.css (--map-*). */
export interface MapColors {
  bg: string;
  road: string;
  major: string;
  water: string;
  waterway: string;
}

const MAJOR = ['motorway', 'motorway_link', 'trunk', 'trunk_link'];
const SECONDARY = ['primary', 'primary_link', 'secondary', 'secondary_link'];

/** Both cities in one style, so the camera can fly between them. `sources` maps a source id to its pmtiles:// URL. */
export function mapStyle(sources: Record<string, string>, c: MapColors): StyleSpecification {
  const layers: LayerSpecification[] = [
    { id: 'bg', type: 'background', paint: { 'background-color': c.bg } },
  ];
  for (const id of Object.keys(sources)) {
    layers.push(
      {
        id: `${id}-water`,
        type: 'fill',
        source: id,
        'source-layer': 'water',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': c.water },
      },
      {
        id: `${id}-waterway`,
        type: 'line',
        source: id,
        'source-layer': 'water',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: { 'line-color': c.waterway, 'line-width': 1.4 },
      },
      {
        id: `${id}-secondary`,
        type: 'line',
        source: id,
        'source-layer': 'roads',
        filter: ['in', ['get', 'kind_detail'], ['literal', SECONDARY]],
        paint: {
          'line-color': c.road,
          'line-opacity': 0.85,
          'line-width': ['step', ['zoom'], 1, 12, 1.5, 14, 2.5],
        },
      },
      {
        id: `${id}-major`,
        type: 'line',
        source: id,
        'source-layer': 'roads',
        filter: ['in', ['get', 'kind_detail'], ['literal', MAJOR]],
        paint: { 'line-color': c.major, 'line-width': ['step', ['zoom'], 1.5, 12, 2.5, 14, 4] },
      },
    );
  }
  return {
    version: 8,
    // a skin change repaints at once instead of fading through the old colours
    transition: { duration: 0, delay: 0 },
    sources: Object.fromEntries(
      Object.entries(sources).map(([id, url]) => [
        id,
        { type: 'vector', url, attribution: '© OpenStreetMap' },
      ]),
    ),
    layers,
  };
}

const COLOUR_PROPS = ['background-color', 'fill-color', 'line-color'] as const;
type ColourProp = (typeof COLOUR_PROPS)[number];
const isColour = (prop: string): prop is ColourProp => (COLOUR_PROPS as readonly string[]).includes(prop);

/** Every colour in a style as [layer, paint property, value], for repainting a live map on a skin change. */
export function colourPaint(style: StyleSpecification): [string, ColourProp, string][] {
  return style.layers.flatMap((layer) =>
    Object.entries(('paint' in layer && layer.paint) || {}).flatMap(([prop, value]) =>
      isColour(prop) ? [[layer.id, prop, String(value)] as [string, ColourProp, string]] : [],
    ),
  );
}
