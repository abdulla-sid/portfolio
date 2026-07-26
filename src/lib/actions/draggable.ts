import type { Action } from "svelte/action";
import { clampToViewport } from "./position";

export function unanchor(el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  el.style.left = `${r.left}px`;
  el.style.top = `${r.top}px`;
  el.style.right = "auto";
  el.style.bottom = "auto";
  el.style.marginLeft = "0";
  el.style.marginTop = "0";
  el.style.transform = "none";
}

const DEFAULT_SKIP = "button, a, input, textarea, select, [data-no-drag]";

export const draggable: Action<HTMLElement, { skip?: string } | undefined> = (
  node,
  options,
) => {
  const skip = options?.skip ?? DEFAULT_SKIP;
  let dragging = false;
  let endDrag: (() => void) | undefined;

  function onPointerDown(e: PointerEvent) {
    if (dragging || !e.isPrimary) return;
    if (skip && (e.target as Element).closest(skip)) return;

    const r = node.getBoundingClientRect();
    unanchor(node);
    e.preventDefault();
    node.setPointerCapture(e.pointerId);
    dragging = true;
    node.style.cursor = "grabbing";
    const grabX = e.clientX - r.left;
    const grabY = e.clientY - r.top;

    const move = (ev: PointerEvent) => {
      const { left, top } = clampToViewport(
        ev.clientX - grabX,
        ev.clientY - grabY,
        node.offsetWidth,
        node.offsetHeight,
        window.innerWidth,
        window.innerHeight,
      );
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      node.style.cursor = "";
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
      node.removeEventListener("lostpointercapture", up);
      if (node.hasPointerCapture?.(e.pointerId)) {
        node.releasePointerCapture(e.pointerId);
      }
      endDrag = undefined;
    };
    endDrag = up;
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
    node.addEventListener("lostpointercapture", up);
  }

  node.addEventListener("pointerdown", onPointerDown);
  return {
    destroy() {
      endDrag?.();
      node.removeEventListener("pointerdown", onPointerDown);
    },
  };
};
