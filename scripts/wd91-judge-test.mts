/* WD91 — تست داور v5Boxing: تولید تله‌متری مشروع (زمان ms) با همان الگوریتم کلاینت + تامپرها */
import { computeScore } from '../src/lib/olyScore.ts'

let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }

function seedOf3(str) { let h = 2166136261 >>> 0; const s = String(str || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h >>> 0 }
function rngOf3(seed, salt) { let a = seedOf3(seed + ':' + salt) | 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function buildPlan(seed) {
  const r = rngOf3(seed, 'plan'); const plan = []
  for (let rd = 0; rd < 3; rd++) {
    const n = 7 + Math.floor(r() * 4); const list = []; let t = 2.5 + r() * 2.5
    for (let i = 0; i < n; i++) { const kind = Math.floor(r() * 6); list.push({ t, kind }); t += 2.4 + r() * 2.6; if (t > 29) break }
    plan.push(list)
  }
  return plan
}
const REC = [0.32, 0.51, 0.6, 0.6, 0.69, 0.53] /* startup+active+recovery هر نوع (s) */

/* شبیه‌ساز مسابقه‌ی مشروع — همان منطق FightCtl؛ زمان رویدادها ms؛ RNG مقید برای قطعیت */
function simFight(seed, opts = {}) {
  const R = rngOf3(seed, 'sim') /* قطعیت: هر دو verdict همان نبرد را شبیه‌سازی می‌کنند */
  const rnd = () => R()
  const plan = buildPlan(seed)
  const ev = [['v5', 0, 3]]
  const bells = []
  const ms = (s) => Math.round(s * 1000)
  let t = 1.0
  const kdEvents = []
  for (let rd = 0; rd < 3; rd++) {
    const bellT = t
    bells.push(ms(bellT))
    ev.push(['bell', ms(bellT), rd + 1])
    const fight0 = bellT + 1.8
    let lastCounterAt = -9
    let lastP = -9, lastKind = 0
    for (let i = 0; i < plan[rd].length; i++) {
      const step = plan[rd][i]
      const at = fight0 + step.t + (opts.atkJitter ? 0.05 : 0)
      let res = 2
      const roll = rnd()
      if (roll < 0.35) res = 3
      else if (roll < 0.6) res = 1
      ev.push(['atk', ms(at), i, res, 0])
      if (res === 1 || res === 3) lastCounterAt = at
      if (res === 3 && rnd() < 0.5) {
        /* کانتر — فقط بعد از پایان ریکاوری ضربه‌ی قبلی (مثل جریان واقعی) */
        const ct = Math.max(at + 0.35, lastP + REC[lastKind] + 0.15)
        ev.push(['p', ms(ct), 1, 2, 11.2, 1]); lastP = ct; lastKind = 1
      }
    }
    let pt = Math.max(fight0 + 3, lastP + REC[lastKind] + 0.2)
    let thrown = 0, landed = 0
    while (pt < bellT + 28 && thrown < 22) {
      const kind = thrown % 2 === 0 ? 0 : (thrown % 5 === 0 ? 5 : 1)
      const landRoll = rnd()
      let res = 2, dmg = kind === 0 ? 5.5 : kind === 5 ? 9 : 11.4
      if (landRoll < 0.2) { res = 0; dmg = 0 }
      else if (landRoll < 0.35) { res = 1; dmg = 2.4 }
      ev.push(['p', ms(pt), kind, res, res === 0 ? 0 : dmg, 0])
      thrown++
      if (res === 2) landed++
      lastP = pt; lastKind = kind
      pt += REC[kind] + 0.18 + rnd() * 0.35
    }
    const kdOp = (rd === 1) ? 1 : 0
    if (kdOp) { kdEvents.push(['kd', ms(bellT + 25), 1, 1]) }
    ev.push(['rl', ms(bellT + 29.5), rd + 1, thrown, landed, 3, 0, kdOp])
    t = bellT + 40
  }
  ev.push(...kdEvents)
  ev.push(['end', ms(t), opts.verdict !== undefined ? opts.verdict : 1, 0])
  ev.sort((a, b) => Number(a[1]) - Number(b[1]))
  return { s: 0, e: ms(t) + 400, ev }
}

const SEED = 'wd91-judge-seed'
const leg = simFight(SEED)
const r1 = computeScore('boxing', leg, 10, { seed: SEED, mode: 'official' })
check('legit fight accepted', r1.ok === true, 'score=' + r1.score + ' reason=' + r1.reason)
check('legit score plausible', r1.ok && r1.score > 150 && r1.score < 3000, 'score=' + r1.score)

const legB = simFight(SEED, { verdict: 0 })
const rB = computeScore('boxing', legB, 10, { seed: SEED, mode: 'official' })
check('duel same-seed other verdict ok', rB.ok === true, 'score=' + rB.score)
check('win bonus visible', rB.ok && r1.score - rB.score >= 120, 'Δ=' + (r1.score - rB.score))

const other = simFight('different-seed')
const rO = computeScore('boxing', other, 10, { seed: SEED, mode: 'official' })
check('cross-seed rejected', rO.ok === false, 'reason=' + rO.reason)

function tamper(base, fn) {
  const copy = { s: base.s, e: base.e, ev: base.ev.map((e) => e.slice()) }
  fn(copy.ev)
  copy.ev.sort((a, b) => Number(a[1]) - Number(b[1]))
  return computeScore('boxing', copy, 10, { seed: SEED, mode: 'official' })
}
const t1 = tamper(leg, (ev) => { const i = ev.findIndex((e) => e[0] === 'end'); ev.splice(i, 1) })
check('tamper: no end rejected', t1.ok === false && t1.reason === 'no_end', 'reason=' + t1.reason)
const t2 = tamper(leg, (ev) => { ev.splice(1, 1) })
check('tamper: bell seq rejected', t2.ok === false && /bell/.test(t2.reason), 'reason=' + t2.reason)
const rT3 = (() => {
  const c = { s: leg.s, e: leg.e, ev: leg.ev.map((e) => e.slice()) }
  /* اولین p که در پنجره‌ی ۷۰۰ms بعد از atk موفق نیست → کانتر قلابی */
  const atkWins = c.ev.filter((e) => e[0] === 'atk' && (e[3] === 1 || e[3] === 3)).map((e) => Number(e[1]))
  const victim = c.ev.find((e) => e[0] === 'p' && Number(e[5]) === 0 && !atkWins.some((at) => Number(e[1]) > at && Number(e[1]) - at <= 700))
  if (!victim) { console.log('   (بدون قربانی — تست نامعتبر)'); return { ok: true, score: 0 } }
  victim[5] = 1
  return computeScore('boxing', c, 10, { seed: SEED, mode: 'official' })
})()
check('tamper: ghost counter rejected', rT3.ok === false && rT3.reason === 'ghost_counter', 'reason=' + rT3.reason)
const rT4 = tamper(leg, (ev) => {
  /* جفت p متوالی از جنس cross با گپ بزرگ → فشرده به ۳۰۰ms (بالای EV_GAP، زیر ریکاوری) */
  const ps = ev.filter((e) => e[0] === 'p')
  for (let i = 1; i < ps.length; i++) {
    if (Number(ps[i - 1][2]) === 1 && Number(ps[i][2]) === 1 && Number(ps[i][1]) - Number(ps[i - 1][1]) >= 500) {
      ps[i][1] = Number(ps[i - 1][1]) + 300
      break
    }
  }
})
check('tamper: recovery violation rejected', rT4.ok === false && rT4.reason === 'p_recovery', 'reason=' + rT4.reason)
const rT5 = tamper(leg, (ev) => { ev.push(['cheat', 1000, 1]); ev.sort((a, b) => Number(a[1]) - Number(b[1])) })
check('tamper: unknown event rejected', rT5.ok === false && /v5_unknown/.test(rT5.reason), 'reason=' + rT5.reason)
const rT6 = tamper(leg, (ev) => { const i = ev.findIndex((e) => e[0] === 'rl'); ev[i][3] = 999 })
check('tamper: rl mismatch rejected', rT6.ok === false && rT6.reason === 'rl_mismatch', 'reason=' + rT6.reason)
const rT7 = tamper(leg, (ev) => { const i = ev.findIndex((e) => e[0] === 'atk' && e[3] === 2); if (i >= 0) ev[i][3] = 1 })
check('self-reported atk res (hit→blocked) accepted but +۴ only', rT7.ok === true, 'reason=' + rT7.reason)
const rT8 = tamper(leg, (ev) => { for (const e of ev) if (e[0] === 'p' && e[3] === 2) e[4] = 99 })
check('tamper: impossible dmg rejected', rT8.ok === false && rT8.reason === 'p_dmg', 'reason=' + rT8.reason)
const rT9 = tamper(leg, (ev) => {
  /* اولین atk راند دوم → idx نامعتبر (پرش در برنامه) */
  const bells = ev.filter((e) => e[0] === 'bell')
  const b2 = Number(bells[1][1])
  const a = ev.find((e) => e[0] === 'atk' && Number(e[1]) > b2)
  if (a) a[2] = 5
})
check('tamper: plan overrun rejected', rT9.ok === false && /plan_seq|plan_round/.test(rT9.reason), 'reason=' + rT9.reason)
const rT10 = computeScore('boxing', leg, 10, { seed: '', mode: 'official' })
check('no seed rejected', rT10.ok === false && rT10.reason === 'no_seed', 'reason=' + rT10.reason)
const rT11 = computeScore('sprint', leg, 10, { seed: SEED, mode: 'official' })
check('v5 marker in other discipline rejected', rT11.ok === false && rT11.reason === 'v5_discipline', 'reason=' + rT11.reason)
/* تله‌متری قدیمی v3 — تلگراف‌ها از seed (آینه‌ی v3CombatGeo) — دقیقاً ۹ رویداد */
const v3tel = (() => {
  const ev = []
  let t = 500
  for (let i = 0; i < 9; i++) {
    const r = rngOf3(SEED, 'box:' + i)
    t += 700 + Math.floor(r() * 100)
    ev.push(['ex', t, 2, 1, 400]) /* کانتر rt≤650 همیشه برنده */
  }
  return { s: 0, e: t + 900, ev }
})()
const rT12 = computeScore('boxing', v3tel, 10, { seed: SEED, mode: 'official' })
check('legacy v3 boxing path intact', rT12.ok === true, 'score=' + rT12.score + ' reason=' + rT12.reason)
/* EV_GAP: اتوکلیک p با فاصله‌ی ۱۰۰ms → رد */
const rT13 = tamper(leg, (ev) => { const ps = ev.filter((e) => e[0] === 'p'); for (let i = 1; i < ps.length; i++) ps[i][1] = Number(ps[i - 1][1]) + 100 })
check('autoclick rate rejected (EV_GAP p)', rT13.ok === false && rT13.reason === 'impossible_rate', 'reason=' + rT13.reason)

console.log('\nRESULT: ' + pass + ' pass, ' + fail + ' fail')
process.exit(fail ? 1 : 0)
