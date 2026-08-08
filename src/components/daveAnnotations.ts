export interface Annotation {
  id: string;
  anchorX: number;
  anchorY: number;
  boxY: number;
  boxEdge: number;
  lines: string[][];
}

export const ANNOTATIONS: Annotation[] = [
  {
    id: "core",
    anchorX: 52,
    anchorY: 60,
    boxY: 36,
    boxEdge: -34,
    lines: [
      ["THIS IS DAVE. HE HOLDS VERY STILL"],
      ["THIS IS A SPACE PIRATE FROM THE 24th CENTURY"],
      ["ANIMATION, YOU ASK?", "COMING SOON"],
    ],
  },
  {
    id: "greave",
    anchorX: 60,
    anchorY: 171,
    boxY: 189,
    boxEdge: -5,
    lines: [
      ["I MADE HIM IN ASEPRITE.", "HE'S MY FIRST SPRITE"],
      ["HE'LL STEAL YOUR STUFF IF YOU'RE NOT CAREFUL"],
      ["I'LL MAKE DAVE SOME FRIENDS TOO"],
    ],
  },
];

export const PAIR_COUNT = Math.min(
  ...ANNOTATIONS.map((annotation) => annotation.lines.length),
);

export function rerollPair(current: number): number {
  if (PAIR_COUNT < 2) return 0;
  const step = 1 + Math.floor(Math.random() * (PAIR_COUNT - 1));
  return (current + step) % PAIR_COUNT;
}
