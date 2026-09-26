// lowfx visibility harness (V64) — the permanent guard for the "empty page" bug family.
// Bug: .wd31-rise had base opacity:0; body.wd-lowfx killed its animation → ALL page content
//      stayed invisible on low-end phones (both reported pages blank). Plus wgRefresh's
//      silent no-auth return → olympic hub literally empty for logged-out sessions.
// Guard: real VISIBILITY assertions (computed opacity/rect/text) in BOTH fx modes:
//   A) lowfx ON  (user phone parity: cores≤4 or mem≤4 → auto lowfx) → pages must be visible,
//      olympic hub must never be fully empty (real hub OR hubNotice login/error card)
//   B) lowfx OFF (control) → pages visible with content (visual parity with pre-V64 healthy devices)
// Works logged-out (hub shows the V64 login card) — safe for LIVE runs.
// Usage: node scripts/lowfx-visibility.mjs   (WD_BASE defaults to local dev :3000)
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = process.env.WD_BASE || 'http://localhost:3000'
const URL = BASE + '/game/index.html'
const SHOTS = '/home/z/my-project/scripts/diag-shots'
fs.mkdirSync(SHOTS, { recursive: true })

let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }

const browser = await chromium.launch({ headless: true })

async function probe(fxMode, tag) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)))
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => typeof window.WD31_OLYMPICS === 'function' && typeof window.WD60_FX === 'object', null, { timeout: 60000 })
  await page.evaluate(m => { try { localStorage.setItem('wdLowFx', m); window.WD60_FX.apply() } catch (e) {} }, fxMode)
  const lowfx = await page.evaluate(() => window.WD60_FX.on())
  const out = { tag, lowfx, errors, pages: {} }
  for (const [name, openFn, pageSel, wrapSel] of [
    ['olympics', 'window.WD31_OLYMPICS()', '#wd-games', '#wg33-wrap'],
    ['server', 'window.WD31_SERVER()', '#wd-srvpage', '#wd-srvpage .wd31-wrap'],
  ]) {
    await page.evaluate(openFn)
    await page.waitForTimeout(1800)
    out.pages[name] = await page.evaluate(({ pageSel, wrapSel }) => {
      const pg = document.querySelector(pageSel)
      const w = pg && pg.querySelector(wrapSel)
      if (!pg || !w) return { open: !!pg, vis: 0, kids: 0, chars: 0 }
      const kids = [...w.children]
      let vis = 0
      for (const k of kids) {
        const cs = getComputedStyle(k)
        const r = k.getBoundingClientRect()
        if (cs.opacity !== '0' && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && k.textContent.trim().length > 0) vis++
      }
      return { open: pg.classList.contains('on'), vis, kids: kids.length, chars: w.textContent.length }
    }, { pageSel, wrapSel })
    await page.screenshot({ path: `${SHOTS}/lowfx-${tag}-${name}.png` })
    await page.evaluate(sel => { const p = document.querySelector(sel); if (p) p.classList.remove('on') }, pageSel)
  }
  await ctx.close()
  return out
}

const A = await probe('on', 'on')   // user reality
const B = await probe('off', 'off') // control

check('A: lowfx forced ON (user phone parity)', A.lowfx === true, JSON.stringify(A.lowfx))
check('A: server page opens + content VISIBLE under lowfx', A.pages.server.open && A.pages.server.vis > 0 && A.pages.server.chars > 1000, JSON.stringify(A.pages.server))
check('A: olympic hub opens + NEVER blank under lowfx (hub or notice card visible)', A.pages.olympics.open && A.pages.olympics.vis > 0, JSON.stringify(A.pages.olympics))
check('B: control (lowfx OFF) server page visible with content', B.pages.server.open && B.pages.server.vis > 0 && B.pages.server.chars > 1000, JSON.stringify(B.pages.server))
check('B: control (lowfx OFF) olympic hub visible (not blank)', B.pages.olympics.open && B.pages.olympics.vis > 0, JSON.stringify(B.pages.olympics))
check('zero pageerror in both contexts', A.errors.length === 0 && B.errors.length === 0, (A.errors.concat(B.errors)).slice(0, 3).join(' | '))

console.log(`\n== ${pass}/${pass + fail} ==`)
await browser.close()
process.exit(fail ? 1 : 0)
