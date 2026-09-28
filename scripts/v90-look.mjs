// V90 شواهد بصری: تب رقیب (جفت‌یاب) + تب پروفایل (شناسنامه با رده) — دسکتاپ + موبایل
import { chromium } from 'playwright'
const BASE = process.env.WD_BASE || 'http://localhost:3100'
const URL = BASE + '/game/index.html?v=' + Date.now()
const browser = await chromium.launch({ headless: true })

async function boot(nick, vp) {
  const ctx = await browser.newContext(vp)
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(4500)
  await page.evaluate(async (nk) => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) {
      n.value = nk; p.value = 'dgtess1234'; p2.value = 'dgtess1234'
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) }
    }
  }, nick)
  await page.waitForTimeout(6000)
  return page
}

/* کاربر دارای رده از QA: ورود با حساب موجود (login) — اگر نبود، ثبت‌نام تازه */
const MOBILE = { userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
const DESK = { viewport: { width: 1280, height: 800 } }

async function shots(vp, tag, nick) {
  const page = await boot(nick, vp)
  await page.evaluate(() => { try { window.WD33_GAMES_OPEN() } catch (e) {} })
  await page.waitForTimeout(8000)
  await page.evaluate(() => { const b = document.querySelector('.wg89-tab[data-t="rivals"]'); b && b.click() })
  await page.waitForTimeout(3200)
  await page.screenshot({ path: '/home/z/my-project/download/v90-rivals-' + tag + '.png' })
  await page.evaluate(() => { const b = document.querySelector('.wg89-tab[data-t="profile"]'); b && b.click() })
  await page.waitForTimeout(2600)
  await page.screenshot({ path: '/home/z/my-project/download/v90-profile-' + tag + '.png' })
  await page.evaluate(() => { const b = document.querySelector('.wg89-tab[data-t="disc"]'); b && b.click() })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: '/home/z/my-project/download/v90-disc-' + tag + '.png' })
}

await shots(MOBILE, 'mobile.png', 'v90shot' + Math.random().toString(36).slice(2, 6))
await shots(DESK, 'desktop.png', 'v90shot' + Math.random().toString(36).slice(2, 6))
console.log('shots done')
await browser.close()
