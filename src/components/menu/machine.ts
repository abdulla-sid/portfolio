export type MenuPhase = "line" | "flash" | "selected";
export interface MenuState {
  index: number;
  phase: MenuPhase;
}

const STEP_MS = 60;

export function createMenuMachine(
  itemCount: number,
  onChange: (s: MenuState | null) => void,
  stepMs: number = STEP_MS,
) {
  let state: MenuState | null = null;
  let t1: ReturnType<typeof setTimeout> | undefined;
  let t2: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const set = (s: MenuState | null) => {
    if (disposed) return;
    state = s;
    onChange(s);
  };
  const clearTimers = () => {
    clearTimeout(t1);
    clearTimeout(t2);
    t1 = undefined;
    t2 = undefined;
  };

  function activate(index: number) {
    if (disposed) return;
    clearTimers();
    set({ index, phase: "line" });
    t1 = setTimeout(() => {
      set({ index, phase: "flash" });
      t2 = setTimeout(() => set({ index, phase: "selected" }), stepMs);
    }, stepMs);
  }

  function escape() {
    if (disposed) return;
    if (!state) return;
    clearTimers();
    if (state.phase !== "selected") {
      set(null);
      return;
    }
    const { index } = state;
    set({ index, phase: "flash" });
    t1 = setTimeout(() => {
      set({ index, phase: "line" });
      t2 = setTimeout(() => set(null), stepMs);
    }, stepMs);
  }

  function move(dir: 1 | -1, focusedIndex: number): number {
    if (disposed) return Math.max(focusedIndex, 0);
    const from = Math.max(focusedIndex, state?.index ?? -1);
    const next = (from + dir + itemCount) % itemCount;
    activate(next);
    return next;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimers();
  }

  return { activate, escape, move, state: () => state, dispose };
}
