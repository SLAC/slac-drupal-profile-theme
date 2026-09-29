#!/usr/bin/env node
// cssequiv.cjs <old.css> <new.css>  (run from the theme root; uses its postcss)
//
// Is a reformatted stylesheet equivalent? For every rule, matched by its
// at-rule context + selector + occurrence:
//   1. the multiset of declarations (property, value, !important) must match,
//      with 1-4-value box shorthands normalised (margin: 2rem 0 2rem == 2rem 0);
//   2. any two declarations that set an overlapping longhand (same shorthand
//      family: margin/margin-top, border/border-color, font/line-height, a
//      property and its -webkit- form, ...) must keep their relative order.
// Rules themselves must appear in the same order. If all three hold, no
// element's computed value can differ. It says nothing about cross-rule
// cascade moves (use cascade3 for Sass mixed-decls regrouping).
// Described in W6-D9's STATE (used for its stylelint 16 reformatting; its first
// version over-reported by putting border-radius in the border family).
const fs = require('fs');
const path = require('path');
const postcss = require(require.resolve('postcss', { paths: [process.cwd()] }));

const unprefix = p => p.replace(/^-(webkit|moz|ms|o)-/, '');
const FAMILIES = [
  [/^margin/, 'margin'], [/^padding/, 'padding'], [/^(inset|top|right|bottom|left)(-|$)/, 'inset'],
  [/^border-(.*-)?radius$/, 'border-radius'],
  [/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-(width|style|color))?$/, 'border'],
  [/^border-image/, 'border'], [/^background/, 'background'], [/^(font(-|$)|line-height$)/, 'font'],
  [/^flex(-|$)/, 'flex'], [/^grid(-|$)/, 'grid'], [/^transition/, 'transition'], [/^animation/, 'animation'],
  [/^list-style/, 'list-style'], [/^outline(-(width|style|color))?$/, 'outline'], [/^overflow/, 'overflow'],
  [/^text-decoration/, 'text-decoration'], [/^column(s|-width|-count)$/, 'columns'],
  [/^(place-items|align-items|justify-items)$/, 'place-items'], [/^(place-content|align-content|justify-content)$/, 'place-content'],
  [/^(place-self|align-self|justify-self)$/, 'place-self'], [/^mask/, 'mask'], [/^(gap|row-gap|column-gap|grid-gap)$/, 'gap'],
  [/^scroll-margin/, 'scroll-margin'], [/^scroll-padding/, 'scroll-padding'], [/^overscroll-behavior/, 'overscroll'],
  [/^container/, 'container'], [/^text-emphasis/, 'text-emphasis'],
];
const family = p => { const u = unprefix(p.toLowerCase()); for (const [re, f] of FAMILIES) if (re.test(u)) return f; return u; };
const BOX = /^(margin|padding|inset|border-width|border-style|border-color|scroll-margin|scroll-padding)$/;
function splitTop(v) { // split on top-level whitespace (not inside parens)
  const out = []; let depth = 0, cur = '';
  for (const ch of v.trim()) {
    if (ch === '(') depth++; if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) { if (cur) out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) out.push(cur); return out;
}
function norm(prop, value) {
  const p = prop.toLowerCase(), v = value.replace(/\s+/g, ' ').trim();
  if (BOX.test(unprefix(p))) {
    const parts = splitTop(v);
    if (parts.length >= 1 && parts.length <= 4 && !v.includes('!')) {
      const [t, r = t, b = t, l = r] = parts; return `${p}:${[t, r, b, l].join(' ')}`;
    }
  }
  return `${p}:${v}`;
}
function rules(file) {
  const root = postcss.parse(fs.readFileSync(file, 'utf8'));
  const out = []; const seen = {};
  root.walkRules(rule => {
    const ctx = []; for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') ctx.unshift(`@${p.name} ${p.params}`);
    const base = `${ctx.join(' > ')} | ${rule.selector}`; seen[base] = (seen[base] || 0) + 1;
    const decls = rule.nodes.filter(n => n.type === 'decl').map(d => ({ key: norm(d.prop, d.value) + (d.important ? '!' : ''), fam: family(d.prop) }));
    out.push({ key: `${base} #${seen[base]}`, decls });
  });
  return out;
}
const [a, b] = process.argv.slice(2);
const ra = rules(a), rb = rules(b);
let problems = [];
if (ra.length !== rb.length || ra.some((r, i) => r.key !== rb[i].key)) {
  const ka = ra.map(r => r.key), kb = rb.map(r => r.key);
  const missing = ka.filter(k => !kb.includes(k)), extra = kb.filter(k => !ka.includes(k));
  problems.push(`rule sequence differs (${ra.length} vs ${rb.length} rules; ${missing.length} only in old, ${extra.length} only in new${!missing.length && !extra.length ? '; same rules, different order' : ''})`);
  missing.slice(0, 5).forEach(k => problems.push(`  only old: ${k}`)); extra.slice(0, 5).forEach(k => problems.push(`  only new: ${k}`));
}
const byKey = new Map(rb.map(r => [r.key, r]));
let compared = 0, reordered = 0;
for (const r of ra) {
  const s = byKey.get(r.key); if (!s) continue; compared++;
  const ms = x => x.decls.map(d => d.key).sort().join('\n');
  if (ms(r) !== ms(s)) { problems.push(`declarations differ: ${r.key}\n    old: ${r.decls.map(d => d.key).join('; ')}\n    new: ${s.decls.map(d => d.key).join('; ')}`); continue; }
  if (r.decls.map(d => d.key).join('\n') !== s.decls.map(d => d.key).join('\n')) reordered++;
  // relative order within each family must be preserved
  const fams = new Set(r.decls.map(d => d.fam));
  for (const f of fams) {
    const oa = r.decls.filter(d => d.fam === f).map(d => d.key).join('\n');
    const ob = s.decls.filter(d => d.fam === f).map(d => d.key).join('\n');
    if (oa !== ob) problems.push(`order changed within family '${f}': ${r.key}\n    old: ${oa.replace(/\n/g, '; ')}\n    new: ${ob.replace(/\n/g, '; ')}`);
  }
}
console.log(`cssequiv ${path.basename(b)}: ${compared} rules compared, ${reordered} with declarations reordered, ${problems.length ? problems.length + ' problem(s)' : 'EQUIVALENT'}`);
problems.slice(0, 20).forEach(p => console.log('  ' + p));
process.exit(problems.length ? 1 : 0);
