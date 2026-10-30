/* PERF BASELINE HARNESS — Phase-1 dual-environment measurement.
 *
 * Pixel 5 profile (393x851 @2.75, touch, Chrome/120 UA) + CDP CPU throttling,
 * REAL touch input pipeline (Input.dispatchTouchEvent), same as V156 dragprobe.
 *
 * scenarios:
 *   boot   : domcontentloaded → __wdMapReady → settle (flags/labels mount)
 *   idle5s : rAF + longtask baseline
 *   g1     : 5 continent-crossing flicks          (user-reported pain)
 *   g2     : pinch in + out
 *   g3     : 6 small pans (browsing a continent)
 *   g1r1-3 : 3 more flick rounds (heap-growth / leak signal)
 *   cop1-3 : 3 country drawer opens (click → #drawer-actions rendered)
 *
 * usage:
 *   node scripts/perf-baseline.mjs --base http://localhost:3000 --tag local500 \
 *        --cpu 4 --runs 2 --net mobile --mode seeded [--trace]
 *   node scripts/perf-baseline.mjs --base https://world-dominion7.vercel.app \
 *        --tag prod --mode live --cpu 4 --runs 2 --net mobile
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:3000').replace(/\/$/, '');
const TAG = arg('tag', 'run');
const CPU = Number(arg('cpu', 4));
const RUNS = Number(arg('runs', 1));
const NET = arg('net', 'mobile');           /* mobile = 120ms/1.5Mbps (fair cross-env), real = untouched */
const MODE = arg('mode', 'seeded');         /* seeded = local probe account | live = signup on target */
const TRACE = process.argv.includes('--trace');
const RESULTS = path.resolve('scripts/perf-results');
fs.mkdirSync(RESULTS, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- session ---------- */
let TOKEN = null;
if (MODE === 'seeded') {
  const mf = JSON.parse(fs.readFileSync(path.join(RESULTS, 'seed-manifest.json'), 'utf8'));
  TOKEN = mf.probeToken;
  var PROBE_COUNTRY = mf.probeCountry;
  var SEED_SRV = mf.srv || 1;
} else {
  const sessFile = path.join(RESULTS, TAG + '-session.json');
  if (fs.existsSync(sessFile)) { TOKEN = JSON.parse(fs.readFileSync(sessFile, 'utf8')).token; }
  else {
    const ts = Date.now().toString(36).slice(-6);
    const r = await fetch(BASE + '/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'perfprobe' + ts + '@perf.live', password: 'perfbaseline1', nick: 'PERFPROBE' + ts.slice(-3) }),
    });
    const ck = (r.headers.getSetCookie ? r.headers.getSetCookie() : []).find((c) => c.startsWith('wd_session='));
    const j = await r.json().catch(() => ({}));
    TOKEN = ck ? ck.split(';')[0].split('=')[1] : null;
    if (!TOKEN) { console.error('live signup failed', JSON.stringify(j).slice(0, 300)); process.exit(1); }
    fs.writeFileSync(sessFile, JSON.stringify({ token: TOKEN, nick: 'PERFPROBE' + ts.slice(-3) }));
  }
}

/* seeded mode: claim the probe country through the REAL server-judged path */
if (MODE === 'seeded') {
  const r = await fetch(BASE + '/api/rpc/territory_sync', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'wd_session=' + TOKEN },
    body: JSON.stringify({ p_server: SEED_SRV, p_held: [PROBE_COUNTRY], p_capital: PROBE_COUNTRY }),
  });
  const j = await r.json().catch(() => ({}));
  const mine = j?.data?.mine || [];
  if (!j?.data?.ok || !mine.length) { console.error('probe claim failed', JSON.stringify(j).slice(0, 300)); process.exit(1); }
}

const { chromium } = await import('playwright');

