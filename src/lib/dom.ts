/** The element with this id, or a clear error if the markup changed. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from the page`);
  return el as T;
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/** An element's (or a range's) box relative to another element (the page column), in CSS pixels. */
export function boxIn(el: Element | Range, origin: Element): Box {
  const o = origin.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    left: r.left - o.left,
    right: r.right - o.left,
    top: r.top - o.top,
    bottom: r.bottom - o.top,
    width: r.width,
    height: r.height,
  };
}
