// rtcond.cjs <baseline js dir> <new js dir> <module id>...  (run from the theme root)
// (hop 24, 5.4.7 stage 1) For every entry that still loads js/common (waits on its chunk id), evaluate
// each differing common.js module in the old and the new build with that
// entry's runtime id (r.j) and compare what the module exports.
const fs = require('fs'), path = require('path');
const { pieces } = require(process.cwd() + '/.claude/gesso-harness/canon.cjs');
const [oldDir, newDir, ...mods] = process.argv.slice(2);
const commonId = s => (s.match(/self\.webpackChunk\w+=self\.webpackChunk\w+\|\|\[\]\)\.push\(\[\[(\d+)\]/) || [])[1];
const cid = commonId(fs.readFileSync(path.join(newDir, 'common.js'), 'utf8'));
const users = d => fs.readdirSync(d).filter(f => f !== 'common.js' && f.endsWith('.js')).map(f => {
  const s = fs.readFileSync(path.join(d, f), 'utf8');
  const j = (s.match(/\.j=(\d+)/) || [])[1];
  const waits = new RegExp(`\\.O\\(void 0,\\[([0-9,]*)\\]`).exec(s);
  return { f, j, waits: waits ? waits[1].split(',').includes(cid) : false };
});
const nu = users(newDir).filter(u => u.waits), ou = users(oldDir).filter(u => u.waits);
console.log(`common chunk id ${cid}; entries waiting on it: old ${ou.length}, new ${nu.length}`);
console.log('new set:', nu.map(u => `${u.f.replace('.es6.js', '')}(${u.j})`).join(' '));
const ev = (src, j) => {
  const e = {}, r = { j, d(t, arr) { for (let i = 0; i < arr.length;) { const n = arr[i++], k = arr[i++]; t[n] = k === 0 ? arr[i++] : k(); } } };
  (0, eval)('(' + src + ')')({}, e, r);
  return JSON.stringify(e, (k, v) => typeof v === 'function' ? 'fn:' + v.toString() : v === undefined ? '<undefined>' : v);
};
const O = pieces(path.join(oldDir, 'common.js')).table, N = pieces(path.join(newDir, 'common.js')).table;
let bad = 0;
for (const m of mods) for (const u of nu) {
  const a = ev(O[m], Number(u.j)), b = ev(N[m], Number(u.j));
  if (a !== b) { bad++; console.log(`  !! module ${m}, runtime ${u.j} (${u.f}): exports differ`); }
}
for (const m of mods) console.log(`module ${m}: ${bad ? 'see above' : `same exports for all ${nu.length} runtimes`}`);
