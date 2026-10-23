import { describe, expect, it, vi } from 'vitest';
import { createStore } from './store';

describe('createStore', () => {
  it('merges patches and passes next and previous state to listeners', () => {
    const store = createStore({ a: 1, b: 'x' });
    const fn = vi.fn();
    store.subscribe(fn);
    store.set({ a: 2 });
    expect(store.get()).toEqual({ a: 2, b: 'x' });
    expect(fn).toHaveBeenCalledWith({ a: 2, b: 'x' }, { a: 1, b: 'x' });
  });

  it('stops notifying after unsubscribe', () => {
    const store = createStore({ a: 1 });
    const fn = vi.fn();
    store.subscribe(fn)();
    store.set({ a: 2 });
    expect(fn).not.toHaveBeenCalled();
  });
});
