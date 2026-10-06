#!/usr/bin/env node
// cssdecl.cjs <old.css> <new.css>  (run from the theme root; from W6-D9's hop-24 scratchpad)
// Diff two CSS files at declaration level: every (at-rule context, selector,
// property: value) triple, in document order, as a multiset.
const postcss = require((process.env.NODE_PATH || require('path').resolve('node_modules')) + '/postcss');
const fs = require('fs');
function decls(f) {
  const out = [];
  postcss.parse(fs.readFileSync(f, 'utf8')).walkDecls(d => {
    const ctx = []; let p = d.parent;
    while (p && p.type !== 'root') { ctx.unshift(p.type === 'rule' ? p.selector.replace(/\s+/g, ' ') : `@${p.name} ${p.params}`); p = p.parent; }
    out.push(`${ctx.join(' >> ')} { ${d.prop}: ${d.value}${d.important ? ' !important' : ''} }`);
  });
  return out;
}
const [a, b] = process.argv.slice(2).map(decls);
const count = arr => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const ca = count(a), cb = count(b);
const added = [], removed = [];
for (const [k, n] of cb) for (let i = (ca.get(k) || 0); i < n; i++) added.push(k);
for (const [k, n] of ca) for (let i = (cb.get(k) || 0); i < n; i++) removed.push(k);
// order check: removing the added decls from b must give exactly a
const bMinus = [...b]; for (const x of added) bMinus.splice(bMinus.lastIndexOf(x), 1);
console.log(JSON.stringify({ added, removed: removed.length, restIdenticalInOrder: JSON.stringify(bMinus) === JSON.stringify(a) }));
