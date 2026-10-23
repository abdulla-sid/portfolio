// Fails the build if what a visitor downloads before the map loads is too heavy. Follows each entry script's static
// imports, so shared chunks count; dynamic import() targets (the map) are left out on purpose.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET = { js: 30_000, css: 16_000 }; // gzip bytes
const html = readFileSync('dist/index.html', 'utf8');
const gz = (file) => gzipSync(readFileSync(file)).length;

const entries = [...html.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.(?:js|css))"/g)].map((m) =>
  join('dist', m[1]),
);
const staticImport = /(?:import|from)\s*["'](\.{1,2}\/[^"']+\.js)["']/g;

const seen = new Set();
function walk(file) {
  if (seen.has(file) || !existsSync(file)) return;
  seen.add(file);
  if (!file.endsWith('.js')) return;
  for (const [, rel] of readFileSync(file, 'utf8').matchAll(staticImport))
    walk(normalize(join(dirname(file), rel)));
}
entries.forEach(walk);

const files = [...seen];
const totals = {
  js: files.filter((f) => f.endsWith('.js')).reduce((n, f) => n + gz(f), 0),
  css: files.filter((f) => f.endsWith('.css')).reduce((n, f) => n + gz(f), 0),
};

console.log(
  `first load (gzip): html ${gzipSync(html).length} B, js ${totals.js} B in ${files.length} files, css ${totals.css} B`,
);
for (const [kind, max] of Object.entries(BUDGET)) {
  if (totals[kind] > max) {
    console.error(`${kind} is ${totals[kind]} B gzip, over the ${max} B budget`);
    process.exit(1);
  }
}
