export interface NotchedTab {
  viewBox: string;
  width: number;
  height: number;
  edge: string;
  face: string;
}

const DIAGONAL_STROKE = 2;

export function notchedTab(steps: number, width: number): NotchedTab {
  const edge = ["M0 0"];
  const face = [`M${DIAGONAL_STROKE} 0`];

  for (let i = 1; i <= steps; i += 1) edge.push(`V${i} H${i}`);
  for (let i = 1; i < steps; i += 1) face.push(`V${i} H${i + DIAGONAL_STROKE}`);

  edge.push(`H${width} V0 Z`);
  face.push(`H${width - 1} V0 Z`);

  return {
    viewBox: `0 0 ${width} ${steps}`,
    width,
    height: steps,
    edge: edge.join(" "),
    face: face.join(" "),
  };
}
