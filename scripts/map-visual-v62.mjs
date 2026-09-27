// V62 map-visual harness: flags-trigger fix + sea single-source + hub hardening
// Usage: WD_BASE=http://localhost:3000 node scripts/map-visual-v62.mjs
import { chromium } from 'playwright'
const BASE = process.env.WD_BASE || 'http://localhost:3000'
const URL = BASE + '/game/index.html?v=' + Date.now()
let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }

const browser = await chromium.launch({ headless: true })
const errors = []

async function boot(width, height, register = true) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
    viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(8000)
  if (register) {
    await page.evaluate(async () => {
      const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
      if (n && p) {
        n.value = 'dg' + Math.random().toString(36).slice(2, 8); p.value = 'dgtess1234'; p2.value = 'dgtess1234'
        const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
        if (btn) { btn.click(); await new Promise(r => setTimeout(r, 4000)) }
      }
    })
    await page.waitForTimeout(4000)
  }
  return { ctx, page }
}

// ---------- 1) main pass 390x844 ----------
{
  const { ctx, page } = await boot(390, 844)

  const sea = await page.evaluate(() => {
    const lc = document.querySelector('.leaflet-container')
    const cs = getComputedStyle(lc)
    const w = document.getElementById('waves')
    return { bg: cs.backgroundImage.slice(0, 90), bgColor: cs.backgroundColor, waves: w ? getComputedStyle(w).display : 'absent' }
  })
  check('sea = single light-blue gradient (V62 canonical)', /4aa3d2|74,\s?163,\s?210|163,\s?210/.test(sea.bg) || sea.bg.includes('74, 163, 210'), sea.bg.slice(0, 60))
  check('#waves decorative layer removed (display:none)', sea.waves === 'none' || sea.waves === 'absent', sea.waves)
  check('sea bg is NOT the old dark navy (#17415d family)', !/23,\s?65,\s?93/.test(sea.bg) && !/11,\s?49,\s?73/.test(sea.bg), '')

  // flags: boot visibility must be OWNERSHIP-driven (V56 declutter kept + V62 no-zoom fix)
  const f0 = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img.flag')]
    return { total: imgs.length, hidden: imgs.filter(i => i.style.display === 'none').length, fl: (typeof FL !== 'undefined') ? Object.keys(FL).length : -1,
      oth: (typeof OTH !== 'undefined') ? Object.keys(OTH).length : -1 }
  })
  check('flags built for all countries', f0.fl >= 150, 'FL=' + f0.fl)
  const f0b = await page.evaluate(async () => {
    const vis0 = [...document.querySelectorAll('img.flag')].filter(i => i.style.display !== 'none').length
    try { applyOthers({}); await new Promise(r => setTimeout(r, 350)) } catch (e) { return { vis0, err: String(e).slice(0, 120) } }
    const imgs = [...document.querySelectorAll('img.flag')]
    return { vis0, hiddenAfterClear: imgs.filter(i => i.style.display === 'none').length, total: imgs.length }
  })
  // populated server → owned flags visible at boot with ZERO zoom; empty server → 0 visible is correct.
  // Clearing ownership must hide ALL flags (declutter intact, no leak).
  check('boot: owned flags visible WITHOUT zoom + clear OTH hides all (no leak)',
    f0b.total > 0 && f0b.hiddenAfterClear === f0b.total && (f0b.vis0 >= 1 || f0.oth === 0),
    `vis0=${f0b.vis0} oth=${f0.oth} cleared=${f0b.hiddenAfterClear}/${f0b.total}`)

  // THE FIX: ownership arrives → flag appears WITHOUT any zoom
  const f1 = await page.evaluate(async () => {
    try {
      if (typeof OTH === 'undefined') return { err: 'no OTH global' }
      applyOthers({ Mongolia: { nick: 'DGtestP', cap: false } })
      await new Promise(r => setTimeout(r, 400))
      const imgs = [...document.querySelectorAll('img.flag')]
      const vis = imgs.filter(i => i.style.display !== 'none' && i.style.width && i.style.width !== '')
      return { visible: vis.length, hidden: imgs.filter(i => i.style.display === 'none').length, total: imgs.length }
    } catch (e) { return { err: String(e).slice(0, 150) } }
  })
  check('FIX: owned-country flag appears WITHOUT zoom (applyOthers→sizeFlags)', f1.visible >= 1, JSON.stringify(f1))

  // single-flag sizing path (setFlag → sizeFlags(n))
  const f2 = await page.evaluate(async () => {
    try {
      applyOthers({}) // clear
      await new Promise(r => setTimeout(r, 300))
      applyOthers({ Brazil: { nick: 'DGtestP', cap: true } })
      await new Promise(r => setTimeout(r, 400))
      const imgs = [...document.querySelectorAll('img.flag')]
      const vis = imgs.filter(i => i.style.display !== 'none' && i.style.width !== '')
      return { visible: vis.length }
    } catch (e) { return { err: String(e).slice(0, 150) } }
  })
  check('FIX: single-flag path works (setFlag→sizeFlags(n))', f2.visible >= 1, JSON.stringify(f2))

  // zoomend still resizes (dynamic dispatch)
  const f3 = await page.evaluate(async () => {
    try { map.setZoom(Math.min(6, map.getZoom() + 1)); await new Promise(r => setTimeout(r, 900)); map.setZoom(Math.max(2, map.getZoom() - 1)); await new Promise(r => setTimeout(r, 900)) } catch (e) { return String(e).slice(0, 120) }
    const imgs = [...document.querySelectorAll('img.flag')]
    return { visibleAfterZoom: imgs.filter(i => i.style.display !== 'none' && i.style.width !== '').length }
  })
  check('zoomend → sizeFlags still works (dynamic dispatch)', typeof f3 === 'object' && f3.visibleAfterZoom >= 1, JSON.stringify(f3))

  // olympic hub opens with content (or V62 error card — never blank)
  const oly = await page.evaluate(async () => {
    const c = document.getElementById('hud-olympic'); if (!c) return { err: 'no fab' }
    c.click(); await new Promise(r => setTimeout(r, 3500))
    const p = document.getElementById('wd-games')
    const w = document.getElementById('wg33-wrap')
    const len = w ? w.innerHTML.length : -1
    return { on: p ? p.classList.contains('on') : false, len, hasRetry: !!document.getElementById('wg33-retry') }
  })
  check('olympic hub opens with content (never blank)', oly.on === true && (oly.len > 1000 || oly.hasRetry), JSON.stringify({ on: oly.on, len: oly.len }))
  try { await page.evaluate(() => { const p = document.getElementById('wd-games'); if (p) p.classList.remove('on') }) } catch (e) { }

  // server page opens with content
  const srv = await page.evaluate(async () => {
    const c = document.getElementById('hud-srv'); if (!c) return { err: 'no chip' }
    c.click(); await new Promise(r => setTimeout(r, 2800))
    const p = document.getElementById('wd-srvpage')
    const w = p ? p.querySelector('.wd31-wrap') : null
    return { on: p ? p.classList.contains('on') : false, len: w ? w.innerHTML.length : -1 }
  })
  check('server cinematic page opens with content', srv.on === true && srv.len > 1000, JSON.stringify(srv))

  // wgRefresh fallback code present (blank-mode closed)
  const html = await page.content()
  check('wgRefresh failure now paints visible error card (code marker)', html.includes('دریافت داده‌های المپیک ناموفق بود'), '')
  check('server chip replacement isolated in own try (code marker)', html.includes('خطای FAB نباید جایگزینی چیپ سرور را قربانی کند'), '')
  await ctx.close()
}

