/* V132 MOBILE PERF — Pixel 5 + 4x CPU throttle: boot + runtime jank + intervals
 * usage: node scripts/v132-mobile-perf.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://world-dominion7.vercel.app/game/index.html';
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
  window.__PERF = { longTasks: [], intervals: [] };
  const t0 = performance.now();
  try {
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__PERF.longTasks.push([Math.round(e.startTime - t0), Math.round(e.duration)]); });
    po.observe({ entryTypes: ['longtask'] });
  } catch (e) {}
  const origSI = window.setInterval.bind(window);
  window.setInterval = (fn, ms, ...a) => { try { window.__PERF.intervals.push(ms); } catch (e) {} return origSI(fn, ms, ...a); };
});

const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.emulateNetworkConditions', {
  offline: false, latency: 120, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});

page.on('pageerror', (e) => { Out.pageerrors = (Out.pageerrors || []).concat(String(e).slice(0, 150)); });

const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch((e) => { Out.goto_err = e.message; });
Out.dcl_ms = Date.now() - t0;

try {
  await page.waitForFunction(() => !!document.querySelector('.leaflet-container'), { timeout: 60000 });
  Out.map_mount_ms = Date.now() - t0;
} catch (e) { Out.map_mount_ms = 'TIMEOUT'; }

// wait for country paths drawn
try {
  await page.waitForFunction(() => document.querySelectorAll('.leaflet-overlay-pane canvas, .leaflet-overlay-pane path.leaflet-interactive').length > 0, { timeout: 30000 });
  Out.countries_drawn_ms = Date.now() - t0;
} catch (e) { Out.countries_drawn_ms = 'TIMEOUT (may be canvas)'; }

await page.waitForTimeout(5000);
const perf = await page.evaluate(() => window.__PERF);
if (perf) {
  perf.longTasks.sort((a, b) => b[1] - a[1]);
  Out.boot_longtasks_top12 = perf.longTasks.slice(0, 12);
  Out.longtask_count = perf.longTasks.length;
  Out.longtask_total_ms = perf.longTasks.reduce((s, x) => s + x[1], 0);
}

// FPS idle (throttled)
Out.idle_fps = await page.evaluate(async () => {
  const read = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 4; i++) await read();
  const fr = [];
  for (let i = 0; i < 60; i++) { await read(); fr.push(performance.now()); }
  const dt = [];
  for (let i = 1; i < fr.length; i++) dt.push(fr[i] - fr[i - 1]);
  dt.sort((a, b) => a - b);
  return { p50: Math.round(1000 / dt[Math.floor(dt.length / 2)]), p95: Math.round(1000 / dt[Math.floor(dt.length * 0.95)]), jank_gt50: dt.filter((x) => x > 50).length, jank_gt100: dt.filter((x) => x > 100).length };
});

// touch drag on map
try {
  await page.evaluate(() => {
    const c = document.querySelector('.leaflet-container');
    const r = c.getBoundingClientRect();
    const mk = (type, x, y) => c.dispatchEvent(new TouchEvent(type, {
      bubbles: true, cancelable: true,
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: c, clientX: x, clientY: y })],
      changedTouches: [new Touch({ identifier: 1, target: c, clientX: x, clientY: y })],
    }));
    let x = r.x + r.width / 2, y = r.y + r.height / 2;
    mk('touchstart', x, y);
    let d = 0;
    const iv = setInterval(() => { d += 10; if (d > 200) d = -200; mk('touchmove', x + d, y - d / 2); }, 16);
    setTimeout(() => { clearInterval(iv); mk('touchend', x + d, y - d / 2); }, 2200);
  });
  Out.drag_fps = await page.evaluate(async () => {
    const read = () => new Promise((r) => requestAnimationFrame(r));
    const fr = [];
    for (let i = 0; i < 100; i++) { await read(); fr.push(performance.now()); }
    const dt = [];
    for (let i = 1; i < fr.length; i++) dt.push(fr[i] - fr[i - 1]);
    dt.sort((a, b) => a - b);
    return { p50: Math.round(1000 / dt[Math.floor(dt.length / 2)]), p95: Math.round(1000 / dt[Math.floor(dt.length * 0.95)]), jank_gt50: dt.filter((x) => x > 50).length, jank_gt100: dt.filter((x) => x > 100).length };
  });
} catch (e) { Out.drag_fps = 'ERR ' + e.message; }

// runtime longtasks 8s window
Out.runtime_longtasks_8s = await page.evaluate(() => new Promise((res) => {
  const lt = [];
  try {
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) lt.push(Math.round(e.duration)); });
    po.observe({ entryTypes: ['longtask'] });
    setTimeout(() => res({ count: lt.length, total: lt.reduce((s, x) => s + x, 0), top: lt.sort((a, b) => b - a).slice(0, 5) }), 8000);
  } catch (e) { res({ count: 'n/a' }); }
}));

// memory + node counts
Out.diagnostics = await page.evaluate(() => ({
  canvases: document.querySelectorAll('canvas').length,
  svg_paths: document.querySelectorAll('path').length,
  elements: document.querySelectorAll('*').length,
  intervals: window.__PERF ? window.__PERF.intervals.length : 'n/a',
  wd_quiet: document.documentElement.classList.contains('wd-quiet'),
  chat_entry_btn: !!document.getElementById('wd-chat-btn'),
  dock87_has_chat: (() => { const d = document.getElementById('wd87dock'); return d ? d.querySelectorAll('button').length + ' btns:' + [...d.querySelectorAll('button')].map((b) => b.id).join(',') : 'none'; })(),
}));

console.log(JSON.stringify(Out, null, 1));
await browser.close();
