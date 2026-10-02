#!/usr/bin/env node
// modtable.cjs <old.js> <new.js>
//
// For webpack bundles whose module table was reordered (module IDs renumbered,
// so the table sorts differently) or whose mangled export names changed
// (webpack 5.98: `Z` -> `A`). Tokenises both files with acorn, masks
// identifier and number tokens (strings, regexps, keywords and punctuation are
// kept), then compares:
//   1. the module-table entries as a multiset (each entry's masked token text);
//   2. everything outside the module table, in order.
// Equal means: the same modules, with the same code and string contents, up to
// identifier names and numeric IDs. Pair with astequiv --ids (which checks the
// renumbering is consistent where the order did not change) and behaviors.cjs.
// Added at hop 19.
const fs = require('fs');
const path = require('path');
const acorn = require(require.resolve('acorn', { paths: [path.resolve('node_modules/webpack')] }));
const opts = { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true };
function load(f) {
  const src = fs.readFileSync(f, 'utf8');
  const ast = acorn.parse(src, opts);
  // The module table: the largest object literal whose keys are all numeric
  // literals and whose values are functions.
  let table = null;
  (function find(n) {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'ObjectExpression' && n.properties.length && n.properties.every(p => p.key && p.key.type === 'Literal' && typeof p.key.value === 'number' && /Function/.test(p.value.type))) {
      if (!table || n.properties.length > table.properties.length) table = n;
    }
    for (const k of Object.keys(n)) if (k !== 'loc') { const v = n[k]; Array.isArray(v) ? v.forEach(find) : find(v); }
  })(ast);
  const mask = (s, e) => {
    const out = [];
    for (const t of acorn.tokenizer(src.slice(s, e), opts)) {
      const ty = t.type.label;
      out.push(ty === 'name' ? 'x' : ty === 'num' ? 'N' : ty === 'string' || ty === 'template' || ty === 'regexp' ? JSON.stringify(t.value) : t.type.keyword || ty);
    }
    return out.join(' ');
  };
  if (!table) return { entries: [], rest: mask(0, src.length) };
  const entries = table.properties.map(p => mask(p.value.start, p.value.end)).sort();
  const rest = mask(0, table.start) + ' <TABLE> ' + mask(table.end, src.length);
  return { entries, rest, n: table.properties.length };
}
const [a, b] = process.argv.slice(2);
const A = load(a), B = load(b);
const probs = [];
if (A.entries.length !== B.entries.length) probs.push(`module count ${A.entries.length} vs ${B.entries.length}`);
else A.entries.forEach((e, i) => { if (e !== B.entries[i]) probs.push(`module entry differs (sorted position ${i})`); });
if (A.rest !== B.rest) probs.push('code outside the module table differs');
console.log(`modtable ${path.basename(b)}: ${A.entries.length} modules; ${probs.length ? probs.slice(0, 5).join('; ') : 'EQUIVALENT (up to names, numeric IDs and module order)'}`);
process.exit(probs.length ? 1 : 0);
