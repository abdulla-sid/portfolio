import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createMenuMachine, type MenuState } from "./machine";

describe("menu machine", () => {
  let states: (MenuState | null)[];
  let m: ReturnType<typeof createMenuMachine>;

  beforeEach(() => {
    vi.useFakeTimers();
    states = [];
    m = createMenuMachine(3, (s) => states.push(s));
  });
  afterEach(() => vi.useRealTimers());

  it("plays line → flash → selected at 60ms steps", () => {
    m.activate(0);
    expect(m.state()).toEqual({ index: 0, phase: "line" });
    vi.advanceTimersByTime(60);
    expect(m.state()).toEqual({ index: 0, phase: "flash" });
    vi.advanceTimersByTime(60);
    expect(m.state()).toEqual({ index: 0, phase: "selected" });
  });

  it("restarts cleanly under rapid input — no double-lit items", () => {
    m.activate(0);
    vi.advanceTimersByTime(60);
    m.activate(1);
    vi.advanceTimersByTime(120);
    expect(m.state()).toEqual({ index: 1, phase: "selected" });

    expect(
      states.filter((s) => s?.index === 0 && s?.phase === "selected"),
    ).toHaveLength(0);
  });

  it("escape from selected plays the reverse sequence then sleeps", () => {
    m.activate(2);
    vi.advanceTimersByTime(120);
    m.escape();
    expect(m.state()).toEqual({ index: 2, phase: "flash" });
    vi.advanceTimersByTime(60);
    expect(m.state()).toEqual({ index: 2, phase: "line" });
    vi.advanceTimersByTime(60);
    expect(m.state()).toBeNull();
  });

  it("disposal cancels animation callbacks and future input", () => {
    m.activate(0);
    vi.advanceTimersByTime(60);
    const callbackCount = states.length;
    m.dispose();
    m.dispose();
    m.activate(1);
    m.escape();
    vi.runAllTimers();
    expect(states).toHaveLength(callbackCount);
  });
});
