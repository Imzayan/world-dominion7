/* V160 — CPU profile DURING PINCH on the full map (who burns the main thread?). */
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
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
await cdp.send('Profiler.start');
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
for (let k = 0; k < 3; k++) { await pinch(200, 420, 40, 120, 14, 22); await wait(420); await pinch(200, 420, 120, 45, 14, 22); await wait(420); }
const prof = (await cdp.send('Profiler.stop')).profile;

const byId = new Map(); (prof.nodes || []).forEach((nd) => byId.set(nd.id, nd));
(prof.nodes || []).forEach((nd) => ((nd.children || [])).forEach((cid) => { const c = byId.get(cid); if (c) c.parent = nd.parent ? nd.parent : c.parent; }));
/* build parent links */
byId.forEach((nd) => { nd.parent = undefined; });
(prof.nodes || []).forEach((nd) => ((nd.children || [])).forEach((cid) => { const c = byId.get(cid); if (c) c.parent = nd; }));
const self = new Map();
(prof.samples || []).forEach((id, i) => {
  const dT = (i + 1 < prof.timeDeltas.length) ? prof.timeDeltas[i + 1] : prof.timeDeltas[i] || 0;
  self.set(id, (self.get(id) || 0) + dT);
});
const nameOf = (nd) => { const cf = nd.callFrame || {}; return (cf.functionName || '(anon)') + '@' + (cf.url || '').split('/').pop().replace('index.html', 'idx'); };
const topSelf = [...self.entries()].filter(([id]) => { const nd = byId.get(id); if (!nd) return false; const f = nameOf(nd); return f !== ':(idle)' && f !== '(program)' && f !== '(garbage collector)'; })
  .sort((a, b) => b[1] - a[1]).slice(0, 22)
  .map(([id, t]) => { const nd = byId.get(id); return [Math.round(t / 1000) + 'ms', nameOf(nd)]; });
const paths = new Map();
for (const [id, t] of self) {
  if (t < 12000) continue;
  const nd = byId.get(id); if (!nd) continue;
  const chain = [nameOf(nd)];
  let p = nd.parent, hops = 0;
  while (p && hops < 3) { const nm = nameOf(p); if (chain[chain.length - 1].split('@')[0] !== nm.split('@')[0]) chain.push(nm); p = p.parent; hops++; }
  if (chain.length === 1) chain.push('(root/timer)');
  const key = chain.join(' ← ');
  paths.set(key, (paths.get(key) || 0) + t);
}
console.log('TOP-SELF:'); topSelf.forEach(([t, n]) => console.log('  ' + t, n));
console.log('TOP-PATHS(>=12ms self):');
[...paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).forEach(([k, t]) => console.log('  ' + Math.round(t / 1000) + 'ms', k));
await browser.close(); process.exit(0);
