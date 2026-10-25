/** The y of the baseline of el's line: an empty inline-block's top sits on it. */
function baselineOf(el: Element): number {
  const probe = document.createElement('i');
  probe.style.cssText = 'display:inline-block;width:0;height:0';
  el.append(probe);
  const y = probe.getBoundingClientRect().top;
  probe.remove();
  return y;
}

/**
 * Calls fn for each letter of el with its left edge and baseline, relative to (ox, oy), its index in the name, and
 * the element it sits in (whose style it takes: ink's surname is italic).
 */
export function eachLetter(
  el: HTMLElement,
  ox: number,
  oy: number,
  fn: (ch: string, x: number, base: number, i: number, holder: Element) => void,
): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let i = 0;
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    const holder = text.parentElement ?? el;
    const base = baselineOf(holder) - oy;
    [...text.data].forEach((ch, k) => {
      range.setStart(text, k);
      range.setEnd(text, k + 1);
      fn(ch, range.getBoundingClientRect().left - ox, base, i++, holder);
    });
  }
}
