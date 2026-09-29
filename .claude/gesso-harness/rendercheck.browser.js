// rendercheck.browser.js: render every story of a static Storybook build and
// fingerprint its DOM. (Hop 22 s2, for Twig 1 -> 3: Twig renders in the
// browser, so a green build-storybook proves nothing about it.)
//
// Usage:
//   1. serve a build: (cd storybook && python3 -m http.server 8772 --bind 127.0.0.1)
//      (copy the build aside first when comparing two toolchains)
//   2. open http://127.0.0.1:8772/index.html in the browser pane, run this
//      file's contents in the page (javascript_tool), then poll
//      ({n: __rc.n, total: __rc.total, done: __rc.done}) until done.
//   3. read __rc.res: { [storyId]: { err, len, hash, msg } }. `err` is true for
//      Storybook's error display (msg = its message), 'timeout' if nothing
//      rendered in 8 s. `hash` is over #storybook-root's innerHTML with
//      unique_id suffixes (--<hex>) masked, so two builds can be compared id
//      by id. Background tabs throttle timers: expect 2-3 s per story.
window.__rc = { done: false, res: {}, n: 0, total: 0 };
(async () => {
  const idx = await (await fetch('/index.json')).json();
  const ids = Object.values(idx.entries).filter(e => e.type === 'story').map(e => e.id);
  __rc.total = ids.length;
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:900px;opacity:0.01;z-index:-1;pointer-events:none';
  document.body.appendChild(f);
  for (const id of ids) {
    await new Promise(r => { f.onload = r; f.src = `/iframe.html?id=${encodeURIComponent(id)}&viewMode=story`; });
    const d = f.contentDocument;
    let out = null;
    for (let t = 0; t < 80; t++) {
      await new Promise(r => setTimeout(r, 100));
      const root = d.getElementById('storybook-root');
      const err = d.body && d.body.classList.contains('sb-show-errordisplay');
      if (err || (root && root.innerHTML.length > 0 && d.body.classList.contains('sb-show-main'))) {
        await new Promise(r => setTimeout(r, 300));
        out = {
          err,
          html: err
            ? ((d.querySelector('#error-message') || {}).innerText || '') + ' ' + ((d.querySelector('#error-stack') || {}).innerText || '').slice(0, 200)
            : d.getElementById('storybook-root').innerHTML,
        };
        break;
      }
    }
    if (!out) out = { err: 'timeout', html: '' };
    const h = out.html.replace(/--[0-9a-f]{8,}/g, '--ID');
    let hash = 0;
    for (let i = 0; i < h.length; i++) hash = (hash * 31 + h.charCodeAt(i)) | 0;
    __rc.res[id] = { err: out.err, len: h.length, hash, msg: out.err ? out.html.slice(0, 300) : '' };
    __rc.n++;
  }
  __rc.done = true;
})();
