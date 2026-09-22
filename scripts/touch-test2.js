/* Find 404 resources + test low-power/mobile-low mode tap behavior */
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'fa-IR' });
  const page = await ctx.newPage();
  const fails = [];
  page.on('response', r => { if (r.status() >= 400) fails.push(r.status() + ' ' + r.url()); });

  await page.goto('https://world-dominionnrg.onrender.com/', { timeout: 120000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(9000);

  console.log('--- 404s ---');
  [...new Set(fails)].forEach(f => console.log(f));

  const state = await page.evaluate(() => ({
    lowPower: document.body.classList.contains('wd-low-power'),
    mobileLow: document.body.classList.contains('wd16-mobile-low'),
    perf: document.body.classList.contains('wd-perf'),
    wd22set: localStorage.getItem('wd22_set'),
    bodyClasses: document.body.className,
  }));
  console.log('--- state ---');
  console.log(JSON.stringify(state, null, 1));

  // Simulate a weak phone: enable perf mode + reload, then tap
  await page.evaluate(() => {
    localStorage.setItem('wd22_set', JSON.stringify({ perf: true, labels: true, sound: true }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const g = await page.evaluate(() => {
    const bs = document.querySelectorAll('#auth button, .modal button');
    for (const b of bs) if (b.textContent.includes('مهمان')) { b.click(); break; }
    return true;
  });
  await page.waitForTimeout(5000);
  const pt = await page.evaluate(() => {
    const p = map.latLngToContainerPoint([39, 35]);
    const r = document.getElementById('map').getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  });
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(1800);
  const res = await page.evaluate(() => ({ cName: (document.getElementById('c-name') || {}).textContent, open: document.getElementById('country-drawer').classList.contains('open') }));
  console.log('--- perf-mode tap ---');
  console.log(JSON.stringify(res));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
