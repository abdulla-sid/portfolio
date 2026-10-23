/** True when the visitor asked the OS for less motion. Read live so a settings change applies without reload. */
export const prefersReducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
