#!/usr/bin/env node
// lockhoist.cjs -- hoist nested lockfile entries that have no top-level copy.
//
// Replacing a major (Storybook 6.5 -> 7) in place can leave the new packages
// nested under their first dependent (the old top-level copy of the same name
// was still there when npm placed them, and npm never re-hoists). Code that
// resolves from the project root -- Storybook's generated preview entry --
// then cannot find them. For every package name with NO top-level entry whose
// nested copies all share one version, move one copy to node_modules/<name>
// and drop the rest -- but ONLY if, for every copy, each of the package's
// peers would resolve to the same version from the top level as from where it
// sits now (hop 11: hoisting glob-promise, peer glob ^8, next to a top-level
// glob 10 broke Storybook). Plain dependencies that would change are left to
// lockcheck.cjs --repair, which nests the right version back under it. Multi-version names are left alone.
// Repeat to a fixpoint, then `npm install` to reconcile and `npm ci` to prove.
//
// Usage: node lockhoist.cjs [--write]   (from the theme root)
const fs = require('fs');
const L = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const P = L.packages;
function resolveFrom(from, name) {
  let base = from;
  for (;;) {
    const cand = (base ? `${base}/` : '') + `node_modules/${name}`;
    if (P[cand]) return cand;
    if (!base) return null;
    const i = base.lastIndexOf('/node_modules/');
    base = i < 0 ? '' : base.slice(0, i);
  }
}
const parentOf = k => { const i = k.lastIndexOf('/node_modules/'); return i < 0 ? '' : k.slice(0, i); };
function sameResolution(key, name) {
  const pkg = P[key];
  const top = `node_modules/${name}`;
  // Plain dependencies that would resolve differently are nested back under the
  // hoisted package by lockcheck.cjs --repair; peers cannot be, so refuse those.
  for (const field of ['peerDependencies']) {
    for (const dep of Object.keys(pkg[field] || {})) {
      // Deps resolve from the package itself; peers from its parent context.
      const fromOld = field === 'peerDependencies' ? parentOf(key) : key;
      const fromNew = field === 'peerDependencies' ? '' : top;
      const a = resolveFrom(fromOld, dep), b = resolveFrom(fromNew, dep);
      // A dep nested inside the package moves with it.
      if (a && a.startsWith(`${key}/node_modules/`)) continue;
      const va = a && P[a].version, vb = b && P[b].version;
      if (va !== vb) return `${field.slice(0, -12) || 'dep'} ${dep}: ${va ?? 'none'} here, ${vb ?? 'none'} at top level`;
    }
  }
  return null;
}
let total = 0;
const refused = new Set();
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
    if (refused.has(name)) continue;
    const vers = new Set(keys.map(k => P[k].version));
    if (vers.size !== 1) continue;
    const why = keys.map(k => sameResolution(k, name)).find(Boolean);
    if (why) { console.log(`kept nested ${name}@${[...vers][0]} (${why})`); refused.add(name); continue; }
    // Move the nested copy's own nested deps along with it.
    const src = keys[0];
    for (const k of Object.keys(P)) if (k.startsWith(`${src}/node_modules/`)) { P[`node_modules/${name}` + k.slice(src.length)] = P[k]; }
    P[`node_modules/${name}`] = { ...P[src] };
    for (const k of Object.keys(P)) for (const s of keys) if (k === s || k.startsWith(`${s}/node_modules/`)) delete P[k];
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
