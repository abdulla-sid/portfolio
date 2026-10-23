import { type City, cities, travel, type WorkEntry, work } from '../../content/work';

/** What the city label in the map's corner says. */
export interface CityLabel {
  name: string;
  sub?: string;
}

export interface Shot {
  /** Every pin in the city, as [[west, south], [east, north]], so the camera can keep them all in view. */
  bounds: [[number, number], [number, number]];
  /** The closest the camera gets; a narrow map pulls back further to fit the bounds. */
  zoom: number;
  city: City;
  /** A flight between the two cities, which gets the long, slow curve. */
  far: boolean;
  /** The label while the camera moves, then once it lands. */
  during: CityLabel;
  after: CityLabel;
}

// a phone's map is a third the height, so pull back to keep the same streets in view
const PHONE_ZOOM_OUT = 1.7;

/** Where the camera goes to show an entry's pin, coming from the city it is over now. */
export function shotFor(entry: WorkEntry, from: City, phone: boolean): Shot {
  const city = entry.pin.city;
  const far = city !== from;
  const after: CityLabel = { name: cities[city].name, sub: entry.citySub };
  const pins = work.filter((w) => w.pin.city === city).map((w) => w.pin);
  const lngs = pins.map((p) => p.lng);
  const lats = pins.map((p) => p.lat);
  return {
    bounds: [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    zoom: cities[city].zoom - (phone ? PHONE_ZOOM_OUT : 0),
    city,
    far,
    during: far
      ? { name: cities[from].name, sub: city === 'islamabad' ? travel.toIslamabad : travel.toLahore }
      : after,
    after,
  };
}
