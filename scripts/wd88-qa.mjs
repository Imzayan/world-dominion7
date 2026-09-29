// V88 QA: SHOP V3 (12-section store) + WAR DEPTH (attack doctrine/logistics/intel/orders/trophies)
// Usage: WD_BASE=http://localhost:3100 node scripts/wd88-qa.mjs
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const BASE = process.env.WD_BASE || 'http://localhost:3100'
const URL = BASE + '/game/index.html?v=' + Date.now()
let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }
const db = new PrismaClient()
await db.gameSetting.deleteMany({ where: { key: 'wd_test_srvs' } }).catch(() => {})
const browser = await chromium.launch({ headless: true })
const errors = []
const S = JSON.stringify

async function boot(nick) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(5000)
  await page.evaluate(async (nk) => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) {
      n.value = nk; p.value = 'dgtess1234'; p2.value = 'dgtess1234'
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) }
    }
  }, nick)
  await page.waitForTimeout(7000)
  return { ctx, page }
}
const rpc = (page, fn, params) => page.evaluate(async ([f, p]) => {
  try { const r = await sb.rpc(f, p || {}); return r && r.data } catch (e) { return { ok: false, error: 'throw:' + String(e).slice(0, 60) } }
}, [fn, params])

async function giveWallet(nick, gems) {
  const u = await db.user.findUnique({ where: { nickLower: nick } })
  await db.wallet.upsert({ where: { userId: u.id }, update: { gems }, create: { userId: u.id, gems } })
  return u
}
async function giveSave(userId) {
  const state = JSON.stringify({ res: { gold: 9000000, oil: 900000, food: 900000 }, conq: [], my: [] })
  await db.save.upsert({ where: { userId }, update: { state }, create: { userId, nick: 'qa', state } })
}

