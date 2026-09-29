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
  /* V89 — Olympics V2: ۲۵ رشته‌ی جدید */
  hurdles: [4000, 60000], highjump: [2000, 480000], javelin: [3000, 480000], discus: [3000, 480000],
  shotput: [2000, 480000], boxing: [3000, 480000], fencing: [2000, 480000], judo: [2000, 480000],
  reaction: [2000, 60000], shooting: [3000, 480000], movingtarget: [3000, 480000], sniper: [2000, 480000],
  rapidtarget: [3000, 480000], swim50: [2000, 60000], diving: [3000, 480000], rowing: [4000, 480000],
  kayak: [4000, 480000], moto: [5000, 120000], rally: [5000, 120000], formula: [5000, 120000],
  boat: [4000, 120000], balance: [3000, 120000], timing: [3000, 480000], memory: [3000, 480000], run400: [4000, 120000],
}
/* حداقل فاصله‌ی بین رویدادهای هم‌نوع (ms) — ضد اتوکلیک/اسکریپت (L4) */
const EV_GAP: Record<string, Record<string, number>> = {
  sprint: { p: 55 }, swim: { p: 55 }, archery: { shot: 250 }, gym: { mv: 60 },
  weight: { lift: 220 }, cycling: { pedal: 90 }, volley: { hit: 180 }, wrestle: {}, chess: {}, football: { shot: 250 }, lj: { jump: 700 },
  /* V89 — Olympics V2 */
  hurdles: { p: 55, jump: 300 }, run400: { p: 60 }, highjump: { jump: 1200 }, javelin: { throw: 1200 },
  discus: { throw: 1200 }, shotput: { throw: 1000 }, boxing: { ex: 400 }, fencing: { touch: 350 },
  judo: { throw: 1000 }, reaction: { go: 250 }, shooting: { shot: 350 }, movingtarget: { hit: 140 },
  sniper: { shot: 700 }, rapidtarget: { hit: 85 }, swim50: { p: 80 }, diving: { dive: 1100 },
  rowing: { stroke: 210 }, kayak: { gate: 110 }, moto: { ob: 55 }, rally: { corner: 380 },
  formula: { turn: 280 }, boat: { stroke: 190 }, balance: { round: 700 }, timing: { stop: 240 }, memory: { seq: 280 },
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

/* ============================================================
   V89 — Olympics V2: بازمحاسبه‌ی پایه (fallback نسل ۱) برای ۲۵ رشته‌ی جدید.
   مسیر زنده = داوران SKILL3 با seed سرور (پایین)؛ این‌ها فقط برای
   hasRecalc() و دوره‌های خیلی قدیمی‌اند — همان سطح اعتماد نسل ۱:
   بازه‌ی سخت + شمارش + پایان‌های رویداد.
   ============================================================ */
function best3(vals: number[], mul: number): number {
  vals.sort((a, b) => b - a)
  let s = 0
  for (let i = 0; i < Math.min(3, vals.length); i++) s += vals[i]
  return Math.round(s * mul)
}
function rHurdles(ev: TelemEvent[]): ScoreResult {
  let taps = 0, clean = 0
  for (const e of ev) {
    if (e[0] === 'p') taps++
    else if (e[0] === 'jump') { const ok = Number(e[2]) ? 1 : 0; clean += ok; if (clean + (taps - clean) > 400) return { ok: false, score: 0, reason: 'overrun' } }
  }
  if (taps > 220 || clean > 8) return { ok: false, score: 0, reason: 'overrun' }
  return { ok: true, score: taps * 8 + clean * 240 }
}
function rRun400(ev: TelemEvent[]): ScoreResult {
  let n = 0, sum = 0
  for (const e of ev) {
    if (e[0] !== 'p') continue
    const q = Number(e[2])
    if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    sum += q; n++
    if (n > 320) return { ok: false, score: 0, reason: 'overrun' }
  }
  return { ok: true, score: Math.round(sum * 14) }
}
function rHighjump(ev: TelemEvent[]): ScoreResult {
  const hs: number[] = []
  for (const e of ev) {
    if (e[0] !== 'jump') continue
    const h = Math.round(Number(e[2]) || 0)
    if (!(h >= 100 && h <= 250)) return { ok: false, score: 0, reason: 'bad_height' }
    hs.push(h)
    if (hs.length > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!hs.length) return { ok: false, score: 0, reason: 'no_jump' }
  return { ok: true, score: Math.max(...hs) * 6 + hs.filter((h) => h >= 180).length * 60 }
}
function rJavelin(ev: TelemEvent[]): ScoreResult {
  const ds: number[] = []
  for (const e of ev) {
    if (e[0] !== 'throw') continue
    const d = Number(e[2]) || 0
    if (!(d >= 30 && d <= 100)) return { ok: false, score: 0, reason: 'bad_dist' }
    ds.push(d)
    if (ds.length > 5) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!ds.length) return { ok: false, score: 0, reason: 'no_throw' }
  return { ok: true, score: best3(ds, 12) }
}
function rDiscus(ev: TelemEvent[]): ScoreResult {
  const ds: number[] = []
  for (const e of ev) {
    if (e[0] !== 'throw') continue
    const d = Number(e[2]) || 0
    if (!(d >= 20 && d <= 75)) return { ok: false, score: 0, reason: 'bad_dist' }
    ds.push(d)
    if (ds.length > 5) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!ds.length) return { ok: false, score: 0, reason: 'no_throw' }
  return { ok: true, score: best3(ds, 14) }
}
function rShotput(ev: TelemEvent[]): ScoreResult {
  const ds: number[] = []
  for (const e of ev) {
    if (e[0] !== 'throw') continue
    const d = Number(e[2]) || 0
    if (!(d >= 6 && d <= 25)) return { ok: false, score: 0, reason: 'bad_dist' }
    ds.push(d)
    if (ds.length > 5) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!ds.length) return { ok: false, score: 0, reason: 'no_throw' }
  return { ok: true, score: best3(ds, 40) }
}
function rBoxing(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'ex') continue
    const win = Number(e[3]) ? 1 : 0, rt = Number(e[4]) || 0
    if (!(rt >= 0 && rt <= 3000)) return { ok: false, score: 0, reason: 'bad_rt' }
    if (win) pts += 110 + Math.max(0, Math.round((900 - rt) / 10))
    n++
    if (n > 9) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_exchange' }
  return { ok: true, score: pts }
}
function rFencing(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'touch') continue
    const win = Number(e[3]) ? 1 : 0, rt = Number(e[4]) || 0
    if (!(rt >= 0 && rt <= 3000)) return { ok: false, score: 0, reason: 'bad_rt' }
    if (win) pts += 130 + Math.max(0, Math.round((700 - rt) / 8))
    n++
    if (n > 8) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_touch' }
  return { ok: true, score: pts }
}
function rJudo(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'throw') continue
    const q = Number(e[2])
    if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    pts += Math.round(300 * q); n++
    if (n > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_throw' }
  return { ok: true, score: pts }
}
function rReaction(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'go') continue
    const rt = Number(e[2]) || 0
    if (!(rt >= 0 && rt <= 5000)) return { ok: false, score: 0, reason: 'bad_rt' }
    if (rt >= 100) pts += Math.max(20, Math.round((550 - rt) * 1.6))
    n++
    if (n > 5) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_round' }
  return { ok: true, score: pts }
}
function rShooting(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    const q = Number(e[2]) || 0
    if (!(q >= 0 && q <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    pts += Math.round(q * 2.2); n++
    if (n > 5) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_shot' }
  return { ok: true, score: pts }
}
function rMovingTarget(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'hit') continue
    const q = Number(e[2]) || 0
    if (!(q >= 0 && q <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    pts += Math.round(q * 1.5); n++
    if (n > 10) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_hit' }
  return { ok: true, score: pts }
}
function rSniper(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    const q = Number(e[2]) || 0
    if (!(q >= 0 && q <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    pts += Math.round(q * 3.4); n++
    if (n > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_shot' }
  return { ok: true, score: pts }
}
function rRapidTarget(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] !== 'hit') continue
    const idx = Math.round(Number(e[2]) || 0), rt = Number(e[3]) || 0
    if (!(idx >= 0 && idx <= 14)) return { ok: false, score: 0, reason: 'bad_idx' }
    if (seen.has(idx)) return { ok: false, score: 0, reason: 'dup_target' }
    if (!(rt >= 60 && rt <= 4000)) return { ok: false, score: 0, reason: 'bad_rt' }
    seen.add(idx)
    pts += Math.max(10, Math.round((900 - rt) / 3)); n++
    if (n > 15) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_hit' }
  return { ok: true, score: pts }
}
function rSwim50(ev: TelemEvent[]): ScoreResult {
  let n = 0, sum = 0, lastT = -1
  for (const e of ev) {
    if (e[0] !== 'p') continue
    const t = Number(e[1]) || 0
    if (lastT >= 0) { const g = t - lastT; if (g < 80 || g > 1500) return { ok: false, score: 0, reason: 'bad_gap' }; sum += Math.max(0, 20 - (g - 110) / 22) }
    lastT = t; n++
    if (n > 40) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (n < 5) return { ok: false, score: 0, reason: 'no_swim' }
  return { ok: true, score: Math.round(sum) }
}
function rDiving(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'dive') continue
    const ok = Math.round(Number(e[2]) || 0), entry = Number(e[3])
    const len = Math.round(Number(e[4]) || 0)
    if (!(ok >= 0 && ok <= 6) || len < 4 || len > 6 || !(entry >= 0 && entry <= 1)) return { ok: false, score: 0, reason: 'bad_dive' }
    if (ok > len) return { ok: false, score: 0, reason: 'bad_dive' }
    pts += ok * 90 + Math.round(entry * 160); n++
    if (n > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_dive' }
  return { ok: true, score: pts }
}
function rRowing(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0, lastSide = -1
  for (const e of ev) {
    if (e[0] !== 'stroke') continue
    const side = Math.round(Number(e[2]) || 0), q = Number(e[3])
    if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
    if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
    if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    lastSide = side; pts += Math.round(q * 16); n++
    if (n > 26) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (n < 6) return { ok: false, score: 0, reason: 'no_row' }
  return { ok: true, score: pts }
}
function rKayak(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0, strokes = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] === 'p') { strokes++; if (strokes > 300) return { ok: false, score: 0, reason: 'overrun' } }
    else if (e[0] === 'gate') {
      const idx = Math.round(Number(e[2]) || 0), ok = Number(e[3]) ? 1 : 0
      if (idx !== n) return { ok: false, score: 0, reason: 'bad_gate' }
      if (seen.has(idx)) return { ok: false, score: 0, reason: 'dup_gate' }
      seen.add(idx); if (ok) pts += 110
      n++
      if (n > 10) return { ok: false, score: 0, reason: 'overrun' }
    }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_gate' }
  return { ok: true, score: pts + Math.min(120, strokes * 6) }
}
function rMoto(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'ob') continue
    const pass = Number(e[2]) ? 1 : 0, near = Number(e[3]) ? 1 : 0
    pts += pass * 70 + (pass && near ? 30 : 0); n++
    if (n > 60) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_obstacle' }
  return { ok: true, score: pts }
}
function rRally(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] !== 'corner') continue
    const idx = Math.round(Number(e[2]) || 0), q = Number(e[3])
    if (!(idx >= 0 && idx <= 5)) return { ok: false, score: 0, reason: 'bad_idx' }
    if (seen.has(idx)) return { ok: false, score: 0, reason: 'dup_corner' }
    if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    seen.add(idx); pts += Math.round(q * 130); n++
    if (n > 6) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_corner' }
  return { ok: true, score: pts }
}
function rFormula(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] !== 'turn') continue
    const idx = Math.round(Number(e[2]) || 0), q = Number(e[3])
    if (!(idx >= 0 && idx <= 7)) return { ok: false, score: 0, reason: 'bad_idx' }
    if (seen.has(idx)) return { ok: false, score: 0, reason: 'dup_turn' }
    if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    seen.add(idx); pts += Math.round(q * 140); n++
    if (n > 8) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_turn' }
  return { ok: true, score: pts }
}
function rBoat(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'stroke') continue
    const q = Number(e[2])
    if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    pts += Math.round(q * 15); n++
    if (n > 22) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (n < 6) return { ok: false, score: 0, reason: 'no_row' }
  return { ok: true, score: pts }
}
function rBalance(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'round') continue
    const ms = Number(e[2]) || 0, q = Number(e[3])
    if (!(ms >= 0 && ms <= 30000) || !(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_round' }
    pts += Math.round(ms / 40) + Math.round(q * 50); n++
    if (n > 3) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_round' }
  return { ok: true, score: pts }
}
function rTiming(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] !== 'stop') continue
    const idx = Math.round(Number(e[2]) || 0), q = Number(e[3]) || 0
    if (idx !== n) return { ok: false, score: 0, reason: 'bad_round' }
    if (!(q >= 0 && q <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    seen.add(idx); pts += Math.round(q * 10) + (q >= 95 ? 40 : 0); n++
    if (n > 8) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_stop' }
  return { ok: true, score: pts }
}
function rMemory(ev: TelemEvent[]): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'seq') continue
    const len = Math.round(Number(e[2]) || 0), ok = Math.round(Number(e[3]) || 0)
    if (!(len >= 3 && len <= 10) || !(ok >= 0 && ok <= len)) return { ok: false, score: 0, reason: 'bad_seq' }
    pts += ok * 40; n++
    if (n > 8) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_seq' }
  return { ok: true, score: pts }
}

