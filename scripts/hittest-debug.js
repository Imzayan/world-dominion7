/* Debug hitTest over known ocean points */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 664 } })).newPage();
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 150)));
  await page.goto('http://localhost:3200/', { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  const res = await page.evaluate(() => {
    const pts = [
      ['Med-west', 35.5, 6.0], ['Med-center', 35.0, 16.0], ['BlackSea', 43.5, 34.0],
      ['NorthSea', 56.5, 3.5], ['Baltic', 56.5, 19.0], ['Guinea-GL', 0.0, -10.0],
      ['Caspian', 41.5, 50.5], ['RedSea', 20.0, 38.5], ['PersianGulf', 26.5, 52.0],
      ['Turkey', 39.0, 35.0], ['Iraq', 33.0, 43.5],
    ];
    return pts.map(([n, la, lo]) => {
      let hit = 'ERR';
      try { const h = (window.wd26HitTest||hitTest)({ lat: la, lng: lo }); hit = h ? h.name : "OCEAN"; } catch (e) { hit = 'EX:' + e.message; }
      return n + '=' + hit;
    });
  });
  console.log(res.join('\n'));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
