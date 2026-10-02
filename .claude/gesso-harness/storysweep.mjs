#!/usr/bin/env node
// storysweep.mjs <origin> <build> <out.json> [--ids ids.json] [--port 9340]
// Headless version of rendercheck.browser.js (post-upgrade items 2-7): render
// every story of a static Storybook build in one headless Chrome, driven over
// the DevTools protocol (Node 22's built-in WebSocket; no packages), and record
// per story: { err, len, hash, f: {feature counts}, cls: [class names], attach: [ms] }.
//   origin: where the build is served, e.g. http://127.0.0.1:8780 with the build
//     in <origin>/<build>/ (python3 -m http.server 8780 --bind 127.0.0.1)
//   --ids: story ids (JSON array); default the build's own index.json. Storybook
//     6.5 writes none, so sweep it with another build's list.
// Waits until the root's HTML has been stable for 1 s (at least 3 s after load,
// at most 10 s): behaviours attach in an effect after the first render, and
// some stories rebuild markup ~2 s in. `attach` lists when Drupal.attachBehaviors()
// ran (ms after navigation start), wrapped by a script injected before the page's
// own. `hash` is over the root's innerHTML with unique_id suffixes masked.
// --timing: only for `attach` (stop 300 ms after the first call, or 8 s after
// navigation); run it alone, as parallel sweeps slow each other down.
// Several builds can be swept at once, one process (and --port) each.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [origin, build, outFile, ...rest] = process.argv.slice(2);
const opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const port = +(opt('--port') || 9340);
const timing = rest.includes('--timing');
const ids = opt('--ids')
  ? JSON.parse(fs.readFileSync(opt('--ids'), 'utf8'))
  : Object.values((await (await fetch(`${origin}/${build}/index.json`)).json()).entries).filter(e => e.type === 'story').map(e => e.id);
const FEATURES = { arrowWord: 'c-arrow-link__word', extWord: 'external-link__word', once: 'data-once="' };
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(path.dirname(path.resolve(outFile)), '.storysweep-profile-'));
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 50; i++) { await sleep(200); try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch {} }
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let seq = 0; const pending = new Map(); const listeners = [];
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else if (m.method) listeners.forEach(l => l(m)); };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = method => new Promise(r => { const l = m => { if (m.method === method) { listeners.splice(listeners.indexOf(l), 1); r(m.params); } }; listeners.push(l); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
// Wrap Drupal.attachBehaviors as soon as the stub assigns window.Drupal.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
  const log = (window.__attachLog = []); let D;
  Object.defineProperty(window, 'Drupal', { configurable: true, get() { return D; }, set(v) {
    D = v; if (!D) return; let ab = D.attachBehaviors;
    Object.defineProperty(D, 'attachBehaviors', { configurable: true, get() { return ab && function (...a) { log.push(performance.now()); return ab.apply(this, a); }; }, set(f) { ab = f; } });
  } });
})();` });
const CAPTURE = `(async () => {
  const rootOf = () => document.getElementById('storybook-root') || document.getElementById('root');
  const t0 = performance.now(); let last = -1, since = performance.now();
  while (performance.now() - t0 < 10000) {
    await new Promise(r => setTimeout(r, ${timing ? 20 : 100}));
    if (document.body && document.body.classList.contains('sb-show-errordisplay')) break;
    ${timing ? "const log = window.__attachLog || []; if (log.length && performance.now() - log[0] > 300) break; if (performance.now() > 8000) break;" : ''}
    const len = (rootOf() || { innerHTML: '' }).innerHTML.length;
    if (len !== last) { last = len; since = performance.now(); }
    else if (len > 0 && performance.now() - since >= 1000 && performance.now() - t0 >= 3000) break;
  }
  const err = document.body.classList.contains('sb-show-errordisplay');
  const html = err
    ? ((document.querySelector('#error-message') || {}).innerText || '') + ' ' + ((document.querySelector('#error-stack') || {}).innerText || '').slice(0, 200)
    : (rootOf() || { innerHTML: '' }).innerHTML;
  return { err, html, attach: (window.__attachLog || []).map(Math.round) };
})()`;
const out = {};
let n = 0;
for (const id of ids) {
  n++;
  try {
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `${origin}/${build}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story` });
    await Promise.race([loaded, sleep(15000)]);
    const r = await evaluate(CAPTURE);
    const empty = !r.err && !r.html;
    const h = r.html.replace(/--[0-9a-f]{8,}/g, '--ID');
    let hash = 0; for (let i = 0; i < h.length; i++) hash = (hash * 31 + h.charCodeAt(i)) | 0;
    const f = {}; for (const [k, s] of Object.entries(FEATURES)) f[k] = r.err ? 0 : r.html.split(s).length - 1;
    const cls = new Set(); if (!r.err) for (const m of r.html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) cls.add(c);
    out[id] = { err: r.err || (empty ? 'empty' : false), len: h.length, hash, f, cls: [...cls].sort(), attach: r.attach, msg: r.err ? r.html.slice(0, 300) : '' };
  } catch (e) { out[id] = { err: 'error', msg: String(e) }; }
  if (n % 10 === 0 || n === ids.length) { fs.writeFileSync(outFile, JSON.stringify(out)); process.stdout.write(`${build} ${n}/${ids.length}\n`); }
}
console.log(`storysweep ${build}: ${ids.length} stories, ${Object.values(out).filter(v => v.err).length} errors -> ${outFile}`);
ws.close();
const exited = new Promise(r => chrome.once('exit', r));
chrome.kill();
await exited;
fs.rmSync(profile, { recursive: true, force: true });
