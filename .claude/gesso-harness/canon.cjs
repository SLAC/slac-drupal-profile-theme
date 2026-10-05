// canon.cjs -- scope-aware AST equivalence for minified webpack output.
// Usage: node canon.cjs fn <a.js> <b.js>  (two function sources); see entrycmp.cjs.
//
// Every variable *declared inside* the compared code is renamed to a
// canonical name (v0, v1, ...) in scope-traversal order; free variables
// (Drupal, once, window, document, ...) keep their names. Positions and raw
// text are stripped. Two snippets compare equal iff they are the same program
// up to consistent renaming of locals -- i.e. what a minifier is allowed to
// change. Anything else (a literal, a property name, a global, structure)
// still shows. Ported from W6-D9's hop-24 scratchpad (5.4.7 stage 1); run
// from the theme root, where acorn and eslint-scope resolve.
const path = require('path');
const NM = process.env.NODE_PATH || path.resolve('node_modules');
const acorn = require(NM + '/acorn');
const escope = require(NM + '/eslint-scope');
const fs = require('fs');

function canonical(fnSource) {
  const src = `"use strict";(${fnSource});`;
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', ranges: true });
  const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
  const rename = new Map();
  let n = 0;
  for (const scope of sm.scopes) {
    for (const v of scope.variables) {
      if (scope.type === 'global') continue;
      if (v.name === 'arguments' && !v.defs.length) continue;
      const c = `v${n++}`;
      for (const id of v.identifiers) rename.set(id, c);
      for (const r of v.references) rename.set(r.identifier, c);
    }
  }
  const strip = node => {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== 'object') return node;
    const o = {};
    for (const k of Object.keys(node)) {
      if (['start', 'end', 'loc', 'range', 'raw'].includes(k)) continue;
      o[k] = strip(node[k]);
    }
    if (node.type === 'Identifier' && rename.has(node)) o.name = rename.get(node);
    // Both sides run strict (the program is prefixed with "use strict"), so a
    // function-level directive is redundant and must not count as a change.
    if (node.type === 'BlockStatement') o.body = o.body.filter(st => st.directive !== 'use strict');
    return o;
  };
  return JSON.stringify(strip(ast.body[1]));
}

// Parse a whole emitted file and return its pieces as source strings.
function pieces(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  const out = { src, table: null, iife: null };
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (!out.table && n.type === 'ObjectExpression' && n.properties.length &&
        n.properties.every(p => p.type === 'Property' && p.key.type === 'Literal' && typeof p.key.value === 'number' && /Function/.test(p.value.type))) {
      out.table = Object.fromEntries(n.properties.map(p => [p.key.value, src.slice(p.value.start, p.value.end)]));
    }
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(ast);
  const e = ast.body[0].expression;
  const call = e.type === 'UnaryExpression' ? e.argument : e;
  if (call.type === 'CallExpression' && /Function/.test(call.callee.type)) out.iife = src.slice(call.callee.start, call.callee.end);
  return out;
}

module.exports = { canonical, pieces };

if (require.main === module) {
  const [mode, a, b, ...rest] = process.argv.slice(2);
  if (mode === 'fn') console.log(canonical(fs.readFileSync(a, 'utf8')) === canonical(fs.readFileSync(b, 'utf8')) ? 'EQUIVALENT' : 'DIFFERENT');
}
