/* ============================================================
   WORLD DOMINION — V78 COUNTRY VIEW ENGINE (client) — VISUAL BUG FIX + PREMIUM MAP POLISH
   cv-engine.js — با lazy-load فقط هنگام اولین «ورود به کشور» لود می‌شود.
   معماری: Data-Driven + Performance-First (ارتقا روی همان V74/V75 — نه بازنویسی)
   - تک rAF loop — تیک ۱ثانیه‌ای داخل همان loop
   - همه‌ی وضعیت گیم‌پلی از سرور (cv_state) — کلاینت فقط رندر/ورودی
   - Voronoi قطعی روی پلی‌گان واقعی کشور + LOD چهارسطحی + Culling + Pooling + Tier
   - V76: زبان بصری ساختمان (پالت دسته‌ای + رشد با سطح)، بافت terrain (کوه/جنگل/
     تلماسه/نوار مزرعه)، نشان هویت استان (برداری، بدون emoji)، خوشه‌ی شهر ۳سطحی،
     جاده‌ی ارگانیک چند-پیچی، Objectives/Story از داده‌ی واقعی، Landmark (≤۳)،
     هدر چیپ‌محور ریسپانسیو با جزئیات بازشو
   - V77 (پریمیوم + پرفورمنس): FIT COUNTRY (بند ۲۲)، clamp دوربین (۴۸)، skip رندر بی‌کار
     (۲۶)، سایه‌ی tiered (۱۱)، هویت بصری شهر از city.kind واقعی (۷)، تراکم شهر در z بالا
     (۶)، ریل فقط-ویژوال داده‌محور + قطار (۱۵/۱۳)، نوار عمق ساحل (۱۷)، hover ملایم (۵)،
     hysteresis عملکرد با بازگشت (۳۱) — همه روی همین موتور، بدون بازنویسی و بدون RPC جدید
   - صدا: سینت WebAudio سبک (بدون فایل/شبکه، بعد از اولین تعامل)
   - حداکثر ~۴۰ نود DOM (پنل‌ها) — هیچ DOM-Element-per-building
   - V78 (رفع باگ بصری + پالیش — بدون Feature جدید):
     §24 ریشه‌ای: bake استاتیک در فضای جهان (دوربین خنثی) + رسم با transform دوربین —
       pan دیگر زمین را منجمد نمی‌گذارد (باگ V≤77: static با دوربینِ لحظه‌ی bake می‌ماند)
     §1-§6/§25: سیستم لیبل شهر — اولویت ۱۰۰/۸۰/۶۰/۳۰ + Box Collision + cache؛
       بدون عدد کنار اسم (بند ۴)، پایتخت = «پایتخت» + ستاره برداری (بند ۶)
     §8-§10: LOD سه‌گانه‌ی ساختمان (سیلوئت/شناختنی/جزئیات) + آستانه‌ی ۲px
     §13/§14: خوشه‌ی شهر با پالت مات + ترکیب لندمارک پایتخت — بدون مربع‌های سفید
     §15/§16: شبکه‌ی جاده‌ی درختی (نه شعاعی) + LOD سه‌طبقه‌ای tier
     §20/§21: حذف White-pixel noise (چراغ‌ها/pips سطح/هاله‌ی پالسی/گلیف generic)
     §22/§23: خودرو فقط z≥2 با سقف tier (۳/۶) + سیلوئت هواپیمای واقعی
     §11/§12: FIT ۷۲٪ فضای مفید بین safe-area بالا/پایین
   ============================================================ */
