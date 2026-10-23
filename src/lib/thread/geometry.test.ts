import { describe, expect, it } from 'vitest';
import type { Box } from '../dom';
import {
  branchPath,
  cableFromGutter,
  cablePath,
  forkPoint,
  inkGutter,
  inkPath,
  noteBeside,
  ortho,
  padsFor,
  type Route,
  stacked,
  sweep,
  traceFork,
  tracePath,
  viasFor,
} from './geometry';

const box = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const route: Route = {
  start: { x: 500, y: 300 },
  under: 340,
  gutter: 32,
  // a wide screen: the page column sits well in from the edge
  edge: 100,
  small: false,
  button: { x: 700, y: 260 },
  device: box(690, 140, 420, 330),
  headings: [box(84, 580, 200, 60), box(84, 1400, 200, 60)],
  map: box(84, 1500, 1100, 540),
  end: box(84, 2300, 300, 40),
};

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('ortho', () => {
  it('cuts every inner corner at 45 degrees', () => {
    expect(
      ortho(
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
        ],
        10,
      ),
    ).toBe('M0,0 L90,0 L100,10 L100,100');
  });

  it('never cuts more than half a short run', () => {
    expect(
      ortho(
        [
          { x: 0, y: 0 },
          { x: 8, y: 0 },
          { x: 8, y: 100 },
        ],
        10,
      ),
    ).toBe('M0,0 L4,0 L8,4 L8,100');
  });

  it('skips repeated points and handles empty input', () => {
    expect(
      ortho(
        [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: 50 },
        ],
        10,
      ),
    ).toBe('M0,0 L0,50');
    expect(ortho([], 10)).toBe('');
  });
});

describe('inkPath', () => {
  it('runs from the full stop through the button and ends under the send button', () => {
    const { d, rest } = inkPath(route);
    expect(d.startsWith('M500,300 C')).toBe(true);
    expect(d).toContain('700,260');
    expect(d.endsWith(' 84,2320')).toBe(true);
    expect(d.startsWith(rest)).toBe(true);
    expect(rest.length).toBeLessThan(d.length);
  });

  describe('through the projects shelf', () => {
    // two headings: About, then one under the shelf ("Say hi."); the shelf between them
    const shelfRoute: Route = {
      ...route,
      map: undefined,
      headings: [route.headings[0] as Box, box(84, 2500, 200, 60)],
      shelf: [box(100, 1900, 100, 100), box(300, 1880, 100, 120), box(500, 1890, 100, 110)],
      caps: [box(100, 2020, 150, 40), box(300, 2020, 150, 40), box(500, 2020, 150, 40)],
      panel: box(84, 2100, 1000, 200),
      shelfText: [box(84, 1700, 120, 60), box(84, 1780, 300, 24)],
      note: box(900, 2600, 200, 100),
      end: box(84, 2700, 100, 40),
    };

    it('drops straight down the middle gap, sweeping in above the heading when that clears its text', () => {
      const { d } = inkPath(shelfRoute);
      expect(d).toContain('L32,1600 C32,1678 475,1614 475,1692 L475,2310');
    });

    it('sweeps in under the intro when the gap is under the text', () => {
      const { d } = inkPath({ ...shelfRoute, shelfText: [box(84, 1700, 400, 60)] });
      expect(d).toContain('L32,1766 C32,1860 475,1782 475,1876 L475,2310');
    });

    it('stays on the right, skips the heading below and ends in a full stop beside the note', () => {
      const { d, dot } = inkPath(shelfRoute);
      expect(dot).toEqual({ x: 884, y: 2616 });
      expect(d.endsWith('L884,2616')).toBe(true);
      // no loop at the heading below the shelf (2530 is its middle)
      expect(d).not.toContain(',2490 C');
    });

    it('falls back to the gutter and the send button when the note is stacked under the card', () => {
      const { d, dot } = inkPath({ ...shelfRoute, note: box(84, 2800, 300, 60) });
      expect(dot).toBeUndefined();
      // back to the gutter with the usual loop at the heading below the shelf, never across its text
      expect(d).toContain('32,2490 C32,2520');
      expect(d.endsWith(' 84,2720')).toBe(true);
      expect(noteBeside({ ...shelfRoute, note: box(84, 2800, 300, 60) }, 475)).toBeUndefined();
      expect(noteBeside(shelfRoute, 475)).toEqual(shelfRoute.note);
    });

    it('keeps the shelf route with the panel closed, the drop ending under the captions', () => {
      const { d, dot } = inkPath({ ...shelfRoute, panel: undefined });
      expect(d).toContain('475,1692 L475,2070');
      expect(dot).toEqual({ x: 884, y: 2616 });
    });

    it('is skipped on a phone, which ends in the send button', () => {
      const { d, dot } = inkPath({ ...shelfRoute, small: true });
      expect(dot).toBeUndefined();
      expect(d.endsWith(' 84,2720')).toBe(true);
    });
  });

  it('goes under the name, not through the hero text, when the device is stacked under it (tablets)', () => {
    const tall = { ...route, clear: 120 };
    expect(stacked(tall)).toBe(true);
    const { d } = inkPath(tall);
    expect(d.startsWith('M500,300 C504,340 490,340 470,340 L56,340')).toBe(true);
    expect(inkPath(route).d.startsWith('M500,300 C560,310')).toBe(true);
  });

  it('branches the cable off the gutter only when the iPod sits under the About copy', () => {
    const copy = box(64, 1060, 900, 176);
    // beside the copy (desktop): straight from the fork under the device
    expect(cableFromGutter({ ...route, copy }, box(640, 1077, 14, 10))).toBe(false);
    // under it (tablets), or the device under the hero text
    expect(cableFromGutter({ ...route, copy }, box(95, 1272, 14, 10))).toBe(true);
    expect(cableFromGutter({ ...route, clear: 120 }, box(640, 1077, 14, 10))).toBe(true);
  });

  it('forks the cable where it leaves the device', () => {
    expect(forkPoint(route)).toEqual({ x: 718, y: 488 });
    expect(inkPath(route).d).toContain('L718,488 C718,');
  });

  it('copes with nothing but the full stop', () => {
    const { d, rest } = inkPath({
      ...route,
      button: undefined,
      device: undefined,
      headings: [],
      map: undefined,
      end: undefined,
    });
    expect(d).toBe(rest);
    expect(numbers(d).every(Number.isFinite)).toBe(true);
  });

  it('drops stops that would send the line back up the page', () => {
    const { d } = inkPath({ ...route, map: box(84, 100, 1100, 300) });
    expect(d).not.toContain(`${84 + 6},`);
  });
});

