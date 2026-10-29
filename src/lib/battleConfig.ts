/* =====================================================================
   V147 — BATTLE 2.0 (سرور) — پیکربندی و موتور نبرد واقع‌گرایانه
   ---------------------------------------------------------------------
   آینه‌ی کلاینت: بلوک WD_BATTLE در public/game/index.html.
   قانون: هر عدد توازن نبرد فقط همین‌جا (سرور) و WD_BATTLE (کلاینت) —
   هیچ عددی inline در مسیر داوری نمی‌نشیند.
   قابل‌تنظیم بدون دیپلوی: JSON با همین ساختار در GameSetting key='battle_cfg'
   ذخیره شود؛ loadBattleCfg روی آن merge می‌کند (کش ۶۰ثانیه‌ای).
   خالص و بدون وابستگی — با node --experimental-strip-types هم اجرا می‌شود
   (تست دودی: scripts/v147-battle-smoke.mjs و جدول نمونه: v147-battle-samples.mjs)
   ===================================================================== */
import { COUNTRY_DEF } from './countryDefs'
export { COUNTRY_DEF } /* V147: مسیر داوری (route.ts) هم از همین ماژول مصرف می‌کند */

/* ---- یگان‌ها: فقط قدرت حمله (آینه‌ی BALANCE.army.units کلاینت) ---- */
export const UNIT_ATK: Record<string, { atk: number; air: boolean }> = {
  infantry: { atk: 4, air: false },
  tank: { atk: 40, air: false },
  bomber: { atk: 300, air: true },
  fighter: { atk: 120, air: true },
  heli: { atk: 65, air: true },
  missile: { atk: 250, air: false },
  drone: { atk: 35, air: true },
  transport: { atk: 15, air: false },
  destroyer: { atk: 180, air: false },
  carrier: { atk: 600, air: false },
  immortal: { atk: 55, air: false },
}
/* کلاس یگان‌ها (آینه‌ی WD105_CLASS کلاینت) */
export const UNIT_CLS: Record<string, string> = {
  infantry: 'infantry', tank: 'armor', transport: 'armor', missile: 'arty',
  destroyer: 'navy', carrier: 'navy', bomber: 'air', fighter: 'air', heli: 'air',
  drone: 'air', immortal: 'elite',
}
const CLASSES = ['infantry', 'armor', 'arty', 'air', 'navy', 'elite']

/* ============================================================
   پیکربندی اصلی — همه‌ی ضریب‌های نبرد (قابل بازنویسی از GameSetting)
   ============================================================ */