/* ---------- per-run ---------- */
async function oneRun(idx) {
  const Out = { tag: TAG, run: idx, cpu: CPU, net: NET, mode: MODE, base: BASE, at: new Date().toISOString() };
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
  });
  await ctx.addCookies([{ name: 'wd_session', value: TOKEN, url: BASE }]);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  if (NET === 'mobile') {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 120, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    });
  }
  Out.pageerrors = [];
  page.on('pageerror', (e) => Out.pageerrors.push(String(e).slice(0, 160)));

  /* instrument Leaflet canvas internals + rAF/longtask samplers BEFORE app boot */
  await page.addInitScript(() => {
    const patch = () => {
      const L = window.L; if (!L || !L.Canvas) return false;
      if (window.__cnt) return true;
      window.__cnt = { upd: 0, updMs: 0, red: 0, redMs: 0, proj: 0, projMs: 0, projPts: 0, reset: 0 };
      const CP = L.Canvas.prototype;
      const oU = CP._update; CP._update = function () { const t0 = performance.now(); const r = oU.apply(this, arguments); window.__cnt.upd++; window.__cnt.updMs += performance.now() - t0; return r; };
      const oR = CP._redraw; CP._redraw = function () { const t0 = performance.now(); const r = oR.apply(this, arguments); window.__cnt.red++; window.__cnt.redMs += performance.now() - t0; return r; };
      const oRes = CP._reset; CP._reset = function () { window.__cnt.reset++; return oRes.apply(this, arguments); };
      const PP = L.Polygon.prototype;
      const oP = PP._project; PP._project = function () { let pts = 0; try { (this._rings || []).forEach((r2) => pts += r2.length); } catch (e) {} const t0 = performance.now(); const r = oP.apply(this, arguments); window.__cnt.proj++; window.__cnt.projPts += pts; window.__cnt.projMs += performance.now() - t0; return r; };
      return true;
    };
    const iv = setInterval(() => { if (patch()) clearInterval(iv); }, 5);
    setTimeout(() => clearInterval(iv), 90000);
    window.__frames = []; window.__lt = []; window.__marks = [];
    window.__wdMark = (n) => window.__marks.push([n, performance.now()]);
    const obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 40) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); });
    try { obs.observe({ entryTypes: ['longtask'] }); } catch (e) {}
    const loop = (t) => { window.__frames.push(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });

  /* ---------- boot ---------- */
  const tGo = Date.now();
  await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), bytes: n.transferSize } : {}; });
  let mapReady = true;
  const tMap0 = Date.now();
  try { await page.waitForFunction(() => window.__wdMapReady === true, null, { timeout: 60000, polling: 120 }); } catch (e) { mapReady = false; }
  Out.boot = { dcl: nav.dcl, load: nav.load, mapReady, mapReadyMs: mapReady ? Date.now() - tMap0 : -1, gotoMs: Date.now() - tGo };
  await wait(5000); /* flags/labels/graticule mount, afterGeo chains settle */

  /* ---------- get in-game (close/resolve boot modals like a REAL player) ---------- */
  Out.boot_modals = await page.evaluate(() => [...document.querySelectorAll('.modal.active')].map((e) => e.id).slice(0, 5));
  Out.inGame = await page.evaluate(async () => {
    const act = () => [...document.querySelectorAll('.modal.active')].map((e) => e.id);
    /* server picker: click the first lobby row (new-player real flow) */
    if (document.getElementById('m-srv') && document.getElementById('m-srv').classList.contains('active')) {
      const row = document.querySelector('#srv-body .lobby-item');
      if (row) { row.click(); await new Promise((r) => setTimeout(r, 1500)); }
    }
    /* elimination picker → REAL claim flow on free countries (server-judged) */
    if (document.getElementById('m-elim') && document.getElementById('m-elim').classList.contains('active')) {
      const pk = document.querySelector('#wd-elim-pick'); if (pk) pk.click();
      await new Promise((r) => setTimeout(r, 600));
      const names = (typeof layersByName !== 'undefined') ? Object.keys(layersByName) : [];
      const pref = ['Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'Iceland', 'Ireland', 'Portugal', 'Jordan', 'Oman', 'Laos', 'Mongolia', 'Kazakhstan', 'Chad', 'Mali', 'Niger', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia'];
      const order = pref.filter((n) => names.indexOf(n) >= 0).concat(names.filter((n) => pref.indexOf(n) < 0));
      for (const n of order.slice(0, 40)) {
        try {
          const l = layersByName[n]; if (!l) continue;
          l.fire('click', { latlng: map.getCenter(), originalEvent: new MouseEvent('click') }, true);
          await new Promise((r) => setTimeout(r, 550));
          const cb = document.querySelector('#act-claim');
          if (cb && cb.offsetParent !== null) { cb.click(); await new Promise((r) => setTimeout(r, 2200)); }
          if (typeof myCountryName !== 'undefined' && myCountryName) break;
        } catch (e) {}
      }
    }
    /* leftover boot modal */
    if (document.getElementById('m-srv') && document.getElementById('m-srv').classList.contains('active')) {
      const x = document.querySelector('#m-srv .close-modal,#m-srv .close,#m-srv [data-close]'); if (x) x.click();
      await new Promise((r) => setTimeout(r, 500));
    }
    let oth = 0; try { oth = Object.keys(OTH).length; } catch (e) {}
    return { modals: act(), my: typeof myCountryName !== 'undefined' ? myCountryName : null, oth, srv: typeof SRV !== 'undefined' ? SRV : null };
  });
  Out.dragging = await page.evaluate(() => !!map && map.dragging.enabled());

  /* ---------- CDP metrics snapshots ---------- */
  await cdp.send('Performance.enable');
  const snap = async () => { const m = await cdp.send('Performance.getMetrics'); return Object.fromEntries(m.metrics.map((x) => [x.name, x.value])); };
  const MET_NAMES = ['ScriptDuration', 'TaskDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount', 'Nodes', 'JSHeapUsedSize', 'JSEventListeners', 'Documents'];
  const fmt = (a, b) => { const o = {}; for (const k of MET_NAMES) o[k] = k.includes('Duration') ? Math.round((b[k] - a[k]) * 1000) : (b[k] - (a[k] || 0)); return o; };

  const domCounts = () => page.evaluate(() => ({
    ownLabels: document.querySelectorAll('.own').length,
    flags: document.querySelectorAll('.flag').length,
    canvases: document.querySelectorAll('#map canvas').length,
    sites: document.querySelectorAll('.site').length,
  }));
  Out.world = await domCounts();
  Out.world.oth = Out.inGame.oth;
  Out.world.zoom = await page.evaluate(() => (typeof map !== 'undefined' && map) ? Math.round(map.getZoom() * 10) / 10 : null);

  /* ---------- gesture machinery (REAL CDP touch input) ---------- */
  const drag = async (x0, y0, dx, dy, steps, stepMs) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
    for (let i = 1; i <= steps; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps, id: 1 }] });
      await wait(stepMs);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const pinch = async (cx, cy, from, to, steps, stepMs) => {
    const P = (f, s) => [{ x: cx - f, y: cy - f, id: 1 }, { x: cx + f, y: cy + f, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(from) });
    for (let i = 1; i <= steps; i++) {
      const f = from + ((to - from) * i) / steps;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(f) });
      await wait(stepMs);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  const M0 = await snap();
  const heap0 = M0.JSHeapUsedSize;
  const gest = async (name, fn) => {
    await page.evaluate((n) => { window.__wdMark('start:' + n); window.__cnt && (window.__cnt0 = JSON.parse(JSON.stringify(window.__cnt))); }, name);
    const mA = await snap();
    const t0 = Date.now();
    await fn();
    await wait(700); /* inertia + redraws land inside the window */
    const res = await page.evaluate((n) => {
      const m = window.__marks, fr = window.__frames;
      const idx = m.map((x) => x[0]).lastIndexOf('start:' + n);
      const t0 = (m[idx] && m[idx][1]) || 0;
      const inwin = fr.filter((t) => t >= t0);
      const d = []; for (let i = 1; i < inwin.length; i++) d.push(inwin[i] - inwin[i - 1]);
      d.sort((a, b) => a - b);
      const pct = (p) => d.length ? Math.round(d[Math.floor(d.length * p)]) : 0;
      const span = inwin.length > 1 ? (inwin[inwin.length - 1] - inwin[0]) / 1000 : 0;
      const lt = window.__lt.filter((x) => x[0] >= t0).map((x) => x[1]);
      return {
        frames: d.length, spanMs: Math.round(span * 1000), fps: span > 0 ? Math.round((d.length / span) * 10) / 10 : 0,
        p50: pct(0.5), p95: pct(0.95), max: d.length ? d[d.length - 1] : 0,
        lt: { n: lt.length, total: Math.round(lt.reduce((a, b) => a + b, 0)), max: lt.length ? Math.max(...lt) : 0 },
        cnt_delta: window.__cnt ? {
          upd: window.__cnt.upd - (window.__cnt0.upd || 0), updMs: Math.round(window.__cnt.updMs - (window.__cnt0.updMs || 0)),
          red: window.__cnt.red - (window.__cnt0.red || 0), redMs: Math.round(window.__cnt.redMs - (window.__cnt0.redMs || 0)),
          proj: window.__cnt.proj - (window.__cnt0.proj || 0), projMs: Math.round(window.__cnt.projMs - (window.__cnt0.projMs || 0)),
          projPts: window.__cnt.projPts - (window.__cnt0.projPts || 0), reset: window.__cnt.reset - (window.__cnt0.reset || 0),
        } : null,
      };
    }, name);
    const mB = await snap();
    res.metrics = fmt(mA, mB);
    res.heapAfterMB = Math.round((mB.JSHeapUsedSize / 1048576) * 10) / 10;
    Out[name] = res;
    return res;
  };

  /* ---------- optional tracing (scripting vs layout vs paint) ---------- */
  async function traced(name, fn) {
    if (!TRACE || idx !== 1) return fn();
    const chunks = []; let rawEvents = 0, startErr = null;
    const on = (e) => { if (e.method === 'Tracing.dataCollected') { const v = (e.params && e.params.value) || []; rawEvents += v.length; for (const ev of v) chunks.push(ev); } };
    cdp.on('Tracing.dataCollected', on);
    try { await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'v8'] } }); } catch (e) { startErr = String(e).slice(0, 160); }
    const t0 = Date.now();
    await fn();
    const doneP = new Promise((res) => cdp.once('Tracing.tracingComplete', res));
    await cdp.send('Tracing.end').catch(() => {});
    await doneP.catch(() => {});
    cdp.off('Tracing.dataCollected', on);
    const B = { script: 0, layout: 0, paint: 0 }, C = { script: 0, layout: 0, paint: 0 };
    const S = new Set(['EvaluateScript', 'v8.compile', 'FunctionCall']);
    const L = new Set(['Layout', 'UpdateLayoutTree', 'RecalculateStyles']);
    const P = new Set(['Paint', 'PrePaint', 'RasterTask', 'PaintImage', 'DecodeImage', 'ImageDecodeTask']);
    for (const e of chunks) { if (!e.dur) continue;
      if (S.has(e.name)) { B.script += e.dur; C.script++; }
      else if (L.has(e.name)) { B.layout += e.dur; C.layout++; }
      else if (P.has(e.name)) { B.paint += e.dur; C.paint++; } }
    Out.trace = { name, windowMs: Date.now() - t0, scriptMs: Math.round(B.script / 1000), layoutMs: Math.round(B.layout / 1000), paintMs: Math.round(B.paint / 1000), counts: C, events: chunks.length, rawEvents, startErr };
  }

  /* ---------- phases ---------- */
  await gest('idle5s', () => wait(5000));
  const flicks = async () => {
    await drag(260, 430, 240, 60, 22, 15); await wait(250);
    await drag(140, 430, 250, 0, 22, 15); await wait(250);
    await drag(150, 300, 60, 180, 22, 15); await wait(250);
    await drag(200, 520, -80, -220, 22, 15); await wait(250);
    await drag(300, 350, -260, 30, 22, 15); await wait(250);
  };
  await traced('g1_flicks', () => gest('g1_flicks', flicks));
  await gest('g2_pinch', async () => {
    await pinch(200, 420, 40, 120, 14, 22); await wait(400);
    await pinch(200, 420, 120, 45, 14, 22); await wait(400);
  });
  await gest('g3_browse', async () => {
    for (let i = 0; i < 6; i++) { await drag(200 + (i % 2) * 40, 420, (i % 2 ? -1 : 1) * 90, (i % 3 - 1) * 60, 12, 17); await wait(180); }
  });
  Out.heap = { startMB: Math.round((heap0 / 1048576) * 10) / 10 };
  for (let k = 1; k <= 3; k++) { const r = await gest('g1_rep' + k, flicks); if (k === 3) Out.heap.afterRepsMB = r.heapAfterMB; }

  /* ---------- country drawer opens ---------- */
  const targets = await page.evaluate(() => {
    const oth = (typeof OTH !== 'undefined') ? Object.keys(OTH) : [];
    const names = (typeof layersByName !== 'undefined') ? Object.keys(layersByName) : [];
    const t = oth.filter((n) => names.includes(n)).slice(0, 3);
    while (t.length < 3 && names.length) { const n = names[Math.floor(Math.random() * names.length)]; if (n !== 'Antarctica' && !t.includes(n)) t.push(n); }
    return t;
  });
  Out.countryOpens = [];
  for (let k = 0; k < targets.length; k++) {
    const name = targets[k];
    const mA = await snap();
    const t0 = Date.now();
    await page.evaluate((n) => { const l = layersByName[n]; if (l) l.fire('click', { latlng: map.getCenter(), originalEvent: new MouseEvent('click') }, true); }, name);
    let opened = false;
    try {
      await page.waitForFunction(() => {
        const d = document.getElementById('drawer-actions');
        return d && d.children.length >= 2;
      }, null, { timeout: 4000, polling: 40 });
      opened = true;
    } catch (e) {}
    const ms = Date.now() - t0;
    const mB = await snap();
    Out.countryOpens.push({ country: name, opened, ms, metrics: fmt(mA, mB) });
    await wait(900);
  }
  const MEnd = await snap();
  Out.heap.endMB = Math.round((MEnd.JSHeapUsedSize / 1048576) * 10) / 10;
  Out.domEnd = await domCounts();

  /* ---------- network audit ---------- */
  Out.net_audit = await page.evaluate(() => {
    const es = performance.getEntriesByType('resource');
    const sum = { all: { n: 0, bytes: 0, ms: 0 }, rpc: { n: 0, bytes: 0, ms: 0 }, db: { n: 0, bytes: 0, ms: 0 }, rt: { n: 0, bytes: 0, ms: 0 } };
    const perFn = {};
    let top = [];
    for (const e of es) {
      const u = e.name; const b = e.transferSize || 0; const d = Math.round(e.duration);
      const add = (k) => { sum[k].n++; sum[k].bytes += b; sum[k].ms += d; };
      add('all');
      if (u.includes('/api/rpc/')) { add('rpc'); const fn = u.split('/api/rpc/')[1].split('?')[0]; const p = perFn[fn] || (perFn[fn] = { n: 0, ms: 0, bytes: 0 }); p.n++; p.ms += d; p.bytes += b; }
      else if (u.includes('/api/db/')) add('db');
      else if (u.includes('/api/rt/')) add('rt');
      top.push([u.split('?')[0].split('/').slice(-2).join('/'), b, d]);
    }
    top = top.sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { sum, perFn, topBytes: top };
  });

  fs.writeFileSync(path.join(RESULTS, TAG + '-c' + CPU + (NET === 'real' ? '-realnet' : '') + '-run' + idx + '.json'), JSON.stringify(Out, null, 1));
  const g1 = Out.g1_flicks;
  console.log('RUN', TAG, '#' + idx, 'cpu' + CPU, NET, '| boot', Out.boot.mapReadyMs + 'ms', '| oth', Out.world.oth,
    '| g1 p50/p95/max', g1 ? g1.p50 + '/' + g1.p95 + '/' + g1.max : '-', 'lt', g1 ? g1.lt.n + '(' + g1.lt.total + 'ms)' : '-',
    '| heap', Out.heap.startMB + '→' + Out.heap.endMB + 'MB', '| errs', Out.pageerrors.length);
  await browser.close();
}

for (let r = 1; r <= RUNS; r++) { try { await oneRun(r); } catch (e) { console.error('run', r, 'FAILED', String(e).slice(0, 300)); } }
process.exit(0);
