/* V156 fast-pan visual identity: pan (fast path) → capture canvas → force full redraw of
 * the same view → capture again → pixel diff must be ~zero */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const { chromium } = await import('playwright');
const db = new PrismaClient();
const BASE = 'http://localhost:3000';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const sr = await fetch(BASE + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'v156x' + ts + '@test.local', password: 'x12345', nick: 'V156X' + ts.slice(-4) }) });
let cookie = '';
for (const c of (sr.headers.getSetCookie ? sr.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
const uid = (await sr.json())?.data?.user?.id;
const rpc = async (fn, args) => (await (await fetch(BASE + '/api/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(args || {}) })).json()).data;
await db.save.upsert({ where: { userId: uid }, create: { userId: uid, nick: 'V156X' + ts.slice(-4), state: JSON.stringify({ my: 'Bolivia', conq: ['Bolivia'] }) }, update: { state: JSON.stringify({ my: 'Bolivia', conq: ['Bolivia'] }) } });
await rpc('territory_sync', { p_server: 1, p_held: ['Bolivia'], p_capital: 'Bolivia' });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.75 });
await ctx.addCookies([{ name: 'wd_session', value: cookie.split('=')[1], url: BASE }]);
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 150)));
await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded' });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 40000 }); } catch (e) {}
await wait(5000);
await page.evaluate(async () => {
  if (document.getElementById('m-elim')?.classList.contains('active')) { document.querySelector('#wd-elim-pick')?.click(); await new Promise((r) => setTimeout(r, 500)); }
  if (document.getElementById('m-srv')?.classList.contains('active')) { document.querySelector('#m-srv .close-modal,#m-srv .close')?.click(); await new Promise((r) => setTimeout(r, 400)); }
});
const res = await page.evaluate(async () => {
  const out = {};
  out.canvases = document.querySelectorAll('#map canvas').length;
  const cv = window.WD_VEC && window.WD_VEC._container;
  if (!cv) return { err: 'no WD_VEC canvas' };
  const snap = () => { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; c2.getContext('2d').drawImage(cv, 0, 0); return c2; };
  const diff = (a, b) => {
    const x = a.getContext('2d').getImageData(0, 0, a.width, a.height).data;
    const y = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
    let bad = 0, mx = 0;
    for (let i = 0; i < x.length; i += 4) {
      const d = Math.max(Math.abs(x[i] - y[i]), Math.abs(x[i + 1] - y[i + 1]), Math.abs(x[i + 2] - y[i + 2]));
      if (d > 32) bad++; if (d > mx) mx = d;
    }
    return { bad, mx, total: x.length / 4 };
  };
  /* land on a fixed view over Africa, then fast-pan west twice, then compare */
  map.setView([10, 20], 3);
  await new Promise((r) => setTimeout(r, 900));
  map.panBy([-200, 0], { animate: false }); map.fire('moveend');
  await new Promise((r) => setTimeout(r, 300));
  map.panBy([0, -120], { animate: false }); map.fire('moveend');
  await new Promise((r) => setTimeout(r, 300));
  const fast = snap();
  const center = map.getCenter(), zoom = map.getZoom();
  /* force the FULL path for the identical view: nudge zoom away and back */
  map.setZoom(zoom + 0.5); await new Promise((r) => setTimeout(r, 400));
  map.setZoom(zoom); await new Promise((r) => setTimeout(r, 900));
  const full = snap();
  out.centerMatch = Math.abs(map.getCenter().lat - center.lat) < 0.01 && Math.abs(map.getCenter().lng - center.lng) < 0.01;
  out.diff = diff(fast, full);
  return out;
});
console.log(JSON.stringify(res, null, 1));
await browser.close(); process.exit(0);