export const BATTLE_CFG = {
  v: 2,
  /* پادگان کشور آزاد: G = def×kDef×(1+kPop×popN+kEco×ecoN) با سقف def×cap */
  garrison: {
    kDef: 1.42,          // ستون فقرات مقیاس — همان ضریب زنده‌ی قبل
    kPop: 0.18,          // وزن جمعیت (popN = sqrt(popM)/sqrt(popRef) سقف 1.4)
    kEco: 0.10,          // وزن اقتصاد (ecoN = log10(1+gold)/log10(1+12000) سقف 1.2)
    cap: 2.2,            // سقف مطلق پادگان نسبت به def
    ownedK: 0.12,        // شبه‌نظامی محلی کشورِ متعلق به بازیکن (PvP)
    capitalOccFrom: 75,  // از این ٪ اشغال، محاصره‌ی پایتخت آغاز می‌شود
    capitalBoost: 1.35,  // دفاع پایتخت در مرحله‌ی محاصره
    capitalSlow: 0.45,   // کندی پیشروی در محاصره
    regenPerHour: 0.14,  // بازسازی پادگان آسیب‌دیده (۱۴٪ در ساعت)
    regenFloor: 0.35,    // کف مقاومت حتی با پادگان صفر
    popRef: 300,         // مرجع نرمال‌سازی جمعیت (میلیون)
    goldRef: 12000,      // مرجع نرمال‌سازی اقتصاد
  },
  /* ترکیب پادگان بر اساس tier قدرت — مهاجم باید کانتر بیاورد */
  comp: {
    tiers: [
      { max: 1500, s: { infantry: 0.7, armor: 0.2, air: 0.1 } },
      { max: 4500, s: { infantry: 0.55, armor: 0.25, air: 0.1, arty: 0.1 } },
      { max: 1e9, s: { infantry: 0.45, armor: 0.25, air: 0.15, arty: 0.1, navy: 0.05 } },
    ] as { max: number; s: Record<string, number> }[],
  },
  /* سنگ‌کاغذ‌قیچی: rps[کلاس مهاجم][کلاس مدافع] — در دو سمت با همین جدول
     air→air=0.85: حمله‌ی هوایی به پدافند هواییِ آماده (جنگنده/ناوشکن) جریمه‌ی واقعی دارد */
  rps: {
    infantry: { infantry: 1.0, armor: 0.75, arty: 1.15, air: 0.7, navy: 0.8, elite: 0.9 },
    armor: { infantry: 1.35, armor: 1.0, arty: 1.25, air: 0.7, navy: 0.85, elite: 0.95 },
    arty: { infantry: 1.2, armor: 0.9, arty: 1.0, air: 0.6, navy: 1.1, elite: 0.9 },
    air: { infantry: 1.25, armor: 1.4, arty: 1.15, air: 0.85, navy: 0.7, elite: 1.0 },
    navy: { infantry: 0.9, armor: 0.9, arty: 1.1, air: 0.75, navy: 1.0, elite: 0.9 },
    elite: { infantry: 1.3, armor: 1.1, arty: 1.15, air: 0.95, navy: 0.9, elite: 1.05 },
  } as Record<string, Record<string, number>>,
  rounds: 5,
  /* پیشروی هر دور: gain = clamp(k×(ratio−base)، floor، capG(ratio)) */
  gain: { base: 0.35, k: 16, floor: -3, cap1: 13, t1: 4, cap2: 26, t2: 8, cap3: 34 },
  /* حداقل نیروی حمله نسبت به دفاع مؤثر — زیر این، حمله اصلاً آغاز نمی‌شود */
  minForce: { ratioPve: 0.3, ratioPvp: 0.35 },
  /* تلفات هر دور */
  losses: {
    aBase: 0.03, aVar: 0.03, aCap: 0.1,   // مهاجم: min(aCap، aBase+aVar/max(ratio،0.2))
    dK: 0.7, dCap: 0.3,                    // مدافع: min(dCap، dK×aFrac×ratio)
  },
  /* زمین: کشورهای پرجمعیت کندتر اشغال می‌شوند gain×(1−bigPopSlow×popN) */
  terrain: { bigPopSlow: 0.15 },
  /* خستگی جنگ — هر فتح اخیر در پنجره‌ی زمانی: حمله/اقتصاد را خراب‌تر می‌کند */
  fatigue: {
    windowH: 6,          // پنجره (ساعت)
    atkPenalty: 0.04,    // هر فتح اخیر −۴٪ قدرت حمله
    minMult: 0.8,        // کف ضریب حمله
    unrestBoost: 0.15,   // هر فتح اخیر +۱۵٪ رشد ناآرامی (کلاینت)
    upkeepBoost: 0.04,   // هر فتح اخیر +۴٪ نگهداری (کلاینت)
  },
  /* بازسازی دفاع: پیشرویِ رهاشده (کشورِ نیمه‌اشغال) آهسته عقب می‌رود */
  occ: { regenPerHour: 1.2 },
  /* ---- مخصوص PvP (داوری سرور) ---- */
  pvp: {
    defArmyK: 0.55,      // ارتش مدافع روی خاک خودش → دفاع (مقیاس یکسان با حمله)
    fortPerLevel: 0.05,  // هر سطح استحکامات مدافع (wd28.fort) +۵٪ دفاع
    stance: { attack: 0.95, balanced: 1.0, fortress: 1.08 }, // راهبرد دفاع wd28.stance
    shareBase: 0.35,     // حتی با پادگان ۰٪، ۳۵٪ ارتش میدانی برمی‌گردد و دفاع می‌کند
    sharePer: 0.65,      // shareEff = shareBase + sharePer×share
    shareDef: 0.5,       // سهم پیش‌فرض (بازیکن تعیین نکرده)
    shareMax: 0.6,       // سقف سهم پادگان هر کشور
    defGenPerPoint: 0.01, // ژنرال مدافع V105: هر نقطه‌ی def ژنرال +۱٪ دفاع
    scoreCapBase: 120,   // سقف ضدتقلب: قدرت از یگان‌های واقعی، اما حداکثر
    scoreCapPer: 2.0,    //   scoreCapBase + scoreCapPer×score (ارتشِ جعلی بی‌اثر)
    legacyFloor: 0.5,    // کف دفاع: نصف تخمین قدیمی (امتیاز) — بازیکنِ بدون ارتش بی‌دفاع نمی‌شود
    shieldHours: 24,     // سپر نوپدید: کشورِ تازه‌تصرف (از territory.updatedAt)
    shieldDefMult: 1.8,  //   دفاع ×1.8 — این بار سمت سرور و واقعی
    peaceHours: 48,      // صلح مقدس نوآموزان — این بار سمت سرور اعمال می‌شود
    minForceRatio: 0.35, // حداقل نیروی حمله نسبت به دفاع مؤثر — زیر این، اتاق جنگ رد می‌کند
    targetCdMin: 8,      // کول‌داون حمله به «همین هدف»
    maxCapsPerHour: 4,   // سقف فتح در ساعت (ضد موج شبانه)
    fatiguePerWin: 0.04, // خستگی جنگ PvP: هر فتح اخیر −۴٪ حمله
    fatigueMin: 0.8,
    bullyRatio: 4,       // قلدری: حمله با قدرت >۴ برابر به بازیکن ضعیف
    bullyScoreMax: 1000, //   فقط علیه بازیکنِ واقعاً ضعیف (امتیاز ≤۱۰۰۰) — فتح قدرت‌مندها جریمه ندارد
    bullyRewardMult: 0.25, //   پاداش رتبه‌بندی ×0.25
    defLossCap: 0.3,     // سقف تلفات مدافع در باخت
    defLossWinCap: 0.12, // سقف تلفات مدافع در دفاع موفق
    occDecayPerHour: 0.15, // فرسایش پیشروی PvP ذخیره‌شده (دفاع پس می‌گیرد)
  },
}
export type BattleCfg = typeof BATTLE_CFG

