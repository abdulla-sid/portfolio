export type WindowFrame = "f1" | "f2" | "line";
export type WindowPhase = "closed" | "opening" | "open" | "closing";
export interface WindowState {
  phase: WindowPhase;
  frame: WindowFrame | null;
}

const STEP_MS = 54;

export function createWindowMachine(
  onChange: (s: WindowState) => void,
  stepMs: number = STEP_MS,
) {
  let state: WindowState = { phase: "closed", frame: null };
  let timers: ReturnType<typeof setTimeout>[] = [];
  let disposed = false;

  const set = (s: WindowState) => {
    if (disposed) return;
    state = s;
    onChange(s);
  };
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const at = (n: number, s: WindowState) => {
    timers.push(setTimeout(() => set(s), stepMs * n));
  };

  function open() {
    if (disposed) return;
    if (state.phase !== "closed") return;
    clearTimers();
    set({ phase: "opening", frame: "line" });
    at(1, { phase: "opening", frame: "f2" });
    at(2, { phase: "opening", frame: "f1" });
    at(3, { phase: "open", frame: null });
  }

  function close() {
    if (disposed) return;
    if (state.phase !== "open") return;
    clearTimers();
    set({ phase: "closing", frame: "f1" });
    at(1, { phase: "closing", frame: "f2" });
    at(2, { phase: "closing", frame: "line" });
    at(3, { phase: "closed", frame: null });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimers();
  }

  return { open, close, state: () => state, dispose };
}