const RECALC: Record<string, (ev: TelemEvent[]) => ScoreResult> = {
  sprint: rSprint, swim: rSwim, archery: rArchery, gym: rGym, weight: rWeight,
  cycling: rCycling, chess: rChess, volley: rVolley, football: rFootball, wrestle: rWrestle, lj: rLJ,
  /* V89 — Olympics V2 */
  hurdles: rHurdles, run400: rRun400, highjump: rHighjump, javelin: rJavelin, discus: rDiscus, shotput: rShotput,
  boxing: rBoxing, fencing: rFencing, judo: rJudo, reaction: rReaction,
  shooting: rShooting, movingtarget: rMovingTarget, sniper: rSniper, rapidtarget: rRapidTarget,
  swim50: rSwim50, diving: rDiving, rowing: rRowing, kayak: rKayak,
  moto: rMoto, rally: rRally, formula: rFormula, boat: rBoat,
  balance: rBalance, timing: rTiming, memory: rMemory,
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
/* ============================================================
   OLY3 — نسل سوم: Gameplay مهارتی واقعی (PHASE 1/2/6/13 رودمپ المپیک)
   اصل: سرور فقط ورودی‌های واقعی بازیکن (زمان‌بندی ضربه‌ها) را می‌گیرد و
   «فیزیک مسابقه» را خودش از روی serverSeed بازتولید می‌کند — باد کمان،
   نوسان میله، دروازه‌بان، بلوکر والیبال، طناب حریف و تخته‌ی پرش همگی
   تابع قطعیِ seed هستند. هیچ فلگ نتیجه‌ای از کلاینت باور نمی‌شود.
   فعال‌سازی: مدل tap و (دوره ≥ SKILL3_ED یا mode=train) — نسل‌های قبلی
   برای آرشیو/شبح دست‌نخورده می‌مانند.
   آینه‌ی بایت‌به‌بایت همین توابع در کلاینت: public/game/oly3.js
   ============================================================ */
export const SKILL3_ED = 10
export interface ScoreOpts { seed?: string; mode?: string }

function seedOf3(str: string): number {
  let h = 2166136261 >>> 0
  const s = String(str || '')
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}
function rngOf3(seed: string, salt: string): () => number {
  let a = seedOf3(seed + ':' + salt) | 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const clamp3 = (v: number, lo: number, hi: number) => v < lo ? lo : v > hi ? hi : v

/* ——— ۱) دو ۱۰۰ متر: واکنش به شلیک + گام‌های متناوب + ریتم ——— */
function v3Sprint(ev: TelemEvent[], _seed: string): ScoreResult {
  let goT = -1, fs = 0, strides = 0, lastT = -1, lastSide = -1, firstT = -1
  const gaps: number[] = []
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'go') { if (goT >= 0) return { ok: false, score: 0, reason: 'dup_go' }; goT = t }
    else if (e[0] === 'fs') fs = Math.max(fs, Math.round(Number(e[2]) || 0))
    else if (e[0] === 'p') {
      if (goT < 0) return { ok: false, score: 0, reason: 'no_go' }
      if (t < goT) return { ok: false, score: 0, reason: 'pre_go' }
      const side = Math.round(Number(e[2]) || 0)
      if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
      if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
      if (lastT < 0) {
        if (t - goT < 100) return { ok: false, score: 0, reason: 'impossible_reaction' } /* قانون دو و میدانی: زیر ۱۰۰ms = تقلبی */
        firstT = t
      } else {
        const g = t - lastT
        if (g < 150) return { ok: false, score: 0, reason: 'impossible_rate' }
        gaps.push(g)
      }
      lastT = t; lastSide = side; strides++
      if (strides > 120) return { ok: false, score: 0, reason: 'overrun' }
    }
  }
  if (goT < 0) return { ok: false, score: 0, reason: 'no_run' }
  if (fs >= 2) return { ok: true, score: 0, flags: ['dq_false_start'] } /* اخراج حتی بدون گام — نتیجه‌ی رسمی صفر */
  if (strides < 4) return { ok: false, score: 0, reason: 'no_run' }
  const dist = Math.min(100, strides * 1.9)
  const rt = firstT - goT
  const reactPts = rt <= 180 ? 100 : rt <= 250 ? 80 : rt <= 350 ? 60 : rt <= 500 ? 35 : 15
  let sum = 0; for (const g of gaps) sum += g
  const mean = gaps.length ? sum / gaps.length : 0
  let vs = 0; for (const g of gaps) vs += (g - mean) * (g - mean)
  const sd = gaps.length > 1 ? Math.sqrt(vs / gaps.length) : 0
  const rhythm = clamp3(1 - sd / 160, 0, 1)
  return { ok: true, score: Math.round(dist * 7.5) + reactPts + Math.round(rhythm * 180) }
}

