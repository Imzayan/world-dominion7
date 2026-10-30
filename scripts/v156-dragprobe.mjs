/* V156 DRAG PROBE — the user still says pan across the map is very laggy on a real phone.
 * Previous rounds (V154/V155) fixed idle loops + CSS effects and the probe "p50=60fps",
 * yet real devices still hang. This probe measures a REAL browsing session via the real
 * input pipeline (CDP touch events → Leaflet drag/inertia/pinch):
 *   G0 idle baseline (rAF + longtasks, 3s)
 *   G1 5 flicks crossing continents (the exact user pattern: Asia → America)
 *   G2 pinch zoom in + out (2-finger, zoomSnap 0.5)
 *   G3 settle after gestures (moveend redraws, inertia tail)
 * instruments: L.Canvas._update/_redraw (full/dirty redraw cost), Polygon/Polyline._project,
 * rAF frame intervals per gesture, longtasks, CPU profile of the whole window.
 * usage: node scripts/v156-dragprobe.mjs [url] [--throttle N]
 */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const { chromium } = await import('playwright');
const db = new PrismaClient();
const BASE = process.argv[2] || 'http://localhost:3000';
const THROTTLE = Number(process.argv[4] || 4);
const Out = { throttle: THROTTLE };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- seed a session with a country ---------- */
const ts = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const sr = await fetch(BASE + '/api/auth/signup', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'v156q' + ts + '@test.local', password: 'secret156', nick: 'V156Q' + ts.slice(-4) }),
});
let cookie = '';
for (const c of (sr.headers.getSetCookie ? sr.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
const uid = (await sr.json().catch(() => ({})))?.data?.user?.id;
if (!uid) { console.log('seed fail'); process.exit(1); }
const rpc = async (fn, args) => {
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(args || {}),
  });
  const j = await r.json().catch(() => ({}));
  return j.data !== undefined ? j.data : j;
};
await wait(150);
const ws = await rpc('wd_servers', {});
const tst = (ws?.test_srvs || []).map(Number);
const open = (ws?.servers || []).find((s) => !tst.includes(s.server) && s.status !== 'full' && s.status !== 'maintenance');
const SRV = open?.server || 1;
await db.save.upsert({
  where: { userId: uid },
  create: { userId: uid, nick: 'V156Q' + ts.slice(-4), state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
  update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
});
await rpc('territory_sync', { p_server: SRV, p_held: ['Iraq'], p_capital: 'Iraq' });
await db.score.updateMany({ where: { userId: uid }, data: { server: SRV } });

/* ---------- browser ---------- */
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
await ctx.addCookies([{ name: 'wd_session', value: cookie.split('=')[1], url: BASE }]);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
await cdp.send('Network.emulateNetworkConditions', {
  offline: false, latency: 120, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});
page.on('pageerror', (e) => { Out.pageerrors = Out.pageerrors || []; Out.pageerrors.push(String(e).slice(0, 200)); });

/* ---------- instrument Leaflet canvas internals BEFORE layers mount ---------- */
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
  setTimeout(() => clearInterval(iv), 60000);
});

await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 40000 }); } catch (e) { Out.mapReady = false; }
await wait(4500); // flags/labels/graticule mount, afterGeo chains settle
/* get IN-GAME before gesturing: close the boot picker, and if the elimination modal
   shows (0 countries at boot) go through the REAL claim flow. Previous probes measured
   gestures under an active modal — every touch was eaten by the overlay! */
Out.boot_modals = await page.evaluate(() => [...document.querySelectorAll('.modal.active')].map((e) => e.id).slice(0, 5));
const inGame = await page.evaluate(async () => {
  const act = () => [...document.querySelectorAll('.modal.active')].map((e) => e.id);
  if (document.getElementById('m-elim') && document.getElementById('m-elim').classList.contains('active')) {
    const pk = document.querySelector('#wd-elim-pick'); if (pk) pk.click();
    await new Promise((r) => setTimeout(r, 600));
    const free = (typeof layersByName !== 'undefined') ? Object.keys(layersByName).find((n) => {
      try { return typeof taken === 'function' && typeof SRV === 'number' && !window.__wdTakenHas ? true : true; } catch (e) { return false; }
    }) : null;
    // fire a click on a free country layer — the claim drawer opens; press the claim button
    const names = (typeof layersByName !== 'undefined') ? Object.keys(layersByName) : [];
    const pref = ['Bolivia','Paraguay','Uruguay','Guyana','Suriname','Iceland','Ireland','Portugal','Jordan','Oman','Laos','Mongolia','Kazakhstan','Chad','Mali','Niger','Zambia','Zimbabwe','Botswana','Namibia'];
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
  if (document.getElementById('m-srv') && document.getElementById('m-srv').classList.contains('active')) {
    const x = document.querySelector('#m-srv .close-modal,#m-srv .close,#m-srv [data-close]'); if (x) x.click();
    await new Promise((r) => setTimeout(r, 500));
  }
  return { modals: act(), my: typeof myCountryName !== 'undefined' ? myCountryName : null };
});
Out.inGame = inGame;
Out.after_close = inGame.modals;
Out.dragging = await page.evaluate(() => map.dragging.enabled());

/* ---------- rAF + longtask sampler ---------- */
await page.evaluate(() => {
  window.__marks = []; window.__frames = []; window.__lt = [];
  window.__wdMark = (n) => window.__marks.push([n, performance.now()]);
  const obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 40) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); });
  try { obs.observe({ entryTypes: ['longtask'] }); } catch (e) {}
  let last = performance.now();
  const loop = (t) => { window.__frames.push(t); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});

