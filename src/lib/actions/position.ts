export function clampToViewport(
  left: number,
  top: number,
  w: number,
  h: number,
  vw: number,
  vh: number,
): { left: number; top: number } {
  const maxLeft = Math.max(0, vw - w);
  const maxTop = Math.max(0, vh - h);
  return {
    left: Math.min(Math.max(left, 0), maxLeft),
    top: Math.min(Math.max(top, 0), maxTop),
  };
}
