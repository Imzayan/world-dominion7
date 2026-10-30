/* V156 path attribution — who are the (anon) burners during a browse window?
 * runs ONE 8s browse session in-game, profiles at 100μs, aggregates self-time
 * AND top 3-frame call paths (child ← parent ← grandparent). */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const { chromium } = await import('playwright');
const db = new PrismaClient();
const BASE = process.argv[2] || 'http://localhost:3000';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ts = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const sr = await fetch(BASE + '/api/auth/signup', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'v156p' + ts + '@test.local', password: 'secret156', nick: 'V156P' + ts.slice(-4) }),
});
let cookie = '';
for (const c of (sr.headers.getSetCookie ? sr.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
const uid = (await sr.json())?.data?.user?.id;
const rpc = async (fn, args) => (await (await fetch(BASE + '/api/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(args || {}) })).json()).data;
await db.save.upsert({ where: { userId: uid }, create: { userId: uid, nick: 'V156P' + ts.slice(-4), state: JSON.stringify({ my: 'Bolivia', conq: ['Bolivia'], res: { gold: 50000, oil: 4000, food: 6000 } }) }, update: { state: JSON.stringify({ my: 'Bolivia', conq: ['Bolivia'], res: { gold: 50000, oil: 4000, food: 6000 } }) } });
const ws = await rpc('wd_servers', {});
const SRV = (ws?.servers || [])[0]?.server || 1;
await rpc('territory_sync', { p_server: SRV, p_held: ['Bolivia'], p_capital: 'Bolivia' });
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
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });
await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 40000 }); } catch (e) {}
await wait(4500);
await page.evaluate(async () => {
  const act = () => [...document.querySelectorAll('.modal.active')].map((e) => e.id);
  if (document.getElementById('m-elim') && document.getElementById('m-elim').classList.contains('active')) {
    const pk = document.querySelector('#wd-elim-pick'); if (pk) pk.click();
    await new Promise((r) => setTimeout(r, 600));
  }
  if (document.getElementById('m-srv') && document.getElementById('m-srv').classList.contains('active')) {
    const x = document.querySelector('#m-srv .close-modal,#m-srv .close'); if (x) x.click();
    await new Promise((r) => setTimeout(r, 500));
  }
  window.__inGame = { modals: act(), my: typeof myCountryName !== 'undefined' ? myCountryName : null };
});
console.log('inGame:', JSON.stringify(await page.evaluate(() => window.__inGame)));

await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
await cdp.send('Profiler.start');
/* 8s of realistic browsing */
const cdp2 = cdp;
const drag = async (x0, y0, dx, dy, steps, stepMs) => {
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= steps; i++) { await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps, id: 1 }] }); await wait(stepMs); }
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
for (let k = 0; k < 7; k++) { await drag(220 + (k % 2) * 60, 420, (k % 2 ? -1 : 1) * 160, (k % 3 - 1) * 70, 16, 16); await wait(300); }
const prof = await cdp.send('Profiler.stop');
const Out = { topSelf: topSelf(prof.profile, 24), topPaths: topPaths(prof.profile, 26) };
console.log(JSON.stringify(Out, null, 1));

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
function topPaths(profile, n) {
  const byId = new Map(); (profile.nodes || []).forEach((nd) => byId.set(nd.id, nd));
  (profile.nodes || []).forEach((nd) => ((nd.children || [])).forEach((cid) => { const c = byId.get(cid); if (c) c.parent = nd; }));
  const self = new Map();
  (profile.samples || []).forEach((id, i) => {
    const dT = (i + 1 < profile.timeDeltas.length) ? profile.timeDeltas[i + 1] : profile.timeDeltas[i] || 0;
    self.set(id, (self.get(id) || 0) + dT);
  });
  const nameOf = (nd) => { const cf = nd.callFrame || {}; return (cf.functionName || '(anon)') + '@' + (cf.url || '').split('/').pop().replace('index.html', 'idx'); };
  const paths = new Map();
  for (const [id, t] of self) {
    if (t < 8000) continue; // <8ms self: skip
    const nd = byId.get(id); if (!nd) continue;
    const chain = [nameOf(nd)];
    let p = nd.parent;
    let hops = 0;
    while (p && hops < 2) { const nm = nameOf(p); if (chain[chain.length - 1].split('@')[0] !== nm.split('@')[0]) chain.push(nm); p = p.parent; hops++; }
    if (chain.length === 1) chain.push('← (root/timer)');
    const key = chain.join(' ← ');
    paths.set(key, (paths.get(key) || 0) + t);
  }
  return [...paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [Math.round(v / 1000) + 'ms', k]);
}
await browser.close(); process.exit(0);