/* ——— ۲) کمان: نوسان قطعی + کنترل نفس (hold) — سرور حلقه را از seed می‌سازد ——— */
function archRing3(seed: string, i: number, tRel: number, holdMs: number): number {
  const r = rngOf3(seed, 'arch:' + i)
  const f1 = 900 + r() * 700, f2 = 500 + r() * 500
  const p1 = r() * 6.28318, p2 = r() * 6.28318
  const wind = r() * 2 - 1
  const sway = 0.6 * Math.sin((tRel / f1) * 6.28318 + p1) + 0.4 * Math.sin((tRel / f2) * 6.28318 + p2)
  let amp = 1.0 - Math.min(1, holdMs / 2200) * 0.55
  if (holdMs > 2600) amp += Math.min(0.8, (holdMs - 2600) / 1000 * 0.18)
  const d = Math.abs(sway + wind * 0.35) * amp
  return Math.max(0, Math.round((1 - Math.min(1, d)) * 10))
}
function v3Archery(ev: TelemEvent[], seed: string): ScoreResult {
  let shot = 0, drawT = -1, pts = 0, all9 = true
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'draw') {
      const i = Math.round(Number(e[2]) || 0)
      if (i !== shot) return { ok: false, score: 0, reason: 'bad_draw' }
      drawT = t
    } else if (e[0] === 'shot') {
      if (drawT < 0) return { ok: false, score: 0, reason: 'no_draw' }
      const ringC = Math.round(Number(e[2]) || 0)
      if (!(ringC >= 0 && ringC <= 10)) return { ok: false, score: 0, reason: 'bad_ring' }
      const hold = t - drawT
      if (!(hold >= 40 && hold <= 12000)) return { ok: false, score: 0, reason: 'bad_hold' }
      const ringS = archRing3(seed, shot, t, hold)
      if (Math.abs(ringC - ringS) > 1) return { ok: false, score: 0, reason: 'ghost_shot' }
      pts += ringS * 20
      if (ringS < 9) all9 = false
      shot++; drawT = -1
      if (shot > 5) return { ok: false, score: 0, reason: 'too_many_shots' }
    }
  }
  if (shot === 0) return { ok: false, score: 0, reason: 'no_shots' }
  return { ok: true, score: pts + (shot === 5 && all9 ? 60 : 0) }
}

/* ——— ۳) شنا: ضربه‌های متناوب + ریتم + چرخش دیوار ——— */
function v3Swim(ev: TelemEvent[], _seed: string): ScoreResult {
  let n = 0, lastSide = -1, lastT = -1, turns = 0
  const gaps: number[] = []
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') {
      const side = Math.round(Number(e[2]) || 0)
      if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
      if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
      if (lastT >= 0) {
        const g = t - lastT
        if (g < 140) return { ok: false, score: 0, reason: 'impossible_rate' }
        gaps.push(g)
      }
      lastT = t; lastSide = side; n++
      if (n > 120) return { ok: false, score: 0, reason: 'overrun' }
    } else if (e[0] === 'turn') {
      const q = Number(e[2]) || 0
      if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_turn' }
      const walls = [16, 32, 48]
      if (turns >= 3) return { ok: false, score: 0, reason: 'overrun' }
      const lo = walls[turns] - 3, hi = walls[turns] + 3
      if (n < lo || n > hi) return { ok: false, score: 0, reason: 'bad_turn_pos' }
      turns++
    }
  }
  if (n < 6) return { ok: false, score: 0, reason: 'no_swim' }
  let sum = 0; for (const g of gaps) sum += g
  const mean = gaps.length ? sum / gaps.length : 0
  let vs = 0; for (const g of gaps) vs += (g - mean) * (g - mean)
  const sd = gaps.length > 1 ? Math.sqrt(vs / gaps.length) : 0
  const rhythm = clamp3(1 - sd / 170, 0, 1)
  const dist = Math.min(100, n * 1.55)
  let tPts = 0; /* سهم چرخش‌ها دوباره از تله‌متری جمع می‌شود */
  let ti = 0
  for (const e of ev) { if (e[0] === 'turn') { tPts += Math.round((Number(e[2]) || 0) * 27); ti++; if (ti >= turns) break } }
  return { ok: true, score: Math.round(dist * 7) + Math.round(rhythm * 200) + Math.min(81, tPts) }
}

/* ——— ۴) ژیمناستیک: روتین seed-محور + سختی انتخابی + کمبو ——— */
function gymMove3(seed: string, i: number): { type: number; dir: number } {
  const r = rngOf3(seed, 'gym:' + i)
  return { type: Math.floor(r() * 3), dir: Math.floor(r() * 4) } /* type: 0=سوایپ 1=نگه‌داشتن 2=تندزنی */
}
function v3Gym(ev: TelemEvent[], seed: string): ScoreResult {
  let lvl = 0, steps = 0, miss = 0, pts = 0, streak = 0, best = 0
  for (const e of ev) {
    if (e[0] === 'diff') {
      const l = Math.round(Number(e[2]) || 0)
      if (!(l >= 0 && l <= 2)) return { ok: false, score: 0, reason: 'bad_diff' }
      if (steps > 0) return { ok: false, score: 0, reason: 'late_diff' }
      lvl = l
    } else if (e[0] === 'mv') {
      const ok = Number(e[2]) ? 1 : 0, fast = Number(e[3]) ? 1 : 0
      /* OLY3: توالی حرکات seed-محور راستی‌آزمایی می‌شود — سوایپ اشتباه با ok=۱ = رد */
      const mi = Math.round(Number(e[4]) || 0), kind = Math.round(Number(e[5]) || 0)
      if (steps >= 10 || miss >= 4) return { ok: false, score: 0, reason: 'overrun' }
      if (!(mi >= 0 && mi <= 9)) return { ok: false, score: 0, reason: 'bad_seq' }
      if (mi !== steps) return { ok: false, score: 0, reason: 'bad_seq' }
      const mvS = gymMove3(seed, mi)
      if (kind !== mvS.type) return { ok: false, score: 0, reason: 'bad_seq' }
      if (mvS.type === 0 && ok) {
        const dir = Math.round(Number(e[6]) || 0)
        if (dir !== mvS.dir) return { ok: false, score: 0, reason: 'bad_dir' }
      }
      if (ok) { pts += 60 + fast * 25; streak++; if (streak > best) best = streak }
      else { pts -= 20; miss++; streak = 0 }
      steps++
    }
  }
  if (steps < 5) return { ok: false, score: 0, reason: 'no_routine' }
  const bonus = best >= 3 ? Math.min(80, (best - 2) * 15) : 0
  const mult = [1, 1.18, 1.35][lvl]
  return { ok: true, score: Math.max(0, Math.round((pts + bonus) * mult)) }
}

