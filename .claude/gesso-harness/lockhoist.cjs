#!/usr/bin/env node
// lockhoist.cjs -- hoist nested lockfile entries that have no top-level copy.
//
// Replacing a major (Storybook 6.5 -> 7) in place can leave the new packages
// nested under their first dependent (the old top-level copy of the same name
// was still there when npm placed them, and npm never re-hoists). Code that
// resolves from the project root -- Storybook's generated preview entry --
// then cannot find them. For every package name with NO top-level entry whose
// nested copies all share one version, move one copy to node_modules/<name>
// and drop the rest. Multi-version names are left alone. Repeat to a fixpoint,
// then run `npm install` to reconcile and `npm ci` to prove the result.
//
// Usage: node lockhoist.cjs [--write]   (from the theme root)
const fs = require('fs');
const L = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const P = L.packages;
let total = 0;
for (;;) {
  const top = new Set(Object.keys(P).filter(k => k.startsWith('node_modules/') && k.split('node_modules/').length === 2).map(k => k.slice(13)));
  const nested = {};
  for (const k of Object.keys(P)) {
    const parts = k.split('node_modules/');
    if (parts.length < 3) continue;
    const name = parts[parts.length - 1];
    if (!top.has(name)) (nested[name] ||= []).push(k);
  }
  let n = 0;
  for (const [name, keys] of Object.entries(nested)) {
    const vers = new Set(keys.map(k => P[k].version));
    if (vers.size !== 1) continue;
    P[`node_modules/${name}`] = { ...P[keys[0]] };
    for (const k of keys) delete P[k];
    console.log(`hoisted ${name}@${[...vers][0]} (${keys.length} nested copies)`);
    n++;
  }
  total += n;
  if (!n) break;
}
const sorted = {};
for (const k of Object.keys(P).sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a < b ? -1 : a > b ? 1 : 0))) sorted[k] = P[k];
L.packages = sorted;
console.log(`lockhoist: ${total} hoisted`);
if (process.argv[2] === '--write' && total) fs.writeFileSync('package-lock.json', JSON.stringify(L, null, 2) + '\n');
