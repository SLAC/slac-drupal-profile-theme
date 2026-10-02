#!/usr/bin/env node
// cascade3.cjs <old.css> <new.css> [--list]   (run from the theme root; uses its postcss)
//
// Can reordering declarations across rules change any element's computed value?
// Built for Dart Sass's mixed-declarations change (sass-embedded 1.97, 5.4.4 s4):
// declarations after a nested rule are no longer hoisted, so `.a{color:x;&:hover{}
// ;outline:y}` becomes `.a{color:x} .a:hover{} .a{outline:y}`.
//
// Document order decides a cascade conflict only between declarations of equal
// specificity and equal importance. So, per selector (selector lists are split;
// specificity from postcss-selector-parser, with :is/:not/:has = max of their
// arguments and :where = 0):
//   1. every declaration (at-rule context, selector, property, value, !important)
//      must exist in both files the same number of times; the rest are listed
//      as only-old / only-new (for example autoprefixer adding or dropping a prefix);
//   2. for every pair of shared declarations in the same shorthand family
//      (margin/margin-top, border/border-color, a property and its -webkit- form,
//      ...) with equal specificity and importance, and different values, the
//      relative document order must be the same in both files. This is checked
//      across ALL at-rule contexts: a @media block can apply together with the
//      rules outside it, so its order matters too. (Stricter than W6-D9's
//      same-context version.) It does not ask whether the two selectors can
//      match the same element, so it can only over-report. For the box
//      families (margin, padding, inset, scroll-margin/-padding, border
//      width/style/color) a pair only counts if the two declarations set a
//      common physical longhand to different values: shorthands are expanded
//      (1-4 values; logical block/inline sides in both writing directions),
//      and zero lengths compare equal (0 = 0px = 0rem).
// @keyframes blocks are compared as whole blocks.
// Pair with cssequiv.cjs (same rule structure) and a prefix-family count.
const fs = require('fs');
const path = require('path');
const req = m => require(require.resolve(m, { paths: [process.cwd()] }));
const postcss = req('postcss');
const parser = req('postcss-selector-parser');

const unprefix = p => p.replace(/^-(webkit|moz|ms|o)-/, '');
const FAMILIES = [
  [/^margin/, 'margin'], [/^padding/, 'padding'], [/^(inset|top|right|bottom|left)(-|$)/, 'inset'],
  [/^border-(.*-)?radius$/, 'border-radius'],
  [/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-(width|style|color))?$/, 'border'],
  [/^border-image/, 'border'], [/^background/, 'background'], [/^(font(-|$)|line-height$)/, 'font'],
  [/^flex(-|$)/, 'flex'], [/^grid(-|$)/, 'grid'], [/^transition/, 'transition'], [/^animation/, 'animation'],
  [/^list-style/, 'list-style'], [/^outline(-(width|style|color|offset))?$/, 'outline'], [/^overflow/, 'overflow'],
  [/^text-decoration/, 'text-decoration'], [/^column(s|-width|-count)$/, 'columns'],
  [/^(place-items|align-items|justify-items)$/, 'place-items'], [/^(place-content|align-content|justify-content)$/, 'place-content'],
  [/^(place-self|align-self|justify-self)$/, 'place-self'], [/^mask/, 'mask'], [/^(gap|row-gap|column-gap|grid-gap)$/, 'gap'],
  [/^scroll-margin/, 'scroll-margin'], [/^scroll-padding/, 'scroll-padding'], [/^overscroll-behavior/, 'overscroll'],
  [/^container/, 'container'], [/^text-emphasis/, 'text-emphasis'], [/^(width|min-width|max-width|inline-size)$/, 'width'],
  [/^(height|min-height|max-height|block-size)$/, 'height'],
];
const family = p => { if (p.startsWith('--')) return p; const u = unprefix(p.toLowerCase()); for (const [re, f] of FAMILIES) if (re.test(u)) return f; return u; };