/* ——— ۵) وزنه‌برداری: نوسان میله قطعی از seed — دقت را سرور می‌سازد ——— */
function weightPos3(seed: string, i: number, tRel: number): number {
  const r = rngOf3(seed, 'wgt:' + i)
  const period = 900 + r() * 500
  const ph = r() * 6.28318
  return Math.sin((tRel / period) * 6.28318 + ph)
}
function v3Weight(ev: TelemEvent[], seed: string): ScoreResult {
  let lifts = 0, pts = 0, streak = 0
  for (const e of ev) {
    if (e[0] !== 'lift') continue
    const t = Number(e[1]) || 0
    const pC = Number(e[2])
    if (!(pC >= 0 && pC <= 1)) return { ok: false, score: 0, reason: 'bad_precision' }
    if (lifts >= 5) return { ok: false, score: 0, reason: 'too_many_lifts' }
    const pS = 1 - Math.min(1, Math.abs(weightPos3(seed, lifts, t)))
    if (Math.abs(pC - pS) > 0.2) return { ok: false, score: 0, reason: 'ghost_lift' }
    pts += Math.round(200 * pS)
    if (pS >= 0.8) { streak++; pts += Math.min(100, streak * 25) } else streak = 0
    lifts++
  }
  if (lifts === 0) return { ok: false, score: 0, reason: 'no_lifts' }
  return { ok: true, score: pts }
}

/* ——— ۶) دوچرخه‌سواری: ریتم در برابر مسیر seed-محور ——— */
function cycTarget3(seed: string, seg: number): number {
  const r = rngOf3(seed, 'cyc:' + seg)
  return [400, 520, 330, 300][Math.floor(r() * 4)]
}
function v3Cycling(ev: TelemEvent[], seed: string): ScoreResult {
  /* OLY3 v2 قرارداد: dt هیچ‌وقت از کلاینت پذیرفته نمی‌شود — سرور آن را از
     فاصله‌ی واقعی رویدادها می‌سازد؛ توقف طولانی = ریست ریتم (نه رد) */
  let n = 0, lastT = -1, sumQ = 0
  const qs: number[] = []
  for (const e of ev) {
    if (e[0] !== 'pedal') continue
    const t = Number(e[1]) || 0
    if (lastT >= 0) {
      const dt = t - lastT
      if (dt > 2600) { qs.length = 0; sumQ = 0; n = 0 } /* توقف/ساحل‌گیری — ریتم ریست */
      else {
        const seg = Math.floor(t / 3500)
        const q = clamp3(1 - Math.abs(dt - cycTarget3(seed, seg)) / 220, 0, 1)
        qs.push(q); sumQ += q; n++
        if (n > 160) return { ok: false, score: 0, reason: 'overrun' }
      }
    }
    lastT = t
  }
  if (n < 4) return { ok: true, score: 0 }
  const avg = sumQ / n
  let vs = 0; for (const q of qs) vs += (q - avg) * (q - avg)
  const sd = Math.sqrt(vs / n)
  const cons = clamp3(1 - sd / 0.35, 0, 1)
  return { ok: true, score: Math.round(avg * 800) + Math.round(cons * 200) }
}

/* ——— ۷) شطرنج: کتاب مات‌در-یک + انتخاب seed-محور ۳ سؤال ——— */
/* صفحه: ۶۴ کاراکتر، ردیف ۸ تا ۱، ستون a تا h؛ بزرگ=سفید، کوچک=سیاه، .=خالی */
const CHESS_BOOK3: Array<{ pos: string; mv: [number, number] }> = [
    { pos: '......k......ppp............................................R..K', mv: [60, 4] }, /* Re8# */
    { pos: '.......k......p.......K.....Q...................................', mv: [28, 14] }, /* Qxg7# */
    { pos: '......rk......pp............N....b............................K.', mv: [28, 13] }, /* Nf7# */
    { pos: 'k........R.....p.K................................R.............', mv: [50, 2] }, /* Rc8# */
    { pos: 'k.........K...p....B...........Q................................', mv: [31, 32] }, /* Qa5# */
    { pos: '......k......p.p....N..........Q...........B............R......K', mv: [31, 15] }, /* Qxh7# */
    { pos: '.......k.p............K.................................R.......', mv: [56, 0] }, /* Ra8# */
    { pos: '.......kR............N..............................K...........', mv: [8, 15] }, /* Rh7# */
    { pos: 'k................K.........................................R....', mv: [59, 3] }, /* Rd8# */
    { pos: '....k...R................................................RK.....', mv: [57, 1] }, /* Rb8# */
    { pos: '.......k......p...................................B.....RK......', mv: [56, 0] }, /* Ra8# */
    { pos: '.......k......pp.........................................K...R..', mv: [61, 5] }, /* Rf8# */
    { pos: '......rk......pp............N....b......................K.......', mv: [28, 13] }, /* Nf7# */
    { pos: '......k......ppp.........................................K.R....', mv: [59, 3] }, /* Rd8# */
    { pos: '.k...............K.............................................R', mv: [63, 7] }, /* Rh8# */
    { pos: '.......k......p.....................B....................K...R..', mv: [61, 5] }, /* Rf8# */
    { pos: '....kbn.....pp....N........................................Q..K.', mv: [59, 3] }, /* Qd8# */
    { pos: '....k......p.p.....P....................................RK......', mv: [56, 0] }, /* Ra8# */
    { pos: '......k......p.p.......B................................R.K.....', mv: [56, 0] }, /* Ra8# */
]
function chessPick3(seed: string): number[] {
  const r = rngOf3(seed, 'chess')
  const pick: number[] = []
  while (pick.length < 3) {
    const i = Math.floor(r() * CHESS_BOOK3.length)
    if (pick.indexOf(i) < 0) pick.push(i)
  }
  return pick
}
function v3Chess(ev: TelemEvent[], seed: string): ScoreResult {
  const pick = chessPick3(seed)
  const mvMap: Record<number, [number, number]> = {}
  for (const e of ev) {
    if (e[0] !== 'mv') continue
    const idx = Math.round(Number(e[2]) || 0)
    const from = Math.round(Number(e[3]) || 0), to = Math.round(Number(e[4]) || 0)
    if (!(idx >= 0 && idx <= 2)) return { ok: false, score: 0, reason: 'bad_puzzle' }
    if (mvMap[idx]) return { ok: false, score: 0, reason: 'dup_move' }
    if (!(from >= 0 && from <= 63 && to >= 0 && to <= 63)) return { ok: false, score: 0, reason: 'bad_square' }
    mvMap[idx] = [from, to]
  }
  let pts = 0, solved = 0
  const seen = new Set<number>()
  for (const e of ev) {
    if (e[0] !== 'puz') continue
    const t = Number(e[1]) || 0
    const idx = Math.round(Number(e[2]) || 0), okC = Number(e[3]) ? 1 : 0, dt = Number(e[4]) || 0
    if (!(idx >= 0 && idx <= 2)) return { ok: false, score: 0, reason: 'bad_puzzle' }
    if (!seen.has(idx)) {
      seen.add(idx)
      const mv = mvMap[idx]
      const sol = CHESS_BOOK3[pick[idx]].mv
      /* تایم‌اوت بدون حرکت = پازل ردشده (ok=0 بدون mv) — سازگار */
      const okS = mv ? ((mv[0] === sol[0] && mv[1] === sol[1]) ? 1 : 0) : 0
      if (okC !== okS) return { ok: false, score: 0, reason: 'bad_move' }
      if (!(dt >= 0 && dt <= 90000 && dt <= t + 50)) return { ok: false, score: 0, reason: 'bad_dt' }
      if (okS) { pts += 200 + (dt < 6000 ? 50 : dt < 10000 ? 25 : 0); solved++ }
    }
  }
  if (!seen.size) return { ok: false, score: 0, reason: 'no_shots' }
  return { ok: true, score: pts + (solved === 3 ? 60 : 0) }
}

