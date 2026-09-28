import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36' })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:3100/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)
await page.evaluate(async () => {
  const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
  if (n && p) { n.value = 'ms87' + Math.random().toString(36).slice(2, 7); p.value = 'dgtess1234'; p2.value = 'dgtess1234'
    const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
    if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) } }
})
await page.waitForTimeout(6000)
const m = await page.evaluate(() => {
  const r = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), vis: getComputedStyle(e).display !== 'none' } }
  return { dock: r('wd87dock'), info: r('hud-info'), date: r('hud-date'), strip: r('hud-strip'), fab: r('hud-olympic'), overlap: (() => { const d = r('wd87dock'), i = r('hud-info'); if (!d || !i) return false; return d.l < i.r && i.l < d.r && d.t < i.b && i.t < d.b })() }
})
console.log(JSON.stringify(m))
await browser.close()
