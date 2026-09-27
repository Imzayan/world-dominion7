/* ============================================================
   V67 — COUNTRY VIEW ENGINE: هندسه و Layout استان‌ها (سمت سرور)
   - از همان فایل GeoJSON رسمی بازی (public/cdn/geo/countries.geo.json)
     استفاده می‌کند — هیچ داده‌ی موازی جغرافیایی ساخته نمی‌شود.
   - Layout برای هر کشور یک‌بار با seed قطعی تولید و در DB (cv_countries)
     ذخیره می‌شود؛ پس هر بازیکن/هر دستگاه همان نقشه را می‌بیند.
   - ساحل بودنِ هر استان با تست واقعی «همسایه‌ی خشکی یا دریا» تعیین می‌شود:
     نمونه‌ای بیرونِ نزدیک‌ترین ضلع، داخل هیچ کشور دیگری نباشد => دریا.
   - ترِین از روی عرض جغرافیایی واقعی مرکز استان + hash قطعی: tundra/desert/
     mountain/hills/plains.
   ============================================================ */
import fs from 'fs'
import path from 'path'

type Ring = [number, number][]
type Feature = { properties: { name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }

let GEO: { features: Feature[] } | null = null
let RING_BY_NAME: Map<string, Ring> | null = null

function loadGeo(): Map<string, Ring> {
  if (RING_BY_NAME) return RING_BY_NAME
  const map = new Map<string, Ring>()
  try {
    const p = path.join(process.cwd(), 'public', 'cdn', 'geo', 'countries.geo.json')
    GEO = JSON.parse(fs.readFileSync(p, 'utf8'))
    for (const f of GEO!.features) {
      const g = f.geometry
      const rings: Ring[] = []
      if (g.type === 'Polygon') rings.push(...(g.coordinates as number[][][]).map((r) => r.map((c) => [c[0], c[1]] as [number, number])))
      else if (g.type === 'MultiPolygon') for (const poly of g.coordinates as number[][][][]) rings.push(...poly.map((r) => r.map((c) => [c[0], c[1]] as [number, number])))
      if (!rings.length) continue
      /* بزرگ‌ترین رینگ = سرزمین اصلی — مبنای layout */
      let best: Ring = rings[0]
      let bestA = Math.abs(ringAreaKm2(rings[0]))
      for (const r of rings) {
        const a = Math.abs(ringAreaKm2(r))
        if (a > bestA) { best = r; bestA = a }
      }
      map.set(f.properties.name, best)
    }
  } catch (e) {
    console.log('cvGeo load', e)
  }
  RING_BY_NAME = map
  return map
}

/* ---------- ریاضیات مسطحاتی سبک (equirectangular محلی) ---------- */
const KM_LAT = 111.32
function kmPerLon(lat: number): number { return Math.max(1, KM_LAT * Math.cos((lat * Math.PI) / 180)) }

function ringAreaKm2(ring: Ring): number {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1])
  }
  const latC = ring.reduce((s, p) => s + p[1], 0) / Math.max(1, ring.length)
  return (a / 2) * KM_LAT * kmPerLon(latC)
}

function bboxOf(ring: Ring) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90
  for (const [x, y] of ring) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY }
}

