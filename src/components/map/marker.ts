const ART_UNIT_PX = 2;

const SPRITE = [
  "......M...M......",
  "....MMM...MMM....",
  "..MMMM.....MMMM..",
  "..MM.........MM..",
  ".MM...........MM.",
  ".MM...........MM.",
  "MM.............MM",
  ".......MMM.......",
  ".......MMM.......",
  ".......MMM.......",
  "MM.............MM",
  ".MM...........MM.",
  ".MM...........MM.",
  "..MM.........MM..",
  "..MMMM.....MMMM..",
  "....MMM...MMM....",
  "......M...M......",
];

function rowRuns(row: string, y: number): string[] {
  const runs: string[] = [];
  let x = 0;

  while (x < row.length) {
    if (row[x] !== "M") {
      x += 1;
      continue;
    }
    const start = x;
    while (row[x] === "M") x += 1;
    const width = x - start;
    runs.push(`M${start} ${y}h${width}v1h-${width}z`);
  }

  return runs;
}

const COLUMNS = SPRITE[0].length;
const ROWS = SPRITE.length;

export const MARKER_VIEWBOX = `0 0 ${COLUMNS} ${ROWS}`;
export const MARKER_WIDTH_PX = COLUMNS * ART_UNIT_PX;
export const MARKER_HEIGHT_PX = ROWS * ART_UNIT_PX;
export const MARKER_PATH = SPRITE.flatMap(rowRuns).join("");
