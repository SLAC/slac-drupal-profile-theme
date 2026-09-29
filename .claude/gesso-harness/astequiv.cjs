#!/usr/bin/env node
// astequiv.cjs <old.js> <new.js> [--names]
//
// Parse both files with acorn (webpack ships it), drop positions, and compare
// the ASTs. Prints EQUIVALENT, or the first differing AST paths. Redundant
// parentheses and whitespace do not survive parsing, so a pure minifier
// reformat compares equal. With --names, identifier names are also ignored
// (compare structure only), which isolates terser's identifier reallocation.
// Pair with behaviors.cjs: this proves "same program", that proves "same
// Drupal.behaviors". (Described in W6-D9's STATE; rebuilt here at hop 14.)
const fs = require('fs');
const path = require('path');
const acorn = require(require.resolve('acorn', { paths: [path.resolve('node_modules/webpack')] }));
const [a, b, flag] = process.argv.slice(2);
const names = flag === '--names';
const parse = f => acorn.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
const SKIP = new Set(['start', 'end', 'loc', 'range', 'raw']);
const diffs = [];
function walk(x, y, p) {
  if (diffs.length >= 8) return;
  if (typeof x !== typeof y || Array.isArray(x) !== Array.isArray(y)) { diffs.push(`${p}: ${typeof x} vs ${typeof y}`); return; }
  if (x === null || typeof x !== 'object') { if (x !== y) diffs.push(`${p}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`); return; }
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
if (!diffs.length) { console.log(`astequiv: EQUIVALENT${names ? ' (ignoring identifier names)' : ''}`); process.exit(0); }
console.log(`astequiv: DIFFERENT${names ? ' (ignoring identifier names)' : ''}`);
for (const d of diffs) console.log('  ' + d.slice(0, 220));
process.exit(1);
