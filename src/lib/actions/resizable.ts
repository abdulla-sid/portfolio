import type { Action } from "svelte/action";
import { unanchor } from "./draggable";

export function resizeScale(target: number, min: number, fit: number): number {
  return Math.max(min, Math.min(target, fit));
}

export const resizable: Action<
  HTMLElement,
  { widget: HTMLElement; min?: number }
> = (grip, params) => {
  const { widget, min = 1 } = params;
  let resizing = false;
  let endResize: ((complete: boolean) => void) | undefined;

  function onPointerDown(e: PointerEvent) {
    if (resizing || !e.isPrimary) return;
    e.preventDefault();
    e.stopPropagation();
    unanchor(widget);
    grip.setPointerCapture(e.pointerId);
    resizing = true;

    const scale0 = parseFloat(widget.style.getPropertyValue("--w-scale")) || 1;
    const rect = widget.getBoundingClientRect();
    const baseW = rect.width / scale0;
    const baseH = rect.height / scale0;

    const move = (ev: PointerEvent) => {
      const target = (ev.clientX - rect.left) / baseW;
      const fit = Math.min(
        (window.innerWidth - rect.left) / baseW,
        (window.innerHeight - rect.top) / baseH,
      );
      widget.style.setProperty(
        "--w-scale",
        String(resizeScale(target, min, fit)),
      );
    };
    const finish = (complete: boolean) => {
      if (!resizing) return;
      resizing = false;
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", up);
      grip.removeEventListener("pointercancel", up);
      grip.removeEventListener("lostpointercapture", up);
      if (grip.hasPointerCapture?.(e.pointerId)) {
        grip.releasePointerCapture(e.pointerId);
      }
      endResize = undefined;
      if (complete) widget.dispatchEvent(new CustomEvent("widgetresized"));
    };
    const up = () => finish(true);
    endResize = finish;
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
    grip.addEventListener("pointercancel", up);
    grip.addEventListener("lostpointercapture", up);
  }

  grip.addEventListener("pointerdown", onPointerDown);
  return {
    destroy() {
      endResize?.(false);
      grip.removeEventListener("pointerdown", onPointerDown);
    },
  };
};
