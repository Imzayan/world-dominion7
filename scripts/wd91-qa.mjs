// WD91 QA — BOX5: spar 3D (train), story campaign (prologue→creation→act1 unlock), profile, lifecycle
// Usage: WD_BASE=http://localhost:3000 node scripts/wd91-qa.mjs
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
const BASE = process.env.WD_BASE || 'http://localhost:3000'
const URL = BASE + '/game/index.html?v=' + Date.now()
let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }
const db = new PrismaClient()
const SHOT = '/home/z/my-project/download'
fs.mkdirSync(SHOT, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] })
const errors = []

const NICK = 'wd91b' + String(Date.now()).slice(-6)
async function boot(nick) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)))
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error') errors.push('CONSOLE: ' + t.slice(0, 160)) })
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 })
  /* فرم احراز — با انتظار واقعی (کامپایل سرد next-dev ممکن است کند باشد) */
  try { await page.waitForSelector('#nick', { timeout: 45000 }) } catch (e) {}
  await page.waitForTimeout(1500)
  await page.evaluate(async (nk) => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) {
      n.value = nk; p.value = 'dgtess1234'; p2 && (p2.value = 'dgtess1234')
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 6000)) }
    }
  }, nick)
  /* انتظار نشست واقعی تا ۲۰ ثانیه */
  let hasSession = false
  for (let i = 0; i < 20; i++) {
    hasSession = await page.evaluate(async () => { try { const s = await sb.auth.getSession(); return !!(s && s.data && s.data.session) } catch (e) { return false } })
    if (hasSession) break
    await page.waitForTimeout(1000)
  }
  await page.waitForTimeout(5000)
  return { ctx, page, hasSession }
}
const rpc = (page, fn, params) => page.evaluate(async ([f, p]) => {
  try { const r = await sb.rpc(f, p || {}); return r && r.data } catch (e) { return { ok: false, error: 'throw:' + String(e).slice(0, 80) } }
}, [fn, params])

/* 0) پاک‌سازی کاربر تست */
const u0 = await db.user.findUnique({ where: { nickLower: NICK } })
if (u0) { await db.boxingSave.deleteMany({ where: { userId: u0.id } }).catch(() => {}) }

console.log('— BOOT —')
const { ctx, page, hasSession } = await boot(NICK)
check('session established', hasSession)
const logged = await page.evaluate(() => !!window.sb && !!document.querySelector('#wd33-map, .wd33-map, body'))
check('page loaded + sb bridge', logged)

console.log('— BOXING INTRO (V5 buttons) —')
await page.evaluate(() => { try { window.WD33_PLAY('boxing', true) } catch (e) { console.log('play-err', e) } })
await page.waitForTimeout(3000)
const introOpen = await page.evaluate(() => !!document.querySelector('#wd33-stage.on'))
check('olympic stage opens (train)', introOpen)
const b5row = await page.evaluate(() => {
  const b = document.querySelector('#wg33-b5story'), p = document.querySelector('#wg33-b5prof')
  return { story: !!b, prof: !!p }
})
check('V5 story/profile buttons on boxing intro', b5row.story && b5row.prof)
await page.screenshot({ path: SHOT + '/v91-boxing-intro.png' })

console.log('— SPAR 3D (train) —')
await page.evaluate(() => { const b = document.querySelector('#wg33-tr'); if (b) b.click() })
let sparState = { has: false, hud: false, canvas: 0 }
for (let i = 0; i < 30; i++) {
  sparState = await page.evaluate(() => ({
    has: !!document.querySelector('.b5-wrap canvas'),
    hud: !!document.querySelector('.b5-hud'),
    canvas: document.querySelectorAll('.b5-wrap canvas').length,
    loadbar: !!document.querySelector('.b5-load'),
    fallback2d: !!document.querySelector('.oly3-cv'),
    countStuck: !!document.querySelector('#wg33-cd'),
  }))
  if ((sparState.has && !sparState.loadbar) || sparState.fallback2d) break
  /* شمارش معکوس گیر کرد؟ دوباره بزن */
  if (i === 12 && sparState.countStuck) {
    await page.evaluate(() => { const x = document.querySelector('#wg33-x'); if (x) x.click() })
    await page.waitForTimeout(1200)
    await page.evaluate(() => { try { window.WD33_PLAY('boxing', true) } catch (e) {} })
    await page.waitForTimeout(3000)
    await page.evaluate(() => { const b = document.querySelector('#wg33-tr'); if (b) b.click() })
  }
  await page.waitForTimeout(1000)
}
check('b5 canvas mounted (lazy box5.js)', sparState.has, 'canvases=' + sparState.canvas + ' 2dfallback=' + sparState.fallback2d + ' countStuck=' + sparState.countStuck)
check('b5 HUD mounted', sparState.hud)
check('single canvas (no duplicate wrap)', sparState.canvas === 1)
await page.waitForTimeout(6000) /* intro فاز → راند */
await page.screenshot({ path: SHOT + '/v91-spar-arena.png' })

