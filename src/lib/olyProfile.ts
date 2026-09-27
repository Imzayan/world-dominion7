/* ============================================================
   O2 — olyProfile: تک‌منبع پروفایل مهارت + دستاوردهای المپیک
   (PHASE 3/4/27/49/50) — همه‌ی اعداد از مسابقه‌ی رسمی واقعی
   برمی‌آیند؛ هیچ مهارت/پتانسیل دستی ذخیره نمی‌شود.
   PHASE 11: تمرین هرگز وارد اینجا نمی‌شود (ضد farm/Sandbagging).
   PHASE 50: مهارت از ترکیب «اخیر + بلندمدت» می‌آید؛ بازی بد
   فقط مهارت خودت را پایین می‌آورد (رکورد/رتبه هرگز کم نمی‌شود)
   پس انگیزه‌ی عمدی بازی بد صفر است.
   ============================================================ */

export interface RecentScore { s: number; m: 'tap' | 'sim'; at: number }

/* رفرنس «الیت» هر رشته برای نرمال‌سازی Skill به درصد —
   tap و sim مقیاس امتیاز متفاوت دارند، پس هر مدل رفرنس خودش را دارد.
   این‌ها سقف تجربی رکوردهای واقعی‌اند، نه سقف قانونی (سقف امتیاز نداریم). */
const REF: Record<string, Record<'tap' | 'sim', number>> = {
  sprint: { tap: 1440, sim: 760 }, /* tap: ۱۲۰ ضربه×۱۲ • sim: برنده با gap صفر */
  swim: { tap: 840, sim: 760 }, /* tap: ۶۰ ضربه‌ی یک‌درمیان×۱۴ */
  archery: { tap: 1000, sim: 640 }, /* tap: ۵×۱۰ (کامل) • sim: ۳ دور پرریسک کامل */
  gym: { tap: 1200, sim: 640 }, /* tap: ۱۲ حرکت سریع×۱۰۰ */
  weight: { tap: 1000, sim: 640 }, /* tap: ۵×۲۰۰ (دقیق کامل) */
  cycling: { tap: 1000, sim: 760 }, /* tap: ریتم کامل=۱۰۰۰ */
  chess: { tap: 1000, sim: 640 }, /* tap: ۴ پازل سریع×۲۵۰ */
  volley: { tap: 660, sim: 640 }, /* tap: ۳۰ اسپایک×۲۲ */
  football: { tap: 990, sim: 880 }, /* tap: کامل ۳ دور (۹۰×۶+۲۰۰+۱۵۰+۱۰۰) */
  wrestle: { tap: 990, sim: 640 }, /* tap: ۳ برد سریع (۲۵۰+۱۵۰) */
  lj: { tap: 1215, sim: 640 }, /* tap: ۳ پرش ۹ متری×۴۵ */
}
export const refOf = (key: string, model: 'tap' | 'sim'): number =>
  (REF[key] && REF[key][model]) || 800

const norm = (key: string, score: number, model: 'tap' | 'sim'): number =>
  Math.max(0, Math.min(1.35, score / refOf(key, model))) /* سقف ۱۳۵٪ برای ثبات درصد */

const mean = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)

/* ——— Skill ۰..۱۰۰: ۵۵٪ رینگ اخیر (۵ تای آخر) + ۴۵٪ بلندمدت (همه) ———
   هر مدل با رفرنس خودش نرمال می‌شود و وزنش به سهم شرکتش است؛
   بازیکنی که فقط sim بازی می‌کند مهارت sim واقعی‌اش را می‌بیند. */
export function skillOf(key: string, recent: RecentScore[]): number {
  if (!recent.length) return 0
  const vals = recent.map((r) => norm(key, r.s, r.m))
  const recentVals = vals.slice(-5)
  const longAvg = mean(vals)
  const recAvg = mean(recentVals)
  const wRec = Math.min(0.55, recentVals.length * 0.11) /* با داده‌ی کم، بلندمدت وزن بیشتر */
  const blended = recAvg * wRec + longAvg * (1 - wRec)
  return Math.round(Math.max(0, Math.min(100, blended * 100)))
}

/* ——— Consistency ۰..۱۰۰ (یا null با داده‌ی کم): ۱ − ضریب تغییرات رینگ اخیر ———
   نرمال‌شده در مدل خودش تا tap/sim قابل جمع باشند. */
export function consistencyOf(key: string, recent: RecentScore[]): number | null {
  if (recent.length < 3) return null
  const vals = recent.slice(-8).map((r) => norm(key, r.s, r.m))
  const m = mean(vals)
  if (m <= 0.02) return null
  const sd = Math.sqrt(mean(vals.map((v) => (v - m) * (v - m))))
  return Math.round(Math.max(0, Math.min(100, (1 - sd / m) * 100)))
}

