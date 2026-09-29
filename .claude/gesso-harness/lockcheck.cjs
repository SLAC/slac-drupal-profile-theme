#!/usr/bin/env node
// lockcheck.cjs -- find (and optionally repair) unsatisfied edges in package-lock.json.
//
// lockmin/lockhoist rewrite individual entries; `npm install` does not always
// re-validate the edges of entries that were already in the lockfile, and
// `npm ci` installs whatever the lockfile says. So a rewound entry can leave a
// dependent pointing at the wrong major (hop 7: make-dir, convert-source-map),
// and a hoist can move a package away from the only copy of its peer that
// satisfies it (hop 11: glob-promise's peer glob ^8 next to a top-level glob 10).
// `npm ls --all --package-lock-only` reports the same problems; this script
// also says who depends on what, and can fix them:
//
//   dependency edge  -> nest a satisfying copy under the dependent
//                       (<dependent>/node_modules/<dep>)
//   peer edge        -> if the package that declares the peer is top-level,
//                       move it under each dependent together with a
//                       satisfying copy of the peer (upstream's layout)
//
// The satisfying copy is the highest version of that name in the previous
// lockfile, else in upstream's, else the current one, that fits the range.
// After --repair, run `npm install` (to fill the new entries' own deps) and
// check again until clean.
//
// Usage: node lockcheck.cjs [<prev-lock.json> <upstream-lock.json> --repair]
const fs = require('fs');
const path = require('path');
const semver = require(path.resolve('node_modules/semver'));
const L = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const P = L.packages;
const [prevPath, upPath, flag] = process.argv.slice(2);
const pools = [prevPath, upPath].filter(Boolean).map(f => JSON.parse(fs.readFileSync(f, 'utf8')).packages).concat([P]);

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
const nameOf = k => k.slice(k.lastIndexOf('node_modules/') + 13);
const fits = (v, r) => { if (/^(npm:|https?:|git|file:|github:)/.test(r)) return true; try { return semver.satisfies(v, r, { includePrerelease: true }); } catch { return true; } };

function problems() {
  const out = [];
  for (const [from, pkg] of Object.entries(P)) {
    if (pkg.link) continue;
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const [dep, range] of Object.entries(pkg[field] || {})) {
        const peer = field === 'peerDependencies';
        if (peer && pkg.peerDependenciesMeta?.[dep]?.optional && !resolveFrom(parentOf(from), dep)) continue;
        const at = resolveFrom(peer ? parentOf(from) : from, dep);
        if (!at) { if (field !== 'optionalDependencies') out.push({ from, dep, range, peer, at: null }); continue; }
        if (!fits(P[at].version, range)) out.push({ from, dep, range, peer, at, have: P[at].version });
      }
    }
  }
  return out;
}
function candidate(name, range) {
  for (const pool of pools) {
    const vs = Object.entries(pool).filter(([k, v]) => nameOf(k) === name && v.version && fits(v.version, range))
      .sort((a, b) => semver.rcompare(a[1].version, b[1].version));
    if (vs.length) return vs[0][1];
  }
  return null;
}

// Unmet in upstream's own lockfile too; accepted (twig-loader is a GitHub tarball
// pinned to an old twig peer range).
const ACCEPTED = new Set(['node_modules/twig-loader>twig']);
const found = problems().filter(p => !ACCEPTED.has(`${p.from}>${p.dep}`));
for (const p of found) console.log(`${p.peer ? 'peer' : 'dep '} ${p.from || '(root)'} -> ${p.dep}@${p.range}: ${p.at ? `resolves ${p.have} at ${p.at}` : 'missing'}`);
console.log(`lockcheck: ${found.length} unsatisfied edge(s)`);
if (flag !== '--repair' || !found.length) process.exit(found.length ? 1 : 0);

let fixed = 0;
for (const p of found) {
  if (p.peer && !p.from.includes('/node_modules/') && ['dependencies', 'devDependencies', 'optionalDependencies'].some(f => (P[''][f] || {})[nameOf(p.from)])) {
    // A direct dependency of the theme cannot be moved; the mismatch is upstream's too (twig-loader).
    console.log(`  left ${nameOf(p.from)} (a direct dependency; its peer ${p.dep}@${p.range} is unmet in upstream's lockfile as well)`);
    continue;
  }
  const c = candidate(p.dep, p.range);
  if (!c) { console.log(`  !! no satisfying ${p.dep}@${p.range} in any lockfile`); continue; }
  if (!p.peer) {
    P[`${p.from}/node_modules/${p.dep}`] = { ...c }; fixed++;
    console.log(`  nested ${p.dep}@${c.version} under ${p.from}`);
  } else if (!p.from.includes('/node_modules/')) {
    // A top-level package whose peer cannot be satisfied at the top level:
    // move it under each dependent, next to a satisfying peer.
    const name = nameOf(p.from);
    const deps = Object.entries(P).filter(([k, v]) => k !== p.from && ['dependencies', 'optionalDependencies'].some(f => (v[f] || {})[name]) && resolveFrom(k, name) === p.from).map(([k]) => k);
    for (const q of deps) {
      P[`${q}/node_modules/${name}`] = { ...P[p.from] };
      P[`${q}/node_modules/${p.dep}`] = P[`${q}/node_modules/${p.dep}`] || { ...c };
      console.log(`  moved ${name} under ${q}, with ${p.dep}@${c.version}`);
    }
    delete P[p.from]; fixed++;
  } else {
    P[`${parentOf(p.from)}/node_modules/${p.dep}`] = { ...c }; fixed++;
    console.log(`  nested peer ${p.dep}@${c.version} beside ${p.from}`);
  }
}
const sorted = {};
for (const k of Object.keys(P).sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a < b ? -1 : a > b ? 1 : 0))) sorted[k] = P[k];
L.packages = sorted;
fs.writeFileSync('package-lock.json', JSON.stringify(L, null, 2) + '\n');
console.log(`lockcheck: ${fixed} repaired; now run npm install and check again`);
