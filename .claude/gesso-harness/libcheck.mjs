// Checks slac.libraries.yml against a fresh build:
//  1. every dist/ css/js path a library declares exists;
//  2. every library whose dist/js entry waits on the webpack runtime chunk
//     (common.js) depends -- directly or transitively -- on slac/common.
//
// (2) is the W6-D9 252b003d criterion. An entry that waits on the common
// chunk contains webpack's onChunksLoaded call, minified as
// `.O(void 0,[<chunk id>]`. Such a library only works today if something else
// on the page (usually slac/global) happens to pull in slac/common.
//
// Usage (from the theme root, after npm run build):
//   node .claude/gesso-harness/libcheck.mjs slac.libraries.yml
import fs from 'node:fs';
import YAML from 'yaml';

const file = process.argv[2] || 'slac.libraries.yml';
const libs = YAML.parse(fs.readFileSync(file, 'utf8'));

const closure = (name, seen = new Set()) => {
  if (seen.has(name)) return seen;
  seen.add(name);
  const lib = libs[name.replace(/^slac\//, '')];
  for (const d of (lib && lib.dependencies) || []) {
    if (d.startsWith('slac/')) closure(d, seen);
  }
  return seen;
};

const missingFiles = [];
const missingCommon = [];
let jsLibs = 0;
for (const [name, lib] of Object.entries(libs || {})) {
  const css = Object.values((lib && lib.css) || {}).flatMap(group => Object.keys(group || {}));
  const js = Object.keys((lib && lib.js) || {});
  for (const p of [...css, ...js]) {
    if (p.startsWith('dist/') && !fs.existsSync(p)) missingFiles.push(`${name}: ${p}`);
  }
  const waits = js.filter(p => p.startsWith('dist/js/') && fs.existsSync(p)
    && /\.O\((?:void 0|undefined),\s*\[/.test(fs.readFileSync(p, 'utf8')));
  if (js.some(p => p.startsWith('dist/js/'))) jsLibs++;
  if (waits.length && !closure(`slac/${name}`).has('slac/common')) {
    missingCommon.push(`${name}: ${waits.join(', ')} (deps: ${((lib && lib.dependencies) || []).join(', ') || 'none'})`);
  }
}

console.log(`libraries: ${Object.keys(libs || {}).length} (${jsLibs} with dist/js)`);
console.log(missingFiles.length
  ? `!! declared dist paths missing after build:\n  ${missingFiles.join('\n  ')}`
  : 'declared dist paths: all present OK');
console.log(missingCommon.length
  ? `!! wait on the common chunk but do not depend on slac/common:\n  ${missingCommon.join('\n  ')}`
  : 'slac/common: every chunk-dependent library declares it OK');