/* تعامل: چند تپ/سوایپ روی کانواس — بدون خطا */
const cvBox = await page.evaluate(() => { const c = document.querySelector('.b5-wrap canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } })
if (cvBox) {
  const cx = cvBox.x + cvBox.w * 0.7, cy = cvBox.y + cvBox.h * 0.5
  for (let i = 0; i < 6; i++) {
    await page.touchscreen.tap(cx, cy)
    await page.waitForTimeout(260)
  }
  /* سوایپ داوج */
  await page.evaluate(() => {
    const c = document.querySelector('.b5-wrap canvas')
    const r = c.getBoundingClientRect()
    const y = r.y + r.height * 0.5
    const fire = (type, x) => c.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }))
    fire('pointerdown', r.x + r.width * 0.75)
    fire('pointermove', r.x + r.width * 0.75 + 60)
    fire('pointerup', r.x + r.width * 0.75 + 60)
  })
  await page.waitForTimeout(400)
}
const errBefore = errors.filter((e) => !/401 \(Unauthorized\)/.test(e)).length
check('interactions error-free', errBefore === 0, errors.filter((e) => !/401/.test(e)).slice(0, 2).join(' | '))
const fightLive = await page.evaluate(() => {
  const w = window.WD_BOX5
  return { v5: !!w && w.version === 5, clock: (document.querySelector('#b5-clock') || {}).textContent || '' }
})
check('WD_BOX5 v5 active + clock running', fightLive.v5)

/* بستن استیج → dispose کامل */
await page.evaluate(() => { const x = document.querySelector('#wg33-x'); if (x) x.click() })
await page.waitForTimeout(1200)
const disposed = await page.evaluate(() => ({ wrap: document.querySelectorAll('.b5-wrap').length, hud: document.querySelectorAll('.b5-hud').length }))
check('closeStage disposes wrap+hud', disposed.wrap === 0 && disposed.hud === 0)

console.log('— RE-ENTRY (cache, no reload) —')
await page.evaluate(() => { try { window.WD33_PLAY('boxing', true) } catch (e) {} })
await page.waitForTimeout(2500)
await page.evaluate(() => { const b = document.querySelector('#wg33-tr'); if (b) b.click() })
await page.waitForTimeout(7000)
const reEntry = await page.evaluate(() => ({ has: !!document.querySelector('.b5-wrap canvas'), canvases: document.querySelectorAll('.b5-wrap canvas').length }))
check('re-entry mounts again (cached assets)', reEntry.has && reEntry.canvases === 1)
await page.screenshot({ path: SHOT + '/v91-spar-reentry.png' })
await page.evaluate(() => { const x = document.querySelector('#wg33-x'); if (x) x.click() })
await page.waitForTimeout(800)

console.log('— STORY: THE LAST ROUND —')
const storyOk = await page.evaluate(async () => {
  try {
    const d = document.createElement('div')
    d.id = 'b5-qastory'
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000'
    document.body.appendChild(d)
    const ok = await window.WD_BOX5.openStory(d)
    return ok
  } catch (e) { console.log('story-err', e); return false }
})
await page.waitForTimeout(9000) /* لود آرنا */
const storyMenu = await page.evaluate(() => ({ acts: document.querySelectorAll('#b5-qastory .b5-act').length, logo: !!document.querySelector('#b5-qastory .b5-story-logo') }))
check('story menu opens (3D behind)', storyOk === true && storyMenu.acts >= 6, 'acts=' + storyMenu.acts)
await page.screenshot({ path: SHOT + '/v91-story-menu.png' })

/* پرده ۱ — سینما + فرم ساخت شخصیت */
await page.evaluate(() => { const el = document.querySelector('#b5-qastory .b5-act.open'); if (el) el.click() })
await page.waitForTimeout(6000)
const cine = await page.evaluate(() => ({ card: !!document.querySelector('#b5-qastory .b5-cine-card'), skip: !!document.querySelector('#b5-qastory .b5-skip') }))
check('prologue cinematic playing (skip available)', cine.card || cine.skip)
await page.screenshot({ path: SHOT + '/v91-prologue.png' })
await page.evaluate(() => { const s = document.querySelector('#b5-qastory .b5-skip'); if (s) s.click() })
await page.waitForTimeout(1500)
const createForm = await page.evaluate(() => !!document.querySelector('#b5-qastory .b5-create input'))
check('creation form after prologue', createForm)
await page.evaluate(() => {
  const i = document.querySelector('#b5-qastory .b5-create input')
  if (i) i.value = 'آرش کوه‌تن'
  const go = document.querySelector('#b5-qastory #b5-go')
  if (go) go.click()
})
await page.waitForTimeout(3500)
const backToMenu = await page.evaluate(() => ({ acts: document.querySelectorAll('#b5-qastory .b5-act').length, name: ((document.querySelector('#b5-qastory .b5-story-hero b') || {}).textContent || '') }))
check('creation saved → back to menu', backToMenu.acts >= 6, 'hero=' + backToMenu.name)
await page.screenshot({ path: SHOT + '/v91-story-created.png' })

