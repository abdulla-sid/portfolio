import { device } from '../../content/device';
import { playlist } from '../../content/music';
import { now } from '../../content/now';
import { site } from '../../content/site';
import { bigWidth, type LcdColours, mmss, type Painter, textWidth, truncate, wrap } from '../canvas/paint';
import { clockIn, clockParts, utcOffset } from '../clock/clock';
import { toggle } from '../music/player';
import { music, TRACK_SECONDS } from '../music/store';
import { CAT, CUP, STEAM } from './sprites';

/** What every app may read while drawing. `t` counts 125 ms ticks; `still` is reduced motion. */
interface Frame {
  p: Painter;
  c: LcdColours;
  t: number;
  still: boolean;
}

interface App {
  /** Stable, for logic; `name` is copy and may change. */
  id: 'clock' | 'coffee' | 'reading' | 'music';
  name: string;
  draw(f: Frame): void;
  /** Screen-reader text for the current state. */
  say(): string;
  /** What a tap on the screen does; without it, a tap moves to the next app. */
  tap?(): void;
}

/** The LCD in its own pixels. */
export const W = 120;
export const H = 80;

function statusBar({ p, c }: Frame, left: string, right: string): void {
  p.text(left, 4, 3, c.fg);
  p.text(right, W - 4 - textWidth(right), 3, c.mid);
  p.rect(4, 10, W - 8, 1, c.dim);
}

const centred = (f: Frame, str: string, y: number, colour: string) =>
  f.p.text(str, (W - textWidth(str)) >> 1, y, colour);

// the cat paces the clock's floor; its position lives here because only the clock draws it
const cat = { x: 10, dir: 1, t: -1 };

const clock: App = {
  id: 'clock',
  name: device.clock.name,
  say: () => device.clock.say(clockIn(site.timeZone).time, site.city),
  draw(f) {
    const date = new Date();
    const { hh, mm, weekday, day, month } = clockParts(date, site.timeZone);
    statusBar(f, site.city, utcOffset(date, site.timeZone));
    const time = `${hh}:${mm}`;
    f.p.big(time, (W - bigWidth(time)) / 2, 17, f.c.fg, f.c.ghost);
    centred(f, `${weekday} ${day} ${month}`, 50, f.c.mid);
    f.p.rect(0, 74, W, 1, f.c.mid);
    if (!f.still && f.t !== cat.t) {
      cat.t = f.t;
      cat.x += cat.dir * 0.5;
      if (cat.x > 106 || cat.x < 3) cat.dir *= -1;
    }
    const frame = CAT[f.still ? 0 : (f.t >> 1) & 1] ?? [];
    const rows = cat.dir < 0 ? frame.map((r) => [...r].reverse().join('')) : frame;
    f.p.sprite(rows, cat.x, 67, { '#': f.c.fg });
  },
};

// Taps add to today's count from content/now.ts. Stored as "date:extra" so they reset the next day.
const COFFEE_KEY = 'td-coffee';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: site.timeZone });

/** Extra cups saved for `day`, from the stored "date:extra" string; 0 for another day or anything malformed. */
export function savedExtra(stored: string | null, day: string): number {
  const [d, n] = (stored ?? '').split(':');
  const extra = Number(n);
  return d === day && Number.isInteger(extra) && extra > 0 ? extra : 0;
}

function readExtra(): number {
  try {
    return savedExtra(localStorage.getItem(COFFEE_KEY), today());
  } catch {
    return 0;
  }
}

let extra: number | undefined; // read on first use, so importing this module on the server is safe
const cups = () => {
  extra ??= readExtra();
  return Math.min(99, now.coffeeToday + extra);
};

/** The clock's opinion of `n` cups, or undefined below the first verdict. */
export const verdict = (n: number) => device.coffee.verdict.findLast((v) => n >= v.from)?.say;
const ALARMED = 6; // from here the verdict turns accent colour

