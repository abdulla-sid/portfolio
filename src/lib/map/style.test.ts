import { describe, expect, it } from 'vitest';
import { colourPaint, mapStyle } from './style';

const colours = { bg: 'bg', road: 'road', major: 'major', water: 'water', waterway: 'waterway' };

describe('mapStyle', () => {
  const style = mapStyle({ lahore: 'pmtiles://a', islamabad: 'pmtiles://b' }, colours);

  it('puts both cities in one style, roads drawn over water', () => {
    expect(Object.keys(style.sources)).toEqual(['lahore', 'islamabad']);
    expect(style.layers.map((l) => l.id)).toEqual([
      'bg',
      'lahore-water',
      'lahore-waterway',
      'lahore-secondary',
      'lahore-major',
      'islamabad-water',
      'islamabad-waterway',
      'islamabad-secondary',
      'islamabad-major',
    ]);
  });

  it('switches off paint transitions', () => {
    expect(style.transition).toEqual({ duration: 0, delay: 0 });
  });
});

describe('colourPaint', () => {
  it('lists only colour properties, so repainting leaves widths alone', () => {
    const paint = colourPaint(mapStyle({ lahore: 'pmtiles://a' }, colours));
    expect(paint).toEqual([
      ['bg', 'background-color', 'bg'],
      ['lahore-water', 'fill-color', 'water'],
      ['lahore-waterway', 'line-color', 'waterway'],
      ['lahore-secondary', 'line-color', 'road'],
      ['lahore-major', 'line-color', 'major'],
    ]);
  });
});