const gest = async (name, fn) => {
  await page.evaluate((n) => { window.__wdMark('start:' + n); window.__cnt && (window.__cnt0 = JSON.parse(JSON.stringify(window.__cnt))); }, name);
  const t0 = Date.now();
  await fn();
  await wait(700); // let inertia + redraws land inside the gesture window
  const res = await page.evaluate((n) => {
    const m = window.__marks, fr = window.__frames;
    const idx = m.map((x) => x[0]).lastIndexOf('start:' + n);
    const t0 = m[idx] && m[idx][1] || 0;
    const inwin = fr.filter((t) => t >= t0);
    const d = []; for (let i = 1; i < inwin.length; i++) d.push(inwin[i] - inwin[i - 1]);
    d.sort((a, b) => a - b);
    const pct = (p) => d.length ? Math.round(d[Math.floor(d.length * p)]) : 0;
    return {
      frames: d.length, p50: pct(0.5), p95: pct(0.95), max: d.length ? d[d.length - 1] : 0,
      cnt_delta: window.__cnt ? {
        upd: window.__cnt.upd - (window.__cnt0.upd || 0), updMs: Math.round(window.__cnt.updMs - (window.__cnt0.updMs || 0)),
        red: window.__cnt.red - (window.__cnt0.red || 0), redMs: Math.round(window.__cnt.redMs - (window.__cnt0.redMs || 0)),
        proj: window.__cnt.proj - (window.__cnt0.proj || 0), projMs: Math.round(window.__cnt.projMs - (window.__cnt0.projMs || 0)),
        projPts: window.__cnt.projPts - (window.__cnt0.projPts || 0),
      } : null,
      lt: window.__lt.filter((x) => x[0] >= t0),
    };
  }, name);
  Out[name] = res;
};

/* ---------- touch helpers via REAL CDP input pipeline ---------- */
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

/* CPU profile across the whole gesture window */
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 150 });
await cdp.send('Profiler.start');

/* G0 idle */
await gest('g0_idle_3s', () => wait(3000));

/* G1 the exact user pattern: 5 flicks crossing continents */
await gest('g1_flicks', async () => {
  await drag(260, 430, 240, 60, 22, 15); await wait(250);   // west flick (Asia→Europe→Atlantic)
  await drag(140, 430, 250, 0, 22, 15); await wait(250);    // further west (→America)
  await drag(150, 300, 60, 180, 22, 15); await wait(250);   // south
  await drag(200, 520, -80, -220, 22, 15); await wait(250); // north-east back
  await drag(300, 350, -260, 30, 22, 15); await wait(250);  // east long
});

/* G2 pinch zoom in and out */
await gest('g2_pinch', async () => {
  await pinch(200, 420, 40, 120, 14, 22); await wait(400);
  await pinch(200, 420, 120, 45, 14, 22); await wait(400);
});

/* G3 repeated small pans (browsing around a continent, like reading the map) */
await gest('g3_browse', async () => {
  for (let i = 0; i < 6; i++) { await drag(200 + (i % 2) * 40, 420, (i % 2 ? -1 : 1) * 90, (i % 3 - 1) * 60, 12, 17); await wait(180); }
});

await cdp.send('Profiler.stop').then((p) => { Out.cpu_top = topSelf(p.profile, 22); });

Out.zoom_after = await page.evaluate(() => ({ z: map.getZoom(), c: map.getCenter() }));
function topSelf(profile, n) {
  const byId = new Map(); (profile.nodes || []).forEach((nd) => byId.set(nd.id, nd));
  const self = new Map();
  const urlOf = (id) => { const nd = byId.get(id); if (!nd) return '?'; const cf = nd.callFrame || {}; return (cf.url || '').split('/').pop() + ':' + (cf.functionName || '(anon)'); };
  (profile.samples || []).forEach((id, i) => {
    const dT = (i + 1 < profile.timeDeltas.length) ? profile.timeDeltas[i + 1] : profile.timeDeltas[i] || 0;
    const k = urlOf(id); self.set(k, (self.get(k) || 0) + dT);
  });
  return [...self.entries()].filter(([k]) => k !== ':(idle)' && k !== ':(program)' && !k.endsWith(':(garbage collector)')).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, Math.round(v / 1000) + 'ms']);
}

console.log(JSON.stringify(Out, null, 1));
await browser.close();
process.exit(0);
