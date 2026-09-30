#!/usr/bin/env node
// sweepcmp.mjs <ref.json> <build.json> [--list]
// Compare two storysweep.mjs results (ref = usually the Storybook 6.5 reference):
//   - errors in each, and stories that error in one only
//   - per FEATURES key: stories where ref has the markup and build has none
//   - stories where build is missing a class that ref renders (both rendered)
//   - Drupal.attachBehaviors timing in build: first call, stories over 1 s,
//     stories with no call or more than one
import fs from 'node:fs';

const [a, b, flag] = process.argv.slice(2);
const R = JSON.parse(fs.readFileSync(a, 'utf8')), B = JSON.parse(fs.readFileSync(b, 'utf8'));
const list = flag === '--list';
const ok = (x, id) => x[id] && !x[id].err;
const ids = Object.keys(R).filter(id => id in B);
const out = [];
const errR = ids.filter(id => R[id].err), errB = ids.filter(id => B[id].err);
out.push(`errors: ref ${errR.length}, build ${errB.length}; only in build: ${errB.filter(id => !R[id].err).join(', ') || 'none'}; only in ref: ${errR.filter(id => !B[id].err).join(', ') || 'none'}`);
for (const k of Object.keys((Object.values(R).find(v => v.f) || {}).f || {})) {
  const lost = ids.filter(id => ok(R, id) && ok(B, id) && R[id].f[k] > 0 && !(B[id].f[k] > 0));
  out.push(`feature ${k}: in ref ${ids.filter(id => ok(R, id) && R[id].f[k] > 0).length} stories, in build ${ids.filter(id => ok(B, id) && B[id].f[k] > 0).length}; missing in build: ${lost.length}${list && lost.length ? ' (' + lost.join(', ') + ')' : ''}`);
}
const miss = {};
for (const id of ids) {
  if (!ok(R, id) || !ok(B, id)) continue;
  const s = new Set(B[id].cls); const m = R[id].cls.filter(c => !s.has(c));
  if (m.length) miss[id] = m;
}
out.push(`stories missing a class ref renders: ${Object.keys(miss).length}`);
if (list) for (const [id, m] of Object.entries(miss)) out.push(`  ${id}: ${m.join(' ')}`);
const firsts = ids.filter(id => ok(B, id)).map(id => [id, (B[id].attach || [])[0]]);
const none = firsts.filter(([, t]) => t === undefined).map(([id]) => id);
const slow = firsts.filter(([, t]) => t > 1000).sort((x, y) => y[1] - x[1]);
const multi = ids.filter(id => ok(B, id) && (B[id].attach || []).length > 1);
const ts = firsts.map(([, t]) => t).filter(t => t !== undefined).sort((x, y) => x - y);
const q = p => ts[Math.min(ts.length - 1, Math.floor(p * ts.length))];
out.push(`attachBehaviors first call (build): median ${q(0.5)} ms, p90 ${q(0.9)} ms, max ${ts[ts.length - 1]} ms; over 1 s: ${slow.length}${slow.length ? ' (' + slow.slice(0, list ? 1e9 : 8).map(([id, t]) => `${id} ${t}`).join(', ') + ')' : ''}; never: ${none.length}${none.length ? ' (' + none.join(', ') + ')' : ''}; more than once: ${multi.length}`);
console.log(out.join('\n'));