/* ——— Potential ۰..۱۰۰: سقفی که با پیشرفت واقعی بالا می‌رود (PHASE 5) ———
   روند صعودی (میانگین ۳ تای آخر > میانگین کل) پتانسیل را بالا می‌برد؛
   افت فرم آن را پایین می‌آورد. سقف نرم ۱۰۰، هیچ قفل دستی ندارد. */
export function potentialOf(key: string, recent: RecentScore[]): number {
  if (!recent.length) return 0
  const vals = recent.map((r) => norm(key, r.s, r.m))
  const skill = skillOf(key, recent)
  const trend = mean(vals.slice(-3)) - mean(vals)
  const uplift = Math.max(-14, Math.min(26, trend * 100 * 1.7))
  return Math.round(Math.max(0, Math.min(100, skill + uplift)))
}

/* ——— PHASE 27: دستاوردهای واقعی — تعریف + ارزیابی از داده‌ی واقعی ——— */
export interface AchCtx {
  n: number /* مسابقه‌ی رسمی این رشته */
  nTotal: number /* جمع همه‌ی رشته‌ها */
  bestEver: number
  prCount: number
  bullseyes: number
  rank: number | null /* رتبه‌ی همین نتیجه در دوره */
  discipline: string
  score: number
  model: 'tap' | 'sim'
}
export interface AchDef { key: string; name: string; desc: string; icon: string }
export const ACHIEVEMENTS: AchDef[] = [
  { key: 'rookie', name: 'آغازگر', desc: 'اولین مسابقه‌ی رسمی المپیک', icon: '🎖️' },
  { key: 'veteran25', name: 'کهنه‌کار', desc: '۲۵ مسابقه‌ی رسمی در همه‌ی رشته‌ها', icon: '🛡️' },
  { key: 'sprint100', name: 'صد قدم', desc: '۱۰۰ مسابقه‌ی رسمی دو ۱۰۰ متر', icon: '🏃' },
  { key: 'pr10', name: 'شکست‌زن خود', desc: '۱۰ بار رکورد شخصی‌ات را شکستی', icon: '📈' },
  { key: 'podium', name: 'روی سکو', desc: 'سفر به سکوی ۳ نفره‌ی یک رشته', icon: '🥉' },
  { key: 'first_gold', name: 'نخستین طلا', desc: 'صدرنشینی یک رشته در دوره', icon: '🥇' },
  { key: 'top10', name: 'ده نفر برتر', desc: 'ورود به Top 10 یک رشته', icon: '🔟' },
  { key: 'global_top100', name: 'جهانی', desc: 'قرارگیری در Top 100 جهانی', icon: '🌍' },
  { key: 'bullseye100', name: 'صد هدف', desc: '۱۰۰ ده‌ی طلایی در تیراندازی', icon: '🎯' },
  { key: 'perfect_archery', name: 'تیرانداز بی‌نقص', desc: '۵ تیر، هر ۵ تیر ده (۱۰۰۰ امتیاز)', icon: '💥' },
  { key: 'champion', name: 'قهرمان المپیک', desc: 'قهرمانی یک دوره‌ی کامل المپیک', icon: '👑' },
]
export const achDef = (key: string): AchDef | undefined => ACHIEVEMENTS.find((a) => a.key === key)

export function evalAchievements(ctx: AchCtx): string[] {
  const out: string[] = []
  if (ctx.n >= 1) out.push('rookie')
  if (ctx.nTotal >= 25) out.push('veteran25')
  if (ctx.discipline === 'sprint' && ctx.n >= 100) out.push('sprint100')
  if (ctx.prCount >= 10) out.push('pr10')
  if (ctx.rank != null && ctx.rank <= 3) out.push('podium')
  if (ctx.rank === 1) out.push('first_gold')
  if (ctx.rank != null && ctx.rank <= 10) out.push('top10')
  if (ctx.rank != null && ctx.rank <= 100) out.push('global_top100')
  if (ctx.bullseyes >= 100) out.push('bullseye100')
  if (ctx.discipline === 'archery' && ctx.model === 'tap' && ctx.score >= 1000) out.push('perfect_archery')
  return out
}

/* شمارش ده‌ی طلایی از تله‌متری کمان (مدل tap: رویداد shot با p=10) */
export function bullseyesFromTelemetry(discipline: string, ev: Array<Array<string | number>> | undefined): number {
  if (discipline !== 'archery' || !Array.isArray(ev)) return 0
  let c = 0
  for (const e of ev) {
    if (Array.isArray(e) && e[0] === 'shot' && Math.round(Number(e[2]) || 0) === 10) c++
  }
  return c
}
