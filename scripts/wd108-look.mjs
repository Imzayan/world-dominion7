/* V108 UI look: shop home shows EMPEROR STARTER hero (fresh account), confirm modal opens,
   war tab renders arsenal cards with server stock, drawer section mounts. Screenshot evidence. */
import { chromium } from 'playwright'
const br = await chromium.launch()
const errors = []
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }
const nick = 'wd108l' + Date.now().toString(36).slice(-6)
const ctx = await br.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Mobile Chrome/124.0', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))
await page.goto('http://localhost:3000/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(4000)
await page.evaluate(async (nk) => {
  const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
  if (n && p) { n.value = nk; p.value = 'dgtess1234'; p2.value = 'dgtess1234'
    const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
    if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) } }
}, nick)
await page.waitForTimeout(6000)

/* open shop via nav */
const opened = await page.evaluate(() => {
  const b = document.getElementById('btn-m-shop')
  if (b) { b.click(); return true }
  if (window.WD66_SHOP && window.WD66_SHOP.open) { window.WD66_SHOP.open(); return true }
  return false
})
await page.waitForTimeout(2500)
check('shop modal opened', !!opened)
const hero = await page.evaluate(() => ({
  card: !!document.querySelector('.wd108-starter'),
  ttl: (document.querySelector('.wd108-starter .ttl') || {}).textContent || '',
  price: (document.querySelector('.wd108-price') || {}).textContent || '',
  timer: /⏳/.test((document.querySelector('.wd108-timer') || {}).textContent || ''),
  items: document.querySelectorAll('.wd108-starter .wd108-it').length,
  buy: !!document.querySelector('[data-act="starter"]'),
}))
check('starter hero rendered on fresh account', hero.card, JSON.stringify(hero))
check('hero title = EMPEROR STARTER PACK', /EMPEROR STARTER PACK/.test(hero.ttl), hero.ttl)
check('hero price ۱۴۰٬۰۰۰ تومان', /۱۴۰٬۰۰۰/.test(hero.price), hero.price)
check('hero countdown ticking', hero.timer)
check('hero shows 12 content tiles', hero.items === 12, String(hero.items))
check('BUY NOW button present', hero.buy)
await page.screenshot({ path: '/home/z/my-project/download/v108-starter-hero.png' })

/* confirm modal */
await page.evaluate(() => document.querySelector('[data-act="starter"]').click())
await page.waitForTimeout(600)
const conf = await page.evaluate(() => ({
  modal: !!document.querySelector('.wd66-pv .wd108-grid'),
  cancel: !!document.querySelector('.wd66-pv .wd66-buy.off'),
  ok: [...document.querySelectorAll('.wd66-pv .wd108-buy')].some(b => /خرید/.test(b.textContent || '')),
}))
check('confirm modal with full contents + cancel + purchase', conf.modal && conf.cancel && conf.ok, JSON.stringify(conf))
await page.evaluate(() => { const m = document.querySelector('.wd66-pv'); if (m) m.remove() })

/* war tab arsenal */
await page.evaluate(() => { document.querySelector('[data-cat="war"]')?.click() })
await page.waitForTimeout(3000)
const ars = await page.evaluate(() => ({
  cards: document.querySelectorAll('.wd108-arshop .wd108-ars').length,
  supply: (document.querySelector('.wd108-arshop .wd108-ars') || {}).textContent || '',
  buyBtns: document.querySelectorAll('.wd108-arshop [data-buy108]').length,
}))
check('arsenal renders 6 cards (supply + 5 weapons)', ars.cards === 6, String(ars.cards))
check('war supply card with price', /تدارک جنگی/.test(ars.supply) && /۴۰/.test(ars.supply), ars.supply.slice(0, 80))
check('shop-mode buy buttons present', ars.buyBtns >= 5, String(ars.buyBtns))
await page.screenshot({ path: '/home/z/my-project/download/v108-arsenal-shop.png' })

check('zero pageerrors', errors.length === 0, errors.join('|').slice(0, 160))
await ctx.close(); await br.close()
console.log('\n== ' + ok + '/' + (ok + fail) + ' ==')
process.exit(fail ? 1 : 0)
