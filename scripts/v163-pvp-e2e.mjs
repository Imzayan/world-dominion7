/* V163 PVP ATTACK E2E — full browser reproduction of the owner's bug:
 * "attacking a country that HAS an owner → progress bar never fills, attack never executes".
 * Real Chromium + real map click pipeline: click owned country → drawer button →
 * briefing → آغاز عملیات → battle modal → watch #battle-progress-bar fill.
 * Run: node scripts/v163-pvp-e2e.mjs   (live server on :3000 required)
 */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

async function rpc(fn, args, ck) {
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(ck ? { Cookie: ck } : {}) },
    body: JSON.stringify(args || {}),
  });
  const j = await r.json().catch(() => ({}));
  return j.data !== undefined ? j.data : j;
}
async function signup(tag) {
  for (let a = 0; a < 14; a++) {
    const r = await fetch(BASE + '/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pvpe163' + tag + '@test.local', password: 'pvpe163test', nick: 'PVPE163' + tag }),
    });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    const ck = sc.find((c) => c.startsWith('wd_session='));
    const j = await r.json().catch(() => ({}));
    if (ck && j?.data?.user?.id) return { token: ck.split(';')[0].split('=')[1], uid: j.data.user.id, nick: 'PVPE163' + tag };
    await new Promise((res) => setTimeout(res, 5500));
  }
  throw new Error('signup kept failing — tag=' + tag);
}

const ts = Date.now().toString(36).slice(-6);
const SRV = 92;
const TARGET = 'Brazil';   /* B's country */
const HOME = 'Uruguay';    /* A's capital */

const A = await signup('a' + ts);
await new Promise((r) => setTimeout(r, 800));
const B = await signup('b' + ts);
await new Promise((r) => setTimeout(r, 800));

await db.user.update({ where: { id: A.uid }, data: { createdAt: new Date(Date.now() - 10 * 86400_000) } });
await db.user.update({ where: { id: B.uid }, data: { createdAt: new Date(Date.now() - 10 * 86400_000) } });
await db.territory.create({ data: { server: SRV, country: TARGET, userId: B.uid, nick: B.nick, isCapital: true } }).catch((e) => console.log('terrB', e.message));
await db.territory.create({ data: { server: SRV, country: HOME, userId: A.uid, nick: A.nick, isCapital: true } }).catch((e) => console.log('terrA', e.message));

const B_STATE = { my: TARGET, conq: [TARGET], res: { gold: 20000, oil: 20000, food: 20000 }, units: { infantry: 300 } };
await db.save.upsert({ where: { userId: B.uid }, create: { userId: B.uid, nick: B.nick, state: JSON.stringify(B_STATE) }, update: { state: JSON.stringify(B_STATE) } });
const A_STATE = { my: HOME, conq: [HOME], res: { gold: 500000, oil: 500000, food: 500000 }, units: { infantry: 20000, tank: 1500, bomber: 200, fighter: 200 } };
await db.save.upsert({ where: { userId: A.uid }, create: { userId: A.uid, nick: A.nick, state: JSON.stringify(A_STATE) }, update: { state: JSON.stringify(A_STATE) } });
await db.score.updateMany({ where: { userId: A.uid }, data: { server: SRV, score: 5000 } });
await db.score.updateMany({ where: { userId: B.uid }, data: { server: SRV, score: 800 } });
console.log('--- seeded: ' + A.nick + ' (score 5000) attacks ' + TARGET + ' owned by ' + B.nick);

const { chromium } = await import('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
});
await ctx.addCookies([{ name: 'wd_session', value: A.token, url: BASE }]);
const page = await ctx.newPage();

const pageErrors = [], consoleErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });

let pvpResp = null, pvpStatus = 0, pvpMs = 0, pvpAt = 0;
page.on('response', async (r) => {
  if (r.url().includes('/api/rpc/pvp_attack')) {
    pvpAt = Date.now(); pvpStatus = r.status();
    try { pvpResp = await r.json(); } catch (e) { pvpResp = { parseErr: String(e) }; }
  }
});
page.on('request', (r) => { if (r.url().includes('/api/rpc/pvp_attack')) pvpMs = -1; });

await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });

/* wait for map + OTH to show the owned target */
let othReady = false;
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(1000);
  othReady = await page.evaluate(() => !!(window.OTH && OTH['Brazil'])).catch(() => false);
  if (othReady) break;
}
check('T1 OTH["Brazil"] visible (owned-country state reached the client)', othReady, 'waited 60s');

/* real map-click pipeline on Brazil */
await page.evaluate(() => {
  const g = getG('Brazil');
  map.fire('click', { latlng: L.latLng((g.s + g.n) / 2, (g.w + g.e) / 2) });
});
await page.waitForTimeout(900);
let btn = null;
for (let i = 0; i < 10; i++) {
  btn = await page.evaluate(() => {
    const d = document.getElementById('drawer-actions');
    if (!d) return null;
    const b = Array.from(d.querySelectorAll('button')).find((x) => /عملیات زمینی/.test(x.textContent || ''));
    return b ? b.textContent : null;
  });
  if (btn) break;
  await page.evaluate(() => { try { onCountryClick({ properties: { name: 'Brazil' } }, layersByName['Brazil']) } catch (e) {} });
  await page.waitForTimeout(500);
}
check('T2 drawer shows the PvP ground-ops button', !!btn, JSON.stringify(btn));

