// V90 QA: OLYMPIC RATING & MATCHMAKING (§34-36) — Elo per discipline, tiers, matchmaker, duel integration
// Needs server booted with OL_OFFSET so games phase = live (gameDay 2).
// Usage: WD_BASE=http://localhost:3100 node scripts/wd90-qa.mjs
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

/* تله‌متری معتبر دو ۱۰۰م (داور v3Sprint مستقل از seed است):
   go → گام‌های یک‌درمیان با فاصله‌ی ≥۱۵۰ms و واکنش ≥۱۰۰ms */
function sprintTel(strides, reactMs = 150, gapMs = 165) {
  const ev = [['go', 300]]
  let t = 300 + reactMs, side = 0
  for (let i = 0; i < strides; i++) { ev.push(['p', Math.round(t), side]); side = 1 - side; t += gapMs }
  return { s: 0, e: Math.round(t + 1500), ev }
}
/* تله‌متری خراب‌کاری‌شده — گام‌های هم‌سمت (no_alternation) */
function sprintTampered(strides) {
  const ev = [['go', 300]]
  let t = 460
  for (let i = 0; i < strides; i++) { ev.push(['p', Math.round(t), 0]); t += 200 }
  return { s: 0, e: Math.round(t + 1500), ev }
}

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

async function ensureTerritory(nick) {
  const u = await db.user.findUnique({ where: { nickLower: nick } })
  const t = await db.territory.findFirst({ where: { userId: u.id } })
  if (!t) {
    const taken = new Set((await db.territory.findMany({ where: { server: 2 }, select: { country: true } })).map(x => x.country))
    const free = ['Iran', 'Brazil', 'France', 'Japan', 'Egypt', 'Canada', 'Sweden', 'Kenya', 'Peru', 'Nepal'].find(c => !taken.has(c)) || ('Qa' + Math.random().toString(36).slice(2, 8))
    await db.territory.create({ data: { server: 2, country: free, userId: u.id, nick, isCapital: true } })
  }
  return u
}
async function officialPlay(page, disc, tel) {
  const st = await rpc(page, 'olympic_start', { p_discipline: disc, p_mode: 'official' })
  if (!st || !st.ok) return { ok: false, reason: (st && st.reason) || 'start', _st: st }
  const sub = await rpc(page, 'olympic_submit', { p_discipline: disc, p_match_id: st.match_id, p_nonce: st.token, p_telemetry: tel })
  return { ok: !!(sub && sub.ok), reason: sub && sub.reason, sub, _st: st }
}
const ratingRow = async (uid, disc) => await db.olympicRating.findUnique({ where: { userId_discipline: { userId: uid, discipline: disc } } })

const NICK_A = 'q90a' + Math.random().toString(36).slice(2, 7)
const NICK_B = 'q90b' + Math.random().toString(36).slice(2, 7)
const RATE_WAIT = (ms) => new Promise(r => setTimeout(r, ms))

/* ---------- A: boot + beacon + fresh matchmaker ---------- */
let A, APage, AUid
{
  const r = await boot(NICK_A)
  A = r; APage = r.page
  check('beacon>=90', await APage.evaluate(() => window.__WD_V >= 90), String(await APage.evaluate(() => window.__WD_V)))
  check('v90 css injected (tier/matchmaker styles)', !!(await APage.$('#v90-css')))
  AUid = (await ensureTerritory(NICK_A)).id

  const mm0 = await rpc(APage, 'olympic_match', {})
  check('match suggest: fresh user ok + structure', !!(mm0 && mm0.ok && mm0.match && mm0.match.discipline), S(mm0).slice(0, 90))
  check('match suggest: overall=1200 tier=newcomer games=0 no discs', mm0 && mm0.ok && mm0.match.overall === 1200 && mm0.match.my_tier === 'newcomer' && mm0.match.my_games === 0 && (mm0.match.my_discs || []).length === 0, S((mm0.match || {})).slice(0, 110))

  /* ثبت‌نام رسمی (دیرهنگام در فاز live مجاز) + گیت ۸ ثانیه‌ی lastAt */
  const reg = await rpc(APage, 'olympic_register', { p_disciplines: ['sprint'], p_country_fa: 'ایران' })
  check('register sprint ok (live late-entry)', !!(reg && reg.ok && reg.keys && reg.keys.includes('sprint')), S(reg).slice(0, 70))
  await RATE_WAIT(8600)
}