// Box shorthands -> physical longhands. Returns [ltrMap, rtlMap] or null.
const SIDES = ['top', 'right', 'bottom', 'left'];
const zero = v => (/^-?0(\.0+)?([a-z%]+)?$/i.test(v) ? '0' : v);
function splitTop(v) { const out = []; let depth = 0, cur = ''; for (const ch of v.trim()) { if (ch === '(') depth++; if (ch === ')') depth--; if (/\s/.test(ch) && depth === 0) { if (cur) out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; }
function boxLonghands(prop, value) {
  const u = unprefix(prop);
  const m = u.match(/^(margin|padding|inset|scroll-margin|scroll-padding|border(?:-(?:width|style|color))?)(?:-(top|right|bottom|left|block|inline)(?:-(start|end))?)?(?:-(width|style|color))?$/);
  if (!m) return null;
  let [, base, side, se, bsub] = m;
  if (base === 'border' && !bsub && !/-(width|style|color)$/.test(base)) {
    if (!side) return null; // plain `border` / `border-top`: not a box list; leave to the family rule
  }
  const key = base === 'inset' ? 'inset' : base + (bsub ? '-' + bsub : '');
  const vals = splitTop(value.replace(/!important/, '')).map(zero);
  const put = (map, s, v) => { map[`${key}:${s}`] = v; };
  const build = dir => {
    const map = {};
    const inl = dir === 'ltr' ? ['left', 'right'] : ['right', 'left'];
    if (!side) { if (vals.length < 1 || vals.length > 4) return null; const [t, r = t, b = t, l = r] = vals; [t, r, b, l].forEach((v, i) => put(map, SIDES[i], v)); }
    else if (SIDES.includes(side)) put(map, side, vals.join(' '));
    else if (side === 'block') { if (se) put(map, se === 'start' ? 'top' : 'bottom', vals.join(' ')); else { const [a, b = a] = vals; put(map, 'top', a); put(map, 'bottom', b); } }
    else if (side === 'inline') { if (se) put(map, se === 'start' ? inl[0] : inl[1], vals.join(' ')); else { const [a, b = a] = vals; put(map, inl[0], a); put(map, inl[1], b); } }
    return map;
  };
  const l = build('ltr'), r = build('rtl');
  return l && r ? [l, r] : null;
}
// Does the relative order of x and y matter at all?
function conflicts(x, y) {
  const bx = boxLonghands(x.prop, x.value), by = boxLonghands(y.prop, y.value);
  if (!bx || !by) return !(x.prop === y.prop && x.value === y.value);
  for (const d of [0, 1]) for (const [k, v] of Object.entries(bx[d])) if (k in by[d] && by[d][k] !== v) return true;
  return false;
}

function specificity(sel) {
  const walk = nodes => {
    let a = 0, b = 0, c = 0;
    for (const n of nodes) {
      if (n.type === 'id') a++;
      else if (n.type === 'class' || n.type === 'attribute') b++;
      else if (n.type === 'tag' && n.value !== '*') c++;
      else if (n.type === 'pseudo') {
        const v = n.value.toLowerCase();
        if (v === ':where') continue;
        if ([':is', ':not', ':has', ':matches', ':-webkit-any', ':-moz-any'].includes(v)) {
          let best = [0, 0, 0];
          for (const s of n.nodes) { const r = walk(s.nodes); if (cmp(r, best) > 0) best = r; }
          a += best[0]; b += best[1]; c += best[2];
        } else if (v.startsWith('::') || [':before', ':after', ':first-line', ':first-letter'].includes(v)) c++;
        else b++;
      }
    }
    return [a, b, c];
  };
  let out = [0, 0, 0];
  parser(root => { out = walk(root.nodes[0].nodes); }).processSync(sel);
  return out;
}
const cmp = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);

function load(file) {
  const root = postcss.parse(fs.readFileSync(file, 'utf8'));
  const decls = []; const keyframes = [];
  let order = 0;
  root.walkRules(rule => {
    let ctx = [], kf = null;
    for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
      if (p.type === 'atrule') { if (/keyframes$/i.test(p.name)) kf = p; ctx.unshift(`@${p.name} ${p.params}`); }
    }
    if (kf) return;
    const c = ctx.join(' > ');
    for (const n of rule.nodes) {
      if (n.type !== 'decl') continue;
      const o = order++;
      for (const sel of rule.selectors) {
        const s = sel.trim().replace(/\s+/g, ' ');
        decls.push({ ctx: c, sel: s, prop: n.prop.toLowerCase(), value: n.value.replace(/\s+/g, ' ').trim(), imp: !!n.important, order: o, spec: specificity(s) });
      }
    }
  });
  root.walkAtRules(/keyframes$/i, a => keyframes.push(`@${a.name} ${a.params}{${a.nodes.map(r => r.toString().replace(/\s+/g, ' ')).join('')}}`));
  return { decls, keyframes };
}

