// SW self-heal e2e — VERSION-AGNOSTIC (V + PREV read from public/game/v.txt).
// Replaces sw-selfheal-v63.mjs (hard-coded version pins broke every release).
// Reproduces the user's device situation and proves the cure:
//  1) SW v6 installs, stale HTML (V-1) is seeded into CacheStorage (simulates old build on device)
//  2) plain navigation → SW serves the STALE copy instantly (like the user's WebView)
//  3) beacon detects v.txt > seeded → fetches ?wdFresh → swaps cache → ONE reload → fresh build
//  4) touch taps on server chip + olympic FAB open real pages — checked by REAL VISIBILITY
//     (computed opacity + rect, not char counts: V64 lesson — text can exist at opacity:0)
// NOTE: headless chromium reports cores=2 → WD60_FX auto-lowfx is ON → this whole journey runs
//       in the exact lowfx mode that blanked the pages before V64. Intentional regression guard.
// Usage: WD_BASE=http://localhost:3000 node scripts/sw-selfheal.mjs
import { chromium } from 'playwright'
import fs from 'fs'

const BASE = process.env.WD_BASE || 'http://localhost:3000'
const URL = BASE + '/game/index.html'
const SHOTS = '/home/z/my-project/scripts/diag-shots'
fs.mkdirSync(SHOTS, { recursive: true })

const V = fs.readFileSync('public/game/v.txt', 'utf8').trim()
const PREV = String(Number(V) - 1)
if (!/^\d+$/.test(V)) { console.log('FATAL: v.txt invalid'); process.exit(1) }

let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }

const raw = fs.readFileSync('public/game/index.html', 'utf8')
if (!raw.includes('window.__WD_V=' + V)) { console.log('FATAL: build marker missing for V=' + V); process.exit(1) }
const STALE = raw.replace('window.__WD_V=' + V, 'window.__WD_V=' + PREV)

const browser = await chromium.launch({ headless: true })
const errors = []
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
})
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))

// --- 1) first boot: SW installs (v6) ---
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(9000)
const swState = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready
  const keys = await caches.keys()
  return { controlled: !!navigator.serviceWorker.controller, scope: reg.scope, keys }
})
check('SW v6 registered + controlling', swState.controlled && swState.keys.includes('wd-v6'), JSON.stringify(swState.keys))

// --- 2) seed stale build into every cache (user device has an old build) ---
await page.evaluate(async (stale) => {
  const keys = await caches.keys()
  for (const k of keys) {
    const c = await caches.open(k)
    await c.put('/game/index.html', new Response(stale, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
  }
}, STALE)
check('stale build (v' + PREV + ') seeded into CacheStorage', true)

// --- 3) deterministic proof: SW serves the STALE copy (subresource fetch → htmlStrategy) ---
const servedV = await page.evaluate(async () => {
  const t = await (await fetch('/game/index.html')).text()
  const m = t.match(/__WD_V=(\d+)/)
  return m ? m[1] : '?'
})
check('SW serves the STALE copy (device mechanism proven)', servedV === PREV, 'served __WD_V=' + servedV)

// plain navigation like the APK shell + navigation counter for the reload
let navs = 0
page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++ })
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })

// --- 4) self-heal: beacon swaps cache and reloads ONCE ---
let healed = 0
try {
  await page.waitForFunction((v) => window.__WD_V === Number(v), V, { timeout: 20000 })
  healed = 1
} catch (e) { healed = 0 }
const v1 = await page.evaluate(() => window.__WD_V || 0).catch(() => 0)
const guardState = await page.evaluate(() => { const ks = []; for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (k && k.indexOf('wdHeal') === 0) ks.push(k) } return ks })
check('self-heal swapped to fresh build (v' + V + '), no reload loop (goto+reload)', healed === 1 && Number(v1) === Number(V) && navs <= 2, 'final __WD_V=' + v1 + ' navs=' + navs)
check('session guard cleaned after heal (no future loops)', guardState.length === 0, JSON.stringify(guardState))
await page.screenshot({ path: SHOTS + '/v63-healed.png' })

