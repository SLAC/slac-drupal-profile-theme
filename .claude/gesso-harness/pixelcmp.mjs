#!/usr/bin/env node
// pixelcmp.mjs <origin> <buildA> <buildB> <ids.json> <outdir> [--only id,id] [--port n]
// Screenshot every story of two static Storybook builds served from one origin
// (e.g. ref/ = the Storybook 6.5 reference and after/), full page at 1280 px wide,
// with photos masked, and compare the pixels. One headless Chrome, driven over
// the DevTools protocol (Node 22's built-in WebSocket; no packages).
//   - waits like rendercheck: the root's HTML stable for 600 ms (at least 1.5 s,
//     at most 8 s), then fonts ready, then 1 s more for transitions
//   - masks: every <img>, <video>, <iframe>, <picture>, and inline
//     background-image, painted #888 (remote placeholder photos are random)
//   - animations/transitions are not frozen (both builds share the same CSS)
// Writes <outdir>/result.json: { id: { same, diff, pct, hA, hB, errA, errB } }
// and <outdir>/<A|B>/<id>.png for stories that differ. Resumable: stories
// already in result.json are skipped. (Post-upgrade item 10.)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [origin, A, B, idsFile, outdir, ...rest] = process.argv.slice(2);
let ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
const only = rest.indexOf('--only');
if (only >= 0) ids = rest[only + 1].split(',');
fs.mkdirSync(path.join(outdir, 'A'), { recursive: true });
fs.mkdirSync(path.join(outdir, 'B'), { recursive: true });
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const pi = rest.indexOf('--port');
const port = pi >= 0 ? +rest[pi + 1] : 9333;
const chrome = spawn(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(outdir, 'profile')}`, '--window-size=1280,900', '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver;
for (let i = 0; i < 50 && !ver; i++) { await sleep(200); try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch {} }
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

const MASK = `(() => {
  const s = document.createElement('style');
  s.textContent = 'img,video,iframe,picture,object,embed{opacity:0 !important} img,video,iframe,picture,object,embed{outline:0 !important}';
  document.head.appendChild(s);
  for (const el of document.querySelectorAll('img,video,iframe,picture,object,embed')) { const p = el.parentElement; if (p) p.style.setProperty('background-color', '#888', 'important'); }
  for (const el of document.querySelectorAll('[style*="background-image"], [style*="background:"]')) el.style.setProperty('background-image', 'none', 'important');
  return true;
})()`;
const WAIT = `(async () => {
  const rootOf = () => document.getElementById('storybook-root') || document.getElementById('root');
  const t0 = performance.now(); let last = -1, since = performance.now();
  while (performance.now() - t0 < 8000) {
    await new Promise(r => setTimeout(r, 100));
    const len = (rootOf() || { innerHTML: '' }).innerHTML.length;
    if (len !== last) { last = len; since = performance.now(); }
    else if (len > 0 && performance.now() - since >= 600 && performance.now() - t0 >= 1500) break;
  }
  await document.fonts.ready;
  return { err: document.body.classList.contains('sb-show-errordisplay'), len: last };
})()`;
async function shot(build, id) {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `${origin}/${build}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story` });
  await Promise.race([loaded, sleep(15000)]);
  const st = await evaluate(WAIT);
  await evaluate(MASK);
  await sleep(1000);
  const h = await evaluate('Math.min(8000, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  return { data, h, err: st.err };
}
// pixel diff inside the browser: decode both PNGs on a canvas
async function diff(a, b) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  return evaluate(`(async () => {
    const load = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; });
    const [x, y] = await Promise.all([load('data:image/png;base64,${a}'), load('data:image/png;base64,${b}')]);
    const w = Math.max(x.width, y.width), h = Math.max(x.height, y.height);
    const px = img => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#f0f'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const p = px(x), q = px(y); let d = 0;
    for (let i = 0; i < p.length; i += 4) if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2]) d++;
    return { diff: d, total: w * h };
  })()`);
}
const out = {};
const outFile = path.join(outdir, 'result.json');
if (fs.existsSync(outFile) && only < 0) Object.assign(out, JSON.parse(fs.readFileSync(outFile, 'utf8')));
let n = 0;
for (const id of ids) {
  n++;
  if (out[id] && only < 0) continue;
  try {
    const a = await shot(A, id), b = await shot(B, id);
    const r = { hA: a.h, hB: b.h, errA: a.err, errB: b.err };
    if (a.data === b.data) Object.assign(r, { same: true, diff: 0, pct: 0 });
    else {
      const d = await diff(a.data, b.data);
      Object.assign(r, { same: d.diff === 0, diff: d.diff, pct: +(100 * d.diff / d.total).toFixed(3) });
      if (d.diff) { const f = id.replace(/[^\w-]/g, '_') + '.png'; fs.writeFileSync(path.join(outdir, 'A', f), Buffer.from(a.data, 'base64')); fs.writeFileSync(path.join(outdir, 'B', f), Buffer.from(b.data, 'base64')); }
    }
    out[id] = r;
  } catch (e) { out[id] = { error: String(e) }; }
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  process.stdout.write(`${n}/${ids.length} ${id} ${JSON.stringify(out[id])}\n`);
}
ws.close();
const exited = new Promise(r => chrome.once('exit', r));
chrome.kill();
await exited;
fs.rmSync(path.join(outdir, 'profile'), { recursive: true, force: true });
const vals = Object.values(out);
console.log(`pixelcmp ${A} vs ${B}: ${vals.filter(v => v.same).length}/${vals.length} identical, ${vals.filter(v => v.error).length} errors`);
