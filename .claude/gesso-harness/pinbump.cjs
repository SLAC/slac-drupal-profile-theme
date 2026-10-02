#!/usr/bin/env node
// pinbump.cjs <upstream-lock.json> -- after `gesso-hop.sh deps <tag> --apply`, list
// the direct dependencies whose locked version no longer satisfies the new
// range, as `name@version` with upstream's tested (lockfile) version, for one
// `npm install` (then restore package.json's ranges and run lockfix.sh).
// A name whose upstream version does not satisfy our range is printed as
// `name@<range>` with a warning on stderr (decide by hand).
const fs = require('fs');
const path = require('path');
const semver = require(path.resolve('node_modules/semver'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const P = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')).packages;
const U = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).packages;
const out = [];
for (const [name, range] of Object.entries({ ...pkg.devDependencies, ...pkg.dependencies })) {
  if (!semver.validRange(range)) continue;
  const have = P[`node_modules/${name}`]?.version;
  if (have && semver.satisfies(have, range)) continue;
  const up = U[`node_modules/${name}`]?.version;
  if (up && semver.satisfies(up, range)) out.push(`${name}@${up}`);
  else { out.push(`${name}@${range}`); console.error(`!! ${name}: locked ${have ?? '-'}, upstream ${up ?? '-'} do not fit ${range}`); }
}
console.log(out.join('\n'));
