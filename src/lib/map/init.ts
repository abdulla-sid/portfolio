import { boxIn } from '../dom';
import { LINE, PHONE_QUERY } from '../metrics';
import { prefersReducedMotion } from '../motion';
import { getSkin, onSkinChange, token } from '../skin';
import { selection } from '../work/selection';
import type { CityLabel } from './camera';
import type { Box, MountedMap } from './mount';
import { reachPath } from './reach';
import type { MapColors } from './style';

const readColors = (): MapColors => ({
  bg: token('--map-bg'),
  road: token('--map-road'),
  major: token('--map-major'),
  water: token('--map-water'),
  waterway: token('--map-waterway'),
});

const phone = matchMedia(PHONE_QUERY);
// how far apart the points checked along the line are, and how near a label they count as crossing it
const STEP = 4;
const NEAR = 3;

/**
 * The work map. MapLibre (about 250 KB) is fetched only when the section comes near the viewport; until then,
 * and if WebGL or the tiles fail, the frame shows a plain message and the tabs still work.
 */
export function initWorkMap(root: HTMLElement): void {
  const mapEl = root.querySelector<HTMLElement>('[data-map]');
  const wait = root.querySelector<HTMLElement>('[data-map-wait]');
  const city = root.querySelector<HTMLElement>('[data-map-city]');
  const reach = root.querySelector<SVGSVGElement>('[data-map-reach]');
  const reachLine = reach?.querySelector('path');
  if (!mapEl || !wait || !city || !reach || !reachLine) return;

  let map: MountedMap | undefined;

  const setCity = ({ name, sub }: CityLabel) => {
    city.replaceChildren(name);
    if (sub) city.append(Object.assign(document.createElement('small'), { textContent: sub }));
  };

  const cardInset = () => {
    const card = root.querySelector('[data-map-overlay]');
    if (phone.matches || !card) return 0;
    return Math.max(0, boxIn(card, mapEl).right);
  };

  const drawReach = () => {
    if (!map) return;
    const { x, y } = map.point(selection.get().id);
    reachLine.setAttribute('d', reachPath(getSkin().mode === 'pixel', x, y, mapEl.clientHeight, cardInset()));
    // labels move to the side of their pin the line does not cross
    const length = reachLine.getTotalLength();
    const line: DOMPoint[] = [];
    for (let at = 0; at <= length; at += STEP) line.push(reachLine.getPointAtLength(at));
    const crosses = (b: Box) =>
      line.some(
        (p) => p.x > b.x - NEAR && p.x < b.x + b.w + NEAR && p.y > b.y - NEAR && p.y < b.y + b.h + NEAR,
      );
    map.placeLabels(crosses);
  };

  // the reach continues the page's thread, so it shows once the thread has been drawn down to where it enters:
  // the root's bottom is the reveal line, and crossing mapEntry of the map's height is the moment it gets there
  const reveal = new IntersectionObserver(
    (entries) => {
      const e = entries.at(-1);
      if (!e) return;
      const { top, height } = e.boundingClientRect;
      const reached = top + height * LINE.mapEntry < (e.rootBounds?.bottom ?? innerHeight * LINE.reveal);
      reach.classList.toggle('on', prefersReducedMotion() || reached);
    },
    { rootMargin: `0px 0px ${-Math.round((1 - LINE.reveal) * 100)}% 0px`, threshold: [0, LINE.mapEntry] },
  );

  const show = (id: string, jump: boolean) => {
    map?.show(id, { jump: jump || prefersReducedMotion(), phone: phone.matches, left: cardInset() });
    // a pick in the same city may not move the camera, but the line and labels still follow it
    drawReach();
  };

  const load = async () => {
    try {
      const { mountMap } = await import('./mount');
      map = await mountMap(mapEl, {
        colors: readColors(),
        interactive: !matchMedia('(pointer: coarse)').matches,
        start: selection.get().id,
        onPin: (id) => selection.set({ id }),
        onMove: drawReach,
        onLabel: setCity,
      });
    } catch {
      wait.textContent = wait.dataset.failed ?? '';
      return;
    }
    // the skin may have changed while the tiles loaded
    map.repaint(readColors());
    mapEl.classList.add('ready');
    show(selection.get().id, true);
    reveal.observe(mapEl);
    selection.subscribe(({ id }) => show(id, false));
    onSkinChange(() => {
      map?.repaint(readColors());
      drawReach();
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      load();
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(root);
}
