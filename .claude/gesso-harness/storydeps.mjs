#!/usr/bin/env node
// storydeps.mjs: for every story file, the slac/* libraries Drupal would load
// for the Twig it renders, and whether the story imports each one's CSS/JS.
// (Post-upgrade item 4. Storybook 7+ loads only the current story's imports,
// so a story that renders another component's Twig without importing that
// component's stylesheet/script shows it unstyled or inert; Storybook 6
// bundled everything.)
//
// Twig tree: the story's `import x from '*.twig'`, then every
// include/embed/extends/from/import/source('@ns/...') recursively.
// Libraries: every attach_library('slac/X') in that tree, closed over
// slac.libraries.yml `dependencies` (slac/global and slac/common excluded:
// preview.js loads styles.css and the global behaviours).
// A library counts as covered when the story (or a stories file it imports,
// transitively) imports one of the library's own source files (its .scss /
// .es6.js, matched by the dist/css|js basename) or its component's stories file.
// slac/global's component scripts that preview.js does not import (header,
// search, embed) are checked the same way, for stories whose Twig tree has a
// template from that script's directory.
// Usage: node .claude/gesso-harness/storydeps.mjs [--all]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YAML = require(path.resolve('node_modules/yaml'));
const NS = { global: 'source/01-global', layouts: 'source/02-layouts', components: 'source/03-components', templates: 'source/04-templates', pages: 'source/05-pages' };
const libs = YAML.parse(fs.readFileSync('slac.libraries.yml', 'utf8'));
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const all = walk('source');
const stories = all.filter(f => /\.stories\.jsx?$/.test(f));
const resolveTwig = (ref, from) => {
  const m = ref.match(/^@(\w+)\/(.+)$/);
  if (m && NS[m[1]]) return path.join(NS[m[1]], m[2]);
  return path.join(path.dirname(from), ref);
};
const twigTree = (file, seen = new Set()) => {
  if (seen.has(file) || !fs.existsSync(file)) return seen;
  seen.add(file);
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\{%-?\s*(?:include|embed|extends|from|import)\s+['"]([^'"]+\.twig)['"]|source\(\s*['"]([^'"]+\.twig)['"]/g)) twigTree(resolveTwig(m[1] || m[2], file), seen);
  return seen;
};
const libsOf = twigs => {
  const out = new Set();
  for (const t of twigs) for (const m of fs.readFileSync(t, 'utf8').matchAll(/attach_library\(\s*['"]slac\/([\w-]+)['"]/g)) out.add(m[1]);
  const close = n => { for (const dep of (libs[n] || {}).dependencies || []) { const [ext, name] = dep.split('/'); if (ext === 'slac' && !out.has(name)) { out.add(name); close(name); } } };
  [...out].forEach(close);
  out.delete('global'); out.delete('common');
  return out;
};
// source files that produce a library's dist files
const libSources = name => {
  const l = libs[name] || {}; const files = [];
  for (const group of Object.values(l.css || {})) for (const k of Object.keys(group)) files.push(k);
  for (const k of Object.keys(l.js || {})) files.push(k);
  const bases = files.filter(f => f.startsWith('dist/')).map(f => path.basename(f).replace(/\.(css|js)$/, ''));
  return all.filter(f => bases.some(b => path.basename(f) === `${b}.scss` || path.basename(f) === `${b}.js` || path.basename(f) === `${b}.es6.js` || path.basename(f) === `${b}.stories.jsx`));
};
const importsOf = (file, seen = new Set()) => {
  if (seen.has(file)) return seen; seen.add(file);
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/import\s+(?:[\w{},\s*]+\s+from\s+)?['"](\.[^'"]+)['"]/g)) {
    let p = path.join(path.dirname(file), m[1]);
    for (const cand of [p, `${p}.js`, `${p}.jsx`, `${p}.es6.js`, `${p}.scss`]) if (fs.existsSync(cand) && fs.statSync(cand).isFile()) { if (/\.stories\.jsx?$/.test(cand)) importsOf(cand, seen); else seen.add(cand); break; }
  }
  return seen;
};
// slac/global scripts that preview.js imports (item 2); the rest belong to one component each
const preview = fs.readFileSync('.storybook/preview.js', 'utf8');
const globalOwn = Object.keys(libs.global.js || {}).filter(f => f.startsWith('dist/js/')).map(f => path.basename(f))
  .map(b => all.find(f => path.basename(f) === b)).filter(f => f && !preview.includes(path.relative('.storybook', f).replace(/\.js$/, '')));
let missing = 0;
for (const s of stories.sort()) {
  const src = fs.readFileSync(s, 'utf8');
  const twigs = new Set();
  for (const m of src.matchAll(/from\s+['"](\.[^'"]+\.twig)['"]/g)) twigTree(path.join(path.dirname(s), m[1]), twigs);
  const need = libsOf(twigs); const have = importsOf(s);
  const gaps = [...need].filter(n => { const srcs = libSources(n); return srcs.length && !srcs.some(f => have.has(f)); });
  for (const g of globalOwn) if ([...twigs].some(t => path.dirname(t) === path.dirname(g)) && !have.has(g)) gaps.push(`global:${path.basename(g)}`);
  if (gaps.length || process.argv.includes('--all')) console.log(`${s.replace('source/', '')}: ${gaps.length ? 'MISSING ' + gaps.join(', ') : 'ok'}`);
  missing += gaps.length ? 1 : 0;
}
console.log(`storydeps: ${stories.length} story files, ${missing} with missing library imports (global scripts checked: ${globalOwn.map(g => path.basename(g)).join(', ')})`);
