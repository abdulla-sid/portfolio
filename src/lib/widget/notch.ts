export interface NotchedTab {
  viewBox: string;
  width: number;
  height: number;
  edge: string;
  face: string;
}

export interface SteppedCorner {
  viewBox: string;
  width: number;
  height: number;
  path: string;
}

const DIAGONAL_STROKE = 1;

export function notchedTab(
  steps: number,
  width: number,
  diagonalInset = 0,
): NotchedTab {
  const edge = [`M${diagonalInset} 0`];
  const face = [`M${diagonalInset + DIAGONAL_STROKE} 0`];

  for (let i = 1; i <= steps; i += 1) edge.push(`V${i} H${diagonalInset + i}`);
  for (let i = 1; i <= steps - DIAGONAL_STROKE; i += 1)
    face.push(`V${i} H${diagonalInset + i + DIAGONAL_STROKE}`);

  edge.push(`H${width} V0 Z`);
  face.push(`H${width - DIAGONAL_STROKE} V0 Z`);

  return {
    viewBox: `0 0 ${width} ${steps}`,
    width,
    height: steps,
    edge: edge.join(" "),
    face: face.join(" "),
  };
}

export function steppedCorner(
  width: number,
  height: number,
  steps: number,
): SteppedCorner {
  const path = [`M0 0`, `H${width}`, `V${height - steps}`];

  for (let i = 1; i <= steps; i += 1)
    path.push(`H${width - i}`, `V${height - steps + i}`);

  path.push("H0", "Z");

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    path: path.join(" "),
  };
}
