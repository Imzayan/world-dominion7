/* ============================================================
   BOX5 — b4modes: THE LAST ROUND (کمپین ۶ پرده) + SPAR رسمی + تمرین + سینمatics
   روایت: بوکسورِ زیرِ‌مایه‌ای که هیچ‌وقت بلند نشدن را یاد نگرفت.
   ============================================================ */
import { CFG, PUNCH } from './b1core.js'
import { PLATFORM_Y, RING_HALF } from './b2scene.js'
import { FightCtl, InputRouter, Hud } from './b3combat.js'

const faN = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/* ---------- رقیب‌ها — شخصیت‌دار، نه «حریف ۱/۲/۳» ---------- */
export const RIVALS = {
  rafa: {
    key: 'rafa', name: 'رافا مورنو', nick: 'چکش', title: '«چکش» — حریف کوالیفایر', flag: '🇲🇽', country: 'mx',
    style: 'pressure', tint: 0xc8927e, gloves: 0x1a1a1a, shorts: 0x2b6a3f,
    aggr: 0.5, guard: 0.3, dodge: 0.22, counter: 0.15, stamEff: 0.5, combo: 0.25, adapt: 0.15,
    taunt: 'برای المپیک خیلی جوانی، بچه.', bio: 'خطرناک ولی شکست‌پذیر — درس اول: حرکت، گارد، جب، نفَس.',
  },
  mateo: {
    key: 'mateo', name: 'ماتئو سیلوا', nick: 'دیوار', title: '«دیوار» — ضرب‌گیرِ سرد', flag: '🇧🇷', country: 'br',
    style: 'defensive', tint: 0x8a6248, gloves: 0xe8e8e8, shorts: 0x1d4ed8,
    aggr: 0.28, guard: 0.88, dodge: 0.5, counter: 0.85, stamEff: 0.85, combo: 0.3, adapt: 0.5,
    taunt: 'به تو احترام می‌گذارم — ولی هنوز آماده نیستی.', bio: 'تمیز نمی‌خوری‌اش؛ بعد از گاردِ سنگین، برگردش کند است.',
  },
  nikolai: {
    key: 'nikolai', name: 'نیکولای وُلکوف', nick: 'تپ آهنین', title: '«تپ آهنین» — ماشین فشار', flag: '🇷🇺', country: 'ru',
    style: 'pressure', tint: 0xa9b3c2, gloves: 0xb0122a, shorts: 0x111827,
    aggr: 0.92, guard: 0.5, dodge: 0.32, counter: 0.4, stamEff: 0.28, combo: 0.6, adapt: 0.35,
    taunt: 'استقامت، استعداد را می‌بلعد.', bio: 'مدام جلو می‌آید — اگر هول کنی نفست تمام می‌شود.',
  },
  yusuf: {
    key: 'yusuf', name: 'یوسف دمیر', nick: 'سندان', title: '«سندان» — نیمه‌نهایی', flag: '🇹🇷', country: 'tr',
    style: 'technical', tint: 0xb08968, gloves: 0x8c1f2f, shorts: 0xf4f4f4,
    aggr: 0.62, guard: 0.72, dodge: 0.62, counter: 0.7, stamEff: 0.78, combo: 0.5, adapt: 0.7,
    taunt: 'آناتولی کارخانه‌ی قهرمان است.', bio: 'راند به راند قوی‌تر می‌شود — برنامه داشته باش.',
  },
  aria: {
    key: 'aria', name: 'آریا کین', nick: 'صفر', title: '«صفر» — محبوبِ قهرمانی', flag: '🇺🇸', country: 'us',
    style: 'boss', cyborg: true, tint: 0xffffff, gloves: 0x00e5ff, shorts: 0x0a0f1e,
    aggr: 0.72, guard: 0.85, dodge: 0.78, counter: 0.88, stamEff: 0.92, combo: 0.7, adapt: 0.95,
    taunt: 'حرکت‌هایت را قبل از خودت می‌دانم.', bio: 'هیچ حرکتی بی‌دلیل ندارد؛ هیچ‌وقت نباخته — اما شرور نیست.',
  },
}

