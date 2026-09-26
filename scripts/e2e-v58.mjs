// V58 E2E — the user's exact journey, phone viewport, local server on :3210 (OL_OFFSET=0 → games naturally LIVE):
//  1) unowned countries are FULLY gray (saturation 0) — «خاکستری و بی رنگ»
//  2) the buggy front line (yellow dashed) + fire markers NEVER render on partially-occupied countries
//  3) map quality: Hi-DPI canvas patch installed
//  4) اختتامیه → round REALLY ends + ceremony shows the REAL prize strip + podium prizes paid server-side
//  5) افتتاحیه from 'after' → a REAL NEW round (edition+1) starts LIVE immediately, clean table
//  6) ranking: server events move scores immediately (pvp score bump) + live summary replaces the frozen list
// Run: `node scripts/e2e-v58.mjs`
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'

const BASE = process.env.WD_BASE || 'http://127.0.0.1:3210'
const URL = `${BASE}/game/index.html?v=52`
const results = []
const errors = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}
const db = new PrismaClient()

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e)))

const clearOverlays = async () => { try { await page.evaluate(() => {
  const c = document.getElementById('wd33-cer'); if (c) c.classList.remove('on')
  const keep = ['m-admin', 'm-shop', 'm-lobby', 'm-rank']
  document.querySelectorAll('.modal.active').forEach(m => { if (!keep.includes(m.id)) m.classList.remove('active') })
}) } catch (e) {} }

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(4500)

/* ---------- login as Alireza (admin) ---------- */
const login = await page.evaluate(async () => {
  const r = await (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'alireza@wd.test', password: 'wd54e2e-pass' }) })).json()
  return r && r.data && r.data.session ? 'ok' : 'fail'
})
check('login Alireza', login === 'ok')
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
await clearOverlays()

/* ---------- my territories: capital France + Germany; partial occupation on Mongolia (the user's country) ---------- */
await page.evaluate(() => { try {
  restoreState({ my: 'France', conq: ['France', 'Germany'], occ: { Mongolia: 37 }, ovr: {}, res: { gold: 5000, food: 2000, oil: 2000 }, infra: {}, units: {} })
} catch (e) {} })
await page.waitForTimeout(3500)

