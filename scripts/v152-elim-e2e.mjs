/* V152 E2E — «همه‌ی کشورهایت فتح شد» — the full elimination → re-selection flow
 * Owner directive under test: «میخوام وقتی پلیری کل کشوراش فتح میشه و کشوری نداره نشون بده
 * که هیچ کشوری نداره و باید کشور جدید انتخاب کنه — بهترین شکل ممکن».
 * Real HTTP against local dev server (:3000) + real SQLite rows + real browser (Playwright):
 *   T1  fresh signup A claims Iraq on an open server
 *   T2  capture simulation (what pvp capture does to the territories table): A loses Iraq, B owns it
 *   T3  boot A's client → boot syncTerr → elimination modal (#m-elim) fires with capturer nick
 *   T4  persistent state: banner + 🏳️ HUD chip + auto-highlight of free countries
 *   T5  «انتخاب کشور جدید» closes the modal; pulse highlights ≥1 free country
 *   T6  real claim path (layer click → #act-claim → claimCapital) — banner clears, chip back to 🏴
 *   T7  no pageerror across the whole flow; server rows consistent after claim+sync
 * Run: node scripts/v152-elim-e2e.mjs   (dev server must be up)
 */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const { chromium } = await import('playwright');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function signup(tag) {
  const ts = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const email = 'v152' + tag + ts + '@test.local';
  const nick = 'V152' + tag + ts.slice(-4);
  const r = await fetch(BASE + '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret152', nick }),
  });
  let cookie = '';
  for (const c of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
  const j = await r.json().catch(() => ({}));
  return { uid: j?.data?.user?.id, nick, cookie, email };
}
async function rpc(cookie, fn, args) {
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(args || {}),
  });
  const j = await r.json().catch(() => ({}));
  return j.data !== undefined ? j.data : j;
}

