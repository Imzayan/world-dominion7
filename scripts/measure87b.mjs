import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
async function m(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36' })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:3100/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await page.evaluate(async () => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) { n.value = 'mb87' + Math.random().toString(36).slice(2, 7); p.value = 'dgtess1234'; p2.value = 'dgtess1234'
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) } }
  })
  await page.waitForTimeout(6000)
  const r = await page.evaluate(() => {
    const g = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom) } }
    const d = g('wd87dock'), i = g('hud-info')
    const overlap = d && i && d.l < i.r && i.l < d.r && d.t < i.b && i.t < d.b
    return { vw: innerWidth, dock: d, info: i, overlap, dockOffscreen: d ? d.l < 0 : null }
  })
  console.log(width + 'px: ' + JSON.stringify(r))
  await page.screenshot({ path: '/home/z/my-project/download/v87-narrow' + width + '.png' })
  await ctx.close()
}
await m(320, 568)
await m(390, 844)
await browser.close()
