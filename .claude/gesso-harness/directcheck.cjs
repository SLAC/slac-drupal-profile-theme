#!/usr/bin/env node
// directcheck.cjs <upstream-package-lock.json>   (run from the theme root)
//
// Every direct dependency (dependencies, devDependencies, and package.json
// overrides) whose locked version differs from upstream's tested one. `pinbump`
// only lists direct packages whose locked version has left their range, and
// `lockmin` never rewinds direct packages, so a direct package that npm floats
// *within* its range was caught by neither (post-upgrade: @typescript-eslint
// 8.29.0 -> 8.71.0 at 5.4.3 s3, postcss-selector-parser 7.1.3 -> 7.1.6 at 5.4.5
// s4). Run it after every lockfile change; each line must be a recorded
// carve-out, a SLAC-only package, or an older/newer version the register explains.
const fs = require('fs');
const path = require('path');

const up = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).packages;
const ours = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')).packages;
const pj = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const direct = { ...pj.dependencies, ...pj.devDependencies, ...pj.optionalDependencies };
for (const n of Object.keys(pj.overrides || {})) if (!(n in direct)) direct[n] = '(override)';
let same = 0;
const rows = [];
for (const n of Object.keys(direct).sort()) {
  const o = (ours[`node_modules/${n}`] || {}).version;
  const u = (up[`node_modules/${n}`] || {}).version;
  if (o === u) same++;
  else rows.push(`  ${n.padEnd(40)} ours ${String(o).padEnd(12)} upstream ${u === undefined ? '(not upstream)' : u}   range ${direct[n]}`);
}
console.log(`directcheck vs ${path.basename(process.argv[2])}: ${same} direct packages at upstream's version, ${rows.length} not`);
if (rows.length) console.log(rows.join('\n'));
