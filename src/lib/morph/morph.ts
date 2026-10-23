import { lcd } from '../lcd/controller';
import { prefersReducedMotion } from '../motion';
import { getSkin, type Mode, setSkin, token } from '../skin';
import { thread } from '../thread/thread';
import { END, pullBack, redraw, SWAP, stagger, toneStep } from './timing';

const root = document.documentElement;

/** Reads tokens as another mode would resolve them, without painting it (style is recomputed, not rendered). */
function peek(mode: Mode, names: Array<`--${string}`>): string[] {
  const was = root.dataset.mode;
  root.dataset.mode = mode;
  const values = names.map(token);
  root.dataset.mode = was;
  return values;
}

/** Starts downloading a mode's faces, so the name is never retyped in a fallback. */
export async function preloadFonts(mode: Mode): Promise<void> {
  if (!document.fonts) return;
  const [display, weight, text, label] = peek(mode, ['--display', '--display-weight', '--text', '--label']);
  const faces = [
    `${weight} 1em ${display}`,
    `italic ${weight} 1em ${display}`,
    `500 1em ${display}`,
    `400 1em ${text}`,
    `600 1em ${text}`,
    `400 1em ${label}`,
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f))).catch(() => undefined);
}

/** Wraps each letter of el in a span for the morph only, so kerning is untouched at rest. */
function splitLetters(el: Element): { letters: HTMLElement[]; restore(): void } {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const letters: HTMLElement[] = [];
  for (const node of nodes) {
    const spans = [...node.data].map((ch) => {
      const span = document.createElement('span');
      span.textContent = ch;
      return span;
    });
    letters.push(...spans);
    node.replaceWith(...spans);
  }
  return {
    letters,
    restore() {
      for (const span of letters) span.replaceWith(span.textContent ?? '');
      el.normalize();
    },
  };
}

const onScreen = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
};
const readingOrder = (a: Element, b: Element): number => {
  const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
  return ra.top * 4 + ra.left - (rb.top * 4 + rb.left);
};
const visible = (kind: 'object' | 'text'): HTMLElement[] =>
  [...document.querySelectorAll<HTMLElement>(`[data-morph="${kind}"]`)].filter(onScreen).sort(readingOrder);

const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation =>
  el.animate(keyframes, { fill: 'both', ...options });

let running = false;

/**
 * Switches mode. Each piece un-draws in the old skin (letters back-spaced, objects wiped, text stepped away) while the
 * page steps towards the new paper; the skin swaps; then everything re-draws in the new skin's own way of moving.
 * Clicks while it runs are ignored. Reduced motion swaps at once.
 */
export async function morphTo(mode: Mode): Promise<void> {
  if (running || mode === getSkin().mode) return;
  if (prefersReducedMotion()) {
    setSkin({ mode });
    return;
  }
  running = true;
  try {
    await Promise.race([preloadFonts(mode), new Promise((r) => setTimeout(r, 1000))]);
    await choreograph(mode === 'pixel', () => {
      setSkin({ mode });
      lcd.reboot();
    });
  } finally {
    // a throw anywhere (a skin subscriber, say) must not leave the switch dead for the rest of the visit
    running = false;
  }
}