/* ---------- پرده‌ها ---------- */
export const ACTS = [
  { n: 0, key: 'prologue', type: 'cine', title: 'پرده ۱ — دعوت‌نامه' },
  { n: 1, key: 'qualifier', type: 'fight', rival: 'rafa', rounds: 2, roundLen: 40, diff: 0.55, xp: 150, title: 'پرده ۲ — کوالیفایر' },
  { n: 2, key: 'wall', type: 'fight', rival: 'mateo', rounds: 3, roundLen: 40, diff: 0.72, xp: 220, title: 'پرده ۳ — دیوار' },
  { n: 3, key: 'tempo', type: 'fight', rival: 'nikolai', rounds: 3, roundLen: 42, diff: 0.8, xp: 280, title: 'پرده ۴ — تپ آهنین' },
  { n: 4, key: 'semifinal', type: 'fight', rival: 'yusuf', rounds: 3, roundLen: 45, diff: 0.9, xp: 360, title: 'پرده ۵ — نیمه‌نهایی' },
  { n: 5, key: 'final', type: 'fight', rival: 'aria', rounds: 3, roundLen: 60, diff: 1.0, xp: 520, final: true, title: 'پرده ۶ — آخرین راند' },
]
export const RANKS = ['ناشناخته', 'کوالیفایر', 'چلنجر', 'فینالیست', 'فینالیست المپیک', 'قهرمان']
export function levelOf(xp) { const T = [0, 150, 400, 750, 1250, 1900]; let l = 1; for (let i = 1; i < T.length; i++) if (xp >= T[i]) l = i + 1; return l }
export function xpNext(xp) { const T = [0, 150, 400, 750, 1250, 1900]; for (let i = 1; i < T.length; i++) if (xp < T[i]) return { next: T[i], need: T[i] - xp }; return null }

const GLOVE_COLORS = [0xd8232a, 0x1450d8, 0x0aa06e, 0xf2b705, 0x111111, 0xe8e8e8, 0x8a2be2, 0xff6b9d]
const SHORT_COLORS = [0x1a1a1a, 0x1450d8, 0x0aa06e, 0xd8232a, 0xe8e8e8, 0x8a2be2, 0xf2b705, 0x2b6a3f]

/* ============================================================
   StoryCtl — اجرای کمپین روی موتور سه‌بعدی
   ============================================================ */
