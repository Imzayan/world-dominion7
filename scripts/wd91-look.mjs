import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl'] })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/124.0 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('pageerror', e => console.log('PE:', String(e).slice(0, 150)))
await page.goto('http://localhost:3000/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 })
try { await page.waitForSelector('#nick', { timeout: 40000 }) } catch (e) {}
await page.waitForTimeout(1500)
await page.evaluate(() => {
  document.getElementById('nick').value = 'wd91l' + String(Date.now()).slice(-5)
  document.getElementById('pw').value = 'dgtess1234'
  document.getElementById('pw2').value = 'dgtess1234'
  const b = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
  b.click()
})
for (let i = 0; i < 25; i++) { const s = await page.evaluate(async () => { try { const x = await sb.auth.getSession(); return !!(x && x.data && x.data.session) } catch (e) { return false } }); if (s) break; await page.waitForTimeout(1000) }
await page.waitForTimeout(3000)
/* صحنه‌ی مستقیم: openSpar بدون پوسته — برای عکس تمیز */
await page.evaluate(async () => {
  if (!window.WD_BOX5) {
    await new Promise((res) => { const s = document.createElement('script'); s.src = '/game/box5.js?v=91'; s.onload = res; s.onerror = res; document.head.appendChild(s) })
  }
  const d = document.createElement('div')
  d.id = 'b5-look'
  d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#05070d'
  document.body.appendChild(d)
  await window.WD_BOX5.openStory(d)
})
await page.waitForTimeout(10000)
await page.screenshot({ path: '/home/z/my-project/download/v91-story-menu.png' })
/* پرده ۱ سینما */
await page.evaluate(() => { const el = document.querySelector('#b5-look .b5-act.open'); if (el) el.click() })
await page.waitForTimeout(7000)
await page.screenshot({ path: '/home/z/my-project/download/v91-prologue.png' })
await browser.close()
console.log('look done')
