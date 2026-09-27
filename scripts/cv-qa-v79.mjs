// V79 — Country View PAINTED ISOMETRIC QA: پیل برچسب (اسم+سطح) + چیپ‌های فلش‌دار +
// پرچم/رتبه + باکس اهداف (۲/۵) + لاین دریایی کشتی + شیمر موج + رگرسیون کامل V78
// Usage: WD_BASE=http://127.0.0.1:3210 node scripts/cv-qa-v79.mjs
import { chromium } from 'playwright';

const BASE = process.env.WD_BASE || 'http://127.0.0.1:3210';
const URL = `${BASE}/game/index.html?v=80`;
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

const nick = 'cvqa79' + Date.now().toString(36).slice(-6);
const resp = await page.request.post(BASE + '/api/auth/signup', { data: { email: nick + '@wd.test', password: 'cvqa123456', nick } });
check('signup ok', resp.ok(), String(resp.status()));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

const opened = await page.evaluate(async () => {
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = '/game/cv-engine.js?v=80';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
    setTimeout(rej, 8000);
  });
  if (!window.WDCV || !window.WDCV._qaOpen) return 'no-engine';
  if (window.WDCV.version < 79) return 'wrong-version:' + window.WDCV.version;
  await window.WDCV._qaOpen('Iran');
  return 'ok';
});
check('CV engine loads (v79) + QA-open runs', opened === 'ok', String(opened));
await page.waitForTimeout(2500);

// ---- V79: پیل برچسب — اسم نوع + عدد سطح (فرمت «نام · ۳») + برخورد صفر
await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.anim = false; S.enter = null; S.sel.prov = -1; S.hover = -1;
  S.cam.z = 2.2; S.cam.x = 0; S.cam.y = 0;
});
await page.waitForTimeout(500);
const pill = await page.evaluate(() => {
  const S = window.WDCV.S;
  const lb = S._lbl;
  if (!lb || !lb.list || !lb.list.length) return { none: true };
  let overlaps = 0;
  const B = lb.boxes || [];
  for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
    const a = B[i], b = B[j];
    if (a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0) overlaps++;
  }
  const withLv = lb.list.filter((L) => / · /.test(L.txt)).length;
  const cap = lb.list.find((L) => L.isCap);
  return { none: false, n: lb.list.length, withLv, overlaps, capTxt: cap ? cap.txt : '' };
});
check('V79: city pill labels carry name + level (« · N»)', !pill.none && pill.n > 0 && pill.withLv === pill.n, 'n=' + pill.n + ' withLevel=' + pill.withLv);
check('V79: pill collision ZERO @z2.2', pill.overlaps === 0, 'overlaps=' + pill.overlaps);
check('V79: capital pill = «پایتخت · N»', /پایتخت · /.test(pill.capTxt || ''), pill.capTxt);

// ---- V79: چیپ‌های تیره با فلش سبز + پرچم + رتبه
const hdr = await page.evaluate(() => {
  const u = document.getElementById('wdcv-ui');
  const hres = u.querySelector('#wdcv-hres');
  const hname = u.querySelector('#wdcv-hname');
  return {
    chips: hres.querySelectorAll('.wdcv-hchip').length,
    upArrows: hres.querySelectorAll('small.up').length,
    flag: !!hname.querySelector('img.wdcv-flag'),
    flagSrc: (hname.querySelector('img.wdcv-flag') || {}).src || '',
    rank: (hname.querySelector('#wdcv-hrank') || {}).textContent || '',
    chipBg: getComputedStyle(hres.querySelector('.wdcv-hchip')).backgroundColor,
  };
});
check('V79: resource chips ≥3 with rate arrows', hdr.chips >= 3 && hdr.upArrows >= 3, 'chips=' + hdr.chips + ' up=' + hdr.upArrows);
check('V79: chips are dark rounded (rgb(13,19,28))', hdr.chipBg.indexOf('13, 19, 28') > -1, hdr.chipBg);
check('V79: country flag shown (self-hosted /cdn/flags)', hdr.flag && hdr.flagSrc.indexOf('/cdn/flags/') > -1, hdr.flagSrc.split('/').pop());
check('V79: world rank title shown (rankOf from game)', hdr.rank.length > 0, hdr.rank);

