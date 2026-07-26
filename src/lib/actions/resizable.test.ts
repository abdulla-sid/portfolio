import { describe, expect, it, vi } from "vitest";
import { resizable, resizeScale } from "./resizable";

describe("resizeScale", () => {
  it("clamps scale to the authored floor and viewport ceiling", () => {
    expect(resizeScale(1.5, 1, 3)).toBe(1.5);
    expect(resizeScale(0.4, 1, 3)).toBe(1);
    expect(resizeScale(5, 1, 2.2)).toBe(2.2);
    expect(resizeScale(0.8, 1, 0.6)).toBe(1);
  });

  it("destroy during resize releases capture without completing", () => {
    const grip = document.createElement("button");
    const widget = document.createElement("div");
    grip.setPointerCapture = vi.fn();
    grip.hasPointerCapture = vi.fn(() => true);
    grip.releasePointerCapture = vi.fn();
    const completed = vi.fn();
    widget.addEventListener("widgetresized", completed);
    const action = resizable(grip, { widget });
    grip.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
      } as PointerEventInit),
    );
    action?.destroy?.();
    expect(grip.releasePointerCapture).toHaveBeenCalled();
    expect(completed).not.toHaveBeenCalled();
  });

  it("completes an active resize at most once across end events", () => {
    const grip = document.createElement("button");
    const widget = document.createElement("div");
    grip.setPointerCapture = vi.fn();
    grip.hasPointerCapture = vi.fn(() => false);
    const completed = vi.fn();
    widget.addEventListener("widgetresized", completed);
    resizable(grip, { widget });
    grip.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
      } as PointerEventInit),
    );
    grip.dispatchEvent(new PointerEvent("pointerup"));
    grip.dispatchEvent(new PointerEvent("lostpointercapture"));
    expect(completed).toHaveBeenCalledTimes(1);
  });
});
