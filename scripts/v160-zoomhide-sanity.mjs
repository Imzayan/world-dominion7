/* V160 — sanity: markers hidden during zoom MUST reappear at zoomend. */
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
const state = () => page.evaluate(() => {
  const pane = document.querySelector('.leaflet-marker-pane');
  const flag = document.querySelector('.flag-wrap');
  return {
    zoomingClass: document.getElementById('map').classList.contains('wd-zooming'),
    paneDisplay: pane ? getComputedStyle(pane).display : 'NO-PANE',
    flagDisplay: flag ? getComputedStyle(flag).display : 'NO-FLAG',
    flags: document.querySelectorAll('.flag-wrap').length,
    zoom: (typeof map !== 'undefined' && map.getZoom) ? map.getZoom() : null,
  };
});
console.log('BEFORE', JSON.stringify(await state()));
/* pinch IN then OUT, then check mid-zoom and after */
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
await pinch(200, 420, 50, 115, 14, 24);
console.log('MID-ZOOM(shortly after last move)', JSON.stringify(await state()));
await wait(900);
console.log('AFTER-ZOOMEND+900ms', JSON.stringify(await state()));
await pinch(200, 420, 115, 52, 14, 24);
await wait(900);
console.log('AFTER-PINCH-OUT+900ms', JSON.stringify(await state()));
await browser.close(); process.exit(0);