const [a, b, flag] = process.argv.slice(2);
const A = load(a), B = load(b);
const keyOf = d => `${d.ctx} | ${d.sel} | ${d.prop}: ${d.value}${d.imp ? ' !important' : ''}`;
// occurrence-numbered keys
const number = list => { const seen = {}; return list.map(d => { const k = keyOf(d); seen[k] = (seen[k] || 0) + 1; return { ...d, key: `${k} #${seen[k]}` }; }); };
const da = number(A.decls), db = number(B.decls);
const inB = new Map(db.map(d => [d.key, d])); const inA = new Map(da.map(d => [d.key, d]));
const onlyOld = da.filter(d => !inB.has(d.key)), onlyNew = db.filter(d => !inA.has(d.key));
const shared = da.filter(d => inB.has(d.key));

let pairs = 0; const violations = [];
const byFam = {};
for (const d of shared) (byFam[family(d.prop)] ||= []).push(d);
for (const [fam, list] of Object.entries(byFam)) {
  // bucket by (specificity, importance): only equal ones can be decided by order
  const buckets = {};
  for (const d of list) (buckets[`${d.spec.join(',')}|${d.imp}`] ||= []).push(d);
  for (const bucket of Object.values(buckets)) {
    for (let i = 0; i < bucket.length; i++) for (let j = i + 1; j < bucket.length; j++) {
      const x = bucket[i], y = bucket[j];
      if (x.order === y.order) continue; // same declaration, two selectors of one rule
      if (!conflicts(x, y)) continue;
      pairs++;
      const nx = inB.get(x.key).order, ny = inB.get(y.key).order;
      if (Math.sign(x.order - y.order) !== Math.sign(nx - ny)) violations.push({ fam, x, y });
    }
  }
}
const kfSame = JSON.stringify(A.keyframes) === JSON.stringify(B.keyframes);
const ok = !violations.length && !onlyOld.length && !onlyNew.length && kfSame;
console.log(`cascade3 ${path.basename(b)}: ${shared.length} shared declarations, ${pairs} equal-specificity pairs checked, ${violations.length} order change(s); only-old ${onlyOld.length}, only-new ${onlyNew.length}; keyframes ${kfSame ? 'same' : 'DIFFER'} => ${ok ? 'PRESERVED' : (violations.length || !kfSame ? 'CHECK' : 'PRESERVED except the listed declarations')}`);
const show = flag === '--list' ? 1e9 : 8;
for (const v of violations.slice(0, show)) console.log(`  order [${v.fam}] spec ${v.x.spec.join(',')}: ${keyOf(v.x)}  <->  ${keyOf(v.y)}`);
for (const d of onlyOld.slice(0, show)) console.log(`  only old: ${keyOf(d)}`);
for (const d of onlyNew.slice(0, show)) console.log(`  only new: ${keyOf(d)}`);
process.exit(violations.length || !kfSame ? 2 : (onlyOld.length || onlyNew.length ? 1 : 0));