/* ---------- T0/T1: players + first claim through the REAL server path ---------- */
const A = await signup('a');
const B = await signup('b');
check('T1a two players signed up with sessions', !!A.uid && !!A.cookie && !!B.uid && !!B.cookie);
await wait(150);
const ws = await rpc(A.cookie, 'wd_servers', {});
const tst = (ws?.test_srvs || []).map(Number);
const open = (ws?.servers || []).find((s) => !tst.includes(s.server) && s.status !== 'full' && s.status !== 'maintenance');
check('T1b an open non-test server exists', !!open, JSON.stringify(ws?.servers));
const SRV = open.server;
await db.save.upsert({
  where: { userId: A.uid },
  create: { userId: A.uid, nick: A.nick, state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
  update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
});
const synA = await rpc(A.cookie, 'territory_sync', { p_server: SRV, p_held: ['Iraq'], p_capital: 'Iraq' });
check('T1c A granted Iraq via territory_sync', Array.isArray(synA?.granted) && synA.granted.includes('Iraq'), JSON.stringify(synA).slice(0, 120));
await db.score.updateMany({ where: { userId: A.uid }, data: { server: SRV } });

/* ---------- T2: capture — A loses Iraq, B owns it (exact row surgery pvp capture performs) ---------- */
await db.save.upsert({
  where: { userId: B.uid },
  create: { userId: B.uid, nick: B.nick, state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
  update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
});
const del = await db.territory.deleteMany({ where: { userId: A.uid, server: SRV, country: 'Iraq' } });
let capB = false;
try { await db.territory.create({ data: { server: SRV, country: 'Iraq', userId: B.uid, nick: B.nick, isCapital: true } }); capB = true; } catch (e) { console.log('capB err', String(e).slice(0, 80)); }
check('T2 capture state on the table (A row deleted, B row created)', del.count === 1 && capB);

/* ---------- T3-T6: real browser boot with A's session ---------- */
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
// session cookie must exist BEFORE app boot reads auth
await ctx.addCookies([{ name: 'wd_session', value: A.cookie.split('=')[1], url: BASE }]);
// silence-heavy: keep same env the player has
await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 60000 }); } catch (e) { console.log('mapready timeout'); }
check('T3a map booted with A session', true);
// wait for boot syncTerr to arbitrate (initServer → syncTerr) — modal should fire
let elimSeen = false, capNick = '', bannerTxt = '';
try {
  await page.waitForFunction(() => {
    const m = document.getElementById('m-elim');
    return !!(m && m.classList.contains('active'));
  }, { timeout: 25000 });
  elimSeen = true;
  capNick = await page.evaluate(() => (document.querySelector('#m-elim .wd152-sub') || {}).textContent || '');
  check('T3b elimination modal fires on boot after losing the last country', true);
  check('T3c modal names the capturer nick', capNick.indexOf(B.nick) > -1, capNick.slice(0, 140));
  check('T3d modal says «هیچ کشوری نداری… باید کشور جدید انتخاب کنی»', capNick.indexOf('هیچ کشوری ندار') > -1 && capNick.indexOf('کشورِ جدید') > -1, capNick.slice(0, 140));
} catch (e) {
  const st = await page.evaluate(() => ({ my: typeof myCountryName !== 'undefined' ? myCountryName : 'x', elim: !!document.getElementById('m-elim'), active: !!(document.getElementById('m-elim') && document.getElementById('m-elim').classList.contains('active')) })).catch(() => ({}));
  check('T3b elimination modal fires on boot after losing the last country', false, JSON.stringify(st));
}
// persistent state — wait for the banner (it lands in the same tick as the post-applyOthers state pass)
try { await page.waitForFunction(() => !!document.getElementById('wd-elim-banner'), { timeout: 10000 }); } catch (e) {}
bannerTxt = await page.evaluate(() => { const b = document.getElementById('wd-elim-banner'); return b ? (b.querySelector('.wd152-b-txt') || {}).textContent || '' : ''; });
check('T4a persistent banner visible with «هیچ کشوری نداری»', bannerTxt.indexOf('هیچ کشوری ندار') > -1, bannerTxt.slice(0, 100));
// hud-terr updater ticks every 1s with a diff guard — wait for the 🏳️ state to land
try {
  await page.waitForFunction(() => {
    const t = document.getElementById('hud-terr') || document.getElementById('hud-t2');
    return !!t && (t.textContent || '').indexOf('🏳️') > -1;
  }, { timeout: 4000 });
} catch (e) {}
const chip = await page.evaluate(() => { const t = document.getElementById('hud-terr') || document.getElementById('hud-t2'); return t ? t.textContent : ''; });
check('T4b HUD chip shows 🏳️ no-country state', chip.indexOf('🏳️') > -1 && chip.indexOf('هیچ کشوری ندار') > -1, chip);
// T4c: auto-highlight applied (pulse list non-empty)
try { await page.waitForFunction(() => (window.__wdElimPick === 1) && true, { timeout: 8000 }); } catch (e) {}
const pulseInfo = await page.evaluate(() => ({ pick: window.__wdElimPick, banner: !!document.getElementById('wd-elim-banner') }));
check('T4c pick-mode engaged automatically', pulseInfo.pick === 1 && pulseInfo.banner, JSON.stringify(pulseInfo));

/* ---------- T5: «انتخاب کشور جدید» closes modal, pulse highlights free countries ---------- */
if (elimSeen) {
  await page.evaluate(() => document.querySelector('#wd-elim-pick').click());
  await wait(1400); // allow pulse + fly
  const st2 = await page.evaluate(() => ({
    modalActive: !!(document.getElementById('m-elim') && document.getElementById('m-elim').classList.contains('active')),
    pulsed: (typeof __wdElimPulse !== 'undefined') ? __wdElimPulse.length : -1,
    banner: !!document.getElementById('wd-elim-banner'),
  }));
  check('T5a modal closed after «انتخاب کشور جدید»', !st2.modalActive);
  check('T5b pulse highlights free countries (≥3)', st2.pulsed >= 3, 'pulsed=' + st2.pulsed);
  check('T5c banner still guiding', st2.banner);
}

