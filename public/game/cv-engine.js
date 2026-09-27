/* ============================================================
   WORLD DOMINION — V74 COUNTRY VIEW ENGINE (client) — AAA UPGRADE
   cv-engine.js — با lazy-load فقط هنگام اولین «ورود به کشور» لود می‌شود.
   معماری: Data-Driven + Performance-First
   - تک rAF loop (Simulation و Render جدا) — تیک ۱ثانیه‌ای هم داخل همان loop
   - همه‌ی وضعیت گیم‌پلی از سرور (cv_state) — کلاینت فقط رندر/ورودی
   - Voronoi قطعی روی پلی‌گان واقعی کشور (از همان GeoJSON نقشه‌ی جهانی)
   - LOD چهار سطحی (کشور←استان←شهر←جزئیات) + Culling + Pooling + Tier
   - هویت کشور: آمار/شهرهای سرور-تولید، zones منبع، جاده، چراغ شهر، محیط زنده
   - صدا: سینت WebAudio سبک (بدون فایل/شبکه، بعد از اولین تعامل)
   - حداکثر ~۴۰ نود DOM (پنل‌ها) — هیچ DOM-Element-per-building
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
    } } catch (e) {}
    return null
  }
  window.WDCV = { S, open, close, rpc, version: 74, openProvPanel, selectBuilding, openCityPanel, openTech }

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
  const TIER = {
    low:  { particles: 0,  deco: 0, shadows: false, maxDpr: 1,   ambient: 0,  lights: 0,  smoke: 0, roads: 0 },
    med:  { particles: 8,  deco: 1, shadows: false, maxDpr: 1.5, ambient: 8,  lights: 26, smoke: 2, roads: 1 },
    high: { particles: 18, deco: 2, shadows: true,  maxDpr: 2,   ambient: 16, lights: 56, smoke: 4, roads: 1 },
  }
  S.tier = detectTier()
  function tierCfg() { return TIER[S.tier] || TIER.med }
  function degradeTier() {
    if (S.tier === 'high') S.tier = 'med'
    else if (S.tier === 'med') S.tier = 'low'
    else return
    try { localStorage.setItem('wdcv_tier', S.tier) } catch (e) {}
    S.dirtyStatic = true
  }

  /* ---------- ابزار ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const lerp = (a, b, t) => a + (b - a) * t
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
  function fa(n) { try { return Number(n).toLocaleString('fa-IR') } catch (e) { return String(n) } }

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
  function clipHalf(poly, a, b) { /* نگه‌داشتن سمتِ نقطه‌ی a از خط عمودمنصف ab */
    const out = []
    const side = (p) => ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]))
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
    let poly = ring
    for (let j = 0; j < seeds.length; j++) {
      if (j === seedIdx) continue
      poly = clipHalf(poly, seeds[seedIdx], seeds[j])
      if (poly.length < 3) break
    }
    return poly
  }

  /* ---------- رنگ زمین‌شناسی ---------- */
  const TERRAIN = {
    plains: { fill: '#5d8a4a', alt: '#67944f' },
    hills: { fill: '#7a8a4a', alt: '#839455' },
    mountain: { fill: '#8d8d95', alt: '#97979f' },
    desert: { fill: '#c9a95e', alt: '#d2b268' },
    tundra: { fill: '#9db2b8', alt: '#a7bcbf' },
  }
  const PROV_TYPE_FA = { capital: 'پایتخت', industrial: 'صنعتی', agricultural: 'کشاورزی', resource: 'منبع‌خیز', generic: 'عمومی' }

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

  /* ---------- لایه‌ی استاتیک (زمین + استان‌ها) — bake بر حسب zoom-bucket ---------- */
  let staticBucket = 0
  function zoomBucket() { return clamp(Math.round(S.cam.z * 2) / 2, 0.5, 4) }
  function bakeStatic() {
    const g = staticCtx
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, cv.clientWidth, cv.clientHeight)
    /* دریای اطراف */
    const grd = g.createLinearGradient(0, 0, 0, cv.clientHeight)
    grd.addColorStop(0, '#0a2a44'); grd.addColorStop(1, '#082238')
    g.fillStyle = grd; g.fillRect(0, 0, cv.clientWidth, cv.clientHeight)
    /* هاله‌ی ساحل */
    const ring = S.ring.map((p) => project(p[0], p[1]))
    g.lineJoin = 'round'
    g.strokeStyle = 'rgba(120,200,255,.18)'
    g.lineWidth = 10 * S.cam.z
    pathRing(g, ring); g.stroke()
    g.strokeStyle = 'rgba(150,220,255,.35)'
    g.lineWidth = 2
    g.fillStyle = '#123a52'
    pathRing(g, ring); g.fill(); g.stroke()
    /* سلول‌های استان + ترِین */
    const z = S.cam.z
    S.cells.forEach((c, i) => {
      if (!c.poly) return
      const t = TERRAIN[c.prov.terrain] || TERRAIN.plains
      const poly = c.poly.map((p) => project(p[0], p[1]))
      g.beginPath(); pathRing(g, poly)
      g.fillStyle = (i % 2 ? t.fill : t.alt)
      g.globalAlpha = 0.94; g.fill(); g.globalAlpha = 1
      g.strokeStyle = 'rgba(20,26,34,.55)'; g.lineWidth = 1.2; g.stroke()
      /* بافت سبک: لکه‌های ثابت (فقط MED/HIGH و زوم بالا) */
      if (tierCfg().deco > 0 && z >= 1.2) {
        g.fillStyle = 'rgba(0,0,0,.08)'
        const n = Math.min(40, Math.round(c.poly.length * (tierCfg().deco)))
        for (let k = 0; k < n; k++) {
          const v = c.poly[(k * 7) % c.poly.length]
          const w2 = c.poly[(k * 7 + 3) % c.poly.length]
          const px = lerp(v[0], w2[0], 0.5), py = lerp(v[1], w2[1], 0.5)
          g.fillRect(px, py, 3 * z, 2 * z)
        }
        if (c.prov.terrain === 'mountain' && z >= 1.6) {
          g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.5
          g.beginPath(); const v = c.poly[0]
          g.moveTo(v[0] - 6 * z, v[1] + 4 * z); g.lineTo(v[0], v[1] - 5 * z); g.lineTo(v[0] + 6 * z, v[1] + 4 * z); g.stroke()
        }
      }
    })
    /* ---- V74: zones هویتی منابع (LOD: از زوم متوسط، bake یک‌بار در هر bucket) ---- */
    if (z >= 1.1) {
      S.cells.forEach((c, ci) => {
        if (!c.poly) return
        const prov = c.prov
        const px = project(c.cx, c.cy)
        const det = Math.min(1, (z - 1.1) / 0.9) /* شفافیت تدریجی */
        /* نفت‌خیز: دکل‌های ریز قطعی */
        if (prov.type === 'resource' || prov.terrain === 'desert') {
          const n = prov.type === 'resource' ? 7 : 4
          g.fillStyle = 'rgba(30,34,40,' + (0.5 * det) + ')'
          for (let k = 0; k < n; k++) {
            const h = (ci * 31 + k * 17)
            const ox = Math.cos(h) * 16 * z, oy = Math.sin(h * 1.7) * 10 * z
            const bx = px[0] + ox, by = px[1] + oy
            g.beginPath(); g.moveTo(bx - 2.2 * z, by + 2 * z); g.lineTo(bx, by - 2.4 * z); g.lineTo(bx + 2.2 * z, by + 2 * z); g.closePath(); g.fill()
          }
        }
        /* کشاورزی: نوارهای مزرعه */
        if (prov.type === 'agricultural' || prov.terrain === 'plains') {
          g.strokeStyle = 'rgba(255,244,180,' + (0.22 * det) + ')'; g.lineWidth = 2.4 * z
          for (let k = -2; k <= 2; k++) {
            g.beginPath()
            g.moveTo(px[0] - 22 * z + k * 4 * z, px[1] - 14 * z)
            g.lineTo(px[0] - 10 * z + k * 4 * z, px[1] + 14 * z)
            g.stroke()
          }
        }
        /* صنعتی: بلوک‌های خاکستری */
        if (prov.type === 'industrial') {
          g.fillStyle = 'rgba(70,78,88,' + (0.4 * det) + ')'
          for (let k = 0; k < 5; k++) {
            const h = (ci * 13 + k * 29)
            g.fillRect(px[0] + Math.cos(h) * 14 * z, px[1] + Math.sin(h * 2.3) * 9 * z, 5 * z, 3.2 * z)
          }
        }
        /* ساحلی: علامت لنگرگاه روی لبه */
        if (prov.coastal) {
          g.fillStyle = 'rgba(180,230,255,' + (0.5 * det) + ')'
          g.font = Math.round(9 * Math.min(1.4, z)) + 'px sans-serif'; g.textAlign = 'center'
          g.fillText('⚓', px[0] + 20 * z, px[1] - 14 * z)
        }
      })
    }
    /* ---- V74: جاده‌ی اصلی پایتخت↔استان‌ها (bake) ---- */
    if (tierCfg().roads && z >= 1.2 && S.cells.length > 1) {
      const cap = S.cells[0]
      const ca = project(cap.cx, cap.cy)
      for (let i = 1; i < S.cells.length; i++) {
        const pa = project(S.cells[i].cx, S.cells[i].cy)
        strokeRoad(g, roadPts(ca, pa), Math.max(1, 1.6 * Math.min(1.5, z)), 'rgba(214,196,150,.5)')
      }
    }
    /* ---- V74: شهرها (نقطه — برچسب در لایه‌ی پویا با Culling) ---- */
    if (z >= 1.35) {
      S.cells.forEach((c) => {
        const cities = c.prov.cities || []
        cities.forEach((city, k) => {
          const p = project(city.lng, city.lat)
          const r = Math.max(1.6, Math.min(4.2, (city.popK / 500) * 2.2 + (k === 0 ? 1.4 : 0))) * Math.min(1.5, z)
          g.beginPath(); g.arc(p[0], p[1], r, 0, 6.3)
          g.fillStyle = k === 0 ? '#ffe9a8' : 'rgba(240,244,248,.85)'; g.fill()
          g.strokeStyle = 'rgba(20,26,34,.6)'; g.lineWidth = 0.8; g.stroke()
          /* جاده‌ی فرعی شهر↔مرکز استان */
          if (z >= 1.8 && tierCfg().roads) {
            const pc = project(c.cx, c.cy)
            strokeRoad(g, roadPts(pc, p), Math.max(0.7, 0.9 * z), 'rgba(214,196,150,.32)')
          }
        })
      })
    }
    /* برچسب استان‌ها (LOD: از زوم متوسط) */
    if (z >= 1.2) {
      g.textAlign = 'center'; g.textBaseline = 'middle'
      S.cells.forEach((c) => {
        const p = project(c.cx, c.cy)
        const txt = (PROV_TYPE_FA[c.prov.type] || '')
        g.font = '600 ' + Math.round(11 * Math.min(1.6, z)) + 'px Vazirmatn, Tahoma, sans-serif'
        g.fillStyle = 'rgba(0,0,0,.45)'
        g.fillText(txt, p[0] + 1, p[1] - 13 * Math.min(1.4, z) + 1)
        g.fillStyle = c.prov.type === 'capital' ? '#ffd84d' : 'rgba(255,255,255,.85)'
        g.fillText(txt, p[0], p[1] - 13 * Math.min(1.4, z))
      })
    }
    /* ستاره‌ی پایتخت */
    const cap = S.cells[0]
    if (cap) {
      const p = project(cap.cx, cap.cy)
      g.fillStyle = '#ffd84d'
      g.font = Math.round(14 * Math.min(1.5, z)) + 'px sans-serif'
      g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillText('★', p[0], p[1] + 2)
    }
    staticBucket = zoomBucket()
    S.dirtyStatic = false
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
      for (let i = 1; i < S.cells.length; i++) paths.push({ kind: 'car', a: [cap.cx, cap.cy], b: [S.cells[i].cx, S.cells[i].cy] })
    }
    for (const c of S.cells) {
      const hasPort = S.buildings.some((b) => b.province === c.prov.i && b.type === 'port' && b.status === 'active')
      const hasAir = S.buildings.some((b) => b.province === c.prov.i && b.type === 'airport' && b.status === 'active')
      if (hasPort && c.prov.coastal) paths.push({ kind: 'ship', a: [c.cx, c.cy], b: [c.cx + (c.bboxW || 0.5) * 0.35, c.cy - (c.bboxH || 0.5) * 0.35] })
      if (hasAir) paths.push({ kind: 'plane', a: [c.cx, c.cy], b: [c.cx + 0.55, c.cy + 0.35] })
    }
    return paths
  }
  function stepAmbient(dt) {
    const cap = tierCfg().ambient
    if (!cap || !S.ambPaths) return
    /* پرکردن ظرفیت */
    if (S.ambPaths.length && AMB.length < cap) {
      const need = Math.min(cap - AMB.length, 2)
      for (let i = 0; i < need; i++) {
        const p = S.ambPaths[Math.floor(Math.random() * S.ambPaths.length)]
        AMB.push({ kind: p.kind, path: p, t: Math.random(), sp: p.kind === 'car' ? 0.05 + Math.random() * 0.05 : p.kind === 'ship' ? 0.02 + Math.random() * 0.02 : 0.06 + Math.random() * 0.06, dir: Math.random() < 0.5 ? 1 : -1 })
      }
    }
    for (let i = AMB.length - 1; i >= 0; i--) {
      const o = AMB[i]
      o.t += o.sp * dt * o.dir
      if (o.t > 1 || o.t < 0) { /* پایان مسیر: بازیافت روی مسیر دیگر (بدون ایجاد/حذف DOM) */
        if (S.ambPaths.length) o.path = S.ambPaths[Math.floor(Math.random() * S.ambPaths.length)]
        o.t = o.dir > 0 ? 0 : 1
      }
    }
  }
  function drawAmbient(g) {
    const z = S.cam.z
    const W = cv.clientWidth, H = cv.clientHeight
    for (const o of AMB) {
      const a = o.path.a, b = o.path.b
      const t = o.t
      const lng = a[0] + (b[0] - a[0]) * t, lat = a[1] + (b[1] - a[1]) * t
      const p = project(lng, lat)
      if (p[0] < -30 || p[1] < -30 || p[0] > W + 30 || p[1] > H + 30) continue
      const s = Math.min(1.6, z)
      g.globalAlpha = 0.9
      if (o.kind === 'car') {
        g.fillStyle = '#d8dee6'
        g.fillRect(p[0] - 2.4 * s, p[1] - 1.2 * s, 4.8 * s, 2.4 * s)
        g.fillStyle = '#39424e'
        g.fillRect(p[0] - 0.9 * s, p[1] - 1 * s, 1.8 * s, 2 * s)
      } else if (o.kind === 'ship') {
        g.fillStyle = '#e8eef4'
        g.beginPath(); g.moveTo(p[0] - 5 * s, p[1]); g.lineTo(p[0] + 5 * s, p[1]); g.lineTo(p[0] + 3 * s, p[1] + 2.4 * s); g.lineTo(p[0] - 3 * s, p[1] + 2.4 * s); g.closePath(); g.fill()
        g.fillStyle = '#c2483f'; g.fillRect(p[0] - 1 * s, p[1] - 4.2 * s, 2 * s, 4.2 * s)
      } else {
        g.strokeStyle = '#eef4fa'; g.lineWidth = 1.6 * s
        g.beginPath(); g.moveTo(p[0] - 5 * s, p[1]); g.lineTo(p[0] + 5 * s, p[1]); g.moveTo(p[0], p[1] - 3 * s); g.lineTo(p[0], p[1] + 3 * s); g.stroke()
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

  /* ---------- رسم برداری ساختمان (LOD) — به‌جای دایره‌ی Emoji ----------
     state: 0=سالم, 1=فونداسیون, 2=اسکلت. همه‌ی اشکال داخل شعاع ~9×z. */
  function drawBuilding(g, x, y, type, level, z, state, tSec) {
    const s = Math.min(1.7, z)
    const u = 1.15 * s /* واحد پایه */
    const glass = 'rgba(140,220,255,.85)', wall = '#cfd8e2', dark = '#2c3947', accent = '#7fe3ff'
    g.lineWidth = 1 * s
    const box = (w, h, dy, fill) => { g.fillStyle = fill || wall; g.fillRect(x - w * u / 2, y + dy * u - h * u, w * u, h * u); g.strokeStyle = dark; g.strokeRect(x - w * u / 2, y + dy * u - h * u, w * u, h * u) }
    const roof = (w, dy, h) => { g.fillStyle = '#8c4a3f'; g.beginPath(); g.moveTo(x - w * u / 2, y + dy * u); g.lineTo(x, y + (dy - h) * u); g.lineTo(x + w * u / 2, y + dy * u); g.closePath(); g.fill(); g.stroke() }
    if (state === 1) { /* فونداسیون */
      g.setLineDash([3 * s, 3 * s]); g.strokeStyle = 'rgba(255,216,77,.8)'
      g.strokeRect(x - 6 * u, y - 5 * u, 12 * u, 10 * u); g.setLineDash([])
      g.fillStyle = 'rgba(120,90,50,.55)'
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - 4 * u + i * 4 * u, y + 3 * u, 1.6 * u, 0, 6.3); g.fill() }
      return
    }
    switch (type) {
      case 'factory': case 'tank_plant':
        box(9, 4, 2); box(4, 3, 5.6); /* سالن + بخش اداری */
        g.fillStyle = dark; g.fillRect(x + 2.4 * u, y - 6.5 * u, 1.6 * u, 4.5 * u) /* دودکش */
        if (state === 0 && tierCfg().smoke && S.cam.z >= 2) { g.fillStyle = 'rgba(220,228,236,.5)'; g.beginPath(); g.arc(x + 3.2 * u, y - 7.5 * u - Math.sin(tSec * 2) * 1.2 * u, 1.4 * u, 0, 6.3); g.fill() }
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
        g.strokeStyle = dark; g.beginPath()
        g.moveTo(x - 3.4 * u, y + 4 * u); g.lineTo(x - 1 * u, y - 6 * u); g.lineTo(x + 1 * u, y - 6 * u); g.lineTo(x + 3.4 * u, y + 4 * u)
        g.moveTo(x - 2.2 * u, y + 0.5 * u); g.lineTo(x + 2.2 * u, y + 0.5 * u); g.stroke()
        box(3.4, 1.6, 6.8, '#9aa7b4')
        break
      case 'mine':
        g.strokeStyle = dark; g.beginPath(); g.arc(x, y + 1 * u, 3 * u, Math.PI, 0); g.stroke()
        g.beginPath(); g.moveTo(x - 3 * u, y + 1 * u); g.lineTo(x - 3 * u, y + 4.6 * u); g.lineTo(x + 3 * u, y + 4.6 * u); g.lineTo(x + 3 * u, y + 1 * u); g.stroke()
        break
      case 'power':
        g.strokeStyle = dark; g.beginPath()
        g.moveTo(x - 2.6 * u, y + 4.6 * u); g.lineTo(x - 0.7 * u, y - 4.6 * u); g.lineTo(x + 0.7 * u, y - 4.6 * u); g.lineTo(x + 2.6 * u, y + 4.6 * u); g.stroke()
        g.fillStyle = '#ffd84d'; g.font = Math.round(5.5 * u) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚡', x, y - 6 * u)
        break
      case 'port': case 'naval_base':
        g.fillStyle = dark; g.fillRect(x - 6 * u, y + 2.2 * u, 12 * u, 1.4 * u) /* اسکله */
        g.strokeStyle = dark; g.beginPath(); g.moveTo(x - 3 * u, y + 2.2 * u); g.lineTo(x - 3 * u, y - 3.4 * u); g.lineTo(x + 1.6 * u, y - 1.6 * u); g.stroke() /* جرثقیل */
        if (type === 'naval_base') { g.fillStyle = '#4f6b86'; g.beginPath(); g.moveTo(x + 2 * u, y + 0.4 * u); g.lineTo(x + 6 * u, y + 0.4 * u); g.lineTo(x + 4.6 * u, y + 1.8 * u); g.lineTo(x + 2.6 * u, y + 1.8 * u); g.closePath(); g.fill() }
        break
      case 'airport': case 'airbase':
        g.fillStyle = '#55606d'; g.fillRect(x - 7 * u, y + 1.2 * u, 14 * u, 2.2 * u)
        g.strokeStyle = '#e8eef4'; g.setLineDash([2 * u, 1.6 * u]); g.beginPath(); g.moveTo(x - 6 * u, y + 2.3 * u); g.lineTo(x + 6 * u, y + 2.3 * u); g.stroke(); g.setLineDash([])
        box(3.6, 2, 1.2, '#9aa7b4') /* آشیانه */
        if (type === 'airbase') { g.fillStyle = '#ffd84d'; g.font = Math.round(4.6 * u) + 'px sans-serif'; g.fillText('✈', x + 4 * u, y - 1.6 * u) }
        break
      case 'barracks':
        box(7, 3, 3.4); roof(8, 3.4, 1.8)
        g.fillStyle = '#3f7a52'; g.fillRect(x - 0.6 * u, y - 6.4 * u, 1.2 * u, 3 * u); g.fillStyle = '#7fe3ff'; g.fillRect(x + 0.6 * u, y - 6.4 * u, 2.6 * u, 1.6 * u) /* پرچم */
        break
      case 'defense':
        g.fillStyle = '#8d99a6'
        g.fillRect(x - 7 * u, y - 0.6 * u, 14 * u, 3.6 * u)
        for (let i = -3; i <= 3; i += 2) g.fillRect(x + i * 2 * u - 1 * u, y - 2.4 * u, 2 * u, 1.8 * u) /* کنگره */
        g.strokeStyle = dark; g.strokeRect(x - 7 * u, y - 0.6 * u, 14 * u, 3.6 * u)
        break
      case 'radar':
        g.strokeStyle = dark; g.beginPath(); g.moveTo(x, y + 4 * u); g.lineTo(x, y - 1.4 * u); g.stroke()
        g.fillStyle = glass; g.beginPath(); g.ellipse(x, y - 3 * u, 3.4 * u, 2.2 * u, -0.5 + Math.sin(tSec * 0.8) * 0.25, 0, 6.3); g.fill(); g.stroke()
        break
      case 'university':
        box(8, 4, 3.6); g.fillStyle = glass; g.beginPath(); g.arc(x, y - 2.2 * u, 2.2 * u, Math.PI, 0); g.fill(); g.strokeStyle = dark; g.stroke()
        for (let i = -2; i <= 2; i++) g.fillRect(x + i * 2.4 * u - 0.4 * u, y - 0.4 * u, 0.8 * u, 3.6 * u)
        break
      case 'bank': case 'gov':
        box(9, 5, 4)
        g.fillStyle = '#e8eef4'; for (let i = -2; i <= 2; i++) g.fillRect(x + i * 2.6 * u - 0.5 * u, y - 1 * u, 1 * u, 4.6 * u)
        if (type === 'gov') { g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(x, y - 6 * u, 1.4 * u, 0, 6.3); g.fill() }
        break
      case 'storage':
        g.fillStyle = '#b8a888'; g.beginPath(); g.arc(x, y + 1.4 * u, 3.6 * u, Math.PI, 0); g.fill(); g.strokeStyle = dark; g.stroke()
        g.fillRect(x - 3.6 * u, y + 1.4 * u, 7.2 * u, 3.4 * u); g.strokeRect(x - 3.6 * u, y + 1.4 * u, 7.2 * u, 3.4 * u)
        break
      default:
        box(6, 5, 4); roof(7, 4, 2)
    }
    /* سطح ۵+: آنتن | سطح ۸+: هاله (فقط HIGH) */
    if (level >= 5) { g.strokeStyle = accent; g.beginPath(); g.moveTo(x + 5.4 * u, y + 0.6 * u); g.lineTo(x + 5.4 * u, y - 4.4 * u); g.stroke(); g.fillStyle = accent; g.beginPath(); g.arc(x + 5.4 * u, y - 5 * u, 0.9 * u, 0, 6.3); g.fill() }
    if (level >= 8 && tierCfg().shadows) { g.globalAlpha = 0.35 + 0.15 * Math.sin(tSec * 2.4); g.strokeStyle = '#ffd84d'; g.lineWidth = 1.6 * s; g.beginPath(); g.arc(x, y, 11 * u, 0, 6.3); g.stroke(); g.globalAlpha = 1 }
  }

  /* ---------- جاده‌ها ---------- */
  function roadPts(a, b) { /* منحنی ملایم برای حس ارگانیک */
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const nx = -dy * 0.06, ny = dx * 0.06
    return [a, [mx + nx, my + ny], b]
  }
  function strokeRoad(g, pts, w, col) {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1])
    if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1])
    else for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1])
    g.stroke()
  }

  /* ---------- جایگاه‌های slot هر استان (قطعی) ---------- */
  function slotPos(ci, slot) {
    const c = S.cells[ci]
    const n = c.prov.slots
    const R = 26 * Math.min(1.5, S.cam.z)
    const a0 = -Math.PI / 2
    const a = a0 + (slot / n) * Math.PI * 2
    const center = project(c.cx, c.cy)
    return [center[0] + Math.cos(a) * R, center[1] + Math.sin(a) * R]
  }
  function catOf(type) { return S.cat.find((x) => x.id === type) }

  /* ---------- رندر پویا (هر فریم — فقط چیزهای دیدنی) ---------- */
  function render(dt) {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (S.dirtyStatic || zoomBucket() !== staticBucket) bakeStatic()
    ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight)
    ctx.drawImage(staticCv, 0, 0, cv.clientWidth, cv.clientHeight)
    const z = S.cam.z
    const showBuildings = z >= 1.15
    const showDetails = z >= 2
    const W = cv.clientWidth, H = cv.clientHeight
    const tSec = S.nowMs / 1000

    /* V74: لحظه‌ی ورود — تپش مرز کشور + قاب شناور (سبک: فقط stroke متحرک) */
    if (S.enter && !S.enter.done) {
      const k = clamp((S.nowMs - S.enter.t0) / 1400, 0, 1)
      if (S.ring) {
        const ring = S.ring.map((p) => project(p[0], p[1]))
        ctx.strokeStyle = 'rgba(255,216,77,' + (0.9 * (1 - k)) + ')'
        ctx.lineWidth = 3.5 - 2 * k
        ctx.setLineDash([10, 7]); ctx.lineDashOffset = -S.nowMs / 24
        pathRing(ctx, ring); ctx.stroke(); ctx.setLineDash([])
      }
      if (k >= 1) S.enter.done = true
    }

    /* V74: چراغ شهرها (فقط MED/HIGH، سقف tier، فلیکر سبک سینوسی) */
    const lightsN = tierCfg().lights
    if (lightsN && z >= 1.45) {
      ctx.fillStyle = 'rgba(255,224,130,.85)'
      let li = 0
      for (const c of S.cells) {
        const cities = c.prov.cities || []
        for (const city of cities) {
          if (li >= lightsN) break
          const p = project(city.lng, city.lat)
          if (p[0] < 0 || p[1] < 0 || p[0] > W || p[1] > H) continue
          const dev = ((c.prov.stats && c.prov.stats.dev) || 40) / 100
          const nL = Math.max(2, Math.round(2 + dev * 4))
          for (let k = 0; k < nL && li < lightsN; k++, li++) {
            const h = (li * 37 + 11)
            const lx = p[0] + Math.cos(h) * (5 + (h % 9)) * Math.min(1.5, z)
            const ly = p[1] + Math.sin(h * 1.3) * (4 + (h % 7)) * Math.min(1.5, z)
            ctx.globalAlpha = 0.35 + 0.3 * Math.sin(tSec * 2.2 + h)
            ctx.fillRect(lx, ly, 1.6 * Math.min(1.4, z), 1.6 * Math.min(1.4, z))
          }
          if (li >= lightsN) break
        }
      }
      ctx.globalAlpha = 1
    }

    /* V74: برچسب شهرها (LOD z≥1.7 — با Culling) */
    if (z >= 1.7) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      for (const c of S.cells) {
        for (const city of (c.prov.cities || [])) {
          const p = project(city.lng, city.lat)
          if (p[0] < -40 || p[1] < -40 || p[0] > W + 40 || p[1] > H + 40) continue
          const fs = Math.round(9.5 * Math.min(1.4, z))
          ctx.font = '600 ' + fs + 'px Vazirmatn, Tahoma, sans-serif'
          ctx.fillStyle = 'rgba(0,0,0,.5)'
          ctx.fillText(city.name, p[0] + 1, p[1] - 8 * z + 1)
          ctx.fillStyle = '#f4f8fc'
          ctx.fillText(city.name, p[0], p[1] - 8 * z)
        }
      }
    }

    /* ساخت‌وسازهای در حال ساخت + ساختمان‌ها — رسم برداری + Culling */
    if (showBuildings) {
      for (const b of S.buildings) {
        const p = slotPos(b.province, b.slot)
        if (p[0] < -60 || p[1] < -60 || p[0] > W + 60 || p[1] > H + 60) continue
        const def = catOf(b.type)
        if (!def) continue
        const active = b.status === 'active'
        let prog = 1
        if (!active && b.doneAt) prog = clamp(1 - (b.doneAt - S.nowMs) / Math.max(1, b.doneAt - b.startedAt), 0, 1)
        /* سایه‌ی زمین */
        ctx.beginPath(); ctx.ellipse(p[0], p[1] + 5 * z, 9 * Math.min(1.6, z), 3.4 * Math.min(1.6, z), 0, 0, 6.3)
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill()
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
          drawBuilding(ctx, p[0], p[1], b.type, b.level, z, 0, tSec)
        }
        /* حلقه‌ی پیشرفت ساخت */
        if (!active && b.doneAt) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 13 * Math.min(1.6, z), -Math.PI / 2, -Math.PI / 2 + prog * 6.283)
          ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.2; ctx.stroke()
        }
        /* پله‌های سطح */
        const pips = Math.min(10, b.level)
        for (let k = 0; k < pips; k++) {
          ctx.fillStyle = k < b.level ? '#7fe3ff' : 'rgba(255,255,255,.2)'
          ctx.fillRect(p[0] - pips * 2.2 + k * 4.4, p[1] + 12 * Math.min(1.5, z), 2.6, 2)
        }
        /* پالس انتخاب */
        if (S.sel.bld && S.sel.bld.id === b.id) {
          const a = 0.45 + 0.3 * Math.sin(tSec * 5)
          ctx.globalAlpha = a
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
        ctx.fillStyle = 'rgba(255,216,77,.14)'; ctx.fill()
        ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([])
      }
      /* جایگاه‌های خالی استان انتخابی (زوم بالا) */
      if (showDetails) {
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

    /* V74: محیط زنده + ذرات + رد ضربه — همه فقط وقتی در Viewport */
    if (z >= 1.5) drawAmbient(ctx)
    drawParticles(ctx)
    drawRipples(ctx, dt)
    stepParticles(dt)
    stepSmoke(dt)
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
      cam.x = lerp(cam.x, cam.tx, 1 - Math.pow(0.001, dt))
      cam.y = lerp(cam.y, cam.ty, 1 - Math.pow(0.001, dt))
      cam.z = lerp(cam.z, cam.tz, 1 - Math.pow(0.001, dt))
      if (Math.abs(cam.x - cam.tx) < 0.5 && Math.abs(cam.y - cam.ty) < 0.5 && Math.abs(cam.z - cam.tz) < 0.01) cam.anim = false
    }
    render(dt)
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
          const pp = S.provinces[b.province]
          if (pp && S.sel.prov === b.province) openProvPanel(b.province) /* پنل باز را تازه کن */
        }
      }
      if ((S.hdrT = (S.hdrT || 0) + 1) % 2 === 0) header()
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
    cvEl.addEventListener('wheel', (e) => {
      e.preventDefault()
      zoomAt(e.offsetX, e.offsetY, clamp(S.cam.z * (e.deltaY < 0 ? 1.12 : 0.89), 0.6, 4))
    }, { passive: false })
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
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
    S.cam.anim = false
  }
  function onResize() {
    if (!S.active) return
    setupCanvas()
    const c = computeView(); view.base = { cx: c.cx, cy: c.cy }
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
    let hitB = null, hitD = 24 * S.cam.z
    for (const b of S.buildings) {
      const p = slotPos(b.province, b.slot)
      const d = Math.hypot(p[0] - sx, p[1] - sy)
      if (d < hitD) { hitD = d; hitB = b }
    }
    if (hitB) { selectBuilding(hitB); return }
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

  function header() {
    const u = ui(); if (!u) return
    /* V68 — §23: نوشتن تفاضلی — قبلاً هر ۲ ثانیه innerHTML از نو نوشته می‌شد حتی بدون تغییر */
    const sig = [S.countryFa || S.country, fmtRes(S.res.gold), fmtRes(S.res.oil), fmtRes(S.res.food),
      S.rates.gold, S.rates.oil, S.rates.food, S.mil.atkPct, S.mil.defPct, S.counts.ports, S.counts.airports, Math.floor(S.rp)].join('|')
    if (sig === (S._hdrCache || '')) return
    S._hdrCache = sig
    u.querySelector('#wdcv-hname').textContent = S.countryFa || S.country
    u.querySelector('#wdcv-hres').innerHTML =
      '💰' + fmtRes(S.res.gold) + '  🛢️' + fmtRes(S.res.oil) + '  🌾' + fmtRes(S.res.food) +
      '   <span style="opacity:.75">(+' + fa(S.rates.gold) + '/' + fa(S.rates.oil) + '/' + fa(S.rates.food) + ' در دقیقه)</span>'
    u.querySelector('#wdcv-hmil').innerHTML = '⚔️ +' + fa(S.mil.atkPct) + '٪ قدرت   🛡️ دفاع ' + fa(S.mil.defPct) + '   ⚓' + fa(S.counts.ports) + ' ✈️' + fa(S.counts.airports) + (S.rp > 0.5 ? '   🔬' + fa(Math.floor(S.rp)) + ' پژوهش' : '')
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
        header(); openProvPanel(provIdx)
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
        header(); selectBuilding(b)
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
        header(); closePanels()
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
      if (!r.owned) { if (!silent) toast('❌ این کشور در کنترل تو نیست'); return false } /* V74: layout پر شد — فقط اقدامات با مالکیت (سرور مرجع است) */
      /* V68 — §7/§28: دلتای مثبت سرور → playerRes (تولید CV دیگر گم نمی‌شود؛ سیو ۸ثانیه‌ای ماندگارش می‌کند) */
      mergeServerRes(r.res)
      if (typeof r.oilCapAdd === 'number') window.__wdcvOilCapAdd = r.oilCapAdd
      S.resAt = performance.now()
      S.maxLevel = r.maxLevel || 10
      S.offlineCapMs = r.offlineCapMs || 0
      S.nowMs = r.now || Date.now()
      applyMilitary()
      header()
      return true
    } catch (e) {
      if (!silent) toast('❌ ' + (String(e.message).indexOf('401') >= 0 || String(e).indexOf('auth') >= 0 ? 'برای ساخت‌وساز باید با حساب آنلاین وارد شوی' : 'همگام‌سازی نشد — اینترنت را چک کن'))
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
      '<div id="wdcv-top"><button id="wdcv-exit">🌍 بازگشت به نقشه</button><b id="wdcv-hname"></b><div id="wdcv-hres" class="wdcv-line"></div><div id="wdcv-hmil" class="wdcv-line"></div><button id="wdcv-snd" title="صدا">🔊</button></div>' +
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
      '#wdcv-hname{font-size:17px;font-weight:800;display:block;margin-bottom:2px;text-shadow:0 1px 6px rgba(0,0,0,.6)}' +
      '#wdcv-line{font-size:12px;opacity:.95;text-shadow:0 1px 4px rgba(0,0,0,.6)}' +
      '#wdcv-exit{position:relative;float:left;background:rgba(0,240,255,.14);border:1px solid rgba(0,240,255,.5);color:#bff;border-radius:10px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer}' +
      '#wdcv-snd{position:relative;float:left;margin-left:6px;background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.35);color:#bff;border-radius:10px;padding:7px 9px;font-size:13px;cursor:pointer}' +
      '#wdcv-panel{position:absolute;bottom:12px;left:10px;right:10px;background:rgba(6,22,42,.94);border:1px solid rgba(0,240,255,.35);border-radius:14px;padding:10px;pointer-events:auto;max-height:46vh;overflow-y:auto;display:none;transform:translateY(10px);opacity:0;transition:transform .18s ease,opacity .18s ease}' +
      '#wdcv-panel:not(:empty){display:block;transform:translateY(0);opacity:1}' +
      '.wdcv-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;font-size:13px}' +
      '.wdcv-sub{font-size:11.5px;opacity:.85;padding:2px 0}' +
      '.wdcv-chip{display:inline-block;background:rgba(0,240,255,.1);border:1px solid rgba(0,240,255,.3);border-radius:99px;padding:2px 8px;font-size:10.5px;white-space:nowrap}' +
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
      '.wdcv-mini{background:rgba(0,240,255,.14);border:1px solid rgba(0,240,255,.45);color:#cff;border-radius:9px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer;min-height:34px}' +
      '.wdcv-mini:disabled{opacity:.45;cursor:default}' +
      '.wdcv-danger{background:rgba(255,80,80,.12);border-color:rgba(255,90,90,.5);color:#fcc}' +
      '#wdcv-toast{position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:12.5px;opacity:0;transition:opacity .2s;pointer-events:none}' +
      '#wdcv-toast.on{opacity:1}' +
      '#wdcv-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(4,14,26,.6);font-size:14px;pointer-events:none;transition:opacity .3s}' +
      '#wdcv-loading.on{display:flex}' +
      '@media (max-width:480px){.wdcv-stats{grid-template-columns:1fr}}'
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

  async function open(country, opts) {
    if (S.active) return
    ensureDom()
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
    S.acc = 0; S.hdrT = 0; S._ambT = 0
    AMB.length = 0; S.ambPaths = null
    const force = !!(opts && opts.force) /* فقط برای QA — سرور همچنان هر اقدامی را اعتبارسنجی می‌کند */
    /* V74 — WOW ENTRY (بند ۳): فاز ۱ = نمای کلان کشور با تپش مرز، فاز ۲ = شیرجه‌ی نرم دوربین */
    const ldg = document.getElementById('wdcv-loading')
    if (ldg) ldg.classList.add('on')
    if (!(await buildGeometryAsync(country))) toast('⚠️ هندسه‌ی کشور یافت نشد — از سرور ادامه می‌دهیم')
    const ok = await syncState(false)
    if (!ok && !force) { close(); return }
    setupCanvas()
    buildCells()
    const c = computeView(); view.base = { cx: c.cx, cy: c.cy }
    /* شروع از دور: کل کشور کوچک، بعد شیرجه به پایتخت — فقط lerp دوربین (GPU-friendly) */
    S.cam.x = 0; S.cam.y = 0; S.cam.z = 0.55; S.cam.tx = 0; S.cam.ty = 0; S.cam.tz = 1.28; S.cam.anim = true
    S.enter = { t0: Date.now(), done: false }
    S.doneIds = null
    S.nowMs = Date.now()
    bindInput()
    pauseMap()
    startLoop()
    try { if (window.WD_BACK) { if (WD_BACK.stack.indexOf('#wdcv-stage') < 0) WD_BACK.stack.push('#wdcv-stage'); if (typeof wdBackSync === 'function') wdBackSync() } } catch (e) {} /* V74: Back گوشی */
    snd('enter')
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
    const st = document.getElementById('wdcv-stage')
    if (st) st.classList.remove('on')
    closePanels()
    /* V74 — پاکسازی کامل حافظه (بند ۲۴): poolها، مسیرها، صدا، enter */
    AMB.length = 0; S.ambPaths = null
    for (const r of RIPS) r.on = false
    for (const p of pool) p.on = false
    S.enter = null; S.doneIds = null; S.acc = 0; S.hdrT = 0
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
