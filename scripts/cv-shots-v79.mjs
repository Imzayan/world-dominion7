// V79 — اسکرین‌شات نمای کشور نقاشی‌شده (۵ زوم + پنل) برای بازبینی بصری
// Usage: WD_BASE=http://127.0.0.1:3210 node scripts/cv-shots-v79.mjs
import { chromium } from 'playwright';

const BASE = process.env.WD_BASE || 'http://127.0.0.1:3210';
const OUT = process.env.WD_OUT || '/home/z/my-project/download';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
  viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const nick = 'cvsh79' + Date.now().toString(36).slice(-6);
const resp = await page.request.post(BASE + '/api/auth/signup', { data: { email: nick + '@wd.test', password: 'cvqa123456', nick } });
if (!resp.ok()) { console.log('signup failed', resp.status()); process.exit(1); }

await page.goto(`${BASE}/game/index.html?v=79`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
// بستن مراسم المپیک/اسپلش که روی کاربر جدید می‌افتد
await page.evaluate(() => {
  const sk = document.querySelector('.cskip');
  if (sk) sk.click();
});
await page.waitForTimeout(1500);
await page.evaluate(async () => {
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = '/game/cv-engine.js?v=79';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
    setTimeout(rej, 8000);
  });
  await window.WDCV._qaOpen('Iran');
});
await page.waitForTimeout(2500);

for (const z of ['0.8', '1.2', '1.7', '2.2', '3.0']) {
  await page.evaluate(async (zz) => {
    const S = window.WDCV.S;
    S.cam.anim = false; S.enter = null; S.sel.prov = -1; S.hover = -1;
    S.cam.z = parseFloat(zz); S.cam.x = 0; S.cam.y = 0;
  }, z);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/v79-zoom-${z}.png` });
  console.log('shot z=' + z);
}
await page.evaluate(() => window.WDCV.openProvPanel(0));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/v79-province-panel.png` });
console.log('shot province panel');
console.log('pageerrors:', errors.length);
await browser.close();