/* ---- بازخوانی override از GameSetting (کش ۶۰ثانیه‌ای) ---- */
let cfgCache: { at: number; v: BattleCfg } | null = null
type CfgGetter = (key: string) => Promise<{ value: string } | null>
export function battleCfgReset() { cfgCache = null }
export async function loadBattleCfg(get: CfgGetter | null): Promise<BattleCfg> {
  const now = Date.now()
  if (cfgCache && now - cfgCache.at < 60_000) return cfgCache.v
  let v: BattleCfg = BATTLE_CFG
  if (get) {
    try {
      const row = await get('battle_cfg')
      if (row && row.value) {
        const o = JSON.parse(row.value)
        v = { ...BATTLE_CFG, ...o, pvp: { ...BATTLE_CFG.pvp, ...(o.pvp || {}) }, garrison: { ...BATTLE_CFG.garrison, ...(o.garrison || {}) }, losses: { ...BATTLE_CFG.losses, ...(o.losses || {}) }, gain: { ...BATTLE_CFG.gain, ...(o.gain || {}) }, fatigue: { ...BATTLE_CFG.fatigue, ...(o.fatigue || {}) }, occ: { ...BATTLE_CFG.occ, ...(o.occ || {}) } }
      }
    } catch { /* fail-open به پیش‌فرض */ }
  }
  cfgCache = { at: now, v }
  return v
}

