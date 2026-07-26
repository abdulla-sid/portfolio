import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createWindowMachine, type WindowState } from "./windowMachine";

describe("window machine", () => {
  let states: WindowState[];
  let m: ReturnType<typeof createWindowMachine>;

  beforeEach(() => {
    vi.useFakeTimers();
    states = [];
    m = createWindowMachine((s) => states.push(s));
  });
  afterEach(() => vi.useRealTimers());

  it("runs the complete open and close frame sequence", () => {
    m.open();
    expect(m.state()).toEqual({ phase: "opening", frame: "line" });
    vi.advanceTimersByTime(54);
    expect(m.state()).toEqual({ phase: "opening", frame: "f2" });
    vi.advanceTimersByTime(54);
    expect(m.state()).toEqual({ phase: "opening", frame: "f1" });
    vi.advanceTimersByTime(54);
    expect(m.state()).toEqual({ phase: "open", frame: null });
    m.close();
    expect(m.state()).toEqual({ phase: "closing", frame: "f1" });
    vi.advanceTimersByTime(54);
    expect(m.state()).toEqual({ phase: "closing", frame: "f2" });
    vi.advanceTimersByTime(54);
    expect(m.state()).toEqual({ phase: "closing", frame: "line" });
    vi.advanceTimersByTime(54);
    expect(m.state()).toEqual({ phase: "closed", frame: null });
  });

  it("disposal cancels animation callbacks and future input", () => {
    m.open();
    vi.advanceTimersByTime(54);
    const callbackCount = states.length;
    m.dispose();
    m.dispose();
    m.open();
    m.close();
    vi.runAllTimers();
    expect(states).toHaveLength(callbackCount);
  });
});
