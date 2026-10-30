/* V152 PINCH PROFILER — CPU self-time + longtasks DURING pinch zoom on the world map */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:3000/game/index.html';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__LT = [];
  try {
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__LT.push(Math.round(e.duration)); });
    po.observe({ entryTypes: ['longtask'] });
  } catch (e) {}
});
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 120, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
page.on('pageerror', (e) => console.log('PAGEERROR', String(e).slice(0, 120)));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForFunction(() => window.__wdMapReady === true, { timeout: 60000 });
await page.waitForTimeout(4000);

// baseline longtask count
const lt0 = await page.evaluate(() => window.__LT.length);

// real pinch via CDP touch (both fingers, 2.5s, in+out)
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
  { x: 140, y: 380, id: 1 }, { x: 250, y: 380, id: 2 }] });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
await cdp.send('Profiler.start');
for (let i = 0; i < 26; i++) {
  const g = 55 + i * 6;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { x: 195 - g, y: 380, id: 1 }, { x: 195 + g, y: 380, id: 2 }] });
  await page.waitForTimeout(60);
}
// pinch back out fast
for (let i = 0; i < 20; i++) {
  const g = 211 - i * 9;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { x: 195 - g, y: 380, id: 1 }, { x: 195 + g, y: 380, id: 2 }] });
  await page.waitForTimeout(40);
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const prof = await cdp.send('Profiler.stop');

const zoom = await page.evaluate(() => ({ zoom: map && map.getZoom ? +map.getZoom().toFixed(2) : null }));
const ltWin = await page.evaluate((n) => ({ duringPinch: window.__LT.slice(n), total: window.__LT.length }), lt0);

// aggregate self time
const byId = new Map(); (prof.profile.nodes || []).forEach((nd) => byId.set(nd.id, nd));
const self = new Map();
const urlOf = (id) => { const nd = byId.get(id); if (!nd) return '?'; const cf = nd.callFrame || {};
  return ((cf.url || '').split('/').pop() || '?') + ':' + (cf.functionName || '(anon)'); };
(prof.profile.samples || []).forEach((id, i) => {
  const dT = (i + 1 < prof.profile.timeDeltas.length) ? prof.profile.timeDeltas[i + 1] : prof.profile.timeDeltas[i] || 0;
  const k = urlOf(id); self.set(k, (self.get(k) || 0) + dT);
});
const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([k, v]) => [k, Math.round(v / 1000) + 'ms']);

// double-tap zoom test too
const lt1 = await page.evaluate(() => window.__LT.length);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 400, id: 1 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(80);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 400, id: 1 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(1200);
const lt2 = await page.evaluate((n) => ({ during: window.__LT.slice(n) }), lt1);

console.log(JSON.stringify({ zoom, ltWin, doubleTap: lt2, pinch_cpu_top: top }, null, 1));
await browser.close();
