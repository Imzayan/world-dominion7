/* ============================================================
   V67 — COUNTRY VIEW ENGINE: کاتالوگ ساختمان‌ها (تک‌منبع سرور)
   - هیچ هزینه/سطح/زمان/تولیدی از کلاینت پذیرفته نمی‌شود.
   - کلاینت همین کاتالوگ را از cv_state دریافت و فقط نمایش می‌دهد.
   - مقیاس تولید با اقتصاد موجود بازی هماهنگ است (سایت‌های V25 با
     PSC حدود ۷۵ تا ۳۳۰ واحد/دقیقه می‌دهند — پله‌ی CV کمی محافظه‌کارتر
     است تا World Map بی‌معنا نشود).
   - Levels 1..10: هزینه ×۱٫۶^(ل-۱) ، تولید ×ل ، زمان ×۱٫۴۵^(ل-۱)
   ============================================================ */

export const CV_MAX_LEVEL = 10

export type CvProd = { gold?: number; oil?: number; food?: number; rp?: number }
export type CvCost = { g: number; o: number; f: number }

export type CvBuildingDef = {
  id: string
  fa: string
  icon: string
  cat: 'government' | 'residential' | 'industry' | 'agriculture' | 'resources' | 'energy' | 'port' | 'airport' | 'military' | 'research' | 'economy' | 'infrastructure'
  desc: string
  terrains: string[] /* مجاز در این ترِین‌ها ('any' = همه) */
  coastal: boolean /* فقط استان ساحلی */
  capitalOnly: boolean /* فقط استان پایتخت */
  maxPerProvince: number
  empireCap: number /* سقف کل در یک کشور */
  baseCost: CvCost /* هزینه‌ی سطح ۱ */
  baseTime: number /* ثانیه‌ی ساخت سطح ۱ */
  baseProd: CvProd /* تولید در «دقیقه» در سطح ۱ */
  atkPct?: number /* ٪ قدرت حمله در هر سطح (زنجیره‌ی calculateTotalAttack) */
  defPct?: number /* ٪ کاهش تلفات خودی در هر سطح */
  goldPct?: number /* ٪ درآمد طلای امپراتوری در هر سطح */
  oilCap?: number /* افزایش سقف نفت در هر سطح */
  req?: 'power' /* نیاز پیش‌نیاز در همان استان */
}