function pip(ring: Ring, x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function centroidOf(ring: Ring): [number, number] {
  /* مرکز جرم ساده — برای کشورهای کشیده تقریب کافی است */
  let x = 0, y = 0
  for (const p of ring) { x += p[0]; y += p[1] }
  return [x / ring.length, y / ring.length]
}

/* کمترین فاصله تا اضلاع رینگ (کیلومتر) + ایندکس ضلع نزدیک‌ترین */
function nearestEdge(ring: Ring, x: number, y: number): { dKm: number; seg: number } {
  const kx = kmPerLon(y)
  let best = Infinity, bestSeg = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = ring[j][0], ay = ring[j][1], bx = ring[i][0], by = ring[i][1]
    const dx = (bx - ax) * kx, dy = (by - ay) * KM_LAT
    const px = (x - ax) * kx, py = (y - ay) * KM_LAT
    const len2 = dx * dx + dy * dy || 1e-9
    let t = (px * dx + py * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const ex = px - t * dx, ey = py - t * dy
    const d = Math.sqrt(ex * ex + ey * ey)
    if (d < best) { best = d; bestSeg = j }
  }
  return { dKm: best, seg: bestSeg }
}

/* ---------- RNG قطعی ---------- */
export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  /* محدود به بازه‌ی مثبت Int32 — ستون seed در DB از نوع Int است */
  return (h >>> 0) % 2147483647
}
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- پروفایل کشور (آینه‌ی REAL_POWER_DATABASE کلاینت — index.html:1009) ---------- */
const PROFILE: Record<string, { popM: number; oil: number }> = {
  'United States of America': { popM: 335, oil: 5000 }, China: { popM: 1412, oil: 4000 }, Russia: { popM: 144, oil: 4500 },
  India: { popM: 1408, oil: 2200 }, 'United Kingdom': { popM: 67, oil: 900 }, France: { popM: 68, oil: 800 },
  Japan: { popM: 125, oil: 600 }, Pakistan: { popM: 235, oil: 400 }, Turkey: { popM: 85, oil: 500 },
  Iran: { popM: 88, oil: 4200 }, Germany: { popM: 83, oil: 700 }, Brazil: { popM: 214, oil: 1500 },
  Egypt: { popM: 106, oil: 700 }, 'Saudi Arabia': { popM: 36, oil: 5500 }, Australia: { popM: 26, oil: 1200 },
}
export function cvProfileOf(country: string): { popM: number; oil: number } {
  return PROFILE[country] || { popM: 20, oil: 1000 }
}

/* ---------- تولید Layout قطعی ---------- */
export type CvProvince = { i: number; lat: number; lng: number; type: string; terrain: string; coastal: boolean; slots: number }