/* ---------- user A: shop + war client tests ---------- */
const NICK_A = 'q88a' + Math.random().toString(36).slice(2, 7)
{
  const { ctx, page } = await boot(NICK_A)
  check('v.txt>=90 beacon', await page.evaluate(() => window.__WD_V >= 90), String(await page.evaluate(() => window.__WD_V)))
  check('v87 dock still intact (regression)', !!(await page.$('#wd87dock')))

  const cat = await rpc(page, 'shop_catalog')
  const ids = new Set((cat.items || []).map(x => x.id))
  check('catalog: 12-section V3 items present', ['csk_golden', 'lm_palace', 'map_global_night', 'wfr_thunder', 'we_iron', 'vs_gold', 'banner_war', 'intel_l1', 'intel_l2', 'wo_emsupply', 'wo_reserve', 'cmd_training', 'tactical_slot', 'war_starter', 'war_commander', 'war_defender', 'war_imperial', 'war_prep_pack', 'lim_war_banner', 'lim_leg_capital', 'lm_mythic_monument'].every(i => ids.has(i)), 'items=' + (cat.items || []).length)
  check('catalog: war_cfg with 7 attack doctrines', cat.war_cfg && Object.keys(cat.war_cfg.atk_types).length === 7 && !!cat.war_cfg.atk_types.naval && !!cat.war_cfg.atk_types.air && !!cat.war_cfg.atk_types.economic, S(Object.keys((cat.war_cfg || {}).atk_types || {})))
  check('catalog: 10 tactical orders incl. sabotage+blockade', cat.war_cfg && ['emsupply', 'reserve', 'convoy', 'mobilize', 'edefense', 'airrecon', 'reconsweep', 'ewar', 'blockade', 'sabotage'].every(k => cat.war_cfg.orders[k]), '')
  check('catalog: new collections (thunder/warlord/landmarks/capitals/vault)', (cat.collections || []).filter(c => ['thunder', 'warlord', 'landmarks', 'capitals', 'vault'].includes(c.id)).length === 5, 'collections=' + (cat.collections || []).length)
  check('catalog: Imperial Vault box with transparent odds', cat.mystery && cat.mystery.vault_mythic && (cat.mystery.vault_mythic.odds || []).length === 5, S((cat.mystery || {}).vault_mythic || {}).slice(0, 80))
  check('catalog: gem pack prices intact (regression)', (cat.packs || []).find(p => p.id === 'gems_550').price === '۲۰۰٬۰۰۰ تومان', '')

  /* Shop UI: new tabs render */
  await page.evaluate(() => { try { renderShop(); openModal('m-shop') } catch (e) { } })
  await page.waitForTimeout(2500)
  const tabTxt = await page.evaluate(() => { const t = document.querySelector('.wd66-chips'); return t ? t.textContent : '' })
  check('shop UI: new tabs visible (جنگ/بناها/خزانه/پاس فصل/تروفی‌ها)', ['جنگ', 'بناها', 'خزانه امپراتوری', 'پاس فصل', 'تروفی‌ها'].every(x => tabTxt.includes(x)), tabTxt.slice(0, 120))
  await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /جنگ/.test(x.textContent)); b && b.click() })
  await page.waitForTimeout(900)
  const warSec = await page.evaluate(() => { const b = document.getElementById('shop-body'); return b ? b.textContent.replace(/\u200c/g, '') : '' })
  check('shop UI: war section renders legion frames + packs + orders', warSec.includes('لژیون') && warSec.includes('پکهای جنگی') && warSec.includes('سفارشات تاکتیکی'), warSec.slice(0, 80))
  await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /خزانه/.test(x.textContent)); b && b.click() })
  await page.waitForTimeout(700)
  let vaultSec = ''
  for (let i = 0; i < 3 && !vaultSec.includes('خزانهی امپراتوری'); i++) {
    await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /خزانه/.test(x.textContent)); b && b.click() })
    await page.waitForTimeout(1100)
    const dbg = await page.evaluate(() => {
      const body = (document.getElementById('shop-body') || {}).textContent || ''
      return { active: (document.querySelector('.wd66-chip.on') || {}).textContent || '?', hdr: body.includes('خزانه‌ی امپراتوری — قرعه‌ی شفاف'), nchips: document.querySelectorAll('.wd66-chip').length }
    })
    console.log('  [vault try ' + (i + 1) + '] ' + JSON.stringify(dbg))
    vaultSec = await page.evaluate(() => ((document.getElementById('shop-body') || {}).textContent || '').replace(/\u200c/g, ''))
  }
  check('shop UI: Imperial Vault tab with transparent odds', vaultSec.includes('خزانهی امپراتوری') && vaultSec.includes('اسطورهای') && vaultSec.includes('خرید مستقیم'), vaultSec.slice(0, 80))
  await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /پاس فصل/.test(x.textContent)); b && b.click() })
  await page.waitForTimeout(1800)
  const passSec = await page.evaluate(() => (document.getElementById('shop-body') || {}).textContent || '')
  check('shop UI: season pass tab renders tiers + missions', passSec.includes('پاس فصل') && passSec.includes('پله'), '')
  await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /تروفی/.test(x.textContent)); b && b.click() })
  await page.waitForTimeout(1800)
  const troSec = await page.evaluate(() => (document.getElementById('shop-body') || {}).textContent || '')
  check('shop UI: trophies tab renders 8 real-data trophies', (troSec.match(/تروفی/g) || []).length >= 6 && troSec.includes('تروفی المپیک'), '')

  /* war_state defaults */
  const ws = await rpc(page, 'war_state')
  check('war_state: supply 100/100 + slots 1 + balanced', ws.ok && ws.supply === 100 && ws.supply_max === 100 && ws.slots === 1 && (ws.atk_type === 'balanced'), S({ s: ws.supply, sl: ws.slots }))

  /* orders: locked → buy → fire → cooldown */
  const locked = await rpc(page, 'war_order', { p_key: 'mobilize' })
  check('war_order locked without ownership', locked && locked.error === 'locked', S(locked).slice(0, 60))
  await giveWallet(NICK_A, 5000)
  const buy1 = await rpc(page, 'shop_buy', { p_item: 'wo_mobilize', p_request_id: 'qa88-' + Date.now() })
  check('shop_buy wo_mobilize grants inventory', buy1 && buy1.ok, S(buy1).slice(0, 70))
  const ua = await db.user.findUnique({ where: { nickLower: NICK_A } })
  await giveSave(ua.id)
  await page.waitForTimeout(400)
  const fire1 = await rpc(page, 'war_order', { p_key: 'mobilize' })
  check('war_order mobilize fires (resources spent, fx active)', fire1 && fire1.ok && (fire1.fx || []).some(f => f.k === 'mobilize'), S(fire1).slice(0, 90))
  const fire2 = await rpc(page, 'war_order', { p_key: 'mobilize' })
  check('war_order second fire rejected by cooldown', fire2 && fire2.error === 'cd' && fire2.cd_ms > 0, S(fire2).slice(0, 60))
  /* emsupply raises supply from drained state */
  await db.warState.upsert({ where: { userId: ua.id }, update: { data: JSON.stringify({ supply: 50, supplyAt: Date.now() }) }, create: { userId: ua.id, data: JSON.stringify({ supply: 50, supplyAt: Date.now() }) } })
  await rpc(page, 'shop_buy', { p_item: 'wo_emsupply', p_request_id: 'qa88b-' + Date.now() })
  const fire3 = await rpc(page, 'war_order', { p_key: 'emsupply' })
  check('war_order emsupply drains+refills supply 50→90', fire3 && fire3.ok && fire3.supply === 90, S({ s: fire3 && fire3.supply }))

  /* intel: self/nope errors; real target level 1 (no intel items) */
  const si = await rpc(page, 'war_intel', { p_target: NICK_A })
  check('war_intel on self rejected', si && si.error === 'target', S(si).slice(0, 50))
  const sn = await rpc(page, 'war_intel', { p_target: '__nope88__' })
  check('war_intel unknown target rejected', sn && sn.error === 'target', '')

  /* trophies: real data only */
  const t0 = await rpc(page, 'trophy_list')
  check('trophy_list: 8 defs, fresh user earns none', t0.ok && t0.trophies.length === 8 && t0.trophies.every(t => !t.earned), '')
  await db.score.updateMany({ where: { userId: ua.id }, data: { kills: 130 } })
  const t1 = await rpc(page, 'trophy_list')
  const earned = (t1.trophies || []).filter(t => t.earned).map(t => t.key)
  check('trophy_list: veteran+commander issued from real kills', earned.includes('veteran') && earned.includes('commander'), S(earned))
  const t2 = await rpc(page, 'trophy_list')
  check('trophy_list: idempotent (no double issue)', t2.trophies.filter(t => t.earned).length === earned.length, '')
  await ctx.close()
}

