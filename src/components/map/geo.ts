export interface LngLat {
  lng: number;
  lat: number;
}

export interface Bbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface City {
  name: string;

  bbox: Bbox;
  center: LngLat;

  tilePath: string;
}

export const CITIES = {
  lahore: {
    name: "LAHORE",
    bbox: { west: 74.15, south: 31.35, east: 74.55, north: 31.65 },
    center: { lng: 74.33, lat: 31.52 },
    tilePath: "map/lahore.pmtiles",
  },
  islamabad: {
    name: "ISLAMABAD",
    bbox: { west: 72.9, south: 33.52, east: 73.25, north: 33.78 },
    center: { lng: 73.06, lat: 33.68 },
    tilePath: "map/islamabad.pmtiles",
  },
} as const satisfies Record<string, City>;

export type CityId = keyof typeof CITIES;

export interface MapFocus extends LngLat {
  city: CityId;
}

export function inBbox(p: LngLat, bbox: Bbox): boolean {
  return (
    p.lng >= bbox.west &&
    p.lng <= bbox.east &&
    p.lat >= bbox.south &&
    p.lat <= bbox.north
  );
}
