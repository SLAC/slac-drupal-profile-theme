// entrycmp.cjs <baseline-entry.js> <new-entry.js>  (run from the theme root)
// Compare baseline vs new build of one entry file (W6-D9 hop 24, 5.4.7 stage 1).
//  table -> inlined : the baseline's single module function must equal the
//                     new IIFE (both as standalone strict functions).
//  table -> table   : same module ids, every module function equal.
//  table -> table + inlined entry (SLAC, 5.4.7 stage 1): exactly one baseline
//                     module is missing from the new table; it must equal the
//                     statements the new IIFE runs after its require function
//                     (or its last inner IIFE), wrapped as function(_, _, req).
const path = require('path');
const { canonical, pieces } = require('./canon.cjs');
const acorn = require((process.env.NODE_PATH || path.resolve('node_modules')) + '/acorn');
const [fa, fb] = process.argv.slice(2);
const [a, b] = [fa, fb].map(pieces);
const ids = t => Object.keys(t || {}).sort((x, y) => x - y);

function inlinedEntry(src) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest' });
  const e = ast.body[0].expression;
  const outer = (e.type === 'UnaryExpression' ? e.argument : e).callee.body.body;
  const reqIdx = outer.findIndex(s => s.type === 'FunctionDeclaration');
  const req = outer[reqIdx].id.name;
  const isIife = s => s.type === 'ExpressionStatement' && s.expression.type === 'UnaryExpression' &&
    s.expression.argument.type === 'CallExpression' && /Function/.test(s.expression.argument.callee.type);
  const rest = outer.slice(reqIdx + 1);
  const inner = rest.filter(isIife).pop();
  const body = inner && rest.length === 1
    ? src.slice(inner.expression.argument.callee.body.start + 1, inner.expression.argument.callee.body.end - 1)
    : src.slice(rest[0].start, rest[rest.length - 1].end);
  return `function(__module,__exports,${req}){${body}}`;
}

let v;
if (a.table && !b.table) {
  const only = ids(a.table);
  v = only.length === 1 && canonical(a.table[only[0]]) === canonical(b.iife)
    ? `EQUIVALENT: module ${only[0]} inlined, body identical up to local renaming` : `DIFFERENT (${only.length} modules in baseline)`;
} else if (a.table && b.table) {
  const ia = ids(a.table), ib = ids(b.table);
  const shared = ia.filter(k => b.table[k]);
  const diff = shared.filter(k => canonical(a.table[k]) !== canonical(b.table[k]));
  const onlyA = ia.filter(k => !b.table[k]), onlyB = ib.filter(k => !a.table[k]);
  if (!diff.length && !onlyA.length && !onlyB.length) {
    v = `EQUIVALENT: ${ia.length} modules, ids identical, every body identical up to local renaming`;
  } else if (!diff.length && onlyA.length === 1 && !onlyB.length) {
    const same = canonical(a.table[onlyA[0]]) === canonical(inlinedEntry(b.src));
    v = same
      ? `EQUIVALENT: ${shared.length} shared modules identical; entry module ${onlyA[0]} inlined, body identical up to local renaming`
      : `DIFFERENT: ${shared.length} shared modules identical, but inlined entry ${onlyA[0]} differs`;
  } else {
    v = `DIFFERENT: ${diff.length} differing [${diff}], only-baseline [${onlyA}], only-new [${onlyB}] of ${ia.length}/${ib.length}`;
  }
} else v = canonical(a.iife) === canonical(b.iife) ? 'EQUIVALENT (iife)' : 'DIFFERENT (iife)';
console.log(v);