export function cvGenerateLayout(country: string): { seed: number; provinces: CvProvince[] } {
  const seed = hashSeed('wd67:' + country)
  const rnd = mulberry32(seed)
  const ring = loadGeo().get(country)
  if (!ring || ring.length < 8) {
    /* fallback بدون جغرافیا (نباید رخ دهد) — گرید ساده تا بازی نشکند */
    const provs: CvProvince[] = []
    for (let i = 0; i < 4; i++) provs.push({ i, lat: 0 + i, lng: 0 + i, type: i === 0 ? 'capital' : 'generic', terrain: 'plains', coastal: false, slots: i === 0 ? 6 : 4 })
    return { seed, provinces: provs }
  }
  const bb = bboxOf(ring)
  const area = Math.abs(ringAreaKm2(ring))
  /* ۳+sqrt(km²/1000)/۳: لوکزامبورگ≈۳ ، پرتغال≈۶ ، ژاپن≈۸ ، ایران/روسیه=۸ */
  const N = Math.max(3, Math.min(8, 3 + Math.floor(Math.sqrt(area / 1000) / 3)))
  const [cx, cy] = centroidOf(ring)
  const kx = kmPerLon(cy)

  /* پراکندگی شبیه Poisson داخل پلی‌گان واقعی */
  const minD = Math.max(60, Math.sqrt(area / N) * 0.55)
  const pts: [number, number][] = []
  const allRings = loadGeo()
  let guard = 0
  while (pts.length < N && guard < N * 600) {
    guard++
    const x = bb.minX + rnd() * (bb.maxX - bb.minX)
    const y = bb.minY + rnd() * (bb.maxY - bb.minY)
    if (!pip(ring, x, y)) continue
    let ok = true
    for (const p of pts) {
      const dx = (x - p[0]) * kx, dy = (y - p[1]) * KM_LAT
      if (Math.sqrt(dx * dx + dy * dy) < minD) { ok = false; break }
    }
    if (ok) pts.push([x, y])
  }
  /* fallback فشرده در صورت نقاط کم */
  while (pts.length < N) {
    const x = cx + (rnd() - 0.5) * Math.max(0.4, (bb.maxX - bb.minX) / (N + 1))
    const y = cy + (rnd() - 0.5) * Math.max(0.4, (bb.maxY - bb.minY) / (N + 1))
    pts.push([x, y])
  }

  /* پایتخت = نزدیک‌ترین نقطه به مرکز جرم */
  let capIdx = 0, capD = Infinity
  pts.forEach((p, i) => {
    const dx = (p[0] - cx) * kx, dy = (p[1] - cy) * KM_LAT
    const d = dx * dx + dy * dy
    if (d < capD) { capD = d; capIdx = i }
  })

  /* ساحل واقعی: نزدیک ضلع + بیرونش خشکیِ هیچ کشور دیگری نباشد */
  const coastKm = Math.max(60, Math.sqrt(area) / 6)
  const names = [...allRings.keys()]
  const isCoastal = (p: [number, number]): boolean => {
    const ne = nearestEdge(ring, p[0], p[1])
    if (ne.dKm > coastKm) return false
    /* نمونه‌ی بیرونی کمی جلوتر از وسط ضلع نزدیک */
    const a = ring[ne.seg], b = ring[(ne.seg + 1) % ring.length]
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    const ux = mx - p[0], uy = my - p[1]
    const ul = Math.sqrt(ux * ux + uy * uy) || 1e-9
    const ex = mx + (ux / ul) * 0.3, ey = my + (uy / ul) * 0.3
    for (const nm of names) {
      if (nm === country) continue
      const r2 = allRings.get(nm)!
      if (pip(r2, ex, ey)) return false /* همسایه‌ی خشکی */
    }
    return true /* دریا */
  }

  /* ترِین از عرض جغرافیایی واقعی + hash */
  const terrainOf = (p: [number, number]): string => {
    const h = hashSeed(country + ':' + p[0].toFixed(3) + ',' + p[1].toFixed(3))
    const r = h % 100
    const alat = Math.abs(p[1])
    if (alat >= 58) return 'tundra'
    if (alat >= 14 && alat <= 33 && r < 42) return 'desert'
    if (r < 16) return 'mountain'
    if (r < 42) return 'hills'
    return 'plains'
  }

  /* تایپ استان‌ها بر اساس پروفایل واقعی */
  const prof = cvProfileOf(country)
  const order = pts.map((_, i) => i).filter((i) => i !== capIdx)
  /* shuffle قطعی برای تخصیص عادلانه */
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const typeOf: Record<number, string> = {}
  typeOf[capIdx] = 'capital'
  let k = 0
  if (prof.oil >= 2500 && order.length) typeOf[order[k++]] = 'resource'
  if (prof.popM >= 90 && k < order.length) typeOf[order[k++]] = 'industrial'
  if (k < order.length) typeOf[order[k++]] = 'industrial'
  if (k < order.length) typeOf[order[k++]] = 'agricultural'
  if (k < order.length && prof.popM >= 60) typeOf[order[k++]] = 'agricultural'
  for (const i of order) if (!typeOf[i]) typeOf[i] = 'generic'

  const provinces: CvProvince[] = pts.map((p, i) => {
    const type = typeOf[i]
    const terrain = i === capIdx ? 'plains' : terrainOf(p)
    const slots = i === capIdx ? (prof.popM >= 100 ? 8 : 6) : 3 + (hashSeed(country + ':s' + i) % 2) + (type === 'generic' ? 1 : 0)
    return { i, lat: Math.round(p[1] * 10000) / 10000, lng: Math.round(p[0] * 10000) / 10000, type, terrain, coastal: isCoastal(p), slots }
  })
  /* قرارداد ثابت: استان شماره‌ی صفر همیشه پایتخت است — بقیه به ترتیب قطعی قبلی */
  provinces.sort((a, b) => (a.type === 'capital' ? -1 : b.type === 'capital' ? 1 : a.i - b.i))
  provinces.forEach((p, idx) => { p.i = idx })
  return { seed, provinces }
}

