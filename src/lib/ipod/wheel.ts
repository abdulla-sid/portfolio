/** The signed angle from a to b, wrapped into -PI..PI. */
export function angleDelta(a: number, b: number): number {
  const d = b - a;
  return d - Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
}

/** True when (x, y), relative to the wheel's centre, is on the ring (not the centre button, not outside). */
export const onRing = (x: number, y: number, radius: number): boolean => {
  const d = Math.hypot(x, y) / radius;
  return d > 0.4 && d < 1.02;
};

/** True when a move (dx, dy) from (x, y) runs more along the circle than towards or away from its centre. */
export const alongRing = (x: number, y: number, dx: number, dy: number): boolean =>
  Math.abs(x * dy - y * dx) > 0.6 * Math.hypot(x, y) * Math.hypot(dx, dy);

const DECIDE = 12; // px a touch on the ring travels before it is judged a spin or a page scroll
const TURN = Math.PI / 6; // how far round the centre an upright move on the ring's side turns before it is a spin
const DRIFT = 0.1; // how far (of its radius) it may drift from the centre meanwhile; a straight flick drifts first

/**
 * Whether a touch that started at (x, y) on the ring and has moved (dx, dy) is a spin; null while undecided. A move
 * across the ring is a scroll and a sideways one along it a spin, once it has gone DECIDE px. On the ring's left and
 * right edges the ring runs upright, like a page scroll, so there it waits: a circle turns about the centre at a
 * steady distance, while a straight flick drifts away from it.
 */
export function touchSpins(x: number, y: number, dx: number, dy: number): boolean | null {
  if (Math.hypot(dx, dy) < DECIDE) return null;
  if (!alongRing(x, y, dx, dy)) return false;
  if (Math.abs(dy) < 2.5 * Math.abs(dx)) return true;
  const r0 = Math.hypot(x, y);
  if (Math.abs(Math.hypot(x + dx, y + dy) - r0) > DRIFT * r0) return false;
  return Math.abs(angleDelta(Math.atan2(y, x), Math.atan2(y + dy, x + dx))) >= TURN ? true : null;
}

const STEP = Math.PI / 8; // one list step per 22.5 degrees, like the real wheel's clicks
const DEADZONE = 0.3; // radians of travel before a press becomes a spin

/**
 * Makes `wheel` a click wheel: dragging round it calls `spin(+1)` per clockwise step and `spin(-1)` per
 * anticlockwise one. A spin that ends on a button does not press it. On touch, only a drag that starts on the
 * ring and passes touchSpins is taken; anything else scrolls the page as usual.
 */
export function clickWheel(wheel: HTMLElement, spin: (step: 1 | -1) => void): void {
  const local = (e: { clientX: number; clientY: number }) => {
    const r = wheel.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2, radius: r.width / 2 };
  };
  let drag: { a: number; acc: number } | null = null;
  let spun = false;

  wheel.addEventListener('pointerdown', (e) => {
    const { x, y, radius } = local(e);
    drag = e.pointerType === 'touch' && !onRing(x, y, radius) ? null : { a: Math.atan2(y, x), acc: 0 };
    spun = false;
  });
  wheel.addEventListener('pointermove', (e) => {
    // an undecided touch keeps its start angle, so a spin it turns into counts from where the finger went down
    if (!drag || (e.pointerType === 'touch' && !touch?.along)) return;
    const { x, y } = local(e);
    const a = Math.atan2(y, x);
    drag.acc += angleDelta(drag.a, a);
    drag.a = a;
    if (!spun && Math.abs(drag.acc) > DEADZONE) {
      spun = true;
      wheel.setPointerCapture(e.pointerId);
    }
    while (spun && Math.abs(drag.acc) >= STEP) {
      const s = drag.acc > 0 ? 1 : -1;
      drag.acc -= s * STEP;
      spin(s);
    }
  });
  const end = () => {
    drag = null;
    // the click that follows pointerup still needs to see `spun`
    setTimeout(() => {
      spun = false;
    });
  };
  wheel.addEventListener('pointerup', end);
  wheel.addEventListener('pointercancel', end);
  wheel.addEventListener(
    'click',
    (e) => {
      if (spun) e.stopPropagation();
    },
    true,
  );

  // Touch: pointer events cannot stop the page scrolling once it starts, so touchmove holds the page still
  // until touchSpins decides, then either keeps holding it (a spin) or lets it go (a scroll).
  let touch: { x: number; y: number; along: boolean | null } | null = null;
  wheel.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      const p = t && local(t);
      touch =
        p && e.touches.length === 1 && onRing(p.x, p.y, p.radius) ? { x: p.x, y: p.y, along: null } : null;
    },
    { passive: true },
  );
  wheel.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0];
      if (!touch || !t) return;
      // re-judged on every move until decided; the page stays still meanwhile
      if (touch.along === null) {
        const p = local(t);
        touch.along = touchSpins(touch.x, touch.y, p.x - touch.x, p.y - touch.y);
      }
      if (touch.along === false) drag = null;
      else e.preventDefault();
    },
    { passive: false },
  );
}