/* ---------- A: دو تلاش رسمی → رده‌بندی عملکردی ---------- */
let aR1, aR2
{
  const p1 = await officialPlay(APage, 'sprint', sprintTel(40))
  check('official submit #1 accepted by server judge', p1.ok, S({ ok: p1.ok, reason: p1.reason, score: p1.sub && p1.sub.score }).slice(0, 90))
  aR1 = await ratingRow(AUid, 'sprint')
  check('rating row born after official submit (games=1, bounded)', !!aR1 && aR1.games === 1 && aR1.rating >= 400 && aR1.rating <= 2600, S(aR1 && { r: aR1.rating, g: aR1.games }))
  const ath1 = await rpc(APage, 'olympic_athlete', {})
  check('athlete card carries rating block (tier/top)', !!(ath1 && ath1.ok && ath1.athlete && ath1.athlete.rating && ath1.athlete.rating.tier === 'newcomer' && (ath1.athlete.rating.top || []).some(t => t.discipline === 'sprint')), S(ath1.athlete && ath1.athlete.rating).slice(0, 110))

  await new Promise(r => setTimeout(r, 8600)) /* گیت ۸ ثانیه‌ای تلاش رسمی */
  const p2 = await officialPlay(APage, 'sprint', sprintTel(60)) /* پرگام‌تر = امتیاز بالاتر */
  check('official submit #2 accepted', p2.ok, S({ ok: p2.ok, reason: p2.reason, score: p2.sub && p2.sub.score }).slice(0, 90))
  aR2 = await ratingRow(AUid, 'sprint')
  check('rating moved toward better performance (+, ≤28) & games=2', !!aR2 && !!aR1 && aR2.games === 2 && aR2.rating > aR1.rating && (aR2.rating - aR1.rating) <= 28, S({ d: aR2 && aR1 ? aR2.rating - aR1.rating : null }).slice(0, 60))
  check('peak tracks max', !!aR2 && aR2.peak >= aR2.rating, S({ p: aR2 && aR2.peak }).slice(0, 40))
}

/* ---------- تلاش تامپرشده: داور رد می‌کند و رده‌بندی دست‌نخورده می‌ماند ---------- */
{
  const pt = await officialPlay(APage, 'sprint', sprintTampered(20))
  check('tampered telemetry rejected (invalid)', !pt.ok && pt.reason === 'invalid', S({ ok: pt.ok, reason: pt.reason }).slice(0, 60))
  const aRt = await ratingRow(AUid, 'sprint')
  check('rejected attempt does NOT touch rating (games still 2)', !!aRt && aRt.games === 2 && aRt.rating === aR2.rating, S({ g: aRt && aRt.games }).slice(0, 40))
}

/* ---------- تمرین: بی‌اثر روی رده‌بندی ---------- */
{
  const st = await rpc(APage, 'olympic_start', { p_discipline: 'sprint', p_mode: 'train' })
  const sub = st && st.ok ? await rpc(APage, 'olympic_submit', { p_discipline: 'sprint', p_match_id: st.match_id, p_nonce: st.token, p_telemetry: sprintTel(50) }) : null
  check('train submit ok + flagged train', !!(sub && sub.ok && sub.train === true), S(sub || {}).slice(0, 70))
  const aRt = await ratingRow(AUid, 'sprint')
  check('train does NOT touch rating', !!aRt && aRt.games === 2, S({ g: aRt && aRt.games }).slice(0, 40))
}

/* ---------- B: رشد رده + جفت‌یاب ---------- */
let B, BPage, BUid, bR2
{
  const r = await boot(NICK_B)
  B = r; BPage = r.page
  BUid = (await ensureTerritory(NICK_B)).id
  await rpc(BPage, 'olympic_register', { p_disciplines: ['sprint'], p_country_fa: 'ایران' })
  await RATE_WAIT(8600) /* گیت lastAt بعد از ثبت‌نام */
  await officialPlay(BPage, 'sprint', sprintTel(55))
  await new Promise(r2 => setTimeout(r2, 8600))
  const p2 = await officialPlay(BPage, 'sprint', sprintTel(62))
  check('B official submits accepted', p2.ok, S({ ok: p2.ok, reason: p2.reason }).slice(0, 60))
  bR2 = await ratingRow(BUid, 'sprint')
  check('B rated (games=2)', !!bR2 && bR2.games === 2, S(bR2 && { r: bR2.rating, g: bR2.games }).slice(0, 50))

  const mm = await rpc(APage, 'olympic_match', { p_discipline: 'sprint' })
  const sugg = (mm && mm.ok && mm.match && mm.match.suggestions) || []
  const bRow = sugg.find(x => x.nick === NICK_B)
  check('match suggest lists B with tier+gap+proximity', !!bRow && typeof bRow.gap === 'number' && !!bRow.tier && sugg[0].nick === NICK_B, S(sugg[0] || {}).slice(0, 110))
  check('match my_discs carries rated disciplines', !!(mm && mm.ok && (mm.match.my_discs || []).some(d => d.discipline === 'sprint' && d.games >= 2)), S((mm.match || {}).my_discs || []).slice(0, 80))
}

