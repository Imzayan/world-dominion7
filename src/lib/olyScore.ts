/* ============================================================
   O1 — olyScore: تک‌منبع بازمحاسبه‌ی امتیاز المپیک سمت سرور
   (Anti-cheat L2/L3/L4) — فرمول هر رشته آینه‌ی دقیق کلاینت است
   و کلاینت هم همین رویدادها را تولید می‌کند؛ امتیازِ نهایی فقط
   خروجی همین ماژول است (عدد ادعایی کلاینت هرگز قبول نمی‌شود).
   فرمت تله‌متری: { s: 0, e: endRelMs, ev: [[type, tMs, ...args], ...] }
   قرارداد: آرگومان دوم هر رویداد همیشه زمان نسبی (ms) است.
   خروجی: { ok, score, reason?, flags? }
   ============================================================ */

export type TelemEvent = (string | number)[]
export interface Telemetry { s?: number; e?: number; ev?: TelemEvent[] }

export interface ScoreResult { ok: boolean; score: number; reason?: string; flags?: string[] }

/* حداکثر رویداد مجاز — ضد payload انفجاری */
export const EV_CAP = 420
/* بازه‌ی مجاز طول مسابقه (ms) — هر رشته (L3)؛ هم مدل tap و هم مدل sim پوشش داده می‌شود */
const DUR: Record<string, [number, number]> = {
  sprint: [3500, 60000], archery: [400, 480000], swim: [5000, 60000], gym: [1500, 480000],
  weight: [400, 480000], cycling: [6000, 60000], chess: [400, 480000], volley: [400, 480000],
  football: [1000, 480000], wrestle: [1500, 480000], lj: [1500, 480000],
}
/* حداقل فاصله‌ی بین رویدادهای هم‌نوع (ms) — ضد اتوکلیک/اسکریپت (L4) */
const EV_GAP: Record<string, Record<string, number>> = {
  sprint: { p: 55 }, swim: { p: 55 }, archery: { shot: 250 }, gym: { mv: 60 },
  weight: { lift: 220 }, cycling: { pedal: 90 }, volley: { hit: 180 }, wrestle: {}, chess: {}, football: { shot: 250 }, lj: { jump: 700 },
}

