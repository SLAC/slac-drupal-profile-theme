// rendercheck.browser.js: render every story of a static Storybook build and
// fingerprint its DOM. (Hop 22 s2, for Twig 1 -> 3: Twig renders in the
// browser, so a green build-storybook proves nothing about it. Post-upgrade
// item 2: feature counts and several builds from one origin.)
//
// Usage:
//   1. serve the build(s): one build at the root, or several side by side from
//      one directory (e.g. ref/ = the Storybook 6.5 reference, before/, after/),
//      with python3 -m http.server <port> --bind 127.0.0.1
//   2. open any page of that origin in the browser pane, run this file's
//      contents (javascript_tool), then call, for example,
//        __rcRun('before', 'before/index.json')   // or __rcRun('', '/index.json')
//      and poll ({n: __rc.before.n, done: __rc.before.done}) until done.
//      The id list can come from another build's index.json (Storybook 6.5
//      writes none).
//   3. read __rc[<name>].res: { [storyId]: { err, len, hash, f: {feature counts} } }.
//      `err` is true for Storybook's error display, 'timeout' if nothing
//      rendered in 8 s. `hash` is over the root's innerHTML with unique_id
//      suffixes (--<hex>) masked. FEATURES counts behaviour-produced markup.
//      Run it in the fronted tab: hidden tabs throttle timers, and the
//      MessageChannel fallback starves the page if several sweeps spin at once.
//   4. __rcRun(name, indexUrl, ids, { classes: true }) also records each
//      story's set of class names, and every run is saved to localStorage
//      ('rc:' + name), which all tabs of the origin share. In any tab,
//      __rcCompare('ref', 'after') lists, per story, the classes the first
//      build renders that the second does not (and errors/timeouts).
window.__rc = window.__rc || {};
const __tick = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
// Foreground: plain timers. Hidden: MessageChannel ticks (Chrome clamps chained
// timers in hidden tabs), which spin the CPU: run one hidden sweep at a time.
const __sleep = async ms => {
  if (document.visibilityState === 'visible') return new Promise(r => setTimeout(r, ms));
  const end = performance.now() + ms; while (performance.now() < end) await __tick();
};
window.FEATURES = {
  arrowWord: /c-arrow-link__word/g,
  extWord: /external-link__word/g,
  once: /data-once="/g,
};
window.__rcRun = async (name, indexUrl, ids, opts = {}) => {
  const run = (__rc[name] = { done: false, res: {}, n: 0, total: 0 });
  const base = name ? `${name}/` : '';
  if (!ids) {
    const idx = await (await fetch(indexUrl)).json();
    ids = Object.values(idx.entries).filter(e => e.type === 'story').map(e => e.id);
  }
  run.total = ids.length;
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:900px;opacity:0.01;z-index:-1;pointer-events:none';
  document.body.appendChild(f);
  for (const id of ids) {
    await new Promise(r => { f.onload = r; f.src = `${base}iframe.html?id=${encodeURIComponent(id)}&viewMode=story`; });
    const d = f.contentDocument;
    const rootOf = () => d.getElementById('storybook-root') || d.getElementById('root');
    let out = null;
    for (let t = 0; t < 80; t++) {
      await __sleep(100);
      const root = rootOf();
      const err = d.body && d.body.classList.contains('sb-show-errordisplay');
      if (err || (root && root.innerHTML.length > 0 && d.body.classList.contains('sb-show-main'))) {
        // Drupal behaviours attach in a React effect after the first render:
        // wait until the root's HTML has been stable for 600 ms (at least
        // 1 s after it first appeared, at most 8 s), or snapshots miss them.
        const t0 = performance.now(); let last = -1, since = performance.now();
        while (performance.now() - t0 < 8000) {
          await __sleep(100);
          const len = (rootOf() || { innerHTML: '' }).innerHTML.length;
          if (len !== last) { last = len; since = performance.now(); }
          else if (performance.now() - since >= 600 && performance.now() - t0 >= 1000) break;
        }
        out = {
          err,
          html: err
            ? ((d.querySelector('#error-message') || {}).innerText || '') + ' ' + ((d.querySelector('#error-stack') || {}).innerText || '').slice(0, 200)
            : rootOf().innerHTML,
        };
        break;
      }
    }
    if (!out) out = { err: 'timeout', html: '' };
    const h = out.html.replace(/--[0-9a-f]{8,}/g, '--ID');
    let hash = 0;
    for (let i = 0; i < h.length; i++) hash = (hash * 31 + h.charCodeAt(i)) | 0;
    const fc = {};
    for (const [k, re] of Object.entries(FEATURES)) fc[k] = out.err ? 0 : (out.html.match(re) || []).length;
    run.res[id] = { err: out.err, len: h.length, hash, f: fc, msg: out.err ? out.html.slice(0, 300) : '' };
    if (opts.classes && !out.err) {
      const cls = new Set();
      for (const m of out.html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) cls.add(c);
      run.res[id].cls = [...cls].sort();
    }
    run.n++;
  }
  f.remove();
  run.done = true;
  try { localStorage.setItem(`rc:${name}`, JSON.stringify(run.res)); } catch (e) { run.saveError = String(e); }
};
window.__rcCompare = (a, b) => {
  const A = JSON.parse(localStorage.getItem(`rc:${a}`)), B = JSON.parse(localStorage.getItem(`rc:${b}`));
  const out = { missing: {}, errors: {}, onlyA: [], onlyB: [] };
  for (const [id, r] of Object.entries(A)) {
    const q = B[id];
    if (!q) { out.onlyA.push(id); continue; }
    if (r.err || q.err) { if (String(r.err) !== String(q.err)) out.errors[id] = `${a}: ${r.err} / ${b}: ${q.err}`; continue; }
    if (r.cls && q.cls) { const qs = new Set(q.cls); const miss = r.cls.filter(c => !qs.has(c)); if (miss.length) out.missing[id] = miss; }
  }
  out.onlyB = Object.keys(B).filter(id => !(id in A));
  return out;
};
'rendercheck loaded';
