#!/usr/bin/env node
// astequiv.cjs <old.js> <new.js> [--names] [--ids]
//
// Parse both files with acorn (webpack ships it), drop positions, and compare
// the ASTs. Prints EQUIVALENT, or the first differing AST paths. Redundant
// parentheses and whitespace do not survive parsing, so a pure minifier
// reformat compares equal. With --names, identifier names are also ignored
// (compare structure only), which isolates terser's identifier reallocation.
// Pair with behaviors.cjs: this proves "same program", that proves "same
// Drupal.behaviors". (Described in W6-D9's STATE; rebuilt here at hop 14.)
// With --ids (hop 19), numeric literals may differ if the differences form one
// consistent one-to-one renumbering across the file (webpack module/chunk IDs);
// the mapping is printed so it can be checked by eye.
const fs = require('fs');
const path = require('path');
const acorn = require(require.resolve('acorn', { paths: [path.resolve('node_modules/webpack')] }));
const [a, b, ...flags] = process.argv.slice(2);
const names = flags.includes('--names');
const ids = flags.includes('--ids');
const fwd = new Map(), rev = new Map();
const parse = f => acorn.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
const SKIP = new Set(['start', 'end', 'loc', 'range', 'raw']);
const diffs = [];
function walk(x, y, p) {
  if (diffs.length >= 8) return;
  if (typeof x !== typeof y || Array.isArray(x) !== Array.isArray(y)) { diffs.push(`${p}: ${typeof x} vs ${typeof y}`); return; }
  if (x === null || y === null || typeof x !== 'object') { if (x !== y) diffs.push(`${p}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`); return; }
  if (ids && x.type === 'Literal' && y.type === 'Literal' && typeof x.value === 'number' && typeof y.value === 'number' && x.value !== y.value) {
    if ((fwd.has(x.value) && fwd.get(x.value) !== y.value) || (rev.has(y.value) && rev.get(y.value) !== x.value)) diffs.push(`${p}: ${x.value} vs ${y.value} (inconsistent renumbering)`);
    fwd.set(x.value, y.value); rev.set(y.value, x.value); return;
  }
  if (ids && x.type === 'Property' && y.type === 'Property' && x.key?.type === 'Literal' && y.key?.type === 'Literal') {
    walk(x.key, y.key, `${p}.key`); walk(x.value, y.value, `${p}.value`); return;
  }
  if (Array.isArray(x)) {
    if (x.length !== y.length) { diffs.push(`${p}: length ${x.length} vs ${y.length}`); return; }
    x.forEach((v, i) => walk(v, y[i], `${p}[${i}]`));
    return;
  }
  const keys = new Set([...Object.keys(x), ...Object.keys(y)].filter(k => !SKIP.has(k)));
  if (names && x.type === 'Identifier' && y.type === 'Identifier') return;
  for (const k of keys) walk(x[k], y[k], `${p}.${k}${k === 'type' ? '' : ''}`);
}
walk(parse(a), parse(b), '$');
const how = [names && 'identifier names', ids && `a consistent renumbering of ${fwd.size} numeric literal(s)`].filter(Boolean).join(', ');
const suffix = how ? ` (ignoring ${how})` : '';
if (ids && fwd.size) console.log(`  renumbered: ${[...fwd].map(([o, n]) => `${o}->${n}`).join(' ')}`.slice(0, 400));
if (!diffs.length) { console.log(`astequiv: EQUIVALENT${suffix}`); process.exit(0); }
console.log(`astequiv: DIFFERENT${suffix}`);
for (const d of diffs) console.log('  ' + d.slice(0, 220));
process.exit(1);
