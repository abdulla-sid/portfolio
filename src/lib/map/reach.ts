import { LINE } from '../metrics';

const r = Math.round;
// the line stops at the active pin's edge so it never crosses the halo
const PIN_GAP = 12;
// pixel mode's 45-degree corner on the way back out
const JOG = 12;

/**
 * The line inside the map that picks up the page's thread at the left edge, arrives at the active pin at (x, y), and
 * leaves it again for the left edge lower down, where the page's thread carries on, in a map h tall. `left` is the
 * width hidden under the job card: the line runs under it and only bends once it is clear, so all that shows is a
 * leader from the card's edge to the pin and back. Ink: pen curves. Pixel: runs and 45-degree jogs, like a PCB trace.
 */
export function reachPath(pixel: boolean, x: number, y: number, h: number, left: number): string {
  const [y1, y3] = [r(h * LINE.mapEntry), r(h * LINE.mapExit)];
  const [end, y2] = [r(x - PIN_GAP), r(y)];
  // leave from the pin's bottom, or its top when the pin sits below the exit
  const dir = y3 >= y2 ? 1 : -1;
  const yb = y2 + dir * PIN_GAP;
  const x0 = r(x);
  if (pixel) {
    const jog = Math.min(JOG, Math.abs(y3 - yb));
    return (
      `M0,${y1} H${Math.max(0, end - Math.abs(y2 - y1))} L${end},${y2}` +
      ` M${x0},${yb} V${y3 - dir * jog} L${x0 - jog},${y3} H0`
    );
  }
  const from = Math.max(0, Math.min(r(left), end));
  const mid = r((from + end) / 2);
  return (
    `M0,${y1} H${from} C${mid},${y1} ${mid},${y2} ${end},${y2}` +
    ` M${x0},${yb} C${x0},${y3} ${mid},${y3} ${from},${y3} H0`
  );
}
