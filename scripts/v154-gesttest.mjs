process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const { chromium } = await import('playwright');
const db = new PrismaClient();
const BASE = 'http://localhost:3000';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = Date.now().toString(36);
const sr = await fetch(BASE + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'v154g' + ts + '@test.local', password: 'secret154', nick: 'V154G' + ts.slice(-4) }) });
let cookie = '';
for (const c of (sr.headers.getSetCookie ? sr.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
const uid = (await sr.json().catch(() => ({})))?.data?.user?.id;
const rpc = async (fn, args) => { const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(args || {}) }); const j = await r.json().catch(() => ({})); return j.data !== undefined ? j.data : j; };
await wait(150);
const ws = await rpc('wd_servers', {});
const tst = (ws?.test_srvs || []).map(Number);
const open = (ws?.servers || []).find((s) => !tst.includes(s.server) && s.status !== 'full' && s.status !== 'maintenance');
await db.save.upsert({ where: { userId: uid }, create: { userId: uid, nick: 'V154G' + ts.slice(-4), state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) }, update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) } });
await rpc('territory_sync', { p_server: open?.server || 1, p_held: ['Iraq'], p_capital: 'Iraq' });
await db.score.updateMany({ where: { userId: uid }, data: { server: open?.server || 1 } });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.75 });
await ctx.addCookies([{ name: 'wd_session', value: cookie.split('=')[1], url: BASE }]);
const page = await ctx.newPage();
await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 60000 });
// fire real Leaflet events to prove wiring
const r1 = await page.evaluate(async () => {
  const map = window.__wdMapGet ? window.__wdMapGet() : (typeof map !== 'undefined' ? map : null);
  if (!map) return 'NO-MAP';
  map.fire('zoomstart');
  await new Promise((r) => requestAnimationFrame(r));
  const on = document.documentElement.classList.contains('wd-gest');
  map.fire('zoomend');
  await new Promise((r) => setTimeout(r, 400));
  const off = document.documentElement.classList.contains('wd-gest');
  return { on, off: !off, zoom: map.getZoom() };
});
// real CDP pinch with enough moves for Leaflet to engage
const cdp = await ctx.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 140, y: 380, id: 1 }, { x: 250, y: 380, id: 2 }] });
let on2 = false;
for (let i = 0; i < 8; i++) {
  const g = 55 + i * 8;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195 - g, y: 380, id: 1 }, { x: 195 + g, y: 380, id: 2 }] });
  await wait(60);
  if (!on2) on2 = await page.evaluate(() => document.documentElement.classList.contains('wd-gest'));
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await wait(600);
const off2 = await page.evaluate(() => document.documentElement.classList.contains('wd-gest'));
console.log(JSON.stringify({ synthetic: r1, cdpPinch: { on: on2, off: !off2 } }));
await browser.close(); process.exit(0);
