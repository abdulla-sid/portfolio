export const MQ_SPEED = 25;
export const MQ_GAP = 33;

export interface MarqueeOptions {
  text: string;
  animation: string;
  scaleProperty?: string;
}

export function marqueeParams(
  textWidth: number,
  boxWidth: number,
  scale: number,
): { dist: number; steps: number; durationS: number } | null {
  if (textWidth <= boxWidth + 0.5) return null;
  const dist = textWidth + MQ_GAP * scale;
  return {
    dist,
    steps: Math.max(1, Math.round(dist / scale)),
    durationS: dist / (MQ_SPEED * scale),
  };
}

export function marquee(node: HTMLElement, options: MarqueeOptions) {
  function apply(next: MarqueeOptions) {
    node.style.animation = "none";
    node.replaceChildren();

    const first = document.createElement("span");
    first.textContent = next.text;
    node.append(first);

    const scale = next.scaleProperty
      ? parseFloat(
          getComputedStyle(node).getPropertyValue(next.scaleProperty),
        ) || 1
      : 1;
    const box = node.parentElement;
    if (!box) return;

    const params = marqueeParams(
      first.getBoundingClientRect().width,
      box.clientWidth,
      scale,
    );
    if (!params) {
      node.style.removeProperty("animation");
      return;
    }

    const duplicate = first.cloneNode(true) as HTMLElement;
    duplicate.setAttribute("aria-hidden", "true");
    node.append(duplicate);
    node.style.setProperty("--mq-dist", `${params.dist}px`);
    node.style.animation = `${next.animation} ${params.durationS}s steps(${params.steps}) infinite`;
  }

  apply(options);
  return { update: apply };
}