const coffee: App = {
  id: 'coffee',
  name: device.coffee.name,
  say: () => device.coffee.say(cups(), verdict(cups())),
  tap() {
    if (cups() >= 99) return;
    extra = (extra ?? 0) + 1;
    try {
      localStorage.setItem(COFFEE_KEY, `${today()}:${extra}`);
    } catch {
      // storage blocked: the count still goes up for this visit
    }
  },
  draw(f) {
    statusBar(f, device.coffee.name, device.coffee.when);
    f.p.sprite(STEAM[f.still ? 0 : (f.t >> 2) & 1] ?? [], 10, 20, { '#': f.c.dim }, 2);
    f.p.sprite(CUP, 6, 28, { '#': f.c.fg, o: f.c.accent }, 2);
    f.p.big(String(cups()).padStart(2, '0'), 62, 22, f.c.fg, f.c.ghost);
    centred(f, verdict(cups()) ?? device.coffee.more, 66, cups() >= ALARMED ? f.c.accent : f.c.mid);
  },
};

const { title, author, page, pages } = now.reading;
const share = Math.min(1, page / pages);

const reading: App = {
  id: 'reading',
  name: device.reading.name,
  say: () => device.reading.say(title, author, page, pages),
  draw(f) {
    const { p, c } = f;
    statusBar(f, device.reading.name, `${Math.round(share * 100)}%`);
    p.rect(8, 18, 18, 24, c.fg);
    p.rect(12, 20, 12, 20, c.accent);
    p.rect(14, 24, 8, 1, c.bg);
    p.rect(14, 27, 6, 1, c.bg);
    p.rect(9, 18, 1, 24, c.bg);
    wrap(title, 21, 3).forEach((line, i) => {
      p.text(line, 32, 18 + i * 7, c.fg);
    });
    p.text(truncate(author, 84), 32, 42, c.mid);
    p.rect(8, 56, 104, 4, c.ghost);
    p.rect(8, 56, Math.round(104 * share), 4, c.fg);
    p.text(device.reading.page(page, pages), 8, 65, c.mid);
  },
};

const track = () => playlist[music.get().track] ?? { title: '', artist: '' };

const player: App = {
  id: 'music',
  name: device.music.name,
  say: () => device.music.say(track().title, track().artist, music.get().playing),
  tap: toggle,
  draw(f) {
    const { p, c, t, still } = f;
    const { playing, position } = music.get();
    const { title, artist } = track();
    statusBar(f, device.music.name, playing ? device.music.playing : device.music.paused);
    if (textWidth(title, 2) <= 112) p.text(title, 4, 16, c.fg, 2);
    else p.text(truncate(title, 112), 4, 20, c.fg);
    p.text(truncate(artist, 112), 4, 30, c.mid);
    if (playing) p.pauseIcon(4, 40, 2, 7, c.fg);
    else p.playIcon(4, 40, 7, c.fg);
    const done = Math.round((Math.min(position, TRACK_SECONDS) / TRACK_SECONDS) * 100);
    p.rect(16, 43, 100, 1, c.ghost);
    p.rect(16, 43, done, 1, c.fg);
    p.rect(15 + done, 41, 3, 5, c.accent);
    p.text(mmss(position), 16, 50, c.mid);
    const length = mmss(TRACK_SECONDS);
    p.text(length, 116 - textWidth(length), 50, c.mid);
    // a little visualiser; flat when paused or for reduced motion
    for (let i = 0; i < 22; i++) {
      const h =
        playing && !still
          ? 3 + Math.round((Math.sin(t * 0.35 + i * 1.7) + Math.sin(t * 0.21 + i * 0.6) + 2) * 3.5)
          : 2;
      p.rect(5 + i * 5, 77 - h, 3, h, c.dim);
    }
  },
};

/** The device's apps, in the order the red button cycles them. */
export const apps: App[] = [clock, coffee, reading, player];
