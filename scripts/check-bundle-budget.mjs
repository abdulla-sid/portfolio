import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const ASSET_DIRECTORY = new URL("../dist/assets/", import.meta.url);
const budgets = [
  {
    label: "Initial JavaScript",
    pattern: /^index-[^.]+\.js$/,
    maxBytes: 100_000,
    maxGzipBytes: 40_000,
  },
  {
    label: "Lazy ExperienceMap JavaScript",
    pattern: /^ExperienceMap-[^.]+\.js$/,
    maxBytes: 1_150_000,
    maxGzipBytes: 310_000,
  },
];

const filenames = await readdir(ASSET_DIRECTORY);
const failures = [];
const kilobytes = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;

for (const budget of budgets) {
  const matches = filenames.filter((filename) => budget.pattern.test(filename));

  if (matches.length !== 1) {
    failures.push(
      `${budget.label}: expected one matching chunk, found ${matches.length}`,
    );
    continue;
  }

  const filename = matches[0];
  const content = await readFile(new URL(filename, ASSET_DIRECTORY));
  const bytes = content.byteLength;
  const gzipBytes = gzipSync(content).byteLength;

  process.stdout.write(
    `${budget.label}: ${kilobytes(bytes)} minified, ${kilobytes(gzipBytes)} gzip\n`,
  );

  if (bytes > budget.maxBytes) {
    failures.push(
      `${budget.label}: ${kilobytes(bytes)} exceeds the ${kilobytes(budget.maxBytes)} minified budget`,
    );
  }
  if (gzipBytes > budget.maxGzipBytes) {
    failures.push(
      `${budget.label}: ${kilobytes(gzipBytes)} exceeds the ${kilobytes(budget.maxGzipBytes)} gzip budget`,
    );
  }
}

if (failures.length > 0) {
  throw new Error(`Bundle budget failed:\n${failures.join("\n")}`);
}
