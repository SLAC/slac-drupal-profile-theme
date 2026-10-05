#!/usr/bin/env node
// colorsweep.mjs <origin> <build> <out.json> [--ids ids.json] [--port 9350] [--width 1280]
// (hop 24, 5.4.7 stage 3) For every story of a static Storybook build, record the
// computed `color` of each button and form field (button, input, select,
// textarea, [role=button], plus any selector passed with --sel), its own
// background, and the first non-transparent background behind it. Compare two
// builds with colorcmp.mjs. Plumbing (headless Chrome over CDP, the 1 s
// stability wait) is storysweep.mjs's.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [origin, build, outFile, ...rest] = process.argv.slice(2);
const opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const port = +(opt('--port') || 9350);
const width = +(opt('--width') || 1280);
const extraSel = opt('--sel') || '';
const timing = rest.includes('--timing');
const ids = opt('--ids')
  ? JSON.parse(fs.readFileSync(opt('--ids'), 'utf8'))
  : Object.values((await (await fetch(`${origin}/${build}/index.json`)).json()).entries).filter(e => e.type === 'story').map(e => e.id);
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(path.dirname(path.resolve(outFile)), '.storysweep-profile-'));
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},900`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
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
    await new Promise(r => setTimeout(r, 100));
    if (document.body && document.body.classList.contains('sb-show-errordisplay')) break;
    const len = (rootOf() || { innerHTML: '' }).innerHTML.length;
    if (len !== last) { last = len; since = performance.now(); }
    else if (len > 0 && performance.now() - since >= 1000 && performance.now() - t0 >= 3000) break;
  }
  if (document.body.classList.contains('sb-show-errordisplay')) return { err: true, els: [] };
  const sel = 'button, input:not([type=hidden]), select, textarea, [role=button]' + (${JSON.stringify(extraSel)} ? ', ' + ${JSON.stringify(extraSel)} : '');
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; } return 'rgb(255, 255, 255)'; };
  const path = el => { const p = []; for (let e = el; e && e !== document.body && p.length < 4; e = e.parentElement) p.unshift(e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].join('.') : '')); return p.join(' > '); };
  const els = [...document.querySelectorAll(sel)].map((el, i) => {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { i, path: path(el), color: cs.color, own: cs.backgroundColor, behind: bgOf(el), visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none', text: (el.value || el.placeholder || el.textContent || '').trim().slice(0, 40) };
  });
  return { err: false, els };
})()`;
const out = {};
let n = 0;
for (const id of ids) {
  n++;
  try {
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `${origin}/${build}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story` });
    await Promise.race([loaded, sleep(15000)]);
    out[id] = await evaluate(CAPTURE);
  } catch (e) { out[id] = { err: String(e), els: [] }; }
  if (n % 10 === 0 || n === ids.length) { fs.writeFileSync(outFile, JSON.stringify(out)); process.stdout.write(`${build} ${n}/${ids.length}\n`); }
}
console.log(`colorsweep ${build} @${width}px: ${ids.length} stories -> ${outFile}`);
ws.close();
const exited = new Promise(r => chrome.once('exit', r));
chrome.kill();
await exited;
fs.rmSync(profile, { recursive: true, force: true });
