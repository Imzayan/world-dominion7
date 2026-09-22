/* Real TOUCH tap test on the live game site (iPhone emulation with hasTouch) */
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'fa-IR',
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('https://world-dominionnrg.onrender.com/', { timeout: 120000, waitUntil: 'domcontentloaded' });
  console.log('URL:', page.url());
  await page.waitForTimeout(7000);

  // guest login
  const guestBtn = await page.evaluate(() => {
    const bs = document.querySelectorAll('#auth button, .modal button');
    for (const b of bs) if (b.textContent.includes('مهمان')) { return true; }
    return false;
  });
  console.log('guest button found:', guestBtn);
  if (guestBtn) {
    await page.evaluate(() => {
      const bs = document.querySelectorAll('#auth button, .modal button');
      for (const b of bs) if (b.textContent.includes('مهمان')) { b.click(); return; }
    });
    await page.waitForTimeout(5000);
  }

  const st1 = await page.evaluate(() => ({
    hasTouch: 'ontouchstart' in window,
    maxTouch: navigator.maxTouchPoints,
    mapLayers: (() => { try { return Object.keys(map._layers).length } catch (e) { return 'err' } })(),
  }));
  console.log('state:', JSON.stringify(st1));

  // Compute Turkey tap point
  const pt = await page.evaluate(() => {
    const p = map.latLngToContainerPoint([39, 35]);
    const r = document.getElementById('map').getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  });
  console.log('tap point:', JSON.stringify(pt));

  // === REAL TOUCH TAP ===
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(1800);

  const res = await page.evaluate(() => {
    const d = document.getElementById('country-drawer');
    const r = d ? d.getBoundingClientRect() : null;
    return {
      cName: (document.getElementById('c-name') || {}).textContent,
      open: d ? d.classList.contains('open') : false,
      rect: r ? { t: Math.round(r.top), h: Math.round(r.height) } : null,
    };
  });
  console.log('AFTER TOUCH TAP:', JSON.stringify(res));

  // If not opened, try tapping twice (double-tap zoom might eat first tap)
  if (!res.cName || !res.cName.includes('ترکیه')) {
    console.log('first tap failed, retrying...');
    await page.touchscreen.tap(pt.x, pt.y);
    await page.waitForTimeout(1500);
    const res2 = await page.evaluate(() => ({ cName: (document.getElementById('c-name') || {}).textContent }));
    console.log('AFTER RETAP:', JSON.stringify(res2));
  }

  console.log('--- console errors/warnings ---');
  logs.slice(0, 12).forEach(l => console.log(l));

  await page.screenshot({ path: '/home/z/my-project/scripts/touch-test.png' });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
