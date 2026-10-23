import { describe, expect, it } from 'vitest';
import { tabAfterKey } from './keys';

describe('tabAfterKey', () => {
  it('wraps arrows around both ends', () => {
    expect(tabAfterKey('ArrowRight', 4, 5)).toBe(0);
    expect(tabAfterKey('ArrowLeft', 0, 5)).toBe(4);
    expect(tabAfterKey('ArrowRight', 1, 5)).toBe(2);
  });

  it('jumps to the ends with Home and End', () => {
    expect(tabAfterKey('Home', 3, 5)).toBe(0);
    expect(tabAfterKey('End', 0, 5)).toBe(4);
  });

  it('ignores other keys', () => {
    expect(tabAfterKey('Enter', 2, 5)).toBeNull();
  });
});