/* نقطه داخل پلی‌گان کشور؟ (برای تست و دیباگ سرور) */
export function cvPointInCountry(country: string, x: number, y: number): boolean {
  const ring = loadGeo().get(country)
  return ring ? pip(ring, x, y) : false
}

/* ============================================================
   V74 — COUNTRY VIEW AAA: هویت استان‌ها و شهرها (سمت سرور، قطعی)
   - چون layout قدیمی در DB ذخیره شده، غنی‌سازی «در زمان خواندن» و از روی
     seed ذخیره‌شده انجام می‌شود تا ردیف‌های قدیمی هم هویت بگیرند (بدون مهاجرت).
   - این آمار «هویت/نمایشی» است؛ اقتصاد واقعی همان ساختمان‌های فعال‌اند
     (cvAccrue) — هیچ منبعی از این آمار کلاینت‌محور تولید نمی‌شود.
   ============================================================ */
export type CvCity = { name: string; kind: string; lat: number; lng: number; popK: number }
export type CvProvStats = { pop: number; ind: number; agri: number; oil: number; en: number; infra: number; stab: number; def: number; dev: number }
export type CvProvinceRich = CvProvince & { stats: CvProvStats; cities: CvCity[] }

const CITY_KIND_FA: Record<string, string> = {
  metro: 'شهر مرکزی', industrial: 'شهرک صنعتی', agri: 'شهر کشاورزی', port: 'بندر', oil: 'شهر نفتی', military: 'شهرک نظامی', mountain: 'شهر کوهپایه‌ای',
}
export function cvCityKindFa(kind: string): string { return CITY_KIND_FA[kind] || 'شهر' }

/* آمار هویتی استان — قطعی از (country, seed, i, type, terrain, coastal) */
function statsOf(country: string, seed: number, p: CvProvince): CvProvStats {
  const h = (salt: string) => hashSeed(country + ':' + seed + ':' + p.i + ':' + salt) % 100
  const base = { pop: 0, ind: 0, agri: 0, oil: 0, en: 0, infra: 0, stab: 0, def: 0, dev: 0 }
  /* پایه بر اساس تایپ */
  switch (p.type) {
    case 'capital': base.pop = 62 + h('pp') % 30; base.ind = 46 + h('in') % 26; base.agri = 22 + h('ag') % 18; base.oil = 18 + h('oi') % 18; base.en = 55 + h('en') % 22; base.infra = 60 + h('if') % 24; base.stab = 62 + h('st') % 18; base.def = 48 + h('df') % 20; base.dev = 58 + h('dv') % 22; break
    case 'industrial': base.pop = 44 + h('pp') % 22; base.ind = 58 + h('in') % 26; base.agri = 20 + h('ag') % 16; base.oil = 20 + h('oi') % 16; base.en = 48 + h('en') % 20; base.infra = 48 + h('if') % 22; base.stab = 50 + h('st') % 18; base.def = 40 + h('df') % 18; base.dev = 46 + h('dv') % 20; break
    case 'agricultural': base.pop = 30 + h('pp') % 18; base.ind = 18 + h('in') % 14; base.agri = 60 + h('ag') % 26; base.oil = 12 + h('oi') % 12; base.en = 24 + h('en') % 16; base.infra = 30 + h('if') % 18; base.stab = 52 + h('st') % 18; base.def = 28 + h('df') % 14; base.dev = 30 + h('dv') % 16; break
    case 'resource': base.pop = 26 + h('pp') % 14; base.ind = 26 + h('in') % 16; base.agri = 16 + h('ag') % 12; base.oil = 62 + h('oi') % 30; base.en = 40 + h('en') % 18; base.infra = 32 + h('if') % 18; base.stab = 46 + h('st') % 16; base.def = 34 + h('df') % 16; base.dev = 32 + h('dv') % 18; break
    default: base.pop = 24 + h('pp') % 18; base.ind = 22 + h('in') % 18; base.agri = 26 + h('ag') % 20; base.oil = 16 + h('oi') % 14; base.en = 22 + h('en') % 14; base.infra = 26 + h('if') % 16; base.stab = 48 + h('st') % 16; base.def = 30 + h('df') % 16; base.dev = 26 + h('dv') % 16
  }
  /* اصلاح جغرافیایی */
  if (p.terrain === 'mountain') { base.def += 12; base.agri = Math.max(6, base.agri - 12); base.infra = Math.max(6, base.infra - 8) }
  if (p.terrain === 'desert') { base.agri = Math.max(4, base.agri - 16); base.oil += 8 }
  if (p.terrain === 'tundra') { base.agri = Math.max(4, base.agri - 14); base.pop = Math.max(6, base.pop - 8) }
  if (p.terrain === 'plains') base.agri += 8
  if (p.coastal) { base.infra += 6; base.pop += 4 }
  for (const k of Object.keys(base) as (keyof CvProvStats)[]) base[k] = Math.max(4, Math.min(98, Math.round(base[k])))
  return base
}