export const CV_BUILDINGS: CvBuildingDef[] = [
  { id: 'gov', fa: 'مرکز حکومت', icon: '🏛️', cat: 'government', desc: 'قلب اداری استان پایتخت — درآمد کل امپراتوری را بالا می‌برد.', terrains: ['any'], coastal: false, capitalOnly: true, maxPerProvince: 1, empireCap: 1, baseCost: { g: 2200, o: 200, f: 600 }, baseTime: 45, baseProd: { gold: 15 }, goldPct: 1 },
  { id: 'house', fa: 'منطقة مسکونی', icon: '🏠', cat: 'residential', desc: 'جمعیت و مالیات — درآمد پایدار طلا و کمی غذا.', terrains: ['any'], coastal: false, capitalOnly: false, maxPerProvince: 2, empireCap: 12, baseCost: { g: 500, o: 0, f: 250 }, baseTime: 20, baseProd: { gold: 10, food: 2 } },
  { id: 'farm', fa: 'مزارع', icon: '🌾', cat: 'agriculture', desc: 'تأمین غذای ارتش و مردم.', terrains: ['plains', 'hills'], coastal: false, capitalOnly: false, maxPerProvince: 2, empireCap: 10, baseCost: { g: 600, o: 0, f: 300 }, baseTime: 22, baseProd: { food: 14 } },
  { id: 'factory', fa: 'کارخانه', icon: '🏭', cat: 'industry', desc: 'ستون تولید صنعتی — به برق نیاز دارد.', terrains: ['plains', 'hills'], coastal: false, capitalOnly: false, maxPerProvince: 2, empireCap: 8, baseCost: { g: 1400, o: 120, f: 400 }, baseTime: 40, baseProd: { gold: 26 }, req: 'power' },
  { id: 'oil_rig', fa: 'تجهیزات نفت و گاز', icon: '🛢️', cat: 'resources', desc: 'استخراج نفت — فقط در زمین‌های نفت‌خیز و ساحل.', terrains: ['desert', 'hills', 'plains'], coastal: false, capitalOnly: false, maxPerProvince: 2, empireCap: 8, baseCost: { g: 1200, o: 0, f: 300 }, baseTime: 38, baseProd: { oil: 16, gold: 4 } },
  { id: 'mine', fa: 'معدن', icon: '⛏️', cat: 'resources', desc: 'معادن کوهستان — طلا و کمی نفت شیل.', terrains: ['mountain', 'hills'], coastal: false, capitalOnly: false, maxPerProvince: 2, empireCap: 8, baseCost: { g: 1100, o: 0, f: 250 }, baseTime: 35, baseProd: { gold: 14, oil: 4 } },
  { id: 'power', fa: 'نیروگاه', icon: '⚡', cat: 'energy', desc: 'برقِ کارخانه‌ها و شهرها — پیش‌نیاز صنعت.', terrains: ['plains', 'hills', 'desert', 'mountain'], coastal: false, capitalOnly: false, maxPerProvince: 1, empireCap: 6, baseCost: { g: 1500, o: 150, f: 300 }, baseTime: 42, baseProd: { gold: 12 } },
  { id: 'port', fa: 'بندر', icon: '⚓', cat: 'port', desc: 'تجارت دریایی — ناوگان اقیانوس‌پیما را تقویت می‌کند.', terrains: ['any'], coastal: true, capitalOnly: false, maxPerProvince: 1, empireCap: 5, baseCost: { g: 1600, o: 200, f: 400 }, baseTime: 50, baseProd: { gold: 16 } },
  { id: 'airport', fa: 'فرودگاه', icon: '✈️', cat: 'airport', desc: 'پشتیبانی هوایی — برد و توان نیروی هوایی.', terrains: ['plains', 'desert', 'hills'], coastal: false, capitalOnly: false, maxPerProvince: 1, empireCap: 4, baseCost: { g: 1600, o: 200, f: 400 }, baseTime: 50, baseProd: { gold: 10 } },
  { id: 'barracks', fa: 'پادگان', icon: '🛡️', cat: 'military', desc: 'آموزش و سازمان نیروی زمینی — +% قدرت حمله.', terrains: ['plains', 'hills', 'mountain', 'desert'], coastal: false, capitalOnly: false, maxPerProvince: 1, empireCap: 6, baseCost: { g: 1300, o: 180, f: 400 }, baseTime: 45, baseProd: {}, atkPct: 1.5 },
  { id: 'defense', fa: 'خط دفاعی', icon: '🏰', cat: 'military', desc: 'استحکامات مرزی — ٪ تلفات خودی در نبرد کمتر می‌شود.', terrains: ['mountain', 'hills', 'plains', 'desert'], coastal: false, capitalOnly: false, maxPerProvince: 1, empireCap: 6, baseCost: { g: 1500, o: 150, f: 350 }, baseTime: 48, baseProd: {}, defPct: 2 },
  { id: 'university', fa: 'دانشگاه', icon: '🔬', cat: 'research', desc: 'تولید امتیاز پژوهش برای خطوط فناوری.', terrains: ['any'], coastal: false, capitalOnly: false, maxPerProvince: 1, empireCap: 5, baseCost: { g: 1200, o: 0, f: 400 }, baseTime: 45, baseProd: { rp: 1.2, gold: 6 } },
  { id: 'bank', fa: 'بانک مرکزی', icon: '🏦', cat: 'economy', desc: 'مالیِ امپراتوری — فقط در پایتخت؛ طلا و ٪ درآمد.', terrains: ['any'], coastal: false, capitalOnly: true, maxPerProvince: 2, empireCap: 2, baseCost: { g: 1800, o: 0, f: 500 }, baseTime: 50, baseProd: { gold: 20 }, goldPct: 0.5 },
  { id: 'storage', fa: 'انبار راهبردی', icon: '📦', cat: 'infrastructure', desc: 'ظرفیت ذخیره‌ی نفت امپراتوری را بالا می‌برد.', terrains: ['any'], coastal: false, capitalOnly: false, maxPerProvince: 1, empireCap: 5, baseCost: { g: 900, o: 0, f: 300 }, baseTime: 30, baseProd: {}, oilCap: 2500 },
]

