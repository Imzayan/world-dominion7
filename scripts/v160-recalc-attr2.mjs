/* V160 RECALC-STORM ATTRIBUTION v2 — the CSS-rule-kill experiment showed the
 * gesture-class rules are NOT the source (S0≈S3). Now: who WRITES style/class
 * during gestures? MutationObserver census on the #map subtree + whole doc,
 * grouped by (tagName.class, attr), plus separate pinch-only / flick-only /
 * idle windows to isolate the driver.
 *
 * usage: node scripts/v160-recalc-attr2.mjs [http://localhost:3000]
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
/* mutation recorder: #map subtree, attribute mutations grouped by element identity class */
await page.evaluate(() => {
  window.__mut = null;
  window.__mutStart = function () {
    const map = document.getElementById('map');
    const grp = new Map();
    const key = (el) => {
      let e = el, path = [];
      for (let h = 0; h < 3 && e && e.nodeType === 1; h++) {
        const c = (e.getAttribute && e.getAttribute('class')) || '';
        path.push(e.tagName.toLowerCase() + (c ? '.' + c.split(' ').slice(0, 2).join('.') : ''));
        e = e.parentElement; if (e === map) { path.push('#map'); break; }
      }
      return path.slice(0, 4).join('<');
    };
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes') {
          const k = key(m.target) + ' @' + m.attributeName;
          grp.set(k, (grp.get(k) || 0) + 1);
        } else if (m.type === 'childList') {
          const k = key(m.target) + ' +children(' + (m.addedNodes.length) + ')';
          grp.set(k, (grp.get(k) || 0) + 1);
        }
      }
    });
    mo.observe(map, { attributes: true, attributeOldValue: false, childList: true, subtree: true });
    window.__mut = { mo, grp, t0: performance.now() };
  };
  window.__mutStop = function () {
    if (!window.__mut) return null;
    window.__mut.mo.disconnect();
    const arr = [...window.__mut.grp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18)
      .map(([k, v]) => v + ' × ' + k);
    const total = [...window.__mut.grp.values()].reduce((a, b) => a + b, 0);
    const dt = Math.round(performance.now() - window.__mut.t0);
    window.__mut = null;
    return { total, dtMs: dt, top: arr };
  };
});
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics
  .filter((m) => ['RecalcStyleDuration', 'ScriptDuration', 'LayoutDuration', 'TaskDuration'].includes(m.name)).map((m) => [m.name, m.value]));
const ltTake = () => page.evaluate(() => { const a = (window.__lt || []).slice(); window.__lt.length = 0; return a; });
if (!(await page.evaluate(() => !!window.__lt))) {
  await page.evaluate(() => { window.__lt = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
}

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

const window_ = async (name, fn) => {
  await wait(900);
  await ltTake();
  const m0 = await metrics();
  await page.evaluate(() => window.__mutStart());
  await fn();
  await wait(600);
  const mut = await page.evaluate(() => window.__mutStop());
  const m1 = await metrics();
  const lt = await ltTake();
  const d = {}; for (const k of Object.keys(m0)) d[k] = Math.round((m1[k] - m0[k]) * 1000);
  console.log('\n== WINDOW ' + name, JSON.stringify({ recalc: d.RecalcStyleDuration, script: d.ScriptDuration, layout: d.LayoutDuration, task: d.TaskDuration, ltCount: lt.length, ltSum: Math.round(lt.reduce((a, b) => a + b, 0)), mutTotal: mut && mut.total, mutWin: mut && mut.dtMs }));
  if (mut) console.log('   top-mutations:'); (mut ? mut.top : []).slice(0, 12).forEach((s) => console.log('     ' + s));
};

await window_('W0_idle10s_null', async () => { await wait(10000); });
await window_('W1_pinch3pairs', async () => {
  for (let k = 0; k < 3; k++) { await pinch(200, 420, 40, 120, 14, 22); await wait(420); await pinch(200, 420, 120, 45, 14, 22); await wait(420); }
});
await window_('W2_flicks5', async () => {
  for (let k = 0; k < 5; k++) { await drag(220, 420, (k % 2 ? -1 : 1) * 300, (k % 3 - 1) * 60, 16, 14); await wait(360); }
});
await window_('W3_pinch_slow_zoomanim', async () => {
  await pinch(200, 420, 60, 110, 24, 40); await wait(700); await pinch(200, 420, 110, 62, 24, 40);
});

await browser.close();
process.exit(0);