/* ——— بازمحاسبه‌ی هر رشته (آینه‌ی GAMES.* در index.html — بدون سقف ۱۰۰۰) ——— */
function rSprint(ev: TelemEvent[]): ScoreResult {
  let taps = 0
  for (const e of ev) {
    if (e[0] !== 'p') continue
    taps++
  }
  return { ok: true, score: taps * 12 } /* taps*12 — رشد با مهارت، بدون سقف */
}
function rSwim(ev: TelemEvent[]): ScoreResult {
  let n = 0, lastSide = -1
  for (const e of ev) {
    if (e[0] !== 'p') continue
    const side = Math.round(Number(e[2]) || 0)
    if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
    lastSide = side; n++
  }
  return { ok: true, score: n * 14 } /* strokes*14 */
}
function rArchery(ev: TelemEvent[]): ScoreResult {
  let pts = 0, shots = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    const p = Math.round(Number(e[2]) || 0)
    if ([2, 4, 6, 8, 9, 10].indexOf(p) < 0) return { ok: false, score: 0, reason: 'bad_points' }
    pts += p; shots++
    if (shots > 5) return { ok: false, score: 0, reason: 'too_many_shots' }
  }
  return { ok: true, score: pts * 20 } /* pts*20 */
}
function rGym(ev: TelemEvent[]): ScoreResult {
  let pts = 0, step = 0, miss = 0
  for (const e of ev) {
    if (e[0] !== 'mv') continue
    const ok = Number(e[2]) ? 1 : 0, fast = Number(e[3]) ? 1 : 0
    if (step >= 12 || miss >= 4) return { ok: false, score: 0, reason: 'overrun' }
    if (ok) { pts += 70 + fast * 30; step++ } else { miss++; step++ } /* خطا هم مرحله می‌سوزاند */
  }
  return { ok: true, score: pts }
}
function rWeight(ev: TelemEvent[]): ScoreResult {
  let pts = 0, lifts = 0
  for (const e of ev) {
    if (e[0] !== 'lift') continue
    const p = Number(e[2])
    if (!(p >= 0 && p <= 1)) return { ok: false, score: 0, reason: 'bad_precision' }
    pts += Math.round(200 * p); lifts++
    if (lifts > 5) return { ok: false, score: 0, reason: 'too_many_lifts' }
  }
  return { ok: true, score: pts }
}
function rCycling(ev: TelemEvent[]): ScoreResult {
  let sum = 0, n = 0, lastT = -1
  for (const e of ev) {
    if (e[0] !== 'pedal') continue
    const t = Number(e[1]) || 0, dt = Number(e[2]) || 0
    if (dt < 80 || dt > 3000) return { ok: false, score: 0, reason: 'bad_dt' }
    if (lastT >= 0 && t - lastT > 5000) return { ok: false, score: 0, reason: 'gap' }
    lastT = t
    const q = Math.max(0, 1 - Math.abs(dt - 400) / 250)
    sum += q; n++
  }
  if (n < 1) return { ok: true, score: 0 }
  const avg = sum / n
  const avg2 = n >= 8 ? avg : avg * 0.6 /* همان قاعده‌ی کلاینت */
  return { ok: true, score: Math.round(avg2 * 1000) }
}
function rChess(ev: TelemEvent[]): ScoreResult {
  let pts = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] !== 'puz') continue
    const idx = Math.round(Number(e[2]) || 0), ok = Number(e[3]) ? 1 : 0, dt = Number(e[4]) || 0
    if (!(idx >= 0 && idx <= 3)) return { ok: false, score: 0, reason: 'bad_puzzle' }
    if (seen.has(idx)) return { ok: false, score: 0, reason: 'dup_puzzle' }
    seen.add(idx)
    if (ok) pts += 200 + (dt < 6000 ? 50 : dt < 10000 ? 25 : 0)
  }
  return { ok: true, score: pts }
}
function rVolley(ev: TelemEvent[]): ScoreResult {
  let spikes = 0, serves = 1
  for (const e of ev) {
    if (e[0] === 'hit') spikes++
    else if (e[0] === 'fault') { serves++; if (serves > 3) break } /* همان پایان کلاینت */
  }
  return { ok: true, score: spikes * 22 } /* spikes*22 */
}
function rFootball(ev: TelemEvent[]): ScoreResult {
  let pts = 0, goals = 0, shot = 0, round = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    if (round > 2) return { ok: false, score: 0, reason: 'overrun' }
    const zi = Math.round(Number(e[2]) || 0), kd = Math.round(Number(e[3]) || 0)
    const goal = Number(e[4]) ? 1 : 0, rd = Math.round(Number(e[5]) || 0)
    if (!(zi >= 0 && zi <= 2 && kd >= 0 && kd <= 2)) return { ok: false, score: 0, reason: 'bad_zone' }
    if (rd !== round) return { ok: false, score: 0, reason: 'bad_round' }
    if (goal) { pts += 90; goals++ }
    shot++
    if (shot >= 3) {
      if (goals >= 2) pts += [100, 150, 200][Math.min(2, round)]
      round++; shot = 0; goals = 0
    }
  }
  return { ok: true, score: pts }
}
function rWrestle(ev: TelemEvent[]): ScoreResult {
  let pts = 0, bouts = 0
  for (const e of ev) {
    if (e[0] !== 'bout') continue
    const win = Number(e[2]) ? 1 : 0, left = Number(e[3]) || 0
    if (left < 0 || left > 12000) return { ok: false, score: 0, reason: 'bad_time' }
    if (win) pts += 250 + Math.round(left / 12000 * 1000 * 0.15)
    bouts++
    if (bouts > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  return { ok: true, score: pts }
}
function rLJ(ev: TelemEvent[]): ScoreResult {
  /* پرش طول: ۳ پرش — متراژ واقع‌بینانه؛ فرمول کلاینت: round(m*45) */
  let pts = 0, jumps = 0
  for (const e of ev) {
    if (e[0] !== 'jump') continue
    const m = Number(e[2]) || 0
    if (!(m >= 0 && m <= 15)) return { ok: false, score: 0, reason: 'bad_jump' }
    pts += Math.round(m * 45); jumps++
    if (jumps > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  return { ok: true, score: pts }
}

const RECALC: Record<string, (ev: TelemEvent[]) => ScoreResult> = {
  sprint: rSprint, swim: rSwim, archery: rArchery, gym: rGym, weight: rWeight,
  cycling: rCycling, chess: rChess, volley: rVolley, football: rFootball, wrestle: rWrestle, lj: rLJ,
}

export function hasRecalc(key: string): boolean { return !!RECALC[key] }

/* ============================================================
   مدل دوم — نسخه‌های شبیه‌سازی تاکتیکی (V41؛ مسیر زنده‌ی بازی)
   تصمیم‌محور: RNG با seed سرور بذر شده (L6) و سرور امتیاز را از
   توالی تصمیم‌ها + نتیجه با همان فرمول کلاینت بازمحاسبه می‌کند.
   رویدادها: dec / fbend / racend / rnd / rndend / du / duend
   ============================================================ */
const clampB = (v: number): number | null => {
  const b = v / 100
  return (b >= 0.14 && b <= 0.95) ? b : null /* baseStrength ∈ [0.18..0.92] — خارج از این = دستکاری */
}
const flagOf = (my: number, op: number): number => my > op ? 2 : my === op ? 1 : 0

function simFootball(ev: TelemEvent[]): ScoreResult {
  let dec = 0, g1 = -1
  let f0 = 0, f1 = 0, f2 = 0, sh1 = 0, poss = 0, B = 0.5
  for (const e of ev) {
    if (e[0] === 'dec') {
      if (dec >= 3) return { ok: false, score: 0, reason: 'overrun' }
      const seq = Math.round(Number(e[2]) || 0), idx = Math.round(Number(e[3]) || 0)
      if (!(idx >= 0 && idx <= 2)) return { ok: false, score: 0, reason: 'bad_dec' }
      if (seq === 0) f0 = idx; else if (seq === 1) f1 = idx; else if (seq === 2) f2 = idx
      else return { ok: false, score: 0, reason: 'bad_dec' }
      dec++
    } else if (e[0] === 'fbend') {
      if (g1 >= 0) return { ok: false, score: 0, reason: 'dup_end' }
      g1 = Math.round(Number(e[2]) || 0)
      const g2 = Math.round(Number(e[3]) || 0)
      sh1 = Math.round(Number(e[4]) || 0); poss = Math.round(Number(e[5]) || 0)
      B = clampB(Number(e[6]) || 0) ?? -1
      if (B < 0) return { ok: false, score: 0, reason: 'bad_base' }
      if (!(g1 >= 0 && g1 <= 10 && g2 >= 0 && g2 <= 8 && sh1 >= 0 && sh1 <= 22 && poss >= 0 && poss <= 6500))
        return { ok: false, score: 0, reason: 'impossible_stats' }
      const perf = Math.round(sh1 * 9 + poss / 90 * 0.6)
      const score = Math.max(150, Math.round((g1 > g2 ? 660 + g1 * 70 : g1 === g2 ? 430 : 200) + Math.min(140, perf) + B * 80))
      return { ok: true, score }
    }
  }
  return { ok: false, score: 0, reason: 'no_end' }
}
function simRace(ev: TelemEvent[]): ScoreResult {
  let plan = -1, mids = 0
  for (const e of ev) {
    if (e[0] === 'dec') {
      const seq = Math.round(Number(e[2]) || 0), idx = Math.round(Number(e[3]) || 0)
      if (seq === 0) { if (!(idx >= 0 && idx <= 3)) return { ok: false, score: 0, reason: 'bad_dec' }; plan = idx }
      else if (seq === 1) { if (!(idx >= 0 && idx <= 2)) return { ok: false, score: 0, reason: 'bad_dec' }; mids++; if (mids > 2) return { ok: false, score: 0, reason: 'overrun' } }
      else return { ok: false, score: 0, reason: 'bad_dec' }
    } else if (e[0] === 'racend') {
      const place = Math.round(Number(e[2]) || 0), gap = Math.round(Number(e[3]) || 0)
      const B = clampB(Number(e[4]) || 0)
      if (!B) return { ok: false, score: 0, reason: 'bad_base' }
      if (!(place >= 1 && place <= 4 && gap >= 0 && gap <= 100)) return { ok: false, score: 0, reason: 'impossible_stats' }
      const score = Math.max(140, Math.round((5 - place) * 150 + Math.max(0, 28 - gap * 0.4) + B * 110))
      return { ok: true, score }
    }
  }
  return { ok: false, score: 0, reason: 'no_end' }
}
const RISKS = [28, 56, 84]
function simRounds(max: number) {
  return (ev: TelemEvent[]): ScoreResult => {
    let i = 0, my = 0, op = 0
    for (const e of ev) {
      if (e[0] === 'rnd') {
        if (i > 2) return { ok: false, score: 0, reason: 'overrun' }
        const ri = Math.round(Number(e[2]) || 0)
        if (ri !== i) return { ok: false, score: 0, reason: 'bad_round' }
        const opt = Math.round(Number(e[3]) || 0)
        if (!(opt >= 0 && opt <= 2)) return { ok: false, score: 0, reason: 'bad_dec' }
        const fail = Math.round(Number(e[4]) || 0)
        const myGain = Math.round(Number(e[5]) || 0), opGain = Math.round(Number(e[6]) || 0)
        const risk = RISKS[opt]
        if (fail) {
          if (myGain !== Math.round(max * risk / 100 * 0.1)) return { ok: false, score: 0, reason: 'bad_gain' }
        } else {
          const capG = Math.round(max * risk / 100 * 0.94 * 0.66) + 1
          if (myGain < 0 || myGain > capG) return { ok: false, score: 0, reason: 'bad_gain' }
        }
        const capO = Math.round(max * 0.84 * 0.82) + 1
        if (opGain < 0 || opGain > capO) return { ok: false, score: 0, reason: 'bad_gain' }
        my += myGain; op += opGain; i++
      } else if (e[0] === 'rndend') {
        if (i !== 3) return { ok: false, score: 0, reason: 'overrun' }
        const flag = Math.round(Number(e[2]) || 0)
        const B = clampB(Number(e[3]) || 0)
        if (!B) return { ok: false, score: 0, reason: 'bad_base' }
        if (flag !== flagOf(my, op)) return { ok: false, score: 0, reason: 'flag_mismatch' }
        const score = Math.max(140, Math.round((my / max) * 600 + (flag === 2 ? 300 : flag === 1 ? 180 : 60) + B * 80))
        return { ok: true, score }
      }
    }
    return { ok: false, score: 0, reason: 'no_end' }
  }
}
function simDuel(need: number, maxEx: number) {
  return (ev: TelemEvent[]): ScoreResult => {
    let ex = 0, mw = 0
    for (const e of ev) {
      if (e[0] === 'du') {
        ex++
        if (ex > maxEx) return { ok: false, score: 0, reason: 'overrun' }
        const w = Math.round(Number(e[2]) || 0) ? 1 : 0
        mw += w
        if (mw > need) return { ok: false, score: 0, reason: 'overrun' }
      } else if (e[0] === 'duend') {
        const ow = ex - mw
        const flag = Math.round(Number(e[2]) || 0)
        const B = clampB(Number(e[3]) || 0)
        if (!B) return { ok: false, score: 0, reason: 'bad_base' }
        if (ow > need) return { ok: false, score: 0, reason: 'overrun' }
        if (mw < need && ow < need && ex !== maxEx) return { ok: false, score: 0, reason: 'overrun' }
        if (flag !== flagOf(mw, ow)) return { ok: false, score: 0, reason: 'flag_mismatch' }
        const score = Math.max(140, Math.round((mw / need) * 540 + (flag === 2 ? 320 : flag === 1 ? 190 : 70) + B * 80))
        return { ok: true, score }
      }
    }
    return { ok: false, score: 0, reason: 'no_end' }
  }
}
const SIM_RECALC: Record<string, (ev: TelemEvent[]) => ScoreResult> = {
  football: simFootball,
  sprint: simRace, swim: simRace, cycling: simRace,
  weight: simRounds(1000), archery: simRounds(900), gym: simRounds(900), lj: simRounds(900),
  volley: simDuel(3, 6), wrestle: simDuel(2, 4), chess: simDuel(2, 4),
}
const SIM_END = new Set(['fbend', 'racend', 'rndend', 'duend'])

/* ============================================================
   O3 — نسل دوم امتیاز sim (PHASE 2/3/15/16/19/20/46/47):
   بدون کف مشارکتی، وزن واقعی مهارت (کیفیت تصمیم + تاخیر تصمیم +
   کمبو + کلچ) و وزن کم برای نتیجه‌ی شانسی (RNG فقط درام، نه امتیاز).
   از SIM_V2_ED به بعد فعال است تا امتیازهای درون یک دوره هم‌مقیاس
   بمانند (P24) — دوره‌های قدیمی با v1 بازمحاسبه می‌شوند.
   همه‌ی ورودی‌ها همان تله‌متری O1 است؛ قواعد L1..L9 بدون تغییر.
   آینه‌ی دقیق همین اعداد در کلاینت: window.WD60_SCORE (بلوک v60-o2).
   ============================================================ */
export const SIM_V2_ED = 10
export interface ScorePart { k: string; l: string; pts: number }
export type V2ScoreResult = ScoreResult & { parts?: ScorePart[] }
const RISKS_V2 = [28, 56, 84]

function v2Race(ev: TelemEvent[]): V2ScoreResult {
  let plan = -1, mids = 0, lastDecT = -1, latSum = 0, latN = 0
  let place = 0, gap = 0, B: number | null = null, ended = false
  for (const e of ev) {
    if (e[0] === 'dec') {
      const seq = Math.round(Number(e[2]) || 0), idx = Math.round(Number(e[3]) || 0)
      if (seq === 0) { if (!(idx >= 0 && idx <= 3)) return { ok: false, score: 0, reason: 'bad_dec' }; plan = idx }
      else if (seq === 1) { if (!(idx >= 0 && idx <= 2)) return { ok: false, score: 0, reason: 'bad_dec' }; mids++; if (mids > 2) return { ok: false, score: 0, reason: 'overrun' } }
      else return { ok: false, score: 0, reason: 'bad_dec' }
      if (lastDecT >= 0) { latSum += Math.max(0, Number(e[1]) - lastDecT); latN++ }
      lastDecT = Number(e[1])
    } else if (e[0] === 'racend') {
      place = Math.round(Number(e[2]) || 0); gap = Math.round(Number(e[3]) || 0)
      B = clampB(Number(e[4]) || 0)
      if (!B) return { ok: false, score: 0, reason: 'bad_base' }
      if (!(place >= 1 && place <= 4 && gap >= 0 && gap <= 100)) return { ok: false, score: 0, reason: 'impossible_stats' }
      ended = true
      break
    }
  }
  if (!ended) return { ok: false, score: 0, reason: 'no_end' }
  const bR = B ?? 0 /* داخل حلقه null بودن رد شده — اینجا همیشه عدد است */
  const PLACE = [620, 440, 250, 60]
  const placePts = PLACE[place - 1]
  const gapPts = Math.max(0, 26 - Math.round(gap * 0.5))
  const dqPts = 30 + mids * 30
  const latAvg = latN > 0 ? latSum / latN : 99999
  const fastPts = Math.round(60 * (1 - Math.min(1, latAvg / 12000)))
  const basePts = Math.round(bR * 80)
  return { ok: true, score: placePts + gapPts + dqPts + fastPts + basePts, parts: [
    { k: 'place', l: 'نتیجه‌ی مسابقه (جایگاه ' + place + ')', pts: placePts },
    { k: 'gap', l: 'فاصله با صدر', pts: gapPts },
    { k: 'dq', l: 'کیفیت تصمیم (' + mids + ' تصمیم میانی)', pts: dqPts },
    { k: 'fast', l: 'سرعت تصمیم‌گیری', pts: fastPts },
    { k: 'base', l: 'آمار پایه (وزن کم)', pts: basePts },
  ] }
}
function v2Rounds(max: number) {
  return (ev: TelemEvent[]): V2ScoreResult => {
    let i = 0, my = 0, op = 0, streak = 0, sum = 0, prevT = -1
    let flag = -1, B: number | null = null, ended = false
    const parts: ScorePart[] = []
    for (const e of ev) {
      if (e[0] === 'rnd') {
        if (i > 2) return { ok: false, score: 0, reason: 'overrun' }
        const ri = Math.round(Number(e[2]) || 0)
        if (ri !== i) return { ok: false, score: 0, reason: 'bad_round' }
        const opt = Math.round(Number(e[3]) || 0)
        if (!(opt >= 0 && opt <= 2)) return { ok: false, score: 0, reason: 'bad_dec' }
        const fail = Math.round(Number(e[4]) || 0)
        const myGain = Math.round(Number(e[5]) || 0), opGain = Math.round(Number(e[6]) || 0)
        const risk = RISKS_V2[opt]
        if (fail) {
          if (myGain !== Math.round(max * risk / 100 * 0.1)) return { ok: false, score: 0, reason: 'bad_gain' }
        } else {
          const capG = Math.round(max * risk / 100 * 0.94 * 0.66) + 1
          if (myGain < 0 || myGain > capG) return { ok: false, score: 0, reason: 'bad_gain' }
        }
        const capO = Math.round(max * 0.84 * 0.82) + 1
        if (opGain < 0 || opGain > capO) return { ok: false, score: 0, reason: 'bad_gain' }
        /* — امتیاز نسل ۲: ریسک‌پذیری هوشمند + سرعت تصمیم + کمبو + کلچ — */
        const lat = Math.max(0, Number(e[1]) - (prevT < 0 ? 0 : prevT))
        prevT = Number(e[1])
        let pts: number
        if (fail) {
          pts = -Math.round(max * (risk / 100) * 0.06)
          streak = 0
        } else {
          const latK = 1 + 0.25 * (1 - Math.min(1, lat / 15000))
          pts = Math.round(max * (risk / 100) * 0.30 * latK)
          if (streak >= 1) pts += Math.min(2, streak) * Math.round(max * 0.03) /* کمبو (P19) */
          streak++
          if (i === 2) pts += Math.round(max * 0.04) /* کلچ: راند آخر (P20) */
        }
        sum += pts
        parts.push({ k: 'r' + i, l: 'راند ' + (i + 1) + (fail ? ' — ناموفق' : ' — موفق'), pts })
        my += myGain; op += opGain; i++
      } else if (e[0] === 'rndend') {
        if (i !== 3) return { ok: false, score: 0, reason: 'overrun' }
        flag = Math.round(Number(e[2]) || 0)
        B = clampB(Number(e[3]) || 0)
        if (!B) return { ok: false, score: 0, reason: 'bad_base' }
        if (flag !== flagOf(my, op)) return { ok: false, score: 0, reason: 'flag_mismatch' }
        ended = true
        break
      }
    }
    if (!ended) return { ok: false, score: 0, reason: 'no_end' }
    const winPts = flag === 2 ? Math.round(max * 0.10) : flag === 1 ? Math.round(max * 0.05) : 0
    parts.push({ k: 'win', l: flag === 2 ? 'نتیجه: برد' : flag === 1 ? 'نتیجه: مساوی' : 'نتیجه: باخت', pts: winPts })
    return { ok: true, score: Math.max(0, sum + winPts), parts }
  }
}
function v2Duel(need: number, maxEx: number) {
  return (ev: TelemEvent[]): V2ScoreResult => {
    let ex = 0, mw = 0, streak = 0, sum = 0, lastT = -1
    let flag = -1, B: number | null = null, ended = false
    const parts: ScorePart[] = []
    for (const e of ev) {
      if (e[0] === 'du') {
        ex++
        if (ex > maxEx) return { ok: false, score: 0, reason: 'overrun' }
        const w = Math.round(Number(e[2]) || 0) ? 1 : 0
        if (lastT >= 0) { /* تاخیر تصمیم بین تبادل‌ها (P3) */
          const lat = Math.max(0, Number(e[1]) - lastT)
          if (w) sum += Math.round(40 * (1 - Math.min(1, lat / 8000)))
        }
        lastT = Number(e[1])
        if (w) {
          sum += 240
          if (streak >= 1) sum += Math.min(2, streak) * 35 /* کمبو (P19) */
          streak++
        } else {
          sum -= 50
          streak = 0
        }
        mw += w
        if (mw > need) return { ok: false, score: 0, reason: 'overrun' }
        parts.push({ k: 'x' + ex, l: 'تبادل ' + ex + (w ? ' — برد' : ' — باخت'), pts: w ? 240 : -50 })
      } else if (e[0] === 'duend') {
        const ow = ex - mw
        flag = Math.round(Number(e[2]) || 0)
        B = clampB(Number(e[3]) || 0)
        if (!B) return { ok: false, score: 0, reason: 'bad_base' }
        if (ow > need) return { ok: false, score: 0, reason: 'overrun' }
        if (mw < need && ow < need && ex !== maxEx) return { ok: false, score: 0, reason: 'overrun' }
        if (flag !== flagOf(mw, ow)) return { ok: false, score: 0, reason: 'flag_mismatch' }
        ended = true
        break
      }
    }
    if (!ended) return { ok: false, score: 0, reason: 'no_end' }
    const winPts = flag === 2 ? 170 : flag === 1 ? 80 : 0
    parts.push({ k: 'win', l: flag === 2 ? 'نتیجه: برد' : flag === 1 ? 'نتیجه: مساوی' : 'نتیجه: باخت', pts: winPts })
    return { ok: true, score: Math.max(0, sum + winPts), parts }
  }
}
function v2Football(ev: TelemEvent[]): V2ScoreResult {
  let dec = 0, g1 = -1, lastDecT = -1, latSum = 0, latN = 0
  let f0 = 0, f1 = 0, f2 = 0, sh1 = 0, poss = 0, B: number | null = null, ended = false
  for (const e of ev) {
    if (e[0] === 'dec') {
      if (dec >= 3) return { ok: false, score: 0, reason: 'overrun' }
      const seq = Math.round(Number(e[2]) || 0), idx = Math.round(Number(e[3]) || 0)
      if (!(idx >= 0 && idx <= 2)) return { ok: false, score: 0, reason: 'bad_dec' }
      if (seq === 0) f0 = idx; else if (seq === 1) f1 = idx; else if (seq === 2) f2 = idx
      else return { ok: false, score: 0, reason: 'bad_dec' }
      if (lastDecT >= 0) { latSum += Math.max(0, Number(e[1]) - lastDecT); latN++ }
      lastDecT = Number(e[1])
      dec++
    } else if (e[0] === 'fbend') {
      if (g1 >= 0) return { ok: false, score: 0, reason: 'dup_end' }
      g1 = Math.round(Number(e[2]) || 0)
      const g2 = Math.round(Number(e[3]) || 0)
      sh1 = Math.round(Number(e[4]) || 0); poss = Math.round(Number(e[5]) || 0)
      B = clampB(Number(e[6]) || 0) ?? -1
      if (B < 0) return { ok: false, score: 0, reason: 'bad_base' }
      if (!(g1 >= 0 && g1 <= 10 && g2 >= 0 && g2 <= 8 && sh1 >= 0 && sh1 <= 22 && poss >= 0 && poss <= 6500))
        return { ok: false, score: 0, reason: 'impossible_stats' }
      const win = g1 > g2, draw = g1 === g2
      const outcome = win ? 460 + g1 * 55 : draw ? 280 : 90
      const perf = Math.min(170, Math.round(sh1 * 8 + poss / 90 * 0.5))
      const latAvg = latN > 0 ? latSum / latN : 99999
      const latPts = Math.round(50 * (1 - Math.min(1, latAvg / 10000)))
      const basePts = Math.round(B * 70)
      ended = true
      return { ok: true, score: outcome + perf + latPts + basePts, parts: [
        { k: 'out', l: 'نتیجه (' + g1 + '–' + g2 + ')', pts: outcome },
        { k: 'perf', l: 'شوت و مالکیت', pts: perf },
        { k: 'fast', l: 'سرعت تصمیم‌گیری', pts: latPts },
        { k: 'base', l: 'آمار پایه (وزن کم)', pts: basePts },
      ] }
    }
  }
  return { ok: false, score: 0, reason: 'no_end' }
}
const SIM_V2: Record<string, (ev: TelemEvent[]) => V2ScoreResult> = {
  football: v2Football,
  sprint: v2Race, swim: v2Race, cycling: v2Race,
  weight: v2Rounds(1000), archery: v2Rounds(900), gym: v2Rounds(900), lj: v2Rounds(900),
  volley: v2Duel(3, 6), wrestle: v2Duel(2, 4), chess: v2Duel(2, 4),
}
/* ——— ممیزی اصلی: تله‌متری → امتیازِ سروری ———
   edition ≥ SIM_V2_ED → فرمول نسل ۲ (بدون کف، مهارت‌محور)؛
   دوره‌های قدیمی همان v1 — هر دو از همان قواعد L1..L9 می‌گذرند. */
export function computeScore(key: string, tel: Telemetry | null | undefined, edition?: number): ScoreResult & { parts?: ScorePart[] } {
  if (!tel || typeof tel !== 'object') return { ok: false, score: 0, reason: 'no_telemetry' }
  const ev = Array.isArray(tel.ev) ? tel.ev : null
  if (!ev) return { ok: false, score: 0, reason: 'no_telemetry' }
  if (ev.length > EV_CAP) return { ok: false, score: 0, reason: 'telemetry_overflow' }
  const fn0 = RECALC[key]
  if (!fn0) return { ok: false, score: 0, reason: 'discipline' }
  /* مدل مسابقه: اگر نشانگر پایان sim وجود دارد → اعتبارسنج شبیه‌سازی، وگرنه مدل tap */
  const isSim = ev.some((e2) => Array.isArray(e2) && SIM_END.has(String(e2[0])))
  if (isSim && typeof edition === 'number' && edition >= SIM_V2_ED) {
    const v2fn = SIM_V2[key]
    if (!v2fn) return { ok: false, score: 0, reason: 'discipline' }
    return withL3L4(v2fn, key, tel, ev)
  }
  const fn = isSim ? SIM_RECALC[key] : fn0
  if (!fn) return { ok: false, score: 0, reason: 'discipline' }
  return withL3L4(fn, key, tel, ev)
}
/* قواعد مشترک L3/L4 (زمان‌بندی + مونوتونیک + نرخ) — تک‌مسیر برای هر دو نسل */
function withL3L4(fn: (ev: TelemEvent[]) => ScoreResult, key: string, tel: Telemetry, ev: TelemEvent[]): ScoreResult & { parts?: ScorePart[] } {
  /* (L3) زمان‌بندی کلی: طول مسابقه در بازه‌ی مجاز */
  const s = Number(tel.s) || 0, e = Number(tel.e) || 0
  const dur = e - s
  if (!(dur >= 0)) return { ok: false, score: 0, reason: 'bad_duration' }
  const dd = DUR[key]
  if (dd && (dur < dd[0] * 0.5 || dur > dd[1])) return { ok: false, score: 0, reason: 'bad_duration' }
  /* (L3/L4) زمان مونوتونیک + فاصله‌ی حداقل رویدادها + اعداد متناهی */
  let lastT = -1
  const lastOfType: Record<string, number> = {}
  for (const e2 of ev) {
    if (!Array.isArray(e2) || typeof e2[0] !== 'string') return { ok: false, score: 0, reason: 'bad_event' }
    const t = Number(e2[1])
    if (!Number.isFinite(t)) return { ok: false, score: 0, reason: 'bad_event' }
    if (t < lastT) return { ok: false, score: 0, reason: 'non_monotonic' }
    lastT = t
    for (let i = 2; i < e2.length; i++) {
      const v = e2[i]
      if (typeof v === 'number' && !Number.isFinite(v)) return { ok: false, score: 0, reason: 'nan' }
    }
    const gap = (EV_GAP[key] || {})[String(e2[0])]
    if (gap && t - (lastOfType[String(e2[0])] ?? -1e9) < gap) return { ok: false, score: 0, reason: 'impossible_rate' }
    lastOfType[String(e2[0])] = t
  }
  if (e < lastT - 50) return { ok: false, score: 0, reason: 'bad_duration' }
  return fn(ev)
}
