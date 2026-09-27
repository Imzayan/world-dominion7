// V65 feature harness — Living World (empire/glory/war-plan/chip/news/server-RPCs)
// Run: node scripts/feature-v65.mjs   (dev server on :3000, DATABASE_URL set)
import { chromium } from 'playwright'
import { pseudoEmail } from './pseudo-email.mjs'
const __ALI_EM = pseudoEmail('Alireza') /* V68: محاسبه در Node — داخل evaluate در دسترس نیست */

const BASE = process.env.WD_BASE || 'http://127.0.0.1:3000'
const URL = `${BASE}/game/index.html`
const results = []
const errors = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 160) : ''}`)
}

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e)))

const waitVisible = async (expr, ms = 9000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const v = await page.evaluate(expr).catch(() => null)
    if (v) return v
    await page.waitForTimeout(300)
  }
  return null
}

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(4000)

let login = 'fail'
for (let attempt = 0; attempt < 3; attempt++) { /* V68: ضد ریس self-heal reload / 429 — ۳ تلاش با فاصله */
  try {
    login = await page.evaluate(async (em) => {
      const r = await (await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: em, password: 'wd54e2e-pass' }) })).json()
      return r && r.data && r.data.session ? 'ok' : 'fail'
    }, __ALI_EM)
  } catch (e) { login = 'retry:' + String(e.message).slice(0, 60) }
  if (login === 'ok') break
  await page.waitForTimeout(4000)
}
check('login Alireza', login === 'ok', login)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
await page.evaluate(() => { try {
  document.getElementById('wd33-cer')?.classList.remove('on')
  document.querySelectorAll('.modal.active').forEach(m => { if (!['m-admin', 'm-shop', 'm-lobby', 'm-rank'].includes(m.id)) m.classList.remove('active') })
} catch (e) {} })

/* ---------- restore a real game state (France+Germany, resources, army) ---------- */
await page.evaluate(() => { try {
  restoreState({ my: 'France', conq: ['France', 'Germany'], occ: {}, ovr: {}, res: { gold: 120000, food: 9000, oil: 9000 }, infra: {}, units: { infantry: 300, tank: 60, bomber: 6, transport: 4 } })
} catch (e) {} })
await page.waitForTimeout(5200) /* civTick boot fires at 4s */

/* ---- 1) module boot + zero pageerror so far ---- */
const boot = await page.evaluate(() => ({ has: !!window.WD65, happy: window.WD65?.civ?.happy, pop: window.WD65?.civ?.popM }))
check('WD65 module booted', boot.has, JSON.stringify(boot))
check('civ sim has real numbers (pop>0, happy 0..100)', boot.pop > 0 && boot.happy >= 0 && boot.happy <= 100, JSON.stringify(boot))
check('zero pageerror after boot', errors.length === 0, errors.join('|'))

/* ---- 2) status chip: visible AND really visible (V64 lesson: computed style, not chars) ---- */
const chip = await page.evaluate(() => {
  const c = document.getElementById('wd65-chip')
  if (!c) return null
  const cs = getComputedStyle(c)
  const r = c.getBoundingClientRect()
  return { display: cs.display, opacity: cs.opacity, w: r.width, h: r.height, txt: c.textContent }
})
check('status chip shows pop/happy/stab', !!chip && chip.display === 'flex' && /M/.test(chip.txt || ''), chip && JSON.stringify(chip))
check('status chip VISIBILITY not animation-gated (opacity=1, non-zero box)', !!chip && Number(chip.opacity) === 1 && chip.w > 40 && chip.h > 14, chip && `opacity=${chip && chip.opacity} box=${chip && chip.w}x${chip && chip.h}`)

/* ---- 3) real user path: ☰ menu → امپراتوری / شکوه items → WD65 sheet ---- */
await page.evaluate(() => { try { document.getElementById('wd7-btn')?.click() } catch (e) {} })
await page.waitForTimeout(700)
const menuOk = await waitVisible(() => {
  const items = [...document.querySelectorAll('.wd-menu-item')]
  return items.some(i => i.textContent.includes('امپراتوری')) && items.some(i => i.textContent.includes('شکوه')) ? items : null
}, 10000)
check('menu has امپراتوری + شکوه items (real user path)', !!menuOk)
await page.evaluate(() => { try { [...document.querySelectorAll('.wd-menu-item')].find(i => i.textContent.includes('امپراتوری'))?.click() } catch (e) {} })
await page.waitForTimeout(700)
const sheetOk = await page.evaluate(() => {
  const sh = document.getElementById('wd65-sheet'), card = document.getElementById('wd65-card')
  if (!sh || !card) return null
  const cs = getComputedStyle(card)
  return { open: sh.classList.contains('open'), opacity: cs.opacity, txt: card.textContent || '' }
})
check('امپراتوری opens the living-world sheet (VISIBILITY: opacity=1)', !!sheetOk && sheetOk.open && Number(sheetOk.opacity) === 1, sheetOk && `opacity=${sheetOk && sheetOk.opacity}`)
const empireTxt = sheetOk?.txt || ''
check('empire view renders civ cards', ['جمعیت', 'رضایت', 'ثبات', 'سیاست‌های حکومت', 'استان‌های امپراتوری', 'برنامه‌ی نبرد'].every(k => empireTxt.includes(k)), empireTxt.slice(0, 90))

/* ---- 4) policy switch: war economy (real pros/cons, chronicle entry) ---- */
await page.evaluate(() => document.querySelector('#wd65-card [data-pol="economy:war_econ"]')?.click())
await page.waitForTimeout(500)
const pol = await page.evaluate(() => ({ on: !!document.querySelector('#wd65-card [data-pol="economy:war_econ"].gr'), k: window.WD65.st.chron[0]?.k, m: window.WD65.st.chron[0]?.m || '' }))
check('policy war_econ activates (visual + chronicle)', pol.on && pol.k === 'pol', JSON.stringify(pol))
await page.evaluate(() => document.querySelector('#wd65-card [data-pol="economy:balanced"]')?.click())

/* ---- 5) building upgrade: cost → queue → completion (relative level, cumulative save) ---- */
const goldBefore = await page.evaluate(() => Math.round(playerRes.gold))
const lvBefore = await page.evaluate(() => window.WD65.st.prov?.France?.b?.factory || 0)
await page.evaluate(() => document.querySelector('#wd65-card [data-up="France:factory"]')?.click())
await page.waitForTimeout(500)
const q1 = await page.evaluate(() => ({ q: !!window.WD65.st.queue, gold: Math.round(playerRes.gold) }))
check('building upgrade spends gold + enters engineering queue', q1.q && q1.gold < goldBefore, `gold ${goldBefore}→${q1.gold}`)
await page.evaluate(() => { if (window.WD65.st.queue) window.WD65.st.queue.until = Date.now() - 1; window.WD65.tick() })
await page.waitForTimeout(400)
const q2 = await page.evaluate(() => ({ lv: window.WD65.st.prov?.France?.b?.factory || 0, q: !!window.WD65.st.queue, k: window.WD65.st.chron[0]?.k }))
check('queue completes lazily → factory level+1 + chronicle', q2.lv === lvBefore + 1 && !q2.q && q2.k === 'bld', `before=${lvBefore} ${JSON.stringify(q2)}`)

/* ---- 6) war plan sheet: tactic applies multiplier, confirm starts the operation ---- */
await page.evaluate(() => window.WD65.plan())
await page.waitForTimeout(600)
const sheet1 = await page.evaluate(() => {
  const sh = document.getElementById('wd65-sheet'), card = document.getElementById('wd65-card')
  if (!sh || !card) return null
  const cs = getComputedStyle(card)
  return { open: sh.classList.contains('open'), opacity: cs.opacity, hasTac: !!card.querySelector('[data-tac="heavy"]') }
})
check('war-plan sheet opens with tactics + VISIBILITY (opacity=1)', !!sheet1 && sheet1.open && Number(sheet1.opacity) === 1 && sheet1.hasTac, JSON.stringify(sheet1))
await page.evaluate(() => document.querySelector('#wd65-card [data-tac="heavy"]')?.click())
await page.waitForTimeout(500)
const mult = await page.evaluate(() => ({ tactic: window.WD65TACTIC, atk: window.WD65.atkMult(), loss: window.WD65.lossMult() }))
check('tactic heavy → +15% atk / +22% losses (real multipliers)', mult.tactic === 'heavy' && mult.atk > 1.14 && mult.loss > 1.2, JSON.stringify(mult))
/* pick a gray AI target (no 👤 owner); lift the Olympic truce (admin switch + client sync mirror) */
await page.evaluate(async () => { try {
  await sb.rpc('event_switch_set', { p_key: 'olympic', p_on: false })
  if (window.WD33_EV) window.WD33_EV.olympic = false /* exactly what the client's switch-refetch applies */
} catch (e) {} })
await page.waitForTimeout(600)
await page.evaluate(() => {
  const sel = document.getElementById('w65-tg'); if (!sel) return
  const ai = [...sel.options].find(o => !o.textContent.includes('👤'))
  if (ai) { sel.value = ai.value; sel.dispatchEvent(new Event('change')) }
})
await page.waitForTimeout(500)
const tgName = await page.evaluate(() => ({ t: window.__WD65_t || null, sel: document.getElementById('w65-tg')?.value }))
await page.evaluate(() => document.getElementById('w65-go')?.click())
await page.waitForTimeout(9000)
const battle = await page.evaluate(() => ({
  sheetClosed: !document.getElementById('wd65-sheet')?.classList.contains('open'),
  battleUi: !!document.querySelector('.modal.active') || document.body.classList.contains('wd-war') || !!document.querySelector('.wd39-narr, .wd39-round, .wd-cine, #wd-cinema, .m-battle.active'),
}))
check('confirm → operation actually starts (battle UI) and sheet closes', battle.sheetClosed && battle.battleUi, JSON.stringify(battle))
check('no pageerror during attack flow', errors.length === 0, errors.join('|'))
await page.evaluate(async () => { try { await sb.rpc('event_switch_set', { p_key: 'olympic', p_on: true }) } catch (e) {} })
await page.evaluate(() => { try { document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active')); document.body.classList.remove('wd-war') } catch (e) {} })

/* ---- 7) retreat path: open → retreat → no attack, sheet closes ---- */
await page.evaluate(() => window.WD65.plan())
await page.waitForTimeout(500)
await page.evaluate(() => document.getElementById('w65-no')?.click())
await page.waitForTimeout(300)
const retreat = await page.evaluate(() => ({ closed: !document.getElementById('wd65-sheet')?.classList.contains('open'), armed: !!window.__WD65_t }))
check('retreat aborts with zero cost (no armed target)', retreat.closed && !retreat.armed, JSON.stringify(retreat))
/* ---- 7b) back button returns to empire view ---- */
await page.evaluate(() => window.WD65.plan())
await page.waitForTimeout(400)
await page.evaluate(() => document.querySelector('#wd65-card [data-v65="back"]')?.click())
await page.waitForTimeout(400)
const back = await page.evaluate(() => ({ open: document.getElementById('wd65-sheet')?.classList.contains('open'), isEmpire: (document.getElementById('wd65-card')?.textContent || '').includes('سیاست‌های حکومت') }))
check('plan → بازگشت returns to empire view', back.open && back.isEmpire, JSON.stringify(back))

/* ---- 8) server-authoritative glory: rival / goals / hall-of-fame via real RPCs ---- */
await page.evaluate(() => { try { [...document.querySelectorAll('.wd-menu-item')].find(i => i.textContent.includes('شکوه'))?.click() } catch (e) {} })
const glory = await waitVisible(() => {
  const t = document.getElementById('wd65-card')?.textContent || ''
  return t.includes('BotOne') && t.includes('تالار افتخارات') ? t : null
}, 12000)
check('glory tab renders rival/goals/hof/chronicle', !!glory && ['رقیب شخصی', 'اهداف بلندمدت', 'تالار افتخارات', 'تاریخچه‌ی امپراتوری'].every(k => glory.includes(k)), glory && glory.slice(0, 80))
/* rival is whoever is EXACTLY adjacent in server ranking (Alireza may be #1 locally —
   the client score recompute is authoritative) → assert adjacency, not a fixed nick */
const rivalInfo = await page.evaluate(async () => {
  const r = await sb.rpc('rival_get', { p_server: 1 })
  return r.data && r.data.ok ? { me: r.data.me_rank, rv: r.data.rival_rank, nick: r.data.rival && r.data.rival.nick, top: r.data.msg === 'top' } : null
})
check('rival is ranking-adjacent (server truth)', !!rivalInfo && (rivalInfo.top || Math.abs(rivalInfo.me - rivalInfo.rv) === 1), JSON.stringify(rivalInfo))
check('glory shows the actual rival nick', !!rivalInfo && (rivalInfo.top || glory.includes(rivalInfo.nick)))
check('HoF conqueror = BotOne (server-computed from scores)', !!glory && glory.includes('BotOne'))

const rpcs = await page.evaluate(async () => {
  const out = {}
  try { const r = await sb.rpc('rival_get', { p_server: 1 }); out.rival = r.data?.ok && r.data.rival?.nick } catch (e) { out.rival = 'ERR:' + e.message }
  try { const r = await sb.rpc('goals_get', { p_server: 1 }); out.goals = r.data?.ok && r.data.goals?.length } catch (e) { out.goals = 'ERR:' + e.message }
  try { const r = await sb.rpc('hof_list', { p_server: 1 }); out.hof = r.data?.ok && r.data.titles?.length } catch (e) { out.hof = 'ERR:' + e.message }
  return out
})
check('RPC rival_get ok (adjacent rival)', typeof rivalInfo?.me === 'number' && (rivalInfo.top || Math.abs(rivalInfo.me - rivalInfo.rv) === 1), JSON.stringify(rivalInfo))
check('RPC goals_get ok (8 goals)', rpcs.goals === 8, JSON.stringify(rpcs))
check('RPC hof_list ok (6 titles)', rpcs.hof === 6, JSON.stringify(rpcs))

/* ---- 9) living-world news mapping ---- */
const news = await page.evaluate(() => ({
  fall: (window.wdNewsFa({ action: 'empire_fall', actor_nick: 'X', target_nick: 'Y', country: 'France' }) || ''),
  hof: (window.wdNewsFa({ action: 'hof_new', actor_nick: 'A', country: 'conqueror' }) || ''),
}))
check('news: empire_fall BREAKING rendered', news.fall.includes('سقوط'), news.fall)
check('news: hof_new rendered', news.hof.includes('تالار افتخارات'), news.hof)

/* ---- 10) chronicle: home + first steps recorded (st.chron = live reference) ---- */
const chron = await page.evaluate(() => ({ n: window.WD65.st.chron.length, home: window.WD65.st.chron.some(c => c.k === 'home'), pol: window.WD65.st.chron.some(c => c.k === 'pol') }))
check('chronicle records empire history (home+policy entries)', chron.n > 0 && chron.home && chron.pol, JSON.stringify(chron))

check('ZERO pageerror in whole run', errors.length === 0, errors.join('|').slice(0, 200))
const pass = results.filter(r => r.ok).length
console.log(`\n== ${pass}/${results.length} ==`)
await browser.close()
process.exit(pass === results.length ? 0 : 1)
