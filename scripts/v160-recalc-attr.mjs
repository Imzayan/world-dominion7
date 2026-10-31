/* V160 RECALC-STORM ATTRIBUTION — causal probe for PERF_BASELINE F4 / Phase-2 P0.
 * Question: WHICH gesture-class CSS rules cause the style-recalc storm during
 * pinch/flick on a FULL map (120 owned)? Method: disable one rule-group at a
 * time via CSSOM (deleteRule + insertRule restore), run identical pinch+flick
 * windows, compare Performance.getMetrics deltas + longtasks.
 *
 * Sessions (identical gesture windows):
 *   S0 all-on                 — baseline
 *   S1 no-universal           — kill '#map.wd-dragging *' universal pause rule (21084)
 *   S2 no-flaggest            — kill '.wd-gest .flag' rules (7483-7485)
 *   S3 no-any                 — kill ALL wd-dragging/wd-gest rules = toggle floor
 * After S1: animation census inside #map (what was the universal rule pausing?)
 *
 * usage: node scripts/v160-recalc-attr.mjs [http://localhost:3000]
 * Requires: seeded world (perf-seed.mjs) + live server. NEVER against production.
 */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const fs = await import('node:fs');
const { chromium } = await import('playwright');
const BASE = process.argv[2] || 'http://localhost:3000';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const mf = JSON.parse(fs.readFileSync('scripts/perf-results/seed-manifest.json', 'utf8'));

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
await ctx.addCookies([{ name: 'wd_session', value: mf.probeToken, url: BASE }]);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Performance.enable');
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 140)));

await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 40000 }); } catch (e) { console.log('MAPREADY-TIMEOUT'); }
await wait(4500);
await page.evaluate(async () => {
  if (document.getElementById('m-elim') && document.getElementById('m-elim').classList.contains('active')) {
    const pk = document.querySelector('#wd-elim-pick'); if (pk) pk.click(); await new Promise((r) => setTimeout(r, 600));
  }
  if (document.getElementById('m-srv') && document.getElementById('m-srv').classList.contains('active')) {
    const x = document.querySelector('#m-srv .close-modal,#m-srv .close'); if (x) x.click(); await new Promise((r) => setTimeout(r, 500));
  }
});
await page.evaluate(() => {
  window.__lt = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
});

/* ---------- census ---------- */
const census = await page.evaluate(() => {
  const map = document.getElementById('map');
  const q = (sel) => map.querySelectorAll(sel).length;
  return {
    mapNodes: q('*'), flags: q('.flag'), rt: q('.rt'), ownDash: q('.wd-own-dash'),
    pulse: q('.wd26-pulse,.wd26-spark'), overlayPaths: q('.leaflet-overlay-pane path'), markerNodes: q('.leaflet-marker-pane *'),
  };
});
console.log('CENSUS', JSON.stringify(census));

/* ---------- CSSOM surgery (recursive, restore-precise) ---------- */
const collect = (needle) => page.evaluate((needle) => {
  const sheets = [...document.styleSheets];
  const acc = [];
  const walk = (rules, sheetIdx, parentIdx) => {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (r.type === 1) { if ((r.selectorText || '').indexOf(needle) >= 0) acc.push({ sheetIdx, parentIdx, idx: i, cssText: r.cssText }); }
      else if (r.cssRules && (r.type === 4 || r.type === 12)) walk(r.cssRules, sheetIdx, i);
    }
  };
  sheets.forEach((s, si) => { try { walk(s.cssRules, si, -1); } catch (e) {} });
  /* delete from bottom-up so indexes stay valid */
  acc.sort((a, b) => (b.sheetIdx - a.sheetIdx) || (b.parentIdx - a.parentIdx) || (b.idx - a.idx));
  let n = 0;
  for (const f of acc) {
    try {
      if (f.parentIdx >= 0) sheets[f.sheetIdx].cssRules[f.parentIdx].deleteRule(f.idx);
      else sheets[f.sheetIdx].deleteRule(f.idx);
      n++;
    } catch (e) {}
  }
  return { list: acc, n };
}, needle);
const reinsert = (list) => page.evaluate((list) => {
  const sheets = [...document.styleSheets];
  let n = 0;
  for (const f of list) {
    try {
      if (f.parentIdx >= 0) {
        const parent = sheets[f.sheetIdx].cssRules[f.parentIdx];
        parent.insertRule(f.cssText, Math.min(f.idx, parent.cssRules.length));
      } else sheets[f.sheetIdx].insertRule(f.cssText, Math.min(f.idx, sheets[f.sheetIdx].cssRules.length));
      n++;
    } catch (e) {}
  }
  return n;
}, list);

