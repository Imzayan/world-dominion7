/* Full V26 verification: tap feedback, fallback hit-test, podium rank, Arsenal→Army */
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'fa-IR' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 150)); });

  await page.goto('http://localhost:3200/', { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);

  // guest login
  await page.evaluate(() => {
    const bs = document.querySelectorAll('#auth button, .modal button');
    for (const b of bs) if (b.textContent.includes('مهمان')) { b.click(); return; }
  });
  await page.waitForTimeout(4000);

  // 1) name check: Arsenal should be gone
  const names = await page.evaluate(() => {
    const t = document.body.innerText;
    return { hasArsenal: t.includes('آرسنال'), hasArmy: t.includes('ارتش') };
  });
  console.log('1) name check:', JSON.stringify(names));

  // 2) tap Turkey → pulse + drawer
  const pt = await page.evaluate(() => {
    const p = map.latLngToContainerPoint([39, 35]);
    const r = document.getElementById('map').getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  });
  await page.touchscreen.tap(pt.x, pt.y);
  await page.waitForTimeout(500);
  const pulseSeen = await page.evaluate(() => !!document.querySelector('.wd26-pulse'));
  await page.waitForTimeout(1300);
  const drawer = await page.evaluate(() => ({
    name: (document.getElementById('c-name') || {}).textContent,
    open: document.getElementById('country-drawer').classList.contains('open'),
  }));
  console.log('2) tap Turkey: pulse=' + pulseSeen, JSON.stringify(drawer));

  // 3) claim capital then tap ocean → drawer closes
  await page.evaluate(() => {
    const b = document.querySelector('#act-claim'); if (b) b.click();
  });
  await page.waitForTimeout(1200);
  const oceanPt = await page.evaluate(() => {
    // find a point inside viewport, ABOVE the open drawer, that is guaranteed ocean
    const dr = document.getElementById('country-drawer').getBoundingClientRect();
    const cands = [];
    for (let y = 120; y < Math.min(dr.top - 15, 360); y += 40)
      for (let x = 30; x < innerWidth - 30; x += 60) cands.push([x, y]);
    for (const c of cands) {
      const ll = map.containerPointToLatLng(c);
      let isOcean = false;
      try { isOcean = !window.wd26HitTest(ll); } catch (e) {}
      if (isOcean) {
        const r = document.getElementById('map').getBoundingClientRect();
        return { x: r.left + c[0], y: r.top + c[1], ll: [ll.lat.toFixed(1), ll.lng.toFixed(1)] };
      }
    }
    return null;
  });
  console.log('3a) ocean point:', JSON.stringify(oceanPt));
  if (oceanPt) {
    await page.touchscreen.tap(oceanPt.x, oceanPt.y);
    await page.waitForTimeout(800);
    const ocean = await page.evaluate(() => ({
      closed: !document.getElementById('country-drawer').classList.contains('open'),
      name: (document.getElementById('c-name') || {}).textContent,
    }));
    console.log('3b) ocean tap:', JSON.stringify(ocean));
  }

  // 4) FALLBACK hit-test: disable canvas layer click handlers, tap Iraq → fallback must open drawer
  await page.evaluate(() => {
    // simulate canvas hit-test failure: unbind all click handlers from country layers
    Object.keys(layersByName).forEach(n => { try { layersByName[n].off('click'); } catch (e) {} });
  });
  const iraqPt = await page.evaluate(() => {
    const p = map.latLngToContainerPoint([33, 43.5]); // inside Iraq
    const r = document.getElementById('map').getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  });
  await page.touchscreen.tap(iraqPt.x, iraqPt.y);
  await page.waitForTimeout(900);
  const fallback = await page.evaluate(() => ({
    name: (document.getElementById('c-name') || {}).textContent,
    open: document.getElementById('country-drawer').classList.contains('open'),
  }));
  console.log('4) FALLBACK hit-test (Iraq):', JSON.stringify(fallback));

  // 5) rank podium: open rank modal (real flow) then inject fake rows
  await page.evaluate(() => { const b = document.getElementById('btn-m-rank'); if (b) b.click(); });
  await page.waitForTimeout(2500);
  const podium = await page.evaluate(async () => {
    const box = document.getElementById('live-rank');
    if (!box) return { err: 'no live-rank box' };
    // clear whatever online data arrived and inject deterministic rows
    box.textContent = '';
    const rows = [['1. علی', '۱۲ کشور'], ['2. Reza', '۹ کشور'], ['3. Sara', '۷ کشور'], ['4. Omid', '۳ کشور']];
    rows.forEach(([a, b], i) => {
      const r = document.createElement('div'); r.className = 'lr-row' + (i === 1 ? ' me' : '');
      const s1 = document.createElement('span'); s1.textContent = a;
      const s2 = document.createElement('span'); s2.textContent = b;
      r.append(s1, s2); box.appendChild(r);
    });
    // wait for wd26 podium observer
    for (let i = 0; i < 10 && !box.querySelector('.wd26-podium'); i++) {
      await new Promise(res => setTimeout(res, 250));
    }
    const pod = box.querySelector('.wd26-podium');
    if (!pod) return { podium: false };
    const cards = [...pod.querySelectorAll('.wd26-pc')].map(c => ({
      cls: c.className.replace('wd26-pc ', '').trim(),
      medal: c.querySelector('.wd26-medal').textContent,
      nick: c.querySelector('b').textContent,
      val: (c.querySelector('.lr-val') || {}).textContent || '',
      me: c.classList.contains('me'),
    }));
    return { podium: true, cards };
  });
  console.log('5) rank podium:', JSON.stringify(podium, null, 1));

  console.log('--- errors ---');
  errs.slice(0, 8).forEach(e => console.log(e));
  if (!errs.length) console.log('(none)');
  await page.screenshot({ path: '/home/z/my-project/scripts/v26-test.png' });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