describe('tracePath', () => {
  it('is orthogonal or 45 degrees on every run', () => {
    const n = numbers(tracePath(route, 18).d);
    for (let i = 2; i < n.length; i += 2) {
      const dx = Math.abs((n[i] as number) - (n[i - 2] as number));
      const dy = Math.abs((n[i + 1] as number) - (n[i - 1] as number));
      expect(dx === 0 || dy === 0 || Math.abs(dx - dy) <= 1).toBe(true);
    }
  });

  it('rests at the first heading', () => {
    const { d, rest } = tracePath(route, 18);
    expect(rest.endsWith('L32,610')).toBe(true);
    expect(d.length).toBeGreaterThan(rest.length);
  });

  it('leaves the device well clear of the hero text, lower than ink', () => {
    expect(tracePath(route, 18).d).toContain(',526');
    expect(traceFork(route)).toEqual({ x: 718, y: 526 });
    const { d } = tracePath({ ...route, clear: 520 }, 18);
    expect(d).toContain(',576');
    expect(d).not.toContain(',526');
    expect(inkPath({ ...route, clear: 520 }).d).toContain(',538');
  });

  it('routes under the name on a phone, clear of its descenders', () => {
    const { d } = tracePath({ ...route, small: true, gutter: 8 }, 12);
    expect(d.startsWith('M500,300 L500,336')).toBe(true);
  });

  it('goes round the hero text when the device is stacked under it (tablets)', () => {
    const tall = { ...route, clear: 120 };
    expect(stacked(tall)).toBe(true);
    expect(stacked(route)).toBe(false);
    expect(tracePath(tall, 18).d.startsWith('M500,300 L500,330')).toBe(true);
  });

  describe('through the shelf', () => {
    const shelf = [box(100, 2100, 100, 90), box(300, 2100, 100, 90), box(500, 2100, 100, 90)];
    const caps = [box(100, 2210, 150, 40), box(300, 2210, 150, 40), box(500, 2210, 150, 40)];
    const panel = box(84, 2300, 1000, 200);
    const sayhi = box(84, 2600, 200, 60);
    const base = {
      ...route,
      map: undefined,
      shelf,
      caps,
      panel,
      headings: [route.headings[0] as Box, sayhi],
    };

    it('drops straight down the gap clear of objects and captions, with a via under the plank', () => {
      const r2 = { ...base, end: box(84, 3000, 100, 40) };
      const d = tracePath(r2, 18).d;
      // across 36px above the objects, then down the middle of what is clear of both caption 1 (to 250) and object 2
      expect(d).toContain('L257,2064 L275,2082');
      expect(viasFor(r2)[0]).toEqual({ x: 275, y: 2214, size: 14 });
      // no clock note beside the card: back to the gutter midway to Say hi., then into the send button
      expect(d).toContain('L50,2550 L32,2568');
      expect(d.endsWith('L84,3020')).toBe(true);
      expect(padsFor(r2)).toHaveLength(2);
    });

    it('stays right and ends beside the clock note when it sits beside the card', () => {
      const r2 = { ...base, end: box(84, 3000, 100, 40), note: box(900, 2800, 200, 40) };
      const d = tracePath(r2, 18).d;
      expect(d.endsWith('L872,2820')).toBe(true);
      expect(d).toContain(',2630');
      expect(viasFor(r2)[1]).toEqual({ x: 872, y: 2820, size: 18 });
      // Say hi. is off the trace now, so it gets no pad
      expect(padsFor(r2)).toHaveLength(1);
    });

    it('keeps the shelf route with the panel closed, coming back right under the captions', () => {
      const d = tracePath({ ...base, panel: undefined, end: box(84, 3000, 100, 40) }, 18).d;
      expect(d).toContain('L257,2064 L275,2082');
      // back to the gutter midway between the captions' bottom (2250) and Say hi.
      expect(d).toContain(',2425 L');
    });

    it('is skipped on phones', () => {
      expect(viasFor({ ...base, small: true })).toEqual([]);
    });
  });
});