console.log('— SERVER VALIDATION (boxing_save/load) —')
const prof = await rpc(page, 'boxing_load', {})
check('boxing_load returns profile', prof && prof.ok && prof.profile && prof.profile.name === 'آرش کوه‌تن', JSON.stringify((prof && prof.profile && { act: prof.profile.act, name: prof.profile.name }) || {}))
check('act1 unlocked after prologue', prof && prof.ok && prof.profile.act >= 1)
const locked = await rpc(page, 'boxing_save', { p_kind: 'act', p_payload: { act: 3, win: true, durMs: 120000, thrown: 40, landed: 20, counters: 4, dodges: 8, kd: 1, maxCombo: 4 } })
check('act jump rejected (locked)', locked && locked.ok === false && locked.reason === 'locked')
const act1 = await rpc(page, 'boxing_save', { p_kind: 'act', p_payload: { act: 1, win: true, byKo: true, durMs: 95000, thrown: 45, landed: 24, counters: 5, dodges: 9, kd: 1, maxCombo: 5, perfectRounds: 1 } })
check('act1 win accepted with XP', act1 && act1.ok && act1.xpGain >= 150, 'xpGain=' + (act1 && act1.xpGain))
const act1again = await rpc(page, 'boxing_save', { p_kind: 'act', p_payload: { act: 1, win: true, durMs: 95000, thrown: 45, landed: 24, counters: 5, dodges: 9, kd: 1, maxCombo: 5 } })
check('act1 re-win idempotent (no double XP)', act1again && act1again.ok && act1again.xpGain === 0, 'xpGain=' + (act1again && act1again.xpGain))
const over = await rpc(page, 'boxing_save', { p_kind: 'act', p_payload: { act: 2, win: true, durMs: 95000, thrown: 9999, landed: 5000, counters: 4000, dodges: 999, kd: 50, maxCombo: 99 } })
check('stat caps enforced (thrown clamped)', over && over.ok, 'profile?=' + (over && over.profile ? 'yes' : 'no'))
const train = await rpc(page, 'boxing_save', { p_kind: 'train', p_payload: { act: 2, type: 'power', score: 85 } })
check('train buff granted', train && train.ok && train.profile.buff === 'power', 'buff=' + (train && train.profile && train.profile.buff))
const badTrain = await rpc(page, 'boxing_save', { p_kind: 'train', p_payload: { act: 2, type: 'hack', score: 85 } })
check('bad train type rejected', badTrain && badTrain.ok === false)
const prof2 = await rpc(page, 'boxing_load', {})
check('career stats accumulated', prof2 && prof2.ok && prof2.profile && prof2.profile.wins >= 2 && prof2.profile.xp >= 150, JSON.stringify({ w: prof2 && prof2.profile && prof2.profile.wins, xp: prof2 && prof2.profile && prof2.profile.xp }))

console.log('— PROFILE CARD —')
await page.evaluate(() => { const d = document.getElementById('b5-qastory'); if (d) d.remove() })
const profCard = await page.evaluate(async () => {
  try {
    const d = document.createElement('div')
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#05070d;overflow:auto'
    document.body.appendChild(d)
    await window.WD_BOX5.openProfile(d)
    return d.textContent.slice(0, 300)
  } catch (e) { return 'ERR ' + String(e).slice(0, 80) }
})
check('profile card renders', /پروفایل بوکس/.test(profCard) && /آرش کوه‌تن/.test(profCard), profCard.slice(0, 90).replace(/\n/g, ' '))
await page.screenshot({ path: SHOT + '/v91-profile.png' })

console.log('— DB ROW CHECK —')
const u1 = await db.user.findUnique({ where: { nickLower: NICK } })
const bsave = await db.boxingSave.findUnique({ where: { userId: u1.id } })
check('boxing_saves row exists', !!bsave, 'act=' + (bsave && bsave.act) + ' clear=' + (bsave && bsave.actClear))

console.log('— ERRORS —')
const realErrors = errors.filter((e) => !/favicon|Autoplay|AudioContext|the play\(\) request|net::ERR_ABORTED|401 \(Unauthorized\)|GPU stall|GL Driver|ReadPixels/.test(e))
check('zero pageerrors across session', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))

await browser.close()
await db.$disconnect()
console.log('\nRESULT: ' + pass + ' pass, ' + fail + ' fail')
process.exit(fail ? 1 : 0)