/* شهرهای استان — ۲ تا ۴ شهر قطعی با نام تابعی (برای همه‌ی کشورها معنادار) */
function citiesOf(country: string, seed: number, p: CvProvince, stats: CvProvStats): CvCity[] {
  const rnd = mulberry32(hashSeed(country + ':c' + seed + ':' + p.i))
  const n = 2 + Math.floor(rnd() * 3) /* ۲..۴ */
  const kx = kmPerLon(p.lat)
  const kindPool: string[] = p.type === 'industrial' ? ['metro', 'industrial', 'industrial', 'agri']
    : p.type === 'agricultural' ? ['agri', 'agri', 'metro', 'mountain']
    : p.type === 'resource' ? ['oil', 'oil', 'industrial', 'metro']
    : p.coastal ? ['metro', 'port', 'industrial', 'agri']
    : p.terrain === 'mountain' ? ['metro', 'mountain', 'military', 'agri']
    : ['metro', 'agri', 'military', 'industrial']
  if (p.coastal) kindPool[0] = 'port' /* استان ساحلی: شهر اول بندرِ اصلی */
  const out: CvCity[] = []
  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2
    const dist = (8 + rnd() * 22) /* کیلومتر از مرکز استان */
    const dLat = (dist * Math.sin(ang)) / KM_LAT
    const dLng = (dist * Math.cos(ang)) / kx
    const kind = i === 0 ? kindPool[0] : kindPool[1 + (i % (kindPool.length - 1))]
    const popK = Math.max(40, Math.round((stats.pop * (i === 0 ? 9 : 3) * (0.5 + rnd())) * 10) / 10)
    out.push({ name: cvCityKindFa(kind) + (i === 0 ? ' اصلی' : ' ' + (i + 1)), kind, lat: Math.round((p.lat + dLat) * 10000) / 10000, lng: Math.round((p.lng + dLng) * 10000) / 10000, popK })
  }
  return out
}

/* غنی‌سازی لیست استان‌های ذخیره‌شده (قدیمی/جدید) با هویت — بدون تغییر DB */
export function cvEnrich(country: string, seed: number, provinces: CvProvince[]): CvProvinceRich[] {
  return (provinces || []).map((p) => {
    const stats = statsOf(country, seed, p)
    return { ...p, stats, cities: citiesOf(country, seed, p, stats) }
  })
}

/* کشور در GeoJSON رسمی هست؟ (ضد ردیف‌های بی‌معنا در cvEnsure) */
export function cvCountryExists(country: string): boolean {
  return loadGeo().has(country)
}
