/* V154 DEEP PROBE — find the REAL culprits behind «همه جا لگ داره»:
 *   P1 boot CPU self-time by function (0-10s)      → what burns 6.9s of boot longtasks
 *   P2 idle CPU self-time by function (12s window) → what blocks frames between gestures
 *   P3 map-pane CSS audit                          → expensive effects re-rastering during pinch
 *   P4 tap path trace                              → what runs on a country tap before drawer
 * usage: node scripts/v154-probe.mjs [url]
 */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const { chromium } = await import('playwright');
const db = new PrismaClient();
const BASE = process.argv[2] || 'http://localhost:3000';
const Out = {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ts = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const sr = await fetch(BASE + '/api/auth/signup', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'v154q' + ts + '@test.local', password: 'secret154', nick: 'V154Q' + ts.slice(-4) }),
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
  create: { userId: uid, nick: 'V154Q' + ts.slice(-4), state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
  update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
});
await rpc('territory_sync', { p_server: SRV, p_held: ['Iraq'], p_capital: 'Iraq' });
await db.score.updateMany({ where: { userId: uid }, data: { server: SRV } });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
await ctx.addCookies([{ name: 'wd_session', value: cookie.split('=')[1], url: BASE }]);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.emulateNetworkConditions', {
  offline: false, latency: 120, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});

/* P1 — boot CPU profile */
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');
await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 40000 }); } catch (e) {}
await wait(4000);
let prof = await cdp.send('Profiler.stop');
Out.boot_cpu_top = topSelf(prof.profile, 25);

/* P2 — idle CPU profile (12s, no gestures) */
await cdp.send('Profiler.start');
await wait(12000);
prof = await cdp.send('Profiler.stop');
Out.idle_cpu_top = topSelf(prof.profile, 20);

/* P3 — map pane CSS audit */
Out.pane_css = await page.evaluate(() => {
  const panes = document.querySelectorAll('.leaflet-pane *');
  const bad = { backdrop: 0, filter: 0, shadow: 0, blur_img: 0, big_imgs: 0, fixed_layers: 0 };
  const samples = [];
  panes.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const cs = getComputedStyle(el);
    if (cs.backdropFilter && cs.backdropFilter !== 'none') { bad.backdrop++; if (samples.length < 12) samples.push('backdrop:' + (el.className || el.tagName).toString().slice(0, 60)); }
    if (cs.filter && cs.filter !== 'none') { bad.filter++; if (samples.length < 12) samples.push('filter:' + (el.className || el.tagName).toString().slice(0, 60)); }
    const sh = cs.boxShadow;
    if (sh && sh !== 'none' && sh.length > 40) { bad.shadow++; if (samples.length < 16) samples.push('shadow:' + (el.className || el.tagName).toString().slice(0, 60)); }
  });
  document.querySelectorAll('img').forEach((im) => { if (im.naturalWidth > 512) bad.big_imgs++; });
  bad.leaflet_pane_nodes = panes.length;
  bad.samples = samples;
  return bad;
});

/* P4 — tap trace: instrument what runs on tap → drawer */
Out.tap_trace = await page.evaluate(async () => {
  const c = document.querySelector('.leaflet-container');
  if (!c) return 'NO-MAP';
  const r = c.getBoundingClientRect();
  const read = () => new Promise((res) => requestAnimationFrame(res));
  // center of a country: find an owned path bbox via Leaflet if possible, else center-screen
  for (let i = 0; i < 3; i++) await read();
  const t0 = performance.now();
  const marks = [];
  const obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 30) marks.push([Math.round(e.startTime - t0), Math.round(e.duration)]); });
  try { obs.observe({ entryTypes: ['longtask'] }); } catch (e) {}
  const px = r.x + r.width / 2, py = r.y + r.height * 0.42;
  c.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: c, clientX: px, clientY: py })], changedTouches: [new Touch({ identifier: 1, target: c, clientX: px, clientY: py })] }));
  await read(); await read();
  c.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [new Touch({ identifier: 1, target: c, clientX: px, clientY: py })] }));
  for (let i = 0; i < 150; i++) { await read(); const d = document.getElementById('country-drawer'); if (d && d.classList.contains('open')) break; }
  obs.disconnect();
  return { drawer_open: !!(document.getElementById('country-drawer') && document.getElementById('country-drawer').classList.contains('open')), ms: Math.round(performance.now() - t0), longtasks: marks };
});

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