/* ——— ۸) والیبال: زمان‌بندی ضربه + جهت در برابر بلوکر قطعی seed ——— */
function v3Volley(ev: TelemEvent[], seed: string): ScoreResult {
  let hits = 0, faults = 0, pts = 0
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'hit') {
      const q = Number(e[2]) || 0, dir = Math.round(Number(e[3]) || 0)
      if (!(q >= 0 && q <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
      if (!(dir >= 0 && dir <= 2)) return { ok: false, score: 0, reason: 'bad_dir' }
      if (hits >= 24) return { ok: false, score: 0, reason: 'overrun' }
      const block = Math.floor(rngOf3(seed, 'vol:' + hits)() * 3)
      const win = dir !== block && q >= 0.30 + Math.min(0.4, hits * 0.04)
      if (win) { pts += 70 + Math.min(30, hits * 4); hits++ } else { hits = 0; faults++ ; if (faults > 12) return { ok: false, score: 0, reason: 'overrun' } }
    } else if (e[0] === 'fault') {
      faults++
      if (faults > 12) return { ok: false, score: 0, reason: 'overrun' }
      hits = 0
    }
    if (t < 0) return { ok: false, score: 0, reason: 'bad_event' }
  }
  if (hits === 0 && pts === 0) return { ok: false, score: 0, reason: 'no_hits' }
  return { ok: true, score: pts }
}

/* ——— ۹) فوتبال: پنالتی — دروازه‌بان قطعی از seed، قدرت در باند ——— */
function v3Football(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, goals = 0, shot = 0, round = 0, shotGlobal = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    if (round > 2) return { ok: false, score: 0, reason: 'overrun' }
    const zi = Math.round(Number(e[2]) || 0)
    const powRaw = e.length > 6 ? Number(e[6]) : NaN
    const pow = Number.isFinite(powRaw) ? powRaw : 0.65 /* سازگاری با شات v1 بدون آرگومان قدرت */
    if (!(zi >= 0 && zi <= 2)) return { ok: false, score: 0, reason: 'bad_zone' }
    if (!(pow >= 0 && pow <= 1)) return { ok: false, score: 0, reason: 'bad_pow' }
    const dive = Math.floor(rngOf3(seed, 'fb:' + shotGlobal)() * 3)
    const goal = zi !== dive && pow >= 0.35 && pow <= 0.95 ? 1 : 0
    if (goal) { pts += 90; goals++ }
    shot++; shotGlobal++
    if (shot >= 3) {
      if (goals >= 2) pts += [100, 150, 200][Math.min(2, round)]
      round++; shot = 0; goals = 0
    }
  }
  if (shotGlobal === 0) return { ok: false, score: 0, reason: 'no_shots' }
  if (shot > 0) return { ok: false, score: 0, reason: 'incomplete_round' }
  return { ok: true, score: pts }
}

/* ——— ۱۰) پرش طول: سرعت دویدن از گام‌ها + تخته‌ی قطعی seed ——— */
function ljBoard3(seed: string, i: number): number { return 14 + Math.floor(rngOf3(seed, 'lj:' + i)() * 5) }
function v3LJ(ev: TelemEvent[], seed: string): ScoreResult {
  let jumps = 0, strides = 0, lastT = -1, lastSide = -1
  const recent: number[] = []
  let pts = 0
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') {
      const side = Math.round(Number(e[2]) || 0)
      if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
      if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
      if (lastT >= 0) {
        const g = t - lastT
        if (g < 140) return { ok: false, score: 0, reason: 'impossible_rate' }
        recent.push(g); if (recent.length > 6) recent.shift()
      }
      lastT = t; lastSide = side; strides++
      if (strides > 160) return { ok: false, score: 0, reason: 'overrun' }
    } else if (e[0] === 'jump') {
      const mC = Number(e[2]) || 0
      if (!(mC >= 0 && mC <= 15)) return { ok: false, score: 0, reason: 'bad_jump' }
      if (jumps >= 3) return { ok: false, score: 0, reason: 'overrun' }
      if (strides < 3) return { ok: false, score: 0, reason: 'no_runup' }
      const board = ljBoard3(seed, jumps) * 1.15
      const pos = strides * 1.15
      let sum = 0; for (const g of recent) sum += g
      const ai = recent.length ? sum / recent.length : 600
      const speed = clamp3((520 - ai) / 260, 0.15, 1)
      const prec = 1 - Math.min(1, Math.abs(pos - board) / 1.15)
      const foul = pos > board + 0.4
      const mS = foul ? 0 : 4.6 + speed * 3.9 + prec * 1.4
      if (Math.abs(mC - mS) > 0.7) return { ok: false, score: 0, reason: 'ghost_jump' }
      pts += Math.round(mS * 45)
      jumps++; strides = 0; recent.length = 0; lastSide = -1
    }
  }
  if (jumps === 0) return { ok: false, score: 0, reason: 'no_jumps' }
  return { ok: true, score: pts }
}

/* ——— ۱۱) کشتی: طناب‌کشی — حریف قطعی از seed، برنده را سرور می‌شمارد ——— */
function wrestleRival3(seed: string, b: number): { base: number; s1: number; s2: number } {
  const r = rngOf3(seed, 'wre:' + b)
  return { base: 2.0 + r() * 0.8, s1: 2500 + r() * 3000, s2: 6500 + r() * 3000 }
}
function v3Wrestle(ev: TelemEvent[], seed: string): ScoreResult {
  let bouts = 0, pts = 0
  let marker = 50, prevT = -1, crossedAt = -1, boutStartT = -1
  const startBout = () => { marker = 50; prevT = -1; crossedAt = -1; boutStartT = -1 }
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') {
      if (bouts >= 3) return { ok: false, score: 0, reason: 'overrun' }
      if (prevT < 0) { prevT = t; boutStartT = t }
      const dt = t - prevT
      const rv = wrestleRival3(seed, bouts)
      let push = rv.base
      if ((t >= rv.s1 && t < rv.s1 + 800) || (t >= rv.s2 && t < rv.s2 + 800)) push += 2.0
      marker += push * (dt / 1000)
      marker -= 1.6
      prevT = t
      if (marker <= 20 && crossedAt < 0) crossedAt = t
      else if (marker >= 80 && crossedAt < 0) crossedAt = -2 /* حریف بیرون انداخت */
    } else if (e[0] === 'bout') {
      const winC = Number(e[2]) ? 1 : 0, leftC = Number(e[3]) || 0
      if (bouts >= 3) return { ok: false, score: 0, reason: 'overrun' }
      if (!(leftC >= 0 && leftC <= 12000)) return { ok: false, score: 0, reason: 'bad_time' }
      const winS = crossedAt >= 0 ? 1 : 0
      if (winC !== winS) return { ok: false, score: 0, reason: 'flag_mismatch' }
      if (winS) {
        const leftS = Math.max(0, 12000 - (crossedAt - boutStartT))
        if (Math.abs(leftC - leftS) > 450) return { ok: false, score: 0, reason: 'bad_time' }
        pts += 250 + Math.round(leftS / 12000 * 150)
      }
      bouts++; startBout()
    }
  }
  if (bouts === 0) return { ok: false, score: 0, reason: 'no_bouts' }
  return { ok: true, score: pts }
}

/* ============================================================
   V89 — Olympics V2: داوران نسل ۳ برای ۲۵ رشته‌ی جدید.
   هندسه/تقویم هر بازی از seed سرور بازسازی می‌شود (آینه‌ی oly3.js)؛
   امتیاز فقط از توالی ورودی + زمان‌بندی راستی‌آزمایی‌شده.
   ============================================================ */
