/** ms per animation step on every pixel screen: the LCD's cat and steam and the iPod's marquee move at 8 fps. */
const TICK = 125;

/**
 * Calls `frame` on every animation frame while `el` is on screen, with `ticked` true once per TICK. Browsers already
 * stop animation frames in hidden tabs, so between the two the loop only runs when someone can see it.
 */
export function whileVisible(el: Element, frame: (now: number, ticked: boolean) => void): void {
  let raf = 0;
  let last = 0;
  const run = (now: number) => {
    const ticked = now - last >= TICK;
    if (ticked) last = now;
    frame(now, ticked);
    raf = requestAnimationFrame(run);
  };
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry?.isIntersecting) raf = requestAnimationFrame(run);
  }).observe(el);
}
