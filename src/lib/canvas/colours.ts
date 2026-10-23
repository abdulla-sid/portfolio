import { token } from '../skin';
import type { LcdColours } from './paint';

/** The LCD shades for the current skin, from tokens.css. Read again after every skin change. */
export const lcdColours = (): LcdColours => ({
  bg: token('--lcd-bg'),
  ghost: token('--lcd-ghost'),
  dim: token('--lcd-dim'),
  mid: token('--lcd-mid'),
  fg: token('--lcd-fg'),
  accent: token('--lcd-accent'),
});