const CV_BUILDING_MAP = new Map(CV_BUILDINGS.map((x) => [x.id, x]))
export function cvDef(id: string): CvBuildingDef | undefined {
  return CV_BUILDING_MAP.get(id)
}

/* ---------- فرمول‌های سطح ---------- */
export function cvCost(def: CvBuildingDef, level: number): CvCost {
  const m = Math.pow(1.6, Math.max(0, level - 1))
  return { g: Math.round(def.baseCost.g * m), o: Math.round(def.baseCost.o * m), f: Math.round(def.baseCost.f * m) }
}
export function cvTimeSec(def: CvBuildingDef, level: number, logMult = 1): number {
  const t = def.baseTime * Math.pow(1.45, Math.max(0, level - 1)) * logMult
  return Math.max(15, Math.round(t))
}
export function cvProdPerMin(def: CvBuildingDef, level: number): CvProd {
  const out: CvProd = {}
  for (const k of Object.keys(def.baseProd) as (keyof CvProd)[]) {
    const v = def.baseProd[k] || 0
    if (v) out[k] = Math.round(v * level * 10) / 10
  }
  return out
}

/* ---------- فناوری (۳ خط × ۵ سطح) ---------- */
export type CvTechLine = 'eco' | 'mil' | 'log'
export const CV_TECH: Record<CvTechLine, { fa: string; icon: string; desc: string; max: number; costs: number[] }> = {
  eco: { fa: 'اقتصاد', icon: '💰', desc: '۶٪ تولید بیشتر در هر سطح (طلا/نفت/غذا)', max: 5, costs: [20, 45, 80, 125, 180] },
  mil: { fa: 'نظامی', icon: '⚔️', desc: '۳٪ قدرت حمله‌ی بیشتر در هر سطح', max: 5, costs: [25, 55, 95, 145, 205] },
  log: { fa: 'لجستیک', icon: '🚚', desc: '۶٪ ساخت سریع‌تر در هر سطح (تا ۳۰٪)', max: 5, costs: [15, 35, 65, 105, 155] },
}
export const CV_TECH_FA_MAX = 5

export function cvTechMults(tech: { eco?: number; mil?: number; log?: number }) {
  const eco = 1 + 0.06 * Math.min(5, Math.max(0, tech.eco || 0))
  const mil = 1 + 0.03 * Math.min(5, Math.max(0, tech.mil || 0))
  const log = Math.max(0.7, 1 - 0.06 * Math.min(5, Math.max(0, tech.log || 0)))
  return { eco, mil, log }
}

/* سقف ۸ ساعت تولید آفلاین — ضد جعل فاصله‌ی زمانی */
export const CV_OFFLINE_CAP_MS = 8 * 3600_000

/* خلاصه‌ی عمومی کاتالوگ برای کلاینت (فقط فیلدهای نمایشی) */
export function cvCatalogPublic() {
  return CV_BUILDINGS.map((d) => ({
    id: d.id, fa: d.fa, icon: d.icon, cat: d.cat, desc: d.desc,
    terrains: d.terrains, coastal: d.coastal, capitalOnly: d.capitalOnly,
    maxPerProvince: d.maxPerProvince, empireCap: d.empireCap,
    cost1: cvCost(d, 1), time1: cvTimeSec(d, 1), prod1: cvProdPerMin(d, 1),
    atkPct: d.atkPct || 0, defPct: d.defPct || 0, goldPct: d.goldPct || 0, oilCap: d.oilCap || 0,
    req: d.req || null,
  }))
}