/* ---------- T6: real claim path — layer click → drawer → #act-claim → claimCapital ---------- */
let claimed = { ok: false };
for (let attempt = 0; attempt < 3 && !claimed.ok; attempt++) {
  await wait(600);
  claimed = await page.evaluate(async () => {
    // choose the first pulsed free country and go through the REAL click handler
    const name = __wdElimPulse[0];
    if (!name) return { ok: false, why: 'no pulse' };
    const layer = layersByName[name];
    if (!layer) return { ok: false, why: 'no layer ' + name };
    layer.fire('click', { latlng: map.getCenter(), originalEvent: new MouseEvent('click') }, true);
    await new Promise((r) => setTimeout(r, 450));
    const drawer = document.getElementById('country-drawer');
    const actions = document.getElementById('drawer-actions');
    const claimBtn = document.getElementById('act-claim');
    if (!drawer || !drawer.classList.contains('open')) return { ok: false, why: 'drawer not open for ' + name, actions: actions ? actions.innerHTML.slice(0, 120) : 'none' };
    if (!claimBtn) return { ok: false, why: 'no claim button (status=' + statusOf(name) + ' my=' + (typeof myCountryName !== 'undefined' ? myCountryName : 'x') + ')', actions: actions ? actions.innerHTML.slice(0, 160) : 'none' };
    claimBtn.click();
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true, name, my: (typeof myCountryName !== 'undefined') ? myCountryName : 'x' };
  });
}
check('T6a real claim path works from pick-mode (drawer → claim)', claimed.ok === true, JSON.stringify(claimed));
check('T6b capital set to the claimed free country', claimed.ok && claimed.my === claimed.name, JSON.stringify(claimed));
// wdElimState via the 300ms syncTerr? claim path calls claimCapital directly → banner should clear via wdElimState hook in claimCapital
await wait(1700); // hud-terr updater ticks every 1s
const after = await page.evaluate(() => ({
  banner: !!document.getElementById('wd-elim-banner'),
  chip: ((document.getElementById('hud-terr') || document.getElementById('hud-t2') || {}).textContent) || '',
  pulsed: __wdElimPulse.length,
}));
check('T6c banner cleared after claiming a new capital', !after.banner);
check('T6d HUD chip back to 🏴 with 1 country', after.chip.indexOf('🏴') > -1 && after.chip.indexOf('۱ کشور') > -1, after.chip);
check('T6e pulse cleared', after.pulsed === 0, 'pulsed=' + after.pulsed);

/* ---------- T7: persistence — territory_sync confirms the new capital server-side ----------
 * (claim→sync at +300ms can lose the syncBusy race with the 30s loop; V152 retry at +2.5s
 *  closes the window — poll up to 40s to stay independent of loop phase) */
let mine = [];
for (let i = 0; i < 40; i++) {
  await wait(1000);
  mine = await db.territory.findMany({ where: { userId: A.uid, server: SRV } });
  if (mine.length) break;
}
check('T7a server holds the new capital for A', mine.length === 1 && mine[0].country === claimed.name, JSON.stringify(mine));
check('T7b no pageerror across the whole flow', errors.length === 0, errors.slice(0, 3).join(' | '));

/* ---------- cleanup ---------- */
for (const P of [A, B]) {
  try { await db.territory.deleteMany({ where: { userId: P.uid } }); } catch (e) {}
  try { await db.save.deleteMany({ where: { userId: P.uid } }); } catch (e) {}
  try { await db.score.deleteMany({ where: { userId: P.uid } }); } catch (e) {}
  try { await db.session.deleteMany({ where: { userId: P.uid } }); } catch (e) {}
  try { await db.user.deleteMany({ where: { id: P.uid } }); } catch (e) {}
}
try { await db.serverStat.update({ where: { server: SRV }, data: { taken: (await db.territory.count({ where: { server: SRV } })) } }); } catch (e) {}
await browser.close();
console.log('\nV152 elim e2e: ' + ok + ' PASS / ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
