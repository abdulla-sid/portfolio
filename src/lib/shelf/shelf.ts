import { boxIn } from '../dom';
import { layoutChanged, onLayoutChange } from '../layout';
import { prefersReducedMotion } from '../motion';
import { getSkin, onSkinChange } from '../skin';

/**
 * The project shelf: picking an object lifts it and opens its details under the shelf, with the notch pointing at it.
 * One open at a time; picking the open one again puts it back.
 */
export function initShelf(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-shelf-panel]');
  const objects = [...root.querySelectorAll<HTMLButtonElement>('button[aria-controls]')];
  if (!panel) return;

  const aim = () => {
    const open = objects.find((b) => b.getAttribute('aria-expanded') === 'true');
    if (!open || panel.hidden) return;
    const b = boxIn(open, panel);
    panel.style.setProperty('--notch', `${Math.round(b.left + b.width / 2)}px`);
  };

  // the panel's own open/close/switch animation (never the morph's, which also animates [data-morph] elements)
  let resize: Animation | undefined;
  const shut: Keyframe = {
    height: '0px',
    marginTop: '0px',
    paddingTop: '0px',
    paddingBottom: '0px',
    opacity: 0,
  };
  // the panel's box as it shows now, mid-animation included
  const box = (): Keyframe => {
    if (panel.hidden) return shut;
    const { height, marginTop, paddingTop, paddingBottom, opacity } = getComputedStyle(panel);
    return { height, marginTop, paddingTop, paddingBottom, opacity };
  };
  const details = (b: HTMLButtonElement) => document.getElementById(b.getAttribute('aria-controls') ?? '');
  const show = (picked: HTMLButtonElement | undefined) => {
    for (const b of objects) {
      const d = details(b);
      if (d) d.hidden = b !== picked;
    }
    panel.hidden = !picked;
  };

  const pick = (picked: HTMLButtonElement) => {
    const opening = picked.getAttribute('aria-expanded') !== 'true';
    const still = prefersReducedMotion();
    const from = box();
    resize?.cancel();
    for (const b of objects) b.setAttribute('aria-expanded', String(opening && b === picked));
    // closing keeps the details up while they fold away
    if (opening || still) show(opening ? picked : undefined);
    if (opening) {
      aim();
      // on a phone, a lower-row object opens its details below the screen
      if (panel.getBoundingClientRect().bottom > innerHeight)
        panel.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    }
    if (!still) {
      // the panel's real box grows or folds, so what sits below and the line (which measures it) move with it
      const timing: KeyframeAnimationOptions = {
        duration: 320,
        easing: getSkin().mode === 'pixel' ? 'steps(4, end)' : 'cubic-bezier(.2,.7,.2,1)',
      };
      panel.toggleAttribute('data-moving', true);
      resize = panel.animate([from, opening ? box() : shut], { ...timing, fill: 'forwards' });
      // switching: the new details come in over the old ones' place
      if (opening && from !== shut)
        details(picked)?.animate(
          [
            { opacity: 0, translate: '0 8px' },
            { opacity: 1, translate: '0 0' },
          ],
          timing,
        );
      const done = resize;
      // the line follows the page every frame of it, not just at the end
      const follow = () => {
        layoutChanged();
        if (done.playState === 'running') requestAnimationFrame(follow);
      };
      requestAnimationFrame(follow);
      done.finished.then(
        () => {
          if (!opening) show(undefined);
          panel.removeAttribute('data-moving');
          done.cancel();
          layoutChanged();
        },
        () => {},
      );
    }
    layoutChanged();
  };

  for (const b of objects) b.addEventListener('click', () => pick(b));
  onLayoutChange(aim);
  // the objects change size with the skin, which moves their centres
  onSkinChange(() => requestAnimationFrame(aim));
  aim();
}