/* ---------- gestures (identical per session) ---------- */
const pinch = async (cx, cy, from, to, steps, stepMs) => {
  const P = (f) => [{ x: cx - f, y: cy - f, id: 1 }, { x: cx + f, y: cy + f, id: 2 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(from) });
  for (let i = 1; i <= steps; i++) {
    const f = from + ((to - from) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(f) });
    await wait(stepMs);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const drag = async (x0, y0, dx, dy, steps, stepMs) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps, id: 1 }] });
    await wait(stepMs);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics
  .filter((m) => ['RecalcStyleDuration', 'ScriptDuration', 'LayoutDuration', 'TaskDuration'].includes(m.name)).map((m) => [m.name, m.value]));
const ltTake = () => page.evaluate(() => { const a = (window.__lt || []).slice(); window.__lt.length = 0; return a; });

const session = async (name) => {
  await wait(900); /* settle: gesture-class removal timers (260ms) die out */
  await ltTake();
  const m0 = await metrics();
  for (let k = 0; k < 3; k++) {
    await pinch(200, 420, 40, 120, 14, 22); await wait(420);
    await pinch(200, 420, 120, 45, 14, 22); await wait(420);
  }
  for (let k = 0; k < 2; k++) {
    await drag(220, 420, (k % 2 ? -1 : 1) * 170, (k % 3 - 1) * 60, 16, 16); await wait(360);
  }
  await wait(600);
  const m1 = await metrics();
  const lt = await ltTake();
  const d = {}; for (const k of Object.keys(m0)) d[k] = Math.round((m1[k] - m0[k]) * 1000);
  console.log('SESSION ' + name, JSON.stringify({ recalc: d.RecalcStyleDuration, script: d.ScriptDuration, layout: d.LayoutDuration, task: d.TaskDuration, ltCount: lt.length, ltSum: Math.round(lt.reduce((a, b) => a + b, 0)) }));
  return d;
};

/* ---------- run ---------- */
await session('S0_allon_warmup'); /* warm — not reported */

const r0 = await session('S0_allon');

const U = await collect('.wd-dragging *');
console.log('removed universal rules:', U.n, U.list.map((f) => f.cssText.slice(0, 60)));
const r1 = await session('S1_no_universal');
/* animation census with universal OFF: what actually animates in #map? */
const animCensus = await page.evaluate(() => {
  const map = document.getElementById('map');
  const set = new Set();
  try { map.querySelectorAll('*').forEach(() => {}); } catch (e) {}
  const anims = document.getAnimations ? document.getAnimations({ subtree: true }) : [];
  let inMap = 0; const kinds = {};
  for (const a of anims) {
    const el = a.effect && a.effect.target;
    if (!el) continue;
    if (map.contains(el)) { inMap++; const cls = (el.getAttribute('class') || el.tagName || '?').toString().slice(0, 40); kinds[cls] = (kinds[cls] || 0) + 1; }
  }
  return { totalAnims: anims.length, inMap, kinds };
});
console.log('ANIM-CENSUS(universal-off)', JSON.stringify(animCensus));
await reinsert(U.list);
await wait(400);

const F = await collect('.wd-gest .flag');
console.log('removed flag-gest rules:', F.n);
const r2 = await session('S2_no_flaggest');
await reinsert(F.list);
await wait(400);

const ALL = [];
for (const n of ['wd-dragging', 'wd-gest']) { const c = await collect(n); ALL.push(...c.list); console.log('removed group', n, ':', c.n); }
const r3 = await session('S3_no_any');
for (const batch of [[], ALL]) { /* restore all */ }
await reinsert(ALL);
await wait(400);

const r4 = await session('S4_restored_check');

await browser.close();
console.log('DONE. summary:');
for (const [k, v] of Object.entries({ S0_allon: r0, S1_no_universal: r1, S2_no_flaggest: r2, S3_no_any: r3, S4_restored_check: r4 }))
  console.log(k, JSON.stringify(v));
process.exit(0);
