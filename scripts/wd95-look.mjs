/* WD95 — شواهد تصویری UI اجتماعی (موبایل 390x844) */
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/124.0 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto('http://localhost:3000/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 })
try { await page.waitForSelector('#nick', { timeout: 30000 }) } catch (e) {}
await page.waitForTimeout(1000)
const nick = 'v95show' + Date.now().toString(36).slice(-4)
await page.evaluate(async (n) => {
  document.getElementById('nick').value = n
  document.getElementById('pw').value = 'wdtest1234'
  document.getElementById('pw2').value = 'wdtest1234'
  const b = [...document.querySelectorAll('button')].find((b) => /ثبت‌نام و شروع/.test(b.textContent || ''))
  b.click()
  for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 800)); try { const x = await sb.auth.getSession(); if (x && x.data && x.data.session) return true } catch (e) {} }
  return false
}, nick)
await page.waitForTimeout(6000)
/* بستن اینترو سینمایی المپیک اگر باز است — دکمه‌ی «رد کردن» */
for (let i = 0; i < 8; i++) {
  const closed = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /رد کردن/.test(x.textContent || '')); if (b) { b.click(); return true } return false })
  if (!closed) break
  await page.waitForTimeout(900)
}
const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: 'download/v95-' + name + '.png' }); console.log('shot', name) }

/* ۱) سلکتور سرور */
await page.evaluate(() => window.WDS.servers())
await shot('servers')
await page.evaluate(() => closeModal('wd-servers'))
/* ۲) پروفایل خودم */
await page.evaluate((n) => window.WDS.profile(n, true), nick)
await shot('profile')
await page.evaluate(() => closeModal('wd-profile'))
/* ۳) پیام‌ها (خالی) */
await page.evaluate(() => window.WDS.msgs())
await shot('messages')
await page.evaluate(() => closeModal('wd-msgs'))
/* ۴) اعلان‌ها */
await page.evaluate(() => window.WDS.notifs())
await shot('notifs')
await page.evaluate(() => closeModal('wd-notifs'))
/* ۵) چت جهانی موجود (ارتقایافته) */
await page.evaluate(() => { const cb = document.getElementById('wd-chat-btn'); if (cb) cb.click() })
await shot('world-chat')
await page.evaluate(() => closeModal('wd-chat'))
/* ۶) چیپ‌های HUD */
await page.evaluate(() => { const m = document.getElementById('wd-splash'); if (m) m.remove() })
await shot('hud-chips')
await browser.close()
console.log('DONE')
