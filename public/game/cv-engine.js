/* ============================================================
   WORLD DOMINION — V79 COUNTRY VIEW ENGINE (client) — PREMIUM ART + PERFORMANCE
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
    hover: -1,          /* V79 §5: استان زیر نشانگر (فقط دسکتاپ) */
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
  window.WDCV = { S, open, close, rpc, version: 79, openProvPanel, selectBuilding, openCityPanel, openTech }

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
  /* V79 §11/§29: سایه — Low=خاموش | Medium=ساده | High=جهت‌دار (روی سایت رسم) */
  const TIER = {
    low:  { particles: 0,  deco: 0, shadows: false, maxDpr: 1,   ambient: 0,  lights: 0,  smoke: 0, roads: 0 },
    med:  { particles: 8,  deco: 1, shadows: true,  maxDpr: 1.5, ambient: 8,  lights: 26, smoke: 2, roads: 1 },
    high: { particles: 18, deco: 2, shadows: true,  maxDpr: 2,   ambient: 16, lights: 56, smoke: 4, roads: 1 },
  }
  S.tier = detectTier()
  function tierCfg() { return TIER[S.tier] || TIER.med }
  function degradeTier() {
    if (S._tierCd > 0) return /* V79 §31: hysteresis — بعد از هر تغییر ۳۰ثانیه آرامش */
    if (S.tier === 'high') S.tier = 'med'
    else if (S.tier === 'med') S.tier = 'low'
    else return
    try { localStorage.setItem('wdcv_tier', S.tier) } catch (e) {}
    S.dirtyStatic = true; S._tierCd = 30
  }
  /* V79 §31: بازگشت tier فقط بعد از ۴۵ثانیه FPS پایدار — ذخیره نمی‌شود تا سشن بعد
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
    plains: { fill: '#567d43', alt: '#60884b' },
    hills: { fill: '#6f8448', alt: '#798e52' },
    mountain: { fill: '#7f828c', alt: '#8a8d97' },
    desert: { fill: '#bfa05c', alt: '#c8aa66' },
    tundra: { fill: '#8fa8ae', alt: '#99b2b8' },
  }
  const PROV_TYPE_FA = { capital: 'پایتخت', industrial: 'صنعتی', agricultural: 'کشاورزی', resource: 'منبع‌خیز', generic: 'عمومی' }

  /* V78 — هویت شهری کشورها: نام/نوع شهر از کاتالوگ واقعی؛ فقط لایه‌ی بصری،
     اقتصاد و state سرور را تغییر نمی‌دهد. اگر کشوری در کاتالوگ نباشد، داده‌ی سرور حفظ می‌شود. */
  const REAL_CITY_CATALOG = {
    turkey: [
      ['استانبول',41.0082,28.9784,'port'],['آنکارا',39.9334,32.8597,'metro'],['ازمیر',38.4237,27.1428,'port'],
      ['بورسا',40.1950,29.0600,'industrial'],['آنتالیا',36.8969,30.7133,'port'],['آدانا',37.0000,35.3213,'agri'],
      ['قونیه',37.8746,32.4932,'agri'],['غازی‌آنتپ',37.0662,37.3833,'industrial'],['مرسین',36.8121,34.6415,'port'],['ترابزون',41.0027,39.7168,'port']
    ],
    iran: [
      ['تهران',35.6892,51.3890,'metro'],['مشهد',36.2605,59.6168,'metro'],['اصفهان',32.6546,51.6680,'industrial'],
      ['شیراز',29.5918,52.5837,'agri'],['تبریز',38.0962,46.2738,'industrial'],['اهواز',31.3183,48.6706,'oil'],
      ['کرج',35.8400,50.9391,'industrial'],['قم',34.6399,50.8759,'metro'],['کرمان',30.2839,57.0834,'resource'],['بندرعباس',27.1832,56.2666,'port']
    ],
    germany: [
      ['برلین',52.5200,13.4050,'metro'],['هامبورگ',53.5511,9.9937,'port'],['مونیخ',48.1351,11.5820,'industrial'],['کلن',50.9375,6.9603,'industrial'],
      ['فرانکفورت',50.1109,8.6821,'metro'],['اشتوتگارت',48.7758,9.1829,'industrial'],['دوسلدورف',51.2277,6.7735,'industrial'],['لایپزیگ',51.3397,12.3731,'industrial']
    ],
    france: [
      ['پاریس',48.8566,2.3522,'metro'],['مارسی',43.2965,5.3698,'port'],['لیون',45.7640,4.8357,'industrial'],['تولوز',43.6047,1.4442,'industrial'],
      ['نیس',43.7102,7.2620,'port'],['نانت',47.2184,-1.5536,'port'],['بوردو',44.8378,-0.5792,'port'],['لیل',50.6292,3.0573,'industrial']
    ],
    italy: [
      ['رم',41.9028,12.4964,'metro'],['میلان',45.4642,9.1900,'industrial'],['ناپل',40.8518,14.2681,'port'],['تورین',45.0703,7.6869,'industrial'],
      ['پالرمو',38.1157,13.3615,'port'],['جنوا',44.4056,8.9463,'port'],['بولونیا',44.4949,11.3426,'industrial'],['فلورانس',43.7696,11.2558,'metro']
    ],
    spain: [
      ['مادرید',40.4168,-3.7038,'metro'],['بارسلونا',41.3874,2.1686,'port'],['والنسیا',39.4699,-0.3763,'port'],['سویا',37.3891,-5.9845,'agri'],
      ['بیلبائو',43.2630,-2.9350,'industrial'],['مالاگا',36.7213,-4.4214,'port'],['ساراگوسا',41.6488,-0.8891,'industrial'],['مورسیا',37.9922,-1.1307,'agri']
    ],
    unitedstates: [
      ['نیویورک',40.7128,-74.0060,'port'],['لس‌آنجلس',34.0522,-118.2437,'port'],['شیکاگو',41.8781,-87.6298,'industrial'],['هیوستون',29.7604,-95.3698,'oil'],
      ['فینیکس',33.4484,-112.0740,'desert'],['فیلادلفیا',39.9526,-75.1652,'industrial'],['میامی',25.7617,-80.1918,'port'],['سیاتل',47.6062,-122.3321,'port']
    ],
    uk: [
      ['لندن',51.5074,-0.1278,'metro'],['منچستر',53.4808,-2.2426,'industrial'],['بیرمنگام',52.4862,-1.8904,'industrial'],['لیورپول',53.4084,-2.9916,'port'],
      ['گلاسگو',55.8642,-4.2518,'industrial'],['ادینبرو',55.9533,-3.1883,'metro'],['بریستول',51.4545,-2.5879,'port']
    ],
    japan: [
      ['توکیو',35.6762,139.6503,'metro'],['یوکوهاما',35.4437,139.6380,'port'],['اوساکا',34.6937,135.5023,'industrial'],['ناگویا',35.1815,136.9066,'industrial'],
      ['ساپورو',43.0618,141.3545,'agri'],['فوکوئوکا',33.5904,130.4017,'port'],['کیوتو',35.0116,135.7681,'metro'],['کوبه',34.6901,135.1955,'port']
    ],
    china: [
      ['پکن',39.9042,116.4074,'metro'],['شانگهای',31.2304,121.4737,'port'],['گوانگژو',23.1291,113.2644,'port'],['شنژن',22.5431,114.0579,'industrial'],
      ['چونگ‌چینگ',29.5630,106.5516,'industrial'],['ووهان',30.5928,114.3055,'industrial'],['چنگدو',30.5728,104.0668,'agri'],['شیان',34.3416,108.9398,'metro']
    ],
    russia: [
      ['مسکو',55.7558,37.6173,'metro'],['سن‌پترزبورگ',59.9311,30.3609,'port'],['نووسیبیرسک',55.0084,82.9357,'industrial'],['یکاترینبورگ',56.8389,60.6057,'industrial'],
      ['کازان',55.8304,49.0661,'industrial'],['نیژنی نووگورود',56.2965,43.9361,'industrial'],['سوچی',43.6028,39.7342,'port']
    ],
    india: [
      ['دهلی نو',28.6139,77.2090,'metro'],['بمبئی',19.0760,72.8777,'port'],['بنگلور',12.9716,77.5946,'research'],['حیدرآباد',17.3850,78.4867,'industrial'],
      ['چنای',13.0827,80.2707,'port'],['کلکته',22.5726,88.3639,'port'],['احمدآباد',23.0225,72.5714,'industrial'],['پونه',18.5204,73.8567,'industrial']
    ],
    brazil: [
      ['برازیلیا',-15.7939,-47.8828,'metro'],['سائوپائولو',-23.5505,-46.6333,'industrial'],['ریودوژانیرو',-22.9068,-43.1729,'port'],['سالوادور',-12.9777,-38.5016,'port'],
      ['بلو هوریزونته',-19.9167,-43.9345,'industrial'],['مانائوس',-3.1190,-60.0217,'resource'],['کوریچیبا',-25.4284,-49.2733,'agri']
    ],
    egypt: [
      ['قاهره',30.0444,31.2357,'metro'],['اسکندریه',31.2001,29.9187,'port'],['جیزه',30.0131,31.2089,'metro'],['پورت‌سعید',31.2653,32.3019,'port'],
      ['سوئز',29.9668,32.5498,'port'],['منصوره',31.0409,31.3785,'agri'],['اقصر',25.6872,32.6396,'metro']
    ],
    saudiarabia: [
      ['ریاض',24.7136,46.6753,'metro'],['جده',21.4858,39.1925,'port'],['مکه',21.3891,39.8579,'metro'],['مدینه',24.5247,39.5692,'metro'],
      ['دمام',26.4207,50.0888,'oil'],['ظهران',26.2361,50.0393,'oil'],['تبوک',28.3838,36.5550,'desert']
    ],
    canada: [
      ['اتاوا',45.4215,-75.6972,'metro'],['تورنتو',43.6532,-79.3832,'metro'],['مونترال',45.5017,-73.5673,'port'],['ونکوور',49.2827,-123.1207,'port'],
      ['کلگری',51.0447,-114.0719,'oil'],['ادمونتون',53.5461,-113.4938,'oil'],['وینیپگ',49.8951,-97.1384,'agri']
    ],
    australia: [
      ['کانبرا',-35.2809,149.1300,'metro'],['سیدنی',-33.8688,151.2093,'port'],['ملبورن',-37.8136,144.9631,'port'],['بریزبن',-27.4698,153.0251,'port'],
      ['پرت',-31.9505,115.8605,'resource'],['آدلاید',-34.9285,138.6007,'industrial'],['داروین',-12.4634,130.8456,'port']
    ]
  }
  function cityCatalogKey(country, countryFa) {
    const k = String(country || '').toLowerCase().replace(/[^a-z]/g, '')
    if (k === 'turkiye' || k === 'türkiye' || k === 'turkey') return 'turkey'
    if (k === 'iran') return 'iran'
    if (k === 'germany' || k === 'deutschland') return 'germany'
    if (k === 'france') return 'france'
    if (k === 'italy') return 'italy'
    if (k === 'spain') return 'spain'
    if (k === 'unitedstates' || k === 'usa') return 'unitedstates'
    if (k === 'uk' || k === 'unitedkingdom' || k === 'greatbritain') return 'uk'
    if (k === 'japan') return 'japan'
    if (k === 'china') return 'china'
    if (k === 'russia') return 'russia'
    if (k === 'india') return 'india'
    if (k === 'brazil') return 'brazil'
    if (k === 'egypt') return 'egypt'
    if (k === 'saudiarabia') return 'saudiarabia'
    if (k === 'canada') return 'canada'
    if (k === 'australia') return 'australia'
    const f = String(countryFa || '')
    if (f.includes('ترکیه')) return 'turkey'
    if (f.includes('ایران')) return 'iran'
    if (f.includes('آلمان')) return 'germany'
    if (f.includes('فرانسه')) return 'france'
    if (f.includes('ایتالیا')) return 'italy'
    if (f.includes('اسپانیا')) return 'spain'
    if (f.includes('آمریکا') || f.includes('ایالات متحده')) return 'unitedstates'
    if (f.includes('بریتانیا') || f.includes('انگلستان')) return 'uk'
    if (f.includes('ژاپن')) return 'japan'
    if (f.includes('چین')) return 'china'
    if (f.includes('روسیه')) return 'russia'
    if (f.includes('هند')) return 'india'
    if (f.includes('برزیل')) return 'brazil'
    if (f.includes('مصر')) return 'egypt'
    if (f.includes('عربستان')) return 'saudiarabia'
    if (f.includes('کانادا')) return 'canada'
    if (f.includes('استرالیا')) return 'australia'
    return null
  }
  function applyRealCityCatalog() {
    const list = REAL_CITY_CATALOG[cityCatalogKey(S.country, S.countryFa)]
    if (!list || !S.provinces.length) return
    const flat = []
    S.provinces.forEach((p, pi) => (p.cities || []).forEach((c, ci) => flat.push({c, pi, ci, d: 1e9})))
    const used = new Set()
    for (const item of list) {
      let best = null, bestD = Infinity
      for (const f of flat) {
        if (used.has(f.c)) continue
        const dx = (Number(f.c.lng) || 0) - item[2], dy = (Number(f.c.lat) || 0) - item[1]
        const d = dx * dx + dy * dy
        if (d < bestD) { bestD = d; best = f }
      }
      if (best) {
        best.c.name = item[0]; best.c.lat = item[1]; best.c.lng = item[2]; best.c.kind = item[3];
        best.c.visualReal = true; used.add(best.c)
      }
    }
    /* اگر سرور شهرهای کمتری دارد، شهر جدید نساز؛ gameplay state باید سرور-محور بماند. */
  }


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

  /* ============================================================
     V79 PREMIUM ART LAYER — executable Canvas upgrade
     هدف: نزدیک شدن به ظاهر Premium Grand-Strategy نمونه، بدون WebGL,
     بدون DOM-per-object و بدون asset/network dependency.
     ============================================================ */
  function premiumSeaV79(g, W, H, ring) {
    const sea = g.createLinearGradient(0, 0, W, H)
    sea.addColorStop(0, '#123e5c'); sea.addColorStop(.48, '#0a2f4a'); sea.addColorStop(1, '#061e34')
    g.fillStyle = sea; g.fillRect(0, 0, W, H)
    g.save();
    const step = Math.max(26, Math.round(34 / Math.max(.7, Math.min(1.6, S.cam.z))))
    g.strokeStyle = 'rgba(140,215,244,.075)'; g.lineWidth = 1
    for (let y = -H; y < H * 2; y += step) {
      g.beginPath()
      for (let x = -80; x <= W + 80; x += 18) {
        const yy = y + Math.sin(x * .035 + y * .021) * 2.2
        if (x === -80) g.moveTo(x, yy); else g.lineTo(x, yy)
      }
      g.stroke()
    }
    g.restore()
  }

  function premiumMountainV79(g, x, y, s, seed) {
    const h = 12 + hash01(seed + 3) * 16
    const w = 10 + hash01(seed + 7) * 14
    const back = '#596774', mid = '#788591', light = '#aeb9bd'
    g.fillStyle = 'rgba(0,0,0,.16)'
    g.beginPath(); g.ellipse(x, y + 4*s, w*1.05*s, 3.4*s, 0, 0, 6.283); g.fill()
    g.fillStyle = back
    g.beginPath(); g.moveTo(x-w*s,y+3*s); g.lineTo(x,y-h*s); g.lineTo(x+w*s,y+3*s); g.closePath(); g.fill()
    g.fillStyle = mid
    g.beginPath(); g.moveTo(x,y-h*s); g.lineTo(x+w*s,y+3*s); g.lineTo(x+1.5*s,y+1*s); g.closePath(); g.fill()
    g.fillStyle = light
    g.beginPath(); g.moveTo(x,y-h*s); g.lineTo(x-3*s,y-h*s*.48); g.lineTo(x+1.3*s,y-h*s*.2); g.lineTo(x+4*s,y-h*s*.52); g.closePath(); g.fill()
  }

  function premiumForestV79(g, x, y, s, seed) {
    const n = 5 + Math.floor(hash01(seed) * 5)
    for (let i=0;i<n;i++) {
      const dx=(hash01(seed+i*11)-.5)*15*s, dy=(hash01(seed+i*17)-.5)*8*s
      const h=(5+hash01(seed+i*23)*7)*s
      g.fillStyle = i%2 ? 'rgba(35,72,55,.82)' : 'rgba(28,58,46,.9)'
      g.beginPath(); g.moveTo(x+dx,y+dy-h); g.lineTo(x+dx-h*.65,y+dy+1); g.lineTo(x+dx+h*.65,y+dy+1); g.closePath(); g.fill()
      g.fillStyle='rgba(105,138,104,.35)'
      g.beginPath(); g.moveTo(x+dx,y+dy-h); g.lineTo(x+dx-1.2*s,y+dy-h*.45); g.lineTo(x+dx+2*s,y+dy-h*.2); g.closePath(); g.fill()
    }
  }

  function premiumRiverV79(g, c, poly, z) {
    const ter=c.prov.terrain
    if (!(ter==='plains'||ter==='hills'||ter==='forest'||ter==='tundra') || poly.length<4) return
    const seed=c.prov.i*131+19
    let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9
    for(const p of poly){mnx=Math.min(mnx,p[0]);mny=Math.min(mny,p[1]);mxx=Math.max(mxx,p[0]);mxy=Math.max(mxy,p[1])}
    const sx=mnx+(mxx-mnx)*(.18+hash01(seed)*.18)
    const sy=mny+(mxy-mny)*.05
    const ex=mnx+(mxx-mnx)*(.72+hash01(seed+4)*.15)
    const ey=mny+(mxy-mny)*.9
    const bend=(mxx-mnx)*.14
    const pts=[]
    for(let i=0;i<=18;i++){
      const t=i/18
      const x=sx+(ex-sx)*t+Math.sin(t*5.4+seed)*bend*(1-t)*t
      const y=sy+(ey-sy)*t+Math.sin(t*3.1+seed*.7)*((mxy-mny)*.055)
      const q=[x,y]
      if(pointInPoly(q,poly)) pts.push(q)
    }
    if(pts.length<5)return
    const px=pts.map(q=>[q[0],q[1]])
    strokePath(g,px,Math.max(2,3.2*z),'rgba(5,48,72,.38)')
    strokePath(g,px,Math.max(.9,1.35*z),'rgba(126,206,235,.55)')
  }

  function premiumUrbanWebV79(g,x,y,sc,kind,seed){
    const roads = kind==='port'||kind==='industrial'||kind==='metro'||kind==='military'
    if(!roads)return
    g.save(); g.strokeStyle='rgba(239,226,194,.20)'; g.lineWidth=Math.max(.6,.85*sc)
    for(let i=0;i<4;i++){
      const a=(i*.72+hash01(seed+i)*.22)-.4
      const len=(16+hash01(seed+i+8)*13)*sc
      g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len*.55);g.stroke()
    }
    g.restore()
  }

  function premiumCityBackdropV79(g,x,y,city,isCapital,z){
    const sc=Math.min(2.8,Math.max(.75,z))
    const kind=city.kind||'metro'
    g.fillStyle='rgba(15,25,30,.20)'
    g.beginPath();g.ellipse(x,y+3*sc,24*sc,11*sc,0,0,6.283);g.fill()
    g.fillStyle=kind==='agri'?'rgba(166,148,73,.13)':kind==='port'?'rgba(91,150,184,.15)':'rgba(205,208,201,.11)'
    g.beginPath();g.ellipse(x,y+1*sc,18*sc,8*sc,0,0,6.283);g.fill()
    premiumUrbanWebV79(g,x,y,sc,kind,(Number(city.lat)||0)*37+(Number(city.lng)||0)*17)
    if(isCapital){
      g.strokeStyle='rgba(255,216,77,.25)';g.lineWidth=1.4
      g.beginPath();g.arc(x,y,20*sc,0,6.283);g.stroke()
    }
  }

  function drawPremiumCityV79(g,x,y,city,isCapital,z){
    premiumCityBackdropV79(g,x,y,city,isCapital,z)
    const pop=Number(city.popK)||100
    const sc=Math.min(2.8,Math.max(.78,z))
    const kind=city.kind||'metro'
    const pal={
      metro:{f:'#c8d0d5',s:'#7d8992',t:'#eef3f5',r:'#586a76'},
      port:{f:'#b8cbd5',s:'#718b99',t:'#e8f4f7',r:'#486b82'},
      industrial:{f:'#aeb9c0',s:'#69757d',t:'#d9e0e3',r:'#77564c'},
      oil:{f:'#a8adb0',s:'#666c6d',t:'#dce0dc',r:'#675943'},
      agri:{f:'#c3bc91',s:'#8f895f',t:'#e9dfae',r:'#6f684b'},
      military:{f:'#8f9f91',s:'#5c6c60',t:'#b9c9b9',r:'#52604f'},
      research:{f:'#b9d3df',s:'#6f91a1',t:'#effaff',r:'#5f8598'}
    }[kind]||{f:'#c8d0d5',s:'#7d8992',t:'#eef3f5',r:'#586a76'}
    const base=isCapital?14:(pop>=800?11:pop>=300?8:6)
    const n=Math.min(14,base)
    const jitter=q=>hash01((Number(city.lat)||0)*37+(Number(city.lng)||0)*11+q*19)
    for(let k=0;k<n;k++){
      const a=(k/n)*6.283+(jitter(k)-.5)*.38
      const rr=(3+jitter(k+7)*13)*sc
      const bx=x+Math.cos(a)*rr, by=y+Math.sin(a)*rr*.48
      const bw=(3.8+jitter(k+13)*4.8)*(isCapital?1.05:1)*sc
      const bh=(4.5+jitter(k+23)*(isCapital?13:8))*sc
      const d=(1.8+jitter(k+31)*2.5)*sc
      isoBuilding(g,bx,by,.60,bw,bh,d,{front:pal.f,side:pal.s,top:pal.t,roof:pal.r,edge:'rgba(20,30,36,.72)'},k%4===0?'roof':(k%6===0?'glass':null))
      if(z>=2.15 && k%2===0){
        g.fillStyle='rgba(255,232,168,.62)'
        for(let w=0;w<2;w++)g.fillRect(bx-bw*.18+w*bw*.22,by-bh*.52,.9*sc,.9*sc)
      }
    }
    if(isCapital){
      isoBuilding(g,x,y-8*sc,.9,8,15,4,{front:'#dccb9b',side:'#9e8b64',top:'#f5e5b7',roof:'#8b6e42',edge:'rgba(44,35,20,.8)'},'roof')
      g.fillStyle='#ffd84d';g.beginPath();g.arc(x,y-25*sc,1.9*sc,0,6.283);g.fill()
      g.strokeStyle='rgba(255,216,77,.65)';g.lineWidth=1.2*sc;g.beginPath();g.moveTo(x,y-24*sc);g.lineTo(x,y-31*sc);g.stroke()
    } else if(kind==='port'){
      g.strokeStyle='#b9d5e4';g.lineWidth=1.4*sc
      g.beginPath();g.moveTo(x+11*sc,y+2*sc);g.lineTo(x+24*sc,y+4*sc);g.stroke()
      g.fillStyle='#dceef5';g.fillRect(x+20*sc,y+2*sc,5*sc,2*sc)
    } else if(kind==='oil'){
      g.strokeStyle='#463c2e';g.lineWidth=1.1*sc
      for(let k=0;k<2;k++){const ox=x+(k?10:-11)*sc;g.beginPath();g.moveTo(ox,y+3*sc);g.lineTo(ox+3*sc,y-8*sc);g.lineTo(ox+6*sc,y+3*sc);g.stroke()}
    }
  }

  function bakeStatic() {
    const g = staticCtx
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const W = cv.clientWidth, H = cv.clientHeight
    g.clearRect(0, 0, W, H)
    /* دریا: گرادیان عمقی */
    const grd = g.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, '#0b2c47'); grd.addColorStop(1, '#071e33')
    g.fillStyle = grd; g.fillRect(0, 0, W, H)
    const ring = S.ring.map((p) => project(p[0], p[1]))
    const z = S.cam.z
    /* موج ساحل — قطعی، بیرون‌سوی نرمال (فضای خالی دریا زنده می‌شود — bake) */
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
    /* هاله‌ی ساحل + V79 §17: نوار عمق دریا (bake) */
    g.lineJoin = 'round'
    g.strokeStyle = 'rgba(6,32,54,.34)'
    g.lineWidth = 26 * S.cam.z
    pathRing(g, ring); g.stroke()
    g.strokeStyle = 'rgba(120,200,255,.16)'
    g.lineWidth = 9 * S.cam.z
    pathRing(g, ring); g.stroke()
    g.strokeStyle = 'rgba(150,220,255,.32)'
    g.lineWidth = 2
    g.fillStyle = '#123a52'
    pathRing(g, ring); g.fill(); g.stroke()
    /* V78: کانتورهای بسیار سبک برای شکستن تختی زمین — bake-only */
    if (z >= 0.9) {
      g.save(); pathRing(g, ring); g.clip();
      for (let band = 0; band < 7; band++) {
        const yy = H * (0.22 + band * 0.11);
        g.strokeStyle = 'rgba(255,255,255,' + (0.018 + band * 0.002) + ')'; g.lineWidth = 10 * Math.min(1.2,z);
        g.beginPath(); g.moveTo(-40, yy); g.bezierCurveTo(W*.28, yy-18*Math.sin(band+1), W*.7, yy+15*Math.cos(band), W+40, yy-8*Math.sin(band)); g.stroke();
      }
      g.restore();
    }
    /* سلول‌های استان + ترِین + tint هویت */
    const zc = Math.min(2.7, z)
    const TYPE_TINT = { industrial: 'rgba(96,104,114,.10)', resource: 'rgba(70,56,30,.10)', agricultural: 'rgba(130,170,70,.08)', capital: 'rgba(255,210,90,.06)' }
    S.cells.forEach((c, i) => {
      if (!c.poly) return
      const t = TERRAIN[c.prov.terrain] || TERRAIN.plains
      const poly = c.poly.map((p) => project(p[0], p[1]))
      pathRing(g, poly)
      g.fillStyle = (i % 2 ? t.fill : t.alt)
      g.globalAlpha = 0.95; g.fill(); g.globalAlpha = 1
      const tint = TYPE_TINT[c.prov.type]
      if (tint) { g.fillStyle = tint; g.fill() }
      g.strokeStyle = 'rgba(16,22,30,.5)'; g.lineWidth = 1.1; g.stroke()
      /* لبه‌ی داخلی روشن — حس عمق بدون سایه‌ی سنگین */
      g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 0.8; g.stroke()
      if (tierCfg().deco > 0 && z >= 1.05) { drawCellTexture(g, c, poly, zc); premiumRiverV79(g, c, poly, zc) }
      if (tierCfg().deco > 0 && z >= 1.15) {
        const ter2=c.prov.terrain
        const seed2=c.prov.i*77+41
        let mnx2=1e9,mny2=1e9,mxx2=-1e9,mxy2=-1e9
        for(const pp of poly){mnx2=Math.min(mnx2,pp[0]);mny2=Math.min(mny2,pp[1]);mxx2=Math.max(mxx2,pp[0]);mxy2=Math.max(mxy2,pp[1])}
        if(ter2==='mountain'){ for(let q=0;q<(S.tier==='high'?6:4);q++){ const xx=mnx2+(mxx2-mnx2)*(.12+.76*hash01(seed2+q*5)); const yy=mny2+(mxy2-mny2)*(.20+.62*hash01(seed2+q*9)); premiumMountainV79(g,xx,yy,Math.min(1.5,zc),seed2+q*13) } }
        if(ter2==='forest'){ for(let q=0;q<(S.tier==='high'?4:2);q++){ const xx=mnx2+(mxx2-mnx2)*(.16+.68*hash01(seed2+q*7)); const yy=mny2+(mxy2-mny2)*(.18+.68*hash01(seed2+q*11)); premiumForestV79(g,xx,yy,Math.min(1.2,zc),seed2+q*17) } }
      }
    })
    /* V79: خط ارتفاع/لبه‌ی داخلی بسیار نرم برای شکستن تختی زمین */
    if (z >= .9) {
      for (const c of S.cells) {
        if (!c.poly) continue
        const pp=c.poly.map(q=>project(q[0],q[1]))
        pathRing(g,pp); g.strokeStyle='rgba(255,247,214,.055)'; g.lineWidth=Math.max(.55,.8*Math.min(1.4,z)); g.stroke()
      }
    }
    /* جاده‌ی اصلی — ارگانیک چند-پیچی (به‌جای خط اسپوک دیباگ‌نما) — دو-استروک ظریف */
    if (tierCfg().roads && z >= 1.05 && S.cells.length > 1) {
      const cap = S.cells[0]
      for (let i = 1; i < S.cells.length; i++) {
        const pts = roadPath([cap.cx, cap.cy], [S.cells[i].cx, S.cells[i].cy], i).map((q) => project(q[0], q[1]))
        strokePath(g, pts, 2.7 * Math.min(1.3, z), 'rgba(24,20,14,.42)')
        strokePath(g, pts, 1.5 * Math.min(1.3, z), 'rgba(216,198,152,.44)')
      }
    }
    /* V79 §15: ریل فقط-ویژوال — پایتخت ↔ صنعتی‌ترین استان فعال (داده‌محور:
       بدون کارخانه/پالایشگاه فعال، ریل هم نیست. Low tier خاموش.) */
    S._rail = null
    if (tierCfg().ambient > 0 && z >= 1.05 && S.cells.length > 1) {
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
    /* شهرها — خوشه‌ی ۳سطحی از زوم ۱٫۲ + جاده‌ی فرعی از ۱٫۷ */
    if (z >= 1.2) {
      S.cells.forEach((c) => {
        const cities = c.prov.cities || []
        cities.forEach((city, k) => {
          const p = project(city.lng, city.lat)
          drawPremiumCityV79(g, p[0], p[1], city, k === 0 && c.prov.i === 0, zc)
          if (z >= 1.7 && tierCfg().roads) {
            const pc = project(c.cx, c.cy)
            strokePath(g, roadPath([c.cx, c.cy], [city.lng, city.lat], 100 + c.prov.i * 7 + k).map((q) => project(q[0], q[1])), Math.max(0.8, 0.9 * z), 'rgba(216,198,152,.22)')
          }
        })
      })
    }
    /* نشان هویت استان — گلیف برداری کوچک (بدون emoji) */
    if (z >= 1.05) {
      S.cells.forEach((c) => {
        if (!c.poly) return
        const p = project(c.cx, c.cy)
        g.globalAlpha = 0.85
        drawIdentityGlyph(g, p[0], p[1] - 15 * zc, c.prov, zc)
        g.globalAlpha = 1
      })
    }
    /* برچسب استان‌ها — زیر نشان (LOD: از زوم ۱٫۱۵) */
    if (z >= 1.15) {
      g.textAlign = 'center'; g.textBaseline = 'middle'
      S.cells.forEach((c) => {
        if (!c.poly) return
        const p = project(c.cx, c.cy)
        const txt = (PROV_TYPE_FA[c.prov.type] || '')
        g.font = '600 ' + Math.round(10.5 * Math.min(1.5, z)) + 'px Vazirmatn, Tahoma, sans-serif'
        g.fillStyle = 'rgba(0,0,0,.5)'
        g.fillText(txt, p[0] + 1, p[1] + 13 * Math.min(1.4, z) + 1)
        g.fillStyle = c.prov.type === 'capital' ? '#ffd84d' : 'rgba(255,255,255,.8)'
        g.fillText(txt, p[0], p[1] + 13 * Math.min(1.4, z))
      })
    }
    /* وینیت ملایم لبه‌ها (bake) */
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72)
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,8,16,.34)')
    g.fillStyle = vg; g.fillRect(0, 0, W, H)
    staticBucket = zoomBucket()
    S.dirtyStatic = false
  }

  /* ---------- V76: بافت terrain — سبک، قطعی، bake-only ---------- */
  function drawCellTexture(g, c, poly, z) {
    const ter = c.prov.terrain, ty = c.prov.type
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9
    for (const p of poly) { if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; if (p[1] < mny) mny = p[1]; if (p[1] > mxy) mxy = p[1] }
    const cw = mxx - mnx, ch = mxy - mny
    const H1 = (k) => hash01(c.prov.i * 97 + k * 13.7)
    if (ter === 'mountain') {
      g.fillStyle = 'rgba(56,60,70,.55)'
      const n = 3 + Math.round(H1(1) * 2)
      for (let k = 0; k < n; k++) {
        const bx = mnx + cw * (0.18 + 0.64 * H1(k * 3 + 2)), by = mny + ch * (0.25 + 0.5 * H1(k * 3 + 3))
        const w2 = (5 + H1(k * 3 + 4) * 4) * z
        g.beginPath(); g.moveTo(bx - w2, by + w2 * 0.55); g.lineTo(bx, by - w2 * 0.8); g.lineTo(bx + w2, by + w2 * 0.55); g.closePath(); g.fill()
        g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1
        g.beginPath(); g.moveTo(bx - w2 * 0.3, by - w2 * 0.5); g.lineTo(bx, by - w2 * 0.8); g.lineTo(bx + w2 * 0.3, by - w2 * 0.5); g.stroke()
      }
    } else if (ter === 'desert') {
      g.strokeStyle = 'rgba(120,92,40,.35)'; g.lineWidth = 1.2
      for (let k = 0; k < 3; k++) {
        const bx = mnx + cw * (0.2 + 0.6 * H1(k + 9)), by = mny + ch * (0.2 + 0.6 * H1(k + 19))
        g.beginPath(); g.arc(bx, by, (4 + H1(k + 29) * 3) * z, Math.PI * 1.15, Math.PI * 1.85); g.stroke()
      }
    } else if (ty === 'agricultural' || ter === 'plains' || ter === 'hills') {
      if (ty === 'agricultural') {
        /* نوارهای مزرعه در کل سلول — clip سبک در bake */
        g.save(); pathRing(g, poly); g.clip()
        g.strokeStyle = 'rgba(255,244,180,.10)'; g.lineWidth = 2.2 * z
        const ang = H1(5) * Math.PI
        const cx2 = (mnx + mxx) / 2, cy2 = (mny + mxy) / 2
        const R2 = Math.max(cw, ch) * 0.75
        for (let k = -4; k <= 4; k++) {
          const ox = Math.cos(ang) * k * 5 * z, oy = Math.sin(ang) * k * 5 * z
          g.beginPath()
          g.moveTo(cx2 + ox - Math.cos(ang + 1.57) * R2, cy2 + oy - Math.sin(ang + 1.57) * R2)
          g.lineTo(cx2 + ox + Math.cos(ang + 1.57) * R2, cy2 + oy + Math.sin(ang + 1.57) * R2)
          g.stroke()
        }
        g.restore()
      } else {
        /* دسته‌های جنگل کوچک */
        g.fillStyle = 'rgba(38,66,38,.4)'
        const n = 2 + Math.round(H1(7) * 2)
        for (let k = 0; k < n; k++) {
          const bx = mnx + cw * (0.15 + 0.7 * H1(k * 5 + 31)), by = mny + ch * (0.15 + 0.7 * H1(k * 5 + 41))
          for (let j = 0; j < 4; j++) {
            const dx2 = (H1(k * 17 + j * 3 + 51) - 0.5) * 9 * z, dy2 = (H1(k * 17 + j * 3 + 61) - 0.5) * 7 * z
            g.beginPath(); g.arc(bx + dx2, by + dy2, 1.5 * z, 0, 6.3); g.fill()
          }
        }
      }
    }
  }

  /* ---------- V76: نشان هویت استان — پلیت تیره + گلیف برداری ----------
     اولویت: پایتخت(ستاره) ← منبع(دکل) ← صنعتی(چرخ‌دنده) ← کشاورزی(گندم) ← ساحلی(موج) ← عمومی(شبکه) */
  function drawIdentityGlyph(g, x, y, prov, z) {
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
    } else {
      g.strokeRect(x - 2 * u, y - 2 * u, 4 * u, 4 * u)
    }
  }

  /* ---------- V76: خوشه‌ی شهر ۳سطحی — small/medium/capital (بدون صدها object) ----------
     V79 §6/§7: تراکم در نمای ساختمان (z≥2.2 سیلوئت‌های بیشتر) + امضای برداری هویت شهر
     بر اساس city.kind واقعی (port/oil/industrial/agri/military/mountain) از z≥1.5 */
  function isoBuilding(g, x, y, sc, w, h, d, pal, roofKind) {
    const W = w * sc, H = h * sc, D = d * sc
    const top = [[x - W/2, y - H], [x + W/2, y - H], [x + W/2 + D/2, y - H - D/2], [x - W/2 + D/2, y - H - D/2]]
    const left = [[x - W/2, y - H], [x - W/2 + D/2, y - H - D/2], [x - W/2 + D/2, y], [x - W/2, y + D/2]]
    const right = [[x + W/2, y - H], [x + W/2 + D/2, y - H - D/2], [x + W/2 + D/2, y + D/2], [x + W/2, y]]
    const poly = (pts, fill, stroke) => { g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fillStyle=fill; g.fill(); if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(.45,sc*.55);g.stroke()} }
    g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x+D*.2,y+D*.65,W*.62,D*.42,0,0,6.283); g.fill()
    poly(left,pal.side,pal.edge); poly(right,pal.front,pal.edge); poly(top,pal.top,pal.edge)
    if (roofKind === 'roof') {
      g.fillStyle=pal.roof; g.beginPath(); g.moveTo(x-W*.52,y-H); g.lineTo(x+D*.2,y-H-D*.72); g.lineTo(x+W*.52+D*.08,y-H); g.closePath(); g.fill()
    }
    if (roofKind === 'glass') { g.fillStyle='rgba(130,220,255,.62)'; g.fillRect(x-W*.22,y-H-D*.24,W*.44,D*.35) }
  }
  function drawCityCluster(g, x, y, city, isCapital, z) {
    const pop = Number(city.popK) || 100
    const sc = Math.min(2.7, Math.max(.8, z))
    const kind = city.kind || 'metro'
    const pal = {
      metro:{front:'#aeb9c5',side:'#7f8b99',top:'#dbe4eb',roof:'#566879',edge:'rgba(24,32,40,.65)'},
      port:{front:'#aebdca',side:'#718697',top:'#d7e4ec',roof:'#4c7089',edge:'rgba(22,38,50,.65)'},
      industrial:{front:'#9babb8',side:'#65727d',top:'#c8d2da',roof:'#7b4d45',edge:'rgba(25,31,37,.68)'},
      oil:{front:'#8e9ca5',side:'#59636a',top:'#bcc7cd',roof:'#6d5b43',edge:'rgba(24,28,30,.7)'},
      agri:{front:'#b7b08c',side:'#8c855f',top:'#ded4a5',roof:'#6e694c',edge:'rgba(42,42,28,.62)'},
      military:{front:'#879889',side:'#5d6d5f',top:'#aebdab',roof:'#4f604e',edge:'rgba(24,34,27,.7)'},
      research:{front:'#b4cad8',side:'#708d9d',top:'#e0f0f6',roof:'#63899d',edge:'rgba(22,42,52,.65)'},
      desert:{front:'#b59b6a',side:'#8c754e',top:'#ddc38b',roof:'#765e3f',edge:'rgba(54,42,24,.65)'},
      resource:{front:'#9c927d',side:'#6f6757',top:'#c9bea1',roof:'#554d3f',edge:'rgba(35,31,25,.68)'}
    }[kind] || null || {front:'#aeb9c5',side:'#7f8b99',top:'#dbe4eb',roof:'#566879',edge:'rgba(24,32,40,.65)'}
    /* زمین شهری و شبکه‌ی خیابانی کوچک */
    g.fillStyle='rgba(35,45,48,.28)'; g.beginPath(); g.ellipse(x,y+2*sc,19*sc,8*sc,0,0,6.283); g.fill()
    g.strokeStyle='rgba(225,220,195,.18)'; g.lineWidth=1.1*sc
    for(let r=0;r<3;r++){ g.beginPath(); g.moveTo(x-15*sc,y+(r-1)*4*sc); g.lineTo(x+15*sc,y+(r-.5)*4*sc); g.stroke() }
    const n = isCapital ? 12 : pop>=800 ? 9 : pop>=300 ? 7 : 5
    const jitter = (q)=>hash01((Number(city.lat)||0)*37+(Number(city.lng)||0)*11+q*19)
    for(let k=0;k<n;k++){
      const a = (k/n)*6.283 + (jitter(k)-.5)*.55
      const rr = (3.5 + jitter(k+7)*12) * sc
      const bx=x+Math.cos(a)*rr, by=y+Math.sin(a)*rr*.48
      const bw=(3.8+jitter(k+13)*4.6)*(isCapital?1.0:1)
      const bh=(3.8+jitter(k+23)*(isCapital?9:6))*sc
      const depth=(1.8+jitter(k+31)*2.4)*sc
      isoBuilding(g,bx,by,sc*.62,bw,bh,depth,pal,k%3===0?'roof':(k%5===0?'glass':null))
      if(z>=2.4 && k%3===0){ g.fillStyle='rgba(255,232,160,.8)'; g.fillRect(bx-0.6*sc,by-bh*.55,.9*sc,.9*sc) }
    }
    /* landmark هر شهر */
    const lx=x, ly=y-7*sc
    if(isCapital){
      isoBuilding(g,lx,ly,sc*.9,7,11,3.4,{front:'#d8c79c',side:'#a18f69',top:'#f1dfad',roof:'#8e7449',edge:'rgba(45,36,23,.75)'},'roof')
      g.fillStyle='#ffd84d'; g.beginPath(); g.arc(lx,ly-13*sc,1.7*sc,0,6.283); g.fill()
    } else if(kind==='port'){
      g.fillStyle='#4b667b'; g.fillRect(x+10*sc,y+1*sc,11*sc,2.2*sc); g.strokeStyle='#d6e0e8'; g.lineWidth=1*sc; g.beginPath(); g.moveTo(x+14*sc,y+1*sc); g.lineTo(x+14*sc,y-6*sc); g.lineTo(x+18*sc,y-3*sc); g.stroke()
      g.fillStyle='#dce8ef'; g.beginPath(); g.moveTo(x+17*sc,y+3*sc); g.lineTo(x+22*sc,y+3*sc); g.lineTo(x+20*sc,y+4.4*sc); g.lineTo(x+18*sc,y+4.4*sc); g.closePath(); g.fill()
    } else if(kind==='industrial' || kind==='oil'){
      g.fillStyle=kind==='oil'?'#4e4535':'#56626d'; g.fillRect(x+9*sc,y-1*sc,7*sc,5*sc); g.fillStyle='#303b43'; g.fillRect(x+14*sc,y-8*sc,1.4*sc,7*sc)
      if(kind==='oil'){ g.strokeStyle='#3f3628'; g.lineWidth=1.1*sc; g.beginPath();g.moveTo(x-10*sc,y+3*sc);g.lineTo(x-8*sc,y-5*sc);g.lineTo(x-6*sc,y+3*sc);g.moveTo(x-9*sc,y);g.lineTo(x-7*sc,y);g.stroke() }
    } else if(kind==='agri'){
      g.save(); g.translate(x+11*sc,y+2*sc); g.rotate(-.18); g.strokeStyle='rgba(248,232,158,.7)';g.lineWidth=1.4*sc; for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(k*2.2*sc,-3*sc);g.lineTo(k*2.2*sc,4*sc);g.stroke()} g.restore()
    } else if(kind==='military'){
      g.fillStyle='#586b58'; g.fillRect(x+8*sc,y-1*sc,8*sc,4*sc); g.strokeStyle='#c4d2bf';g.lineWidth=.8*sc;g.beginPath();g.arc(x+12*sc,y-4*sc,3.2*sc,Math.PI,0);g.stroke()
    }
    g.fillStyle=isCapital?'#ffd84d':'#e9f3f8'; g.beginPath();g.arc(x,y-2.8*sc,isCapital?1.8*sc:1.15*sc,0,6.283);g.fill()
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
      /* V76: خودروها روی همان جاده‌ی ارگانیک bake‌شده حرکت کنند */
      for (let i = 1; i < S.cells.length; i++) paths.push({ kind: 'car', pts: roadPath([cap.cx, cap.cy], [S.cells[i].cx, S.cells[i].cy], i) })
    }
    for (const c of S.cells) {
      const hasPort = S.buildings.some((b) => b.province === c.prov.i && b.type === 'port' && b.status === 'active')
      const hasAir = S.buildings.some((b) => b.province === c.prov.i && b.type === 'airport' && b.status === 'active')
      if (hasPort && c.prov.coastal) paths.push({ kind: 'ship', pts: [[c.cx, c.cy], [c.cx + (c.bboxW || 0.5) * 0.35, c.cy - (c.bboxH || 0.5) * 0.35]] })
      if (hasAir) paths.push({ kind: 'plane', pts: [[c.cx, c.cy], [c.cx + 0.55, c.cy + 0.35]] })
    }
    if (S._rail && tierCfg().ambient > 0) paths.push({ kind: 'train', pts: S._rail.pts }) /* V79 §15/§13 */
    return paths
  }
  function stepAmbient(dt) {
    if (S.cam.z < 1.4) return /* V79 §26: زیر z1.4 حمل‌ونقل نامرئی است — گام لازم نیست (idle-skip فعال می‌شود) */
    const cap = tierCfg().ambient
    if (!cap || !S.ambPaths) return
    /* پرکردن ظرفیت */
    if (S.ambPaths.length && AMB.length < cap) {
      const need = Math.min(cap - AMB.length, 2)
      for (let i = 0; i < need; i++) {
        const p = S.ambPaths[Math.floor(Math.random() * S.ambPaths.length)]
        AMB.push({ kind: p.kind, path: p, t: Math.random(), sp: p.kind === 'car' ? 0.05 + Math.random() * 0.05 : p.kind === 'ship' ? 0.02 + Math.random() * 0.02 : p.kind === 'train' ? 0.028 + Math.random() * 0.018 : 0.06 + Math.random() * 0.06, dir: Math.random() < 0.5 ? 1 : -1 })
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
        g.fillStyle = '#e8eef4'
        g.beginPath(); g.moveTo(p[0] - 5 * s, p[1]); g.lineTo(p[0] + 5 * s, p[1]); g.lineTo(p[0] + 3 * s, p[1] + 2.4 * s); g.lineTo(p[0] - 3 * s, p[1] + 2.4 * s); g.closePath(); g.fill()
        g.fillStyle = '#c2483f'; g.fillRect(p[0] - 1 * s, p[1] - 4.2 * s, 2 * s, 4.2 * s)
      } else if (o.kind === 'train') {
        /* V79 §13: قطار — لوکوموتیو + ۲ واگن روی همان ریل bake‌شده */
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
  /* V78 — ساختمان پریمیوم 2.5D: تعداد کم، silhouette خوانا، سایه‌ی سبک، جزئیات فقط در زوم مناسب. */
  function drawPremiumBuilding(g,x,y,type,level,z,tSec){
    const sc=Math.min(2.0,Math.max(1.0,z));
    const P={
      industry:{front:'#9aa9b5',side:'#65727d',top:'#d3dde4',roof:'#7b4d45',edge:'rgba(18,25,31,.75)'},
      farm:{front:'#b9ad7e',side:'#887b50',top:'#dfd19c',roof:'#766645',edge:'rgba(45,39,24,.72)'},
      military:{front:'#849785',side:'#596959',top:'#afbdab',roof:'#4f604f',edge:'rgba(20,29,23,.78)'},
      energy:{front:'#8ea4b5',side:'#596b79',top:'#cbd9e2',roof:'#5e7485',edge:'rgba(18,28,36,.78)'},
      research:{front:'#a9c3d2',side:'#6f8b9a',top:'#e1f0f5',roof:'#63879a',edge:'rgba(18,34,42,.72)'},
      gov:{front:'#d0c29f',side:'#9b8b67',top:'#eee0bd',roof:'#806a45',edge:'rgba(47,37,22,.76)'},
      port:{front:'#a7bac8',side:'#607b8f',top:'#d9e6ed',roof:'#4d7189',edge:'rgba(17,32,43,.76)'}
    };
    const pal=(type==='farm')?P.farm:(type==='barracks'||type==='defense'||type==='naval_base'||type==='airbase')?P.military:(type==='power'||type==='oil_rig')?P.energy:(type==='university'||type==='radar')?P.research:(type==='gov'||type==='bank')?P.gov:(type==='port'||type==='airport')?P.port:P.industry;
    const base=(w,h,d,dx=0,dy=0,roof)=>isoBuilding(g,x+dx*sc,y+dy*sc,sc*.78,w,h,d,pal,roof);
    g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x+2*sc,y+5*sc,12*sc,4*sc,0,0,6.283);g.fill();
    if(type==='factory'||type==='tank_plant'){
      base(11,6,3,0,2,'roof');base(6,4,2,5,5,'roof');
      g.fillStyle='#3d474e';g.fillRect(x+5*sc,y-8*sc,1.7*sc,7*sc);g.fillRect(x+7.4*sc,y-6.5*sc,1.3*sc,5.5*sc);
      g.fillStyle='#87949c';for(let k=0;k<3;k++){g.beginPath();g.arc(x-3*sc+k*3*sc,y+3*sc,1.3*sc,0,6.283);g.fill();}
    } else if(type==='farm'){
      base(6,4,2,-2,2,'roof');
      g.save();g.translate(x+6*sc,y+2*sc);g.rotate(-.12);g.strokeStyle='rgba(250,235,165,.75)';g.lineWidth=1.1*sc;for(let k=-3;k<=3;k++){g.beginPath();g.moveTo(k*2*sc,-4*sc);g.lineTo(k*2*sc,4*sc);g.stroke();}g.restore();
    } else if(type==='oil_rig'){
      g.strokeStyle='#3f3a31';g.lineWidth=1.4*sc;g.beginPath();g.moveTo(x-4*sc,y+4*sc);g.lineTo(x-1.2*sc,y-8*sc);g.lineTo(x+1.8*sc,y-8*sc);g.lineTo(x+4.5*sc,y+4*sc);g.moveTo(x-2.4*sc,y-1*sc);g.lineTo(x+2.8*sc,y-1*sc);g.stroke();
      g.fillStyle='#756348';g.beginPath();g.arc(x+7*sc,y+2*sc,2.7*sc,0,6.283);g.fill();g.fillStyle='#9b8a68';g.beginPath();g.arc(x+7*sc,y+2*sc,1.7*sc,0,6.283);g.fill();
    } else if(type==='mine'){
      base(6,4,2,0,2,'roof');g.fillStyle='#4a4d4f';g.beginPath();g.arc(x,y-1*sc,4*sc,Math.PI,0);g.fill();g.fillStyle='#263038';g.fillRect(x-4*sc,y-1*sc,8*sc,4*sc);
    } else if(type==='power'){
      base(7,5,2,0,2);g.strokeStyle='#5c6b76';g.lineWidth=1.3*sc;g.beginPath();g.moveTo(x-5*sc,y+3*sc);g.lineTo(x-2*sc,y-7*sc);g.lineTo(x,y+3*sc);g.moveTo(x+1*sc,y+3*sc);g.lineTo(x+4*sc,y-7*sc);g.lineTo(x+7*sc,y+3*sc);g.stroke();
    } else if(type==='port'||type==='naval_base'){
      base(7,4,2,-2,1,'roof');g.fillStyle='#4c6d82';g.fillRect(x-8*sc,y+3*sc,18*sc,2*sc);g.strokeStyle='#d5e2e8';g.lineWidth=1*sc;g.beginPath();g.moveTo(x+1*sc,y+3*sc);g.lineTo(x+1*sc,y-7*sc);g.lineTo(x+6*sc,y-3*sc);g.stroke();
      g.fillStyle='#e4edf2';g.beginPath();g.moveTo(x+5*sc,y+5*sc);g.lineTo(x+12*sc,y+5*sc);g.lineTo(x+9*sc,y+7*sc);g.lineTo(x+6*sc,y+7*sc);g.closePath();g.fill();
    } else if(type==='airport'||type==='airbase'){
      g.fillStyle='#4d5965';g.fillRect(x-10*sc,y+1*sc,20*sc,3*sc);g.strokeStyle='#edf3f6';g.lineWidth=.9*sc;g.setLineDash([2*sc,2*sc]);g.beginPath();g.moveTo(x-9*sc,y+2.5*sc);g.lineTo(x+9*sc,y+2.5*sc);g.stroke();g.setLineDash([]);base(5,3,2,0,-1,'roof');
    } else if(type==='barracks'||type==='defense'){
      base(8,5,2,0,2,'roof');g.fillStyle='#526653';g.fillRect(x-6*sc,y-7*sc,1.2*sc,5*sc);g.fillStyle='#b8d0b8';g.fillRect(x-4.8*sc,y-7*sc,2.8*sc,1.7*sc);
    } else if(type==='radar'){
      base(5,3,2,0,3);g.strokeStyle='#526672';g.lineWidth=1.1*sc;g.beginPath();g.moveTo(x,y+1*sc);g.lineTo(x,y-5*sc);g.stroke();g.fillStyle='#9bc4d6';g.beginPath();g.ellipse(x,y-6*sc,4*sc,2.2*sc,-.4,0,6.283);g.fill();g.stroke();
    } else if(type==='university'){
      base(9,5,3,0,2,'roof');g.fillStyle='#cde6ef';g.beginPath();g.arc(x,y-3*sc,3*sc,Math.PI,0);g.fill();g.strokeStyle=pal.edge;g.stroke();
    } else if(type==='bank'||type==='gov'){
      base(10,6,3,0,2,'roof');g.fillStyle='#eee5cc';for(let k=-2;k<=2;k++)g.fillRect(x+k*2.8*sc-.45*sc,y-1*sc,.9*sc,4.5*sc);
    } else if(type==='storage'){
      g.fillStyle='#9b8b6c';g.beginPath();g.arc(x,y+1*sc,4.5*sc,Math.PI,0);g.fill();g.fillRect(x-4.5*sc,y+1*sc,9*sc,4*sc);g.strokeStyle=pal.edge;g.stroke();
    } else {
      base(7,5,2,0,2,'roof');
    }
    if(level>=3 && (type==='factory'||type==='tank_plant'||type==='power')){g.fillStyle='#38454d';g.fillRect(x+9*sc,y-7*sc,1.4*sc,6*sc);}
    if(level>=5 && (type==='factory'||type==='oil_rig'||type==='port'||type==='airport')){g.strokeStyle='#75dfff';g.lineWidth=.8*sc;g.beginPath();g.moveTo(x-8*sc,y+3*sc);g.lineTo(x-12*sc,y+3*sc);g.stroke();}
    if(level>=8){g.fillStyle='#ffd84d';g.beginPath();g.arc(x-8*sc,y-8*sc,1.2*sc,0,6.283);g.fill();}
    if(level>=10){g.strokeStyle='rgba(255,216,77,.5)';g.lineWidth=1.2*sc;g.beginPath();g.ellipse(x,y+2*sc,13*sc,5*sc,0,0,6.283);g.stroke();}
    if(tierCfg().shadows){g.globalAlpha=.12;g.fillStyle='#000';g.beginPath();g.ellipse(x+3*sc,y+5*sc,10*sc,3*sc,0,0,6.283);g.fill();g.globalAlpha=1;}
  }

  function drawBuilding(g, x, y, type, level, z, state, tSec) {
    const s = Math.min(1.7, z)
    const u = 1.15 * s /* واحد پایه */
    const P = bpalOf(type)
    const glass = 'rgba(140,220,255,.85)', accent = '#7fe3ff'
    g.lineWidth = 1 * s
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
    switch (type) {
      case 'factory': case 'tank_plant':
        box(9, 4, 2); box(4, 3, 5.6) /* سالن + بخش اداری */
        g.fillStyle = P.trim; g.fillRect(x + 2.4 * u, y - 6.5 * u, 1.6 * u, 4.5 * u) /* دودکش */
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
        g.fillStyle = glass; g.beginPath(); g.ellipse(x, y - 3 * u, 3.4 * u, 2.2 * u, -0.5 + Math.sin(tSec * 0.8) * 0.25, 0, 6.3); g.fill(); g.stroke()
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
    if (level >= 8) { /* پرچم سطح بالا */
      g.strokeStyle = P.trim; g.lineWidth = 1 * s
      g.beginPath(); g.moveTo(x - 6.4 * u, y + 3.4 * u); g.lineTo(x - 6.4 * u, y - 8.4 * u); g.stroke()
      g.fillStyle = '#ffd84d'; g.fillRect(x - 6.4 * u, y - 8.4 * u, 3 * u, 1.8 * u)
    }
    if (level >= 10) { /* نشان لندمارک — الماس درخشان کوچک */
      const by2 = y - 11.4 * u - Math.sin(tSec * 1.8) * 0.6 * u
      g.fillStyle = 'rgba(255,216,77,.9)'
      g.beginPath(); g.moveTo(x, by2 + 2 * u); g.lineTo(x - 1.5 * u, by2); g.lineTo(x, by2 - 2 * u); g.lineTo(x + 1.5 * u, by2); g.closePath(); g.fill()
    }
    /* سطح ۵+: آنتن | سطح ۸+: هاله (فقط HIGH) */
    if (level >= 5 && level < 8) { g.strokeStyle = accent; g.beginPath(); g.moveTo(x + 5.4 * u, y + 0.6 * u); g.lineTo(x + 5.4 * u, y - 4.4 * u); g.stroke(); g.fillStyle = accent; g.beginPath(); g.arc(x + 5.4 * u, y - 5 * u, 0.9 * u, 0, 6.3); g.fill() }
    if (level >= 8 && tierCfg().shadows) { g.globalAlpha = 0.35 + 0.15 * Math.sin(tSec * 2.4); g.strokeStyle = '#ffd84d'; g.lineWidth = 1.6 * s; g.beginPath(); g.arc(x, y, 11 * u, 0, 6.3); g.stroke(); g.globalAlpha = 1 }
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

  /* ---------- رندر پویا (هر فریم — فقط چیزهای دیدنی) ---------- */
  function render(dt) {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (S.dirtyStatic || zoomBucket() !== staticBucket) bakeStatic()
    ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight)
    ctx.drawImage(staticCv, 0, 0, cv.clientWidth, cv.clientHeight)
    const z = S.cam.z
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
    /* V79 §5: هایلایت hover — بسیار ملایم، فقط دسکتاپ، بدون رقابت با انتخاب */
    if (S.hover >= 0 && S.hover !== S.sel.prov && S.cells[S.hover] && S.cells[S.hover].poly) {
      pathRing(ctx, S.cells[S.hover].poly.map((p) => project(p[0], p[1])))
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.4; ctx.stroke()
    }
    const W = cv.clientWidth, H = cv.clientHeight
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

    /* V74: چراغ شهرها (فقط MED/HIGH، سقف tier، فلیکر سبک سینوسی) */
    const lightsN = tierCfg().lights
    if (lightsN && z >= 1.5) {
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

    /* V78: برچسب شهرها — collision-aware + اولویت‌محور */
    if (z >= 1.55) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const labels = []
      for (const c of S.cells) {
        for (const city of (c.prov.cities || [])) {
          const p = project(city.lng, city.lat)
          if (p[0] < -60 || p[1] < -60 || p[0] > W + 60 || p[1] > H + 60) continue
          const capital = city.kind === 'metro' && c.prov.type === 'capital'
          const priority = capital ? 100 : (city.visualReal ? 70 : 45) + (city.kind === 'port' || city.kind === 'oil' || city.kind === 'industrial' ? 8 : 0)
          const fs = Math.round((capital ? 10.5 : 9.2) * Math.min(1.45, z))
          ctx.font = (capital ? '700 ' : '600 ') + fs + 'px Vazirmatn, Tahoma, sans-serif'
          const width = ctx.measureText(String(city.name || '')).width + 12
          labels.push({city,p,priority,fs,w:width,h:fs+8,y:p[1]-10*Math.min(1.5,z)})
        }
      }
      labels.sort((a,b)=>b.priority-a.priority)
      const accepted=[]
      const hit=(a,b)=>Math.abs(a.p[0]-b.p[0]) < (a.w+b.w)/2 && Math.abs(a.y-b.y) < (a.h+b.h)/2
      for(const L of labels){
        if(accepted.some(A=>hit(L,A))) continue
        accepted.push(L)
        ctx.fillStyle='rgba(4,12,20,.72)'; ctx.beginPath(); ctx.roundRect(L.p[0]-L.w/2,L.y-L.h/2,L.w,L.h,5); ctx.fill()
        ctx.fillStyle=L.city.kind==='metro'&&L.city.visualReal?'#ffe9a8':'#f4f8fc'
        ctx.fillText(L.city.name,L.p[0],L.y)
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
        /* سایه‌ی زمین — V79 §11: Low=خاموش | Medium=ساده | High=جهت‌دار */
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
          drawPremiumBuilding(ctx, p[0], p[1], b.type, b.level, z, tSec)
        }
        /* حلقه‌ی پیشرفت ساخت */
        if (!active && b.doneAt) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 13 * Math.min(1.6, z), -Math.PI / 2, -Math.PI / 2 + prog * 6.283)
          ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.2; ctx.stroke()
        }
        /* پله‌های سطح — فقط نمای ساختمان (V76 §17) */
        if (z >= 2.2 && b.level > 1) {
          const pips = Math.min(10, b.level)
          for (let k = 0; k < pips; k++) {
            ctx.fillStyle = k < b.level ? '#7fe3ff' : 'rgba(255,255,255,.2)'
            ctx.fillRect(p[0] - pips * 2.2 + k * 4.4, p[1] + 12 * Math.min(1.5, z), 2.6, 2)
          }
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
        const bob = Math.sin(tSec * 2.6) * 3 * Math.min(1.4, z)
        const oy = op[1] - 34 * Math.min(1.5, z) + bob
        const mz = Math.min(1.4, z)
        ctx.globalAlpha = 0.92
        ctx.fillStyle = '#ffd84d'
        ctx.beginPath(); ctx.moveTo(op[0], oy + 6 * mz); ctx.lineTo(op[0] - 4.4 * mz, oy); ctx.lineTo(op[0], oy - 6 * mz); ctx.lineTo(op[0] + 4.4 * mz, oy); ctx.closePath(); ctx.fill()
        ctx.strokeStyle = 'rgba(16,22,30,.7)'; ctx.lineWidth = 1; ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    /* V76: محیط زنده + ذرات + رد ضربه — همه فقط وقتی در Viewport */
    if (z >= 1.4) drawAmbient(ctx)
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
    clampCam()
    /* V79 §26: اگر هیچ چیز تغییر نکرده — صفر کار رندر (باتری موبایل).
       کانواس آخرین فریم را نگه می‌دارد؛ تیک ۱ثانیه‌ای همچنان داخل همین loop می‌چرخد. */
    let animating = cam.anim || (S.enter && !S.enter.done) || S.cam.z >= 1.5 || (S.cam.z >= 1.4 && AMB.length > 0)
    if (!animating) { for (const b of S.buildings) { if (b.status !== 'active') { animating = true; break } } }
    if (!animating) {
      for (const p of pool) { if (p.on) { animating = true; break } }
      if (!animating) for (const r of RIPS) { if (r.on) { animating = true; break } }
    }
    const selKey = S.sel.prov + ':' + ((S.sel.bld && S.sel.bld.id) || '') + ':' + (S.hover | 0)
    const camMoved = Math.abs(cam.x - (S._lcx == null ? 1e9 : S._lcx)) > 0.05 || Math.abs(cam.y - (S._lcy == null ? 1e9 : S._lcy)) > 0.05 || Math.abs(cam.z - (S._lcz == null ? 1e9 : S._lcz)) > 0.001
    if (!animating && !camMoved && selKey === S._lselKey && !S.dirtyStatic && zoomBucket() === staticBucket) {
      S._idleN = (S._idleN || 0) + 1
    } else {
      render(dt)
      S._lcx = cam.x; S._lcy = cam.y; S._lcz = cam.z; S._lselKey = selKey
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
      /* V79 §31: hysteresis عملکرد — سردشدن ۳۰ثانیه‌ای بعد از هر تغییر tier +
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
    cvEl.addEventListener('pointerleave', () => { if (S.hover !== -1) { S.hover = -1; S._lselKey = '' } }) /* V79 §5 */
    /* V79 §5: hover استان — فقط موس دسکتاپ، throttle ۹۰ms، بدون هیج هزینه‌ی لمسی */
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
    window.addEventListener('keydown', onKey)
  }
  function unbindWin() {
    if (!S._winBound) return
    S._winBound = false
    window.removeEventListener('resize', onResize)
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
    clampCam() /* V79 §48 */
    S.cam.anim = false
  }
  /* V79 §48: دوربین clamp — کشور هرگز کامل از قاب خارج نمی‌شود
     (حداقل ۱۵٪ قاب هم‌پوشانی کشور بماند — pan/زوم آزاد ولی مهارشده) */
  function clampCam() {
    if (!S.bbox || !cv || !view.base) return
    const z = S.cam.z, W = cv.clientWidth, H = cv.clientHeight
    const exW = (S.bbox.maxX - S.bbox.minX) * view.scale * kmPerLon() / 2
    const exH = (S.bbox.maxY - S.bbox.minY) * view.scale * 111.32 / 2
    const mW = exW + W * 0.35 / z, mH = exH + H * 0.35 / z
    S.cam.x = clamp(S.cam.x, -mW, mW)
    S.cam.y = clamp(S.cam.y, -mH, mH)
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
  function computeObjective() {
    const B = S.buildings || []
    const act = (t, pi) => B.some((b) => b.type === t && b.status === 'active' && (pi == null || b.province === pi))
    const cntProv = (pi) => B.filter((b) => b.province === pi).length
    const actN = B.filter((b) => b.status === 'active').length
    const resP = S.provinces.findIndex((p) => p.type === 'resource')
    const agP = S.provinces.findIndex((p) => p.type === 'agricultural')
    const inP = S.provinces.findIndex((p) => p.type === 'industrial')
    const coP = S.provinces.findIndex((p) => p.coastal)
    const rules = [
      { id: 'first', fa: 'اولین ساختمان کشور را بساز', prov: 0, done: () => B.length >= 1 },
      { id: 'power', fa: 'نیروگاه بساز تا انرژی پایدار شود', prov: 0, done: () => act('power') },
      { id: 'food', fa: 'تولید غذا: مزرعه در استان کشاورزی', prov: agP >= 0 ? agP : 0, done: () => act('farm') },
      { id: 'industry', fa: 'اولین کارخانه صنعتی را بساز', prov: inP >= 0 ? inP : 0, done: () => act('factory') },
      { id: 'oil', fa: 'تولید نفت: چاه/پالایشگاه در استان نفتی', prov: resP >= 0 ? resP : 0, done: () => act('oil_rig') || act('tank_plant') },
      { id: 'mil', fa: 'امنیت: یک تاسیسات نظامی بساز', prov: 0, done: () => B.some((b) => MILITARY_IDS.indexOf(b.type) >= 0) },
      { id: 'cap4', fa: 'پایتخت را توسعه بده (۴ ساختمان)', prov: 0, done: () => cntProv(0) >= 4 },
      { id: 'port', fa: coP >= 0 ? 'بندر در استان ساحلی بساز' : '۶ ساختمان فعال در کشور', prov: coP >= 0 ? coP : null, done: () => coP >= 0 ? act('port') : actN >= 6 },
      { id: 'res', fa: 'مرکز پژوهش بساز (پایتخت)', prov: 0, done: () => act('university') },
      { id: 'net3', fa: 'در ۳ استان مختلف ساختمان فعال بساز', prov: null, done: () => new Set(B.filter((b) => b.status === 'active').map((b) => b.province)).size >= 3 },
      { id: 'lv5', fa: 'یک ساختمان را به سطح ۵ برسان', prov: null, done: () => B.some((b) => b.level >= 5) },
      { id: 'act8', fa: '۸ ساختمان فعال — موتور اقتصاد کشور', prov: null, done: () => actN >= 8 },
      { id: 'land', fa: 'یک لندمارک بساز (سطح ۸)', prov: null, done: () => B.some((b) => b.level >= 8) },
      { id: 'act14', fa: '۱۴ ساختمان فعال — قدرت منطقه‌ای', prov: null, done: () => actN >= 14 },
    ]
    for (const r of rules) if (!r.done()) return { id: r.id, fa: r.fa, prov: r.prov, t0: Date.now() }
    return null
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
    /* V68 — §23: نوشتن تفاضلی | V76: چیپ‌های منابع + هدف فعال + مسیر داستان */
    const story = storyState()
    const sig = [S.countryFa || S.country, fmtRes(S.res.gold), fmtRes(S.res.oil), fmtRes(S.res.food),
      S.rates.gold, S.rates.oil, S.rates.food, S.mil.atkPct, S.mil.defPct, S.counts.ports, S.counts.airports, Math.floor(S.rp),
      S.obj ? S.obj.id : '-', story.cur].join('|')
    if (sig === (S._hdrCache || '')) return
    S._hdrCache = sig
    u.querySelector('#wdcv-hname').textContent = S.countryFa || S.country
    /* V76 §13: منابع به‌صورت چیپ — خوانا و ریسپانسیو */
    u.querySelector('#wdcv-hres').innerHTML =
      '<span class="wdcv-hchip">💰 ' + fmtRes(S.res.gold) + ' <small>+' + fa(S.rates.gold) + '</small></span>' +
      '<span class="wdcv-hchip">🛢️ ' + fmtRes(S.res.oil) + ' <small>+' + fa(S.rates.oil) + '</small></span>' +
      '<span class="wdcv-hchip">🌾 ' + fmtRes(S.res.food) + ' <small>+' + fa(S.rates.food) + '</small></span>'
    /* V76 §14: هدف فعال از وضعیت واقعی کشور — قابل لمس → پنل استان هدف */
    const objEl = u.querySelector('#wdcv-obj')
    if (objEl) {
      objEl.textContent = S.obj ? ('🎯 ' + S.obj.fa) : '🏆 کشور شکوفا شد — همه‌ی اهداف انجام شده'
      objEl._prov = S.obj ? S.obj.prov : null
      objEl.style.display = S.obj ? '' : 'none'
    }
    /* جزئیات بازشو (نظامی/بندر/پژوهش + مسیر داستان — بند ۱۵) */
    u.querySelector('#wdcv-hmil').innerHTML =
      '<span class="wdcv-hchip">⚔️ +' + fa(S.mil.atkPct) + '٪</span>' +
      '<span class="wdcv-hchip">🛡️ ' + fa(S.mil.defPct) + '٪</span>' +
      '<span class="wdcv-hchip">⚓ ' + fa(S.counts.ports) + '</span>' +
      '<span class="wdcv-hchip">✈️ ' + fa(S.counts.airports) + '</span>' +
      (S.rp > 0.5 ? '<span class="wdcv-hchip">🔬 ' + fa(Math.floor(S.rp)) + '</span>' : '') +
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
      if (!r.owned) { if (!silent) toast('❌ این کشور در کنترل تو نیست'); return false } /* V74: layout پر شد — فقط اقدامات با مالکیت (سرور مرجع است) */
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
      '<div id="wdcv-top"><button id="wdcv-exit">🌍 بازگشت به نقشه</button><button id="wdcv-hbtn" title="جزئیات">⋯</button><button id="wdcv-snd" title="صدا">🔊</button><b id="wdcv-hname"></b><div id="wdcv-hres" class="wdcv-line"></div><div id="wdcv-obj" class="wdcv-line" style="display:none"></div><div id="wdcv-hmil" class="wdcv-line"></div></div>' +
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
      '.wdcv-hchip{display:inline-block;background:rgba(0,40,60,.55);border:1px solid rgba(0,240,255,.22);border-radius:9px;padding:3px 8px;font-size:12px;margin:2px 3px 0 0;white-space:nowrap}' +
      '.wdcv-hchip small{opacity:.65;font-size:10px}' +
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
      '#wdcv-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(4,14,26,.6);font-size:14px;pointer-events:none;transition:opacity .3s}' +
      '#wdcv-loading.on{display:flex}' +
      '@media (max-width:480px){.wdcv-stats{grid-template-columns:1fr}#wdcv-hname{font-size:15px}.wdcv-hchip{font-size:11px;padding:2px 6px}#wdcv-obj{font-size:11px;padding:4px 8px}}'
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
    S.obj = null; S._lm = null; S._hdrCache = ''
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
    applyRealCityCatalog()
    const c = computeView(); view.base = { cx: c.cx, cy: c.cy }
    /* V79 §22: FIT COUNTRY — کشور ~۶۵–۷۵٪ فضای مفید را بگیرد؛ نه ریز، نه بیرون‌زده.
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
    closePanels()
    /* V74 — پاکسازی کامل حافظه (بند ۲۴): poolها، مسیرها، صدا، enter */
    AMB.length = 0; S.ambPaths = null
    for (const r of RIPS) r.on = false
    for (const p of pool) p.on = false
    S.enter = null; S.doneIds = null; S.acc = 0; S.hdrT = 0
    S.hover = -1; S._rail = null; S._idleN = 0; S._tierCd = 0; S._fast = 0; S._lselKey = ''; S._lcx = null; S._lcy = null; S._lcz = null /* V77 */
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