describe('inkGutter', () => {
  // the loop's reach: its control points beside a heading (the curve itself stays inside them)
  const loopSpan = (r: Route) => {
    const h = (r.headings[0] as Box).top + 30;
    const seg =
      inkPath(r)
        .d.split(`${h - 40} C`)[1]
        ?.split(`,${h + 40}`)[0] ?? '';
    const xs = numbers(seg).filter((_, i) => i % 2 === 0);
    return [Math.min(...xs), Math.max(...xs)];
  };

  it('leaves a wide screen as it is', () => {
    expect(inkGutter(route)).toEqual({ x: 32, s: 1 });
  });

  it('moves the line in when the column fills the screen, so the loop stays on it', () => {
    const r2 = { ...route, edge: 0, headings: route.headings.map((h) => ({ ...h, left: 64 })) };
    expect(inkGutter(r2)).toEqual({ x: 36, s: 1 });
    const [lo, hi] = loopSpan(r2);
    expect(lo).toBeGreaterThanOrEqual(4);
    expect(hi).toBeLessThanOrEqual(64 - 4);
  });

  it('shrinks the loop between the edge and the text on a tablet', () => {
    const r2 = { ...route, gutter: 20, edge: 0, headings: route.headings.map((h) => ({ ...h, left: 40 })) };
    const { x, s } = inkGutter(r2);
    expect(s).toBeLessThan(1);
    expect(x).toBe(31);
    const [lo, hi] = loopSpan(r2);
    expect(lo).toBeGreaterThanOrEqual(4);
    expect(hi).toBeLessThanOrEqual(40 - 4);
  });
});

describe('padsFor', () => {
  it('puts a pad at each heading', () => {
    expect(padsFor(route)).toEqual([
      { x: 32, y: 610, stub: 64 },
      { x: 32, y: 1430, stub: 64 },
    ]);
  });

  it('plugs the trace into the side of the send button', () => {
    expect(tracePath(route, 18).d.endsWith('L84,2320')).toBe(true);
  });
});

describe('cablePath', () => {
  it('drops, runs across at 45 degrees, and drops into the jack in pixel mode', () => {
    expect(cablePath({ x: 800, y: 500 }, { x: 700, y: 800 }, true)).toBe(
      'M800,500 L800,592 L794,606 L706,694 L700,708 L700,800',
    );
  });

  it('runs level for the part the diagonal cannot cover', () => {
    expect(cablePath({ x: 800, y: 500 }, { x: 500, y: 700 }, true)).toBe(
      'M800,500 L800,532 L794,546 L676,664 L662,670 L508,670 L500,678 L500,700',
    );
  });

  it('branches off the gutter on a phone', () => {
    expect(branchPath({ x: 8, y: 900 }, { x: 50, y: 928 }, true)).toBe('M8,900 L42,900 L50,908 L50,928');
    expect(branchPath({ x: 8, y: 900 }, { x: 50, y: 928 }, false)).toBe('M8,900 C38,900 50,888 50,928');
  });

  it('is one S-curve in ink', () => {
    expect(cablePath({ x: 800, y: 500 }, { x: 700, y: 700 }, false)).toBe(
      'M800,500 C800,610 700,590 700,700',
    );
  });
});

describe('sweep', () => {
  it('is one S with handles most of the drop long, so it turns wide at both ends', () => {
    expect(sweep({ x: 0, y: 0 }, { x: 500, y: 100 })).toBe(' C0,85 500,15 500,100');
  });
});