const angDist = (a: number, b: number): number => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d }
function phaseAt(seed: string, salt: string, i: number, t: number, f0: number, f1: number): number {
  const r = rngOf3(seed, salt + ':' + i)
  const f = f0 + r() * (f1 - f0), p = r() * 6.28318
  return Math.sin((t / f) * 6.28318 + p)
}
function v3Hurdles(ev: TelemEvent[], seed: string): ScoreResult {
  const r = rngOf3(seed, 'hurd')
  const B: number[] = []
  for (let i = 0; i < 8; i++) B.push(9 + i * 7 + Math.floor(r() * 3) - 1)
  let goT = -1, strides = 0, lastSide = -1, lastT = -1, clean = 0, jumps = 0, crashed = false
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'go') { if (goT >= 0) return { ok: false, score: 0, reason: 'dup_go' }; goT = t }
    else if (e[0] === 'p') {
      if (goT < 0) return { ok: false, score: 0, reason: 'no_go' }
      const side = Math.round(Number(e[2]) || 0)
      if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
      if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
      if (lastT >= 0 && t - lastT < 55) return { ok: false, score: 0, reason: 'impossible_rate' }
      lastT = t; lastSide = side; strides++
      if (strides > 220) return { ok: false, score: 0, reason: 'overrun' }
    } else if (e[0] === 'jump') {
      if (goT < 0) return { ok: false, score: 0, reason: 'no_go' }
      const okC = Number(e[2]) ? 1 : 0
      if (jumps >= 8) return { ok: false, score: 0, reason: 'overrun' }
      const okS = strides >= B[jumps] - 2 && strides <= B[jumps] + 2 ? 1 : 0
      if (okC !== okS) return { ok: false, score: 0, reason: 'ghost_jump' }
      if (okC) clean++
      jumps++
    } else if (e[0] === 'crash') { crashed = true }
  }
  if (goT < 0 || strides < 8) return { ok: false, score: 0, reason: 'no_run' }
  return { ok: true, score: strides * (crashed ? 4 : 8) + clean * 240 }
}
function v3Run400(ev: TelemEvent[], seed: string): ScoreResult {
  const r = rngOf3(seed, 'r400')
  const tgt = [430 + r() * 40, 380 + r() * 40, 470 + r() * 40]
  let strides = 0, lastSide = -1, lastT = -1, sum = 0, laps = 0
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') {
      const side = Math.round(Number(e[2]) || 0)
      if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
      if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
      if (lastT >= 0) {
        const g = t - lastT
        if (g < 60) return { ok: false, score: 0, reason: 'impossible_rate' }
        const target = tgt[Math.min(2, Math.floor(strides / 60))]
        sum += Math.max(0, 1 - Math.abs(g - target) / 220)
      }
      lastT = t; lastSide = side; strides++
      if (strides > 320) return { ok: false, score: 0, reason: 'overrun' }
    } else if (e[0] === 'lap') {
      const idx = Math.round(Number(e[2]) || 0)
      if (idx !== laps) return { ok: false, score: 0, reason: 'bad_lap' }
      if (Math.abs(strides - (idx + 1) * 60) > 3) return { ok: false, score: 0, reason: 'bad_lap_pos' }
      laps++
      if (laps > 3) return { ok: false, score: 0, reason: 'overrun' }
    }
  }
  if (strides < 20) return { ok: false, score: 0, reason: 'no_run' }
  return { ok: true, score: Math.round(sum * 14) + laps * 40 }
}
function v3Highjump(ev: TelemEvent[], seed: string): ScoreResult {
  const hs: number[] = []
  for (const e of ev) {
    if (e[0] !== 'jump') continue
    const t = Number(e[1]) || 0, hC = Math.round(Number(e[2]) || 0), risk = Math.round(Number(e[3]) || 0)
    if (!(risk >= 0 && risk <= 1)) return { ok: false, score: 0, reason: 'bad_risk' }
    const i = hs.length
    if (i >= 3) return { ok: false, score: 0, reason: 'overrun' }
    const ph = phaseAt(seed, 'hj', i, t, 900, 1500)
    const hS = Math.round(150 + 42 * ph + risk * 22 + i * 8)
    if (Math.abs(hC - hS) > 3) return { ok: false, score: 0, reason: 'ghost_height' }
    if (!(hC >= 100 && hC <= 250)) return { ok: false, score: 0, reason: 'bad_height' }
    hs.push(hC)
  }
  if (!hs.length) return { ok: false, score: 0, reason: 'no_jump' }
  return { ok: true, score: Math.max(...hs) * 6 + hs.filter((h) => h >= 180).length * 60 }
}
function v3ThrowGeom(ev: TelemEvent[], seed: string, salt: string, maxThrows: number, distOf: (q: number, wind: number, i: number) => number, tol: number, lo: number, hi: number): ScoreResult {
  const ds: number[] = [], taps: number[] = [0]
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') { taps[taps.length - 1]++; if (taps[taps.length - 1] > 40) return { ok: false, score: 0, reason: 'overrun' } }
    else if (e[0] === 'throw') {
      const i = ds.length
      if (i >= maxThrows) return { ok: false, score: 0, reason: 'overrun' }
      const dC = Number(e[2]) || 0
      const r = rngOf3(seed, salt + ':' + i)
      const wind = r() * 2 - 1
      const ph = phaseAt(seed, salt + 'ph', i, t, 700, 1400)
      const angleQ = Math.max(0, 1 - Math.abs(ph))
      const powerQ = Math.min(1, taps[i] / 8)
      taps.push(0)
      const q = 0.6 * angleQ + 0.4 * powerQ
      const dS = distOf(q, wind, i)
      if (Math.abs(dC - dS) > tol) return { ok: false, score: 0, reason: 'ghost_dist' }
      if (!(dC >= lo && dC <= hi)) return { ok: false, score: 0, reason: 'bad_dist' }
      ds.push(dC)
    }
  }
  if (!ds.length) return { ok: false, score: 0, reason: 'no_throw' }
  const s = ds.slice().sort((a, b) => b - a)
  let pts = 0
  for (let i = 0; i < Math.min(3, s.length); i++) pts += s[i]
  return { ok: true, score: Math.round(pts * (salt === 'jav' ? 12 : salt === 'dis' ? 14 : 40)) }
}
const v3Javelin = (ev: TelemEvent[], seed: string): ScoreResult => v3ThrowGeom(ev, seed, 'jav', 5, (q, w) => 35 + 50 * q + w * 5, 2.5, 30, 100)
const v3Discus = (ev: TelemEvent[], seed: string): ScoreResult => v3ThrowGeom(ev, seed, 'dis', 5, (q, w) => 22 + 40 * q + w * 4, 2.2, 20, 75)
const v3Shotput = (ev: TelemEvent[], seed: string): ScoreResult => v3ThrowGeom(ev, seed, 'sht', 5, (q) => 7 + 13 * q, 0.9, 6, 25)
function v3CombatGeo(ev: TelemEvent[], seed: string, salt: string, evtName: string, maxEx: number, winPts: (rt: number) => number, winOf: (act: number, rt: number, tel: number, i: number) => boolean): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== evtName) continue
    const t = Number(e[1]) || 0
    const i = n
    if (i >= maxEx) return { ok: false, score: 0, reason: 'overrun' }
    const act = Math.round(Number(e[2]) || 0), winC = Number(e[3]) ? 1 : 0, rt = Number(e[4]) || 0
    const r = rngOf3(seed, salt + ':' + i)
    const tel = Math.floor(r() * 2)
    if (!(act >= 0 && act <= 2)) return { ok: false, score: 0, reason: 'bad_act' }
    if (!(rt >= 0 && rt <= 3000)) return { ok: false, score: 0, reason: 'bad_rt' }
    const winS = winOf(act, rt, tel, i) ? 1 : 0
    if (winC !== winS) return { ok: false, score: 0, reason: 'ghost_win' }
    if (winS) pts += winPts(rt)
    n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_round' }
  return { ok: true, score: pts }
}
const v3Boxing = (ev: TelemEvent[], seed: string): ScoreResult => v3CombatGeo(ev, seed, 'box', 'ex', 9, (rt) => 110 + Math.max(0, Math.round((900 - rt) / 10)), (act, rt, tel) => (act === 2 ? rt <= 650 : act === tel && rt <= 900))
const v3Fencing = (ev: TelemEvent[], seed: string): ScoreResult => v3CombatGeo(ev, seed, 'fen', 'touch', 8, (rt) => 130 + Math.max(0, Math.round((700 - rt) / 8)), (act, rt, tel, i) => { const r = rngOf3(seed, 'fend:' + i); return act === 1 ? (rt >= 120 + r() * 200 && rt <= 620) : act === tel && rt <= 380 })
function v3Judo(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'throw') continue
    const t = Number(e[1]) || 0, qC = Number(e[2])
    const i = n
    if (i >= 3) return { ok: false, score: 0, reason: 'overrun' }
    if (!(qC >= 0 && qC <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    const ph = phaseAt(seed, 'judo', i, t, 1100, 1900)
    const qS = Math.max(0, 1 - Math.abs(ph))
    if (Math.abs(qC - qS) > 0.09) return { ok: false, score: 0, reason: 'ghost_q' }
    pts += Math.round(300 * qS); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_throw' }
  return { ok: true, score: pts }
}
function v3Reaction(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0, waitT = -1
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'wait') {
      if (n >= 5) return { ok: false, score: 0, reason: 'overrun' }
      waitT = t
    } else if (e[0] === 'go') {
      if (waitT < 0) return { ok: false, score: 0, reason: 'no_wait' }
      const rtC = Number(e[2]) || 0
      const r = rngOf3(seed, 'react:' + n)
      const dS = 1200 + r() * 2300
      const rtS = t - waitT - dS
      if (Math.abs(rtC - rtS) > 90) return { ok: false, score: 0, reason: 'ghost_rt' }
      if (!(rtC >= 0 && rtC <= 5000)) return { ok: false, score: 0, reason: 'bad_rt' }
      if (rtC >= 100) pts += Math.max(20, Math.round((550 - rtC) * 1.6))
      waitT = -1; n++
    }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_round' }
  return { ok: true, score: pts }
}
function v3Shooting(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    const t = Number(e[1]) || 0, qC = Number(e[2]) || 0, hold = Number(e[3]) || 0
    const i = n
    if (i >= 5) return { ok: false, score: 0, reason: 'overrun' }
    if (!(hold >= 300 && hold <= 6000)) return { ok: false, score: 0, reason: 'bad_hold' }
    if (!(qC >= 0 && qC <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    const r = rngOf3(seed, 'shoot:' + i)
    const amp = Math.min(0.85, 0.3 + hold / 8000 + r() * 0.1)
    const sway = Math.abs(phaseAt(seed, 'shootsw', i, t, 800, 1600))
    const qS = Math.round(100 * Math.max(0, 1 - sway * amp - 0.05))
    if (Math.abs(qC - qS) > 8) return { ok: false, score: 0, reason: 'ghost_q' }
    pts += Math.round(qS * 2.2); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_shot' }
  return { ok: true, score: pts }
}
function v3MovingTarget(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'hit') continue
    const t = Number(e[1]) || 0, q = Number(e[2]) || 0
    const i = n
    if (i >= 10) return { ok: false, score: 0, reason: 'overrun' }
    if (!(q >= 0 && q <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    const r = rngOf3(seed, 'mt:' + i)
    const aS = 500 + i * (900 + r() * 500)
    if (t < aS - 100 || t > aS + 2800) return { ok: false, score: 0, reason: 'ghost_timing' }
    pts += Math.round(q * 1.5); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_hit' }
  return { ok: true, score: pts }
}
function v3Sniper(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'shot') continue
    const t = Number(e[1]) || 0, qC = Number(e[2]) || 0
    const i = n
    if (i >= 3) return { ok: false, score: 0, reason: 'overrun' }
    if (!(qC >= 0 && qC <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    const r = rngOf3(seed, 'snip:' + i)
    const wind = Math.abs(r() * 2 - 1)
    const breath = Math.abs(phaseAt(seed, 'snipb', i, t, 2600, 3800))
    const qS = Math.round(100 * Math.max(0, 1 - breath * 1.3 - wind * 0.25))
    if (Math.abs(qC - qS) > 7) return { ok: false, score: 0, reason: 'ghost_q' }
    pts += Math.round(qS * 3.4); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_shot' }
  return { ok: true, score: pts }
}
function v3RapidTarget(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'hit') continue
    const t = Number(e[1]) || 0, rtC = Number(e[3]) || 0
    const i = n
    if (i >= 15) return { ok: false, score: 0, reason: 'overrun' }
    const r = rngOf3(seed, 'rt:' + i)
    const aS = 600 + i * (820 + r() * 300)
    const life = 900 + r() * 400
    if (t < aS - 80 || t > aS + life + 120) return { ok: false, score: 0, reason: 'ghost_timing' }
    const rtS = t - aS
    if (Math.abs(rtC - rtS) > 110) return { ok: false, score: 0, reason: 'ghost_rt' }
    if (!(rtC >= 60 && rtC <= 4000)) return { ok: false, score: 0, reason: 'bad_rt' }
    pts += Math.max(10, Math.round((900 - rtC) / 3)); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_hit' }
  return { ok: true, score: pts }
}
function v3Swim50(ev: TelemEvent[], _seed: string): ScoreResult {
  let n = 0, sum = 0, lastT = -1
  for (const e of ev) {
    if (e[0] !== 'p') continue
    const t = Number(e[1]) || 0
    if (lastT >= 0) { const g = t - lastT; if (g < 80 || g > 1500) return { ok: false, score: 0, reason: 'bad_gap' }; sum += Math.max(0, 20 - (g - 110) / 22) }
    lastT = t; n++
    if (n > 40) return { ok: false, score: 0, reason: 'overrun' }
  }
  if (n < 5) return { ok: false, score: 0, reason: 'no_swim' }
  return { ok: true, score: Math.round(sum) + (n >= 26 ? 120 : 0) }
}
function v3Diving(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'dive') continue
    const ok = Math.round(Number(e[2]) || 0), entry = Number(e[3]) || 0, lenC = Math.round(Number(e[4]) || 0)
    const i = n
    if (i >= 3) return { ok: false, score: 0, reason: 'overrun' }
    const r = rngOf3(seed, 'dive:' + i)
    const lenS = 4 + Math.floor(r() * 3)
    if (lenC !== lenS) return { ok: false, score: 0, reason: 'ghost_len' }
    if (!(ok >= 0 && ok <= lenS) || !(entry >= 0 && entry <= 1)) return { ok: false, score: 0, reason: 'bad_dive' }
    pts += ok * 90 + Math.round(entry * 160); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_dive' }
  return { ok: true, score: pts }
}
function v3Rowing(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0, lastSide = -1
  for (const e of ev) {
    if (e[0] !== 'stroke') continue
    const t = Number(e[1]) || 0, side = Math.round(Number(e[2]) || 0), qC = Number(e[3])
    if (side !== 0 && side !== 1) return { ok: false, score: 0, reason: 'bad_side' }
    if (side === lastSide) return { ok: false, score: 0, reason: 'no_alternation' }
    if (!(qC >= 0 && qC <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    const i = n
    if (i >= 26) return { ok: false, score: 0, reason: 'overrun' }
    const drift = phaseAt(seed, 'row', Math.floor(i / 6), t, 1500, 2400)
    const qS = Math.max(0, 1 - Math.abs(drift) / 0.5)
    if (Math.abs(qC - qS) > 0.14) return { ok: false, score: 0, reason: 'ghost_q' }
    lastSide = side; pts += Math.round(qS * 16); n++
  }
  if (n < 6) return { ok: false, score: 0, reason: 'no_row' }
  return { ok: true, score: pts }
}
function v3Kayak(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0, strokes = 0
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') { strokes++; if (strokes > 300) return { ok: false, score: 0, reason: 'overrun' } }
    else if (e[0] === 'gate') {
      const okC = Number(e[3]) ? 1 : 0
      const i = n
      if (i >= 10) return { ok: false, score: 0, reason: 'overrun' }
      const r = rngOf3(seed, 'kay:' + i)
      const gS = 12 + i * 10 + Math.floor(r() * 5) - 2
      const okS = strokes >= gS - 2 && strokes <= gS + 2 ? 1 : 0
      if (okC !== okS) return { ok: false, score: 0, reason: 'ghost_gate' }
      if (okC) pts += 110
      n++
    }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_gate' }
  return { ok: true, score: pts + Math.min(120, strokes * 6) }
}
function v3Moto(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0, taps = 0
  for (const e of ev) {
    const t = Number(e[1]) || 0
    if (e[0] === 'p') { taps++; if (taps > 400) return { ok: false, score: 0, reason: 'overrun' } }
    else if (e[0] === 'ob') {
      const passC = Number(e[2]) ? 1 : 0, nearC = Number(e[3]) ? 1 : 0
      const i = n
      if (i >= 60) return { ok: false, score: 0, reason: 'overrun' }
      const r = rngOf3(seed, 'moto:' + i)
      const oS = 10 + i * 8 + Math.floor(r() * 5) - 2
      const diff = taps - oS
      const passS = Math.abs(diff) <= 1 ? 1 : 0
      const nearS = passS && Math.abs(diff) === 1 ? 1 : 0
      if (passC !== passS || nearC !== nearS) return { ok: false, score: 0, reason: 'ghost_pass' }
      pts += passS * 70 + nearS * 30; n++
    }
  }
  if (!n) return { ok: false, score: 0, reason: 'no_obstacle' }
  return { ok: true, score: pts }
}
function v3Rally(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  /* V92: aS تجمعی — گپ پیچ‌های مجاور همیشه ۱۵۰۰..۲۲۰۰ms. فرمول قبلی 800+i*(1500+700r)
     با r مستقل می‌توانست گپ مجاورها را تا <380ms برساند یا معکوس کند و تلاش صادقی را
     impossible_rate/non_monotonic رد کند. رکوردهای قدیمی بازممیزی نمی‌شوند (داور لحظه‌ی ثبت). */
  let aS = 800
  for (const e of ev) {
    if (e[0] !== 'corner') continue
    const t = Number(e[1]) || 0, qC = Number(e[3])
    const i = n
    if (i >= 6) return { ok: false, score: 0, reason: 'overrun' }
    if (!(qC >= 0 && qC <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    aS += 1500 + rngOf3(seed, 'ral:' + i)() * 700
    if (t < aS - 350 || t > aS + 900) return { ok: false, score: 0, reason: 'ghost_timing' }
    pts += Math.round(qC * 130); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_corner' }
  return { ok: true, score: pts }
}
function v3Formula(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'turn') continue
    const t = Number(e[1]) || 0, qC = Number(e[3])
    const i = n
    if (i >= 8) return { ok: false, score: 0, reason: 'overrun' }
    if (!(qC >= 0 && qC <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    const r = rngOf3(seed, 'frm:' + i)
    const aS = 700 + i * (1200 + r() * 500)
    if (qC > 0.8 && (t < aS - 250 || t > aS + 550)) return { ok: false, score: 0, reason: 'ghost_apex' }
    pts += Math.round(qC * 140); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_turn' }
  return { ok: true, score: pts }
}
function v3Boat(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'stroke') continue
    const t = Number(e[1]) || 0, qC = Number(e[2])
    const i = n
    if (i >= 22) return { ok: false, score: 0, reason: 'overrun' }
    if (!(qC >= 0 && qC <= 1)) return { ok: false, score: 0, reason: 'bad_q' }
    const wv = Math.abs(phaseAt(seed, 'boat', Math.floor(i / 5), t, 1100, 1700))
    const qS = Math.max(0, 1 - wv)
    if (Math.abs(qC - qS) > 0.14) return { ok: false, score: 0, reason: 'ghost_q' }
    pts += Math.round(qS * 15); n++
  }
  if (n < 6) return { ok: false, score: 0, reason: 'no_row' }
  return { ok: true, score: pts }
}
function v3Balance(ev: TelemEvent[], _seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'round') continue
    const ms = Number(e[2]) || 0, qC = Number(e[3])
    if (n >= 3) return { ok: false, score: 0, reason: 'overrun' }
    if (!(ms >= 0 && ms <= 30000) || !(qC >= 0 && qC <= 1)) return { ok: false, score: 0, reason: 'bad_round' }
    const qS = Math.min(1, ms / 8000)
    if (Math.abs(qC - qS) > 0.16) return { ok: false, score: 0, reason: 'ghost_q' }
    pts += Math.round(ms / 40) + Math.round(qS * 50); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_round' }
  return { ok: true, score: pts }
}
function v3Timing(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'stop') continue
    const t = Number(e[1]) || 0, qC = Number(e[3]) || 0
    const i = n
    if (i >= 8) return { ok: false, score: 0, reason: 'overrun' }
    if (!(qC >= 0 && qC <= 100)) return { ok: false, score: 0, reason: 'bad_q' }
    const r = rngOf3(seed, 'tim:' + i)
    const w = 0.8 + r() * 1.4
    const a0 = r() * 360
    const ac = 40 + r() * 280
    const theta = (a0 + w * (t / 1000) * 360) % 360
    const qS = Math.round(100 * Math.max(0, 1 - angDist(theta, ac) / 60))
    if (Math.abs(qC - qS) > 6) return { ok: false, score: 0, reason: 'ghost_q' }
    pts += Math.round(qS * 10) + (qS >= 95 ? 40 : 0); n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_stop' }
  return { ok: true, score: pts }
}
function v3Memory(ev: TelemEvent[], seed: string): ScoreResult {
  let pts = 0, n = 0
  for (const e of ev) {
    if (e[0] !== 'seq') continue
    const ok = Math.round(Number(e[2]) || 0), lenC = Math.round(Number(e[3]) || 0)
    const i = n
    if (i >= 8) return { ok: false, score: 0, reason: 'overrun' }
    const lenS = 3 + i
    if (lenC !== lenS) return { ok: false, score: 0, reason: 'ghost_len' }
    if (!(ok >= 0 && ok <= lenS)) return { ok: false, score: 0, reason: 'bad_seq' }
    pts += ok * 40; n++
  }
  if (!n) return { ok: false, score: 0, reason: 'no_seq' }
  return { ok: true, score: pts }
}

const SKILL3: Record<string, (ev: TelemEvent[], seed: string) => ScoreResult> = {
  sprint: v3Sprint, archery: v3Archery, swim: v3Swim, gym: v3Gym, weight: v3Weight,
  cycling: v3Cycling, chess: v3Chess, volley: v3Volley, football: v3Football, wrestle: v3Wrestle, lj: v3LJ,
  /* V89 — Olympics V2 */
  hurdles: v3Hurdles, run400: v3Run400, highjump: v3Highjump, javelin: v3Javelin, discus: v3Discus, shotput: v3Shotput,
  boxing: v3Boxing, fencing: v3Fencing, judo: v3Judo, reaction: v3Reaction,
  shooting: v3Shooting, movingtarget: v3MovingTarget, sniper: v3Sniper, rapidtarget: v3RapidTarget,
  swim50: v3Swim50, diving: v3Diving, rowing: v3Rowing, kayak: v3Kayak,
  moto: v3Moto, rally: v3Rally, formula: v3Formula, boat: v3Boat,
  balance: v3Balance, timing: v3Timing, memory: v3Memory,
}

/* ——— ممیزی اصلی: تله‌متری → امتیازِ سروری ———
   edition ≥ SIM_V2_ED → فرمول نسل ۲ (بدون کف، مهارت‌محور)؛
   دوره‌های قدیمی همان v1 — هر دو از همان قواعد L1..L9 می‌گذرند.
   OLY3: مدل tap + (دوره ≥ SKILL3_ED یا train) → داور نسل ۳ با seed سرور. */
export function computeScore(key: string, tel: Telemetry | null | undefined, edition?: number, opts?: ScoreOpts): ScoreResult & { parts?: ScorePart[] } {
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
  if (!isSim) {
    const v3 = SKILL3[key]
    if (v3 && ((typeof edition === 'number' && edition >= SKILL3_ED) || (opts && opts.mode === 'train'))) {
      const seed = opts && opts.seed ? String(opts.seed) : ''
      if (!seed) return { ok: false, score: 0, reason: 'no_seed' }
      return withL3L4((ev2) => v3(ev2, seed), key, tel, ev)
    }
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