/* ---------- user B: intel levels + counterintel + pvp doctrine ---------- */
const NICK_B = 'q88b' + Math.random().toString(36).slice(2, 7)
{
  const { ctx, page } = await boot(NICK_B)
  const ub = await giveWallet(NICK_B, 5000)
  await giveSave(ub.id)
  await rpc(page, 'shop_buy', { p_item: 'intel_l1', p_request_id: 'qa88c-' + Date.now() })
  await rpc(page, 'shop_buy', { p_item: 'intel_l2', p_request_id: 'qa88d-' + Date.now() })
  await rpc(page, 'shop_buy', { p_item: 'wo_ewar', p_request_id: 'qa88e-' + Date.now() })

  /* defender user A gets territory + score */
  const ua = await db.user.findUnique({ where: { nickLower: NICK_A }, include: { score: true } })
  const land = 'QA88Land' + Math.random().toString(36).slice(2, 6)
  await db.territory.upsert({ where: { server_country: { server: 1, country: land } }, update: { userId: ua.id, nick: NICK_A }, create: { server: 1, country: land, userId: ua.id, nick: NICK_A, isCapital: true } })
  await db.score.upsert({ where: { userId: ua.id }, update: { server: 1, score: 40000, kills: 130 }, create: { userId: ua.id, nick: NICK_A, server: 1, score: 40000, kills: 130 } })

  /* L3 intel (intel_l1+l2 owned) */
  const i1 = await rpc(page, 'war_intel', { p_target: NICK_A })
  check('war_intel level 3 with both intel items', i1.ok && i1.report.level === 3, S({ lv: i1.report && i1.report.level }))
  check('war_intel L3 exposes fortifications + readiness', i1.report.fortifications === 0 && typeof i1.report.readiness === 'number', S({ f: i1.report.fortifications, r: i1.report.readiness }))
  const i2 = await rpc(page, 'war_intel', { p_target: NICK_A })
  check('war_intel free-scout cooldown (1/h) returns report anyway', i2.error === 'cd' && i2.free === true && !!i2.report, S(i2).slice(0, 60))

  /* counterintel: B fires ewar? No — A defends; give A ewar fx directly via order (A owns? no) — set fx via sabotage path: B owns ewar → B fires it (self fx) then A intel on B gets noisy */
  const fe = await rpc(page, 'war_order', { p_key: 'ewar' })
  check('war_order ewar fires (counterintel fx 12h)', fe && fe.ok && (fe.fx || []).some(f => f.k === 'ewar'), S(fe).slice(0, 60))
  /* A attacks B's land with doctrines */
  const landB = 'QA88B' + Math.random().toString(36).slice(2, 6)
  await db.territory.upsert({ where: { server_country: { server: 1, country: landB } }, update: { userId: ub.id, nick: NICK_B }, create: { server: 1, country: landB, userId: ub.id, nick: NICK_B, isCapital: true } })
  await db.score.upsert({ where: { userId: ub.id }, update: { server: 1, score: 30000 }, create: { userId: ub.id, nick: NICK_B, server: 1, score: 30000 } })
  /* B is the attacker: one-shot reserve goes on B's state */
  await db.warState.upsert({ where: { userId: ub.id }, update: { data: JSON.stringify({ supply: 100, supplyAt: Date.now(), fx: [{ k: 'reserve', until: Date.now() + 3600e3 }] }) }, create: { userId: ub.id, data: JSON.stringify({ supply: 100, supplyAt: Date.now(), fx: [{ k: 'reserve', until: Date.now() + 3600e3 }] }) } })
  await db.warState.upsert({ where: { userId: ua.id }, update: { data: JSON.stringify({ supply: 100, supplyAt: Date.now() }) }, create: { userId: ua.id, data: JSON.stringify({ supply: 100, supplyAt: Date.now() }) } }).catch(() => {})

  /* A logs in? No — use B's page? pvp_attack must be attacker A. Do server call via A's session: easier — direct evaluate in A's closed page is gone. Use B's page but attacker must own land near? pvp_attack has no geo constraint. But B attacking A's land: B is attacker (session B). Do B→A with economic doctrine: */
  const atk1 = await rpc(page, 'pvp_attack', { p_server: 1, p_country: land, p_attack: 30000, p_atk_type: 'economic' })
  check('pvp_attack economic doctrine: applied + supply consumed', atk1 && (atk1.ok === true || atk1.ok === false) && atk1.atk_type === 'economic' && atk1.supply_after === 96 && (atk1.fx_used || []).includes('eco_pressure'), S(atk1).slice(0, 200))
  check('pvp_attack legacy fields intact (regression)', atk1 && typeof atk1.ratio === 'number' && typeof atk1.defense === 'number' && 'duel_won' in atk1, '')
  const ubAfter = await db.warState.findUnique({ where: { userId: ub.id } })
  const fxAfter = JSON.parse(ubAfter.data || '{}').fx || []
  check('reserve fx consumed after battle (one-shot, attacker-side)', !fxAfter.some(f => f.k === 'reserve'), S(fxAfter))
  /* insufficient supply: drain then air (wait out the 10s server attack cooldown, retry on cd race) */
  let atk2 = null
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 11000))
    await db.warState.upsert({ where: { userId: ub.id }, update: { data: JSON.stringify({ supply: 3, supplyAt: Date.now() }) }, create: { userId: ub.id, data: JSON.stringify({ supply: 3, supplyAt: Date.now() }) } })
    /* harness-robustness: اگر نبرد قبلی سرزمین A را فتح کرده باشد هدف مالک مهاجم می‌شود و گیت supply اصلاً نمی‌رسد — مالکیت را برگردان */
    await db.territory.update({ where: { server_country: { server: 1, country: land } }, data: { userId: ua.id, nick: NICK_A } }).catch(() => {})
    atk2 = await rpc(page, 'pvp_attack', { p_server: 1, p_country: land, p_attack: 30000, p_atk_type: 'air' })
    if (atk2 && atk2.error !== 'cd') break
  }
  check('pvp_attack air blocked when supply < 9', atk2 && atk2.error === 'supply' && atk2.need === 9, S(atk2).slice(0, 70))
  /* legacy: no p_atk_type → no supply logic */
  await new Promise(r => setTimeout(r, 11000))
  const atk3 = await rpc(page, 'pvp_attack', { p_server: 1, p_country: land, p_attack: 30000 })
  check('pvp_attack legacy call (old clients) unaffected', atk3 && (atk3.ok === true || atk3.ok === false) && atk3.atk_type == null && atk3.supply_after == null, S(atk3).slice(0, 100))
  /* reserve one-shot: fx consumed */
  const wsB = await rpc(page, 'war_state')
  check('war_state after attacks reflects state cleanly', wsB.ok && typeof wsB.supply === 'number', '')
  await ctx.close()
}

/* ---------- reserve consumption check via A (one-shot) ---------- */
{
  const ua = await db.user.findUnique({ where: { nickLower: NICK_A } })
  const st = await db.warState.findUnique({ where: { userId: ua.id } })
  const d = JSON.parse(st.data || '{}')
  check('reserve fx consumed after battle (one-shot)', !(d.fx || []).some(f => f.k === 'reserve'), S(d.fx || []))
}

console.log('\npageerrors: ' + errors.length)
errors.slice(0, 5).forEach(e => console.log('  PAGEERROR ' + e))
await db.$disconnect()
await browser.close()
console.log(`\nWD88-QA: ${pass} pass / ${fail} fail`)
process.exit(fail ? 1 : 0)
