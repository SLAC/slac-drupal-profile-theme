#!/usr/bin/env node
// syntaxscan.cjs <dirA> <dirB> -- which ES syntax features each set of bundles
// uses (acorn node types, plus let/const, ??, ?., **, async, generators,
// getters, class fields). Reports features present in B but absent from A:
// the ones a transpiler change would newly require of browsers.
const fs = require('fs'), path = require('path');
const acorn = require(require.resolve('acorn', { paths: [path.resolve('node_modules/webpack')] }));
function scan(dir) {
  const feats = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const ast = acorn.parse(fs.readFileSync(path.join(dir, f), 'utf8'), { ecmaVersion: 'latest', sourceType: 'script' });
    (function walk(n) {
      if (!n || typeof n.type !== 'string') return;
      const add = k => { (feats[k] ||= new Set()).add(f); };
      add(n.type);
      if (n.type === 'VariableDeclaration') add(`decl:${n.kind}`);
      if (n.type === 'LogicalExpression' && n.operator === '??') add('op:??');
      if (n.type === 'AssignmentExpression' && /\?\?=|\|\|=|&&=/.test(n.operator)) add(`op:${n.operator}`);
      if (n.type === 'BinaryExpression' && n.operator === '**') add('op:**');
      if ((n.type === 'FunctionExpression' || n.type === 'FunctionDeclaration' || n.type === 'ArrowFunctionExpression') && n.async) add('async function');
      if ((n.type === 'FunctionExpression' || n.type === 'FunctionDeclaration') && n.generator) add('generator');
      if (n.type === 'Property' && (n.kind === 'get' || n.kind === 'set')) add('accessor');
      if (n.type === 'Property' && n.method) add('method shorthand');
      if (n.type === 'Property' && n.shorthand) add('property shorthand');
      for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
    })(ast);
  }
  return feats;
}
const [a, b] = process.argv.slice(2);
const A = scan(a), B = scan(b);
const newOnes = Object.keys(B).filter(k => !A[k]).sort();
const gone = Object.keys(A).filter(k => !B[k]).sort();
console.log(`syntax features: ${Object.keys(A).length} in ${path.basename(a)}, ${Object.keys(B).length} in ${path.basename(b)}`);
console.log(`new in B: ${newOnes.length ? newOnes.map(k => `${k} (${[...B[k]].slice(0, 3).join(', ')})`).join('; ') : 'none'}`);
console.log(`gone from B: ${gone.length ? gone.join(', ') : 'none'}`);
