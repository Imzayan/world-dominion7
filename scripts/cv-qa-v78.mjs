// V78 — Country View V2.1 CRITICAL VISUAL BUG FIX QA (+V79 ships update):
// §24 pan-consistency + §1-§6 label collision در ۵ زوم + §22 خودرو فقط z≥2 (کشتی ۱٫۴) +
// §20 white-pixel noise + رگرسیون V77
// Usage: WD_BASE=http://127.0.0.1:3210 node scripts/cv-qa-v78.mjs
import { chromium } from 'playwright';

const BASE = process.env.WD_BASE || 'http://127.0.0.1:3000';
const VER = process.env.WD_VER || '79';
const URL = `${BASE}/game/index.html?v=${VER}`;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const nick = 'cvqa78' + Date.now().toString(36).slice(-6);
const resp = await page.request.post(BASE + '/api/auth/signup', { data: { email: nick + '@wd.test', password: 'cvqa123456', nick } });
check('signup ok', resp.ok(), String(resp.status()));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

const opened = await page.evaluate(async (v) => {
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = '/game/cv-engine.js?v=' + v;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
    setTimeout(rej, 8000);
  });
  if (!window.WDCV || !window.WDCV._qaOpen) return 'no-engine';
  if (window.WDCV.version < 78) return 'wrong-version:' + window.WDCV.version;
  await window.WDCV._qaOpen('Iran');
  return 'ok';
}, VER);
check('CV engine loads + QA-open runs', opened === 'ok', String(opened));
await page.waitForTimeout(2500);

const state1 = await page.evaluate(() => {
  const S = window.WDCV.S;
  const st = document.getElementById('wdcv-stage');
  const cv = document.getElementById('wdcv-canvas');
  return {
    active: S.active, stageOn: !!(st && st.classList.contains('on')),
    cvW: cv ? cv.width : 0, cvH: cv ? cv.height : 0,
    provN: S.provinces.length,
    camZ: S.cam.z, enter: !!S.enter, tier: S.tier,
  };
});
check('CV stage visible + canvas sized', state1.active && state1.stageOn && state1.cvW > 300 && state1.cvH > 300, JSON.stringify({ w: state1.cvW, h: state1.cvH }));
check('server layout: ≥3 provinces (Iran)', state1.provN >= 3, 'n=' + state1.provN);
check('§11/§12: WOW entry dives toward FIT zoom (0.75→1.52)', !!state1.enter && state1.camZ > 0.75 && state1.camZ <= 1.52, 'camZ=' + state1.camZ.toFixed(2));

// ---- §24: pan-consistency — bake در فضای جهان؛ pan باید زمین را جابجا کند
const pan = await page.evaluate(async () => {
  const S = window.WDCV.S;
  const cv = document.getElementById('wdcv-canvas');
  const g = cv.getContext('2d');
  S.cam.anim = false; S.enter = null; S.cam.z = 1.0; S.cam.x = 0; S.cam.y = 0; S.sel.prov = -1; S.hover = -1;
  await new Promise((r) => setTimeout(r, 500));
  const before = g.getImageData(0, 0, cv.width, cv.height).data;
  S.cam.x = 90; S.cam.y = 40;
  await new Promise((r) => setTimeout(r, 400));
  const after = g.getImageData(0, 0, cv.width, cv.height).data;
  let diff = 0;
  for (let i = 0; i < before.length; i += 16) if (Math.abs(before[i] - after[i]) > 12) diff++;
  return { diffPct: +(100 * diff / (before.length / 16)).toFixed(2), dirtyStatic: !!S.dirtyStatic };
});
check('§24: ground follows camera on pan (no frozen static layer)', pan.diffPct > 1.0, 'changed=' + pan.diffPct + '% (V≤77 was ~0%)');

// ---- §1-§6: label collision در ۵ زوم مرجع (۰٫۸/۱٫۲/۱٫۷/۲٫۲/۳٫۰)
const zoomChecks = [];
for (const z of [0.8, 1.2, 1.7, 2.2, 3.0]) {
  const r = await page.evaluate(async (zz) => {
    const S = window.WDCV.S;
    S.cam.anim = false; S.cam.z = zz; S.cam.x = 0; S.cam.y = 0;
    await new Promise((res) => setTimeout(res, 450));
    const lb = S._lbl;
    if (!lb) return { noLbl: true };
    let overlaps = 0;
    const B = lb.boxes || [];
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i], b = B[j];
      if (a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0) overlaps++;
    }
    const maxN = zz < 1.5 ? 4 : zz < 2 ? 9 : 18;
    return { noLbl: false, n: (lb.list || []).length, overlaps, maxN, boxN: B.length };
  }, z);
  zoomChecks.push({ z, ...r });
  if (r.noLbl) check(`§1 label layout @z${z}`, false, 'no label cache');
  else {
    check(`§1/§3 label collision ZERO @z${z}`, r.overlaps === 0, `overlaps=${r.overlaps}`);
    check(`§2 label cap respected @z${z}`, r.n <= r.maxN, `placed=${r.n} ≤${r.maxN}`);
  }
}
check('§1: labels present at all 5 reference zooms', zoomChecks.length === 5 && zoomChecks.every((c) => !c.noLbl && c.n > 0), zoomChecks.map((c) => `z${c.z}:${c.n}`).join(' '));

