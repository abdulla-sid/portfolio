import { describe, expect, it } from "vitest";
import { createWindowManager } from "./windows.svelte";

describe("window manager", () => {
  it("stacks, raises, and compacts live windows", () => {
    const wm = createWindowManager();
    wm.register("a");
    wm.register("b");
    expect(wm.zIndexOf("b")).toBeGreaterThan(wm.zIndexOf("a"));
    wm.register("c");
    wm.bringToFront("a");
    expect(wm.zIndexOf("a")).toBeGreaterThan(wm.zIndexOf("b"));
    expect(wm.zIndexOf("a")).toBeGreaterThan(wm.zIndexOf("c"));
    wm.unregister("b");
    expect(wm.zIndexOf("b")).toBe(0);
    expect(wm.zIndexOf("c")).toBe(2);
    expect(wm.zIndexOf("a")).toBe(3);
  });

  it("rejects duplicate live registrations", () => {
    const wm = createWindowManager();
    wm.register("about");
    expect(() => wm.register("about")).toThrow("Window already registered");
  });
});
