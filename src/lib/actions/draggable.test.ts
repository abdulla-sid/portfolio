import { describe, expect, it, vi } from "vitest";
import { draggable, unanchor } from "./draggable";

describe("unanchor", () => {
  it("pins left/top to the rendered rect and clears centring margins", () => {
    const el = document.createElement("div");

    el.style.left = "50%";
    el.style.top = "50%";
    el.style.marginLeft = "-651px";
    el.style.marginTop = "-363px";
    el.style.transform = "translate(-50%, -50%)";
    el.getBoundingClientRect = () => ({
      left: 69,
      top: 18,
      width: 1302,
      height: 726,
      right: 1371,
      bottom: 744,
      x: 69,
      y: 18,
      toJSON: () => {},
    });

    unanchor(el);

    expect(el.style.left).toBe("69px");
    expect(el.style.top).toBe("18px");
    expect(el.style.marginLeft).toBe("0px");
    expect(el.style.marginTop).toBe("0px");
    expect(el.style.right).toBe("auto");
    expect(el.style.bottom).toBe("auto");
    expect(el.style.transform).toBe("none");
  });
});

describe("draggable skip list", () => {
  function mount(childTag: string) {
    const widget = document.createElement("div");
    const child = document.createElement(childTag);
    widget.appendChild(child);
    document.body.appendChild(widget);
    widget.setPointerCapture = vi.fn();
    draggable(widget, undefined);
    return { widget, child, capture: widget.setPointerCapture };
  }

  function press(target: Element) {
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
      } as PointerEventInit),
    );
  }

  it("does not steal pointer input from form controls", () => {
    for (const tag of ["textarea", "select", "input", "button"]) {
      const { child, capture } = mount(tag);
      press(child);
      expect(capture).not.toHaveBeenCalled();
    }
  });

  it("still starts a drag from plain widget chrome", () => {
    const { widget, capture } = mount("span");
    press(widget);
    expect(capture).toHaveBeenCalled();
  });

  it("destroy during a drag releases capture and restores cursor", () => {
    const widget = document.createElement("div");
    widget.setPointerCapture = vi.fn();
    widget.hasPointerCapture = vi.fn(() => true);
    widget.releasePointerCapture = vi.fn();
    const action = draggable(widget, undefined);
    press(widget);
    expect(widget.style.cursor).toBe("grabbing");
    action?.destroy?.();
    expect(widget.releasePointerCapture).toHaveBeenCalled();
    expect(widget.style.cursor).toBe("");
  });
});