/* ============================================================
   ریاضی نبرد — خالص (بدون DB)
   ============================================================ */
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

/* نرمال‌سازی جمعیت/اقتصاد */
export function popNorm(popM: number, cfg: BattleCfg) { return Math.min(1.4, Math.sqrt(Math.max(0.01, popM)) / Math.sqrt(cfg.garrison.popRef)) }
export function ecoNorm(gold: number, cfg: BattleCfg) { return Math.min(1.2, Math.log10(1 + Math.max(0, gold)) / Math.log10(1 + cfg.garrison.goldRef)) }

/* پادگان کامل کشور (آزاد یا متعلق) — ورودی def/gold واقعی کشور */
export function garrisonFrom(def: number, gold: number, popM: number, cfg: BattleCfg): number {
  const g = def * cfg.garrison.kDef * (1 + cfg.garrison.kPop * popNorm(popM, cfg) + cfg.garrison.kEco * ecoNorm(gold, cfg))
  return Math.min(g, def * cfg.garrison.cap)
}
export function garrisonOf(country: string, cfg: BattleCfg): number {
  const e = COUNTRY_DEF[country]
  if (!e) return 2500 * cfg.garrison.kDef
  return garrisonFrom(e[0], 3000, e[1], cfg) /* gold میانگین — اقتصاد دقیق فقط کلاینت است؛ اثرش ≤۱۰٪ */
}

/* ترکیب پادگان بر اساس tier */
export function garrisonComp(power: number, cfg: BattleCfg): Record<string, number> {
  for (const t of cfg.comp.tiers) if (power < t.max) return t.s
  return cfg.comp.tiers[cfg.comp.tiers.length - 1].s
}

/* نرم‌شدن پیاده‌نظام (آینه‌ی effInfCount کلاینت — V128) */
export function effInf(n: number): number {
  const K = 150, E = 0.78
  return n <= K ? n : K * Math.pow(n / K, E)
}

/* توان واقعی ارتش از یگان‌های سیو — آینه‌ی calculateTotalAttack کلاینت */
export function armyPower(units: Record<string, number> | undefined, airInfra: number, cfg: BattleCfg): number {
  let total = 0
  const air = 1 + 0.1 * (Number(airInfra) || 0)
  for (const k of Object.keys(UNIT_ATK)) {
    const c = Number((units || {})[k]) || 0
    if (c <= 0) continue
    const u = UNIT_ATK[k]
    total += (k === 'infantry' ? effInf(c) : c) * u.atk * (u.air ? air : 1)
  }
  void cfg
  return Math.round(total)
}

/* ترکیب کلاسی ارتش (سهم هر کلاس) */
export function armyComp(units: Record<string, number> | undefined): Record<string, number> {
  const tot: Record<string, number> = {}
  let n = 0
  for (const k of Object.keys(UNIT_ATK)) {
    const c = Number((units || {})[k]) || 0
    if (c <= 0) continue
    const cls = UNIT_CLS[k] || 'infantry'
    tot[cls] = (tot[cls] || 0) + c
    n += c
  }
  if (!n) return { infantry: 1 }
  const o: Record<string, number> = {}
  for (const k of Object.keys(tot)) o[k] = tot[k] / n
  return o
}

/* ضریب سنگ‌کاغذ‌قیچی: میانگین وزنی rps[کلاس خودی][کلاس حریف] */
export function rpsMult(my: Record<string, number>, foe: Record<string, number>, cfg: BattleCfg): number {
  let m = 0
  for (const a of Object.keys(my)) {
    const wa = my[a]
    if (!wa) continue
    let inner = 0
    for (const d of Object.keys(foe)) inner += (cfg.rps[a] && cfg.rps[a][d] != null ? cfg.rps[a][d] : 1) * foe[d]
    m += wa * inner
  }
  return clamp(m, 0.55, 1.45)
}

