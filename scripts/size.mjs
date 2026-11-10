// Size budget for the drop-in script. Run after `npm run build`: `node scripts/size.mjs`.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = { min: 104 * 1024, gzip: 33 * 1024 };
const file = new URL('../dist/pixelspec.global.js', import.meta.url);
const buf = readFileSync(file);
const gz = gzipSync(buf, { level: 9 }).length;
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`pixelspec.global.js: ${kb(buf.length)} min (budget ${kb(BUDGET.min)}), ${kb(gz)} gzip (budget ${kb(BUDGET.gzip)})`);
if (buf.length > BUDGET.min || gz > BUDGET.gzip) {
  console.error('Over the size budget.');
  process.exit(1);
}