/* T2b — the WD65 war-plan path: attackTarget() on an OWNED country must reach the PvP
 * briefing (V39), NOT the stale V28 toast "حمله به بازیکنان هنوز فعال نیست" */
const staleToast = await page.evaluate(async () => {
  let toastText = '';
  const _st = window.showToast;
  window.showToast = function (t) { toastText += String(t) + ' | '; };
  try { await attackTarget('Brazil'); } catch (e) { toastText += 'ERR:' + e.message; }
  window.showToast = _st;
  return toastText;
});
const wentStale = /هنوز فعال نیست/.test(staleToast);
const briefFromPath = await page.evaluate(() => !!(document.getElementById('wd39-brief') && document.getElementById('wd39-brief').classList.contains('active')));
check('T2b attackTarget(owned) routes into the PvP flow (no stale V28 toast)', !wentStale && briefFromPath, 'toast="' + staleToast.slice(0, 120) + '" brief=' + briefFromPath);
/* close whatever opened so the map-click flow can proceed cleanly */
await page.evaluate(() => { try { closeModal('wd39-brief') } catch (e) {} });

if (btn) {
  await page.evaluate(() => {
    const d = document.getElementById('drawer-actions');
    const b = Array.from(d.querySelectorAll('button')).find((x) => /عملیات زمینی/.test(x.textContent || ''));
    b.click();
  });
  const briefOpen = await page.waitForFunction(() => document.getElementById('wd39-brief') && document.getElementById('wd39-brief').classList.contains('active'), { timeout: 8000 }).then(() => true).catch(() => false);
  check('T3 briefing modal opened', briefOpen);
  const goEnabled = await page.evaluate(() => { const g = document.getElementById('wd39-go'); return g ? !g.disabled : false; });
  check('T4 آغاز عملیات enabled (army+logistics+treasury gates pass)', goEnabled);
  if (briefOpen) {
    await page.screenshot({ path: '/tmp/v163-brief.png' });
    await page.evaluate(() => document.getElementById('wd39-go').click());
    /* battle modal: watch the progress bar fill */
    let maxW = 0, sawRounds = false, resultText = '', closeShown = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 30000) {
      const s = await page.evaluate(() => {
        const m = document.getElementById('m-battle');
        const bar = document.getElementById('battle-progress-bar');
        const cb = document.getElementById('battle-close-btn');
        const log = document.getElementById('battle-result-text');
        return {
          open: !!(m && m.classList.contains('active')),
          w: bar ? parseFloat(bar.style.width || '0') : -1,
          pct: (document.getElementById('battle-pct-label') || {}).textContent || '',
          close: !!(cb && cb.style.display !== 'none' && cb.style.display !== ''),
          txt: log ? log.textContent.slice(0, 400) : '',
        };
      }).catch(() => null);
      if (s) {
        if (s.w > maxW) maxW = s.w;
        if (/دور/.test(s.txt)) sawRounds = true;
        resultText = s.txt; closeShown = s.close;
      }
      if (s && s.close && s.w >= 0 && (maxW > 8 || /سقف|آتش‌بس|صلح|انجام نشد|دفع|سقوط|تصرف|پیشروی/.test(resultText))) break;
      await page.waitForTimeout(400);
    }
    console.log('--- battle: maxBar=' + maxW + '% rounds=' + sawRounds + ' close=' + closeShown);
    console.log('--- result: ' + resultText.replace(/\s+/g, ' ').slice(0, 300));
    console.log('--- pvp_attack: status=' + pvpStatus + ' resp=' + JSON.stringify(pvpResp).slice(0, 400));
    check('T5 pvp_attack reached the server over the browser session', pvpStatus === 200 && pvpResp, 'status=' + pvpStatus);
    check('T6 server adjudicated (rounds[] in response)', !!(pvpResp && pvpResp.data && Array.isArray(pvpResp.data.rounds)), JSON.stringify(pvpResp).slice(0, 200));
    check('T7 progress bar actually FILLED (>8%)', maxW > 8, 'maxW=' + maxW + '%');
    check('T8 battle screen produced a verdict + close button', closeShown, resultText.slice(0, 120));
    await page.screenshot({ path: '/tmp/v163-battle.png' });
  }
}

check('T9 zero pageerrors during the whole flow', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
if (consoleErrors.length) console.log('console errors (first 5):', consoleErrors.slice(0, 5));

await browser.close();
/* cleanup synthetic rows */
await db.territory.deleteMany({ where: { server: SRV } });
await db.battleLog.deleteMany({ where: { attacker: { in: [A.nick, B.nick] } } }).catch(() => {});
await db.save.deleteMany({ where: { userId: { in: [A.uid, B.uid] } } }).catch(() => {});
await db.user.deleteMany({ where: { email: { endsWith: 'pvpe163@test.local' } } }).catch(() => {});
console.log('\nPVP163 E2E: ' + ok + ' pass, ' + fail + ' fail');
await db.$disconnect();
process.exit(fail ? 1 : 0);
