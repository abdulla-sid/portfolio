/**
 * Where the thread meets things. The page line (lib/thread) and the map's own line (lib/map) must agree on these,
 * so they live here once.
 */
export const LINE = {
  /** Fractions of the map's height where the line enters and leaves it. */
  mapEntry: 0.22,
  mapExit: 0.86,
  /** The line is drawn down to this fraction of the viewport height as you scroll. */
  reveal: 0.78,
  /** Where the line leaves the device: px in from its left edge, px below its bottom. */
  deviceOutInset: 28,
  deviceOutDrop: 18,
} as const;

/** Phone layout up to and including this width, in CSS px: the CSS's `max-width: 700px` breakpoint. */
export const PHONE_MAX = 700;

/** The same test as the CSS phone breakpoint, so JS and CSS agree at exactly PHONE_MAX. */
export const PHONE_QUERY = `(max-width: ${PHONE_MAX}px)`;