// ---------- 2) mobile 360 ----------
{
  const { ctx, page } = await boot(360, 740)
  const s = await page.evaluate(() => {
    const lc = document.querySelector('.leaflet-container')
    return { bg: getComputedStyle(lc).backgroundImage.slice(0, 60), waves: document.getElementById('waves') ? getComputedStyle(document.getElementById('waves')).display : 'absent' }
  })
  check('360px: sea light-blue + waves hidden', s.bg.includes('74, 163, 210') && s.waves === 'none', JSON.stringify(s))
  await ctx.close()
}

// ---------- 3) mobile 430 ----------
{
  const { ctx, page } = await boot(430, 932)
  const s = await page.evaluate(() => {
    const lc = document.querySelector('.leaflet-container')
    const imgs = [...document.querySelectorAll('img.flag')]
    return { bg: getComputedStyle(lc).backgroundImage.slice(0, 60), total: imgs.length, hidden: imgs.filter(i => i.style.display === 'none').length }
  })
  check('430px: sea light-blue', s.bg.includes('74, 163, 210'), s.bg.slice(0, 50))
  check('430px: flags state sane', s.total > 0, `${s.hidden}/${s.total} hidden`)
  await ctx.close()
}

check('zero pageerror across all viewports', errors.length === 0, errors.slice(0, 3).join(' | '))
console.log(`\n== ${pass}/${pass + fail} checks passed ==`)
await browser.close()
process.exit(fail ? 1 : 0)
