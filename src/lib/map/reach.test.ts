import { describe, expect, it } from 'vitest';
import { reachPath } from './reach';

const there = (d: string) => d.split(' M')[0];
const back = (d: string) => d.split(' M')[1];

describe('reachPath', () => {
  it('runs under the card, then curves from its edge to the pin edge and back out lower down in ink', () => {
    expect(reachPath(false, 400, 250, 500, 200)).toBe(
      'M0,110 H200 C294,110 294,250 388,250 M400,262 C400,430 294,430 200,430 H0',
    );
  });

  it('starts curving at the frame edge when no card covers the map', () => {
    expect(there(reachPath(false, 400, 250, 500, 0))).toBe('M0,110 H0 C194,110 194,250 388,250');
  });

  it('never runs past the pin, even if the card reaches beyond it', () => {
    expect(there(reachPath(false, 100, 250, 500, 300))).toBe('M0,110 H88 C88,110 88,250 88,250');
  });

  it('runs flat then jogs at 45 degrees to the pin edge, and back out the same way, in pixel', () => {
    expect(reachPath(true, 400, 250, 500, 200)).toBe('M0,110 H248 L388,250 M400,262 V418 L388,430 H0');
  });

  it('never starts the pixel run left of the frame', () => {
    expect(there(reachPath(true, 20, 400, 500, 0))).toBe('M0,110 H0 L8,400');
  });

  it('leaves from the top of a pin that sits below the exit', () => {
    expect(back(reachPath(true, 400, 470, 500, 0))).toBe('400,458 V442 L388,430 H0');
  });
});
