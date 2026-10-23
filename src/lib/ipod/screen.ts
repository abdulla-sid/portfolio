import { ipod } from '../../content/ipod';
import { playlist } from '../../content/music';
import { type LcdColours, mmss, type Painter, textWidth } from '../canvas/paint';
import { type MusicState, TRACK_SECONDS } from '../music/store';

export const ROWS = 5;
const W = 80;

export interface IpodView {
  /** Now Playing, or the song list. */
  now: boolean;
  /** Highlighted row in the list, and the first row shown. */
  sel: number;
  top: number;
  /** 125 ms ticks, and the tick the current marquee started on. */
  t: number;
  t0: number;
  still: boolean;
}

/** The first visible row once `sel` moves, scrolling only as far as needed to keep it on screen. */
export const scrollTop = (sel: number, top: number, rows = ROWS): number =>
  Math.min(Math.max(top, sel - rows + 1), sel);

/**
 * How far a marquee has scrolled at tick `k`: it rests on the start for 12 ticks, then runs one pixel per tick
 * until the text and a 16px gap have passed, then loops.
 */
export const marqueeOffset = (k: number, textW: number): number => Math.max(0, (k % (textW + 28)) - 12);

/** One line of text in a box `w` wide. Too long: scrolls if `moving`, else is cut with '...' on a whole glyph. */
function line(
  p: Painter,
  v: IpodView,
  str: string,
  x: number,
  y: number,
  w: number,
  colour: string,
  moving: boolean,
) {
  const sw = textWidth(str);
  const box = Math.floor((w + 1) / 4) * 4 - 1;
  if (sw <= box) return p.text(str, x, y, colour);
  if (!moving || v.still) return p.text(`${str.slice(0, Math.floor((box - 11) / 4))}...`, x, y, colour);
  const k = marqueeOffset(v.t - v.t0, sw);
  p.ctx.save();
  p.ctx.beginPath();
  p.ctx.rect(x, y - 1, box, 7);
  p.ctx.clip();
  p.text(str, x - k, y, colour);
  p.text(str, x - k + sw + 16, y, colour);
  p.ctx.restore();
}

/** Draws the iPod's 80x60 screen: a status bar, then the song list or Now Playing. */
export function drawIpod(p: Painter, c: LcdColours, v: IpodView, m: MusicState): void {
  p.rect(0, 0, W, 60, c.bg);
  const head = v.now ? ipod.nowPlaying : ipod.songs;
  p.text(head, (W - textWidth(head)) >> 1, 2, c.fg);
  if (m.playing) p.playIcon(2, 2, 5, c.fg);
  else p.pauseIcon(2, 2, 1, 5, c.fg);
  // battery
  p.rect(69, 2, 8, 5, c.fg);
  p.rect(77, 3, 1, 3, c.fg);
  p.rect(70, 3, 6, 3, c.bg);
  p.rect(70, 3, 4, 3, c.mid);
  p.rect(0, 9, W, 1, c.dim);

  if (!v.now) {
    for (let r = 0; r < ROWS && v.top + r < playlist.length; r++) {
      const i = v.top + r;
      const y = 10 + r * 10;
      const on = i === v.sel;
      const colour = on ? c.bg : c.fg;
      if (on) p.rect(0, y, W, 10, c.accent);
      line(p, v, playlist[i]?.title ?? '', 3, y + 3, 63, colour, on);
      if (i === m.track && m.playing) p.playIcon(74, y + 3, 5, colour);
      else if (on) p.text('>', 74, y + 3, colour);
    }
    return;
  }
  const t = playlist[m.track];
  p.text(ipod.position(m.track + 1, playlist.length), 3, 13, c.mid);
  line(p, v, t?.title ?? '', 24, 22, 53, c.fg, true);
  line(p, v, t?.artist ?? '', 24, 31, 53, c.mid, true);
  p.rect(3, 42, 74, 4, c.dim);
  p.rect(3, 42, Math.round((Math.min(m.position, TRACK_SECONDS) / TRACK_SECONDS) * 74), 4, c.accent);
  p.text(mmss(m.position), 3, 50, c.mid);
  const left = `-${mmss(TRACK_SECONDS - m.position)}`;
  p.text(left, 77 - textWidth(left), 50, c.mid);
}