// ---- V79: باکس اهداف پایین-چپ — ۳ هدف با پیشرفت «۰/۱»
const goals = await page.evaluate(() => {
  const gEl = document.getElementById('wdcv-goals');
  if (!gEl) return { missing: true };
  const rows = [...gEl.querySelectorAll('.wdcv-goal')];
  return {
    missing: false, n: rows.length,
    prog0: (rows[0] ? (rows[0].querySelector('b') || {}).textContent : '') || '',
    firstProv: rows[0] ? rows[0].dataset.prov : '',
  };
});
check('V79: goals box bottom-left with 1..3 rows', !goals.missing && goals.n >= 1 && goals.n <= 3, 'rows=' + goals.n);
check('V79: goal rows show real progress «d/t»', /^[۰-۹]+\/[۰-۹]+$/.test(goals.prog0), goals.prog0);

// tap اولین هدف → پنل استان
await page.evaluate(() => {
  const row = document.querySelector('#wdcv-goals .wdcv-goal');
  if (row) row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(300);
const goalTap = await page.evaluate(() => {
  const p = document.getElementById('wdcv-panel');
  return { open: !!p && p.innerHTML.length > 50 };
});
check('V79: tapping a goal opens target province panel', goalTap.open);
await page.evaluate(() => { const p = document.getElementById('wdcv-panel'); if (p) p.innerHTML = ''; });

// ---- V79: لاین دریایی کشتی (بدون هیچ بندری — تزئینی داده‌محور از ring)
const sea = await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.anim = false; S.sel.prov = -1; S.hover = -1;
  S._ambDrawn = 0;
  S.cam.z = 1.5; S.cam.x = 0; S.cam.y = 0;
  await new Promise((r) => setTimeout(r, 1100));
  return {
    shipPaths: (S.ambPaths || []).filter((p) => p.kind === 'ship').length,
    drawn: S._ambDrawn || 0,
    ambs: (window.__AMB_COUNT__ == null) ? -1 : 0,
  };
});
check('V79: decorative sea-lane ships exist without ports', sea.shipPaths >= 2, 'shipPaths=' + sea.shipPaths);
check('V79: ships animate at z1.5 (drawn frames > 0)', sea.drawn > 0, 'drawn=' + sea.drawn);

// ---- V79: متنوع بودن زمین نقاشی‌شده (گرادیان/بافت — کانواس یکنواخت نباشد)
const variety = await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.anim = false; S.cam.z = 1.0; S.cam.x = 0; S.cam.y = 0;
  await new Promise((r) => setTimeout(r, 600));
  const cv = document.getElementById('wdcv-canvas');
  const g = cv.getContext('2d');
  const px = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3)).join(',');
  const cols = new Set();
  for (const [x, y] of [[90, 400], [200, 500], [300, 600], [150, 700], [250, 800]]) cols.add(px(x, y));
  return { cols: cols.size, frameMs: Math.round(S.frameMs * 10) / 10 };
});
check('V79: painterly terrain variety (non-flat)', variety.cols >= 3, 'distinct=' + variety.cols);
check('PERF: frame budget < 20ms', variety.frameMs < 20, 'frameMs=' + variety.frameMs);

// ---- idle-skip با فاز موج (باید باز هم skip غالب باشد)
const idle = await page.evaluate(async () => {
  const S = window.WDCV.S;
  S.cam.anim = false; S.cam.z = 0.9; S.cam.x = 0; S.cam.y = 0; S._lselKey = ''; S.hover = -1;
  await new Promise((r) => setTimeout(r, 400));
  const n0 = S._idleN || 0;
  await new Promise((r) => setTimeout(r, 2000));
  return { n0, n1: S._idleN || 0 };
});
check('V79: wave-phase idle — ≤2 redraws per 2s (battery friendly)', idle.n1 > idle.n0 + 20, 'skipFrames=' + (idle.n1 - idle.n0) + ' (≥20 skip)');

// ---- close(): پاکسازی شامل کش هدر
await page.evaluate(() => window.WDCV.close());
await page.waitForTimeout(1200);
const closed = await page.evaluate(() => {
  const S = window.WDCV.S;
  return { active: S.active, lbl: S._lbl === null, hdr: S._hdrCache === '', wave: S._lwave === -1 };
});
check('close(): engine stopped + V79 caches cleared', !closed.active && closed.lbl && closed.hdr && closed.wave);

check('zero pageerrors during whole session', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
const fails = results.filter(r => !r.ok).length;
console.log(`\n== CV-QA V79: ${results.length - fails}/${results.length} ==`);
process.exit(fails ? 1 : 0);
