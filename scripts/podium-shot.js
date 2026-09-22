/* Screenshot the podium specifically */
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 400, height: 780 }, deviceScaleFactor: 2 })).newPage();
  await page.goto('http://localhost:3200/', { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.evaluate(() => {
    const bs = document.querySelectorAll('#auth button, .modal button');
    for (const b of bs) if (b.textContent.includes('مهمان')) { b.click(); return; }
  });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { const b = document.getElementById('btn-m-rank'); if (b) b.click(); });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    const box = document.getElementById('live-rank');
    if (!box) return;
    box.textContent = '';
    const rows = [['1. علی قهرمان', '۱۲ کشور'], ['2. Reza', '۹ کشور'], ['3. Sara', '۷ کشور'], ['4. Omid', '۳ کشور'], ['5. Nima', '۲ کشور']];
    rows.forEach(([a, b], i) => {
      const r = document.createElement('div'); r.className = 'lr-row' + (i === 0 ? ' me' : '');
      r.append(Object.assign(document.createElement('span'), { textContent: a }),
               Object.assign(document.createElement('span'), { textContent: b }));
      box.appendChild(r);
    });
    for (let i = 0; i < 12 && !box.querySelector('.wd26-podium'); i++)
      await new Promise(res => setTimeout(res, 250));
  });
  await page.waitForTimeout(800);
  // scroll podium into view
  await page.evaluate(() => {
    const pod = document.querySelector('.wd26-podium');
    if (pod) pod.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/z/my-project/scripts/podium.png' });
  await browser.close();
  console.log('podium.png saved');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