/* ---------- جفت‌یاب خودکار → چالش رسمی → دوئل با Elo ---------- */
{
  await RATE_WAIT(8600) /* گیت lastAt برای تلاش دوئل B */
  const auto = await rpc(APage, 'olympic_match', { p_action: 'auto', p_discipline: 'sprint' })
  const autoId = auto && auto.ok && auto.match && (auto.match.auto ? auto.match.auto.id : auto.match.auto_existing)
  check('auto match creates/returns official challenge', !!autoId, S(auto).slice(0, 110))

  /* B قبول می‌کند: نشست با seed مشترک + تلاش برنده (۶۲ گام) */
  const stB = await rpc(BPage, 'olympic_start', { p_discipline: 'sprint', p_mode: 'official', p_challenge_id: autoId })
  check('duel session B carries challenge seed', !!(stB && stB.ok), S(stB || {}).slice(0, 70))
  const subB = await rpc(BPage, 'olympic_submit', { p_discipline: 'sprint', p_match_id: stB.match_id, p_nonce: stB.token, p_telemetry: sprintTel(62) })
  check('B duel attempt scored', !!(subB && subB.ok), S(subB || {}).slice(0, 70))

  /* A همان seed: تلاش بازنده (۴۰ گام) → تکمیل دوئل */
  const stA = await rpc(APage, 'olympic_start', { p_discipline: 'sprint', p_mode: 'official', p_challenge_id: autoId })
  const subA = await rpc(APage, 'olympic_submit', { p_discipline: 'sprint', p_match_id: stA.match_id, p_nonce: stA.token, p_telemetry: sprintTel(40) })
  check('A duel attempt completes duel (challenge.done in payload)', !!(subA && subA.ok && subA.challenge && subA.challenge.done === true), S(subA && subA.challenge).slice(0, 90))

  const ch = await db.olympicChallenge.findUnique({ where: { id: autoId } })
  check('challenge done with server verdict (B wins)', ch && ch.status === 'done' && ch.winnerUid === BUid, S(ch && { st: ch.status, w: ch.winnerUid === BUid }).slice(0, 60))

  const aR3 = await ratingRow(AUid, 'sprint')
  const bR3 = await ratingRow(BUid, 'sprint')
  check('Elo two-sided: winner up / loser down / games+1', aR3.games === 3 && bR3.games === 3 && bR3.rating > bR2.rating && aR3.rating < aR2.rating, S({ a: aR3.rating, b: bR3.rating }).slice(0, 60))
  check('winner win counter incremented', bR3.wins === 1 && aR3.wins === 0, S({ bw: bR3.wins, aw: aR3.wins }).slice(0, 40))
}

/* ---------- UI: هاب واقعی — تب رقیب (جفت‌یاب) + تب پروفایل (شناسنامه) ---------- */
{
  /* هاب از نقطه‌ی ورود واقعی باز می‌شود — توابع داخلی IIFE از بیرون دیده نمی‌شوند */
  await APage.evaluate(() => { try { window.WD33_GAMES_OPEN() } catch (e) {} })
  await APage.waitForTimeout(9000) /* واکشی WG33 + گارد ۱۰s هاب */
  const hubOn = await APage.evaluate(() => { const p = document.getElementById('wd-games'); return !!(p && p.classList.contains('on')) })
  check('olympics hub opens via real entry', hubOn)
  /* تب رقیب */
  await APage.evaluate(() => { const b = document.querySelector('.wg89-tab[data-t="rivals"]'); b && b.click() })
  await APage.waitForTimeout(3000)
  const mmTxt = await APage.evaluate(() => (document.getElementById('wg90-mmbox') || {}).textContent || '')
  check('rivals tab: matchmaker mounts with my tier + auto button', mmTxt.includes('تازه‌کار') && mmTxt.includes('حریف هم‌رده پیدا کن'), mmTxt.slice(0, 90))
  check('rivals tab: suggestion row with B nick + stats', mmTxt.includes(NICK_B) && mmTxt.includes('بازی'), mmTxt.slice(0, 110))
  const chipCnt = await APage.evaluate(() => document.querySelectorAll('#wg90-mmbox .wg90-chip').length)
  check('rivals tab: rated-discipline chips rendered (sprint)', chipCnt >= 1, String(chipCnt))
  /* تب پروفایل — شناسنامه با نشان رده */
  await APage.evaluate(() => { const b = document.querySelector('.wg89-tab[data-t="profile"]'); b && b.click() })
  await APage.waitForTimeout(2500)
  const profTxt = await APage.evaluate(() => (document.getElementById('wg89-profbox') || {}).textContent || '')
  check('profile tab: athlete card renders rating line + tier', profTxt.includes('رده‌ی المپیکی') && profTxt.includes('تازه‌کار'), profTxt.slice(0, 90))
}

/* ---------- بهداشت: بدون خطای صفحه + ضد P2W استاتیک ---------- */
check('zero pageerrors across both sessions', errors.length === 0, S(errors).slice(0, 160))
console.log('RESULT ' + pass + '/' + (pass + fail) + (fail ? ' — FAILURES PRESENT' : ' — ALL GREEN'))
await db.$disconnect()
process.exit(fail ? 1 : 0)