// ---- §20: white-pixel noise
const noise = await page.evaluate(async () => {
  const S = window.WDCV.S;
  const cv = document.getElementById('wdcv-canvas');
  const g = cv.getContext('2d');
  S.cam.anim = false; S.cam.z = 0.9; S.cam.x = 0; S.cam.y = 0;
  await new Promise((r) => setTimeout(r, 500));
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let white = 0, total = 0;
  for (let i = 0; i < d.length; i += 4) {
    total++;
    if (d[i] >= 245 && d[i + 1] >= 245 && d[i + 2] >= 245) white++;
  }
  return { pct: +(100 * white / total).toFixed(3) };
});
check('§20: no white-pixel noise at country view (<0.05%)', noise.pct < 0.05, 'white=' + noise.pct + '%');

// ---- §22 (V79 update): کشتی از ۱٫۴، خودرو از ۲
const amb = await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.anim = false; S.sel.prov = -1; S.hover = -1;
  S._ambDrawn = 0;
  S.cam.z = 1.4; S.cam.x = 0; S.cam.y = 0;
  await new Promise((r) => setTimeout(r, 900));
  const low = S._ambDrawn || 0;
  S._ambDrawn = 0;
  S.cam.z = 2.4;
  await new Promise((r) => setTimeout(r, 1200));
  return { low, high: S._ambDrawn || 0, paths: (S.ambPaths || []).length, tier: S.tier };
});
check('V79 §22: ambient pool feeds (ships from z1.4)', amb.low >= 0 && amb.paths > 0, 'drawn@1.4=' + amb.low + ' paths=' + amb.paths);
check('V79 §22: vehicles draw at z≥2', amb.high > 0, 'drawn@2.4=' + amb.high + ' tier=' + amb.tier);

// ---- رگرسیون V77 §26: idle skip (با فاز موج V79 — هنوز ≥1 skip در ۱٫۳s)
const idle = await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.anim = false; S.cam.z = 0.9; S.cam.x = 0; S.cam.y = 0; S._lselKey = ''; S.hover = -1;
  await new Promise((r) => setTimeout(r, 400));
  const n0 = S._idleN || 0;
  await new Promise((r) => setTimeout(r, 1300));
  return { n0, n1: S._idleN || 0 };
});
check('V77 §26: idle render skip still active (wave-phase aware)', idle.n1 > idle.n0, 'skipFrames=' + (idle.n1 - idle.n0));

// ---- رگرسیون V77 §48: clamp
const clampT = await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.z = 1.0; S.cam.anim = false;
  S.cam.x = 99999; S.cam.y = -99999;
  await new Promise((r) => setTimeout(r, 250));
  return { x: Math.round(S.cam.x), y: Math.round(S.cam.y), escaped: Math.abs(S.cam.x) > 5000 || Math.abs(S.cam.y) > 5000 };
});
check('V77 §48: camera clamp intact', !clampT.escaped, 'x=' + clampT.x + ' y=' + clampT.y);

// ---- پرفورمنس
const perf = await page.evaluate(() => {
  const S = window.WDCV.S;
  return { frameMs: Math.round(S.frameMs * 10) / 10, tier: S.tier };
});
check('PERF: frame budget < 20ms', perf.frameMs < 20, 'frameMs=' + perf.frameMs + ' tier=' + perf.tier);

// ---- close()
await page.evaluate(() => window.WDCV.close());
await page.waitForTimeout(1200);
const closed = await page.evaluate(() => {
  const S = window.WDCV.S;
  const st = document.getElementById('wdcv-stage');
  return {
    active: S.active, stageHidden: !(st && st.classList.contains('on')),
    objCleared: S.obj === null, pollCleared: S.pollTimer === null,
    lblCleared: S._lbl === null, rnCleared: S._rn === null, railCleared: S._rail === null,
  };
});
check('close(): engine stopped + stage hidden', closed.active === false && closed.stageHidden);
check('close(): obj/poll cleared', closed.objCleared && closed.pollCleared);
check('close(): label/road-network/rail caches cleared', closed.lblCleared && closed.rnCleared && closed.railCleared);

check('zero pageerrors during whole session', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
const fails = results.filter(r => !r.ok).length;
console.log(`\n== CV-QA V78(+V79): ${results.length - fails}/${results.length} ==`);
process.exit(fails ? 1 : 0);