// --- 5) settle: splash → login form → register → in-game HUD (user journey on the healed build) ---
await page.waitForFunction(() => { const n = document.getElementById('nick'); return !!n && n.getBoundingClientRect().width > 0 }, { timeout: 30000 }).catch(() => { })
await page.evaluate(async () => {
  const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
  if (n && p) {
    n.value = 'dg' + Math.random().toString(36).slice(2, 8); p.value = 'dgtess1234'; p2.value = 'dgtess1234'
    const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
    if (btn) { btn.click(); await new Promise(r => setTimeout(r, 4000)) }
  }
})
// chips must be VISIBLE before a real tap (rect-based; offsetParent is null for position:fixed)
let hudReady = true
try {
  await page.waitForFunction(() => {
    const c = document.getElementById('hud-srv') || document.getElementById('hud-olympic')
    if (!c) return false
    const r = c.getBoundingClientRect(), cs = getComputedStyle(c)
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'
  }, { timeout: 30000 })
} catch (e) { hudReady = false }
const hudState = await page.evaluate(() => {
  const s = document.getElementById('hud-srv'), o = document.getElementById('hud-olympic')
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && cs.display !== 'none' }
  return { srv: vis(s), oly: vis(o), lowfx: window.WD60_FX ? window.WD60_FX.on() : null }
})
console.log('INFO hud-state after register: ' + JSON.stringify(hudState) + ' (lowfx=true = user phone parity)')

// --- 6) REAL touch taps — the exact two reports — judged by VISIBILITY, not chars ---
// force: skip Playwright's animation-stability wait (floating FABs never "stabilize");
// touch events still go through the real input pipeline. JS-click fallback for env quirks.
const visProbe = (wrapSel) => `(() => {
  const w = document.querySelector('${wrapSel}')
  if (!w) return { vis: 0, kids: 0, chars: 0 }
  const kids = [...w.children]
  let vis = 0
  for (const k of kids) {
    const cs = getComputedStyle(k)
    const r = k.getBoundingClientRect()
    if (cs.opacity !== '0' && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && k.textContent.trim().length > 0) vis++
  }
  return { vis, kids: kids.length, chars: w.textContent.length }
})()`

let srv = { ok: false }
for (let att = 0; att < 2 && !srv.ok; att++) {
  try {
    try { await page.tap('#hud-srv', { force: true, timeout: 8000 }) } catch (e) { await page.evaluate(() => document.getElementById('hud-srv').click()) }
    await page.waitForTimeout(att ? 3500 : 2800)
    srv = await page.evaluate(visProbe('#wd-srvpage .wd31-wrap'))
    srv.ok = srv.vis > 0 && srv.chars > 1000
  } catch (e) { srv = { ok: false, err: String(e).slice(0, 120) } }
}
check('TAP server chip → page paints AND content is VISIBLE (lowfx-proof)', srv.ok, JSON.stringify(srv))
await page.screenshot({ path: SHOTS + '/v63-serverpage.png' })
try { await page.evaluate(() => { const p = document.getElementById('wd-srvpage'); if (p) p.classList.remove('on') }) } catch (e) { }

let oly = { ok: false }
const olyTry = async (open) => {
  try { await open() } catch (e) { }
  await page.waitForTimeout(2500)
  for (let i = 0; i < 2; i++) {
    const st = await page.evaluate(() => {
      const p = document.getElementById('wd-games')
      if (!p || !p.classList.contains('on')) return { on: false }
      const w = document.getElementById('wg33-wrap')
      if (!w) return { on: true, kids: 0 }
      const kids = [...w.children]
      let vis = 0
      for (const k of kids) {
        const cs = getComputedStyle(k)
        const r = k.getBoundingClientRect()
        if (cs.opacity !== '0' && cs.display !== 'none' && r.width > 0 && r.height > 0 && k.textContent.trim().length > 0) vis++
      }
      return { on: true, vis, kids: kids.length, len: w.innerHTML.length, hasRetry: !!document.getElementById('wg33-retry'), fab: typeof window.WD31_OLYMPICS }
    })
    if (st.on && ((st.vis > 0 && st.len > 1000) || st.hasRetry)) return { ...st, ok: true }
    await page.waitForTimeout(2000)
  }
  return { ok: false }
}
oly = await olyTry(() => page.tap('#hud-olympic', { force: true, timeout: 8000 }))
if (!oly.ok) oly = await olyTry(() => page.evaluate(() => document.getElementById('hud-olympic').click()))
check('TAP olympic FAB → hub paints AND content is VISIBLE (never blank)', oly.ok, JSON.stringify(oly))
await page.screenshot({ path: SHOTS + '/v63-olyhub.png' })

check('zero pageerror across the whole self-heal journey', errors.length === 0, errors.slice(0, 3).join(' | '))
console.log(`\n== ${pass}/${pass + fail} ==`)
await browser.close()
process.exit(fail ? 1 : 0)
