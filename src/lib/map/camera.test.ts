import { describe, expect, it } from 'vitest';
import { cities, travel, work } from '../../content/work';
import { shotFor } from './camera';

const byCity = (city: string) => {
  const entry = work.find((w) => w.pin.city === city);
  if (!entry) throw new Error(`no entry in ${city}`);
  return entry;
};
const lahore = byCity('lahore');
const islamabad = byCity('islamabad');

describe('shotFor', () => {
  it('stays in the city for a pin in the same city', () => {
    const shot = shotFor(lahore, 'lahore', false);
    expect(shot.far).toBe(false);
    expect(shot.during).toEqual(shot.after);
    expect(shot.zoom).toBe(cities.lahore.zoom);
  });

  it('frames every pin in the city', () => {
    const [[w, s], [e, n]] = shotFor(lahore, 'islamabad', false).bounds;
    for (const { pin } of work.filter((x) => x.pin.city === 'lahore')) {
      expect(pin.lng).toBeGreaterThanOrEqual(w);
      expect(pin.lng).toBeLessThanOrEqual(e);
      expect(pin.lat).toBeGreaterThanOrEqual(s);
      expect(pin.lat).toBeLessThanOrEqual(n);
    }
  });

  it('labels a flight with the city it leaves and the road it takes', () => {
    const up = shotFor(islamabad, 'lahore', false);
    expect(up.far).toBe(true);
    expect(up.during).toEqual({ name: cities.lahore.name, sub: travel.toIslamabad });
    expect(up.after.name).toBe(cities.islamabad.name);

    const down = shotFor(lahore, 'islamabad', false);
    expect(down.during).toEqual({ name: cities.islamabad.name, sub: travel.toLahore });
  });

  it('pulls back on a phone', () => {
    expect(shotFor(lahore, 'lahore', true).zoom).toBeLessThan(cities.lahore.zoom);
  });

  it('carries the entry note under the city name', () => {
    expect(shotFor(lahore, 'lahore', false).after.sub).toBe(lahore.citySub);
  });
});
