/* V152 MAP PERF — measure-first profiler for «نقشه رو روون تر کن / بازی بدون لگ»
 * Pixel 5 + 4x CPU throttle + 120ms RTT. Sections:
 *   boot timeline + longtasks · idle/drag/pinch/zoom FPS · country-click latency
 *   CPU profile during drag (self-time by function) · Leaflet canvas redraw counts
 * usage: node scripts/v152-perf.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3000/game/index.html';
const Out = { url, ts: new Date().toISOString() };

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 },
  isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
const page = await ctx.newPage();

await page.addInitScript(() => {
  window.__PERF = { longTasks: [], styleSets: 0, canvasUpdates: 0, canvasMs: 0, raf: 0 };
  window.__fpsOf = (fr) => { const dt = []; for (let i = 1; i < fr.length; i++) dt.push(fr[i] - fr[i - 1]); dt.sort((a, b) => a - b);
    return { p50: Math.round(1000 / dt[Math.floor(dt.length / 2)]), p95: Math.round(1000 / dt[Math.floor(dt.length * 0.95)]), jank_gt50: dt.filter((x) => x > 50).length, jank_gt100: dt.filter((x) => x > 100).length }; };
  const t0 = performance.now();
  try {
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__PERF.longTasks.push([Math.round(e.startTime - t0), Math.round(e.duration)]); });
    po.observe({ entryTypes: ['longtask'] });
  } catch (e) {}
  // count Leaflet setStyle + canvas redraw cost once Leaflet appears
  const patch = () => {
    if (!window.L || !window.L.Path) return setTimeout(patch, 30);
    try {
      const sp = L.Path.prototype.setStyle;
      L.Path.prototype.setStyle = function (o) { window.__PERF.styleSets++; return sp.call(this, o); };
      const up = L.Canvas.prototype._updatePaths;
      L.Canvas.prototype._updatePaths = function () {
        const t = performance.now(); const r = up.call(this);
        window.__PERF.canvasUpdates++; window.__PERF.canvasMs += performance.now() - t;
        return r;
      };
    } catch (e) {}
  };
  patch();
});

const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.emulateNetworkConditions', {
  offline: false, latency: 120, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});
await page.addInitScript(() => {}); // keep session shape

page.on('pageerror', (e) => { Out.pageerrors = (Out.pageerrors || []).concat(String(e).slice(0, 150)); });

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch((e) => { Out.goto_err = e.message; });
Out.dcl_ms = Date.now() - t0;

try {
  await page.waitForFunction(() => !!document.querySelector('.leaflet-container'), { timeout: 60000 });
  Out.map_mount_ms = Date.now() - t0;
} catch (e) { Out.map_mount_ms = 'TIMEOUT'; }
try {
  await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 60000 });
  Out.map_ready_ms = Date.now() - t0;
} catch (e) { Out.map_ready_ms = 'TIMEOUT(wait marker)'; }
// fallback marker: geoJSON layer added
try {
  await page.waitForFunction(() => !!(window.__wdMapGet && window.__wdMapGet()), { timeout: 60000 });
  Out.map_get_ms = Date.now() - t0;
} catch (e) {}

await page.waitForTimeout(6000); // let boot settle
const perf = await page.evaluate(() => window.__PERF);
if (perf) {
  const lt = perf.longTasks.slice();
  lt.sort((a, b) => b[1] - a[1]);
  Out.boot_longtasks_top10 = lt.slice(0, 10);
  Out.longtask_count = lt.length;
  Out.longtask_total_ms = lt.reduce((s, x) => s + x[1], 0);
}

// idle FPS (no gesture)
Out.idle_fps = await page.evaluate(async () => {
  const read = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 4; i++) await read();
  const fr = []; for (let i = 0; i < 60; i++) { await read(); fr.push(performance.now()); }
  return window.__fpsOf(fr);
});

// drag with CPU profiler running
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
await cdp.send('Profiler.start');
try {
  await page.evaluate(() => {
    const c = document.querySelector('.leaflet-container');
    const r = c.getBoundingClientRect();
    const mk = (type, x, y, extra) => c.dispatchEvent(new TouchEvent(type, Object.assign({
      bubbles: true, cancelable: true,
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: c, clientX: x, clientY: y })],
      changedTouches: [new Touch({ identifier: 1, target: c, clientX: x, clientY: y })],
    }, extra || {})));
    let x = r.x + r.width / 2, y = r.y + r.height / 2;
    mk('touchstart', x, y);
    let d = 0;
    const iv = setInterval(() => { d += 12; if (d > 260) d = -260; mk('touchmove', x + d, y - d / 2); }, 16);
    setTimeout(() => { clearInterval(iv); mk('touchend', x + d, y - d / 2); }, 3000);
  });
  // sample FPS DURING the drag
  await page.waitForTimeout(600);
  Out.drag_fps = await page.evaluate(async () => {
    const read = () => new Promise((r) => requestAnimationFrame(r));
    const fr = []; for (let i = 0; i < 80; i++) { await read(); fr.push(performance.now()); }
    return window.__fpsOf(fr);
  });
  await page.waitForTimeout(2600);
} catch (e) { Out.drag_fps = 'ERR ' + e.message; }
const prof = await cdp.send('Profiler.stop');
Out.drag_cpu_top = topSelf(prof.profile, 22);

// pinch zoom FPS
try {
  await page.evaluate(() => {
    const c = document.querySelector('.leaflet-container');
    const r = c.getBoundingClientRect();
    const t = (id, x, y) => new Touch({ identifier: id, target: c, clientX: x, clientY: y });
    let f = 1, cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    c.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t(1, cx - 60, cy), t(2, cx + 60, cy)], changedTouches: [t(1, cx - 60, cy), t(2, cx + 60, cy)] }));
    const iv = setInterval(() => {
      f *= 1.06; const g = 60 * f;
      c.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [t(1, cx - g, cy), t(2, cx + g, cy)], changedTouches: [t(1, cx - g, cy), t(2, cx + g, cy)] }));
    }, 16);
    setTimeout(() => clearInterval(iv), 2600);
  });
  await page.waitForTimeout(300);
  Out.pinch_fps = await page.evaluate(async () => {
    const read = () => new Promise((r) => requestAnimationFrame(r));
    const fr = []; for (let i = 0; i < 70; i++) { await read(); fr.push(performance.now()); }
    return window.__fpsOf(fr);
  });
  await page.waitForTimeout(2500);
} catch (e) { Out.pinch_fps = 'ERR ' + e.message; }

// country click latency (touch a country → drawer open)
try {
  Out.click = await page.evaluate(async () => {
    const c = document.querySelector('.leaflet-container');
    const r = c.getBoundingClientRect();
    const read = () => new Promise((res) => requestAnimationFrame(res));
    for (let i = 0; i < 3; i++) await read();
    const t0 = performance.now();
    const px = r.x + r.width / 2, py = r.y + r.height * 0.42;
    c.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: c, clientX: px, clientY: py })], changedTouches: [new Touch({ identifier: 1, target: c, clientX: px, clientY: py })] }));
    c.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [new Touch({ identifier: 1, target: c, clientX: px, clientY: py })] }));
    for (let i = 0; i < 120; i++) { await read(); if (document.getElementById('country-drawer') && document.getElementById('country-drawer').classList.contains('open')) break; }
    return { open_ms: Math.round(performance.now() - t0), drawer: !!(document.getElementById('country-drawer') && document.getElementById('country-drawer').classList.contains('open')) };
  });
} catch (e) { Out.click = 'ERR ' + e.message; }

// runtime longtasks 8s window after everything
Out.runtime_longtasks_8s = await page.evaluate(() => new Promise((res) => {
  const before = (window.__PERF.longTasks || []).slice();
  setTimeout(() => {
    const nowAll = (window.__PERF.longTasks || []).slice();
    const win = nowAll.filter((x) => !before.includes(x));
    res({ count: win.length, total: win.reduce((s, x) => s + x[1], 0), top: win.sort((a, b) => b[1] - a[1]).slice(0, 5) });
  }, 8000);
}));

// counters + DOM stats
Out.counters = await page.evaluate(() => ({
  styleSets: window.__PERF.styleSets, canvasUpdates: window.__PERF.canvasUpdates, canvasMs: Math.round(window.__PERF.canvasMs),
  canvases: document.querySelectorAll('canvas').length, svg_paths: document.querySelectorAll('path').length,
  elements: document.querySelectorAll('*').length,
  wd_quiet: document.documentElement.classList.contains('wd-quiet'),
}));

function topSelf(profile, n) {
  const byId = new Map(); (profile.nodes || []).forEach((nd) => byId.set(nd.id, nd));
  const self = new Map();
  const urlOf = (id) => { const nd = byId.get(id); if (!nd) return '?'; const cf = nd.callFrame || {}; return (cf.url || '').split('/').pop() + ':' + (cf.functionName || '(anon)'); };
  (profile.samples || []).forEach((id, i) => {
    const dT = (i + 1 < profile.timeDeltas.length) ? profile.timeDeltas[i + 1] : profile.timeDeltas[i] || 0;
    const k = urlOf(id); self.set(k, (self.get(k) || 0) + dT);
  });
  return [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, Math.round(v / 1000) + 'ms']);
}

console.log(JSON.stringify(Out, null, 1));
await browser.close();
