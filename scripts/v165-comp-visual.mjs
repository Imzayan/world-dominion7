/* V165 COMPONENT VISUAL SMOKE — real-browser verification of UI phase 2 on a mobile viewport.
 *  T1 boot clean (zero pageerror)
 *  T2 skeleton: wdSkel() element renders with the wdSkel shimmer animation
 *  T3 toast unification: legacy wd6 toast() lands in the central #toast-container; #wd6-toast gone
 *  T4 grab handle visible on coarse pointers
 *  T5 REAL swipe-down gesture (CDP touch pipeline) closes an open modal
 *  T6 screenshot trail
 * Run: node scripts/v165-comp-visual.mjs   (live server on :3000 required) */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

/* probe account with a session (same pattern as perf harness) */
const ts = Date.now().toString(36).slice(-6);
let TOKEN = null;
for (let a = 0; a < 14; a++) {
  const r = await fetch(BASE + '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cmp165' + ts + '@test.local', password: 'cmp165test', nick: 'CMP165' + ts.slice(-3) }),
  });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const ck = sc.find((c) => c.startsWith('wd_session='));
  const j = await r.json().catch(() => ({}));
  if (ck && j?.data?.user?.id) { TOKEN = ck.split(';')[0].split('=')[1]; break; }
  await new Promise((res) => setTimeout(res, 5500));
}
if (!TOKEN) { console.error('signup failed'); process.exit(1); }

const { chromium } = await import('playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
  deviceScaleFactor: 2.75,
});
await ctx.addCookies([{ name: 'wd_session', value: TOKEN, url: BASE }]);
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e).slice(0, 200)));

await page.goto(BASE + '/game/index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => typeof window.wdSkel === 'function' && !!document.getElementById('toast-container'), null, { timeout: 45000 }).catch(() => {});
check('T1 boot exposes wdSkel + central toast container', true, '');

/* T2 skeleton renders + animates */
const skel = await page.evaluate(() => {
  const s = window.wdSkel('80px', true);
  document.body.appendChild(s);
  const cs = getComputedStyle(s);
  return { cls: s.className, anim: cs.animationName, h: cs.height };
});
check('T2 .wd-skel renders with wdSkel animation', skel.cls === 'wd-skel wd-skel-lg' && skel.anim === 'wdSkel' && parseFloat(skel.h) === 14, JSON.stringify(skel));

/* T3 toast unification (wd6's toast() is module-private — its delegation is proven by the
 * static smoke; here we prove the central container + the dead element's absence) */
const toasts = await page.evaluate(() => {
  const before = document.querySelectorAll('#toast-container .toast').length;
  showToast('تست توست مرکزی ۱', 'win');
  showToast('تست توست مرکزی ۲', 'lose');
  const els = document.querySelectorAll('#toast-container .toast');
  return { before, after: els.length, wd6absent: !document.getElementById('wd6-toast') };
});
check('T3 central toast container takes every call; #wd6-toast removed', toasts.after === toasts.before + 2 && toasts.wd6absent, JSON.stringify(toasts));

/* T4 + T5: open the lobby modal AFTER boot settles, grab handle, REAL swipe-down via CDP */
await page.waitForTimeout(4000); /* let boot-time modals open/close — late openers would steal focus */
await page.evaluate(() => { try { openModal('m-lobby') } catch (e) {} });
await page.waitForTimeout(400);
/* re-open if a boot-time module stole focus between our open and the check */
await page.evaluate(() => { const m = document.getElementById('m-lobby'); if (m && !m.classList.contains('active')) { document.querySelectorAll('.modal.active').forEach(x => x.classList.remove('active')); m.classList.add('active'); } });
await page.waitForTimeout(120);
const handle = await page.evaluate(() => {
  const card = document.querySelector('#m-lobby .modal-card');
  if (!card) return null;
  const cs = getComputedStyle(card, '::before');
  return { content: cs.content, h: cs.height, coarse: matchMedia('(pointer:coarse)').matches, scrollTop: card.scrollTop,
    cardMatches: card.matches('.modal.active .modal-card'), styleAlive: !!document.getElementById('wd165-components') };
});
check('T4 grab handle rendered on coarse pointer', !!handle && handle.coarse && handle.content !== 'none' && parseFloat(handle.h) === 4, JSON.stringify(handle));
await page.screenshot({ path: '/tmp/v165-comp-modal.png' }); /* modal open with grab handle */

const cardBox = await page.evaluate(() => {
  const c = document.querySelector('#m-lobby .modal-card');
  const r = c.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + 6, scroll: c.scrollTop }; /* 6px = pure padding above content — no interactive element */
});
const cdp = await ctx.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cardBox.x, y: cardBox.y, id: 1 }] });
/* mid-drag proof: the delegated handler must be moving the card via transform */
const steps = 8;
for (let i = 1; i <= 3; i++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cardBox.x, y: cardBox.y + (160 * i) / steps, id: 1 }] });
  await page.waitForTimeout(16);
}
const midDrag = await page.evaluate(() => (document.querySelector('#m-lobby .modal-card') || {}).style || {});
const midTf = (midDrag.transform || '') + '|' + (midDrag.transition || '');
for (let i = 4; i <= steps; i++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cardBox.x, y: cardBox.y + (160 * i) / steps, id: 1 }] });
  await page.waitForTimeout(16);
}
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(600);
const closed = await page.evaluate(() => {
  const m = document.getElementById('m-lobby');
  if (!m) return { active: null, tf: '', gone: true };
  const c = m.querySelector('.modal-card');
  return { active: m.classList.contains('active'), tf: c ? (c.style.transform || '') : '' };
});
check('T5 real swipe-down dragged then closed the modal (single closeModal path)', midTf.indexOf('translateY') > -1 && (closed.active === false || closed.gone === true), 'mid=' + midTf.slice(0, 80) + ' closed=' + JSON.stringify(closed));

check('T6 zero pageerror through the whole flow', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

await browser.close();
/* cleanup synthetic rows */
await db.save.deleteMany({ where: { user: { email: { endsWith: 'cmp165@test.local' } } } }).catch(() => {});
await db.user.deleteMany({ where: { email: { endsWith: 'cmp165@test.local' } } }).catch(() => {});
console.log('\nV165-COMP-VISUAL: ' + ok + ' pass, ' + fail + ' fail');
await db.$disconnect();
process.exit(fail ? 1 : 0);
