/* V160 — WHO writes marker styles during pinch? Patch L.DomUtil.setPosition /
 * setTransform to capture caller stacks (sampled) + per-frame counts. */
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
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 140)));
await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 });
try { await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 40000 }); } catch (e) {}
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
  window.__who = { counts: {}, stacks: [] };
  const w = window.__who;
  /* Marker._setPos — the actual per-marker style writer; prototype patch catches internal calls */
  const sp = L.Marker.prototype._setPos;
  L.Marker.prototype._setPos = function (pos) {
    const cls = (this._icon && this._icon.getAttribute && this._icon.getAttribute('class')) || '?';
    const k = (cls + '').split(' ').slice(0, 2).join('.');
    w.counts[k] = (w.counts[k] || 0) + 1;
    if (w.stacks.length < 6) {
      const st = new Error().stack || '';
      w.stacks.push(st.split('\n').slice(1, 8).map((s) => s.trim().slice(0, 120)).join(' | '));
    }
    return sp.apply(this, arguments);
  };
  const up = L.Marker.prototype.update;
  L.Marker.prototype.update = function () {
    w.counts._update = (w.counts._update || 0) + 1;
    if (w.stacks.length < 12) {
      const st = new Error().stack || '';
      w.stacks.push('UPD ' + st.split('\n').slice(1, 7).map((s) => s.trim().slice(0, 120)).join(' | '));
    }
    return up.apply(this, arguments);
  };
});
console.log('patched');
const cdp2 = cdp;
const pinch = async (cx, cy, from, to, steps, stepMs) => {
  const P = (f) => [{ x: cx - f, y: cy - f, id: 1 }, { x: cx + f, y: cy + f, id: 2 }];
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(from) });
  for (let i = 1; i <= steps; i++) {
    const f = from + ((to - from) * i) / steps;
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(f) });
    await wait(stepMs);
  }
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
await wait(500);
const c0 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__who.counts)));
await pinch(200, 420, 60, 110, 24, 40);
await wait(700);
const c1 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__who.counts)));
const stacks = await page.evaluate(() => window.__who.stacks.slice(0, 6));
console.log('COUNTS-BEFORE', JSON.stringify(c0));
console.log('COUNTS-AFTER-1-PINCH', JSON.stringify(c1));
console.log('STACKS:');
stacks.forEach((s, i) => console.log('  #' + i, s));
await browser.close();
process.exit(0);
