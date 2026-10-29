/* V132 PERF PROBE — boot timeline + runtime lag diagnostics for /game/index.html
 * usage: node scripts/v132-perf.mjs [url] [--touch]
 */
import { chromium, devices } from 'playwright';

const url = process.argv[2] || 'https://world-dominion7.vercel.app/game/index.html';
const touch = process.argv.includes('--touch');
const Out = { url, ts: new Date().toISOString() };

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  ...(touch ? devices['Pixel 5'] : {}),
  viewport: touch ? undefined : { width: 1280, height: 800 },
});
const page = await ctx.newPage();

// capture boot timings
await page.addInitScript(() => {
  window.__PERF = { marks: [], longTasks: [], intervals: [] };
  const t0 = performance.now();
  const origMark = performance.mark.bind(performance);
  performance.mark = (n, o) => { try { window.__PERF.marks.push([Math.round(performance.now() - t0), n]); } catch (e) {} return origMark(n, o); };
  try {
    const po = new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__PERF.longTasks.push([Math.round(e.startTime), Math.round(e.duration), e.name]);
    });
    po.observe({ entryTypes: ['longtask'] });
  } catch (e) {}
  const origSI = window.setInterval.bind(window);
  window.setInterval = (fn, ms, ...a) => { try { window.__PERF.intervals.push(ms); } catch (e) {} return origSI(fn, ms, ...a); };
});

page.on('console', (m) => { const t = m.text(); if (/error|failed|ERR/i.test(t)) Out.errors = (Out.errors || []).concat(t.slice(0, 200)); });
page.on('pageerror', (e) => { Out.pageerrors = (Out.pageerrors || []).concat(String(e).slice(0, 200)); });

const t0 = Date.now();
const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
Out.httpStatus = resp.status();
Out.ttfb_to_dcl_ms = Date.now() - t0;

// wait for map ready (map object exists)
try {
  await page.waitForFunction(() => !!(window.L && document.querySelector('.leaflet-container')), { timeout: 45000 });
  Out.map_visible_ms = Date.now() - t0;
} catch (e) { Out.map_visible_ms = 'TIMEOUT'; }

try {
  await page.waitForFunction(() => window.__WD_BOOT_DONE === true || (window.ACC && window.ACC.ready), { timeout: 40000 });
  Out.boot_ready_ms = Date.now() - t0;
} catch (e) { Out.boot_ready_ms = 'TIMEOUT(no ACC.ready marker)'; }

await page.waitForTimeout(6000);
const perf = await page.evaluate(() => window.__PERF);
if (perf) {
  perf.longTasks.sort((a, b) => b[1] - a[1]);
  Out.boot_longtasks_top10 = perf.longTasks.slice(0, 10);
  Out.longtask_count = perf.longTasks.length;
  Out.longtask_total_ms = perf.longTasks.reduce((s, x) => s + x[1], 0);
  const hist = {};
  perf.intervals.forEach((ms) => { hist[ms] = (hist[ms] || 0) + 1; });
  Out.interval_histogram = hist;
  Out.interval_total = perf.intervals.length;
}

// FPS during map pan (main interaction)
const fps = await page.evaluate(async () => {
  const read = () => new Promise((r) => requestAnimationFrame(r));
  // warmup
  for (let i = 0; i < 5; i++) await read();
  const frames = [];
  const t0 = performance.now();
  for (let i = 0; i < 90; i++) { await read(); frames.push(performance.now()); }
  const dt = [];
  for (let i = 1; i < frames.length; i++) dt.push(frames[i] - frames[i - 1]);
  dt.sort((a, b) => a - b);
  return {
    fps_avg: Math.round(1000 / (dt.reduce((s, x) => s + x, 0) / dt.length)),
    fps_p50: Math.round(1000 / dt[Math.floor(dt.length / 2)]),
    fps_p95: Math.round(1000 / dt[Math.floor(dt.length * 0.95)]),
    jank_frames_gt50ms: dt.filter((x) => x > 50).length,
  };
});
Out.idle_fps = fps;

// FPS while panning the map (drag)
try {
  await page.evaluate(async () => {
    const c = document.querySelector('.leaflet-container');
    const mkDrag = () => {
      const r = c.getBoundingClientRect();
      const sx = r.x + r.width / 2, sy = r.y + r.height / 2;
      let id = 1;
      const opts = (dx) => ({ bubbles: true, cancelable: true, pointerId: id, pointerType: 'mouse', isPrimary: true, clientX: sx + dx, clientY: sy, buttons: 1 });
      c.dispatchEvent(new PointerEvent('pointerdown', opts(0)));
      let d = 0;
      const iv = setInterval(() => {
        d += 14; if (d > 300) d = -300;
        c.dispatchEvent(new PointerEvent('pointermove', opts(d)));
      }, 16);
      setTimeout(() => { clearInterval(iv); c.dispatchEvent(new PointerEvent('pointerup', opts(d))); }, 2500);
    };
    mkDrag();
  });
  const fps2 = await page.evaluate(async () => {
    const read = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 3; i++) await read();
    const frames = [];
    for (let i = 0; i < 120; i++) { await read(); frames.push(performance.now()); }
    const dt = [];
    for (let i = 1; i < frames.length; i++) dt.push(frames[i] - frames[i - 1]);
    dt.sort((a, b) => a - b);
    return {
      fps_avg: Math.round(1000 / (dt.reduce((s, x) => s + x, 0) / dt.length)),
      fps_p50: Math.round(1000 / dt[Math.floor(dt.length / 2)]),
      fps_p95: Math.round(1000 / dt[Math.floor(dt.length * 0.95)]),
      jank_frames_gt50ms: dt.filter((x) => x > 50).length,
    };
  });
  Out.pan_fps = fps2;
} catch (e) { Out.pan_fps = 'ERR ' + e.message; }

// runtime long tasks after boot (5s window of watch)
const rt = await page.evaluate(() => new Promise((res) => {
  const lt = [];
  try {
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) lt.push([Math.round(e.startTime), Math.round(e.duration)]); });
    po.observe({ entryTypes: ['longtask'] });
    setTimeout(() => res({ count: lt.length, total: lt.reduce((s, x) => s + x[1], 0), top: lt.sort((a, b) => b[1] - a[1]).slice(0, 5) }), 8000);
  } catch (e) { res({ count: 'n/a' }); }
}));
Out.runtime_longtasks_8s = rt;

// entry-point audit: is chat reachable?
Out.chat_entry = await page.evaluate(() => {
  const r = {};
  r.chatBtnInDock = !!document.getElementById('wd-chat-btn');
  r.featureDockVisible = (() => { const d = document.getElementById('wd-feature-dock'); if (!d) return false; const cs = getComputedStyle(d); return cs.display !== 'none' && d.offsetParent !== null; })();
  r.dock87 = !!document.getElementById('wd87dock');
  r.dock87_has_chat = (() => { const d = document.getElementById('wd87dock'); return d ? !!d.querySelector('[id*="chat"],[class*="chat"]') : false; })();
  r.menuItems = [...document.querySelectorAll('#wd-menu .wd-menu-item b')].map((b) => b.textContent).slice(0, 20);
  r.menu_has_chat = [...document.querySelectorAll('#wd-menu .wd-menu-item b')].some((b) => b.textContent.indexOf('چت') > -1);
  r.WD28Chat = typeof window.WD28Chat;
  r.chatModalExists = !!document.getElementById('wd-chat');
  return r;
});

console.log(JSON.stringify(Out, null, 1));
await browser.close();