/* سقف پیشروی هر دور وابسته به نسبت قدرت (همان طرح V136) */
export function capG(ratio: number, cfg: BattleCfg): number {
  const g = cfg.gain
  return ratio >= g.t2 ? g.cap3 : ratio >= g.t1 ? g.cap2 : g.cap1
}

export type Round = { occ: number; aFrac: number; dFrac: number }
export type SimIn = {
  A: number            // قدرت مهاجم (بعد از همه‌ی بونوس‌ها)
  D0: number           // دفاع مؤثر اولیه
  atkComp: Record<string, number>
  defComp: Record<string, number>
  occ0?: number        // پیشروی قبلی (کمپین نیمه‌کاره)
  hp0?: number         // سلامت پادگان 0..1 (PvE)
  popM?: number        // برای کندی زمینِ بزرگ
  lossMult?: number    // ضریب تلفات دکترین (V88)
  garrisonCfg?: { capitalOccFrom: number; capitalBoost: number; capitalSlow: number; regenFloor: number }
}
export type SimOut = { occ: number; win: boolean; rounds: Round[]; aLost: number; dLost: number }

/* شبیه‌ساز ۵ دور — همان فرمول بین سرور و کلاینت (تک‌منبع منطق) */
export function simBattle(inp: SimIn, cfg: BattleCfg): SimOut {
  const G = inp.garrisonCfg || cfg.garrison
  const lossMult = inp.lossMult || 1
  const popSlow = 1 - cfg.terrain.bigPopSlow * clamp((inp.popM || 0) / cfg.garrison.popRef, 0, 1)
  let A = Math.max(1, inp.A)
  const A0 = A
  let D0 = Math.max(1, inp.D0)
  let occ = clamp(inp.occ0 || 0, 0, 99)
  let hp = clamp(inp.hp0 != null ? inp.hp0 : 1, 0, 1)
  const rounds: Round[] = []
  let dLossSum = 0
  for (let r = 1; r <= cfg.rounds; r++) {
    /* پادگانِ فرسوده + محاصره: هرچه عمیق‌تر در خاک، دفاع کمتر اما پایتخت مقاوم‌تر */
    let defNow = D0 * (G.regenFloor + (1 - G.regenFloor) * hp) * (1 - (occ / 100) * 0.75)
    if (occ >= G.capitalOccFrom) defNow *= G.capitalBoost
    defNow = Math.max(1, defNow)
    const ratio = (A * (0.9 + Math.random() * 0.2)) / defNow
    let gain = Math.max(cfg.gain.floor, Math.min(capG(ratio, cfg), (ratio - cfg.gain.base) * cfg.gain.k))
    if (occ >= G.capitalOccFrom) gain *= G.capitalSlow
    gain *= popSlow
    const prev = occ
    occ = clamp(occ + gain, 0, 100)
    const aFrac = Math.min(cfg.losses.aCap, (cfg.losses.aBase + cfg.losses.aVar / Math.max(ratio, 0.2))) * lossMult
    const dFrac = Math.min(cfg.losses.dCap, cfg.losses.dK * aFrac * ratio)
    A = Math.round(A * (1 - aFrac))
    hp = Math.max(0, hp - dFrac)
    dLossSum += dFrac
    rounds.push({ occ: Math.round(occ * 10) / 10, aFrac: Math.round(aFrac * 1000) / 1000, dFrac: Math.round(dFrac * 1000) / 1000 })
    void prev
    if (A <= 1 || occ >= 100) break
  }
  return { occ: Math.round(occ * 10) / 10, win: occ >= 100, rounds, aLost: Math.round((1 - A / A0) * 1000) / 1000, dLost: Math.round(Math.min(1, dLossSum) * 1000) / 1000 }
}

/* پادشاهی اعداد — خواندن امن JSON سیو */
export function parseSaveState(raw: string | null | undefined): Record<string, unknown> {
  try { const o = JSON.parse(raw || '{}'); return (o && typeof o === 'object') ? o : {} } catch { return {} }
}
