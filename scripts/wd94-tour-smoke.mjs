// U4 smoke: tour mount + chip + data-driven advisor card + zero pageerrors (pre-login JS surface)
import { chromium } from 'playwright'
const B = process.env.WD_BASE || 'http://localhost:3000'
let ok = 0, fail = 0
const check = (n, c, d) => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + (d || '')) } }
const br = await chromium.launch()
const ctx = await br.newContext()
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)))
await page.goto(B + '/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(4000)
check('tour exposed (WD_TOUR_V1)', await page.evaluate(() => !!(window.WD_TOUR_V1 && window.WD_TOUR_V1.total === 5)))
check('tour chip mounted', !!(await page.$('#wd-tour-chip')))
check('chip text = first step', await page.evaluate(() => (document.getElementById('wd-tour-chip') || {}).textContent || '').then(t => /انتخاب پایتخت/.test(t)))
check('modal hook registered', await page.evaluate(() => typeof window.WD_LIVE_ADVICE === 'function'))
await page.evaluate(() => { try { window.WD_LIVE_ADVICE() } catch (e) {} })
await page.waitForTimeout(300)
check('live-advice card from REAL data', !!(await page.$('#wd-live-advice')))
const hasCapLine = await page.evaluate(() => (document.getElementById('wd-live-advice') || {}).textContent || '').then(t => /پایتخت/.test(t))
check('advisor line references real capital state', hasCapLine)
check('zero pageerrors', errs.length === 0, errs.join(' | '))
await br.close()
console.log('RESULT ' + ok + ' pass, ' + fail + ' fail')
process.exit(fail ? 1 : 0)
