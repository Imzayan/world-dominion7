// V87 look: clean screenshots of the glowing dock (mobile + desktop), tutorial dismissed
import { chromium } from 'playwright'
const BASE = process.env.WD_BASE || 'http://127.0.0.1:3100'
const URL = BASE + '/game/index.html?v=' + Date.now()
const OUT = '/home/z/my-project/download'

const browser = await chromium.launch({ headless: true })
const errors = []

async function boot(width, height, name, mobile) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
    viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(5000)
  await page.evaluate(async () => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) {
      n.value = 'lk87' + Math.random().toString(36).slice(2, 7); p.value = 'dgtess1234'; p2.value = 'dgtess1234'
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) }
    }
  })
  await page.waitForTimeout(6000)
  /* dismiss tutorial + any overlay so the dock is visible */
  await page.evaluate(() => {
    try { document.body.classList.remove('wd45-tutshow') } catch (e) {}
    try { const x = [...document.querySelectorAll('button')].find(b => /رد شدنت|رد کردن|بستن/.test(b.textContent || '')); if (x) x.click() } catch (e) {}
    try { document.querySelectorAll('.wd45-tut,.wd45-tut-layer,.modal.active').forEach(m => { if (m.id !== 'wd87dock') m.classList.remove('active') }) } catch (e) {}
  })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/v87-${name}.png` })
  const inv = await page.evaluate(() => {
    const d = document.getElementById('wd87dock')
    if (!d) return { dock: false }
    const r = d.getBoundingClientRect()
    const strip = document.getElementById('hud-strip').getBoundingClientRect()
    return { dock: true, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), stripTop: Math.round(strip.top), btns: d.querySelectorAll('.wd87-ic').length, inView: r.top >= 0 && r.left >= 0 && r.right <= innerWidth }
  })
  console.log(name + ': ' + JSON.stringify(inv))
  await ctx.close()
}

await boot(390, 844, 'dock-mobile.png', true)
await boot(1280, 800, 'dock-desktop.png', false)
console.log('pageerrors:', errors.length, errors.slice(0, 3))
await browser.close()
