import { chromium } from 'playwright'
const BASE = process.env.WD_BASE || 'http://localhost:3100'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Mobile Safari/537.36', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
const page = await ctx.newPage()
await page.goto(BASE + '/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
await page.evaluate(async () => {
  const n = document.getElementById('nick'), p = document.getElementById('pw')
  if (n && p) { n.value = 'q88shot2' + Math.random().toString(36).slice(2, 5); p.value = 'dgtess1234'; document.getElementById('pw2').value = 'dgtess1234'
    const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
    if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) } }
})
await page.waitForTimeout(7000)
const r = await page.evaluate(() => {
  try {
    if (window.WD65 && WD65.open) { WD65.open('empire') }
    return { wd65: !!window.WD65 }
  } catch (e) { return { err: String(e).slice(0, 80) } }
})
await page.waitForTimeout(1500)
await page.evaluate(() => { try { const b = [...document.querySelectorAll('#wd65-card button')].find(x => /برنامه‌ی نبرد/.test(x.textContent || '')); b && b.click() } catch (e) {} })
await page.waitForTimeout(2500)
const st = await page.evaluate(() => ({ grid: !!document.querySelector('.wd88-atkgrid'), chips: document.querySelectorAll('.wd88-atk').length, sheet: !!document.querySelector('#wd65-sheet.open') }))
console.log(JSON.stringify(r), JSON.stringify(st))
if (st.grid) { const sh = await page.$('#wd65-card'); if (sh) await sh.screenshot({ path: 'download/v88-war-plan.png' }) }
await browser.close()
console.log('done')