/* ---- 1) unowned countries fully gray ---- */
const gray = await page.evaluate(() => {
  const st = (typeof baseStyle === 'function') ? baseStyle('Mongolia') : null
  if (!st) return null
  const m = /hsl\(0,\s?0%,/.test(st.fillColor)
  return { fillColor: st.fillColor, sat0: m, smooth: st.smoothFactor }
})
check('baseStyle: unowned = pure gray (saturation 0)', !!gray && gray.sat0, gray && JSON.stringify(gray))
check('baseStyle: smoothFactor lowered for sharper coasts', !!gray && gray.smooth <= 0.6, gray && String(gray.smooth))

/* ---- 2) the buggy front line + flames are gone (Mongolia has 37% occupation) ---- */
await page.waitForTimeout(1500)
const lines = await page.evaluate(() => ({
  front: document.querySelectorAll('.frontln').length,
  flames: document.querySelectorAll('.ffx').length,
  hatchN: (typeof hatchL !== 'undefined') ? Object.keys(hatchL).length : -1,
  hatchCur: (typeof hs !== 'undefined' && hs.Mongolia) ? hs.Mongolia.cur : null,
}))
check('no buggy front line on partially-occupied countries', lines.front === 0, JSON.stringify(lines))
check('no fire/soldier markers on the map', lines.flames === 0, JSON.stringify(lines))
check('occupation hatch still shows progress (info kept)', lines.hatchN >= 1 && lines.hatchCur > 0, JSON.stringify(lines))

/* ---- 3) map canvas: stock retina renderer (V58b root-cause fix kept) ----
   V58's Hi-DPI override (__wd58) rebuilt ctx transform and DISPLACED the whole map on
   DPR>2.05 phones (ghost countries in open ocean) — V58b removed it deliberately.
   This check is now the regression GUARD: the override must STAY removed. */
const hidpi = await page.evaluate(() => !!(window.L && L.Canvas && L.Canvas.prototype) && !L.Canvas.prototype.__wd58)
check('stock retina canvas renderer kept (V58b: broken Hi-DPI override stays removed)', hidpi)

/* ---- 4) ranking modal: live summary replaces the frozen static list ---- */
await page.evaluate(() => { const b = document.getElementById('btn-m-rank'); if (b) b.click() })
await page.waitForTimeout(3500)
const rankTxt = await page.evaluate(() => {
  const w = document.getElementById('world-rank')
  return w ? w.textContent : ''
})
check('rank modal shows LIVE server summary', /خلاصه‌ی زنده‌ی سرور/.test(rankTxt || ''), (rankTxt || '').slice(0, 44))
check('rank modal static frozen rows are gone', !/دفاع:/.test(rankTxt || ''), '')
await clearOverlays()

/* ---- 6a) ranking reacts to server events INSTANTLY: pvp score bump ----
   olympic truce is on (games live) → temporarily disable olympic, attack, re-enable */
const ed0 = await page.evaluate(() => (window.WD33_PHASE ? window.WD33_PHASE().edition : 0))
const scBefore = await db.score.findFirst({ where: { nick: 'Alireza' } })
let bumped = false
{
  await page.evaluate(async () => { await sb.rpc('event_switch_set', { p_key: 'olympic', p_on: false }) })
  await page.waitForTimeout(1200)
  for (let i = 0; i < 6 && !bumped; i++) {
    bumped = await page.evaluate(async (c) => {
      try {
        const r = await sb.rpc('pvp_attack', { p_server: 1, p_country: c, p_attack: 99999 })
        const x = r && r.data
        return !!(x && x.ok && x.captured)
      } catch (e) { return false }
    }, 'Mongolia')
    await page.waitForTimeout(600)
  }
  await page.evaluate(async () => { await sb.rpc('event_switch_set', { p_key: 'olympic', p_on: true }) })
  await page.waitForTimeout(800)
}
const scAfter = await db.score.findFirst({ where: { nick: 'Alireza' } })
check('pvp win moves the ranking score INSTANTLY (server-side bump)',
  bumped && scAfter.conquered === scBefore.conquered + 1 && scAfter.score === scBefore.score + 1000,
  `win=${bumped} conq ${scBefore.conquered}→${scAfter.conquered} score ${scBefore.score}→${scAfter.score}`)

/* ---- 5) admin: اختتامیه → round ends + full podium prizes ---- */
await page.evaluate(() => { const b = document.getElementById('btn-m-admin'); if (b) b.click() })
let olyBoxShown = true
try { await page.waitForSelector('#wd53-olybox', { timeout: 15000 }) } catch (e) { olyBoxShown = false }
check('admin olympic box opens (login-dependent: needs seeded admin)', olyBoxShown, olyBoxShown ? '' : 'env without seeded Alireza — downstream checks degrade')
await page.waitForTimeout(2500)

const ed = ed0
check('edition resolved client-side', ed > 0, 'edition=' + ed)

await page.evaluate(() => { const b = document.getElementById('wd53-olyclose'); if (b && !b.disabled) b.click() })
await page.waitForTimeout(3000)

const srvPhase = await page.evaluate(async () => {
  const r = await (await fetch('/api/rpc/olympic_status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_server: 1 }) })).json()
  return r && r.data && r.data.games ? r.data.games.phase : null
})
check('server phase → after (round REALLY ended)', srvPhase === 'after', String(srvPhase))

/* ceremony plays + REAL prize strip */
let cerOn = false
for (let i = 0; i < 8; i++) {
  cerOn = await page.evaluate(() => { const c = document.getElementById('wd33-cer'); return !!(c && c.classList.contains('on')) })
  if (cerOn) break
  await page.waitForTimeout(700)
}
check('closing ceremony plays immediately', cerOn)
let rew = null
for (let i = 0; i < 6; i++) {
  rew = await page.evaluate(() => { const d = document.getElementById('wd58-rewards'); return d ? d.textContent : null })
  if (rew) break
  await page.waitForTimeout(600)
}
check('ceremony shows the REAL prize strip (gold/silver/bronze/participants)', !!rew && /جوایز این دوره واریز شد/.test(rew) && /نقره/.test(rew) && /برنز/.test(rew), rew ? rew.slice(0, 60).replace(/\s+/g, ' ') : 'missing')
if (cerOn) await page.screenshot({ path: '/home/z/my-project/upload/v58-ceremony-rewards.png' })
await clearOverlays()

/* ---- open button now offers a REAL NEW ROUND ---- */
await page.evaluate(() => { const b = document.getElementById('btn-m-admin'); if (b) b.click() })
try { await page.waitForSelector('#wd53-olybox', { timeout: 15000 }) } catch (e) { }
await page.waitForTimeout(2500)
const openState = await page.evaluate(() => {
  const b = document.getElementById('wd53-olyopen')
  return b ? { disabled: b.disabled, txt: b.textContent } : null
})
check('open button ENABLED in after phase (new-round affordance)', !!openState && !openState.disabled, openState && openState.txt)
check('open button labeled as NEW ROUND', !!openState && /شروع دور جدید/.test(openState.txt), openState && openState.txt)

await page.evaluate(() => { const b = document.getElementById('wd53-olyopen'); if (b && !b.disabled) b.click() })
await page.waitForTimeout(3000)

const newRound = await page.evaluate(async () => {
  const r = await (await fetch('/api/rpc/olympic_status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_server: 1 }) })).json()
  return r && r.data && r.data.games ? { phase: r.data.games.phase, edition: r.data.games.edition } : null
})
check('NEW ROUND live: phase=live', !!newRound && newRound.phase === 'live', JSON.stringify(newRound))
check('NEW ROUND live: edition bumped ' + ed + '→' + (newRound && newRound.edition), !!newRound && newRound.edition === ed + 1, '')

await page.screenshot({ path: '/home/z/my-project/upload/v58-new-round.png' })
await browser.close()

/* ---------- server-truth assertions (Node/Prisma) ---------- */
const uA = await db.user.findUnique({ where: { email: 'alireza@wd.test' } })
const uB = await db.user.findUnique({ where: { email: 'bot@wd.test' } })
const uC = await db.user.findUnique({ where: { email: 'bot2@wd.test' } })
const wA = await db.wallet.findUnique({ where: { userId: uA.id } })
const wB = await db.wallet.findUnique({ where: { userId: uB.id } })
const wC = await db.wallet.findUnique({ where: { userId: uC.id } })
check('champion prize paid (Alireza 100→107💎)', wA.gems === 107, String(wA.gems))
check('silver prize paid (BotOne 50→55💎)', wB.gems === 55, String(wB.gems))
check('bronze prize paid (BotTwo 25→29💎)', wC.gems === 29, String(wC.gems))
const freshRows = await db.olympicResult.count({ where: { edition: ed + 1 } })
check('new round starts with a clean medal table', freshRows === 0, 'rows=' + freshRows)
const arch = await db.olympicArchive.findUnique({ where: { edition: ed } })
check('closed edition archived with champion', !!arch && arch.championNick === 'Alireza', arch && arch.championNick)

await db.$disconnect()
const failed = results.filter(r => !r.ok)
console.log(`\n== ${results.length - failed.length}/${results.length} checks passed ==`)
if (errors.length) console.log('pageerrors:', errors.slice(0, 3).join(' | '))
process.exit(failed.length || errors.length ? 1 : 0)