export class StoryCtl {
  constructor(env, save, onExit) {
    this.env = env
    this.save = save
    this.onExit = onExit
    this.disposed = false
  }
  /* منوی داستان — بدون WebGL اضافه، DOM ساده */
  renderMenu(container) {
    const s = this.save
    const unlocked = s.act || 0
    const lv = levelOf(s.xp || 0)
    const xn = xpNext(s.xp || 0)
    const rows = ACTS.map((a) => {
      const done = (s.actClear || []).indexOf(a.n) >= 0
      const open = a.n <= unlocked
      const icon = done ? '✅' : open ? '🥊' : '🔒'
      const rival = a.rival ? RIVALS[a.rival] : null
      const sub = a.type === 'cine' ? 'سینمای داستان' : rival ? rival.flag + ' ' + rival.name + ' «' + rival.nick + '» — ' + faN(a.rounds) + ' راند' : ''
      return '<div class="b5-act ' + (open ? 'open' : 'lock') + (a.final ? ' final' : '') + '" data-act="' + a.n + '">' +
        '<div class="b5-act-ic">' + icon + '</div><div class="b5-act-tx"><b>' + esc(a.title) + '</b><span>' + esc(sub) + '</span></div>' +
        (done ? '<div class="b5-act-xp">+' + faN(a.xp || 0) + ' XP</div>' : '') + '</div>'
    }).join('')
    container.innerHTML =
      '<div class="b5-story-menu">' +
      '<div class="b5-story-head"><div class="b5-story-logo">THE LAST ROUND</div><div class="b5-story-sub">دور آخر — کمپین سینمایی بوکسِ World Dominion</div></div>' +
      '<div class="b5-story-hero">' +
      '<div class="b5-hero-l"><b>' + esc(s.name || 'بوکسور') + '</b><span>' + esc(RANKS[Math.min(5, lv - 1)]) + ' • سطح ' + faN(lv) + '</span>' +
      (xn ? '<i>تا سطح بعد: ' + faN(xn.need) + ' XP</i>' : '<i>به اوج رسیدی</i>') + '</div>' +
      '<div class="b5-hero-r">' + faN(s.wins || 0) + ' برد • ' + faN(s.losses || 0) + ' باخت<br>' + faN(s.kos || 0) + ' ناک‌اوت • ' + faN(s.counters || 0) + ' کانتر</div>' +
      '</div>' +
      '<div class="b5-acts">' + rows + '</div>' +
      '<div class="b5-story-tip">هر انتخاب و هر تمرین، مبارزه‌ی بعدی را کمی عوض می‌کند. باخت پایان راه نیست — دوباره بلند شو.</div>' +
      '<div class="b5-story-btns"><button class="b5-btn ghost" id="b5-story-close">بازگشت</button></div>' +
      '</div>'
    container.querySelectorAll('.b5-act.open').forEach((el) => {
      el.addEventListener('click', () => { const n = +el.getAttribute('data-act'); this.startAct(n, container) })
    })
    container.querySelector('#b5-story-close').addEventListener('click', () => this.onExit())
  }
  async startAct(n, container) {
    const a = ACTS[n]
    if (!a) return
    if (a.type === 'cine') return this.playPrologue(container)
    return this.playFight(a, container)
  }
  /* ---------- پرده ۱: سینمای سالن + ساخت شخصیت ---------- */
  playPrologue(container) {
    const env = this.env
    const v = env.beginScene(container)
    const s = this.save
    /* صحنه: سالن تاریک + باران + نور تک + سایه‌بوکس */
    env.arena.setFinalArena(false)
    env.arena.lights.hemi.intensity = 0.18
    env.arena.lights.key.intensity = 0.55
    env.arena.lights.spotGlow.intensity = 0.3
    env.arena.crowd.count = 0
    const f = v.fighter(-1, { tint: s.tint || 0xffffff, gloves: s.gloves || 0xd8232a, shorts: s.shorts || 0x1a1a1a })
    f.pos.set(-0.6, PLATFORM_Y, 0)
    env.cam.to('INTRO', 99)
    env.audio.setMode('menu')
    let t = 0, rainT = 0, done = false
    const cards = [
      [0.5, 'سالن بوکس — شب. باران.'],
      [3.2, 'هیچ‌کس تو را در فهرست قهرمانان نمی‌دید.'],
      [6.2, 'آخرین مسابقه‌ی کوالیفایر: ناک‌داون در ثانیه‌های آخر.'],
      [9.0, 'اما یک اسکاوت المپیک چیز دیگری دید:'],
      [11.4, '«او هر بار بلند شد.»'],
      [13.6, '📱 دعوت‌نامه‌ی المپیک World Dominion رسید.'],
    ]
    const cardEl = document.createElement('div')
    cardEl.className = 'b5-cine-card'
    container.appendChild(cardEl)
    const skip = document.createElement('button')
    skip.className = 'b5-skip'
    skip.textContent = 'رد شدن ⏭'
    container.appendChild(skip)
    const tick = (dt) => {
      t += dt
      rainT += dt
      /* باران سبک — استخر ذرات */
      if (rainT > 0.06) {
        rainT = 0
        env.vfx.burst((Math.random() - 0.5) * 10, 6.5, (Math.random() - 0.5) * 10, 3, 0x8fb8dd, 0.3, -3.2)
      }
      f.mixer.timeScale(0.85)
      for (const [at, tx] of cards) if (t >= at && t < at + 0.05) cardEl.textContent = tx
      if (t >= 16 && !done) { done = true; this.creationForm(container) }
    }
    v.onTick = tick
    skip.addEventListener('click', () => { if (!done) { done = true; this.creationForm(container) } })
  }
  creationForm(container) {
    const env = this.env
    const s = this.save
    env.endScene()
    const el = document.createElement('div')
    el.className = 'b5-create'
    el.innerHTML =
      '<div class="b5-create-in">' +
      '<h3>میدان نبرد توست</h3>' +
      '<p class="b5-create-p">نام بوکسورت را بنویس و رنگ دستکش و شلوارک را انتخاب کن.</p>' +
      '<input id="b5-name" maxlength="14" placeholder="نام بوکسور" value="' + esc(s.name || '') + '">' +
      '<div class="b5-swatch-row" id="b5-gl">' + GLOVE_COLORS.map((c, i) => '<button data-i="' + i + '" style="background:#' + c.toString(16).padStart(6, '0') + '" class="' + ((s.gloves || 0xd8232a) === c ? 'on' : '') + '"></button>').join('') + '</div>' +
      '<div class="b5-swatch-row" id="b5-sh">' + SHORT_COLORS.map((c, i) => '<button data-i="' + i + '" style="background:#' + c.toString(16).padStart(6, '0') + '" class="' + ((s.shorts || 0x1a1a1a) === c ? 'on' : '') + '"></button>').join('') + '</div>' +
      '<button class="b5-btn gold" id="b5-go">🎬 شروع مسیر — وارد المپیک شو</button>' +
      '</div>'
    container.appendChild(el)
    let gl = GLOVE_COLORS.indexOf(s.gloves) >= 0 ? s.gloves : 0xd8232a
    let sh = SHORT_COLORS.indexOf(s.shorts) >= 0 ? s.shorts : 0x1a1a1a
    el.querySelectorAll('#b5-gl button').forEach((b) => b.addEventListener('click', () => { gl = GLOVE_COLORS[+b.getAttribute('data-i')]; el.querySelectorAll('#b5-gl button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); env.sndK2 && env.sndK2('click') }))
    el.querySelectorAll('#b5-sh button').forEach((b) => b.addEventListener('click', () => { sh = SHORT_COLORS[+b.getAttribute('data-i')]; el.querySelectorAll('#b5-sh button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); env.sndK2 && env.sndK2('click') }))
    el.querySelector('#b5-go').addEventListener('click', async () => {
      const name = (el.querySelector('#b5-name').value || '').trim().slice(0, 14) || 'بوکسور'
      s.name = name; s.gloves = gl; s.shorts = sh
      const saved = await env.rpc('boxing_save', { p_kind: 'intro', p_payload: { name, gloves: gl, shorts: sh } })
      if (saved && saved.ok && saved.profile) Object.assign(s, saved.profile)
      this.renderMenu(env.hubContainer(container))
    })
  }
  /* ---------- مبارزه‌ی پرده‌ها ---------- */
  playFight(a, container) {
    const env = this.env
    const rival = RIVALS[a.rival]
    const v = env.beginScene(container)
    env.arena.setFinalArena(!!a.final)
    env.arena.crowd.count = Math.min(env.arena.crowdMax, env.tier.crowd)
    const s = this.save
    const buff = s.buff || null
    const buffs = buff ? { dmg: buff === 'power', stRegen: buff === 'stamina', guard: buff === 'defense', counter: buff === 'reaction' } : {}
    const f = new FightCtl(env, {
      mode: 'story',
      rounds: a.rounds, roundLen: a.roundLen, restLen: 6,
      aiProfile: rival,
      aiDiff: a.diff + (a.final ? (this.save.actClear || []).indexOf(5) >= 0 ? 0 : 0 : 0),
      rng: Math.random,
      buffs,
      teach: a.n === 1,
      playerTint: s.tint || 0xffffff, playerGloves: s.gloves, playerShorts: s.shorts,
      playerName: s.name || 'تو',
      coach: COACH_LINES[a.key] || {},
      onEnd: (res) => this.fightResult(a, res, container),
    })
    v.fight = f
    env.attachInput(f)
    f.start()
    /* کارت رقیب قبل از زنگ */
    env.hud.roundCard(rival.flag + ' ' + rival.name + ' «' + rival.nick + '»', rival.title, 2.6)
  }
  async fightResult(a, res, container) {
    const env = this.env
    env.detachInput()
    const win = res.verdict === 1
    const st = res.stats
    /* XP و ارسال — سرور مرجع است */
    const payload = {
      act: a.n, win, verdict: res.verdict, byKo: res.byKo ? 1 : 0, durMs: res.durMs,
      thrown: st.thrown, landed: st.landed, counters: st.counters, dodges: st.dodges, kd: st.kd, maxCombo: st.maxCombo,
      perfectRounds: (win && st.landed >= 8 && st.thrown >= 10 && st.kd === 0) ? 1 : 0,
    }
    const r = await env.rpc('boxing_save', { p_kind: 'act', p_payload: payload })
    if (r && r.ok && r.profile) this.save = Object.assign({}, this.save, r.profile)
    const gained = (r && r.xpGain) || 0
    env.endScene()
    const el = document.createElement('div')
    el.className = 'b5-result'
    el.innerHTML =
      '<div class="b5-result-in">' +
      '<div class="b5-res-big">' + (win ? '🏆 پیروزی' : '💥 باخت') + '</div>' +
      '<div class="b5-res-sub">' + (res.byKo ? 'با ناک‌اوت' : 'با داوری — کارت ' + faN(res.decision[0]) + ' : ' + faN(res.decision[1])) + '</div>' +
      '<div class="b5-res-stats">ضربات درست: <b>' + faN(st.landed) + '/' + faN(st.thrown) + '</b> • کانتر: <b>' + faN(st.counters) + '</b> • داوج: <b>' + faN(st.dodges) + '</b> • کمبو: <b>×' + faN(st.maxCombo) + '</b></div>' +
      (gained ? '<div class="b5-res-xp">+' + faN(gained) + ' XP</div>' : '') +
      (win ? '<div class="b5-res-quote">' + esc(RIVALS[a.rival].taunt) + '</div>' : '<div class="b5-res-quote">مربی: «بلند شو. آخرین راند هنوز نیامده.»</div>') +
      '<div class="b5-story-btns">' +
      (win ? '<button class="b5-btn gold" id="b5-choice">ادامه ⏭</button>' : '<button class="b5-btn gold" id="b5-retry">🔄 دوباره</button><button class="b5-btn ghost" id="b5-menu">منوی داستان</button>') +
      '</div></div>'
    container.appendChild(el)
    if (win) el.querySelector('#b5-choice').addEventListener('click', () => this.choiceScene(a, container))
    else {
      el.querySelector('#b5-retry').addEventListener('click', () => { el.remove(); this.playFight(a, container) })
      el.querySelector('#b5-menu').addEventListener('click', () => { el.remove(); this.renderMenu(env.hubContainer(container)) })
    }
  }
  /* صحنه‌ی انتخاب — بین پرده‌ها */
  choiceScene(a, container) {
    const env = this.env
    container.querySelectorAll('.b5-result').forEach((e) => e.remove())
    const next = ACTS[a.n + 1]
    const rival = next ? RIVALS[next.rival] : null
    const el = document.createElement('div')
    el.className = 'b5-choice'
    el.innerHTML =
      '<div class="b5-choice-in">' +
      '<div class="b5-coach-face">🧑‍🏫</div>' +
      '<h3>مربی: «' + (rival ? rival.bio : 'فردا کسی تو را نجات نمی‌دهد.') + '»</h3>' +
      '<p class="b5-choice-p">فردا با ' + (rival ? rival.name + ' «' + rival.nick + '»' : '') + ' مبارزه داری — روی چه چیزی تمرین کنیم؟</p>' +
      '<div class="b5-choice-row">' +
      '<button class="b5-btn" data-c="defense">🛡 تمرین دفاع</button>' +
      '<button class="b5-btn" data-c="power">💥 تمرین قدرت</button>' +
      '<button class="b5-btn" data-c="stamina">🫁 تمرین استقامت</button>' +
      '<button class="b5-btn ghost" data-c="skip">رد کردن</button>' +
      '</div></div>'
    container.appendChild(el)
    el.querySelectorAll('button[data-c]').forEach((b) => b.addEventListener('click', async () => {
      const c = b.getAttribute('data-c')
      el.remove()
      if (c === 'skip') return this.trainOffer(a, container, null)
      /* تمرین انتخابی — بعدش باف */
      this.training(a, container, c)
    }))
  }
  training(a, container, type) {
    const env = this.env
    const T = new TrainingCtl(env, type, container, async (score) => {
      const r = await env.rpc('boxing_save', { p_kind: 'train', p_payload: { act: a.n, type, score: Math.round(score) } })
      if (r && r.ok && r.profile) this.save = Object.assign({}, this.save, r.profile)
      env.endScene()
      const el = document.createElement('div')
      el.className = 'b5-result'
      el.innerHTML = '<div class="b5-result-in"><div class="b5-res-big">' + (score >= 60 ? 'آماده‌ای!' : 'خوب بود') + '</div>' +
        '<div class="b5-res-sub">امتیاز تمرین: <b>' + faN(Math.round(score)) + '</b>' + (score >= 60 ? ' — باف مبارزه‌ی بعد فعال شد ⚡' : ' — باف: نه (به ۶۰ نیاز داری)') + '</div>' +
        '<div class="b5-story-btns"><button class="b5-btn gold" id="b5-next">' + (ACTS[a.n + 1] ? 'پرده‌ی بعد ⏭' : 'منو') + '</button></div></div>'
      container.appendChild(el)
      el.querySelector('#b5-next').addEventListener('click', () => {
        el.remove()
        if (ACTS[a.n + 1]) { this.renderMenu(env.hubContainer(container)) } else this.renderMenu(env.hubContainer(container))
      })
    })
    T.start()
  }
  trainOffer(a, container) { this.renderMenu(this.env.hubContainer(container)) }
}

const COACH_LINES = {
  wall: { acc: '«سیلوا را با فینت باز کن — ضربه‌ی مستقیم نمی‌خورد.»', def: '«کانترش را دیدی؟ بعد از گاردش، بدن باز است.»', generic: '«دیوار را با صبر فرو می‌ریزند.»' },
  tempo: { acc: '«ولکوف نفست را می‌دزدد — عقب برو، صبر کن.»', stam: '«هر ضربه یک شمع است؛ نسوزان‌شان.»', generic: '«بگذار خسته شود، بعد بزن.»' },
  semifinal: { acc: '«دمیر هر راند قوی‌تر می‌شود — زودتر تمامش کن.»', generic: '«یک راند. فقط همین. آرام.»' },
  final: { acc: '«کین حرکات تکراری را می‌خواند — الگو را عوض کن.»', def: '«وقتی ساکت می‌ایستد، در فکر چیزی است.»', generic: '«آخرین راند. هر که بلند شود، می‌برد.»' },
}

/* ============================================================
   TrainingCtl — تمرین‌های ۲۰-۴۰ ثانیه‌ای روی موتور سه‌بعدی
   نوع: reaction (داوج) / power (تایمینگ) / stamina (ریتم) / defense (بلاک/کانتر)
   ============================================================ */
export class TrainingCtl {
  constructor(env, type, container, done) {
    this.env = env
    this.type = type
    this.container = container
    this.done = done
    this.score = 0
    this.reps = 0
    this.total = type === 'stamina' ? 24 : 8
    this.t = 0
    this.state = 'wait'
    this.waitT = 1.2
    this.cur = null
  }
  start() {
    const env = this.env
    const v = env.beginScene(this.container)
    env.arena.setFinalArena(false)
    env.arena.crowd.count = 0
    env.arena.lights.hemi.intensity = 0.5
    this.me = v.fighter(-1, { tint: 0xffffff, gloves: 0xd8232a })
    this.me.pos.set(-1.2, PLATFORM_Y, 0)
    this.pad = v.fighter(1, { tint: 0x777777, gloves: 0x333333 })
    this.pad.pos.set(1.2, PLATFORM_Y, 0)
    this.pad.guarding = true
    env.audio.setMode('gameplay')
    const label = { reaction: '🎯 داوج درست', power: '💥 ضربه در لحظه', stamina: '🫁 ریتم را نگه دار', defense: '🛡 بلاک/کانتر' }[this.type]
    env.hud.roundCard(label, this.type === 'stamina' ? 'به ضربِ قلاب گوش کن' : '۲۰-۴۰ ثانیه', 2)
    const tip = { reaction: 'سوایپ چپ/راست = داوج به همان سمت', power: 'وقتی حلقه سبز شد بزن (جب/کراس)', stamina: 'با ضربه‌های متناوب ریتم را نگه دار', defense: 'نگه‌دار=گارد؛ بعد از بلاک سریع بزن' }[this.type]
    env.hud.hint(tip)
    v.onTick = (dt) => this.tick(dt)
    this.input = new InputRouter(v.canvas, {
      cmd: (c) => this.cmd(c),
      move: () => {},
      haptic: env.haptic,
    })
    env.input = this.input
  }
  cmd(c) {
    if (this.state !== 'ask' || !this.cur) return
    const me = this.me
    if (this.type === 'reaction') {
      if (c.t === 'dodge') {
        const okDir = c.dir === this.cur.dir
        this.rep(okDir)
        if (okDir) this.env.vfx.burst(this.me.pos.x + this.me.side * -0.2, 1.5, this.me.pos.z, 8, 0x7dff9e, 1.6, 1.5)
      }
    } else if (this.type === 'power') {
      if (c.t === 'punch') {
        const p = this.cur.p
        const q = 1 - Math.abs(p - 0.72) * 3.2
        this.rep(q > 0.15)
        if (q > 0.15) { this.env.vfx.burst(this.pad.pos.x + this.pad.side * -0.3, 1.5, this.pad.pos.z, 12, 0xffd75e, 2.4, 2); this.env.audio.impact(q > 0.8) }
      }
    } else if (this.type === 'stamina') {
      if (c.t === 'punch') {
        const P = PUNCH[c.kind]
        me.punch(c.kind)
        const onBeat = Math.abs((this.t % 0.9) - 0.45) < 0.22
        this.reps++
        if (onBeat) { this.score += 4; this.env.vfx.burst(this.pad.pos.x - 0.3, 1.5, this.pad.pos.z, 6, 0x7dff9e, 1.5, 1.5) }
        if (this.reps >= this.total) this.finish()
      }
    } else if (this.type === 'defense') {
      if (c.t === 'guardOn') this.guarding = true
      if (c.t === 'guardOff') this.guarding = false
      if (c.t === 'dodge') { me.startDodge(c.dir); this.dodged = true }
      if (c.t === 'punch' && this.dodged) { this.rep(true); this.dodged = false; this.score += 6; this.env.vfx.burst(this.pad.pos.x - 0.3, 1.5, this.pad.pos.z, 10, 0x7dff9e, 2, 2) }
      if (c.t === 'punch' && this.guarding && this.cur && this.cur.phase === 'active') { this.rep(true); this.score += 4 }
    }
  }
  rep(ok) {
    this.reps++
    if (ok) { this.score += this.type === 'reaction' ? 10 : 8; this.env.sndK2 && this.env.sndK2('coin') }
    else { this.env.sndK2 && this.env.sndK2('alert') }
    this.state = 'wait'
    this.waitT = 0.7 + Math.random() * 0.7
    this.cur = null
    this.env.hud.hint('✓ ' + faN(this.reps) + '/' + faN(this.total) + ' — امتیاز ' + faN(Math.round(this.score)))
    if (this.reps >= this.total) this.finish()
  }
  finish() { this.state = 'over'; this.cleanup(); const sc = this.score; const d = this.done; setTimeout(() => d(sc), 400) }
  tick(dt) {
    if (this.state === 'over') return
    this.t += dt
    this.me.update(dt); this.pad.update(dt)
    if (this.type === 'stamina') {
      if (this.reps < this.total) { /* ضرب قلاب بصری */ this.env.hud.knockRing((this.t % 0.9) / 0.9) }
      return
    }
    if (this.state === 'wait') {
      this.waitT -= dt
      if (this.waitT <= 0) {
        if (this.type === 'reaction') {
          this.cur = { dir: Math.random() < 0.5 ? -1 : 1, phase: 'tele', t: 0 }
          this.env.hud.hint(this.cur.dir < 0 ? '⬅️ حمله از چپ — داوج چپ!' : '➡️ حمله از راست — داوج راست!')
          this.state = 'ask'
          this.cur.ttl = 1.35
        } else if (this.type === 'power') {
          this.cur = { p: 0, speed: 0.85, dir: 1 }
          this.env.hud.hint('بزن وقتی حلقه سبز شد!')
          this.state = 'ask'
        } else if (this.type === 'defense') {
          this.cur = { phase: 'tele', t: 0, ttl: 1.5 }
          this.dodged = false
          this.env.hud.hint('حمله می‌آید — گارد بگیر، بعد کانتر بزن')
          this.state = 'ask'
        }
      }
      return
    }
    if (this.state === 'ask' && this.cur) {
      const c = this.cur
      c.t = (c.t || 0) + dt
      if (this.type === 'reaction') {
        c.ttl -= dt
        /* پد حمله می‌کند — انیمیشن پانچ */
        if (!c.fired && c.t > 0.7) { c.fired = true; this.pad.punch(c.dir < 0 ? 'hookL' : 'hookR'); this.env.audio.whoosh(false) }
        if (c.ttl <= 0) this.rep(false)
      } else if (this.type === 'power') {
        c.p += c.speed * dt * c.dir
        if (c.p > 1) { c.p = 1; c.dir = -1 }
        if (c.p < 0) { c.p = 0; c.dir = 1 }
        this.env.hud.knockRing(c.p)
        c.ttl = (c.ttl || 0) + dt
        if (c.ttl > 6) this.rep(false)
      } else if (this.type === 'defense') {
        if (!c.fired && c.t > 0.8) { c.fired = true; this.pad.punch('cross'); this.env.audio.whoosh(false) }
        c.ttl = (c.ttl || 0) + dt
        if (c.fired && !c.counted && c.t > 0.95) {
          c.counted = true
          if (!this.dodged && !this.guarding) this.rep(false)
          else if (this.guarding) { this.rep(true); this.score += 2 }
          /* کانتر جداگانه در cmd مدیریت می‌شود */
        }
        if (c.ttl > 2.2 && !c.counted) this.rep(false)
      }
    }
  }
  cleanup() {
    this.env.detachInput()
    this.env.hud.hint('')
  }
}
