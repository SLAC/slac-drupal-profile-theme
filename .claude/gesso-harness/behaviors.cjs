// Functional equivalence check for dist/js when bytes legitimately change
// (ESM conversion, Babel -> SWC, minifier/webpack runtime bumps).
//
// Loads dist/js/common.js and then each entry file in a vm context with
// stubbed Drupal, drupalSettings, jQuery, once and DOM globals, and records
// which Drupal.behaviors each entry registers (plus any load error).
//
//   node .claude/gesso-harness/behaviors.cjs <dist/js dir>            -> JSON map
//   node .claude/gesso-harness/behaviors.cjs <baseline js dir> <dist/js dir>
//                                                                      -> diff report
//
// Blind spot (same as W6-D9's): entries that register NO behavior (at the
// 5.4.6 tip: MegaMenu, SearchFlyout, YurtsHelpers, addtocal-a11y, alert-bar)
// compare equal trivially -- pair this with an AST comparison for those.
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// A value that absorbs any property access, call or construction.
function deep() {
  const f = function () { return deep(); };
  return new Proxy(f, {
    get: (t, k) => {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === 'length') return 0;
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      return deep();
    },
    apply: () => deep(),
    construct: () => deep(),
  });
}

function observer() { return { observe() {}, unobserve() {}, disconnect() {} }; }

function scan(dir) {
  const res = {};
  const common = path.join(dir, 'common.js');
  const entries = fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') && f !== 'common.js')
    .sort();
  for (const f of entries) {
    const Drupal = { behaviors: {}, t: s => s, theme: deep(), announce: () => {}, debounce: fn => fn };
    const win = {
      Drupal,
      drupalSettings: { gesso: { gessoImagePath: '' }, path: {} },
      once: () => [],
      jQuery: deep(),
      console: { log() {}, warn() {}, error() {} },
      // currentScript is a real-looking <script>: webpack >= 5.9x's auto
      // publicPath checks its tagName (hop 19); everything else is the proxy.
      document: (() => { const d = deep(); const cs = { tagName: 'SCRIPT', src: 'https://example.test/themes/slac/dist/js/entry.js' };
        return new Proxy({}, { get: (_, k) => (k === 'currentScript' ? cs : d[k]) }); })(),
      navigator: { userAgent: '' },
      setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
      requestAnimationFrame: () => 0,
      matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
      getComputedStyle: () => deep(),
      HTMLElement: function () {}, Element: function () {}, Node: function () {},
      Event: function () {}, CustomEvent: function () {},
      MutationObserver: observer, IntersectionObserver: observer, ResizeObserver: observer,
      localStorage: { getItem() { return null; }, setItem() {} },
      location: { href: '', hash: '', search: '' },
      history: {},
      addEventListener() {}, removeEventListener() {},
      innerWidth: 1200,
      Math, JSON, Object, Array, Promise, Symbol, Map, Set, WeakMap, Reflect,
      Error, TypeError, Date, RegExp, Number, String, Boolean, parseInt, parseFloat, isNaN,
    };
    win.window = win; win.self = win; win.globalThis = win;
    const ctx = vm.createContext(win);
    let err = null;
    if (fs.existsSync(common)) {
      try { vm.runInContext(fs.readFileSync(common, 'utf8'), ctx); } catch (e) { /* runtime only */ }
    }
    try {
      vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx);
    } catch (e) {
      err = String(e && e.message).slice(0, 120);
    }
    res[f] = { behaviors: Object.keys(Drupal.behaviors).sort(), err };
  }
  return res;
}

const [a, b] = process.argv.slice(2);
if (!a) {
  console.error('usage: behaviors.cjs <js dir> [<js dir to compare>]');
  process.exit(2);
}
if (!b) {
  console.log(JSON.stringify(scan(a), null, 1));
  process.exit(0);
}
const A = scan(a), B = scan(b);
const names = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort();
let same = 0, silent = 0;
const out = [];
for (const n of names) {
  if (!A[n]) { out.push(`+ only in ${b}: ${n} ${JSON.stringify(B[n])}`); continue; }
  if (!B[n]) { out.push(`- only in ${a}: ${n} ${JSON.stringify(A[n])}`); continue; }
  const eq = JSON.stringify(A[n].behaviors) === JSON.stringify(B[n].behaviors);
  if (B[n].err && !A[n].err) out.push(`!! ${n}: new load error: ${B[n].err}`);
  if (!eq) out.push(`!! ${n}: ${A[n].behaviors.join(',') || '(none)'} -> ${B[n].behaviors.join(',') || '(none)'}`);
  else { same++; if (!A[n].behaviors.length) silent++; }
}
console.log(`behaviors: ${same}/${names.length} entries identical (${silent} register no behavior -- check those by AST)`);
if (out.length) console.log(out.join('\n'));
process.exit(out.some(l => l.startsWith('!!') || l.startsWith('-')) ? 1 : 0);