function choreograph(toPixel: boolean, swap: () => void): Promise<void> {
  const outEase = toPixel ? 'ease-in' : 'steps(3, end)';
  const inEase = toPixel ? 'steps(4, end)' : 'cubic-bezier(.2,.7,.2,1)';
  const shown = 'inset(-6px -14px -14px -6px)'; // room for the offset shadows
  const wiped = 'inset(-6px -14px 100% -6px)';

  const objects = visible('object');
  const texts = () => visible('text').filter((el) => !objects.some((o) => o.contains(el)));
  const name = document.querySelector('[data-morph-name]');
  const split = name ? splitLetters(name) : { letters: [], restore() {} };
  const { letters } = split;
  const radii = objects.map((el) => getComputedStyle(el).borderRadius);

  const from = token('--paper');
  const [to] = peek(toPixel ? 'pixel' : 'ink', ['--paper']);
  const tone = (step: number) => `color-mix(in srgb, ${to} ${step * 25}%, ${from})`;
  const lineFrom = thread.length();

  const leaving = texts();
  const outs: Animation[] = [
    // the back-space runs up to the swap, so the first letter is still there when the retype starts: never an empty hero
    ...[...letters].reverse().map((l, i) =>
      play(l, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 40,
        delay: i * stagger(letters.length, SWAP, 20),
        easing: 'steps(1, end)',
      }),
    ),
    ...leaving.map((el, i) =>
      play(el, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 120,
        delay: 60 + i * stagger(leaving.length, 60, 20),
        easing: outEase,
      }),
    ),
  ];
  objects.forEach((el, i) => {
    if (toPixel)
      outs.push(
        play(el, [{ borderRadius: radii[i] }, { borderRadius: '0px' }], {
          duration: 150,
          easing: 'steps(3, end)',
        }),
      );
    outs.push(
      play(el, [{ clipPath: shown }, { clipPath: wiped }], {
        duration: 100,
        delay: 120 + i * stagger(objects.length, 20, 8),
        easing: outEase,
      }),
    );
  });

  const ins: Animation[] = [];
  function enter(): void {
    for (const a of outs) a.cancel();
    swap();
    thread.setDrawn(0);
    letters.forEach((l, i) => {
      if (i === 0) return; // the first letter is typed at the swap itself, so the hero is never empty
      const delay = i * stagger(letters.length, 380, 26);
      ins.push(
        play(
          l,
          [{ opacity: 0 }, { opacity: 1 }],
          toPixel
            ? { duration: 30, delay, easing: 'steps(1, start)' }
            : { duration: 140, delay, easing: 'ease-out' },
        ),
      );
    });
    objects.forEach((el, i) => {
      const delay = i * stagger(objects.length, 240, 50);
      ins.push(
        play(el, [{ clipPath: wiped }, { clipPath: shown }], { duration: 240, delay, easing: inEase }),
      );
      if (!toPixel) {
        const radius = getComputedStyle(el).borderRadius;
        ins.push(
          play(el, [{ borderRadius: '0px' }, { borderRadius: radius }], {
            duration: 200,
            delay: delay + 200,
            easing: 'steps(3, end)',
          }),
        );
      }
    });
    // picked again: some text only exists in the new skin
    const arriving = texts();
    arriving.forEach((el, i) => {
      ins.push(
        play(el, [{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          delay: 20 + i * stagger(arriving.length, 280, 30),
          easing: inEase,
        }),
      );
    });
  }

  // one way out, ended or thrown, so the name, the page colour and the line are always handed back
  const finish = () => {
    for (const a of [...outs, ...ins]) a.cancel();
    split.restore();
    document.body.style.backgroundColor = '';
    thread.setDrawn(Number.POSITIVE_INFINITY);
  };

  return new Promise((resolve, reject) => {
    let t0 = 0;
    let swapped = false;
    let lineTo = 0;
    // a throw in here (a skin subscriber, say) would otherwise be lost in rAF and never settle the promise
    const frame = (now: number) => {
      try {
        t0 ||= now;
        const t = now - t0;
        document.body.style.backgroundColor = tone(toneStep(t));
        if (!swapped && t < SWAP) {
          thread.setDrawn(pullBack(lineFrom, t));
        } else if (!swapped) {
          swapped = true;
          enter();
          lineTo = thread.length();
        } else {
          thread.setDrawn(redraw(lineTo, t, toPixel));
        }
        if (t < END) {
          requestAnimationFrame(frame);
          return;
        }
        finish();
        // the name is plain text again, which can nudge the full stop; rebuild skips itself when nothing moved
        thread.rebuild();
        resolve();
      } catch (err) {
        finish();
        reject(err);
      }
    };
    requestAnimationFrame(frame);
  });
}