(function () {
  'use strict'
  if (window.WDCV) return

  /* ---------- وضعیت سراسری موتور ---------- */
  const S = {
    active: false, country: null, server: 1,
    provinces: [], cells: [], buildings: [], cat: [], techCat: {},
    tech: {}, rp: 0, rates: { gold: 0, oil: 0, food: 0, rp: 0 },
    mil: { atkPct: 0, defPct: 0 }, counts: { ports: 0, airports: 0 },
    res: { gold: 0, oil: 0, food: 0 }, resAt: 0, maxLevel: 10, offlineCapMs: 0,
    sel: { prov: -1, bld: null, slot: null },
    hover: -1,          /* V77 §5: استان زیر نشانگر (فقط دسکتاپ) */
    tier: 'med', cam: { x: 0, y: 0, z: 1.4, tx: 0, ty: 0, tz: 1.4, anim: false },
    ring: null, bbox: null, lastFrame: 0, frameMs: 60, paused: false,
    lastPoll: 0, pollTimer: null, builtOnce: false, dirtyStatic: true,
    /* ---- V74 ---- */
    seed: 0, focus: {}, focusCat: {},
    enter: null,          /* فاز ورود WOW: {t0, done} */
    acc: 0, hdrT: 0,      /* انباشت‌کننده‌ی تیک ۱ثانیه‌ای داخل loop (بدون setInterval) */
    doneIds: null,        /* برای تشخیص «تکمیل ساخت» در loop → فلش+صدا */
    sndOn: true,
    tabCat: 'all',        /* تب فعال کاتالوگ در پنل استان */
    obj: null,            /* V76: هدف فعال (از داده‌ی واقعی — بند ۱۴) */
    _lm: null,            /* V76: لندمارک‌های فعلی (حداکثر ۳ — بند ۱۶) */
    _lbl: null,           /* V78 §25: cache لیبل‌ها — فقط با تغییر دوربین/داده بازچینی */
    _rn: null,            /* V78 §15: cache شبکه‌ی جاده (درختی، قطعی) */
    _ambDrawn: 0,         /* V78 QA: شمارنده‌ی فریم‌های رسم خودرو */
  }
  /* ---------- دسترسی امن به bindingهای سراسری بازی (let/const — روی window نیستند) ---------- */
  function gameRef(name) {
    try { switch (name) {
      case 'layersByName': return typeof layersByName !== 'undefined' ? layersByName : null
      case 'map': return typeof map !== 'undefined' ? map : (window.map || null)
      case 'faName': return (window.WD_ULT && window.WD_ULT.faName) || (typeof faName !== 'undefined' ? faName : null)
      case 'FA': return typeof FA !== 'undefined' ? FA : (window.FA || null)
      case 'getCountryData': return typeof getCountryData !== 'undefined' ? getCountryData : null
      case 'playerRes': return typeof playerRes !== 'undefined' ? playerRes : window.playerRes
      case 'updateUI': return typeof updateUI !== 'undefined' ? updateUI : window.updateUI
      case 'calculateTotalAttack': return typeof calculateTotalAttack !== 'undefined' ? calculateTotalAttack : window.calculateTotalAttack
      case 'airBonus': return typeof airBonus !== 'undefined' ? airBonus : window.airBonus
      case 'ovsMult': return typeof ovsMult !== 'undefined' ? ovsMult : window.ovsMult
      case 'SRV': return typeof SRV !== 'undefined' ? SRV : window.SRV
      case 'FL': return typeof FL !== 'undefined' ? FL : (window.FL || null)
      case 'N2C': return typeof N2C !== 'undefined' ? N2C : (window.N2C || null)
      case 'rankOf': return typeof rankOf !== 'undefined' ? rankOf : window.rankOf
      case 'wdTerrCount': return typeof wdTerrCount !== 'undefined' ? wdTerrCount : window.wdTerrCount
      case 'syncTerr': return typeof syncTerr !== 'undefined' ? syncTerr : (window.syncTerr || null) /* V80 §ENTRY */
    } } catch (e) {}
    return null
  }
  window.WDCV = { S, open, close, rpc, version: 82, openProvPanel, selectBuilding, openCityPanel, openTech }

  /* ---------- Quality Tier (یک‌بار در ابتدا + افت خودکار) ---------- */
  function detectTier() {
    const mem = navigator.deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    let score = 0
    if (mem >= 6) score += 2
    else if (mem >= 4) score += 1
    if (cores >= 8) score += 2
    else if (cores >= 4) score += 1
    if (dpr >= 2) score += 1
    const t = score >= 4 ? 'high' : score >= 2 ? 'med' : 'low'
    try { const saved = localStorage.getItem('wdcv_tier'); if (saved) return saved } catch (e) {}
    return t
  }
  /* V77 §11/§29: سایه — Low=خاموش | Medium=ساده | High=جهت‌دار (روی سایت رسم) */
  /* V78: roads سه‌طبقه (۱=فقط اصلی | ۲=+فرعی مهم | ۳=شبکه کامل — بند ۱۶).
     ambient سقف خودرو: Low=0 | Med=۳ | High=۶ (بند ۲۲: ۲-۴ / ۴-۸ — نه صدها).
     lights حذف شد (بند ۲۱: نقطه‌های ریس فلیکر = white noise). */
  const TIER = {
    low:  { particles: 0,  deco: 0, shadows: false, maxDpr: 1,   ambient: 0,  lights: 0, smoke: 0, roads: 1 },
    med:  { particles: 8,  deco: 1, shadows: true,  maxDpr: 1.5, ambient: 3,  lights: 0, smoke: 2, roads: 2 },
    high: { particles: 18, deco: 2, shadows: true,  maxDpr: 2,   ambient: 6,  lights: 0, smoke: 4, roads: 3 },
  }
  S.tier = detectTier()
  function tierCfg() { return TIER[S.tier] || TIER.med }
  function degradeTier() {
    if (S._tierCd > 0) return /* V77 §31: hysteresis — بعد از هر تغییر ۳۰ثانیه آرامش */
    if (S.tier === 'high') S.tier = 'med'
    else if (S.tier === 'med') S.tier = 'low'
    else return
    try { localStorage.setItem('wdcv_tier', S.tier) } catch (e) {}
    S.dirtyStatic = true; S._tierCd = 30
  }
  /* V77 §31: بازگشت tier فقط بعد از ۴۵ثانیه FPS پایدار — ذخیره نمی‌شود تا سشن بعد
     تشخیص تازه انجام شود (فلپ‌فلپ بین tierها ممنوع) */
  function restoreTier() {
    if (S.tier === 'low') S.tier = 'med'
    else if (S.tier === 'med') S.tier = 'high'
    else return
    try { localStorage.removeItem('wdcv_tier') } catch (e) {}
    S.dirtyStatic = true
  }

  /* ---------- ابزار ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const lerp = (a, b, t) => a + (b - a) * t
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  function fa(n) { try { return Number(n).toLocaleString('fa-IR') } catch (e) { return String(n) } }
  /* V76: هش قطعی سبک برای پراکندگی/بافت — بدون Math.random تا هر bake یکسان بماند */
  function hash01(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

  async function rpc(fn, args) {
    const r = await fetch('/api/rpc/' + encodeURIComponent(fn), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(args || {}),
    })
    const j = await r.json().catch(() => null)
    if (j && j.error) throw new Error(j.error.message || 'rpc')
    return j ? j.data : null
  }

  /* ---------- هندسه: Voronoi نیم‌صفحه‌ای + برش با رینگ کشور ---------- */
  function clipHalf(poly, a, b) { /* نگه‌داشتن سمتِ نقطه‌ی a از «عمودمنصفِ» ab — V79 FIX:
    فرمول قبلی خطِ عمود بر ab «از خودِ نقطه‌ی a» بود نه عمودمنصف ← سلول‌ها جابجا/فرو-ریخته
    (ریشه‌ی واقعی زمینِ تیره از V74). شرط صحیح: |p-a|² ≤ |p-b|² ⇔ (p-mid)·(b-a) ≤ 0 */
    const out = []
    const mx2 = (a[0] + b[0]) / 2, my2 = (a[1] + b[1]) / 2
    const side = (p) => ((p[0] - mx2) * (b[0] - a[0]) + (p[1] - my2) * (b[1] - a[1]))
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length]
      const sp = side(p), sq = side(q)
      if (sp <= 0) out.push(p)
      if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
        const t = sp / (sp - sq)
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])])
      }
    }
    return out
  }
  function clipRing(poly, ring) { /* برش با چندضلعی محدب-ish کشور (Sutherland–Hodgman) */
    let out = poly
    for (let i = 0; i < ring.length && out.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      out = clipHalf(out, [b[0], b[1]], [a[0], a[1]])
    }
    return out
  }
  function cellOf(seedIdx, seeds, ring) {
    /* V79 FIX (ریشه‌ای): voronoi باید از پلی‌گان «محدب» شروع شود — ring کشور غیر-محدب است و
       Sutherland–Hodgman روی آن فرو می‌ریزد (سلول null/تیکه‌ای ← زمینِ تیره و بافت مصنوعی).
       گام ۱: برش از مستطیل محدبِ bbox با حاشیه ← سلول همیشه کامل و محدب.
       گام ۲: برش با خودِ ring فقط در bake با ctx.clip (غیر-محدب را درست می‌بُرد). */
    let x0 = 180, x1 = -180, y0 = 90, y1 = -90
    for (const p of ring) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1] }
    const mx = (x1 - x0) * 0.25 + 0.2, my = (y1 - y0) * 0.25 + 0.2
    let poly = [[x0 - mx, y0 - my], [x1 + mx, y0 - my], [x1 + mx, y1 + my], [x0 - mx, y1 + my]]
    for (let j = 0; j < seeds.length; j++) {
      if (j === seedIdx) continue
      poly = clipHalf(poly, seeds[seedIdx], seeds[j])
      if (poly.length < 3) break
    }
    return poly
  }

  /* ---------- رنگ زمین‌شناسی ---------- */
  /* V79: پالت نقاشی‌شده — سبزهای گرم و طبیعی (به‌جای سبز نظامی تخت) */
  const TERRAIN = {
    plains: { fill: '#79a455', alt: '#85af60' },
    hills: { fill: '#97ab4f', alt: '#a3b559' },
    mountain: { fill: '#8e9099', alt: '#9a9ca5' },
    desert: { fill: '#dcbc72', alt: '#e5c87e' },
    tundra: { fill: '#a7b8b0', alt: '#b2c2bc' },
  }
  /* V79 STYLE — کلیدهای ظاهر نقاشی‌شده (همه bake-only یا اسپرایت؛ صفر هزینه per-frame) */
  const V79 = {
    seaShore: 'rgba(122,214,224,.30)',   /* فیروزه‌ای نزدیک ساحل */
    seaMid: 'rgba(78,178,204,.20)',
    seaFar: 'rgba(46,120,170,.16)',
    foam: 'rgba(220,246,250,.5)',
    roadEdge: 'rgba(96,74,36,.34)',
    roadFill: '#ecdcae',               /* کرم گرم — روشن‌تر از زمین */
    roadFillSub: 'rgba(236,220,174,.30)',
    pillBg: 'rgba(17,24,32,.80)',      /* پیل تیره برچسب شهر (مثل تصویر مرجع) */
    pillEdge: 'rgba(255,255,255,.16)',
    pillText: '#f2f7fc',
    capPillBg: 'rgba(46,36,12,.86)',
    sun: 'rgba(255,250,210,.13)',      /* نور از بالا-چپ (V81: کمی قوی‌تر — حس نقاشی) */
    shade: 'rgba(24,38,18,.17)',       /* سایه به پایین-راست */
  }
  const PROV_TYPE_FA = { capital: 'پایتخت', industrial: 'صنعتی', agricultural: 'کشاورزی', resource: 'منبع‌خیز', generic: 'عمومی' }
  /* V79: نردبان لقب فتح (آینه‌ی RANKS بازی — فقط نمایش) */
  const V79_RANKS = [[0, '🎖️ آغازگر'], [3, '🥉 فرمانده'], [6, '🥈 سردار'], [10, '🥇 فتحگر'], [15, '💎 فتحگر بزرگ'], [22, '👑 امپراتور'], [30, '🌐 سایه‌ی جهان'], [40, '👑 فرمانروای زمین']]

  /* ---------- ساخت layout از feature نقشه‌ی جهانی (یا fetch fallback) ---------- */
  function buildGeometry(country) {
    const LB = gameRef('layersByName')
    const layer = LB && LB[country]
    const feat = layer && layer.feature
    if (!feat || !feat.geometry) return false
    const g = feat.geometry
    let rings = []
    if (g.type === 'Polygon') rings = [g.coordinates[0]]
    else if (g.type === 'MultiPolygon') rings = g.coordinates.map((p) => p[0])
    if (!rings.length) return false
    let best = rings[0], bestA = 0
    for (const r of rings) {
      let a = 0
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] * r[i][1] - r[i][0] * r[j][1])
      a = Math.abs(a)
      if (a > bestA) { bestA = a; best = r }
    }
    S.ring = best.map((c) => [c[0], c[1]])
    let minX = 180, minY = 90, maxX = -180, maxY = -90
    for (const p of S.ring) {
      if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]
    }
    S.bbox = { minX, minY, maxX, maxY }
    return true
  }

  async function buildGeometryAsync(country) {
    if (buildGeometry(country)) return true
    try {
      if (!S._geoCache) S._geoCache = await fetch('/cdn/geo/countries.geo.json').then((r) => r.json())
      const f = (S._geoCache.features || []).find((x) => x.properties && x.properties.name === country)
      if (!f) return false
      const g = f.geometry
      let rings = []
      if (g.type === 'Polygon') rings = [g.coordinates[0]]
      else if (g.type === 'MultiPolygon') rings = g.coordinates.map((p) => p[0])
      if (!rings.length) return false
      let best = rings[0], bestA = 0
      for (const r of rings) {
        let a = 0
        for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] * r[i][1] - r[i][0] * r[j][1])
        a = Math.abs(a)
        if (a > bestA) { bestA = a; best = r }
      }
      S.ring = best.map((c) => [c[0], c[1]])
      let minX = 180, minY = 90, maxX = -180, maxY = -90
      for (const p of S.ring) {
        if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]
        if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]
      }
      S.bbox = { minX, minY, maxX, maxY }
      return true
    } catch (e) { return false }
  }

  function buildCells() {
    const P = S.provinces
    if (!S.ring || !P.length) return
    S.cells = P.map((p, i) => {
      const seed = [p.lng, p.lat]
      const cell = cellOf(i, P.map((q) => [q.lng, q.lat]), S.ring)
      let cx = 0, cy = 0
      if (cell.length >= 3) { for (const v of cell) { cx += v[0]; cy += v[1] } cx /= cell.length; cy /= cell.length }
      else { cx = seed[0]; cy = seed[1] }
      /* V74: گستره‌ی سلول برای مسیرهای کشتی/هواپیما */
      let bW = 0.4, bH = 0.4
      if (cell.length >= 3) {
        let x0 = 180, x1 = -180, y0 = 90, y1 = -90
        for (const v of cell) { if (v[0] < x0) x0 = v[0]; if (v[0] > x1) x1 = v[0]; if (v[1] < y0) y0 = v[1]; if (v[1] > y1) y1 = v[1] }
        bW = Math.max(0.15, x1 - x0); bH = Math.max(0.15, y1 - y0)
      }
      return { prov: p, seed, poly: cell.length >= 3 ? cell : null, cx, cy, bboxW: bW, bboxH: bH }
    })
  }

  /* ---------- Canvas و اندازه ---------- */
  let cv = null, ctx = null, staticCv = null, staticCtx = null, dpr = 1
  const stage = () => document.getElementById('wdcv-stage')

  function setupCanvas() {
    const st = stage()
    cv = st.querySelector('#wdcv-canvas')
    ctx = cv.getContext('2d')
    const cfg = tierCfg()
    dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr)
    const w = st.clientWidth, h = st.clientHeight
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    cv.style.width = w + 'px'; cv.style.height = h + 'px'
    staticCv = document.createElement('canvas')
    staticCv.width = cv.width; staticCv.height = cv.height
    staticCtx = staticCv.getContext('2d')
    S.dirtyStatic = true
  }

  /* ---------- دوربین: lng/lat → صفحه ---------- */
  let view = { scale: 1, ox: 0, oy: 0 }
  function computeView() {
    const bb = S.bbox
    const w = cv.clientWidth, h = cv.clientHeight
    const pad = 60
    const kx = kmPerLon() /* برای شکل درست، طول جغرافیایی را با cos مرکز جمع می‌کنیم */
    const cx = (bb.minX + bb.maxX) / 2, cyC = (bb.minY + bb.maxY) / 2
    const wLon = ((bb.maxX - bb.minX) * kx)
    const hLat = ((bb.maxY - bb.minY) * 111.32)
    const s0 = Math.min((w - pad) / Math.max(0.5, wLon), (h - pad) / Math.max(0.5, hLat))
    view.scale = s0
    return { cx, cy: cyC }
  }
  function kmPerLon() { const cy = (S.bbox.minY + S.bbox.maxY) / 2; return Math.max(1, 111.32 * Math.cos(cy * Math.PI / 180)) }
  function project(lng, lat) {
    const base = view.base
    const px = (lng - base.cx) * view.scale * kmPerLon()
    const py = -(lat - base.cy) * view.scale * 111.32
    return [cv.clientWidth / 2 + (px + S.cam.x) * S.cam.z, cv.clientHeight / 2 + (py + S.cam.y) * S.cam.z]
  }
  function unproject(sx, sy) {
    const base = view.base
    const px = (sx - cv.clientWidth / 2) / S.cam.z - S.cam.x
    const py = (sy - cv.clientHeight / 2) / S.cam.z - S.cam.y
    return [px / (view.scale * kmPerLon()) + base.cx, -py / (view.scale * 111.32) + base.cy]
  }

  /* ---------- لایه‌ی استاتیک (زمین + استان‌ها) — bake بر حسب zoom-bucket ----------
     V76: بافت terrain + نشان هویت + جاده‌ی ارگانیک + خوشه‌ی شهر — همه bake (صفر هزینه per-frame) */
  let staticBucket = 0
  function zoomBucket() { return clamp(Math.round(S.cam.z * 2) / 2, 0.5, 4) }
  /* V78 §24 (رفع باگ ریشه‌ای): bake در فضای جهان — دوربینِ خنثی (x=y=0، z=bucket).
     رسم بعدی با transform دوربین انجام می‌شود؛ pan دیگر rebake نمی‌خواهد و لایه‌ی
     استاتیک هرگز از دوربین عقب نمی‌ماند (در V≤77 static با دوربینِ لحظه‌ی bake
     منجمد می‌شد و از ساختمان‌ها/لیبل‌های داینامیک جدا می‌افتاد = نقشه‌ی دیباگی).
     rebake فقط با تغییر zoom-bucket (LOD) یا dirtyStatic. */
  /* V81 FIX ریشه‌ای «برش گوشه‌ها هنگام زوم»:
     تا V80، bake یک «اسکرین‌شاتِ دوربین خنثی» (viewport-sized) بود و render همان تصویر را
     با transform دوربینِ واقعی می‌کشید — اما bake فقط world-rect دیده‌شده از (0,0,bucket) را
     داشت؛ zoomAt با لنگرِ غیرمرکزی (چرخ موس روی گوشه / وسطِ pinch) یا panِ لبه، مستطیل دیدی
     می‌گرفت بزرگ‌تر از ناحیه‌ی bake ⇒ لبه/گوشه = پس‌زمینه‌ی خالی («نصفه/بریده»).
     حالا بوم دقیقاً به اندازه‌ی «کشور + حاشیه» در فضای جهان bake می‌شود (مقیاس bs = min(bucket،
     سقف حافظه‌ی tier)) و دریای عمقی per-frame زیرِ همه‌چیز کشیده می‌شود ⇒ هیچ نقطه‌ی
     قابل‌وصولی خالی نمی‌ماند؛ هزینه‌ی اضافه‌ی هر فریم = یک fillRect گرادیانی. */
  const BAKE_MARGIN = 160 /* px جهان — باند فیروزه‌ای ساحل + کفک + جاده‌ی ساحلی */
  function bakeStatic() {
    if (!S.ring || !S.bbox) return
    const bz = zoomBucket()
    const camSave = S.cam
    const W = cv.clientWidth, H = cv.clientHeight
    const kx = kmPerLon()
    const ww = (S.bbox.maxX - S.bbox.minX) * view.scale * kx + BAKE_MARGIN * 2
    const wh = (S.bbox.maxY - S.bbox.minY) * view.scale * 111.32 + BAKE_MARGIN * 2
    const budget = ({ low: 2.6e6, med: 5.5e6, high: 12e6 })[S.tier] || 5.5e6
    const need = Math.max(1, ww * dpr) * Math.max(1, wh * dpr)
    const bsCap = clamp(Math.sqrt(budget / need), 0.5, 4)
    /* V82: سقف ابعاد بوم — بعضی GPUهای موبایل سقف تکسچر ۴۰۹۶ دارند؛ بوم بزرگ‌تر «خالیِ کامل»
       می‌شود (هم‌خانواده‌ی باگ terrain ناپدید). روی دستگاه‌های عادی bsDim>4 ⇒ کاملاً بی‌اثر. */
    const bsDim = Math.max(0.4, 4096 / (Math.max(ww, wh) * dpr))
    const bs = Math.min(bz, bsCap, bsDim) /* مقیاس bake — گیت‌های LOD با bz می‌مانند */
    const ox = -ww / 2, oyTop = -wh / 2 /* لبه‌ی جهان کشور وسط‌چین است */
    staticCv.width = Math.max(2, Math.round(ww * bs * dpr))
    staticCv.height = Math.max(2, Math.round(wh * bs * dpr))
    S._bakeS = bs; S._bakeOX = ox; S._bakeOY = oyTop; S._bakeW = ww; S._bakeH = wh
    S._seaY0 = -(wh / 2 + 500); S._seaY1 = wh / 2 + 500 /* گرادیان دریا در فضای جهان */
    /* دوربینِ bake طوری تنظیم می‌شود که project() مستقیم مختصات بوم بدهد —
        همه‌ی کد رسمِ قبلی بدون تغییر کار می‌کند */
    S.cam = { x: -ox - W / (2 * bs), y: -oyTop - H / (2 * bs), z: bs, tx: 0, ty: 0, tz: bz, anim: false }
    const g = staticCtx
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, ww, wh)
    /* V81: دریای عمقی از bake حذف شد — per-frame زیرِ همه‌چیز کشیده می‌شود (render) */
    /* V81: حلقه‌ی آفستِ بیرونی ساحل (world px) برای موج دومِ متحرک — per bake (view.scale می‌تواند عوض شود) */
    if (S.ring.length > 8) {
      const rw = S.ring.map((p) => [(p[0] - view.base.cx) * view.scale * kx, -(p[1] - view.base.cy) * view.scale * 111.32])
      let cxs = 0, cys = 0
      for (const p of rw) { cxs += p[0]; cys += p[1] } cxs /= rw.length; cys /= rw.length
      S._ring2W = rw.map((p, i) => {
        const o = rw[(i - 1 + rw.length) % rw.length], q = rw[(i + 1) % rw.length]
        let dx = (q[1] - o[1]), dy = -(q[0] - o[0])
        const nl = Math.hypot(dx, dy) || 1; dx /= nl; dy /= nl
        const dout = ((p[0] + dx * 10 - cxs) ** 2 + (p[1] + dy * 10 - cys) ** 2) - ((p[0] - cxs) ** 2 + (p[1] - cys) ** 2)
        if (dout < 0) { dx = -dx; dy = -dy }
        return [p[0] + dx * 22, p[1] + dy * 22]
      })
    }
    const ring = S.ring.map((p) => project(p[0], p[1]))
    /* موج ساحل — قطعی، بیرون‌سوی نرمال (bake) */
    if (ring.length > 8) {
      let cxs = 0, cys = 0
      for (const p of ring) { cxs += p[0]; cys += p[1] } cxs /= ring.length; cys /= ring.length
      g.strokeStyle = 'rgba(150,210,240,.10)'; g.lineWidth = 1.4
      const step = Math.max(3, Math.floor(ring.length / 26))
      const wz = Math.min(1.4, S.cam.z)
      for (let i = 0; i < ring.length; i += step) {
        const p = ring[i], q = ring[(i + 1) % ring.length], o = ring[(i - 1 + ring.length) % ring.length]
        let dx = (q[1] - o[1]), dy = -(q[0] - o[0])
        const nl = Math.hypot(dx, dy) || 1; dx /= nl; dy /= nl
        const dout = ((p[0] + dx * 10 - cxs) ** 2 + (p[1] + dy * 10 - cys) ** 2) - ((p[0] - cxs) ** 2 + (p[1] - cys) ** 2)
        if (dout < 0) { dx = -dx; dy = -dy }
        for (let w2 = 1; w2 <= 2; w2++) {
          const d1 = 8 + w2 * 7 * wz
          g.beginPath(); g.arc(p[0] + dx * d1, p[1] + dy * d1, 3.2 * wz, 0.4, 2.6); g.stroke()
        }
      }
    }
    /* V79: عمق نقاشی‌شده‌ی دریا — ۳ باند فیروزه‌ای همیار ساحل + کفک (همه bake، صفر هزینه فریم) */
    g.lineJoin = 'round'
    const bands = [[44, V79.seaFar], [28, V79.seaMid], [14, V79.seaShore]]
    for (const [w, col] of bands) {
      g.strokeStyle = col
      g.lineWidth = w * S.cam.z
      pathRing(g, ring); g.stroke()
    }
    g.strokeStyle = V79.foam
    g.lineWidth = 1.6
    g.fillStyle = '#144258'
    pathRing(g, ring); g.fill(); g.stroke()
    /* سلول‌های استان + ترِین + tint هویت */
    const z = S.cam.z /* = bs — برای اندازه‌ها */
    const zb = bz /* V81: گیت‌های LOD با bucket واقعی — نه مقیاس کاهش‌یافته‌ی bake */
    const zc = Math.min(1.6, z)
    const TYPE_TINT = { industrial: 'rgba(96,104,114,.10)', resource: 'rgba(70,56,30,.10)', agricultural: 'rgba(130,170,70,.08)', capital: 'rgba(255,210,90,.06)' }
    /* V79 FIX: برش با شکل واقعی کشور (غیر-محدب — ctx.clip درست می‌بُرد)؛
        سلول‌های voronoi (محدب از bbox) کل کشور را می‌پوشانند — بدون حفره/زمین تیره */
    g.save()
    pathRing(g, ring); g.clip()
    S.cells.forEach((c, i) => {
      if (!c.poly) return
      const t = TERRAIN[c.prov.terrain] || TERRAIN.plains
      const poly = c.poly.map((p) => project(p[0], p[1]))
      pathRing(g, poly)
      g.fillStyle = (i % 2 ? t.fill : t.alt)
      /* V78 §17: تغییر ظریف روشنایی هر استان — کشور «طبیعی» دیده شود، نه یکدست مصنوعی */
      g.globalAlpha = 0.88 + (hash01(c.prov.i * 7.31) - 0.5) * 0.1; g.fill(); g.globalAlpha = 1
      const tint = TYPE_TINT[c.prov.type]
      if (tint) { g.fillStyle = tint; g.fill() }
      /* V79: نور نقاشی — گرادیان خورشید (بالا-چپ روشن ← پایین-راست سایه) روی مسیر همان سلول؛
         فقط یک fill گرادیانی اضافه در bake — صفر هزینه در فریم‌های عادی */
      let lnx = 1e9, lny = 1e9, lxx = -1e9, lxy = -1e9
      for (const p of poly) { if (p[0] < lnx) lnx = p[0]; if (p[0] > lxx) lxx = p[0]; if (p[1] < lny) lny = p[1]; if (p[1] > lxy) lxy = p[1] }
      const lgr = g.createLinearGradient(lnx, lny, lxx, lxy)
      lgr.addColorStop(0, V79.sun); lgr.addColorStop(0.55, 'rgba(0,0,0,0)'); lgr.addColorStop(1, V79.shade)
      pathRing(g, poly); g.fillStyle = lgr; g.fill()
      /* V81: تنوع طبیعی — شست‌وی سبز/زیتونی/خاکی با هش استان (bake-only، صفر هزینه فریم) */
      const jw = hash01(c.prov.i * 7.31)
      g.fillStyle = jw < 0.34 ? 'rgba(64,116,44,.08)' : jw < 0.67 ? 'rgba(148,158,58,.07)' : 'rgba(128,96,44,.07)'
      pathRing(g, poly); g.fill()
      /* V81: مرز نرم — هاله‌ی پهن کم‌رنگ + خط ظریف داخلی (به‌جای خط تیز مصنوعی) */
      g.strokeStyle = 'rgba(24,34,18,.15)'; g.lineWidth = 2.8; g.stroke()
      g.strokeStyle = 'rgba(24,34,18,.30)'; g.lineWidth = 1; g.stroke()
      g.strokeStyle = 'rgba(255,252,235,.06)'; g.lineWidth = 0.8; g.stroke()
      if (tierCfg().deco > 0 && zb >= 1.05) drawCellTexture(g, c, poly, zc)
    })
    g.restore()
    /* V78 §15: جاده‌ی اصلی — شبکه‌ی درختی: پایتخت↔۴ قطب اصلی + Prim برای بقیه.
       (قبلاً از پایتخت به «همه‌ی» استان‌ها خط می‌رفت = شعاعی/دیباگ‌نما — بند ۱۵ ممنوع) */
    if (tierCfg().roads && zb >= 1.05 && S.cells.length > 1) {
      const rn = roadNetwork()
      for (const [na, nb] of rn.mains) {
        const pts = roadPath([S.cells[na].cx, S.cells[na].cy], [S.cells[nb].cx, S.cells[nb].cy], na * 31 + nb * 7).map((q) => project(q[0], q[1]))
        /* V79: جاده‌ی کرمی نرم — لبه‌ی خاکی + بدنه‌ی کرم روشن (bake-only) */
        strokePath(g, pts, 3.2 * Math.min(1.3, z), V79.roadEdge)
        strokePath(g, pts, 2.2 * Math.min(1.3, z), V79.roadFill)
      }
      /* V78 §16: فرعی — فقط tier ≥۲ و نمای بالا؛ Low هیچ‌وقت فرعی ندارد */
      if (tierCfg().roads >= 2 && zb >= 1.8) {
        for (const [na, nb] of rn.spurs) {
          const pts = roadPath([S.cells[na].cx, S.cells[na].cy], [S.cells[nb].cx, S.cells[nb].cy], na * 17 + nb * 11).map((q) => project(q[0], q[1]))
          strokePath(g, pts, Math.max(0.9, 1 * z), V79.roadFillSub)
        }
      }
    }
    /* V77 §15: ریل فقط-ویژوال — پایتخت ↔ صنعتی‌ترین استان فعال (داده‌محور:
       بدون کارخانه/پالایشگاه فعال، ریل هم نیست. Low tier خاموش.) */
    S._rail = null
    if (tierCfg().ambient > 0 && zb >= 1.05 && S.cells.length > 1) {
      let bi = -1, bn = 0
      for (let i = 1; i < S.cells.length; i++) {
        const ci = S.cells[i].prov.i
        let nF = 0
        for (const b of S.buildings) if (b.province === ci && b.status === 'active' && (b.type === 'factory' || b.type === 'tank_plant')) nF++
        if (nF > bn) { bn = nF; bi = i }
      }
      if (bi >= 1) {
        const capC = S.cells[0]
        const rpGeo = roadPath([capC.cx, capC.cy], [S.cells[bi].cx, S.cells[bi].cy], 777)
        const rpPx = rpGeo.map((q) => project(q[0], q[1]))
        strokePath(g, rpPx, 1 * Math.min(1.3, z), 'rgba(30,26,20,.55)')
        g.setLineDash([1.4, 2.8])
        strokePath(g, rpPx, 2.6 * Math.min(1.3, z), 'rgba(238,226,196,.34)')
        g.setLineDash([])
        S._rail = { pts: rpGeo }
      }
    }
    /* شهرها — خوشه از زوم ۱٫۲ + جاده‌ی فرعی شهر←مرکز استان (فقط tier≥۲، نمای بالا) */
    if (zb >= 1.2) {
      S.cells.forEach((c) => {
        const cities = c.prov.cities || []
        cities.forEach((city, k) => {
          const p = project(city.lng, city.lat)
          drawCityCluster(g, p[0], p[1], city, k === 0 && c.prov.i === 0, zc)
          if (city._provI == null) city._provI = c.prov.i /* V79: برای رشد خوشه از ساختمان‌های واقعی استان */
          if (zb >= 1.9 && tierCfg().roads >= 2) {
            const pc = project(c.cx, c.cy)
            strokePath(g, roadPath([c.cx, c.cy], [city.lng, city.lat], 100 + c.prov.i * 7 + k).map((q) => project(q[0], q[1])), Math.max(0.8, 0.9 * z), 'rgba(216,198,152,.2)')
          }
        })
      })
    }
    /* نشان هویت استان — گلیف برداری کوچک؛ فقط برای نوع‌های معنادار (V78: گلیف مربعی
       generic حذف شد — بند ۲۱: مربع کوچک = نشانه‌ی دیباگ) */
    if (zb >= 1.3) {
      S.cells.forEach((c) => {
        if (!c.poly) return
        const p = project(c.cx, c.cy)
        g.globalAlpha = 0.85
        drawIdentityGlyph(g, p[0], p[1] - 15 * zc, c.prov, zc)
        g.globalAlpha = 1
      })
    }
    /* V78 §1/§21: برچسب متنی تایپ استان حذف شد — با گلیف + tint منتقل می‌شود؛
       متن زیر گلیف با اسم شهرها تداخل می‌ساخت («شهر صنعتی» روی «بندر» و…) */
    /* V82 DEBUG_TERRAIN (پیش‌فرض خاموش — فقط با window.__WD_DBG_TERRAIN={} فعال می‌شود):
       وضعیت bake برای تشخیص «ناپدید شدن terrain» — ابعاد بوم، پیکسل مرکز، bbox رینگ در bake */
    if (window.__WD_DBG_TERRAIN) {
      try {
        const px = staticCtx.getImageData(staticCv.width >> 1, staticCv.height >> 1, 1, 1).data
        let rx0 = 1e9, ry0 = 1e9, rx1 = -1e9, ry1 = -1e9
        for (const q of ring) { if (q[0] < rx0) rx0 = q[0]; if (q[0] > rx1) rx1 = q[0]; if (q[1] < ry0) ry0 = q[1]; if (q[1] > ry1) ry1 = q[1] }
        window.__WD_DBG_TERRAIN.bake = {
          cvW: staticCv.width, cvH: staticCv.height, bs, bz, ww: +ww.toFixed(1), wh: +wh.toFixed(1), dpr, W, H,
          centerPx: [px[0], px[1], px[2], px[3]],
          ringBox: [Math.round(rx0), Math.round(ry0), Math.round(rx1), Math.round(ry1)],
          cellsWithPoly: S.cells.filter((c) => c.poly).length,
          viewScale: +view.scale.toFixed(4),
          base: view.base ? { cx: +view.base.cx.toFixed(3), cy: +view.base.cy.toFixed(3) } : null,
          kx: +kx.toFixed(2),
        }
      } catch (e) { window.__WD_DBG_TERRAIN.bakeErr = String(e) }
    }
    S.cam = camSave
    staticBucket = bz
    S.dirtyStatic = false
  }

  /* ---------- V79: نقاش‌های سبک اسپرایتی (bake-only — یک‌بار per bucket) ----------
     درخت: سایه + تنه + تاج دولایه | کوه: هرم ایزومتریک دو-رویه + برف + پایه‌ی چمنی */
  function paintTree(g, x, y, s, v) {
    g.fillStyle = 'rgba(22,40,16,.28)'
    g.beginPath(); g.ellipse(x + s * 0.12, y + s * 0.14, s * 0.85, s * 0.32, 0, 0, 6.3); g.fill()
    g.fillStyle = v ? '#6b4a2e' : '#7a5535'
    g.fillRect(x - s * 0.11, y - s * 0.1, s * 0.22, s * 0.5)
    g.fillStyle = v ? '#3e7a34' : '#4c8a3c'
    g.beginPath(); g.arc(x, y - s * 0.55, s * 0.62, 0, 6.3); g.fill()
    g.fillStyle = v ? '#549242' : '#63a44c'
    g.beginPath(); g.arc(x - s * 0.16, y - s * 0.72, s * 0.42, 0, 6.3); g.fill()
  }
  function paintMountainIso(g, x, y, w2) {
    g.fillStyle = 'rgba(30,34,40,.25)'
    g.beginPath(); g.ellipse(x + w2 * 0.1, y + w2 * 0.5, w2 * 1.15, w2 * 0.3, 0, 0, 6.3); g.fill()
    g.fillStyle = '#7c7f8a' /* رویه‌ی سایه (راست) */
    g.beginPath(); g.moveTo(x, y - w2 * 0.95); g.lineTo(x + w2, y + w2 * 0.5); g.lineTo(x, y + w2 * 0.42); g.closePath(); g.fill()
    g.fillStyle = '#a3a6b0' /* رویه‌ی نور (چپ) */
    g.beginPath(); g.moveTo(x, y - w2 * 0.95); g.lineTo(x - w2, y + w2 * 0.5); g.lineTo(x, y + w2 * 0.42); g.closePath(); g.fill()
    g.fillStyle = '#f4f8fb' /* برف */
    g.beginPath(); g.moveTo(x, y - w2 * 0.95); g.lineTo(x + w2 * 0.3, y - w2 * 0.42); g.lineTo(x, y - w2 * 0.3); g.lineTo(x - w2 * 0.3, y - w2 * 0.44); g.closePath(); g.fill()
    g.fillStyle = 'rgba(90,130,60,.45)' /* پایه‌ی چمنی */
    g.beginPath(); g.ellipse(x, y + w2 * 0.42, w2 * 0.9, w2 * 0.22, 0, 0, 6.3); g.fill()
  }
  /* ---------- V76: بافت terrain — سبک، قطعی، bake-only ---------- */
  function drawCellTexture(g, c, poly, z) {
    const ter = c.prov.terrain, ty = c.prov.type
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9
    for (const p of poly) { if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; if (p[1] < mny) mny = p[1]; if (p[1] > mxy) mxy = p[1] }
    const cw = mxx - mnx, ch = mxy - mny
    const H1 = (k) => hash01(c.prov.i * 97 + k * 13.7)
    if (ter === 'mountain') {
      const n = 3 + Math.round(H1(1) * 2)
      for (let k = 0; k < n; k++) {
        const bx = mnx + cw * (0.18 + 0.64 * H1(k * 3 + 2)), by = mny + ch * (0.25 + 0.5 * H1(k * 3 + 3))
        /* V79: کوه ایزومتریک حجمی (نور/سایه/برف) — bake-only */
        paintMountainIso(g, bx, by, (5 + H1(k * 3 + 4) * 4) * z)
      }
    } else if (ter === 'desert') {
      g.strokeStyle = 'rgba(150,110,48,.4)'; g.lineWidth = 1.2
      for (let k = 0; k < 3; k++) {
        const bx = mnx + cw * (0.2 + 0.6 * H1(k + 9)), by = mny + ch * (0.2 + 0.6 * H1(k + 19))
        g.beginPath(); g.arc(bx, by, (4 + H1(k + 29) * 3) * z, Math.PI * 1.15, Math.PI * 1.85); g.stroke()
      }
    } else if (ty === 'resource' || ty === 'industrial') {
      /* V78 §17: هویت زمینی منبع/صنعتی — خیلی subtle، bake-only */
      if (ty === 'resource') {
        g.fillStyle = 'rgba(50,42,28,.34)'
        for (let k = 0; k < 2; k++) {
          const bx = mnx + cw * (0.25 + 0.5 * H1(k + 71)), by = mny + ch * (0.25 + 0.5 * H1(k + 81))
          g.beginPath(); g.moveTo(bx - 2 * z, by + 1.6 * z); g.lineTo(bx, by - 1.8 * z); g.lineTo(bx + 2 * z, by + 1.6 * z); g.closePath(); g.fill()
          g.beginPath(); g.arc(bx + 3.4 * z, by + 0.8 * z, 1.1 * z, 0, 6.3); g.fill()
        }
      } else {
        g.fillStyle = 'rgba(88,96,104,.13)'
        for (let k = 0; k < 2; k++) {
          const bx = mnx + cw * (0.2 + 0.55 * H1(k + 91)), by = mny + ch * (0.3 + 0.4 * H1(k + 92))
          g.fillRect(bx, by, 7 * z, 3.4 * z)
        }
      }
    } else if (ty === 'agricultural' || ter === 'plains' || ter === 'hills') {
      if (ty === 'agricultural') {
        /* V79: نوارهای مزرعه‌ی رنگی — سبز/زرد/طلایی متناوب (bake) */
        g.save(); pathRing(g, poly); g.clip()
        const ang = H1(5) * Math.PI
        const cx2 = (mnx + mxx) / 2, cy2 = (mny + mxy) / 2
        const R2 = Math.max(cw, ch) * 0.75
        const stripCols = ['rgba(210,230,120,.16)', 'rgba(240,220,120,.14)', 'rgba(150,200,90,.15)']
        for (let k = -4; k <= 4; k++) {
          const ox = Math.cos(ang) * k * 5 * z, oy = Math.sin(ang) * k * 5 * z
          g.strokeStyle = stripCols[(k + 4) % 3]
          g.lineWidth = 2.4 * z
          g.beginPath()
          g.moveTo(cx2 + ox - Math.cos(ang + 1.57) * R2, cy2 + oy - Math.sin(ang + 1.57) * R2)
          g.lineTo(cx2 + ox + Math.cos(ang + 1.57) * R2, cy2 + oy + Math.sin(ang + 1.57) * R2)
          g.stroke()
        }
        g.restore()
        /* چند درخت حاشیه‌ی مزرعه */
        paintTree(g, mnx + cw * 0.12, mny + ch * 0.85, 2.2 * z, H1(3) > 0.5 ? 1 : 0)
        paintTree(g, mnx + cw * 0.88, mny + ch * 0.2, 2 * z, H1(4) > 0.5 ? 1 : 0)
      } else {
        /* V79: جنگل اسپرایتی — درخت‌های تنه‌دار با سایه (به‌جای خوشه‌ی نقطه) */
        const n = 2 + Math.round(H1(7) * 2)
        for (let k = 0; k < n; k++) {
          const bx = mnx + cw * (0.15 + 0.7 * H1(k * 5 + 31)), by = mny + ch * (0.15 + 0.7 * H1(k * 5 + 41))
          for (let j = 0; j < 3; j++) {
            const dx2 = (H1(k * 17 + j * 3 + 51) - 0.5) * 9 * z, dy2 = (H1(k * 17 + j * 3 + 61) - 0.5) * 7 * z
            paintTree(g, bx + dx2, by + dy2, (1.6 + H1(k * 7 + j) * 1.1) * z, H1(k * 11 + j * 5) > 0.5 ? 1 : 0)
          }
        }
      }
    }
  }

  /* ---------- V76: نشان هویت استان — پلیت تیره + گلیف برداری ----------
     اولویت: پایتخت(ستاره) ← منبع(دکل) ← صنعتی(چرخ‌دنده) ← کشاورزی(گندم) ← ساحلی(موج) */
  function drawIdentityGlyph(g, x, y, prov, z) {
    /* V78 §21: نوع عمومی بدون گلیف — مربع کوچکِ دیباگ‌نما ممنوع */
    if (prov.type === 'generic' && !prov.coastal) return
    const r = 5.2 * z
    g.beginPath(); g.arc(x, y, r, 0, 6.3)
    g.fillStyle = 'rgba(10,18,28,.72)'; g.fill()
    g.strokeStyle = prov.type === 'capital' ? 'rgba(255,216,77,.9)' : 'rgba(180,220,250,.5)'; g.lineWidth = 1; g.stroke()
    g.strokeStyle = '#eaf6ff'; g.fillStyle = '#eaf6ff'; g.lineWidth = 1.2
    const u = z
    if (prov.type === 'capital') {
      g.beginPath()
      for (let k = 0; k < 10; k++) { const a = -1.5708 + k * 0.6283; const rr = k % 2 ? 1.7 * u : 3.4 * u; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (k) g.lineTo(px, py); else g.moveTo(px, py) }
      g.closePath(); g.fillStyle = '#ffd84d'; g.fill()
    } else if (prov.type === 'resource') {
      g.beginPath(); g.moveTo(x - 2.4 * u, y + 2.4 * u); g.lineTo(x, y - 2.6 * u); g.lineTo(x + 2.4 * u, y + 2.4 * u); g.stroke()
      g.beginPath(); g.moveTo(x - 1.3 * u, y + 0.2 * u); g.lineTo(x + 1.3 * u, y + 0.2 * u); g.stroke()
    } else if (prov.type === 'industrial') {
      g.beginPath(); g.arc(x, y, 2.4 * u, 0, 6.3); g.stroke()
      for (let k = 0; k < 4; k++) { const a = k * 1.5708 + 0.7854; g.beginPath(); g.moveTo(x + Math.cos(a) * 2.4 * u, y + Math.sin(a) * 2.4 * u); g.lineTo(x + Math.cos(a) * 3.6 * u, y + Math.sin(a) * 3.6 * u); g.stroke() }
      g.beginPath(); g.arc(x, y, 0.9 * u, 0, 6.3); g.fill()
    } else if (prov.type === 'agricultural') {
      for (let k = -1; k <= 1; k++) {
        g.beginPath(); g.moveTo(x + k * 2 * u, y + 2.6 * u); g.lineTo(x + k * 2 * u, y - 1.6 * u); g.stroke()
        g.beginPath(); g.arc(x + k * 2 * u, y - 2 * u, 0.8 * u, 0, 6.3); g.fill()
      }
    } else if (prov.coastal) {
      g.beginPath(); g.arc(x - 1.2 * u, y + 0.8 * u, 1.6 * u, Math.PI * 1.15, Math.PI * 1.95); g.stroke()
      g.beginPath(); g.arc(x + 1.2 * u, y + 0.8 * u, 1.6 * u, Math.PI * 1.15, Math.PI * 1.95); g.stroke()
      g.beginPath(); g.moveTo(x - 3 * u, y - 1.6 * u); g.lineTo(x + 3 * u, y - 1.6 * u); g.stroke()
    }
  }

  /* ---------- V78 §13/§14/§20: خوشه‌ی شهر — سیلوئت مات خوانا، نه مربع‌های سفید ----------
     V77 §6/§7: تراکم در نمای ساختمان (z≥2.2 سیلوئت‌های بیشتر) + امضای برداری هویت شهر
     بر اساس city.kind واقعی (port/oil/industrial/agri/military/mountain) از z≥1.5 */
  /* V78 §13: پالت مات خوشه‌ی شهر — دیوار روشنِ غیرسفید + سقف تیره؛ هیچ بلوک سفیدِ خالص */
  const CITY_WALL = '#cfd3d8', CITY_WALL2 = '#c0c5cc', CITY_ROOF = '#9c6b5a'
  /* V79: سطح واقعی شهر = تابع جمعیت popK (داده‌ی سرور) — برای برچسب و رشد خوشه */
  function cityLevel(city) { return clamp(Math.round(1 + (city.popK || 80) / 110), 1, 10) }
  function drawCityCluster(g, x, y, city, isCapital, z) {
    const pop = city.popK || 100
    const big = isCapital ? 2.2 : pop >= 600 ? 1.5 : pop >= 250 ? 1 : 0.6
    const R = (4.6 + big * 2.6) * z /* شعاع پروژه‌شده‌ی خوشه */
    if (R < 3.2) { /* §10: زیر آستانه — تک‌نقطه‌ی مات (نه مربع ریز) */
      g.fillStyle = isCapital ? '#ffd84d' : 'rgba(186,198,210,.92)'
      g.beginPath(); g.arc(x, y, isCapital ? 2.2 : 1.6, 0, 6.3); g.fill()
      return
    }
    if (tierCfg().shadows) { /* یک سایه‌ی نرم زیر کل خوشه */
      g.fillStyle = 'rgba(10,16,24,.26)'
      g.beginPath(); g.ellipse(x, y + R * 0.22, R * 1.05, R * 0.38, 0, 0, 6.3); g.fill()
    }
    /* V79: رشد با سطح واقعی — جمعیت شهر + تعداد ساختمان فعال استان (داده‌ی سرور) */
    const lv = cityLevel(city)
    let bN0 = 0
    try { for (const b of S.buildings) if (b.province === city._provI && b.status === 'active') bN0++ } catch (e) {}
    const grow = 1 + Math.min(0.6, (lv - 1) * 0.06 + bN0 * 0.025) /* V81: رشد محسوس‌تر با سطح واقعی */
    /* V79: پایه‌ی شهری — میدان روشن پایتخت + لکه‌ی مات زیر بلوک‌ها (وحدت خوشه) */
    if (isCapital) {
      g.fillStyle = 'rgba(228,214,168,.30)'
      g.beginPath(); g.ellipse(x, y + R * 0.05, R * 1.25, R * 0.85, 0, 0, 6.3); g.fill()
    }
    g.fillStyle = isCapital ? 'rgba(58,52,36,.6)' : 'rgba(30,38,48,.55)'
    g.beginPath(); g.ellipse(x, y, R * 0.95, R * 0.62, 0, 0, 6.3); g.fill()
    /* بلوک‌ها — پالت مات + آستانه‌ی ۲px (§10) + رشد با سطح */
    const lod = z >= 2.4 ? 2 : z >= 1.7 ? 1 : 0
    const nB = Math.round(((lod === 0 ? 4 : lod === 1 ? 7 : 10) + big * 2) * grow) + (lv >= 5 ? 2 : lv >= 3 ? 1 : 0) /* V81: بلوک اضافه در سطح بالا */
    for (let k = 0; k < nB; k++) {
      const a = hash01(city.lng * 91 + k * 7.3) * 6.28
      const rr = (0.28 + hash01(city.lat * 77 + k * 5.1) * 0.6) * R
      const bx = x + Math.cos(a) * rr, by = y + Math.sin(a) * rr * 0.6 - R * 0.06
      const bw = (2.7 + hash01(k * 31 + city.popK + k) * 2.4) * z * (k % 3 === 1 ? grow : 1)
      const bh = (2.1 + hash01(k * 17 + city.popK * 3 + k) * 2.1) * z * (k % 3 === 1 ? grow : 1) * (lv >= 4 && k % 4 === 0 ? 1.3 : 1) /* V81: برج بلندتر در سطح بالا */
      if (bw < 2 || bh < 2) continue /* §10: زیر ۲px = نویز سفید */
      g.fillStyle = k % 3 ? (k % 2 ? CITY_WALL : CITY_WALL2) : CITY_ROOF
      g.fillRect(bx - bw / 2, by - bh, bw, bh)
      /* V79: رخ ایزومتریک — نوار نور روی سقف هر بلوک (۱ fill اضافه، bake) */
      g.fillStyle = 'rgba(255,250,225,.30)'
      g.fillRect(bx - bw / 2, by - bh, bw, Math.max(1, bh * 0.28))
      g.strokeStyle = 'rgba(14,20,28,.4)'; g.lineWidth = 0.6; g.strokeRect(bx - bw / 2, by - bh, bw, bh)
    }
    /* §14: لندمارک پایتخت — تالار مرکزی + ستاره‌ی برداری بزرگ‌تر (بدون پالس/گلو) */
    if (isCapital) {
      const lw = (3.6 * grow) * z, lh = (3.4 * grow) * z, ly = y - R * 0.12
      g.fillStyle = '#c9b788'; g.fillRect(x - lw / 2, ly - lh, lw, lh)
      g.fillStyle = 'rgba(255,250,225,.35)'; g.fillRect(x - lw / 2, ly - lh, lw, Math.max(1, lh * 0.3))
      g.strokeStyle = 'rgba(22,18,8,.5)'; g.lineWidth = 0.7; g.strokeRect(x - lw / 2, ly - lh, lw, lh)
      const su = Math.min(1.8, z) + 0.5 /* V79: ستاره‌ی پایتخت برجسته‌تر */
      g.fillStyle = '#ffd84d'; g.beginPath()
      for (let k = 0; k < 10; k++) {
        const a2 = -1.5708 + k * 0.6283, rr2 = (k % 2 ? 1.3 : 2.9) * su
        const px = x + Math.cos(a2) * rr2, py = ly - lh - 4.2 * su + Math.sin(a2) * rr2
        if (k) g.lineTo(px, py); else g.moveTo(px, py)
      }
      g.closePath(); g.fill()
      g.strokeStyle = 'rgba(120,84,10,.6)'; g.lineWidth = 0.7; g.stroke()
    }
    /* امضای هویت شهر از city.kind واقعی (V77 §7) — فقط نمای متوسط به بالا، ظریف */
    if (z >= 1.8 && !isCapital) {
      const s = Math.min(1.5, z)
      const gx = x + R * 0.95, gy = y - R * 0.15
      g.strokeStyle = 'rgba(16,22,30,.55)'; g.lineWidth = 0.8
      const kd = city.kind
      if (kd === 'port') {
        g.fillStyle = 'rgba(79,107,134,.85)'; g.fillRect(gx - 3 * s, gy + 1.4 * s, 7 * s, 1.1 * s)
        g.fillStyle = '#b9c6d2'; g.fillRect(gx + 0.4 * s, gy - 1.8 * s, 3.4 * s, 1.8 * s)
      } else if (kd === 'oil') {
        g.strokeStyle = 'rgba(50,42,30,.85)'; g.beginPath(); g.moveTo(gx - 2 * s, gy + 1.6 * s); g.lineTo(gx, gy - 2.4 * s); g.lineTo(gx + 2 * s, gy + 1.6 * s); g.stroke()
        g.fillStyle = 'rgba(70,58,34,.9)'; g.beginPath(); g.arc(gx + 3.4 * s, gy + 1 * s, 1.3 * s, 0, 6.3); g.fill()
      } else if (kd === 'industrial') {
        g.fillStyle = 'rgba(96,104,114,.88)'
        g.beginPath(); g.moveTo(gx - 3 * s, gy + 1.6 * s); g.lineTo(gx - 3 * s, gy - 0.6 * s); g.lineTo(gx - 1.6 * s, gy - 1.6 * s); g.lineTo(gx - 1.6 * s, gy - 0.6 * s); g.lineTo(gx - 0.2 * s, gy - 1.6 * s); g.lineTo(gx - 0.2 * s, gy - 0.6 * s); g.lineTo(gx + 1.2 * s, gy - 1.6 * s); g.lineTo(gx + 1.2 * s, gy + 1.6 * s); g.closePath(); g.fill()
      } else if (kd === 'agri') {
        g.strokeStyle = 'rgba(232,220,160,.8)'
        for (let k2 = -1; k2 <= 1; k2++) { g.beginPath(); g.moveTo(gx + k2 * 2 * s, gy + 1.6 * s); g.lineTo(gx + k2 * 2 * s, gy - 1.6 * s); g.stroke() }
      } else if (kd === 'military') {
        g.strokeStyle = 'rgba(70,84,60,.9)'; g.beginPath(); g.moveTo(gx, gy + 1.6 * s); g.lineTo(gx, gy - 2.6 * s); g.stroke()
        g.fillStyle = 'rgba(120,150,90,.95)'; g.fillRect(gx, gy - 2.6 * s, 2.6 * s, 1.4 * s)
      } else if (kd === 'mountain') {
        g.strokeStyle = 'rgba(70,70,80,.9)'; g.beginPath(); g.arc(gx, gy + 1.4 * s, 1.8 * s, Math.PI, 0); g.stroke()
      }
    }
  }
  function pathRing(g, pts) {
    g.beginPath()
    pts.forEach((p, i) => { if (i === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]) })
    g.closePath()
  }

  /* ---------- Pool ذرات ---------- */
  const pool = []
  function spawnParticles(x, y, kind) {
    const cfg = tierCfg()
    if (!cfg.particles) return
    for (let i = 0; i < cfg.particles; i++) {
      let p = pool.find((q) => !q.on)
      if (!p) { if (pool.length > 120) break; p = { on: false }; pool.push(p) }
      p.on = true; p.x = x; p.y = y
      p.vx = (Math.random() - 0.5) * 60; p.vy = -Math.random() * 80 - 20
      p.life = 0; p.max = 0.7 + Math.random() * 0.4
      p.kind = kind
    }
  }
  function stepParticles(dt) {
    for (const p of pool) {
      if (!p.on) continue
      p.life += dt
      if (p.life >= p.max) { p.on = false; continue }
      p.x += p.vx * dt; p.y += p.vy * dt
      if (p.kind === 'smoke') { p.vy *= (1 - 0.4 * dt); p.vx *= (1 - 0.3 * dt) } /* دود: کند شدن */
      else p.vy += 160 * dt
    }
  }
  function drawParticles(g) {
    for (const p of pool) {
      if (!p.on) continue
      const a = 1 - p.life / p.max
      g.globalAlpha = a * (p.kind === 'smoke' ? 0.4 : 0.9)
      g.fillStyle = p.kind === 'gold' ? '#ffd84d' : p.kind === 'oil' ? '#9ad0ff' : p.kind === 'smoke' ? '#d5dce4' : '#a8e6a3'
      g.beginPath(); g.arc(p.x, p.y, (p.kind === 'smoke' ? 3.2 : 2.4) * S.cam.z, 0, 6.3); g.fill()
    }
    g.globalAlpha = 1
  }

  /* ============================================================
     V74 — AAA LAYER: صدا + محیط زنده + رسم برداری + جاده‌ها
     همه داخل همان تک-loop مدیریت می‌شوند؛ هیچ تایمر/rAF جدیدی ساخته نمی‌شود.
     ============================================================ */

  /* ---------- صدا: سینت WebAudio سبک (lazy، بعد از تعامل، بدون فایل) ---------- */
  let AC = null, AMaster = null
  function audioInit() {
    if (AC || !S.sndOn) return
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      AC = new Ctx()
      AMaster = AC.createGain(); AMaster.gain.value = 0.11; AMaster.connect(AC.destination)
    } catch (e) { AC = null }
  }
  function snd(kind) {
    if (!S.sndOn) return
    try {
      if (!AC) audioInit()
      if (!AC) return
      if (AC.state === 'suspended') {
        /* V75: بعد از suspend در close()، اولین صدای ورود گم می‌شد (resume ناهمگام بود —
           «اولین تلاش فقط unlock»). حالا بعد از resume همان صدا پخش می‌شود. */
        AC.resume().then(() => { try { sndPlay(kind) } catch (e) {} }).catch(() => {})
        return
      }
      sndPlay(kind)
    } catch (e) {}
  }
  function sndPlay(kind) {
    try {
      const t = AC.currentTime
      const tone = (f0, f1, dur, type, vol, dl) => {
        const o = AC.createOscillator(), g = AC.createGain()
        o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t + (dl || 0))
        if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + (dl || 0) + dur)
        g.gain.setValueAtTime(0.0001, t + (dl || 0))
        g.gain.exponentialRampToValueAtTime(vol || 0.5, t + (dl || 0) + 0.015)
        g.gain.exponentialRampToValueAtTime(0.0001, t + (dl || 0) + dur)
        o.connect(g); g.connect(AMaster); o.start(t + (dl || 0)); o.stop(t + (dl || 0) + dur + 0.02)
      }
      switch (kind) {
        case 'enter': tone(220, 440, 0.22, 'sine', 0.5); tone(330, 660, 0.3, 'sine', 0.35, 0.09); break
        case 'exit': tone(440, 220, 0.2, 'sine', 0.4); break
        case 'tap': tone(950, 0, 0.045, 'triangle', 0.25); break
        case 'build': tone(160, 110, 0.14, 'square', 0.22); tone(120, 90, 0.12, 'square', 0.18, 0.09); break
        case 'complete': tone(523, 0, 0.1, 'sine', 0.4); tone(659, 0, 0.1, 'sine', 0.4, 0.09); tone(784, 0, 0.16, 'sine', 0.42, 0.18); break
        case 'upgrade': tone(392, 784, 0.18, 'sine', 0.4); break
        case 'focus': tone(660, 880, 0.12, 'sine', 0.3); break
        case 'error': tone(180, 120, 0.16, 'sawtooth', 0.18); break
      }
    } catch (e) {}
  }

  /* ---------- محیط زنده: Pool حمل‌ونقل (خودرو/کشتی/هواپیما) ----------
     هر شیء روی یک «مسیر» پارامتری (p0→p1) حرکت می‌کند؛ بیرون از Viewport
     آپدیت/رندر نمی‌شود؛ سقف جمعی = TIER.ambient. ایجاد/نابودی ندارد — reuse. */
  const AMB = []
  function ambPathPool() {
    /* مسیرها: جاده‌ی پایتخت↔استان‌ها (خودرو) + بندرها (کشتی) + فرودگاه‌ها (هواپیما) */
    const paths = []
    const cap = S.cells[0]
    if (cap && tierCfg().roads) {
      /* V78 §15/§22: خودرو فقط روی جاده‌های اصلی شبکه‌ی درختی — نه همه‌ی مسیرها */
      const rn = roadNetwork()
      for (const [na, nb] of rn.mains) paths.push({ kind: 'car', pts: roadPath([S.cells[na].cx, S.cells[na].cy], [S.cells[nb].cx, S.cells[nb].cy], na * 31 + nb * 7) })
    }
    for (const c of S.cells) {
      const hasPort = S.buildings.some((b) => b.province === c.prov.i && b.type === 'port' && b.status === 'active')
      const hasAir = S.buildings.some((b) => b.province === c.prov.i && b.type === 'airport' && b.status === 'active')
      if (hasPort && c.prov.coastal) paths.push({ kind: 'ship', pts: [[c.cx, c.cy], [c.cx + (c.bboxW || 0.5) * 0.35, c.cy - (c.bboxH || 0.5) * 0.35]] })
      if (hasAir) paths.push({ kind: 'plane', pts: [[c.cx, c.cy], [c.cx + 0.55, c.cy + 0.35]] })
    }
    if (S._rail && tierCfg().ambient > 0) paths.push({ kind: 'train', pts: S._rail.pts }) /* V77 §15/§13 */
    /* V79: لاین‌های دریایی تزئینی — کشتی‌های آرام در دریای آزاد (قطعی از ring واقعی کشور؛
        visual-only مثل ریل V77؛ tier-gated: حداکثر ۳ مسیر) */
    if (tierCfg().ambient > 0 && S.ring && S.ring.length > 8) {
      const bb = S.bbox || { minX: 0, minY: 0, maxX: 1, maxY: 1 }
      const dgx = (bb.maxX - bb.minX) * 0.12 || 0.5, dgy = (bb.maxY - bb.minY) * 0.12 || 0.4
      const nL = Math.min(tierCfg().ambient, 3)
      for (let k = 0; k < nL; k++) {
        const i0 = Math.floor(hash01(k * 37.7 + 5.1) * S.ring.length)
        const i1 = (i0 + Math.floor(S.ring.length / 3) + k * 7) % S.ring.length
        const a = S.ring[i0], b2 = S.ring[i1]
        paths.push({ kind: 'ship', sea: true, pts: [[a[0] + dgx * (k % 2 ? 0.5 : -0.8), a[1] - dgy * 0.6], [b2[0] + dgx * (k % 2 ? -0.9 : 0.6), b2[1] + dgy * 0.7]] })
      }
    }
    return paths
  }
  function stepAmbient(dt) {
    /* V79: کشتی از زوم ۱٫۴ (دریای آزاد — شلوغ نمی‌کند)؛ خودرو/قطار/هواپیما فقط از ۲ (V78 §22) */
    if (S.cam.z < 1.4) return
    const cap = tierCfg().ambient
    if (!cap || !S.ambPaths) return
    if (S.cam.z < 2) { /* خروج از نمای نزدیک: غیر-کشتی‌ها تخلیه شوند */
      for (let i = AMB.length - 1; i >= 0; i--) if (AMB[i].kind !== 'ship') AMB.splice(i, 1)
    }
    /* پرکردن ظرفیت — فقط از مسیرهای مجازِ زوم فعلی */
    const carOk = S.cam.z >= 2
    const elig = carOk ? S.ambPaths : S.ambPaths.filter((p) => p.kind === 'ship')
    if (elig.length && AMB.length < cap) {
      const need = Math.min(cap - AMB.length, 2)
      for (let i = 0; i < need; i++) {
        const p = elig[Math.floor(Math.random() * elig.length)]
        if (AMB.some((o) => o.path === p)) continue /* یک لاین = یک ساکن (کشتی‌ها پراکنده بمانند) */
        AMB.push({ kind: p.kind, path: p, t: Math.random(), sp: p.kind === 'car' ? 0.05 + Math.random() * 0.05 : p.kind === 'ship' ? 0.012 + Math.random() * 0.012 : p.kind === 'train' ? 0.028 + Math.random() * 0.018 : 0.06 + Math.random() * 0.06, dir: Math.random() < 0.5 ? 1 : -1 })
      }
    }
    for (let i = AMB.length - 1; i >= 0; i--) {
      const o = AMB[i]
      o.t += o.sp * dt * o.dir
      if (o.t > 1 || o.t < 0) { /* پایان مسیر: بازیافت روی مسیر دیگر (بدون ایجاد/حذف DOM) */
        if (elig.length) o.path = elig[Math.floor(Math.random() * elig.length)]
        o.t = o.dir > 0 ? 0 : 1
      }
    }
  }
  function drawAmbient(g) {
    S._ambDrawn = (S._ambDrawn || 0) + 1 /* V78 QA */
    const z = S.cam.z
    const W = cv.clientWidth, H = cv.clientHeight
    for (const o of AMB) {
      if (o.kind !== 'ship' && z < 2) continue /* V79: خودرو/قطار/هواپیما فقط از زوم ۲ */
      const gp = pathPoint(o.path.pts, o.t)
      const p = project(gp[0], gp[1])
      if (p[0] < -30 || p[1] < -30 || p[0] > W + 30 || p[1] > H + 30) continue
      const s = Math.min(1.6, z)
      g.globalAlpha = 0.9
      if (o.kind === 'car') {
        g.fillStyle = '#d8dee6'
        g.fillRect(p[0] - 2.4 * s, p[1] - 1.2 * s, 4.8 * s, 2.4 * s)
        g.fillStyle = '#39424e'
        g.fillRect(p[0] - 0.9 * s, p[1] - 1 * s, 1.8 * s, 2 * s)
      } else if (o.kind === 'ship') {
        /* V81: شنا — bob سینوسی + چرخش به سمت حرکت + تاب جزئی + دنباله (≤۳ شناور، tier-gated) */
        const q2 = pathPoint(o.path.pts, clamp(o.t + 0.03 * o.dir, 0, 1))
        const p2 = project(q2[0], q2[1])
        const hd = (Math.abs(p2[0] - p[0]) + Math.abs(p2[1] - p[1]) > 0.05) ? Math.atan2(p2[1] - p[1], p2[0] - p[0]) : 0
        const tb = (S.nowMs || 0) / 1000
        const bob = Math.sin(tb * 2.1 + o.t * 41) * 1.4 * s
        const rock = Math.sin(tb * 1.6 + o.t * 33) * 0.08
        g.save(); g.translate(p[0], p[1] + bob); g.rotate(hd + rock)
        g.fillStyle = 'rgba(230,242,248,.45)'
        g.beginPath(); g.ellipse(-7.5 * s, 0.4 * s, 4.5 * s, 1.1 * s, 0, 0, 6.3); g.fill()
        g.fillStyle = '#e8eef4'
        g.beginPath(); g.moveTo(-5 * s, 0); g.lineTo(5 * s, 0); g.lineTo(3 * s, 2.4 * s); g.lineTo(-3 * s, 2.4 * s); g.closePath(); g.fill()
        g.fillStyle = '#c2483f'; g.fillRect(-1.8 * s, -4.2 * s, 2 * s, 4.2 * s)
        g.restore()
      } else if (o.kind === 'train') {
        /* V77 §13: قطار — لوکوموتیو + ۲ واگن روی همان ریل bake‌شده */
        for (let w2 = 0; w2 < 3; w2++) {
          const tt = clamp(o.t - w2 * 0.04 * o.dir, 0, 1)
          const gp2 = pathPoint(o.path.pts, tt)
          const p2 = project(gp2[0], gp2[1])
          if (p2[0] < -30 || p2[1] < -30 || p2[0] > W + 30 || p2[1] > H + 30) continue
          g.fillStyle = w2 ? '#9fb2c4' : '#3f4c5a'
          g.fillRect(p2[0] - 3.4 * s, p2[1] - 2 * s, 6.8 * s, 4 * s)
          g.fillStyle = 'rgba(16,22,30,.4)'; g.fillRect(p2[0] - 3.4 * s, p2[1] - 0.4 * s, 6.8 * s, 0.8 * s)
        }
      } else {
        /* V78 §23: سیلوئت هواپیما — بدنه + بال swept + دم (به‌جای علامت +) */
        g.fillStyle = '#dfe7ef'
        g.beginPath()
        g.moveTo(p[0], p[1] - 5.5 * s)
        g.lineTo(p[0] + 1.3 * s, p[1] - 3.2 * s); g.lineTo(p[0] + 1.1 * s, p[1] + 0.6 * s)
        g.lineTo(p[0] + 5.2 * s, p[1] + 2.6 * s); g.lineTo(p[0] + 5.2 * s, p[1] + 3.4 * s); g.lineTo(p[0] + 1 * s, p[1] + 2.2 * s)
        g.lineTo(p[0] + 0.7 * s, p[1] + 4.2 * s); g.lineTo(p[0] + 1.9 * s, p[1] + 5.2 * s); g.lineTo(p[0] + 1.9 * s, p[1] + 5.8 * s)
        g.lineTo(p[0], p[1] + 5 * s); g.lineTo(p[0] - 1.9 * s, p[1] + 5.8 * s); g.lineTo(p[0] - 1.9 * s, p[1] + 5.2 * s)
        g.lineTo(p[0] - 0.7 * s, p[1] + 4.2 * s); g.lineTo(p[0] - 1 * s, p[1] + 2.2 * s); g.lineTo(p[0] - 5.2 * s, p[1] + 3.4 * s)
        g.lineTo(p[0] - 5.2 * s, p[1] + 2.6 * s); g.lineTo(p[0] - 1.1 * s, p[1] + 0.6 * s); g.lineTo(p[0] - 1.3 * s, p[1] - 3.2 * s)
        g.closePath(); g.fill()
      }
      g.globalAlpha = 1
    }
  }

  /* ---------- رد دنباله‌ی ضربه (micro-interaction) — Pool ---------- */
  const RIPS = []
  function spawnRipple(x, y) {
    let r = RIPS.find((q) => !q.on)
    if (!r) { if (RIPS.length > 8) return; r = { on: false }; RIPS.push(r) }
    r.on = true; r.x = x; r.y = y; r.t = 0
  }
  function drawRipples(g, dt) {
    for (const r of RIPS) {
      if (!r.on) continue
      r.t += dt
      if (r.t > 0.32) { r.on = false; continue }
      const k = r.t / 0.32
      g.globalAlpha = (1 - k) * 0.55
      g.strokeStyle = '#ffd84d'; g.lineWidth = 2
      g.beginPath(); g.arc(r.x, r.y, 6 + k * 22 * Math.min(1.4, S.cam.z), 0, 6.3); g.stroke()
      g.globalAlpha = 1
    }
  }

  /* ---------- دود کارخانه‌ها — از همان Pool ذرات با kind='smoke' ---------- */
  let smokeAcc = 0
  function stepSmoke(dt) {
    const cfg = tierCfg()
    if (!cfg.smoke || S.cam.z < 2) return
    smokeAcc += dt
    if (smokeAcc < 0.9) return
    smokeAcc = 0
    let emitters = 0
    const W = cv.clientWidth, H = cv.clientHeight
    for (const b of S.buildings) {
      if (emitters >= cfg.smoke) break
      if (b.status !== 'active') continue
      if (b.type !== 'factory' && b.type !== 'power' && b.type !== 'tank_plant') continue
      const p = slotPos(b.province, b.slot)
      if (p[0] < 0 || p[1] < 0 || p[0] > W || p[1] > H) continue
      emitters++
      let q = pool.find((x) => !x.on)
      if (!q) { if (pool.length > 120) break; q = { on: false }; pool.push(q) }
      q.on = true; q.x = p[0] + 3 * S.cam.z; q.y = p[1] - 5 * S.cam.z
      q.vx = 4 + Math.random() * 6; q.vy = -14 - Math.random() * 10
      q.life = 0; q.max = 1.6 + Math.random() * 0.8; q.kind = 'smoke'
    }
  }

  /* ---------- رسم برداری ساختمان (V76) — زبان بصری ثابت + رشد با سطح ----------
     state: 0=سالم, 1=فونداسیون, 2=اسکلت | هر ساختمان در نگاه اول قابل تشخیص:
     کارخانه: سالن مستطیلی+دودکش | مزرعه: کرت+انبار | نفت: دکل+مخزن | بندر: اسکله+جرثقیل
     Research: گنبد شیشه‌ای | نظامی: آشیانه/کنگره | حکومتی: ستون‌ها — بدون emoji.
     رشد سطح: L3 الحاق، L5 دودکش/سیلو/انبار دوم، L8 پرچم، L10 نشان لندمارک. */
  const BPAL = {
    industry: { wall: '#b7c0ca', roof: '#8c4a3f', trim: '#39424e' },
    farm:     { wall: '#c8b189', roof: '#7d6a4a', trim: '#4a4030' },
    military: { wall: '#9aa88f', roof: '#5d6b52', trim: '#333d30' },
    energy:   { wall: '#aebfd2', roof: '#6f8296', trim: '#2e3a46' },
    research: { wall: '#cfe0ee', roof: '#7f97ab', trim: '#2c3947' },
    gov:      { wall: '#d8cdb4', roof: '#9a8a63', trim: '#4a4232' },
    port:     { wall: '#b2c0cc', roof: '#4f6b86', trim: '#28323c' },
    default:  { wall: '#cfd8e2', roof: '#8c4a3f', trim: '#2c3947' },
  }
  function bpalOf(type) {
    if (type === 'factory' || type === 'tank_plant' || type === 'mine' || type === 'storage') return BPAL.industry
    if (type === 'farm') return BPAL.farm
    if (type === 'barracks' || type === 'defense' || type === 'naval_base' || type === 'airbase') return BPAL.military
    if (type === 'power' || type === 'oil_rig') return BPAL.energy
    if (type === 'university' || type === 'radar') return BPAL.research
    if (type === 'gov' || type === 'bank') return BPAL.gov
    if (type === 'port' || type === 'airport') return BPAL.port
    return BPAL.default
  }
  function drawBuilding(g, x, y, type, level, z, state, tSec, lod) {
    const s = Math.min(2, z)
    /* V79: سایه‌ی زمینی ساختمان — یک ellipse fill (فقط نمای ساختمان z≥1.5 + culling؛ هزینه سرریز صفر) */
    if (tierCfg().shadows) {
      g.fillStyle = 'rgba(18,26,14,.22)'
      g.beginPath(); g.ellipse(x + 1.4 * s, y + 0.9 * s, 3.4 * s, 1.4 * s, 0, 0, 6.3); g.fill()
    }
    const u = 1.3 * s /* V78 §8: واحد بزرگ‌تر — سیلوئت خوانا، نه نقطه */
    const P = bpalOf(type)
    const glass = 'rgba(140,220,255,.85)', accent = '#7fe3ff'
    g.lineWidth = 1 * s
    if (9 * u < 5) { /* §10: آستانه‌ی سایز — هیچ جزئیاتی زیر ~۵px */
      g.fillStyle = P.wall; g.fillRect(x - 1.4, y - 1.4, 2.8, 2.8); return
    }
    /* باکس دو-رنگ: بدنه + سایه‌ی پیش‌زمینه (حس حجم بدون گرادیان سنگین) */
    const box = (w, h, dy, fill) => {
      const bx = x - w * u / 2, by = y + dy * u - h * u
      g.fillStyle = fill || P.wall; g.fillRect(bx, by, w * u, h * u)
      g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(bx, by + h * u * 0.55, w * u, h * u * 0.45)
      g.strokeStyle = P.trim; g.strokeRect(bx, by, w * u, h * u)
    }
    const roof = (w, dy, h) => {
      g.fillStyle = P.roof; g.beginPath()
      g.moveTo(x - w * u / 2, y + dy * u); g.lineTo(x, y + (dy - h) * u); g.lineTo(x + w * u / 2, y + dy * u)
      g.closePath(); g.fill(); g.strokeStyle = P.trim; g.stroke()
    }
    /* پایه‌ی مشترک — همه‌ی ساختمان‌ها روی زمین بنشینند */
    g.fillStyle = 'rgba(0,0,0,.2)'
    g.fillRect(x - 6.2 * u, y + 3.7 * u, 12.4 * u, 1.5 * u)
    if (state === 1) { /* فونداسیون */
      g.setLineDash([3 * s, 3 * s]); g.strokeStyle = 'rgba(255,216,77,.8)'
      g.strokeRect(x - 6 * u, y - 5 * u, 12 * u, 10 * u); g.setLineDash([])
      g.fillStyle = 'rgba(120,90,50,.55)'
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - 4 * u + i * 4 * u, y + 3 * u, 1.6 * u, 0, 6.3); g.fill() }
      return
    }
    /* ---- V78 §9: LOD0 — سیلوئت تک‌حجمی با پالت دسته (بدون جزئیات ریز) ----
       نمای متوسط (z<2.05): ساختمان باید «شکل» داشته باشد نه جزئیات نویزی.
       LOD1 (z≥2.05): شکل کامل شاخص | LOD2 (z≥2.8): + رشد سطح/پرچم/لندمارک */
    if (lod === 0) {
      g.fillStyle = 'rgba(0,0,0,.18)'
      g.fillRect(x - 7 * u, y + 3.4 * u, 14 * u, 1.4 * u)
      switch (type) {
        case 'farm':
          g.fillStyle = '#a5813f'; g.fillRect(x - 7 * u, y - 1 * u, 14 * u, 5 * u); roof(4.5, 1.2, 1.6); break
        case 'port': case 'naval_base':
          g.fillStyle = P.trim; g.fillRect(x - 6 * u, y + 2.2 * u, 12 * u, 1.4 * u); box(5.5, 2.6, 0.6); break
        case 'airport': case 'airbase':
          g.fillStyle = '#55606d'; g.fillRect(x - 7 * u, y + 1.2 * u, 14 * u, 2.2 * u); box(4.4, 2.2, 1); break
        case 'oil_rig': case 'mine':
          g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x - 3.4 * u, y + 4 * u); g.lineTo(x, y - 5 * u); g.lineTo(x + 3.4 * u, y + 4 * u); g.stroke(); break
        case 'power':
          g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x - 2.6 * u, y + 4.6 * u); g.lineTo(x - 0.7 * u, y - 4.6 * u); g.lineTo(x + 0.7 * u, y - 4.6 * u); g.lineTo(x + 2.6 * u, y + 4.6 * u); g.closePath(); g.stroke(); break
        case 'radar':
          g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x, y + 4 * u); g.lineTo(x, y - 1.4 * u); g.stroke()
          g.fillStyle = glass; g.beginPath(); g.ellipse(x, y - 3 * u, 3.4 * u, 2.2 * u, -0.5, 0, 6.3); g.fill(); break
        default:
          box(9, 4.5, 2.5); roof(9.5, 2.5, 2)
      }
      return
    }
    switch (type) {
      case 'factory': case 'tank_plant':
        box(9, 4, 2); box(4, 3, 5.6) /* سالن + بخش اداری */
        g.fillStyle = P.trim; g.fillRect(x + 2.4 * u, y - 6.5 * u, 1.6 * u, 4.5 * u) /* دودکش */
        if (type === 'tank_plant') { g.fillStyle = '#5b6b52'; g.fillRect(x - 3.4 * u, y + 0.4 * u, 3.2 * u, 1.4 * u); g.fillRect(x - 2.2 * u, y - 0.4 * u, 1.6 * u, 0.9 * u) } /* تانک کوچک */
        break
      case 'house':
        box(6, 3, 3); roof(7, 3, 2.4); box(2.2, 1.2, 1.2, glass)
        break
      case 'farm':
        g.fillStyle = '#a5813f'; g.fillRect(x - 7 * u, y - 1 * u, 14 * u, 5 * u)
        g.strokeStyle = 'rgba(255,244,190,.75)'
        for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 2.6 * u, y - 1 * u); g.lineTo(x + i * 2.6 * u, y + 4 * u); g.stroke() }
        roof(4.5, 1.2, 1.6)
        break
      case 'oil_rig':
        g.strokeStyle = P.trim; g.beginPath()
        g.moveTo(x - 3.4 * u, y + 4 * u); g.lineTo(x - 1 * u, y - 6 * u); g.lineTo(x + 1 * u, y - 6 * u); g.lineTo(x + 3.4 * u, y + 4 * u)
        g.moveTo(x - 2.2 * u, y + 0.5 * u); g.lineTo(x + 2.2 * u, y + 0.5 * u); g.stroke()
        box(3.4, 1.6, 6.8, '#9aa7b4')
        break
      case 'mine':
        g.strokeStyle = P.trim; g.beginPath(); g.arc(x, y + 1 * u, 3 * u, Math.PI, 0); g.stroke()
        g.beginPath(); g.moveTo(x - 3 * u, y + 1 * u); g.lineTo(x - 3 * u, y + 4.6 * u); g.lineTo(x + 3 * u, y + 4.6 * u); g.lineTo(x + 3 * u, y + 1 * u); g.stroke()
        break
      case 'power':
        g.strokeStyle = P.trim; g.beginPath()
        g.moveTo(x - 2.6 * u, y + 4.6 * u); g.lineTo(x - 0.7 * u, y - 4.6 * u); g.lineTo(x + 0.7 * u, y - 4.6 * u); g.lineTo(x + 2.6 * u, y + 4.6 * u); g.stroke()
        /* آذرخش برداری — به‌جای emoji */
        g.fillStyle = '#ffd84d'; g.beginPath()
        g.moveTo(x + 0.6 * u, y - 7.6 * u); g.lineTo(x - 1.2 * u, y - 5.2 * u); g.lineTo(x + 0.1 * u, y - 5.2 * u)
        g.lineTo(x - 0.7 * u, y - 3.4 * u); g.lineTo(x + 1.6 * u, y - 5.8 * u); g.lineTo(x + 0.5 * u, y - 5.8 * u)
        g.closePath(); g.fill()
        break
      case 'port': case 'naval_base':
        g.fillStyle = P.trim; g.fillRect(x - 6 * u, y + 2.2 * u, 12 * u, 1.4 * u) /* اسکله */
        g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x - 3 * u, y + 2.2 * u); g.lineTo(x - 3 * u, y - 3.4 * u); g.lineTo(x + 1.6 * u, y - 1.6 * u); g.stroke() /* جرثقیل */
        if (type === 'naval_base') { g.fillStyle = '#4f6b86'; g.beginPath(); g.moveTo(x + 2 * u, y + 0.4 * u); g.lineTo(x + 6 * u, y + 0.4 * u); g.lineTo(x + 4.6 * u, y + 1.8 * u); g.lineTo(x + 2.6 * u, y + 1.8 * u); g.closePath(); g.fill() }
        break
      case 'airport': case 'airbase':
        g.fillStyle = '#55606d'; g.fillRect(x - 7 * u, y + 1.2 * u, 14 * u, 2.2 * u)
        g.strokeStyle = '#e8eef4'; g.setLineDash([2 * u, 1.6 * u]); g.beginPath(); g.moveTo(x - 6 * u, y + 2.3 * u); g.lineTo(x + 6 * u, y + 2.3 * u); g.stroke(); g.setLineDash([])
        box(3.6, 2, 1.2, '#9aa7b4') /* آشیانه */
        if (type === 'airbase') { g.fillStyle = '#e8eef4'; g.beginPath(); g.moveTo(x + 4 * u, y - 2.2 * u); g.lineTo(x + 7 * u, y - 1.4 * u); g.lineTo(x + 4 * u, y - 0.6 * u); g.closePath(); g.fill() } /* هواپیمای برداری */
        break
      case 'barracks':
        box(7, 3, 3.4); roof(8, 3.4, 1.8)
        g.fillStyle = '#3f7a52'; g.fillRect(x - 0.6 * u, y - 6.4 * u, 1.2 * u, 3 * u); g.fillStyle = '#7fe3ff'; g.fillRect(x + 0.6 * u, y - 6.4 * u, 2.6 * u, 1.6 * u) /* پرچم */
        break
      case 'defense':
        g.fillStyle = '#8d99a6'
        g.fillRect(x - 7 * u, y - 0.6 * u, 14 * u, 3.6 * u)
        for (let i = -3; i <= 3; i += 2) g.fillRect(x + i * 2 * u - 1 * u, y - 2.4 * u, 2 * u, 1.8 * u) /* کنگره */
        g.strokeStyle = P.trim; g.strokeRect(x - 7 * u, y - 0.6 * u, 14 * u, 3.6 * u)
        break
      case 'radar':
        g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x, y + 4 * u); g.lineTo(x, y - 1.4 * u); g.stroke()
        g.fillStyle = glass; g.beginPath(); g.ellipse(x, y - 3 * u, 3.4 * u, 2.2 * u, -0.5, 0, 6.3); g.fill(); g.stroke()
        break
      case 'university':
        box(8, 4, 3.6); g.fillStyle = glass; g.beginPath(); g.arc(x, y - 2.2 * u, 2.2 * u, Math.PI, 0); g.fill(); g.strokeStyle = P.trim; g.stroke()
        for (let i = -2; i <= 2; i++) g.fillRect(x + i * 2.4 * u - 0.4 * u, y - 0.4 * u, 0.8 * u, 3.6 * u)
        break
      case 'bank': case 'gov':
        box(9, 5, 4)
        g.fillStyle = '#e8eef4'; for (let i = -2; i <= 2; i++) g.fillRect(x + i * 2.6 * u - 0.5 * u, y - 1 * u, 1 * u, 4.6 * u)
        if (type === 'gov') { g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(x, y - 6 * u, 1.4 * u, 0, 6.3); g.fill() }
        break
      case 'storage':
        g.fillStyle = '#b8a888'; g.beginPath(); g.arc(x, y + 1.4 * u, 3.6 * u, Math.PI, 0); g.fill(); g.strokeStyle = P.trim; g.stroke()
        g.fillRect(x - 3.6 * u, y + 1.4 * u, 7.2 * u, 3.4 * u); g.strokeRect(x - 3.6 * u, y + 1.4 * u, 7.2 * u, 3.4 * u)
        break
      default:
        box(6, 5, 4); roof(7, 4, 2)
    }
    /* ---- رشد با سطح (بند ۶/۸ دستور): سبک — چند Shape ساده ---- */
    if (level >= 3) {
      if (type === 'farm') roof(4, 4.8, 1.6) /* انبار دوم */
      else if (type === 'oil_rig' || type === 'mine') { g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x - 5.6 * u, y + 4 * u); g.lineTo(x - 4.2 * u, y - 2.4 * u); g.lineTo(x - 3 * u, y + 4 * u); g.stroke() } /* دکل دوم */
      else if (type === 'port' || type === 'naval_base' || type === 'airport' || type === 'airbase') { g.strokeStyle = P.trim; g.beginPath(); g.moveTo(x + 5.4 * u, y + 2.2 * u); g.lineTo(x + 5.4 * u, y - 2.6 * u); g.lineTo(x + 7.6 * u, y - 1.2 * u); g.stroke() } /* جرثقیل/راهنما دوم */
      else if (type !== 'radar' && type !== 'defense') box(3.2, 2.4, 6.4) /* الحاق */
      else { g.fillStyle = P.trim; g.fillRect(x - 9.5 * u, y - 0.2 * u, 2.4 * u, 3 * u) } /* برجک */
    }
    if (level >= 5) {
      if (type === 'factory' || type === 'tank_plant' || type === 'power') { g.fillStyle = P.trim; g.fillRect(x + 4.2 * u, y - 7.4 * u, 1.5 * u, 5 * u) } /* دودکش دوم */
      else if (type === 'farm') { g.fillStyle = '#b8a888'; g.beginPath(); g.arc(x + 6 * u, y + 2.6 * u, 1.8 * u, Math.PI, 0); g.fill(); g.fillRect(x + 4.2 * u, y + 2.6 * u, 3.6 * u, 1.6 * u); g.strokeStyle = P.trim; g.strokeRect(x + 4.2 * u, y + 2.6 * u, 3.6 * u, 1.6 * u) } /* سیلو */
      else if (type === 'port' || type === 'naval_base') box(4, 2.2, 1.4) /* انبار بندر */
      else if (type !== 'defense') box(3, 1.8, 8.4) /* توسعه‌ی عمومی */
    }
    if (level >= 8 && lod >= 2) { /* پرچم سطح بالا — فقط نمای جزئیات */
      g.strokeStyle = P.trim; g.lineWidth = 1 * s
      g.beginPath(); g.moveTo(x - 6.4 * u, y + 3.4 * u); g.lineTo(x - 6.4 * u, y - 8.4 * u); g.stroke()
      g.fillStyle = '#ffd84d'; g.fillRect(x - 6.4 * u, y - 8.4 * u, 3 * u, 1.8 * u)
    }
    if (level >= 10 && lod >= 2) { /* نشان لندمارک — الماس ثابت (بدون باب — بند ۴۰) */
      const by2 = y - 11.4 * u
      g.fillStyle = 'rgba(255,216,77,.9)'
      g.beginPath(); g.moveTo(x, by2 + 2 * u); g.lineTo(x - 1.5 * u, by2); g.lineTo(x, by2 - 2 * u); g.lineTo(x + 1.5 * u, by2); g.closePath(); g.fill()
    }
    /* سطح ۵+: آنتن (فقط LOD2) — V78: هاله‌ی پالسی سطح ۸ حذف شد (پالس دائمی ممنوع) */
    if (level >= 5 && level < 8 && lod >= 2) { g.strokeStyle = accent; g.beginPath(); g.moveTo(x + 5.4 * u, y + 0.6 * u); g.lineTo(x + 5.4 * u, y - 4.4 * u); g.stroke(); g.fillStyle = accent; g.beginPath(); g.arc(x + 5.4 * u, y - 5 * u, 0.9 * u, 0, 6.3); g.fill() }
  }

  /* ---------- جاده‌ها (V76) — مسیر ارگانیک قطعی + رسم نرم چند-قطعه‌ای ---------- */
  function roadPath(a, b, salt) { /* مختصات geo — ۵ نقطه با پیچ عمود قطعی */
    const pts = [a]
    const segs = 3
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len, ny = dx / len
    for (let i = 1; i < segs; i++) {
      const t = i / segs
      const j = (hash01(salt * 31 + i) - 0.5) * 0.16 * len
      pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j])
    }
    pts.push(b)
    return pts
  }
  function strokePath(g, pts, w, col) { /* quadratic از میان‌نقطه‌ها — نرم */
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2
      g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
    }
    const l = pts[pts.length - 1]; g.lineTo(l[0], l[1]); g.stroke()
  }
  function pathPoint(pts, t) { /* موقعیت روی polyline — برای محیط زنده روی جاده */
    const segs = pts.length - 1
    const x = clamp(t, 0, 1) * segs
    const i = Math.min(segs - 1, Math.floor(x))
    const f = x - i
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]
  }

  /* ---------- V78 §15: شبکه‌ی جاده — درختی، نه شعاعی ----------
     پایتخت ↔ ۴ قطب اصلی (بیشترین جمعیت شهر اول) + اتصال Prim بقیه به نزدیک‌ترین
     گره‌ی متصل → هیچ خط شعاعی از پایتخت به همه‌چیز. قطعی + cache (S._rn).
     mains: کلاس اصلی (دو-استروک) | spurs: کلاس فرعی (فقط tier≥۲ و نمای بالا). */
  function roadNetwork() {
    if (S._rn) return S._rn
    const cells = S.cells
    const n = cells.length
    if (n < 2) return (S._rn = { mains: [], spurs: [] })
    const kxN = kmPerLon()
    const D = (i, j) => Math.hypot((cells[i].cx - cells[j].cx) * kxN, cells[i].cy - cells[j].cy)
    const popOf = (i) => { const cs = cells[i].prov.cities || []; return cs.length ? cs[0].popK : 0 }
    const order = []
    for (let i = 1; i < n; i++) order.push(i)
    order.sort((a, b) => popOf(b) - popOf(a))
    const inTree = new Set([0])
    const mains = [], spurs = []
    for (let k = 0; k < order.length && mains.length < 4; k++) { mains.push([0, order[k]]); inTree.add(order[k]) }
    while (inTree.size < n) {
      let bi = -1, bj = -1, bd = 1e9
      for (const i of inTree) {
        for (let j = 0; j < n; j++) {
          if (inTree.has(j)) continue
          const d = D(i, j)
          if (d < bd) { bd = d; bi = i; bj = j }
        }
      }
      if (bj < 0) break
      const important = popOf(bj) >= 600 || cells[bj].prov.type === 'industrial' || cells[bj].prov.coastal
      ;(important ? mains : spurs).push([bi, bj])
      inTree.add(bj)
    }
    return (S._rn = { mains, spurs })
  }

  /* ---------- جایگاه‌های slot هر استان (V76) — پراکندگی ارگانیک قطعی داخل سلول ----------
     فقط presentation است: slot index سرور دست‌نخورده؛ مختصات geo ثابت (دیگر با زوم جابجا نمی‌شود). */
  function slotLayout(ci) {
    const c = S.cells[ci]; if (!c) return null
    if (c._slots) return c._slots
    const n = Math.max(1, c.prov.slots || 4)
    const bw = c.bboxW || 0.4, bh = c.bboxH || 0.4
    const rr0 = Math.min(bw, bh)
    const kxN = kmPerLon() / 111.32 /* دایره‌ای شدن پخش روی صفحه */
    const pts = []
    let guard = 0
    while (pts.length < n && guard < 60) {
      const k = pts.length
      const ang = k * 2.39996 + hash01(ci * 91 + k * 17) * 1.1
      const rad = rr0 * (0.16 + 0.34 * Math.sqrt((k + 1) / n)) + hash01(ci * 13 + k * 7) * rr0 * 0.06
      let dLng = Math.cos(ang) * rad / kxN, dLat = Math.sin(ang) * rad
      let p = [c.cx + dLng, c.cy + dLat]
      if (c.poly && !pointInPoly(p, c.poly)) p = [c.cx + dLng * 0.5, c.cy + dLat * 0.5]
      pts.push(p)
      guard++
      if (k === n - 1) break
    }
    c._slots = pts
    return pts
  }
  function slotPos(ci, slot) {
    const lay = slotLayout(ci)
    const gp = (lay && lay[slot % lay.length]) || (S.cells[ci] ? [S.cells[ci].cx, S.cells[ci].cy] : [0, 0])
    return project(gp[0], gp[1])
  }
  function catOf(type) { return S.cat.find((x) => x.id === type) }

  /* ============================================================
     V78 §1-§6/§25 — سیستم لیبل شهر: اولویت + برخورد + cache
     اولویت: پایتخت=۱۰۰ | شهر اصلی پرجمعیت (popK≥۶۰۰)=۸۰ | صنعتی/نفت/بندر/نظامی=۶۰ | عادی=۳۰
     §3: قبل از رسم sort بر اساس اولویت؛ هر لیبلِ برخوردی پنهان می‌شود (نه چاپ روی هم) —
         برخورد با نقطه‌ی شهرهای دیگر + الماس هدف هم چک می‌شود.
     §4: عدد داخل اسم تولیدی («شهرک صنعتی ۲») در لیبل حذف — لیبل = نوع شهر؛
         پایتخت = «پایتخت» + ستاره‌ی برداری (§6). اسم کامل فقط در پنل شهر.
     §25: boxها cache می‌شوند؛ فقط با تغییر دوربین/زوم/داده بازچینی می‌شود.
     ============================================================ */
  const SHORT_KIND_FA = { metro: 'شهر مرکزی', industrial: 'شهرک صنعتی', agri: 'شهر کشاورزی', port: 'بندر', oil: 'شهر نفتی', military: 'شهرک نظامی', mountain: 'شهر کوهپایه‌ای' }
  /* V79: مسیر گرد شدهٔ سازگار (بدون ctx.roundRect برای سازگاری WebView قدیمی) */
  function pillPath(g, x0, y0, w, h, r) {
    r = Math.min(r, h / 2, w / 2)
    g.beginPath()
    g.moveTo(x0 + r, y0)
    g.lineTo(x0 + w - r, y0); g.arc(x0 + w - r, y0 + r, r, -1.5708, 0)
    g.lineTo(x0 + w, y0 + h - r); g.arc(x0 + w - r, y0 + h - r, r, 0, 1.5708)
    g.lineTo(x0 + r, y0 + h); g.arc(x0 + r, y0 + h - r, r, 1.5708, 3.14159)
    g.lineTo(x0, y0 + r); g.arc(x0 + r, y0 + r, r, 3.14159, 4.71239)
    g.closePath()
  }
  function layoutLabels(g, W, H, z) {
    const key = [Math.round(S.cam.x * 3), Math.round(S.cam.y * 3), Math.round(z * 10), S.buildings.length, S.sel.prov, S.obj ? S.obj.id : '-'].join('|')
    if (S._lbl && S._lbl.key === key) return S._lbl
    const cands = []
    S.cells.forEach((c) => {
      ;(c.prov.cities || []).forEach((city, k) => {
        const p = project(city.lng, city.lat)
        if (p[0] < -30 || p[1] < -30 || p[0] > W + 30 || p[1] > H + 30) return
        const isCap = c.prov.i === 0 && k === 0
        const pri = isCap ? 100 : city.popK >= 600 ? 80 : (city.kind === 'port' || city.kind === 'oil' || city.kind === 'industrial' || city.kind === 'military') ? 60 : 30
        if (k > 0 && z < 2) return /* شهرهای ثانویه فقط نمای نزدیک */
        /* V79: برچسب = نام نوع + عدد سطح واقعی (از popK سرور) — مثل تصویر مرجع */
        const lv = cityLevel(city)
        const base = isCap ? 'پایتخت' : (SHORT_KIND_FA[city.kind] || 'شهر')
        cands.push({ x: p[0], y: p[1], txt: base + ' · ' + fa(lv), pri, popK: city.popK || 0, isCap })
      })
    })
    cands.sort((a, b) => b.pri - a.pri || b.popK - a.popK)
    const minPri = z < 1.5 ? 80 : z < 2 ? 60 : 0
    const maxN = z < 1.5 ? 4 : z < 2 ? 9 : 18
    const fs = Math.round(9.5 * Math.min(1.35, z))
    g.font = '600 ' + fs + 'px Vazirmatn, Tahoma, sans-serif'
    const placed = [], boxes = [], reserves = []
    /* رزرو نشانه‌ها (§3): نقطه‌ی همه‌ی شهرهای کاندید + الماس هدف */
    for (const c of cands) reserves.push({ x0: c.x - 4, y0: c.y - 4, x1: c.x + 4, y1: c.y + 4 })
    if (S.obj && S.obj.prov != null && S.cells[S.obj.prov]) {
      const op = project(S.cells[S.obj.prov].cx, S.cells[S.obj.prov].cy)
      reserves.push({ x0: op[0] - 9, y0: op[1] - 48, x1: op[0] + 9, y1: op[1] - 18, noOwn: -2 })
    }
    const hits = (b, selfIdx) => {
      for (let i = 0; i < boxes.length; i++) { const q = boxes[i]; if (b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0) return true }
      for (let i = 0; i < reserves.length; i++) { if (i === selfIdx) continue; const q = reserves[i]; if (b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0) return true }
      return false
    }
    for (let i = 0; i < cands.length; i++) {
      if (placed.length >= maxN) break
      const c = cands[i]
      if (c.pri < minPri) continue
      const halfW = g.measureText(c.txt).width / 2 + 7 /* V79: پیل تیره — عرض + پدینگ */
      const halfH = fs / 2 + 4.5
      const capB = c.isCap ? 5 * z : 0
      /* V78 §1: سه جایگاه کاندید — بالا/پایین/راست؛ اولین جایگاهِ بدون برخورد برده.
         هیچ‌کدام برخوردی رسم نمی‌شود (HIDE) — پایتخت هم فقط وقتی واقعاً جا نیست حذف می‌شود. */
      const tries = [
        { x: c.x, y: c.y - 9 * z - capB },
        { x: c.x, y: c.y + 9 * z + halfH },
        { x: c.x + 7 * z + halfW, y: c.y - 3 * z },
      ]
      for (const pos of tries) {
        const bx = { x0: pos.x - halfW, y0: pos.y - halfH, x1: pos.x + halfW, y1: pos.y + halfH }
        if (hits(bx, i)) continue /* §1/§3: برخورد = جای دیگر یا پنهان */
        boxes.push(bx)
        placed.push({ x: pos.x, y: pos.y, txt: c.txt, isCap: c.isCap, fs })
        break
      }
    }
    S._lbl = { key, list: placed, boxes }
    return S._lbl
  }

  /* ---------- رندر پویا (هر فریم — فقط چیزهای دیدنی) ---------- */
  function render(dt) {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    /* V82 FIX ریشه‌ای «terrain هنگام زوم ناپدید شد» (regression V81):
       ۱) drawImage مقصد را با ww*(z/bs) می‌کشید در حالی که محتوای bake با مقیاس bs نقاشی شده
          و اندازه‌ی جهانِ آن ww است ⇒ مقصد درست ww*z است (نه تقسیم بر bs) —
          در نتیجه در هر bucket>1 کل terrain به اندازه‌ی bs کوچک‌تر شده به گوشه‌ی بالا-چپ می‌رفت
          (fit سالم می‌ماند چون آنجا bs=1 بود — همان «buildings هست، زمین نیست»)
       ۲) debounce rebake: تغییر bucket در حین پینچ/چرخ سریع فقط ۳۵۰ms بعد از آخرین عبور bake می‌شود
          (منشأ اصلی «لگ شدید»: ۵-۶ rebake کامل پشت‌سرهم در یک پینچ) — dirtyStatic همچنان فوری */
    {
      const zbN = zoomBucket()
      if (S.dirtyStatic || zbN !== staticBucket) {
        if (zbN !== S._pendB) { S._pendB = zbN; S._pendT = performance.now() }
        if (S.dirtyStatic || performance.now() - (S._pendT || 0) >= 350) bakeStatic()
      }
    }
    const W = cv.clientWidth, H = cv.clientHeight
    const z = S.cam.z
    ctx.clearRect(0, 0, W, H)
    /* V81 FIX-A: دریای عمقی — زیرِ همه‌چیز، هم‌ترازِ bake در فضای جهان ⇒ هر نقطه‌ی
       قابل‌وصول دریا/زمین دارد؛ لبه‌ی بوم bake با دریا یکدست (بدون درز و برش).
       هزینه: یک createLinearGradient + یک fillRect در هر فریمِ رسم‌شده (≈۰٫۰۵ms). */
    if (S._seaY0 != null) {
      const gy0 = H / 2 + (S._seaY0 + S.cam.y) * z, gy1 = H / 2 + (S._seaY1 + S.cam.y) * z
      const sg = ctx.createLinearGradient(0, gy0, 0, gy1)
      sg.addColorStop(0, '#0b2c47'); sg.addColorStop(1, '#071e33')
      ctx.fillStyle = sg
    } else ctx.fillStyle = '#0b2c47'
    ctx.fillRect(0, 0, W, H)
    /* V81: بوم جهان-مُدار (کشور + حاشیه) — مستقیم با نسبت z/bs رسم می‌شود؛
       پان/زوم بین bucketها صفر rebake مثل قبل، ولی پوشش دیگر به دوربین خنثی محدود نیست */
    if (S._bakeS) {
      /* V82 FIX: اندازه‌ی مقصد = اندازه‌ی جهانِ bake × زوم فعلی — بدون تقسیم بر bs */
      ctx.drawImage(staticCv, W / 2 + (S._bakeOX + S.cam.x) * z, H / 2 + (S._bakeOY + S.cam.y) * z, S._bakeW * z, S._bakeH * z)
      /* V82 DEBUG_TERRAIN: پیکسل مرکزِ صفحه + مقصد واقعی drawImage */
      if (window.__WD_DBG_TERRAIN) {
        try {
          const px = ctx.getImageData(Math.round(W / 2 * dpr), Math.round(H / 2 * dpr), 1, 1).data
          window.__WD_DBG_TERRAIN.screen = {
            z: +z.toFixed(2), bakeS: S._bakeS, camX: +S.cam.x.toFixed(1), camY: +S.cam.y.toFixed(1),
            centerPx: [px[0], px[1], px[2], px[3]],
            dest: [Math.round(W / 2 + (S._bakeOX + S.cam.x) * z), Math.round(H / 2 + (S._bakeOY + S.cam.y) * z), Math.round(S._bakeW * z), Math.round(S._bakeH * z)],
          }
        } catch (e) {}
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    /* V79: شیمر دریا — یک استروک دش‌دار روی خط ساحل؛ فاز ۹۰۰ms از loop (باتری‌دوست،
        در idle فقط ۱ بازرسم اضافه per فاز)؛ Low-tier خاموش */
    if (S.tier !== 'low' && z >= 0.85 && S.ring && S.ring.length > 8) {
      const wp = Math.floor((S.nowMs || 0) / 900) % 2
      ctx.strokeStyle = 'rgba(210,244,250,' + (wp ? 0.17 : 0.09) + ')'
      ctx.lineWidth = 1.6
      ctx.setLineDash([3, 11]); ctx.lineDashOffset = wp ? -7 : -16
      pathRing(ctx, S.ring.map((p) => project(p[0], p[1]))); ctx.stroke()
      /* V81: موج دومِ دورتر از ساحل — روی حلقه‌ی آفستِ bake؛ رانش مخالف، همان فاز ۹۰۰ms
         (بدون بیدارباش تازه — در همان فریمِ فاز رسم می‌شود؛ +۱ استروک/فریم رسم‌شده) */
      if (z >= 1 && S._ring2W) {
        ctx.strokeStyle = 'rgba(150,212,232,' + (wp ? 0.13 : 0.06) + ')'
        ctx.lineWidth = 1.3
        ctx.setLineDash([12, 22]); ctx.lineDashOffset = wp ? 9 : -6
        pathRing(ctx, S._ring2W.map((p) => project(p[0], p[1]))); ctx.stroke()
      }
      ctx.setLineDash([])
    }
    const showBuildings = z >= 1.5   /* V76 §17: ساختمان‌ها از نمای شهر */
    const showDetails = z >= 2.2     /* V76 §17: جزئیات از نمای ساختمان */
    /* V76 §25: سلسله‌مراتب — وقتی استانی انتخاب است، بقیه کم‌رنگ شوند */
    if (S.sel.prov >= 0) {
      ctx.fillStyle = 'rgba(5,12,22,.30)'
      S.cells.forEach((c, i) => {
        if (i === S.sel.prov || !c.poly) return
        pathRing(ctx, c.poly.map((p) => project(p[0], p[1]))); ctx.fill()
      })
    }
    /* V77 §5: هایلایت hover — بسیار ملایم، فقط دسکتاپ، بدون رقابت با انتخاب */
    if (S.hover >= 0 && S.hover !== S.sel.prov && S.cells[S.hover] && S.cells[S.hover].poly) {
      pathRing(ctx, S.cells[S.hover].poly.map((p) => project(p[0], p[1])))
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.4; ctx.stroke()
    }
    const tSec = S.nowMs / 1000

    /* V74: لحظه‌ی ورود — تپش مرز کشور + قاب شناور (سبک: فقط stroke متحرک) */
    if (S.enter && !S.enter.done) {
      const k = clamp((S.nowMs - S.enter.t0) / (S.enter.ms || 1200), 0, 1)
      if (S.ring) {
        const ring = S.ring.map((p) => project(p[0], p[1]))
        ctx.strokeStyle = 'rgba(255,216,77,' + (0.9 * (1 - k)) + ')'
        ctx.lineWidth = 3.5 - 2 * k
        ctx.setLineDash([10, 7]); ctx.lineDashOffset = -S.nowMs / 24
        pathRing(ctx, ring); ctx.stroke(); ctx.setLineDash([])
      }
      if (k >= 1) S.enter.done = true
    }

    /* V78 §21: چراغ‌های فلیکر شهر حذف شد — نقطه‌های ریز روشن = white-pixel noise
       روی نقشه‌ی روز؛ هویت شهر حالا با خوشه/گلیف/لیبل منتقل می‌شود */

    /* V79: پیل تیره‌ی برچسب شهر (اسم + عدد سطح) — مثل تصویر مرجع؛ برخورد صفر مثل V78 */
    {
      const lab = layoutLabels(ctx, W, H, z)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      for (const L of lab.list) {
        ctx.font = '600 ' + L.fs + 'px Vazirmatn, Tahoma, sans-serif'
        const pw = ctx.measureText(L.txt).width + 14, ph = L.fs + 8
        pillPath(ctx, L.x - pw / 2, L.y - ph / 2, pw, ph, ph / 2)
        ctx.fillStyle = L.isCap ? V79.capPillBg : V79.pillBg
        ctx.fill()
        ctx.strokeStyle = L.isCap ? 'rgba(255,216,77,.4)' : V79.pillEdge
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = L.isCap ? '#ffe9a8' : V79.pillText
        ctx.fillText(L.txt, L.x, L.y + 0.5)
        if (L.isCap) { /* §6: ستاره‌ی برداری بالای پیل پایتخت — بدون emoji */
          const su = Math.min(1.35, z)
          ctx.fillStyle = '#ffd84d'; ctx.beginPath()
          for (let k = 0; k < 10; k++) {
            const a2 = -1.5708 + k * 0.6283, rr2 = (k % 2 ? 1.2 : 2.6) * su
            const px = L.x + Math.cos(a2) * rr2, py = L.y - ph / 2 - 3.4 * su + Math.sin(a2) * rr2
            if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py)
          }
          ctx.closePath(); ctx.fill()
        }
      }
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic'
    }

    /* ساخت‌وسازهای در حال ساخت + ساختمان‌ها — رسم برداری + Culling + LOD سه‌گانه */
    if (showBuildings) {
      const bLod = z >= 2.8 ? 2 : z >= 2.05 ? 1 : 0 /* V78 §9 */
      for (const b of S.buildings) {
        const p = slotPos(b.province, b.slot)
        if (p[0] < -60 || p[1] < -60 || p[0] > W + 60 || p[1] > H + 60) continue
        const def = catOf(b.type)
        if (!def) continue
        const active = b.status === 'active'
        let prog = 1
        if (!active && b.doneAt) prog = clamp(1 - (b.doneAt - S.nowMs) / Math.max(1, b.doneAt - b.startedAt), 0, 1)
        /* سایه‌ی زمین — V77 §11: Low=خاموش | Medium=ساده | High=جهت‌دار */
        if (tierCfg().shadows) {
          ctx.beginPath()
          ctx.ellipse(p[0] + (S.tier === 'high' ? 2.2 : 0), p[1] + 5 * z, 9 * Math.min(1.6, z), 3.4 * Math.min(1.6, z), 0, 0, 6.3)
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill()
        }
        /* V76 §16: لندمارک — حلقه‌ی ثابت ظریف (حداکثر ۳ — محاسبه در تیک ۱ثانیه) */
        if (S._lm && S._lm[b.id] && active) {
          ctx.strokeStyle = 'rgba(255,216,77,.4)'; ctx.lineWidth = 1.4
          ctx.beginPath(); ctx.ellipse(p[0], p[1] + 5 * z, 13 * Math.min(1.6, z), 5 * Math.min(1.6, z), 0, 0, 6.3); ctx.stroke()
        }
        /* بدنه: سه مرحله‌ی ساخت (فونداسیون ← اسکلت ← ساختمان واقعی) */
        const st = active ? 0 : prog < 0.33 ? 1 : 2
        if (st === 2) { /* اسکلت: قاب + تیرهای مورب */
          const s2 = Math.min(1.7, z), u2 = 1.15 * s2
          ctx.strokeStyle = 'rgba(255,200,80,.9)'; ctx.lineWidth = 1.2 * s2
          ctx.strokeRect(p[0] - 5.5 * u2, p[1] - 4.5 * u2, 11 * u2, 9 * u2)
          ctx.beginPath()
          ctx.moveTo(p[0] - 5.5 * u2, p[1] - 4.5 * u2); ctx.lineTo(p[0] + 5.5 * u2, p[1] + 4.5 * u2)
          ctx.moveTo(p[0] + 5.5 * u2, p[1] - 4.5 * u2); ctx.lineTo(p[0] - 5.5 * u2, p[1] + 4.5 * u2)
          ctx.stroke()
          ctx.beginPath(); ctx.moveTo(p[0] + 5.5 * u2, p[1] - 4.5 * u2); ctx.lineTo(p[0] + 10 * u2, p[1] - 8.5 * u2); ctx.stroke() /* بازوی جرثقیل */
        } else if (st === 0) {
          drawBuilding(ctx, p[0], p[1], b.type, b.level, z, 0, tSec, bLod)
        }
        /* حلقه‌ی پیشرفت ساخت */
        if (!active && b.doneAt) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 13 * Math.min(1.6, z), -Math.PI / 2, -Math.PI / 2 + prog * 6.283)
          ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.2; ctx.stroke()
        }
        /* V78 §4/§21: پله‌های سطح (rectهای ریز کنار ساختمان) حذف شد —
           سطح با رشد خود ساختمان (L3/L5/L8/L10) و پنل منتقل می‌شود، نه نویز ریز */
        /* V78 §40: انتخاب — حلقه‌ی ثابت (بدون پالس دائمی) */
        if (S.sel.bld && S.sel.bld.id === b.id) {
          ctx.globalAlpha = 0.85
          ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(p[0], p[1], 15 * Math.min(1.6, z), 0, 6.3); ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
    }

    /* انتخاب استان */
    if (S.sel.prov >= 0 && S.cells[S.sel.prov]) {
      const c = S.cells[S.sel.prov]
      if (c.poly) {
        const poly = c.poly.map((p) => project(p[0], p[1]))
        pathRing(ctx, poly)
        ctx.fillStyle = 'rgba(255,216,77,.10)'; ctx.fill()
        ctx.strokeStyle = 'rgba(255,216,77,.95)'; ctx.lineWidth = 1.8; ctx.stroke()
      }
      /* جایگاه‌های خالی استان انتخابی — از نمای شهر (V76 §12: کجا باید کلیک کرد) */
      if (z >= 1.6) {
        const n = c.prov.slots
        for (let s = 0; s < n; s++) {
          if (S.buildings.some((b) => b.province === S.sel.prov && b.slot === s)) continue
          const p = slotPos(S.sel.prov, s)
          ctx.beginPath(); ctx.arc(p[0], p[1], 7 * Math.min(1.6, z), 0, 6.3)
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.setLineDash([])
          ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '10px sans-serif'
          ctx.fillText('＋', p[0], p[1] + 1)
        }
      }
    }

    /* V76 §14: نشانگر هدف — الماس شناور بالای استان هدف (تا وقتی هدف باز است) */
    if (S.obj && S.obj.prov != null && S.cells[S.obj.prov]) {
      const oc = S.cells[S.obj.prov]
      const op = project(oc.cx, oc.cy)
      if (op[0] > -20 && op[1] > -20 && op[0] < W + 20 && op[1] < H + 20) {
        const oy = op[1] - 34 * Math.min(1.5, z) /* V78: الماس ثابت — بدون باب دائمی */
        const mz = Math.min(1.4, z)
        ctx.globalAlpha = 0.92
        ctx.fillStyle = '#ffd84d'
        ctx.beginPath(); ctx.moveTo(op[0], oy + 6 * mz); ctx.lineTo(op[0] - 4.4 * mz, oy); ctx.lineTo(op[0], oy - 6 * mz); ctx.lineTo(op[0] + 4.4 * mz, oy); ctx.closePath(); ctx.fill()
        ctx.strokeStyle = 'rgba(16,22,30,.7)'; ctx.lineWidth = 1; ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    /* V76: محیط زنده + ذرات + رد ضربه — همه فقط وقتی در Viewport */
    if (z >= 1.4 && AMB.length) drawAmbient(ctx) /* V79: کشتی از ۱٫۴؛ خودرو گیت درون */
    drawParticles(ctx)
    drawRipples(ctx, dt)
    stepParticles(dt)
    stepSmoke(dt)
    /* وینیت لبه‌ها — صفحه‌ثابت (V78: از bake به render — bake با دوربین transform می‌شود) */
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72)
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,8,16,.34)')
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)
  }

  /* ---------- حلقه‌ی اصلی (تک rAF) ---------- */
  let rafId = 0
  function loop(ts) {
    if (!S.active) { rafId = 0; return }
    rafId = requestAnimationFrame(loop)
    const dt = Math.min(0.1, (ts - S.lastFrame) / 1000 || 0.016)
    S.lastFrame = ts
    const t0 = performance.now()
    /* دوربین نرم */
    const cam = S.cam
    if (cam.anim) {
      const sx0 = cam.x, sy0 = cam.y, sz0 = cam.z
      cam.x = lerp(cam.x, cam.tx, 1 - Math.pow(0.001, dt))
      cam.y = lerp(cam.y, cam.ty, 1 - Math.pow(0.001, dt))
      cam.z = lerp(cam.z, cam.tz, 1 - Math.pow(0.001, dt))
      if (Math.abs(cam.x - cam.tx) < 0.5 && Math.abs(cam.y - cam.ty) < 0.5 && Math.abs(cam.z - cam.tz) < 0.01) cam.anim = false
      /* V81: اگر کلمپ دوربین جلوی رسیدن به هدف را گرفت — پایان نرم (نه حلقه‌ی بی‌پایان/باتری‌سوز) */
      else if (Math.abs(cam.x - sx0) < 0.05 && Math.abs(cam.y - sy0) < 0.05 && Math.abs(cam.z - sz0) < 0.0005) { cam.tx = cam.x; cam.ty = cam.y; cam.tz = cam.z; cam.anim = false }
    }
    clampCam()
    /* V78 §26: اگر هیچ چیز تغییر نکرده — صفر کار رندر (باتری موبایل).
       کانواس آخرین فریم را نگه می‌دارد؛ تیک ۱ثانیه‌ای همچنان داخل همین loop می‌چرخد.
       (V78: پالس‌های دائمی حذف شدند — دیگر z≥1.5 همیشه-متحرف نیست؛ idle-skip واقعی) */
    let animating = cam.anim || (S.enter && !S.enter.done)
    if (!animating && S.cam.z >= 1.4 && AMB.length > 0) animating = true /* V79: کشتی از ۱٫۴؛ خودرو فقط از ۲ (گیت درون fill) */
    if (!animating) { for (const b of S.buildings) { if (b.status !== 'active') { animating = true; break } } }
    if (!animating) {
      for (const p of pool) { if (p.on) { animating = true; break } }
      if (!animating) for (const r of RIPS) { if (r.on) { animating = true; break } }
    }
    const selKey = S.sel.prov + ':' + ((S.sel.bld && S.sel.bld.id) || '') + ':' + (S.hover | 0)
    /* V79: فاز موج دریا — حداکثر ۱ بازرسم اضافه در ~۹۰۰ms در نمای آرام (باتری‌دوست) */
    const waveP = (S.cam.z >= 0.85 && S.tier !== 'low') ? (Math.floor((S.nowMs || 0) / 900) % 2) : 0
    const camMoved = Math.abs(cam.x - (S._lcx == null ? 1e9 : S._lcx)) > 0.05 || Math.abs(cam.y - (S._lcy == null ? 1e9 : S._lcy)) > 0.05 || Math.abs(cam.z - (S._lcz == null ? 1e9 : S._lcz)) > 0.001
    if (!animating && !camMoved && selKey === S._lselKey && waveP === S._lwave && !S.dirtyStatic && zoomBucket() === staticBucket) {
      S._idleN = (S._idleN || 0) + 1
    } else {
      render(dt)
      S._lcx = cam.x; S._lcy = cam.y; S._lcz = cam.z; S._lselKey = selKey; S._lwave = waveP
    }
    /* V74: تیک ۱ثانیه‌ای داخل همین loop — بدون setInterval جدا (بند ۲۰ دستور) */
    S.acc += dt
    if (S.acc >= 1) {
      S.acc -= 1
      S.nowMs = Date.now()
      projectRes(1)
      /* تشخیص تکمیل ساخت — فلش + صدا + فعال‌سازی محلی */
      for (const b of S.buildings) {
        if (b.status === 'building' && b.doneAt && b.doneAt.getTime() <= S.nowMs) {
          b.status = 'active'
          const def = catOf(b.type)
          spawnParticles(...slotPos(b.province, b.slot), 'gold')
          snd('complete')
          toast('✅ ' + (def ? def.fa : 'ساختمان') + ' سطح ' + fa(b.level) + ' آماده شد')
          S.ambPaths = ambPathPool() /* مسیر جدید (بندر/فرودگاه) ممکن است فعال شود */
          if (b.type === 'factory' || b.type === 'tank_plant') S.dirtyStatic = true /* V77: ریل ممکن است مسیر جدید بگیرد */
          const pp = S.provinces[b.province]
          if (pp && S.sel.prov === b.province) openProvPanel(b.province) /* پنل باز را تازه کن */
        }
      }
      refreshObjective() /* V76 §14: هدف بعدی بعد از هر تکمیل */
      /* V76 §16: لندمارک‌ها — حداکثر ۳ (محاسبه‌ی سبک یک‌بار در ثانیه) */
      const lmScore = (b) => b.level * ((b.type === 'gov') ? 2 : (b.type === 'tank_plant' || b.type === 'naval_base' || b.type === 'airbase') ? 1.6 : (b.type === 'factory' || b.type === 'port' || b.type === 'university') ? 1.4 : 1)
      const lms = S.buildings.filter((b) => b.status === 'active' && b.level >= 6).sort((a2, b2) => lmScore(b2) - lmScore(a2)).slice(0, 3)
      S._lm = {}
      for (const b of lms) S._lm[b.id] = 1
      if ((S.hdrT = (S.hdrT || 0) + 1) % 2 === 0) header()
      /* V77 §31: hysteresis عملکرد — سردشدن ۳۰ثانیه‌ای بعد از هر تغییر tier +
         بازگشت فقط بعد از ۴۵ثانیه FPS پایدار (frameMs<9) */
      if (S._tierCd > 0) S._tierCd--
      else if (S.frameMs < 9 && S.tier !== 'high') { S._fast = (S._fast || 0) + 1; if (S._fast >= 45) { S._fast = 0; restoreTier(); S.ambPaths = ambPathPool(); S._tierCd = 45 } }
      else S._fast = 0
      /* بازسازی مسیرهای محیط هر ۵ ثانیه (سبک — فقط وقتی tier اجازه می‌دهد) */
      if ((S._ambT = (S._ambT || 0) + 1) >= 5) { S._ambT = 0; if (tierCfg().ambient) S.ambPaths = ambPathPool() }
    }
    stepAmbient(dt)
    /* بودجه‌ی فریم — افت خودکار کیفیت */
    const ms = performance.now() - t0
    S.frameMs = S.frameMs * 0.95 + ms * 0.05
    if (S.frameMs > 24 && S.tier !== 'low') { S._slow = (S._slow || 0) + 1; if (S._slow > 240) { degradeTier(); S.ambPaths = ambPathPool(); S.dirtyStatic = true } }
    else S._slow = Math.max(0, (S._slow || 0) - 1)
  }
  function startLoop() {
    if (!rafId) { S.lastFrame = performance.now(); rafId = requestAnimationFrame(loop) }
  }

  /* ---------- ورودی: Tap / Drag / Pinch / Wheel ---------- */
  function bindInput() {
    /* V68 — §29: گارد بایند-یک‌بار — قبلاً هر open() همه‌ی لیستنرها را دوباره می‌بست
       (N سشن → N× هندلر؛ لیک واقعی). المنت canvas ماندگار است؛ یک‌بار کافی است. */
    if (cv.__wdcvBound) return
    cv.__wdcvBound = true
    const st = stage()
    const pointers = new Map()
    let lastTap = { x: 0, y: 0, t: 0 }, moved = false
    const cvEl = cv
    cvEl.style.touchAction = 'none'

    cvEl.addEventListener('pointerdown', (e) => {
      try { cvEl.setPointerCapture(e.pointerId) } catch (err) { /* رویدادهای سینتتیک/استایلوس — غیرحیاتی */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      moved = false
      lastTap = { x: e.clientX, y: e.clientY, t: Date.now() }
    })
    cvEl.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      if (pointers.size === 1) {
        const dx = e.clientX - p.x, dy = e.clientY - p.y
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
        S.cam.x += dx / S.cam.z; S.cam.y += dy / S.cam.z
        S.cam.anim = false
        clampCam()
        p.x = e.clientX; p.y = e.clientY
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()]
        const d0 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        p.x = e.clientX; p.y = e.clientY
        const pts2 = [...pointers.values()]
        const d1 = Math.hypot(pts2[0].x - pts2[1].x, pts2[0].y - pts2[1].y)
        if (d0 > 10 && d1 > 10) {
          const f = clamp(d1 / d0, 0.85, 1.18)
          zoomAt((pts2[0].x + pts2[1].x) / 2, (pts2[0].y + pts2[1].y) / 2, S.cam.z * f)
          moved = true
        }
      }
    })
    /* V68 — §31: تک‌هندلر pointerup — دبل‌تپ = زوم (بدون onTap)، تک‌تپ = انتخاب.
       قبلاً دو هندلر جدا بودند: دبل‌تپ هم onTap می‌داد هم زوم (پنل استان بی‌دلیل باز می‌شد). */
    let lastTapT = 0, lastTapXY = [0, 0]
    cvEl.addEventListener('pointerup', (e) => {
      pointers.delete(e.pointerId)
      const now = Date.now()
      const isDouble = now - lastTapT < 320 && Math.hypot(e.clientX - lastTapXY[0], e.clientY - lastTapXY[1]) < 24
      lastTapT = isDouble ? 0 : now
      lastTapXY = [e.clientX, e.clientY]
      if (isDouble) { zoomAt(e.clientX - rectLeft(), e.clientY - rectTop(), clamp(S.cam.z * 1.5, 0.6, 4)); return }
      if (!moved && now - lastTap.t < 400) onTap(e.clientX, e.clientY)
    })
    cvEl.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId))
    cvEl.addEventListener('pointerleave', () => { if (S.hover !== -1) { S.hover = -1; S._lselKey = '' } }) /* V77 §5 */
    /* V77 §5: hover استان — فقط موس دسکتاپ، throttle ۹۰ms، بدون هیج هزینه‌ی لمسی */
    cvEl.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || pointers.size) return
      const now = performance.now()
      if (now - (S._hovT || 0) < 90) return
      S._hovT = now
      const sxh = e.clientX - rectLeft(), syh = e.clientY - rectTop()
      const [lng, lat] = unproject(sxh, syh)
      let hi = -1
      for (let i = 0; i < S.cells.length; i++) { const c2 = S.cells[i]; if (c2.poly && pointInPoly([lng, lat], c2.poly)) { hi = i; break } }
      if (hi !== S.hover) { S.hover = hi; S._lselKey = '' }
    })
    cvEl.addEventListener('wheel', (e) => {
      e.preventDefault()
      zoomAt(e.offsetX, e.offsetY, clamp(S.cam.z * (e.deltaY < 0 ? 1.12 : 0.89), 0.6, 4))
    }, { passive: false })
    bindWin()
  }
  /* V76 §21: لیسنرهای window مدیریت‌شده — در close() کامل برداشته می‌شوند */
  function bindWin() {
    if (S._winBound) return
    S._winBound = true
    window.addEventListener('resize', onResize)
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize) /* V81: کیبورد/چرخش موبایل */
    window.addEventListener('keydown', onKey)
  }
  function unbindWin() {
    if (!S._winBound) return
    S._winBound = false
    window.removeEventListener('resize', onResize)
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', onResize) /* V81 */
    window.removeEventListener('keydown', onKey)
  }
  function rectLeft() { return cv.getBoundingClientRect().left }
  function rectTop() { return cv.getBoundingClientRect().top }
  function zoomAt(sx, sy, nz) {
    const z0 = S.cam.z
    const wx = (sx - cv.clientWidth / 2) / z0 - S.cam.x
    const wy = (sy - cv.clientHeight / 2) / z0 - S.cam.y
    S.cam.z = clamp(nz, 0.6, 4)
    S.cam.x = (sx - cv.clientWidth / 2) / S.cam.z - wx
    S.cam.y = (sy - cv.clientHeight / 2) / S.cam.z - wy
    clampCam() /* V77 §48 */
    S.cam.anim = false
  }
  /* V81: دوربینِ قابل‌پیش‌بینی — وقتی کشور در قاب جا می‌شود فقط فنر نرمِ ۱۲٪ (کل کشور همیشه دیده
     می‌شود)؛ وقتی بزرگ‌تر است، لبه‌ی دید هرگز بیش از ۱۲٪ از مرز کشور بیرون نمی‌رود.
     (فرمول قدیم |cam| ≤ exW + 0.35W/z اجازه می‌داد ۸۵٪ قاب خالی شود — همان «بریده») */
  function clampCam() {
    if (!S.bbox || !cv || !view.base) return
    const z = S.cam.z, W = cv.clientWidth, H = cv.clientHeight
    const exW = (S.bbox.maxX - S.bbox.minX) * view.scale * kmPerLon() / 2
    const exH = (S.bbox.maxY - S.bbox.minY) * view.scale * 111.32 / 2
    const over = 0.12 * Math.min(W, H) / z
    const limX = Math.max(exW - W / (2 * z), 0) + over
    const limY = Math.max(exH - H / (2 * z), 0) + over
    S.cam.x = clamp(S.cam.x, -limX, limX)
    S.cam.y = clamp(S.cam.y, -limY, limY)
  }
  function onResize() {
    if (!S.active) return
    setupCanvas()
    const c = computeView(); view.base = { cx: c.cx, cy: c.cy }
    clampCam() /* V81: بعد از چرخش/کیبورد، دوربین با ابعاد تازه مهار شود */
  }
  function onKey(e) {
    if (!S.active) return
    if (e.key === 'Escape') close()
  }

  /* ---------- Tap: انتخاب استان / شهر / ساختمان ---------- */
  function onTap(clientX, clientY) {
    const sx = clientX - rectLeft(), sy = clientY - rectTop()
    spawnRipple(sx, sy) /* V74: بازخورد لمس */
    snd('tap')
    /* ساختمان نزدیک؟ */
    let hitB = null, hitD = Math.max(20, 24 * S.cam.z)
    for (const b of S.buildings) {
      const p = slotPos(b.province, b.slot)
      const d = Math.hypot(p[0] - sx, p[1] - sy)
      if (d < hitD) { hitD = d; hitB = b }
    }
    if (hitB) { selectBuilding(hitB); return }
    /* V76 §12: جایگاه خالی استان انتخابی — لمس مستقیم → پنل ساخت */
    if (S.sel.prov >= 0 && S.cam.z >= 1.5) {
      const csel = S.cells[S.sel.prov]
      const nE = csel ? csel.prov.slots : 0
      for (let s2 = 0; s2 < nE; s2++) {
        if (S.buildings.some((b) => b.province === S.sel.prov && b.slot === s2)) continue
        const pE = slotPos(S.sel.prov, s2)
        if (Math.hypot(pE[0] - sx, pE[1] - sy) < 16 * Math.max(1, S.cam.z * 0.8)) { openProvPanel(S.sel.prov); return }
      }
    }
    /* V74: شهر نزدیک؟ (زوم متوسط به بالا) */
    if (S.cam.z >= 1.35) {
      let hitC = null, hitCP = -1, hitCD = 16 * Math.max(1, S.cam.z * 0.8)
      for (const c of S.cells) {
        for (const city of (c.prov.cities || [])) {
          const p = project(city.lng, city.lat)
          const d = Math.hypot(p[0] - sx, p[1] - sy)
          if (d < hitCD) { hitCD = d; hitC = city; hitCP = c.prov.i }
        }
      }
      if (hitC) { openCityPanel(hitC, hitCP); return }
    }
    /* استان زیر نقطه؟ */
    const [lng, lat] = unproject(sx, sy)
    let hitP = -1
    S.cells.forEach((c, i) => {
      if (c.poly && pointInPoly([lng, lat], c.poly)) hitP = i
    })
    if (hitP >= 0) { S.sel.prov = hitP; S.sel.bld = null; S.sel.slot = null; openProvPanel(hitP) }
    else { S.sel.prov = -1; S.sel.bld = null; closePanels() }
  }
  function pointInPoly(pt, poly) {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }

  /* ---------- UI (پنل‌ها — تعداد نودها محدود) ---------- */
  function ui() { return document.getElementById('wdcv-ui') }
  function closePanels() {
    const u = ui(); if (!u) return
    const p = u.querySelector('#wdcv-panel'); if (p) p.innerHTML = ''
  }
  function fmtRes(v) { return fa(Math.round(v)) }

  /* ============================================================
     V76 — اهداف و مسیر پیشرفت (بند ۱۴/۱۵ دستور) — فقط از داده‌ی واقعی
     S.buildings/S.provinces/S.counts — بدون state موازی، بدون متن تصادفی،
     بدون RPC جدید (presentation-only؛ سرور همچنان مرجع اقتصاد است).
     ============================================================ */
  const MILITARY_IDS = ['barracks', 'defense', 'radar', 'naval_base', 'airbase', 'tank_plant']
  /* V79: اهداف فعال با پیشرفت واقعی (۲/۵) — از همان قوانین computeObjective */
  function objRules() {
    const B = S.buildings || []
    const act = (t, pi) => B.some((b) => b.type === t && b.status === 'active' && (pi == null || b.province === pi))
    const cntProv = (pi) => B.filter((b) => b.province === pi).length
    const actN = B.filter((b) => b.status === 'active').length
    const resP = S.provinces.findIndex((p) => p.type === 'resource')
    const agP = S.provinces.findIndex((p) => p.type === 'agricultural')
    const inP = S.provinces.findIndex((p) => p.type === 'industrial')
    const coP = S.provinces.findIndex((p) => p.coastal)
    const maxLv = B.reduce((m, b) => Math.max(m, b.level || 0), 0)
    const actC = (n, t) => actN >= n || act(t)
    return [
      { id: 'first', fa: 'اولین ساختمان کشور را بساز', prov: 0, done: () => B.length >= 1, prog: () => [Math.min(1, B.length), 1] },
      { id: 'power', fa: 'نیروگاه بساز تا انرژی پایدار شود', prov: 0, done: () => act('power'), prog: () => [act('power') ? 1 : 0, 1] },
      { id: 'food', fa: 'تولید غذا: مزرعه در استان کشاورزی', prov: agP >= 0 ? agP : 0, done: () => act('farm'), prog: () => [act('farm') ? 1 : 0, 1] },
      { id: 'industry', fa: 'اولین کارخانه صنعتی را بساز', prov: inP >= 0 ? inP : 0, done: () => act('factory'), prog: () => [act('factory') ? 1 : 0, 1] },
      { id: 'oil', fa: 'تولید نفت: چاه/پالایشگاه در استان نفتی', prov: resP >= 0 ? resP : 0, done: () => act('oil_rig') || act('tank_plant'), prog: () => [(act('oil_rig') || act('tank_plant')) ? 1 : 0, 1] },
      { id: 'mil', fa: 'امنیت: یک تاسیسات نظامی بساز', prov: 0, done: () => B.some((b) => MILITARY_IDS.indexOf(b.type) >= 0), prog: () => [B.some((b) => MILITARY_IDS.indexOf(b.type) >= 0) ? 1 : 0, 1] },
      { id: 'cap4', fa: 'پایتخت را توسعه بده (۴ ساختمان)', prov: 0, done: () => cntProv(0) >= 4, prog: () => [Math.min(cntProv(0), 4), 4] },
      { id: 'port', fa: coP >= 0 ? 'بندر در استان ساحلی بساز' : '۶ ساختمان فعال در کشور', prov: coP >= 0 ? coP : null, done: () => coP >= 0 ? act('port') : actN >= 6, prog: () => coP >= 0 ? [act('port') ? 1 : 0, 1] : [Math.min(actN, 6), 6] },
      { id: 'res', fa: 'مرکز پژوهش بساز (پایتخت)', prov: 0, done: () => act('university'), prog: () => [act('university') ? 1 : 0, 1] },
      { id: 'net3', fa: 'در ۳ استان مختلف ساختمان فعال بساز', prov: null, done: () => new Set(B.filter((b) => b.status === 'active').map((b) => b.province)).size >= 3, prog: () => [Math.min(new Set(B.filter((b) => b.status === 'active').map((b) => b.province)).size, 3), 3] },
      { id: 'lv5', fa: 'یک ساختمان را به سطح ۵ برسان', prov: null, done: () => maxLv >= 5, prog: () => [Math.min(maxLv, 5), 5] },
      { id: 'act8', fa: '۸ ساختمان فعال — موتور اقتصاد کشور', prov: null, done: () => actN >= 8, prog: () => [Math.min(actN, 8), 8] },
      { id: 'land', fa: 'یک لندمارک بساز (سطح ۸)', prov: null, done: () => maxLv >= 8, prog: () => [Math.min(maxLv, 8), 8] },
      { id: 'act14', fa: '۱۴ ساختمان فعال — قدرت منطقه‌ای', prov: null, done: () => actN >= 14, prog: () => [Math.min(actN, 14), 14] },
    ]
  }
  function computeObjective() {
    for (const r of objRules()) if (!r.done()) return { id: r.id, fa: r.fa, prov: r.prov, t0: Date.now() }
    return null
  }
  /* V79: فهرست ۳ هدف بعدی با پیشرفت — برای باکس پایین-چپ (مثل تصویر مرجع) */
  function goalsList() {
    const out = []
    for (const r of objRules()) {
      if (r.done()) continue
      const p = r.prog ? r.prog() : [0, 1]
      out.push({ fa: r.fa, d: p[0], t: p[1], prov: r.prov })
      if (out.length >= 3) break
    }
    return out
  }
  function refreshObjective() {
    const prev = S.obj
    S.obj = computeObjective()
    if (prev && prev.id && (!S.obj || S.obj.id !== prev.id)) { toast('🎉 هدف انجام شد: ' + prev.fa); snd('upgrade') }
  }
  /* مسیر داستان (بند ۱۵): بازسازی ← انرژی ← صنعت ← شهری ← نظامی ← منطقه‌ای ← جهانی */
  function storyState() {
    const B = S.buildings || []
    const actN = B.filter((b) => b.status === 'active').length
    const has = (t) => B.some((b) => b.type === t && b.status === 'active')
    const capB = B.filter((b) => b.province === 0).length
    const provN = new Set(B.map((b) => b.province)).size
    const stages = [
      { fa: 'بازسازی', done: B.length >= 1 },
      { fa: 'انرژی', done: has('power') },
      { fa: 'صنعت', done: has('factory') },
      { fa: 'توسعه شهری', done: capB >= 4 },
      { fa: 'امنیت نظامی', done: MILITARY_IDS.some(has) },
      { fa: 'قدرت منطقه‌ای', done: actN >= 8 && provN >= 3 },
      { fa: 'قدرت جهانی', done: actN >= 14 && (S.counts.ports || 0) > 0 && (S.counts.airports || 0) > 0 },
    ]
    let cur = 0
    for (let i = 0; i < stages.length; i++) if (stages[i].done) cur = i + 1
    return { cur, total: stages.length, name: cur ? stages[cur - 1].fa : stages[0].fa, next: cur < stages.length ? stages[cur].fa : null }
  }

  function header() {
    const u = ui(); if (!u) return
    /* V68 — §23: نوشتن تفاضلی | V76: چیپ‌های منابع + هدف فعال + مسیر داستان | V79: فلش + پرچم/رتبه + باکس اهداف */
    const story = storyState()
    const goals = goalsList()
    const rankOfF = gameRef('rankOf'), terrF = gameRef('wdTerrCount')
    let rankTxt = ''
    let terrN = 0
    try { if (terrF) terrN = Math.max(0, terrF() | 0) } catch (e) { terrN = 0 }
    /* V79: لقب فتح از همون نردبان بازی — rankOf اسکوپ-ماژول است و از اینجا در دسترس نیست؛
        مقادیر یکسان محلی (presentation-only). اگر روزی rankOf سراسری شد، اولویت با او. */
    try {
      if (rankOfF) rankTxt = rankOfF(terrN)[1] || ''
      else {
        for (const [th, t2] of V79_RANKS) if (terrN >= th) rankTxt = t2
      }
    } catch (e) {}
    const sig = [S.countryFa || S.country, fmtRes(S.res.gold), fmtRes(S.res.oil), fmtRes(S.res.food),
      S.rates.gold, S.rates.oil, S.rates.food, S.mil.atkPct, S.mil.defPct, S.counts.ports, S.counts.airports, Math.floor(S.rp),
      S.obj ? S.obj.id : '-', story.cur, rankTxt,
      goals.map((g2) => g2.d + '/' + g2.t).join(',')].join('|')
    if (sig === (S._hdrCache || '')) return
    S._hdrCache = sig
    /* V79: پرچم + نام کشور + رتبه جهانی (همه از state موجود بازی — صفر شبکه) */
    let flagHtml = ''
    try {
      const FLR = gameRef('FL'), N2C = gameRef('N2C')
      const code = (FLR && FLR[S.country] && FLR[S.country].code) || (N2C && N2C[String(S.country || '').toLowerCase()])
      if (code) flagHtml = '<img class="wdcv-flag" alt="" src="/cdn/flags/w80/' + code + '.png" onerror="this.remove()">'
    } catch (e) {}
    u.querySelector('#wdcv-hname').innerHTML = flagHtml + '<span>' + (S.countryFa || S.country) + '</span>' + (rankTxt ? '<small id="wdcv-hrank">' + rankTxt + '</small>' : '')
    /* V79: چیپ‌های تیره‌ی گرد با فلش سبز/قرمز نرخ (مثل تصویر مرجع) */
    const arrow = (v) => v >= 0 ? '<small class="up">▲+' + fa(Math.round(v)) + '</small>' : '<small class="dn">▼' + fa(Math.round(v)) + '</small>'
    u.querySelector('#wdcv-hres').innerHTML =
      '<span class="wdcv-hchip">💰 ' + fmtRes(S.res.gold) + arrow(S.rates.gold) + '</span>' +
      '<span class="wdcv-hchip">🛢️ ' + fmtRes(S.res.oil) + arrow(S.rates.oil) + '</span>' +
      '<span class="wdcv-hchip">🌾 ' + fmtRes(S.res.food) + arrow(S.rates.food) + '</span>' +
      (S.rp > 0.5 ? '<span class="wdcv-hchip">🔬 ' + fa(Math.floor(S.rp)) + '</span>' : '')
    /* V79: باکس اهداف پایین-چپ — ۳ هدف بعدی با پیشرفت واقعی «۲/۵» */
    const goalEl = u.querySelector('#wdcv-goals')
    if (goalEl) {
      goalEl.innerHTML = '<div class="wdcv-goalhd">🎯 اهداف</div>' + goals.map((g2) =>
        '<div class="wdcv-goal" data-prov="' + (g2.prov == null ? '' : g2.prov) + '"><span>' + g2.fa + '</span><b>' + fa(g2.d) + '/' + fa(g2.t) + '</b></div>').join('')
    }
    /* V76 §14: هدف فعال از وضعیت واقعی کشور — قابل لمس → پنل استان هدف */
    const objEl = u.querySelector('#wdcv-obj')
    if (objEl) {
      objEl.textContent = S.obj ? ('🎯 ' + S.obj.fa) : '🏆 کشور شکوفا شد — همه‌ی اهداف انجام شده'
      objEl._prov = S.obj ? S.obj.prov : null
      objEl.style.display = S.obj ? '' : 'none'
    }
    /* جزئیات بازشو (نظامی/بندر + مسیر داستان — بند ۱۵) — V79: 🔬 به hres منتقل شد */
    u.querySelector('#wdcv-hmil').innerHTML =
      '<span class="wdcv-hchip">⚔️ +' + fa(S.mil.atkPct) + '٪</span>' +
      '<span class="wdcv-hchip">🛡️ ' + fa(S.mil.defPct) + '٪</span>' +
      '<span class="wdcv-hchip">⚓ ' + fa(S.counts.ports) + '</span>' +
      '<span class="wdcv-hchip">✈️ ' + fa(S.counts.airports) + '</span>' +
      '<div class="wdcv-story"><small>مسیر پیشرفت: ' + story.name + (story.next ? ' → ' + story.next : ' (کامل)') + '</small>' +
      '<span class="wdcv-storybar"><i style="width:' + Math.round((story.cur / story.total) * 100) + '%\"></i></span></div>'
  }

  function provTitle(prov) {
    return (prov.type === 'capital' ? '⭐ پایتخت' : '🗺️ ' + (PROV_TYPE_FA[prov.type] || 'استان')) + ' — ' + terrainFa(prov.terrain) + (prov.coastal ? ' ساحلی' : '')
  }
  function openProvPanel(pi) {
    const u = ui(); if (!u) return
    const p = u.querySelector('#wdcv-panel'); p.innerHTML = ''
    const prov = S.provinces[pi]
    if (!prov) return
    const st = prov.stats || {}
    /* سرصفحه + چیپ‌های هویت */
    const head = el('div', 'wdcv-row')
    head.innerHTML = '<b>' + provTitle(prov) + '</b><span class="wdcv-chip">' + fa(prov.slots) + ' جایگاه</span>'
    p.append(head)
    /* V74: آمار هویتی استان — ۹ نوار سبک (بدون canvas اضافه) */
    const stats = [
      ['pop', '👥 جمعیت'], ['ind', '🏭 صنعت'], ['agri', '🌾 کشاورزی'], ['oil', '🛢 نفت'],
      ['en', '⚡ انرژی'], ['infra', '🛣 زیرساخت'], ['stab', '📈 ثبات'], ['def', '🛡 دفاع'], ['dev', '🏗 توسعه'],
    ]
    const sw = el('div', 'wdcv-stats')
    for (const [k, lbl] of stats) {
      const r = el('div', 'wdcv-stat')
      const v = Math.round(st[k] || 0)
      r.innerHTML = '<span class="k">' + lbl + '</span><span class="bar"><i style="width:' + v + '%"></i></span><span class="v">' + fa(v) + '</span>'
      sw.append(r)
    }
    p.append(sw)
    /* V74: تخصصی‌سازی استان (اقتصاد واقعی: ±۱۰٪ سروری) */
    const fr = el('div', 'wdcv-row wdcv-focusrow')
    const cur = S.focus[String(pi)] || ''
    fr.append(el('span', 'wdcv-sub', '🎯 تخصص استان:'))
    const fb = el('div', 'wdcv-focusbtns')
    const mkF = (key, label) => {
      const b = el('button', 'wdcv-focusbtn' + (cur === key ? ' on' : ''), label)
      b.addEventListener('click', () => tryFocus(pi, key))
      return b
    }
    fb.append(mkF('', '—'))
    Object.keys(S.focusCat || {}).forEach((k) => fb.append(mkF(k, (S.focusCat[k].icon || '') + (S.focusCat[k].fa || k))))
    fr.append(fb)
    p.append(fr)
    /* تولید زنده‌ی استان (از ساختمان‌های فعال + focus) */
    const pb = S.buildings.filter((b) => b.province === pi)
    if (pb.length) {
      const agg = { gold: 0, oil: 0, food: 0, rp: 0 }
      for (const b of pb) {
        if (b.status !== 'active') continue
        const def = catOf(b.type)
        if (!def) continue
        const pr = prodOf(def, b.level, b.province)
        agg.gold += pr.gold || 0; agg.oil += pr.oil || 0; agg.food += pr.food || 0; agg.rp += pr.rp || 0
      }
      const bits = []
      if (agg.gold) bits.push('💰 ' + fa(agg.gold) + '/دقیقه')
      if (agg.oil) bits.push('🛢️ ' + fa(agg.oil) + '/دقیقه')
      if (agg.food) bits.push('🌾 ' + fa(agg.food) + '/دقیقه')
      if (agg.rp) bits.push('🔬 ' + fa(Math.round(agg.rp * 10) / 10) + '/دقیقه')
      if (bits.length) p.append(el('div', 'wdcv-sub', '📊 تولید این استان: ' + bits.join(' · ')))
    }
    /* لیست ساختمان‌های استان (سبک — ردیف متنی) */
    if (pb.length) {
      const bl = el('div', 'wdcv-blist')
      for (const b of pb) {
        const def = catOf(b.type)
        if (!def) continue
        const row = el('button', 'wdcv-brow')
        row.innerHTML = '<span>' + def.icon + ' ' + def.fa + '</span><span>' + (b.status === 'active' ? 'سطح ' + fa(b.level) : '🏗 ' + fa(Math.max(0, Math.ceil((b.doneAt - S.nowMs) / 1000))) + 's') + '</span>'
        row.addEventListener('click', () => selectBuilding(b))
        bl.append(row)
      }
      p.append(bl)
    }
    p.append(el('div', 'wdcv-sub', 'برای ساخت، روی ＋ خالی بزن یا از منوی زیر انتخاب کن'))
    /* تب‌های دسته + گرید ساخت */
    const tabs = el('div', 'wdcv-tabs')
    const catFa = { all: 'همه', government: 'حکومتی', residential: 'مسکونی', industry: 'صنعتی', agriculture: 'کشاورزی', resources: 'منابع', energy: 'انرژی', port: 'بندری', airport: 'هوایی', military: 'نظامی', research: 'پژوهش', economy: 'مالی', infrastructure: 'زیرساخت' }
    ;['all', 'industry', 'military', 'energy', 'infrastructure'].forEach((c) => {
      const t = el('button', 'wdcv-tab' + (S.tabCat === c ? ' on' : ''), catFa[c] || c)
      t.addEventListener('click', () => { S.tabCat = c; openProvPanel(pi) })
      tabs.append(t)
    })
    p.append(tabs)
    const grid = el('div', 'wdcv-buildgrid')
    const allowed = S.cat.filter((d) => buildableIn(d, prov) && (S.tabCat === 'all' || d.cat === S.tabCat))
    if (!allowed.length) grid.append(el('div', 'wdcv-sub', S.tabCat === 'all' ? 'در این استان فعلاً ساخت‌وسازی ممکن نیست' : 'در این دسته ساختنی نیست — تب دیگری را انتخاب کن'))
    allowed.slice(0, 10).forEach((d) => {
      const card = el('button', 'wdcv-bcard')
      card.innerHTML = '<span class="ic">' + d.icon + '</span><span class="tx"><b>' + d.fa + '</b><small>💰' + fa(d.cost1.g) + (d.cost1.o ? ' 🛢️' + fa(d.cost1.o) : '') + (d.cost1.f ? ' 🌾' + fa(d.cost1.f) : '') + ' · ' + fa(d.time1) + 's</small></span>'
      card.addEventListener('click', () => tryBuild(d.id, pi))
      grid.append(card)
    })
    p.append(grid)
    p.append(techBtn())
  }
  async function tryFocus(pi, key) {
    try {
      const r = await rpc('cv_focus', { p_country: S.country, p_server: S.server, p_province: pi, p_focus: key })
      if (r && r.ok) {
        S.focus = r.focusAll || {}
        snd('focus')
        toast(key ? '🎯 تخصص استان: ' + ((S.focusCat[key] || {}).fa || key) : '🎯 تخصص استان برداشته شد')
      } else toast('❌ ثبت تخصص نشد')
    } catch (e) { toast('❌ ارتباط برقرار نشد') }
    openProvPanel(pi)
  }
  function terrainFa(t) { return { plains: 'دشت', hills: 'تپه‌زار', mountain: 'کوهستان', desert: 'کویر', tundra: 'تندرا' }[t] || t }
  function buildableIn(d, prov) {
    if (d.capitalOnly && prov.type !== 'capital') return false
    if (d.coastal && !prov.coastal) return false
    if (d.terrains[0] !== 'any' && !d.terrains.includes(prov.terrain)) return false
    const cntProv = S.buildings.filter((b) => b.province === prov.i && b.type === d.id).length
    const cntAll = S.buildings.filter((b) => b.type === d.id).length
    if (cntProv >= d.maxPerProvince || cntAll >= d.empireCap) return false
    return true
  }
  /* V74: پنل شهر — شهرها entity نمایشی‌اند روی همان اقتصاد واقعی استان (بدون سیستم موازی) */
  function openCityPanel(city, pi) {
    const u = ui(); if (!u) return
    const p = u.querySelector('#wdcv-panel'); p.innerHTML = ''
    S.sel.bld = null; S.sel.prov = pi; S.sel.slot = null
    const prov = S.provinces[pi]
    const head = el('div', 'wdcv-row')
    head.innerHTML = '<b>🏙️ ' + city.name + '</b><span class="wdcv-chip">👥 ' + fa(city.popK) + ' هزار نفر</span>'
    p.append(head)
    p.append(el('div', 'wdcv-sub', 'منطقه‌های شهری (بر اساس هویت شهر):'))
    const zones = { metro: ['🏛 فرمانداری', '🏠 مسکونی', '🏥 بیمارستان'], industrial: ['🏭 ناحیه صنعتی', '📦 انبار', '🏠 مسکونی'], agri: ['🌾 مزارع اطراف', '🏠 مسکونی', '📦 انبار غلا'], port: ['⚓ اسکله', '🏭 بسته‌بندی', '📦 انبار صادرات'], oil: ['🛢 تجهیزات استخراج', '🏭 پالایشگاه', '🏠 مسکونی'], military: ['🛡 پادگان', '📡 رادار', '🏠 مسکونی'], mountain: ['⛏ معادن', '🏠 مسکونی', '🛣 جاده کوهستانی'] }
    const zr = el('div', 'wdcv-chips')
    ;(zones[city.kind] || zones.metro).forEach((z) => zr.append(el('span', 'wdcv-chip', z)))
    p.append(zr)
    const bcount = S.buildings.filter((b) => b.province === pi).length
    p.append(el('div', 'wdcv-sub', 'این شهر در «' + provTitle(prov) + '» است — ' + fa(bcount) + ' ساختمان فعال در استان. ساختمان‌ها اقتصاد واقعی را می‌سازند.'))
    const row = el('div', 'wdcv-row')
    const b1 = el('button', 'wdcv-mini', '🗺️ مدیریت استان')
    b1.addEventListener('click', () => openProvPanel(pi))
    row.append(b1)
    p.append(row)
    p.append(techBtn())
  }
  function techBtn() {
    const b = el('button', 'wdcv-mini', '🔬 فناوری')
    b.addEventListener('click', openTech)
    return b
  }
  function openTech() {
    const u = ui(); if (!u) return
    const p = u.querySelector('#wdcv-panel'); p.innerHTML = ''
    p.append(el('div', 'wdcv-row', '<b>🔬 خطوط فناوری</b> — امتیاز پژوهش: ' + fa(Math.floor(S.rp))))
    Object.keys(S.techCat).forEach((k) => {
      const t = S.techCat[k]
      const lvl = (S.tech[k] || 0)
      const row = el('div', 'wdcv-row wdcv-techrow')
      row.innerHTML = '<span>' + t.icon + ' <b>' + t.fa + '</b> سطح ' + fa(lvl) + '/' + fa(t.max) + '<br><small>' + t.desc + '</small></span>'
      const btn = el('button', 'wdcv-mini', lvl >= t.max ? 'حداکثر' : 'ارتقا (' + fa(t.costs[lvl]) + '🔬)')
      btn.disabled = lvl >= t.max
      btn.addEventListener('click', async () => {
        btn.disabled = true
        try {
          const r = await rpc('cv_tech', { p_country: S.country, p_server: S.server, p_line: k })
          if (r && r.ok) { S.tech[k] = r.level; S.rp = r.rp; toast('🔬 ' + t.fa + ' به سطح ' + fa(r.level) + ' رسید') }
          else toast('❌ ' + (r && r.error === 'rp' ? 'امتیاز پژوهش کافی نیست' : 'امکان‌پذیر نیست'))
        } catch (e) { toast('❌ خطا در ارتقای فناوری') }
        openTech(); header()
      })
      row.append(btn); p.append(row)
    })
  }

  function selectBuilding(b) {
    S.sel.bld = b; S.sel.prov = b.province; S.sel.slot = b.slot
    const def = catOf(b.type)
    const u = ui(); if (!def || !u) return
    const p = u.querySelector('#wdcv-panel'); p.innerHTML = ''
    const active = b.status === 'active'
    const head = el('div', 'wdcv-row')
    head.innerHTML = '<b>' + def.icon + ' ' + def.fa + '</b><span class="wdcv-chip">سطح ' + fa(b.level) + (active ? '' : ' · 🏧 در حال ساخت') + '</span>'
    p.append(head)
    p.append(el('div', 'wdcv-sub', def.desc))
    if (active) {
      const prod = prodOf(def, b.level, b.province)
      const bits = []
      if (prod.gold) bits.push('💰 ' + fa(prod.gold) + '/دقیقه')
      if (prod.oil) bits.push('🛢️ ' + fa(prod.oil) + '/دقیقه')
      if (prod.food) bits.push('🌾 ' + fa(prod.food) + '/دقیقه')
      if (prod.rp) bits.push('🔬 ' + fa(prod.rp) + '/دقیقه')
      if (def.atkPct) bits.push('⚔️ +' + fa(def.atkPct * b.level) + '٪')
      if (def.defPct) bits.push('🛡️ ' + fa(def.defPct * b.level) + '٪')
      if (def.goldPct) bits.push('👑 +' + fa(def.goldPct * b.level) + '٪ طلا')
      if (def.oilCap) bits.push('📦 +' + fa(def.oilCap * b.level) + ' سقف نفت')
      p.append(el('div', 'wdcv-sub', bits.length ? bits.join(' · ') : 'بدون تولید مستقیم'))
      /* V74: نشان بونوس تخصص */
      const fk = S.focus[String(b.province)]
      const fd = fk ? S.focusCat[fk] : null
      if (fd && fd.ids && fd.ids.indexOf(def.id) >= 0) p.append(el('div', 'wdcv-sub', '🎯 بونوس تخصص «' + fd.fa + '» اعمال شده (×۱٫۱)'))
      if (b.level < S.maxLevel) {
        const nc = costOf(def, b.level + 1)
        const nt = timeOf(def, b.level + 1)
        const row = el('div', 'wdcv-row')
        row.append(el('span', 'wdcv-sub', 'ارتقا به سطح ' + fa(b.level + 1) + ': 💰' + fa(nc.g) + (nc.o ? ' 🛢️' + fa(nc.o) : '') + (nc.f ? ' 🌾' + fa(nc.f) : '') + ' — ' + fa(Math.round(nt)) + 'ثانیه'))
        const btn = el('button', 'wdcv-mini', '⬆️ ارتقا')
        btn.addEventListener('click', () => tryUpgrade(b, btn))
        row.append(btn); p.append(row)
      } else p.append(el('div', 'wdcv-sub', 'سطح حداکثری'))
    } else {
      const remain = Math.max(0, Math.ceil((b.doneAt - S.nowMs) / 1000))
      const total = Math.max(1, Math.ceil((b.doneAt - b.startedAt) / 1000))
      const prog = clamp(Math.round(100 * (1 - (b.doneAt - S.nowMs) / (total * 1000))), 0, 99)
      const stageFa = prog < 33 ? 'فونداسیون' : prog < 70 ? 'اسکلت‌سازی' : 'تجهیز و آماده‌سازی'
      p.append(el('div', 'wdcv-sub', '🏗 مرحله: ' + stageFa))
      p.append(el('div', 'wdcv-sub', '⏳ زمان باقی‌مانده: ' + fa(remain) + ' ثانیه (' + fa(prog) + '٪) — تا پایان، تولید ندارد'))
    }
    if (!active) {
      const cb = el('button', 'wdcv-mini wdcv-danger', '✖ لغو (۷۰٪ بازگشت)')
      cb.addEventListener('click', () => tryCancel(b, cb))
      p.append(cb)
    }
    p.append(techBtn())
  }
  function prodOf(def, lvl, provIdx) {
    const m = 1 + 0.06 * (S.tech.eco || 0)
    /* V74: بونوس تخصص استان (۱۰٪ — هم‌فرمول سرور) */
    const fkey = provIdx != null ? S.focus[String(provIdx)] : null
    const fdef = fkey ? S.focusCat[fkey] : null
    const fm = (fdef && fdef.ids && fdef.ids.indexOf(def.id) >= 0) ? 1 + 0.10 : 1
    const o = {}
    if (def.prod1.gold) o.gold = Math.round(def.prod1.gold * lvl * m * fm)
    if (def.prod1.oil) o.oil = Math.round(def.prod1.oil * lvl * m * fm)
    if (def.prod1.food) o.food = Math.round(def.prod1.food * lvl * m * fm)
    if (def.prod1.rp) o.rp = Math.round(def.prod1.rp * lvl * fm * 10) / 10
    return o
  }
  function costOf(def, lvl) {
    const m = Math.pow(1.6, lvl - 1)
    return { g: Math.round(def.cost1.g * m), o: Math.round(def.cost1.o * m), f: Math.round(def.cost1.f * m) }
  }
  function timeOf(def, lvl) {
    return Math.max(15, def.time1 * Math.pow(1.45, lvl - 1) * Math.max(0.7, 1 - 0.06 * (S.tech.log || 0)))
  }
  const rid = () => 'cv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9)

  /* ---------- کسر/افزودن خوش‌بینانه به بازی اصلی (V68) ----------
     §26/§28 دستور کار: هزینه همان لحظه از playerRes کم می‌شود تا سیو ۸ثانیه‌ای
     کسرِ سرور را برگشت نزند (باگ دفترچه‌ی دوگانه: سرور کم می‌کرد، کلاینت overwrite می‌کرد).
     سرور همچنان مرجع اعتبارسنجی است؛ در خطا/تکراری کل مبلغ برمی‌گردد.
     S.mirrored: بخشی از دلتای سرور که کلاینت خودش اعمال کرده — در merge دلتا حذف می‌شود. */
  function localApply(dg, dop, df) {
    const pr = gameRef('playerRes')
    if (!pr) return
    pr.gold = Math.max(0, Math.round((Number(pr.gold) || 0) + dg))
    pr.oil = Math.max(0, Math.round((Number(pr.oil) || 0) + dop))
    pr.food = Math.max(0, Math.round((Number(pr.food) || 0) + df))
    S.mirrored = S.mirrored || { gold: 0, oil: 0, food: 0 }
    S.mirrored.gold += dg; S.mirrored.oil += dop; S.mirrored.food += df
    const uu = gameRef('updateUI'); if (typeof uu === 'function') uu()
  }
  /* دلتای مثبت سرور (تولید CV و هر افزایش سمت سرور) → playerRes تا سیو ماندگارش کند */
  function mergeServerRes(resObj) {
    if (!resObj) return
    const prev = S.srvRes
    S.srvRes = { gold: Number(resObj.gold) || 0, oil: Number(resObj.oil) || 0, food: Number(resObj.food) || 0 }
    S.mirrored = S.mirrored || { gold: 0, oil: 0, food: 0 }
    const pr = gameRef('playerRes')
    if (!pr || !prev) return
    const dg = S.srvRes.gold - prev.gold - S.mirrored.gold
    const dop = S.srvRes.oil - prev.oil - S.mirrored.oil
    const df = S.srvRes.food - prev.food - S.mirrored.food
    S.mirrored = { gold: 0, oil: 0, food: 0 }
    if (dg > 0 || dop > 0 || df > 0) {
      if (dg > 0) pr.gold = Math.round((Number(pr.gold) || 0) + dg)
      if (dop > 0) pr.oil = Math.round((Number(pr.oil) || 0) + dop)
      if (df > 0) pr.food = Math.round((Number(pr.food) || 0) + df)
      const uu = gameRef('updateUI'); if (typeof uu === 'function') uu()
    }
  }

  async function tryBuild(type, provIdx) {
    const btnDef = S.cat.find((x) => x.id === type)
    if (!btnDef) return
    const prov = S.provinces[provIdx]
    const free = Array.from({ length: prov.slots }, (_, i) => i).find((s) => !S.buildings.some((b) => b.province === provIdx && b.slot === s))
    if (free === undefined) { toast('❌ جایگاه خالی نیست'); return }
    if (btnDef.req === 'power' && !S.buildings.some((b) => b.province === provIdx && b.type === 'power' && b.status === 'active')) { toast('❌ اول نیروگاه در همین استان بساز'); return }
    /* V68: کسر خوش‌بینانه — قبل از RPC؛ سرور همچنان funds را اعتبارسنجی می‌کند */
    const cost68 = costOf(btnDef, 1)
    localApply(-cost68.g, -cost68.o, -cost68.f)
    try {
      const r = await rpc('cv_build', { p_country: S.country, p_server: S.server, p_type: type, p_province: provIdx, p_slot: free, p_request_id: rid() })
      if (r && r.ok) {
        if (r.duplicate) { localApply(cost68.g, cost68.o, cost68.f); toast('ℹ️ این ساخت قبلاً ثبت شده بود') } /* سرور برای تکراری هزینه نگرفته */
        else {
          S.res = r.resNow || S.res
          S.srvRes = r.resNow ? { gold: Number(r.resNow.gold) || 0, oil: Number(r.resNow.oil) || 0, food: Number(r.resNow.food) || 0 } : S.srvRes
          const d = r.building.doneAt ? new Date(r.building.doneAt) : null
          S.buildings.push({ ...r.building, doneAt: d, startedAt: r.building.startedAt ? new Date(r.building.startedAt) : new Date() })
          spawnParticles(...slotPos(provIdx, free), 'gold')
          toast('🏗️ ' + btnDef.fa + ' شروع به ساخت شد')
        }
        refreshObjective(); header(); openProvPanel(provIdx)
      } else {
        localApply(cost68.g, cost68.o, cost68.f) /* برگشت کامل در هر خطا (funds/race/cap/…) */
        const msg = { funds: 'منابع کافی نیست', occupied: 'جایگاه اشباع است', capital_only: 'فقط در پایتخت', coastal: 'فقط استان ساحلی', terrain: 'زمین مناسب نیست', empire_cap: 'سقف امپراتوری پر است', prov_cap: 'سقف استان پر است', need_power: 'نیاز به نیروگاه در همین استان', not_owned: 'این کشور مال تو نیست', race: 'همزمانی — دوباره تلاش کن' }[r && r.error] || 'انجام نشد'
        toast('❌ ' + msg)
      }
    } catch (e) { localApply(cost68.g, cost68.o, cost68.f); toast('❌ ارتباط برقرار نشد') }
  }
  async function tryUpgrade(b, btn) {
    btn.disabled = true
    /* V68: کسر خوش‌بینانه هزینه‌ی ارتقا — هم‌فرمول سرور (costOf ≡ cvCost) */
    const def68 = S.cat.find((x) => x.id === b.type)
    const cost68 = def68 ? costOf(def68, b.level + 1) : { g: 0, o: 0, f: 0 }
    localApply(-cost68.g, -cost68.o, -cost68.f)
    try {
      const r = await rpc('cv_upgrade', { p_country: S.country, p_server: S.server, p_id: b.id, p_request_id: rid() })
      if (r && r.ok) {
        if (r.duplicate) { localApply(cost68.g, cost68.o, cost68.f); toast('ℹ️ همین ارتقا قبلاً ثبت شده بود') }
        else {
          S.res = r.resNow || S.res
          S.srvRes = r.resNow ? { gold: Number(r.resNow.gold) || 0, oil: Number(r.resNow.oil) || 0, food: Number(r.resNow.food) || 0 } : S.srvRes
          b.level = r.level; b.status = 'building'; b.startedAt = new Date(Date.now()); b.doneAt = new Date(Date.now() + (r.timeSec || 30) * 1000)
          toast('⬆️ ارتقا به سطح ' + fa(r.level) + ' شروع شد')
        }
        refreshObjective(); header(); selectBuilding(b)
      } else {
        localApply(cost68.g, cost68.o, cost68.f)
        const msg = { funds: 'منابع کافی نیست', busy: 'در حال ساخت است', max_level: 'حداکثر سطح', not_owned: 'مالک نیستی', race: 'همزمانی' }[r && r.error] || 'انجام نشد'
        toast('❌ ' + msg); btn.disabled = false
      }
    } catch (e) { localApply(cost68.g, cost68.o, cost68.f); toast('❌ ارتباط برقرار نشد'); btn.disabled = false }
  }
  async function tryCancel(b, btn) {
    btn.disabled = true
    try {
      const r = await rpc('cv_cancel', { p_country: S.country, p_server: S.server, p_id: b.id })
      if (r && r.ok) {
        S.res = r.resNow || S.res
        S.srvRes = r.resNow ? { gold: Number(r.resNow.gold) || 0, oil: Number(r.resNow.oil) || 0, food: Number(r.resNow.food) || 0 } : S.srvRes
        const rf68 = r.refund || { g: 0, o: 0, f: 0 }
        localApply(rf68.g, rf68.o, rf68.f) /* برگشت ۷۰٪ — هم‌جهت با کسر سرور */
        if (r.level === 0) S.buildings = S.buildings.filter((x) => x.id !== b.id)
        else { b.level = r.level; b.status = 'active'; b.doneAt = null }
        toast('↩️ لغو شد — ۷۰٪ هزینه برگشت')
        refreshObjective(); header(); closePanels()
      } else toast('❌ لغو نشد')
    } catch (e) { toast('❌ ارتباط برقرار نشد'); btn.disabled = false }
  }

  function toast(msg) {
    const u = ui(); if (!u) return
    const t = u.querySelector('#wdcv-toast')
    t.textContent = msg
    t.classList.add('on')
    clearTimeout(t._h)
    t._h = setTimeout(() => t.classList.remove('on'), 2600)
  }

  /* ---------- همگام‌سازی سرور ---------- */
  async function syncState(silent) {
    const st = document.getElementById('wdcv-loading')
    if (!silent && st) st.classList.add('on')
    try {
      const r = await rpc('cv_state', { p_country: S.country, p_server: S.server })
      if (!r || !r.ok) throw new Error('state')
      S.provinces = r.provinces || []
      S.buildings = (r.buildings || []).map((b) => ({ ...b, startedAt: b.startedAt ? new Date(b.startedAt) : new Date(), doneAt: b.doneAt ? new Date(b.doneAt) : null }))
      S.cat = r.cat || []
      S.techCat = r.techCat || {}
      S.tech = r.tech || {}
      S.focus = r.focus || {}          /* V74 */
      S.focusCat = r.focusCat || {}    /* V74 */
      S.seed = r.seed || 0             /* V74 */
      S.rp = r.rp || 0
      S.rates = r.rates || S.rates
      S.mil = r.mil || S.mil
      S.counts = r.counts || S.counts
      S.res = r.res || S.res
      if (!r.owned) { S._entryWhy = 'own' /* V80 §ENTRY: علت ورود ناموفق برای پنل شفاف */; if (!silent) toast('❌ این کشور در کنترل تو نیست'); return false } /* V74: layout پر شد — فقط اقدامات با مالکیت (سرور مرجع است) */
      /* V68 — §7/§28: دلتای مثبت سرور → playerRes (تولید CV دیگر گم نمی‌شود؛ سیو ۸ثانیه‌ای ماندگارش می‌کند) */
      mergeServerRes(r.res)
      if (typeof r.oilCapAdd === 'number') window.__wdcvOilCapAdd = r.oilCapAdd
      S.resAt = performance.now()
      S.maxLevel = r.maxLevel || 10
      S.offlineCapMs = r.offlineCapMs || 0
      S.nowMs = r.now || Date.now()
      applyMilitary()
      refreshObjective()
      header()
      return true
    } catch (e) {
      S._entryWhy = String(e.message).indexOf('401') >= 0 || String(e).indexOf('auth') >= 0 ? 'auth' : 'net' /* V80 §ENTRY */
      if (!silent) toast('❌ ' + (S._entryWhy === 'auth' ? 'برای ساخت‌وساز باید با حساب آنلاین وارد شوی' : 'همگام‌سازی نشد — اینترنت را چک کن'))
      return false
    } finally {
      if (st) setTimeout(() => st.classList.remove('on'), 150)
    }
  }
  /* پیش‌بینی نمایشی بین pollها (سرور مرجع است؛ فقط برای حس زنده بودن) */
  function projectRes(dtSec) {
    if (!S.rates) return
    S.res.gold += (S.rates.gold || 0) * dtSec / 60
    S.res.oil += (S.rates.oil || 0) * dtSec / 60
    S.res.food += (S.rates.food || 0) * dtSec / 60
  }

  /* ---------- هوک‌های نظامی (مقادیر سمت سرور — Idempotent) ---------- */
  let milHooked = false
  function applyMilitary() {
    if (milHooked) { header(); return }
    try {
      const cta = gameRef('calculateTotalAttack')
      if (typeof cta === 'function' && !window.__wdcvAtkHooked) {
        window.calculateTotalAttack = function () { return Math.round(cta() * (1 + (S.mil.atkPct || 0) / 100)) }
        window.__wdcvAtkHooked = true
      }
      const ab = gameRef('airBonus')
      if (typeof ab === 'function' && !window.__wdcvAirHooked) {
        window.airBonus = function () { return ab() + Math.min(0.12, 0.03 * (S.counts.airports || 0)) }
        window.__wdcvAirHooked = true
      }
      const om = gameRef('ovsMult')
      if (typeof om === 'function' && !window.__wdcvOvsHooked) {
        window.ovsMult = function () { return Math.min(0.97, om() + 0.02 * (S.counts.ports || 0)) }
        window.__wdcvOvsHooked = true
      }
      milHooked = true
    } catch (e) { /* هوک‌ها اختیاری‌اند — رندر و ساخت مستقل کار می‌کنند */ }
  }

  /* ---------- ورود / خروج ---------- */
  function ensureDom() {
    if (document.getElementById('wdcv-stage')) return
    const st = document.createElement('div')
    st.id = 'wdcv-stage'
    st.innerHTML =
      '<canvas id="wdcv-canvas"></canvas>' +
      '<div id="wdcv-ui">' +
      '<div id="wdcv-top"><button id="wdcv-exit">🌍 بازگشت به نقشه</button><button id="wdcv-hbtn" title="جزئیات">⋯</button><button id="wdcv-snd" title="صدا">🔊</button><b id="wdcv-hname"></b><div id="wdcv-hres" class="wdcv-line"></div><div id="wdcv-obj" class="wdcv-line" style="display:none"></div><div id="wdcv-hmil" class="wdcv-line"></div></div>' +
      '<div id="wdcv-goals"></div>' +
      '<div id="wdcv-panel"></div>' +
      '<div id="wdcv-toast"></div>' +
      '<div id="wdcv-loading">📡 در حال ورود به کشور…</div>' +
      '</div>'
    document.body.appendChild(st)
    const css = document.createElement('style')
    css.id = 'wdcv-css'
    css.textContent =
      '#wdcv-stage{position:fixed;inset:0;z-index:12000;display:none;background:#082238;font-family:Vazirmatn,Tahoma,sans-serif}' +
      '#wdcv-stage.on{display:block}' +
      '#wdcv-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}' +
      '#wdcv-ui{position:absolute;inset:0;pointer-events:none;color:#eaf6ff}' +
      '#wdcv-top{position:absolute;top:0;left:0;right:0;padding:10px 12px;background:linear-gradient(180deg,rgba(4,14,26,.92),rgba(4,14,26,0));pointer-events:auto;transform:translateY(-8px);opacity:0;transition:transform .35s ease,opacity .35s ease}' +
      '#wdcv-stage.on #wdcv-top{transform:translateY(0);opacity:1}' +
      '#wdcv-line{font-size:12px;opacity:.95;text-shadow:0 1px 4px rgba(0,0,0,.6)}' +
      '#wdcv-exit{position:relative;float:left;background:rgba(0,240,255,.14);border:1px solid rgba(0,240,255,.5);color:#bff;border-radius:10px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer}' +
      '#wdcv-snd{position:relative;float:left;margin-left:6px;background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.35);color:#bff;border-radius:10px;padding:7px 9px;font-size:13px;cursor:pointer}' +
      '#wdcv-panel{position:absolute;bottom:12px;left:10px;right:10px;background:rgba(6,22,42,.94);border:1px solid rgba(0,240,255,.35);border-radius:14px;padding:10px;pointer-events:auto;max-height:46vh;overflow-y:auto;display:none;transform:translateY(10px);opacity:0;transition:transform .18s ease,opacity .18s ease}' +
      '#wdcv-panel:not(:empty){display:block;transform:translateY(0);opacity:1}' +
      '.wdcv-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;font-size:13px}' +
      '.wdcv-sub{font-size:11.5px;opacity:.85;padding:2px 0}' +
      '.wdcv-chip{display:inline-block;background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.3);border-radius:99px;padding:2px 8px;font-size:10.5px;white-space:nowrap}' +
      '.wdcv-hchip{display:inline-block;background:rgba(13,19,28,.88);border:1px solid rgba(255,255,255,.14);border-radius:99px;padding:3px 9px;font-size:12px;margin:2px 3px 0 0;white-space:nowrap}' +
      '.wdcv-hchip small{opacity:.9;font-size:10px;margin-right:4px}' +
      '.wdcv-hchip small.up{color:#6fe08a}' +
      '.wdcv-hchip small.dn{color:#ff9d8a}' +
      '#wdcv-hname{font-size:17px;font-weight:800;display:flex;align-items:center;gap:6px;margin-bottom:3px;text-shadow:0 1px 6px rgba(0,0,0,.6)}' +
      '#wdcv-hname small{font-size:10.5px;font-weight:600;opacity:.9;color:#ffe9a8}' +
      'img.wdcv-flag{width:21px;height:15px;object-fit:cover;border-radius:2.5px;box-shadow:0 0 0 1px rgba(255,255,255,.3);flex:0 0 auto}' +
      '#wdcv-goals{position:absolute;bottom:12px;left:10px;background:rgba(13,19,28,.88);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:7px 10px;pointer-events:auto;max-width:64vw;min-width:150px;z-index:2}' +
      '#wdcv-goals:empty{display:none}' +
      '.wdcv-goalhd{font-size:11px;font-weight:800;color:#ffe9a8;margin-bottom:3px}' +
      '.wdcv-goal{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2.5px 0;font-size:11px;cursor:pointer}' +
      '.wdcv-goal b{color:#ffd84d;font-weight:800;flex:0 0 auto}' +
      '#wdcv-obj{display:inline-block;margin-top:5px;background:rgba(255,216,77,.12);border:1px solid rgba(255,216,77,.45);color:#ffe9a8;border-radius:10px;padding:5px 10px;font-size:12px;cursor:pointer}' +
      '#wdcv-hbtn{position:relative;float:left;margin-left:6px;background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.35);color:#bff;border-radius:10px;padding:7px 9px;font-size:13px;cursor:pointer}' +
      '#wdcv-hmil{display:none;flex-wrap:wrap;align-items:center;margin-top:4px}' +
      '#wdcv-hmil.open{display:flex}' +
      '.wdcv-story{flex:1 1 100%;margin-top:4px}' +
      '.wdcv-story small{opacity:.8;font-size:10.5px}' +
      '.wdcv-storybar{display:block;height:4px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;margin-top:2px}' +
      '.wdcv-storybar i{display:block;height:100%;background:linear-gradient(90deg,#ffd84d,#ff9d3c)}' +
      '.wdcv-chips{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0}' +
      '.wdcv-stats{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;margin:4px 0 6px}' +
      '.wdcv-stat{display:flex;align-items:center;gap:6px;font-size:10.5px;padding:1.5px 0}' +
      '.wdcv-stat .k{flex:0 0 auto;opacity:.85;min-width:74px}' +
      '.wdcv-stat .bar{flex:1 1 auto;height:5px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden}' +
      '.wdcv-stat .bar i{display:block;height:100%;background:linear-gradient(90deg,#00c8ff,#00ff88);border-radius:99px}' +
      '.wdcv-stat .v{flex:0 0 26px;text-align:left;font-weight:700;opacity:.9}' +
      '.wdcv-focusbtns{display:flex;flex-wrap:wrap;gap:4px}' +
      '.wdcv-focusbtn{background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.3);color:#cff;border-radius:99px;padding:4px 9px;font-size:11px;cursor:pointer}' +
      '.wdcv-focusbtn.on{background:rgba(255,216,77,.2);border-color:#ffd84d;color:#ffe9a8}' +
      '.wdcv-tabs{display:flex;gap:5px;margin:6px 0;overflow-x:auto}' +
      '.wdcv-tab{flex:0 0 auto;background:rgba(0,240,255,.07);border:1px solid rgba(0,240,255,.25);color:#cff;border-radius:9px;padding:4px 10px;font-size:11px;cursor:pointer}' +
      '.wdcv-tab.on{background:rgba(0,240,255,.2);border-color:rgba(0,240,255,.6)}' +
      '.wdcv-blist{display:flex;flex-direction:column;gap:4px;margin:4px 0}' +
      '.wdcv-brow{display:flex;align-items:center;justify-content:space-between;background:rgba(0,240,255,.05);border:1px solid rgba(0,240,255,.18);border-radius:9px;padding:6px 9px;color:#eaf6ff;font-size:12px;cursor:pointer;text-align:right}' +
      '.wdcv-bcard{display:flex;align-items:center;gap:8px;background:rgba(0,240,255,.07);border:1px solid rgba(0,240,255,.3);border-radius:10px;padding:7px;color:#eaf6ff;cursor:pointer;min-height:44px;text-align:right}' +
      '.wdcv-bcard:active,.wdcv-mini:active,.wdcv-brow:active,.wdcv-focusbtn:active,.wdcv-tab:active{transform:scale(.97)}' +
      '.wdcv-bcard .ic{font-size:20px}.wdcv-bcard .tx{display:flex;flex-direction:column;align-items:flex-start}.wdcv-bcard small{opacity:.75;font-size:10.5px}' +
      '.wdcv-mini{background:rgba(0,240,255,.14);border:1px solid rgba(0,240,255,.45);color:#cff;border-radius:9px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer;min-height:40px}' +
      '.wdcv-mini:disabled{opacity:.45;cursor:default}' +
      '.wdcv-danger{background:rgba(255,80,80,.12);border-color:rgba(255,90,90,.5);color:#fcc}' +
      '#wdcv-toast{position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:12.5px;opacity:0;transition:opacity .2s;pointer-events:none}' +
      '#wdcv-toast.on{opacity:1}' +
      /* V80 §ENTRY: کارت ورود ناموفق — پیام شفاف به‌جای بستنِ بی‌صدا */
      '#wdcv-errcard{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(4,12,24,.86);pointer-events:auto;text-align:center;padding:28px;z-index:6}' +
      '#wdcv-errcard.on{display:flex}' +
      '#wdcv-errcard .wdcv-erric{font-size:36px}' +
      '#wdcv-errcard b{font-size:16px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.6)}' +
      '#wdcv-errcard p{font-size:12.5px;opacity:.85;max-width:280px;line-height:1.9;margin:0}' +
      '#wdcv-errcard button{min-width:180px;min-height:46px;border-radius:11px;border:1px solid rgba(0,240,255,.5);background:rgba(0,240,255,.14);color:#cff;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '#wdcv-errcard button:active{transform:scale(.97)}' +
      '#wdcv-errcard .wdcv-errback{border-color:rgba(255,120,90,.5);background:rgba(255,90,70,.12);color:#fcc}' +
      '#wdcv-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(4,14,26,.6);font-size:14px;pointer-events:none;transition:opacity .3s}' +
      '#wdcv-loading.on{display:flex}' +
      '@media (max-width:480px){.wdcv-stats{grid-template-columns:1fr}#wdcv-hname{font-size:15px}.wdcv-hchip{font-size:11px;padding:2px 6px}#wdcv-obj{font-size:11px;padding:4px 8px}#wdcv-goals{max-width:70vw;font-size:10.5px}}'
    document.head.appendChild(css)
    st.querySelector('#wdcv-exit').addEventListener('click', () => close())
    const sndBtn = st.querySelector('#wdcv-snd')
    try { S.sndOn = localStorage.getItem('wdcv_snd') !== '0' } catch (e) {}
    const paintSnd = () => { sndBtn.textContent = S.sndOn ? '🔊' : '🔇' }
    paintSnd()
    sndBtn.addEventListener('click', () => {
      S.sndOn = !S.sndOn
      try { localStorage.setItem('wdcv_snd', S.sndOn ? '1' : '0') } catch (e) {}
      paintSnd()
      if (S.sndOn) snd('tap')
    })
    /* V76 §13: جزئیات بازشو + هدف قابل‌لمس */
    const hbtn = st.querySelector('#wdcv-hbtn')
    const hmil = st.querySelector('#wdcv-hmil')
    hbtn.addEventListener('click', () => {
      const opened = hmil.classList.toggle('open')
      hbtn.textContent = opened ? '✕' : '⋯'
      snd('tap')
    })
    const objEl = st.querySelector('#wdcv-obj')
    objEl.addEventListener('click', () => {
      const pi = objEl._prov
      if (pi != null && pi >= 0 && S.provinces[pi]) { S.sel.prov = pi; S.sel.bld = null; S.sel.slot = null; openProvPanel(pi); snd('tap') }
    })
    /* V79: لمس ردیف هدف در باکس پایین-چپ → پنل استان هدف (delegation — یک لیسنر) */
    const goalsEl = st.querySelector('#wdcv-goals')
    if (goalsEl) goalsEl.addEventListener('click', (e) => {
      const row = e.target.closest && e.target.closest('.wdcv-goal')
      if (!row) return
      const pi = parseInt(row.dataset.prov, 10)
      if (!isNaN(pi) && pi >= 0 && S.provinces[pi]) { S.sel.prov = pi; S.sel.bld = null; S.sel.slot = null; openProvPanel(pi); snd('tap') }
    })
  }

  let savedMapInteractions = null
  function pauseMap() {
    try {
      const m = gameRef('map')
      if (m && m.dragging) {
        savedMapInteractions = {
          dragging: m.dragging.enabled(), scroll: m.scrollWheelZoom && m.scrollWheelZoom.enabled(),
          dbl: m.doubleClickZoom && m.doubleClickZoom.enabled(), touch: m.touchZoom && m.touchZoom.enabled(),
          box: m.boxZoom && m.boxZoom.enabled(), kb: m.keyboard && m.keyboard.enabled(),
        }
        m.dragging.disable(); m.scrollWheelZoom && m.scrollWheelZoom.disable()
        m.doubleClickZoom && m.doubleClickZoom.disable(); m.touchZoom && m.touchZoom.disable()
        m.boxZoom && m.boxZoom.disable(); m.keyboard && m.keyboard.disable()
      }
      try { document.getElementById('country-drawer') && document.getElementById('country-drawer').classList.remove('open') } catch (e) {}
    } catch (e) {}
  }
  function resumeMap() {
    try {
      const m = gameRef('map')
      if (m && savedMapInteractions) {
        savedMapInteractions.dragging && m.dragging.enable()
        savedMapInteractions.scroll && m.scrollWheelZoom && m.scrollWheelZoom.enable()
        savedMapInteractions.dbl && m.doubleClickZoom && m.doubleClickZoom.enable()
        savedMapInteractions.touch && m.touchZoom && m.touchZoom.enable()
        savedMapInteractions.box && m.boxZoom && m.boxZoom.enable()
        savedMapInteractions.kb && m.keyboard && m.keyboard.enable()
        savedMapInteractions = null
      }
    } catch (e) {}
  }

  /* V80 §ENTRY: پنلِ شفافِ «ورود ناموفق» — به‌جای بستنِ بی‌صدا. علت + تلاش مجدد + بازگشت به نقشه.
     «تلاش مجدد» مسیر رسمی خود بازی (syncTerr → cv_state) را از نو اجرا می‌کند؛ هیچ دور زدنی در کار نیست. */
  function entryFail(country, detail) {
    const u = document.getElementById('wdcv-ui')
    const ldg = document.getElementById('wdcv-loading')
    if (ldg) ldg.classList.remove('on')
    let card = document.getElementById('wdcv-errcard')
    if (!card && u) { card = document.createElement('div'); card.id = 'wdcv-errcard'; u.appendChild(card) }
    if (!card) { close(); return }
    card.innerHTML =
      '<div class="wdcv-erric">🚫</div>' +
      '<b>ورود به ' + (S.countryFa || country) + ' انجام نشد</b>' +
      '<p>' + (detail || 'همگام‌سازی با سرور ناموفق بود.') + '</p>' +
      '<button id="wdcv-errretry">🔄 تلاش مجدد</button>' +
      '<button id="wdcv-errback" class="wdcv-errback">🌍 بازگشت به نقشه</button>'
    card.classList.add('on')
    const rt = card.querySelector('#wdcv-errretry')
    const bk = card.querySelector('#wdcv-errback')
    if (rt) rt.addEventListener('click', function () {
      card.classList.remove('on')
      close()
      setTimeout(function () { try { open(country, {}) } catch (e) {} }, 350)
    })
    if (bk) bk.addEventListener('click', function () { card.classList.remove('on'); close() })
  }

  async function open(country, opts) {
    if (S.active) return
    ensureDom()
    /* V80 §ENTRY: کشوی کشور نقشه بسته شود — هم تداخل z-index با کارت خطا نداشته باشد هم تمیزتر است */
    try { const cd = document.getElementById('country-drawer'); if (cd) cd.classList.remove('open') } catch (e) {}
    /* V75: اگر کانتکست صدا از خروج قبلی suspend مانده، همین اول زنده شود */
    try { if (AC && AC.state === 'suspended') AC.resume() } catch (e) {}
    const st = document.getElementById('wdcv-stage')
    st.classList.add('on')
    S.active = true
    S.country = country
    S.server = (typeof SRV !== 'undefined' && SRV) || window.SRV || 1
    S.countryFa = null
    try {
      const fn = gameRef('faName')
      const fad = gameRef('FA')
      const gcd = gameRef('getCountryData')
      S.countryFa = (fn && fn(country)) || (fad && fad[String(country).toLowerCase()]) || (gcd && (gcd(country) || {}).fa) || country
    } catch (e) {}
    S.sel = { prov: -1, bld: null, slot: null }
    S.srvRes = null /* V68: مبناي دلتای منابع سرور — هر سشن از نو */
    S.mirrored = { gold: 0, oil: 0, food: 0 }
    S.tabCat = 'all'
    S.obj = null; S._lm = null; S._hdrCache = ''
    S.acc = 0; S.hdrT = 0; S._ambT = 0
    AMB.length = 0; S.ambPaths = null
    const force = !!(opts && opts.force) /* فقط برای QA — سرور همچنان هر اقدامی را اعتبارسنجی می‌کند */
    /* V74 — WOW ENTRY (بند ۳): فاز ۱ = نمای کلان کشور با تپش مرز، فاز ۲ = شیرجه‌ی نرم دوربین */
    const ldg = document.getElementById('wdcv-loading')
    if (ldg) ldg.classList.add('on')
    if (!(await buildGeometryAsync(country))) toast('⚠️ هندسه‌ی کشور یافت نشد — از سرور ادامه می‌دهیم')
    let ok = await syncState(false)
    if (!ok && !force) {
      /* V80 §ENTRY-FIX (باگ «اصلا بالا نمیاد»): قبلاً اینجا close() بی‌صدای بود.
         حالا: تا ۲ بار syncTerr بازی را صدا می‌زنیم (بوت‌استرپ مالکیت از اثباتِ سیو — همان مسیر رسمی خود بازی)
         و cv_state را دوباره می‌پرسیم؛ اگر syncBusy بود، به سینکِ در-جریان هم فرصت می‌دهیم.
         اگر باز هم نشد، پنلِ شفافِ «ورود ناموفق» با علت + تلاش مجدد. */
      for (let att = 0; att < 2 && !ok; att++) {
        try {
          if (att > 0) await new Promise((r) => setTimeout(r, 1100)) /* فرصت برای syncTerr در-جریان */
          const st2 = gameRef('syncTerr')
          if (typeof st2 === 'function') await Promise.race([st2(), new Promise((r) => setTimeout(r, 4500))])
          ok = await syncState(true) /* بی‌توست — پیام در کارت خطا می‌آید */
        } catch (e) {}
      }
    }
    if (!ok && !force) {
      entryFail(country, S._entryWhy === 'own'
        ? 'مالکیت این کشور روی سرور تأیید نشد — ممکن است کشور دیگری انتخاب کرده باشی یا این سرور کشور دیگری برایت ثبت کرده باشد. از نقشه، کشورت را دوباره انتخاب کن.'
        : S._entryWhy === 'auth'
          ? 'برای ورود به کشور باید با حساب آنلاین وارد شوی.'
          : 'همگام‌سازی با سرور ناموفق بود — اتصال اینترنت را بررسی کن و دوباره تلاش کن.')
      return
    }
    setupCanvas()
    buildCells()
    const c = computeView(); view.base = { cx: c.cx, cy: c.cy }
    /* V77 §22: FIT COUNTRY — کشور ~۶۵–۷۵٪ فضای مفید را بگیرد؛ نه ریز، نه بیرون‌زده.
       شیرجه‌ی نرم از نمای کلان (0.55) به زوم fit + pan محدود سمت پایتخت (تا وقتی کشور کامل در قاب بماند) */
    const capE = S.cells[0]
    const bbo = S.bbox || { minX: 0, minY: 0, maxX: 1, maxY: 1 } /* گارد: کشور بدون هندسه */
    const exW2 = (bbo.maxX - bbo.minX) * view.scale * kmPerLon() / 2
    const exH2 = (bbo.maxY - bbo.minY) * view.scale * 111.32 / 2
    const fitZ = clamp(Math.min(cv.clientWidth * 0.41 / Math.max(1, exW2), cv.clientHeight * 0.41 / Math.max(1, exH2)), 0.8, 1.5)
    let etx = 0, ety = 0
    if (capE) {
      const mW = Math.max(0, cv.clientWidth / (2 * fitZ) - exW2), mH = Math.max(0, cv.clientHeight / (2 * fitZ) - exH2)
      etx = clamp((capE.cx - view.base.cx) * view.scale * kmPerLon() * 0.35, -mW * 0.7, mW * 0.7)
      ety = clamp(-(capE.cy - view.base.cy) * view.scale * 111.32 * 0.35, -mH * 0.7, mH * 0.7)
      /* V81: هدفِ dive داخل محدوده‌ی کلمپِ جدید — وگرنه انیمیشن هرگز پایان نمی‌یافت */
      const ov = 0.12 * Math.min(cv.clientWidth, cv.clientHeight) / fitZ
      const lX = Math.max(exW2 - cv.clientWidth / (2 * fitZ), 0) + ov
      const lY = Math.max(exH2 - cv.clientHeight / (2 * fitZ), 0) + ov
      etx = clamp(etx, -lX, lX); ety = clamp(ety, -lY, lY)
    }
    S.cam.x = 0; S.cam.y = 0; S.cam.z = 0.55
    S.cam.tx = etx; S.cam.ty = ety; S.cam.tz = fitZ; S.cam.anim = true
    S.enter = { t0: Date.now(), done: false, ms: S.tier === 'low' ? 700 : 1200 }
    S.doneIds = null
    S.nowMs = Date.now()
    bindInput()
    pauseMap()
    startLoop()
    try { if (window.WD_BACK) { if (WD_BACK.stack.indexOf('#wdcv-stage') < 0) WD_BACK.stack.push('#wdcv-stage'); if (typeof wdBackSync === 'function') wdBackSync() } } catch (e) {} /* V74: Back گوشی */
    snd('enter')
    if (!(S.buildings || []).length) toast('👆 برای شروع روی استان‌ها بزن — از پنل، اولین ساختمانت را بساز') /* V76 §12 */
    /* V74 — بارگذاری تدریجی (بند ۲۸): پوسته کشور ← استان‌ها ← شهرها ← جزئیات */
    if (ldg) ldg.textContent = '📡 هویت استان‌ها و شهرها…'
    setTimeout(() => { if (S.active) { S.ambPaths = ambPathPool(); if (ldg) ldg.textContent = '📡 جزئیات محیط…' } }, 350)
    setTimeout(() => { if (ldg) ldg.classList.remove('on') }, 800)
    S.lastPoll = performance.now()
    clearInterval(S.pollTimer)
    S.pollTimer = setInterval(() => { if (S.active && !document.hidden) syncState(true) }, 12000)
    document.addEventListener('visibilitychange', onVis)
  }

  function onVis() {
    if (!S.active) return
    if (!document.hidden) syncState(true)
  }

  async function close() {
    if (!S.active) return
    S.active = false
    snd('exit')
    clearInterval(S.pollTimer); S.pollTimer = null
    document.removeEventListener('visibilitychange', onVis)
    unbindWin()
    S.obj = null; S._lm = null
    const st = document.getElementById('wdcv-stage')
    if (st) st.classList.remove('on')
    const ec = document.getElementById('wdcv-errcard')
    if (ec) ec.classList.remove('on') /* V80 §ENTRY: کارت خطا هم بسته شود */
    closePanels()
    /* V74 — پاکسازی کامل حافظه (بند ۲۴): poolها، مسیرها، صدا، enter */
    AMB.length = 0; S.ambPaths = null
    for (const r of RIPS) r.on = false
    for (const p of pool) p.on = false
    S.enter = null; S.doneIds = null; S.acc = 0; S.hdrT = 0
    S.hover = -1; S._rail = null; S._idleN = 0; S._tierCd = 0; S._fast = 0; S._lselKey = ''; S._lcx = null; S._lcy = null; S._lcz = null /* V77 */
    S._lbl = null; S._rn = null; S._ambDrawn = 0 /* V78: cache لیبل/شبکه‌ی جاده هم باید پاک شود */
    S._hdrCache = ''; S._lwave = -1 /* V79: کش هدر و فاز موج برای open بعدی */
    S._bakeS = 0; S._seaY0 = null; S._ring2W = null /* V81: وضعیت bake جهان-مُدار پاک شود */
    try { if (AC && AC.state === 'running') AC.suspend() } catch (e) {}
    try { if (window.WD_BACK) { const ix = WD_BACK.stack.indexOf('#wdcv-stage'); if (ix > -1) WD_BACK.stack.splice(ix, 1); if (typeof wdBackSync === 'function') wdBackSync() } } catch (e) {}
    resumeMap()
    /* همگام‌سازی نهایی: دلتای سرور → بازی اصلی (V68 — به‌جای جایگزینی مطلق که
       درآمد کلاینتیِ ۸ ثانیه‌ی آخر را rollback می‌کرد) */
    try {
      const r = await rpc('cv_state', { p_country: S.country, p_server: S.server })
      if (r && r.ok && r.res) mergeServerRes(r.res)
    } catch (e) {}
  }

  /* V74: تیک ۱ثانیه‌ای به داخل rAF loop منتقل شد (بند ۲۰ دستور — یک loop) —
     فقط افشای QA برای تست خودکار بدون مالکیت */
  window.WDCV._qaOpen = function (c) { return open(c, { force: true }) }
})()
