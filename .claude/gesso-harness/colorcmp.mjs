#!/usr/bin/env node
// colorcmp.mjs <a.json> <b.json>  -- compare two colorsweep.mjs results.
// Per story, elements are matched by DOM order and path; prints every element
// whose computed color changed (visible or not), grouped by path and change,
// plus a contrast ratio of the new color against what is behind it.
import fs from 'node:fs';
const [fa, fb] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(fa, 'utf8')), B = JSON.parse(fs.readFileSync(fb, 'utf8'));
const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const lum = c => { const [r, g, b] = rgb(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (x, y) => { const [h, l] = [lum(x), lum(y)].sort((p, q) => q - p); return ((h + 0.05) / (l + 0.05)).toFixed(2); };
const groups = new Map(); let mism = 0, elems = 0;
for (const id of Object.keys(A)) {
  const a = A[id], b = B[id]; if (!b || a.err || b.err) continue;
  if (a.els.length !== b.els.length) { mism++; continue; }
  a.els.forEach((x, i) => { const y = b.els[i]; elems++;
    if (x.path !== y.path) { mism++; return; }
    if (x.color === y.color) return;
    const bg = y.own !== 'rgba(0, 0, 0, 0)' ? y.own : y.behind;
    const k = `${y.path.split(' > ').pop()} | ${x.color} -> ${y.color} | on ${bg} (contrast ${contrast(x.color, bg)} -> ${contrast(y.color, bg)})${y.visible ? '' : ' | NOT VISIBLE'}`;
    if (!groups.has(k)) groups.set(k, []); groups.get(k).push(id);
  });
}
console.log(`${Object.keys(A).length} stories, ${elems} elements compared, ${mism} structural mismatches`);
for (const [k, ids] of [...groups].sort((p, q) => q[1].length - p[1].length)) console.log(`${String(ids.length).padStart(4)}  ${k}\n        e.g. ${[...new Set(ids)].slice(0, 4).join(', ')}`);
if (!groups.size) console.log('no computed color changed');
