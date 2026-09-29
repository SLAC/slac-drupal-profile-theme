#!/usr/bin/env node
// lockmin.cjs -- undo npm's "newest satisfying" drift after a dependency bump.
//
// When a hop raises a range that the lockfile no longer satisfies, `npm install`
// re-resolves the whole affected subtree to the NEWEST versions allowed, which
// can move output-generating packages (babel helpers, browserslist,
// caniuse-lite, ...) far past what upstream tested (gesso-STATE.md trap W1).
//
// For every top-level `node_modules/<name>` whose version differs from the
// previous lockfile, pick the first candidate that satisfies EVERY dependent
// that resolves to that top-level copy (Node's lookup algorithm):
//   1. the previous lockfile's version (no movement at all),
//   2. upstream's lockfile version at the target tag (upstream-tested),
//   3. the version npm chose (unchanged).
// Newly added top-level packages take upstream's version when it satisfies
// their dependents (otherwise npm's choice stands).
// The chosen entry is copied verbatim from the lockfile it came from. Run
// `npm install` afterwards to reconcile, and repeat until nothing changes.
//
// A candidate inside a known advisory range (from `npm audit --json`, passed
// with --audit) is never chosen: the security carve-out in gesso-STATE.md.
//
// Usage: node lockmin.cjs <prev-lock.json> <upstream-lock.json> [--write]
//          [--audit <audit.json>] [--allow-vuln <name-regex>]
//        (run from the theme root; edits ./package-lock.json with --write)
const fs = require('fs');
const path = require('path');
const semver = require(path.resolve('node_modules/semver'));

const args = process.argv.slice(2);
const [prevPath, upPath] = args;
const flag = args.includes('--write') ? '--write' : '';
const auditPath = args.includes('--audit') ? args[args.indexOf('--audit') + 1] : null;
// Names whose vulnerable candidates are still acceptable: output-generating
// build tooling, where the advisory is build-time only and byte-identical
// output wins. Record each such choice in the hop plan.
const allowVuln = args.includes('--allow-vuln') ? new RegExp(args[args.indexOf('--allow-vuln') + 1]) : null;
const advisories = {};
if (auditPath) {
  const a = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  for (const [name, v] of Object.entries(a.vulnerabilities || {})) {
    for (const via of v.via || []) if (typeof via === 'object' && via.range) (advisories[name] ||= []).push(via.range);
    // Vulnerable only through a dependency: npm reports the affected range.
    if (v.range && (v.via || []).some(x => typeof x === 'string')) (advisories[name] ||= []).push(v.range);
  }
}
const vulnerable = (name, ver) => (advisories[name] || []).some(r => { try { return semver.satisfies(ver, r); } catch { return false; } });
const cur = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const prev = JSON.parse(fs.readFileSync(prevPath, 'utf8')).packages;
const up = JSON.parse(fs.readFileSync(upPath, 'utf8')).packages;
const P = cur.packages;

// Node resolution: from package at `from`, where does `name` resolve?
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

// Ranges on each top-level key from the dependents that resolve to it.
const ranges = {};
for (const [from, pkg] of Object.entries(P)) {
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies']) {
    if (field === 'devDependencies' && from !== '') continue;
    for (const [name, range] of Object.entries(pkg[field] || {})) {
      // A peer resolves from the dependent's parent context.
      let ctx = from;
      if (field === 'peerDependencies') {
        const i = from.lastIndexOf('/node_modules/');
        ctx = i < 0 ? '' : from.slice(0, i);
      }
      const at = resolveFrom(ctx, name);
      if (!at || at.split('node_modules/').length !== 2) continue; // not top-level
      (ranges[at] ||= []).push({ from: from || '(root)', range, peer: field === 'peerDependencies' });
    }
  }
}

const okRanges = (v, rs) => rs.every(r => {
  if (/^(npm:|https?:|git|file:|github:)/.test(r.range)) return true;
  try { return semver.satisfies(v, r.range, { includePrerelease: true }); } catch { return true; }
});
let curName = '';
const ok = (v, rs) => okRanges(v, rs) && (!vulnerable(curName, v) || (allowVuln && allowVuln.test(curName)));

// Swap an entry together with its nested subtree: the nested copies npm
// placed for the newer version belong to it, not to the one we restore.
function replace(key, srcLock) {
  for (const k of Object.keys(P)) if (k.startsWith(`${key}/node_modules/`)) delete P[k];
  for (const [k, v] of Object.entries(srcLock)) if (k === key || k.startsWith(`${key}/node_modules/`)) P[k] = { ...v };
}

// Direct dependencies are chosen deliberately by the hop's install (upstream's
// tested version, or an advisory-driven exception); only transitive drift is
// rewound. (Hop 12: rewinding two direct @storybook addons to upstream's 7.5.1
// broke Storybook's lockstep with the rest at 7.6.21.)
const root = P[''] || {};
const direct = new Set(Object.keys({ ...root.dependencies, ...root.devDependencies, ...root.optionalDependencies }));
// Packages pinned through package.json `overrides` are deliberate too (hop 20
// s3: `overrides.terser`); npm writes no overrides into the lockfile, so read
// them from package.json. Rewinding one would oscillate against `npm install`.
try {
  const ov = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).overrides || {};
  for (const k of Object.keys(ov)) direct.add(k);
} catch { /* no package.json: nothing to add */ }

let changed = 0, kept = 0;
const report = [];
for (const [key, entry] of Object.entries(P)) {
  if (!key.startsWith('node_modules/') || key.split('node_modules/').length !== 2) continue;
  const was = prev[key];
  if (entry.link) continue;
  curName = key.slice(13);
  if (direct.has(curName)) continue;
  const rs = ranges[key] || [];
  if (!was) {
    // Newly added: prefer upstream's tested version when it fits.
    const u = up[key];
    if (u && u.version !== entry.version && ok(u.version, rs)) {
      report.push(`${key.slice(13)}: ${entry.version} -> ${u.version} (upstream, new)`);
      replace(key, up);
      changed++;
    }
    continue;
  }
  if (was.version === entry.version) continue;
  let pick = null, src = null;
  if (ok(was.version, rs)) { pick = was; src = 'prev'; }
  else if (up[key] && up[key].version !== entry.version && semver.gte(up[key].version, was.version) && ok(up[key].version, rs)) { pick = up[key]; src = 'upstream'; }
  if (pick) {
    report.push(`${key.slice(13)}: ${entry.version} -> ${pick.version} (${src})`);
    replace(key, src === 'prev' ? prev : up);
    changed++;
  } else {
    report.push(`${key.slice(13)}: keeps ${entry.version} (prev ${was.version} / upstream ${up[key]?.version ?? '-'} do not satisfy: ${rs.filter(r => !ok(was.version, [r])).map(r => `${r.from.replace(/.*node_modules\//, '')} ${r.range}`).slice(0, 3).join('; ')})`);
    kept++;
  }
}
console.log(report.join('\n'));
console.log(`\nlockmin: ${changed} entries rewound, ${kept} kept`);
if (flag === '--write' && changed) fs.writeFileSync('package-lock.json', JSON.stringify(cur, null, 2) + '\n');
