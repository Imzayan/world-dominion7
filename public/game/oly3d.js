/* ============================================================
   WORLD DOMINION — OLYMPICS V4 (V93) — WD_OLY4D
   ULTIMATE PREMIUM SPORTS EXPERIENCE — full-stage cinematic engine
   ============================================================
   معماری OLYMPICS V4 (بازسازی کامل ارائه، حفظ کامل قرارداد سرور):
   - داوری = همان داورهای v3 سرور (src/lib/olyScore.ts) — این فایل فقط
     تله‌متری بایت‌سازگار با همان قرارداد تولید می‌کند و نمایش می‌دهد.
   - صحنه‌ی تمام‌صفحه داخل #wd33-stage (نه جعبه‌ی کوچک) + HUD فارسی
     مینیمال + کارگردان دوربین سینمایی + کارگردان صدا (WebAudio سینتی
     بدون هیچ فایل) + VFX استخرشده + ورزشکار ۲.۰ (اسکلت کامل، پوز،
     خستگی، تنفس) + مراسم اهدای مدال + رقیب واقعی (شبح = replay).
   - گیم‌پلی واقعی: استقامت/ریتم در دو و شنا، پنجره‌ی ثبات در کمان،
     تله‌گراف خوانا و کانتر پرریسک در بوکس، خط مسابقه در رالی.
   - آهسته‌حرکت و فیزیک نمایشی فقط تصویری‌اند — ساعت تله‌متری همیشه
     performance.now() واقعی است (داور دست‌نخورده).
   - تک‌حلقه‌ی rAF از A.loop33 (خودتاب با بستن صحنه) — هیچ حلقه‌ی
     دائمی جدیدی ساخته نمی‌شود. pause/resume با visibility و
     webglcontextlost/restored. dispose کامل در پایان هر تلاش.
   - Fallback امن: هر خطا = بازگشت به موتور 2D نسل ۳ (oly3.js).
   نسخه: با ?v=92 کنترل می‌شود (همگام با __WD_V).
   ============================================================ */
(function () {
  'use strict';
  var A = window.WD33_API;
  if (!A || !A.GAMES) return; /* صحنه‌ی المپیک نیست — هیچ */
  var M = (window.WD_OLY3 && window.WD_OLY3.mirrors) || null; /* آینه‌های سرور */
  var FIVE = ['sprint', 'archery', 'swim', 'boxing', 'rally'];
  var TAU = Math.PI * 2;

  /* ---------- ۰) ابزار ---------- */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }
  function lerp(a, b, k) { return a + (b - a) * k }
  function dampK(dt, k) { return 1 - Math.exp(-k * dt / 1000) } /* میرایی مستقل از فریم */
  function seedOf() { return (A.MATCH && A.MATCH.seed) ? String(A.MATCH.seed) : '' }
  function faN(v) { try { return A.faN(v) } catch (e) { return String(v) } }
  function faTime(ms) { /* 00.000 فارسی */
    ms = Math.max(0, Math.round(ms));
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    return faN(m > 0 ? (m + ':' + ('0' + (s % 60)).slice(-2)) : String(s % 60 + m * 0)) + '.' + faN(('00' + (ms % 1000)).slice(-3));
  }
  function faPad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return faN(s) }
  function hexCol(c, fb) { try { var n = parseInt(String(c).replace('#', ''), 16); return isFinite(n) ? n : fb } catch (e) { return fb } }
  function sfx(k) { try { if (A.sndK2) A.sndK2(k) } catch (e) {} }
  function TE() { try { A.TELE.ev.apply(A.TELE, arguments) } catch (e) {} }
  function modeChip33() { return A.MODE === 'train' ? '🌀 تمرین' : ((A.MATCH && A.MATCH.final) ? '🏁 فینال' : 'کوالیفیکیشن') }

  /* ---------- ۱) Performance + Capability ---------- */
  var RT = { three: null, loading: null, broken: false, renderer: null, S: null, LOW: false, V: (window.WD3D_V || '92') };
  try {
    var nav = navigator || {};
    var cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory || 4;
    RT.LOW = (window.WD60_FX && window.WD60_FX.state && window.WD60_FX.state() === 'on') || cores <= 4 || mem <= 2;
  } catch (e) { RT.LOW = false }
  function webglOk() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')) } catch (e) { return false }
  }
  function capable() {
    if (RT.broken || !M) return false;
    if (RT.three) return true;
    return webglOk();
  }
  function ensureThree() {
    if (RT.three) return Promise.resolve(RT.three);
    if (RT.loading) return RT.loading;
    RT.loading = import('/game/vendor/three.module.min.js?v=' + RT.V).then(function (m) {
      RT.three = (m && m.default && m.default.WebGLRenderer) ? m : (m && m.WebGLRenderer ? m : m);
      return RT.three;
    }).catch(function (e) { RT.broken = true; RT.loading = null; throw e });
    return RT.loading;
  }
  function preload() { if (!RT.three && !RT.broken && M) { try { ensureThree().catch(function () {}) } catch (e) { RT.broken = true } } return !!RT.three }

  /* فرماندار کیفیت — LOW/MED/HIGH خودکار با گورنر FPS (کاهش قبل از تخریب گیم‌پلی) */
  var Q = {
    tier: RT.LOW ? 0 : 1, /* 0=LOW 1=MED 2=HIGH */
    hist: [], lastAdj: 0, hiStreak: 0, startTier: 1,
    init: function () { this.startTier = this.tier; return this },
    dpr: function () { return [1, 1.4, 1.9][this.tier] },
    crowd: function () { return [200, 420, 720][this.tier] },
    vfx: function () { return [130, 240, 400][this.tier] },
    feed: function (dt, now) {
      this.hist.push(dt); if (this.hist.length > 90) this.hist.shift();
      if (now - this.lastAdj < 4000) return;
      var avg = 0, i; for (i = 0; i < this.hist.length; i++) avg += this.hist[i];
      avg = avg / Math.max(1, this.hist.length);
      if (avg > 36 && this.tier > 0) { /* <28fps → پله پایین */
        this.tier--; this.lastAdj = now; this.hist.length = 0; this.hiStreak = 0;
        if (RT.renderer) RT.renderer.setPixelRatio(Math.min(this.dpr(), (window.devicePixelRatio || 1) || 1));
        if (RT.S && RT.S.onQuality) try { RT.S.onQuality() } catch (e) {}
      } else if (avg < 19.5 && this.tier < 2 && this.hiStreak > 3) { /* >51fps پایدار → پله بالا، حداکثر start+1 */
        this.tier++; this.lastAdj = now; this.hist.length = 0;
        if (RT.renderer) RT.renderer.setPixelRatio(Math.min(this.dpr(), (window.devicePixelRatio || 1) || 1));
        if (RT.S && RT.S.onQuality) try { RT.S.onQuality() } catch (e) {}
      } else if (avg < 19.5) { this.hiStreak++ }
    }
  }.init();

  /* ---------- ۲) Renderer — یک‌بار برای کل صفحه ---------- */
  function getRenderer(w, h) {
    var T3 = RT.three;
    if (!RT.renderer) {
      try { RT.renderer = new T3.WebGLRenderer({ antialias: Q.tier > 0, powerPreference: 'high-performance' }) }
      catch (e) { RT.broken = true; return null }
      RT.renderer.setPixelRatio(Math.min(Q.dpr(), (window.devicePixelRatio || 1) || 1));
    }
    RT.renderer.setSize(w, h, false);
    return RT.renderer;
  }

  /* ---------- ۳) کارگردان صدا — سینتی WebAudio، صفر فایل، لود تنبل ---------- */
  var AD = (function () {
    var ctx = null, master = null, crowdG = null, crowdSrc = null, crowdBP = null, crowdLFO = null,
        engOsc = null, engG = null, engF = null, musicG = null, dead = false;
    var mus = { state: 'off', next: 0, step: 0, inten: 0.5 };
    function ac() {
      if (dead) return null;
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain(); master.gain.value = 0.85; master.connect(ctx.destination);
          musicG = ctx.createGain(); musicG.gain.value = 0.5; musicG.connect(master);
        } catch (e) { dead = true; return null }
      }
      if (ctx.state === 'suspended') { try { ctx.resume() } catch (e) {} }
      return ctx;
    }
    var _nb = null;
    function noiseBuf() {
      if (_nb) return _nb;
      var c = ac(); if (!c) return null;
      _nb = c.createBuffer(1, c.sampleRate * 1.6, c.sampleRate);
      var d = _nb.getChannelData(0), i;
      for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return _nb;
    }
    /* تخت تماشاگر — نویز فیلترشده با شدت پویا */
    function crowd(on) {
      var c = ac(); if (!c) return;
      if (on && !crowdSrc) {
        crowdSrc = c.createBufferSource(); crowdSrc.buffer = noiseBuf(); crowdSrc.loop = true;
        crowdBP = c.createBiquadFilter(); crowdBP.type = 'bandpass'; crowdBP.frequency.value = 520; crowdBP.Q.value = 0.7;
        crowdG = c.createGain(); crowdG.gain.value = 0.0;
        crowdLFO = c.createOscillator(); var lg = c.createGain(); lg.gain.value = 90;
        crowdLFO.frequency.value = 0.28; crowdLFO.connect(lg); lg.connect(crowdBP.frequency); crowdLFO.start();
        crowdSrc.connect(crowdBP); crowdBP.connect(crowdG); crowdG.connect(master); crowdSrc.start();
      } else if (!on && crowdSrc) {
        try { crowdG.gain.setTargetAtTime(0.0001, c.currentTime, 0.2); var s = crowdSrc, l = crowdLFO;
          setTimeout(function () { try { s.stop(); l.stop() } catch (e) {} }, 700); } catch (e) {}
        crowdSrc = null; crowdG = null; crowdLFO = null;
      }
    }
    function setIntensity(v) { /* 0..1 — تنش مسابقه */
      var c = ac(); if (!c || !crowdG) return;
      try { crowdG.gain.setTargetAtTime(0.05 + v * 0.3, c.currentTime, 0.4) } catch (e) {}
    }
    function blip(f0, f1, dur, type, vol, when) {
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (when || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
    }
    function noiseHit(dur, f, vol, type) {
      var c = ac(); if (!c || !noiseBuf()) return;
      var s = c.createBufferSource(); s.buffer = noiseBuf();
      var fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = f;
      var g = c.createGain(); var t = c.currentTime;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
    }
    var api = {
      unlock: function () { ac() },
      crowdOn: function () { crowd(true) },
      crowdOff: function () { crowd(false) },
      intensity: setIntensity,
      setIntensity: setIntensity,
      gun: function () { noiseHit(0.22, 900, 0.75); blip(160, 40, 0.3, 'sine', 0.8); blip(1200, 300, 0.08, 'square', 0.22) },
      step: function (side, eff) { noiseHit(0.055, eff ? 1500 : 1000, eff ? 0.16 : 0.1, 'bandpass'); if (eff) blip(90, 55, 0.06, 'sine', 0.1) },
      whoosh: function (hi) { noiseHit(0.24, hi ? 2200 : 700, 0.3, 'bandpass') },
      punch: function (big) { blip(190, 42, 0.16, 'sine', big ? 0.85 : 0.55); noiseHit(0.1, big ? 2400 : 1500, big ? 0.4 : 0.25, 'highpass') },
      block: function () { noiseHit(0.09, 1300, 0.3, 'bandpass'); blip(300, 180, 0.09, 'triangle', 0.3) },
      arrowShot: function () { noiseHit(0.3, 3200, 0.28, 'highpass'); blip(700, 180, 0.12, 'triangle', 0.18) },
      arrowHit: function (ring) { blip(240 + ring * 46, 140, 0.2, 'sine', 0.5); noiseHit(0.07, 2000, 0.22) },
      splash: function (big) { noiseHit(big ? 0.5 : 0.26, big ? 1500 : 2100, big ? 0.5 : 0.3, 'bandpass') },
      bell: function () { blip(880, 860, 1.1, 'sine', 0.4); blip(1320, 1300, 0.8, 'sine', 0.16) },
      turnOk: function (q) { blip(420 + q * 320, 620 + q * 400, 0.18, 'triangle', 0.4) },
      ko: function () { blip(120, 30, 0.7, 'sine', 0.9); noiseHit(0.4, 600, 0.5) },
      fanfare: function (win) {
        var seq = win ? [[523, 0], [659, 0.13], [784, 0.26], [1047, 0.42]] : [[392, 0], [330, 0.18], [262, 0.38]];
        for (var i = 0; i < seq.length; i++) (function (n) {
          blip(n[0], n[0], 0.42, 'sawtooth', 0.16, n[1]); blip(n[0] * 1.5, n[0] * 1.5, 0.3, 'triangle', 0.07, n[1]);
        })(seq[i]);
      },
      engine: function (on) {
        var c = ac(); if (!c) return;
        if (on && !engOsc) {
          engOsc = c.createOscillator(); engOsc.type = 'sawtooth'; engOsc.frequency.value = 70;
          engF = c.createBiquadFilter(); engF.type = 'lowpass'; engF.frequency.value = 420;
          engG = c.createGain(); engG.gain.value = 0.09;
          engOsc.connect(engF); engF.connect(engG); engG.connect(master); engOsc.start();
        } else if (!on && engOsc) {
          var o = engOsc; try { engG.gain.setTargetAtTime(0.0001, c.currentTime, 0.15); setTimeout(function () { try { o.stop() } catch (e) {} }, 500) } catch (e) {}
          engOsc = null;
        }
      },
      rev: function (v) { /* v 0..1 سرعت موتور */
        var c = ac(); if (!c || !engOsc) return;
        try { engOsc.frequency.setTargetAtTime(62 + v * 165, c.currentTime, 0.12); engF.frequency.setTargetAtTime(320 + v * 900, c.currentTime, 0.2) } catch (e) {}
      },
      /* موسیقی حالت‌دار — سکوئنسر روی tick جلسه (بدون setInterval) */
      music: function (st) { mus.state = st; mus.step = 0; var c = ac(); if (c) mus.next = c.currentTime + 0.08 },
      tick: function () {
        var c = ac(); if (!c || mus.state === 'off' || mus.state === 'run') return;
        if (c.currentTime < mus.next - 0.12) return;
        var bpm = mus.state === 'medal' ? 84 : mus.state === 'pre' ? 96 : 108;
        var spb = 60 / bpm / 2;
        var sc = mus.state === 'win' || mus.state === 'medal' ? [523, 659, 784, 880, 1047] : mus.state === 'lose' ? [330, 294, 262, 220] : [392, 440, 523, 587, 659];
        if (mus.state === 'lose' && mus.step > 7) { mus.state = 'off'; return }
        var n = sc[mus.step % sc.length];
        blip(n / 2, n / 2, spb * 1.6, 'triangle', 0.085, mus.next - c.currentTime);
        if (mus.step % 4 === 0) blip(n / 4, n / 4, spb * 2, 'sine', 0.1, mus.next - c.currentTime);
        mus.step++; mus.next = Math.max(mus.next + spb, c.currentTime + 0.05);
      },
      pause: function () { try { if (ctx && ctx.state === 'running') ctx.suspend() } catch (e) {} },
      resume: function () { try { if (ctx && ctx.state === 'suspended') ctx.resume() } catch (e) {} },
      kill: function () {
        dead = true;
        try { crowd(false); api.engine(false); if (ctx) { try { ctx.suspend() } catch (e) {} } } catch (e) {}
      }
    };
    return api;
  })();

  /* ---------- ۴) کارگردان دوربین سینمایی ---------- */
  function camRig(cam) {
    var cur = { x: 0, y: 2.2, z: 9, tx: 0, ty: 1, tz: 0, fov: 56 }, tgt = { x: 0, y: 2.2, z: 9, tx: 0, ty: 1, tz: 0, fov: 56 };
    var kick = 0, kickAx = 'x', shakeAmp = 0;
    var rig = {
      go: function (x, y, z, tx, ty, tz, dt, k, fov) {
        var f = dampK(dt || 16, k || 4);
        cur.x = lerp(cur.x, x, f); cur.y = lerp(cur.y, y, f); cur.z = lerp(cur.z, z, f);
        cur.tx = lerp(cur.tx, tx, f); cur.ty = lerp(cur.ty, ty, f); cur.tz = lerp(cur.tz, tz, f);
        if (fov) cur.fov = lerp(cur.fov, fov, f * 0.8);
        rig.apply();
      },
      snap: function (x, y, z, tx, ty, tz, fov) {
        cur = { x: x, y: y, z: z, tx: tx, ty: ty, tz: tz, fov: fov || 56 };
        tgt = { x: x, y: y, z: z, tx: tx, ty: ty, tz: tz, fov: fov || 56 };
        rig.apply();
      },
      kick: function (a, ax) { kick = Math.min(0.5, kick + a); kickAx = ax || 'x' },
      shake: function (a) { shakeAmp = Math.min(0.24, shakeAmp + a) }, /* کم و هدفمند */
      fov: function (f, dt) { cur.fov = lerp(cur.fov, f, dampK(dt || 16, 3)); rig.apply() },
      tick: function (dt) {
        var f = dampK(dt, 4.2);
        kick *= Math.exp(-dt / 90); shakeAmp *= Math.exp(-dt / 260);
        rig.apply();
        return kick + shakeAmp;
      },
      apply: function () {
        var sx = shakeAmp > 0.002 ? (Math.random() - 0.5) * shakeAmp : 0;
        var sy = shakeAmp > 0.002 ? (Math.random() - 0.5) * shakeAmp : 0;
        cam.position.set(cur.x + sx, cur.y + sy + kick * 0.4, cur.z);
        cam.lookAt(cur.tx, cur.ty + (kickAx === 'y' ? kick : 0), cur.tz);
        cam.rotation.z += kick * 0.12 * (kickAx === 'x' ? 1 : -1) + sx * 0.2;
        if (Math.abs(cam.fov - cur.fov) > 0.05) { cam.fov = cur.fov; cam.updateProjectionMatrix() }
      }
    };
    return rig;
  }
  /* ---------- ۵) ورزشکار ۲.۰ — اسکلت سلسله‌مراتبی کامل + سیستم پوز ---------- */
  var SKINS = [0x8d5524, 0xa9714b, 0xc68642, 0xe0ac69, 0xf1c27d];
  var HAIRS = [0x1a1a1a, 0x2d1b0e, 0x4a2c10, 0x0d0d0d, 0x3b2f2f];
  function lamb(T3, color, flat) { return new T3.MeshLambertMaterial({ color: color, flatShading: !!flat }) }
  function box(T3, w, h, d, mat) { return new T3.Mesh(new T3.BoxGeometry(w, h, d), mat) }
  function cyl(T3, rt, rb, h, seg, mat) { return new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 8), mat) }
  function sph(T3, r, mat, seg) { return new T3.Mesh(new T3.SphereGeometry(r, seg || 10, seg ? Math.max(6, seg - 2) : 8), mat) }
  function cap(T3, r, len, mat) { return new T3.Mesh(new T3.CapsuleGeometry(r, len, 3, 8), mat) }

  /* کانال‌های پوز — هدف‌ها با میرایی به سمت آن‌ها می‌روند = میکس انیمیشن نرم */
  var CH = ['hipsY', 'hipsRX', 'hipsRY', 'hipsRZ', 'spineX', 'spineY', 'chestX', 'headX', 'headY',
    'shLX', 'shLY', 'shLZ', 'elLX', 'shRX', 'shRY', 'shRZ', 'elRX',
    'hipLX', 'hipLZ', 'kneeLX', 'ankLX', 'hipRX', 'hipRZ', 'kneeRX', 'ankRX', 'rootZ'];
  function newTargets() { var t = {}, i; for (i = 0; i < CH.length; i++) t[CH[i]] = 0; t.hipsY = 0.98; return t }
  function buildAthlete(T3, opt) {
    opt = opt || {};
    var skin = lamb(T3, opt.skin || SKINS[(Math.random() * SKINS.length) | 0], true);
    var jersey = lamb(T3, opt.jersey || 0xff4d6d, true);
    var shorts = lamb(T3, opt.shorts || 0x14284e, true);
    var shoe = lamb(T3, opt.shoe || 0xf2f4f8, true);
    var hairM = lamb(T3, opt.hair || HAIRS[(Math.random() * HAIRS.length) | 0], true);
    var root = new T3.Group();
    var hips = new T3.Group(); hips.position.y = 0.98; root.add(hips);
    var pelvis = box(T3, 0.3, 0.16, 0.19, shorts); hips.add(pelvis);
    var spine = new T3.Group(); spine.position.y = 0.08; hips.add(spine);
    var torso = cap(T3, 0.14, 0.3, jersey); torso.position.y = 0.2; spine.add(torso);
    var chest = new T3.Group(); chest.position.y = 0.38; spine.add(chest);
    var chestM = box(T3, 0.3, 0.16, 0.2, jersey); chestM.position.y = 0.04; chest.add(chestM);
    var neck = new T3.Group(); neck.position.y = 0.13; chest.add(neck);
    var head = new T3.Group(); head.position.y = 0.06; neck.add(head);
    var headM = sph(T3, 0.105, skin, 10); headM.position.y = 0.09; head.add(headM);
    var hair = sph(T3, 0.108, hairM, 8); hair.scale.set(1, 0.72, 1); hair.position.y = 0.13; head.add(hair);
    /* دست‌ها — شانه → آرنج → دست */
    function arm(side) {
      var sh = new T3.Group(); sh.position.set(0.19 * side, 0.1, 0); chest.add(sh);
      var up = cap(T3, 0.05, 0.2, jersey); up.position.y = -0.14; sh.add(up);
      var el = new T3.Group(); el.position.y = -0.28; sh.add(el);
      var lo = cap(T3, 0.042, 0.19, skin); lo.position.y = -0.12; el.add(lo);
      var hand = sph(T3, 0.05, skin, 6); hand.position.y = -0.26; el.add(hand);
      return { sh: sh, el: el };
    }
    var armL = arm(1), armR = arm(-1);
    /* پاها — ران → زانو → مچ */
    function leg(side) {
      var hp = new T3.Group(); hp.position.set(0.095 * side, -0.06, 0); hips.add(hp);
      var th = cap(T3, 0.065, 0.24, shorts); th.position.y = -0.17; hp.add(th);
      var kn = new T3.Group(); kn.position.y = -0.36; hp.add(kn);
      var sh = cap(T3, 0.05, 0.22, skin); sh.position.y = -0.16; kn.add(sh);
      var an = new T3.Group(); an.position.y = -0.34; kn.add(an);
      var ft = box(T3, 0.09, 0.06, 0.22, shoe); ft.position.set(0, -0.03, 0.05); an.add(ft);
      return { hip: hp, knee: kn, ank: an };
    }
    var legL = leg(1), legR = leg(-1);
    /* سایه‌ی بلابی — بدون سایه‌ی واقعی */
    var shGeo = new T3.CircleGeometry(0.42, 14);
    var shMat = new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
    var blob = new T3.Mesh(shGeo, shMat); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; root.add(blob);
    var J = {
      root: root, hips: hips, spine: spine, chest: chest, head: head,
      armL: armL, armR: armR, legL: legL, legR: legR, blob: blob,
      T: newTargets(), C: newTargets(), fat: 0, br: Math.random() * 9 /* خستگی + فاز تنفس */
    };
    /* اعمال پوز — میرایی مستقل از فریم = میکس نرم بین حالت‌ها */
    J.apply = function (dt) {
      var k = dampK(dt, 16), T = J.T, C = J.C, i, c;
      for (i = 0; i < CH.length; i++) { c = CH[i]; C[c] = lerp(C[c], T[c], k) }
      hips.position.y = C.hipsY; hips.rotation.set(C.hipsRX, C.hipsRY, C.hipsRZ);
      spine.rotation.set(C.spineX, C.spineY, 0);
      chest.rotation.x = C.chestX;
      head.rotation.set(C.headX, C.headY, 0);
      armL.sh.rotation.set(C.shLX, C.shLY, C.shLZ); armL.el.rotation.x = C.elLX;
      armR.sh.rotation.set(C.shRX, C.shRY, C.shRZ); armR.el.rotation.x = C.elRX;
      legL.hip.rotation.set(C.hipLX, 0, C.hipLZ); legL.knee.rotation.x = C.kneeLX; legL.ank.rotation.x = C.ankLX;
      legR.hip.rotation.set(C.hipRX, 0, C.hipRZ); legR.knee.rotation.x = C.kneeRX; legR.ank.rotation.x = C.ankRX;
      root.rotation.z = C.rootZ;
      var ry = Math.max(0, (root.position.y || 0));
      blob.scale.setScalar(1 - Math.min(0.5, ry * 0.3));
    };
    J.reset = function () { J.T = newTargets(); J.C = newTargets() };
    if (opt.scale) root.scale.setScalar(opt.scale);
    root.userData.J = J;
    return root;
  }
  function tg(J, o) { var k; for (k in o) J.T[k] = o[k] }

  /* ---- کتابخانه‌ی پوز (IDLE/READY/START/FINISH/CELEBRATE/LOSE/TIRED/FOCUS/SWIM/...) ---- */
  function idlePose(J, t) {
    var b = Math.sin(t / 850 + J.br) * 0.05;
    tg(J, { hipsY: 0.98, spineX: 0.04 + b * 0.3, chestX: b, headX: -0.03,
      shLX: 0.1, shLZ: 0.14, elLX: -0.35, shRX: 0.1, shRZ: -0.14, elRX: -0.35,
      hipLX: 0.02, kneeLX: 0.05, hipRX: -0.02, kneeRX: 0.05 });
  }
  function walkPose(J, ph) {
    var s = Math.sin(ph), c = Math.sin(ph + Math.PI);
    tg(J, { hipsY: 0.96 + Math.abs(s) * 0.025, hipsRY: s * 0.06, spineX: 0.06,
      shLX: c * 0.45, elLX: -0.5, shRX: s * 0.45, elRX: -0.5,
      hipLX: s * 0.42, kneeLX: Math.max(0.1, -s * 0.7), hipRX: c * 0.42, kneeRX: Math.max(0.1, -c * 0.7) });
  }
  function blocksPose(J, set01) { /* marks → set تدریجی */
    var s = clamp(set01, 0, 1);
    tg(J, { hipsY: 0.98 - s * 0.4, spineX: 0.25 + s * 0.75, headX: -0.25 * s,
      shLX: -0.9 * s, shLZ: 0.05, elLX: -0.35 * s, shRX: -0.9 * s, shRZ: -0.05, elRX: -0.35 * s,
      hipLX: -0.9 * s, kneeLX: 1.15 * s, hipRX: 0.55 * s, kneeRX: 0.55 * s, ankLX: -0.4 * s });
  }
  function runPose(J, ph, fat, power) {
    var f = clamp(fat || 0, 0, 1), amp = (0.85 - f * 0.22) * (power || 1);
    var s = Math.sin(ph), c = Math.sin(ph + Math.PI);
    tg(J, { hipsY: 0.94 + Math.abs(s) * 0.045, spineX: 0.16 + f * 0.28, headX: -0.12 - f * 0.1,
      shLX: c * 0.95 * amp, elLX: -1.15 - Math.abs(c) * 0.3, shRX: s * 0.95 * amp, elRX: -1.15 - Math.abs(s) * 0.3,
      hipLX: s * amp, kneeLX: Math.max(0.15, -s) * 1.5 * amp + 0.15, ankLX: -0.15 + s * 0.2,
      hipRX: c * amp, kneeRX: Math.max(0.15, -c) * 1.5 * amp + 0.15, ankRX: -0.15 + c * 0.2, rootZ: s * 0.02 });
  }
  function sprintFinishPose(J) { /* شکستن نوار — سینه به جلو */
    tg(J, { spineX: 0.55, headX: -0.3, shLX: -2.2, shRX: -1.9, elLX: -0.4, elRX: -0.6, hipsY: 0.92 });
  }
  function tiredPose(J, t) {
    var b = Math.sin(t / 520 + J.br) * 0.09;
    tg(J, { hipsY: 0.78, spineX: 0.72 + b * 0.4, headX: 0.22,
      shLX: -0.85, shLZ: 0.3, elLX: -0.85, shRX: -0.85, shRZ: -0.3, elRX: -0.85,
      hipLX: 0.12, kneeLX: 0.3, hipRX: 0.12, kneeRX: 0.3 });
  }
  function celebratePose(J, t) {
    var h = Math.abs(Math.sin(t / 300)) * 0.16, w = Math.sin(t / 220) * 0.25;
    tg(J, { hipsY: 0.98 + h, spineX: -0.12, headX: -0.2,
      shLX: -2.85 + w, shLZ: 0.35, elLX: -0.3, shRX: -2.85 - w, shRZ: -0.35, elRX: -0.3,
      hipLX: -0.1, kneeLX: 0.25, hipRX: -0.1, kneeRX: 0.25 });
  }
  function defeatPose(J) {
    tg(J, { hipsY: 0.92, spineX: 0.34, headX: 0.4,
      shLX: 0.2, shLZ: 0.1, elLX: -0.15, shRX: 0.2, shRZ: -0.1, elRX: -0.15,
      hipLX: 0.05, kneeLX: 0.12, hipRX: 0.05, kneeRX: 0.12 });
  }
  /* ---- شنا: کرال سینه — چرخش کامل شانه + فلاتر + غلتک بدن ---- */
  function swimPose(J, ph, fat) {
    var f = clamp(fat || 0, 0, 1);
    var aL = ph % TAU, aR = (ph + Math.PI) % TAU;
    function armX(a) { return -1.4 - Math.cos(a) * 1.45 }
    var roll = Math.sin(ph) * 0.28;
    tg(J, { hipsY: 0.02, hipsRX: 0, spineX: 0, chestX: 0.15, headX: f * 0.5,
      shLX: armX(aL), shLZ: 0.2 + roll * 0.4, elLX: -0.35 - Math.max(0, Math.sin(aL)) * 0.8,
      shRX: armX(aR), shRZ: -0.2 + roll * 0.4, elRX: -0.35 - Math.max(0, Math.sin(aR)) * 0.8,
      hipLX: Math.sin(ph * 2) * 0.32, kneeLX: Math.max(0, Math.sin(ph * 2)) * 0.5,
      hipRX: Math.sin(ph * 2 + Math.PI) * 0.32, kneeRX: Math.max(0, Math.sin(ph * 2 + Math.PI)) * 0.5,
      hipsRY: roll * 0.5 });
    J.root.rotation.x = -Math.PI / 2 + 0.06; /* خوابیده روی آب */
  }
  function divePose(J, p) { /* p 0..1 — نشست → شیرجه */
    if (p < 0.35) { var s = p / 0.35;
      tg(J, { hipsY: 0.98 - s * 0.34, spineX: 0.4 + s * 0.4, headX: -0.2,
        shLX: -0.5 - s * 1.6, shRX: -0.5 - s * 1.6, elLX: -0.3, elRX: -0.3,
        hipLX: -1.0 * s, kneeLX: 1.3 * s, hipRX: -0.9 * s, kneeRX: 1.2 * s });
    } else { var s2 = (p - 0.35) / 0.65;
      tg(J, { hipsY: 0.64, spineX: 0.8 - s2 * 0.8, headX: -0.2 + s2 * 0.1,
        shLX: -2.9, shLZ: 0.04, elLX: -0.05, shRX: -2.9, shRZ: -0.04, elRX: -0.05,
        hipLX: -0.25 - s2 * 0.15, kneeLX: 0.2, hipRX: -0.2 - s2 * 0.15, kneeRX: 0.25 });
      J.root.rotation.x = -s2 * 1.15;
    }
  }
  function glidePose(J) {
    J.root.rotation.x = -Math.PI / 2 + 0.05;
    tg(J, { hipsY: 0.02, shLX: -2.92, shLZ: 0.02, elLX: -0.04, shRX: -2.92, shRZ: -0.02, elRX: -0.04,
      hipLX: 0.05, kneeLX: 0.08, hipRX: 0.05, kneeRX: 0.08, headX: 0.05 });
  }
  function turnPose(J, p) { /* p 0..1 — چرخش دیوار: جمع → رانش */
    if (p < 0.5) { var s = p / 0.5;
      tg(J, { hipsY: 0.02, hipLX: -1.8 * s, kneeLX: 2.1 * s, hipRX: -1.8 * s, kneeRX: 2.1 * s,
        shLX: -1.2 * s, elLX: -1.8 * s, shRX: -1.2 * s, elRX: -1.8 * s, headX: 0.4 * s });
      J.root.rotation.x = -Math.PI / 2 - s * 1.1;
    } else { var s2 = (p - 0.5) / 0.5;
      J.root.rotation.x = -Math.PI / 2 - 1.1 + s2 * 1.15;
      tg(J, { hipsY: 0.02, hipLX: -0.3, kneeLX: 0.35, hipRX: -0.3, kneeRX: 0.35,
        shLX: -2.9, elLX: -0.05, shRX: -2.9, elRX: -0.05 });
    }
  }
  /* ---- بوکس: گارد/تله‌گراف/ضربه/دفاع/ناک‌داون نمایشی ---- */
  function guardPose(J, hi, sway) {
    var h = hi ? 0.22 : 0;
    tg(J, { hipsY: 0.9, hipsRY: sway || 0, spineX: 0.14, headX: 0.08,
      shLX: -1.35 - h, shLY: 0.55, shLZ: 0.28, elLX: -2.1, shRX: -1.3 - h, shRY: -0.55, shRZ: -0.28, elRX: -2.1,
      hipLX: 0.16, kneeLX: 0.3, hipRX: -0.12, kneeRX: 0.34 });
  }
  function windupPose(J, hi, p) { /* تله‌گراف خوانا — مشت عقب + چرخش تنه */
    var s = clamp(p, 0, 1);
    if (hi) tg(J, { hipsY: 0.9, hipsRY: -0.3 * s, spineY: -0.35 * s, headX: 0.05,
      shRX: -1.75 * s + 0.35 * s, shRY: -0.85 * s, shRZ: -0.2, elRX: -2.35 * s,
      shLX: -1.5, shLY: 0.6, elLX: -2.05, hipLX: 0.15, kneeLX: 0.3, hipRX: -0.1, kneeRX: 0.34 });
    else tg(J, { hipsY: 0.82, hipsRY: -0.25 * s, spineX: 0.35 * s, spineY: -0.3 * s, headX: 0.3,
      shRX: -0.55 * s, shRY: -0.8 * s, elRX: -2.4 * s,
      shLX: -1.45, shLY: 0.6, elLX: -2.0, hipLX: 0.2, kneeLX: 0.55, hipRX: -0.15, kneeRX: 0.5 });
  }
  function punchPose(J, hi, p) { /* ضربه‌ی حریف — بزن-برگشت */
    var s = Math.sin(clamp(p, 0, 1) * Math.PI);
    if (hi) tg(J, { hipsY: 0.9, hipsRY: 0.4 * s, spineY: 0.45 * s,
      shRX: -1.55 * s - 0.3, shRY: 0.2, elRX: -2.1 + 2.0 * s,
      shLX: -1.5, shLY: 0.6, elLX: -2.1, headX: -0.05, hipRX: -0.3 * s, kneeRX: 0.3 });
    else tg(J, { hipsY: 0.8, spineX: 0.4 * s, hipsRY: 0.35 * s,
      shRX: -0.75 * s, shRY: 0.2, elRX: -2.2 + 2.1 * s,
      shLX: -1.4, elLX: -2.1, headX: 0.25, hipRX: -0.35 * s, kneeRX: 0.5 });
  }
  function playerPunch(J, hi, p) { /* کانتر بازیکن */
    var s = Math.sin(clamp(p, 0, 1) * Math.PI);
    tg(J, { hipsY: 0.88, hipsRY: -0.45 * s, spineY: -0.5 * s,
      shLX: -1.6 * s - 0.3, shLY: 0.3, elLX: -2.2 + 2.15 * s,
      shRX: -1.3, shRY: -0.55, elRX: -2.0, headX: -0.1, hipLX: -0.25 * s, kneeLX: 0.3 });
  }
  function blockPose(J, hi, p) { /* دفاع — ساعد سپر */
    var s = clamp(p, 0, 1), h = hi ? 0.3 : -0.55;
    tg(J, { hipsY: 0.88, spineX: hi ? 0.1 : 0.3,
      shLX: -1.6 + h, shLY: 0.5, shLZ: 0.45, elLX: -2.35 * s - 0.2, shRX: -1.6 + h, shRY: -0.5, shRZ: -0.45, elRX: -2.35 * s - 0.2,
      headX: hi ? 0.15 : 0.3, kneeLX: 0.4, kneeRX: 0.4 });
  }
  function hitPose(J, hi, p) { /* خوردن ضربه */
    var s = Math.sin(clamp(p, 0, 1) * Math.PI);
    tg(J, { hipsY: 0.86, spineX: hi ? -0.38 * s : 0.5 * s, headX: hi ? -0.55 * s : 0.5 * s,
      shLX: -0.9, shLY: 0.4, elLX: -1.6, shRX: -0.9, shRY: -0.4, elRX: -1.6,
      hipLX: 0.2, kneeLX: 0.45, hipRX: -0.1, kneeRX: 0.4, rootZ: 0.12 * s });
  }
  function knockdownPose(J, p) { /* نمایشی — بدون راگدول سنگین */
    var s = clamp(p, 0, 1);
    J.root.rotation.x = -1.45 * s;
    J.root.position.y = -0.72 * s;
    tg(J, { hipsY: 0.9, spineX: 0.1, headX: -0.3 * s,
      shLX: -0.4 - s, elLX: -0.5, shRX: -0.4 - s, elRX: -0.5,
      hipLX: 0.3 * s, kneeLX: 0.6 * s, hipRX: 0.4 * s, kneeRX: 0.7 * s });
  }
  /* ---- کمان: کشیدن و نشانه‌گیری ---- */
  function drawPose(J, pull) {
    var s = clamp(pull, 0, 1);
    tg(J, { hipsY: 0.97, spineY: -0.35 * s, chestX: 0.05, headY: -0.4 * s,
      shLX: -1.52, shLY: 0.05, shLZ: 0.05, elLX: -0.08,
      shRX: -0.95 - 0.5 * s, shRY: -0.5, shRZ: -0.3, elRX: -0.6 - 1.75 * s,
      hipLX: 0.1, hipRX: -0.28, kneeLX: 0.08, kneeRX: 0.14 });
  }
  function drivePose(J, steer) { /* راننده رالی — فرمان */
    var st = clamp(steer || 0, -1, 1);
    tg(J, { hipsY: 0.62, spineX: 0.3, headX: 0.08,
      shLX: -1.15 + st * 0.25, shLY: 0.62, elLX: -1.5, shRX: -1.15 + st * 0.25, shRY: -0.62, elRX: -1.5,
      hipLX: 1.35, kneeLX: 1.45, hipRX: 1.35, kneeRX: 1.45 });
  }

  /* ---------- ۶) VFX استخرشده — ذرات نقطه‌ای + کانفتی (بدون اسپم) ---------- */
  var _softTex = null;
  function softTex(T3) {
    if (_softTex) return _softTex;
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _softTex = new T3.CanvasTexture(c);
    return _softTex;
  }
  function makeVFX(T3, scene, cap) {
    cap = Math.max(60, cap | 0);
    function mkSys(n, blending, size, opacity) {
      var geo = new T3.BufferGeometry();
      var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), i;
      for (i = 0; i < n; i++) pos[i * 3 + 1] = -999;
      geo.setAttribute('position', new T3.BufferAttribute(pos, 3));
      geo.setAttribute('color', new T3.BufferAttribute(col, 3));
      var mat = new T3.PointsMaterial({ size: size, map: softTex(T3), vertexColors: true, transparent: true, opacity: opacity, depthWrite: false, blending: blending, sizeAttenuation: true });
      var pts = new T3.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
      var vel = new Float32Array(n * 3), life = new Float32Array(n), maxL = new Float32Array(n), grav = new Float32Array(n), cur = 0;
      return { geo: geo, pos: pos, col: col, vel: vel, life: life, maxL: maxL, grav: grav, n: n, cur: 0, pts: pts };
    }
    var addS = mkSys(Math.ceil(cap * 0.7), T3.AdditiveBlending, 0.16, 0.95);
    var softS = mkSys(Math.ceil(cap * 0.3), T3.NormalBlending, 0.22, 0.6);
    function cHex(h) { return [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255] }
    function emit(S, x, y, z, n, o) {
      o = o || {};
      var i, j = S.cur, c = cHex(o.col || 0xffffff);
      for (i = 0; i < n; i++) {
        j = (j + 1) % S.n; S.cur = j;
        S.pos[j * 3] = x + (Math.random() - 0.5) * (o.spread || 0.3);
        S.pos[j * 3 + 1] = y + (Math.random() - 0.5) * (o.spread || 0.3);
        S.pos[j * 3 + 2] = z + (Math.random() - 0.5) * (o.spread || 0.3);
        var sp = o.v || 1;
        S.vel[j * 3] = (Math.random() - 0.5) * sp + (o.vx || 0);
        S.vel[j * 3 + 1] = (Math.random() * 0.7 + 0.3) * sp * (o.up || 1) + (o.vy || 0);
        S.vel[j * 3 + 2] = (Math.random() - 0.5) * sp + (o.vz || 0);
        S.life[j] = S.maxL[j] = (o.life || 600) * (0.7 + Math.random() * 0.6);
        S.grav[j] = o.grav != null ? o.grav : 4.5;
        S.col[j * 3] = c[0]; S.col[j * 3 + 1] = c[1]; S.col[j * 3 + 2] = c[2];
      }
      S.geo.attributes.color.needsUpdate = true;
    }
    function tick(S, dt) {
      var ds = dt / 1000, i, a;
      for (a = 0; a < 2; a++) {
        var s = a ? softS : addS, alive = false;
        for (i = 0; i < s.n; i++) {
          if (s.life[i] <= 0) continue;
          alive = true; s.life[i] -= dt;
          if (s.life[i] <= 0) { s.pos[i * 3 + 1] = -999; continue }
          s.vel[i * 3 + 1] -= s.grav[i] * ds;
          s.pos[i * 3] += s.vel[i * 3] * ds; s.pos[i * 3 + 1] += s.vel[i * 3 + 1] * ds; s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * ds;
          var f = s.life[i] / s.maxL[i];
          s.col[i * 3] *= (0.9 + f * 0.1); s.col[i * 3 + 1] *= (0.9 + f * 0.1); s.col[i * 3 + 2] *= (0.9 + f * 0.1);
        }
        if (alive) { s.geo.attributes.position.needsUpdate = true; s.geo.attributes.color.needsUpdate = true }
      }
    }
    /* کانفتی مراسم — InstancedMesh چهارگوش‌های چرخان */
    var confN = Q.tier === 0 ? 60 : 110, conf = null, confD = [];
    function makeConf() {
      var geo = new T3.PlaneGeometry(0.09, 0.14);
      var mat = new T3.MeshBasicMaterial({ vertexColors: false, side: T3.DoubleSide });
      var inst = new T3.InstancedMesh(geo, mat, confN);
      var pal = [0xffd75e, 0x7fd8ff, 0xff6b8f, 0x7dffb0, 0xf6f7fb, 0xffb02e];
      var col = new T3.Color();
      for (var i = 0; i < confN; i++) {
        confD.push({ x: (Math.random() - 0.5) * 8, y: 6 + Math.random() * 5, z: (Math.random() - 0.5) * 6, vy: -(0.7 + Math.random() * 1.2), rx: Math.random() * TAU, rxs: (Math.random() - 0.5) * 5, ry: Math.random() * TAU, rys: (Math.random() - 0.5) * 4 });
        col.setHex(pal[i % pal.length]); inst.setColorAt(i, col);
      }
      inst.instanceMatrix.needsUpdate = true;
      return inst;
    }
    return {
      burst: function (x, y, z, n, col, o) { emit(addS, x, y, z, n, Object.assign({ col: col, v: 2.2, life: 550, grav: 3.5 }, o || {})) },
      dust: function (x, y, z, n, col) { emit(softS, x, y, z, n, { col: col || 0x9c8468, v: 0.9, life: 700, grav: 0.6, spread: 0.5, up: 0.5 }) },
      smoke: function (x, y, z, n) { emit(softS, x, y, z, n, { col: 0x777d88, v: 0.5, life: 900, grav: -0.4, spread: 0.35, up: 0.7 }) },
      speed: function (x, y, z, col) { emit(addS, x, y, z, 2, { col: col || 0x9fd8ff, v: 0.4, life: 320, grav: 0, vx: 0, vz: 6 }) },
      splash: function (x, y, z, big) { emit(addS, x, y, z, big ? 26 : 12, { col: 0xbfeaff, v: big ? 2.6 : 1.6, life: 600, grav: 5.5, spread: big ? 0.8 : 0.4 }); emit(softS, x, y, z, 6, { col: 0xffffff, v: 1.2, life: 500, grav: 4 }) },
      bubble: function (x, y, z, n) { emit(addS, x, y, z, n || 4, { col: 0x9fd8ff, v: 0.3, life: 900, grav: -1.6, spread: 0.4 }) },
      sweat: function (x, y, z) { emit(addS, x, y, z, 2, { col: 0xbfeaff, v: 0.7, life: 450, grav: 5 }) },
      confettiOn: function (scene2) { if (!conf) { conf = makeConf(); (scene2 || scene).add(conf) } },
      confettiTick: function (dt, scene2) {
        if (!conf) return;
        var ds = dt / 1000;
        var dummy = new (RT.three.Object3D)();
        for (var i = 0; i < confN; i++) {
          var p = confD[i];
          p.y += p.vy * ds; p.rx += p.rxs * ds; p.ry += p.rys * ds;
          if (p.y < 0.05) { p.y = 6 + Math.random() * 4; p.x = (Math.random() - 0.5) * 8 }
          dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(p.rx, p.ry, 0);
          dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
        }
        conf.instanceMatrix.needsUpdate = true;
      },
      confettiOff: function () { if (conf) { scene.remove(conf); conf = null; confD.length = 0 } },
      tick: function (dt) { tick(null, dt) }
    };
  }

  /* ---------- ۷) سازنده‌های محیط — استادیوم/استخر/رینگ/میدان/جاده ---------- */
  function canvasTex(w, h, fn) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    var t = new RT.three.CanvasTexture(c);
    t.anisotropy = 2;
    return t;
  }
  function makeSky(T3, scene, topCol, botCol, fogFar) {
    var tex = canvasTex(16, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, topCol); gr.addColorStop(0.62, botCol); gr.addColorStop(1, botCol);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var sky = new T3.Mesh(new T3.SphereGeometry(320, 18, 12), new T3.MeshBasicMaterial({ map: tex, side: T3.BackSide, fog: false, depthWrite: false }));
    scene.add(sky);
    scene.fog = new T3.Fog(new T3.Color(botCol), fogFar * 0.35, fogFar);
    return sky;
  }
  function makeMountains(T3, scene, dist, colHex) {
    var g = new T3.Group(), mat = lamb(T3, colHex, true), i;
    for (i = 0; i < 14; i++) {
      var a = i / 14 * TAU, r = dist * (0.85 + Math.random() * 0.3);
      var m = new T3.Mesh(new T3.ConeGeometry(26 + Math.random() * 34, 22 + Math.random() * 30, 5), mat);
      m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      m.rotation.y = Math.random() * TAU;
      g.add(m);
    }
    scene.add(g); return g;
  }
  /* تماشاگر زنده — InstancedMesh + موج واکنشی (زیرمجموعه در هر فریم) */
  function makeCrowd(T3, scene, n, place) {
    var geo = new T3.BoxGeometry(0.34, 0.52, 0.28);
    var mat = new T3.MeshLambertMaterial({ color: 0xffffff });
    var inst = new T3.InstancedMesh(geo, mat, n);
    var base = new Float32Array(n * 3), ph = new Float32Array(n), amp = new Float32Array(n);
    var dummy = new T3.Object3D(), col = new T3.Color();
    var pal = [0xff6b8f, 0x7fd8ff, 0xffd75e, 0x8f7dff, 0x7dffb0, 0xffb02e, 0xf6f7fb, 0xff8a5c];
    var i, p;
    for (i = 0; i < n; i++) {
      p = place(i);
      base[i * 3] = p.x; base[i * 3 + 1] = p.y; base[i * 3 + 2] = p.z;
      ph[i] = Math.random() * TAU; amp[i] = 0.05 + Math.random() * 0.09;
      dummy.position.set(p.x, p.y, p.z); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
      col.setHex(pal[(Math.random() * pal.length) | 0]); inst.setColorAt(i, col);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
    var cursor = 0, excite = 0.18, boost = 0;
    return {
      excite: function (v) { boost = Math.max(boost, v) },
      tick: function (dt, t) {
        excite += (0.18 - excite) * dampK(dt, 0.5);
        boost *= Math.exp(-dt / 1400);
        var ex = Math.min(1.6, excite + boost), step = Math.ceil(n / 5), j, y;
        for (var k = 0; k < step; k++) {
          j = (cursor + k) % n;
          y = base[j * 3 + 1] + Math.max(0, Math.sin(t / (ex > 0.8 ? 230 : 520) + ph[j])) * amp[j] * (1 + ex * 2.4);
          dummy.position.set(base[j * 3], y, base[j * 3 + 2]);
          dummy.updateMatrix(); inst.setMatrixAt(j, dummy.matrix);
        }
        cursor = (cursor + step) % n;
        inst.instanceMatrix.needsUpdate = true;
      }
    };
  }
  /* تابلوی امتیاز زنده — CanvasTexture با آپدیت نرخ‌دار */
  function makeBoard(T3, scene, x, y, z, rotY, w, h) {
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 112;
    var g = cv.getContext('2d');
    var tex = new T3.CanvasTexture(cv);
    var frame = box(T3, w + 0.2, h + 0.2, 0.14, lamb(T3, 0x0a1322, true));
    frame.position.set(x, y, z); frame.rotation.y = rotY || 0; scene.add(frame);
    var scr = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ map: tex }));
    scr.position.set(x, y, z + 0.08 * (Math.cos(rotY || 0))); scr.rotation.y = rotY || 0; scene.add(scr);
    var last = '', lastAt = 0;
    return {
      set: function (txt) {
        var now = performance.now();
        if (txt === last && now - lastAt < 800) return;
        last = txt; lastAt = now;
        g.fillStyle = '#050b18'; g.fillRect(0, 0, 256, 112);
        g.strokeStyle = 'rgba(255,215,94,.55)'; g.lineWidth = 4; g.strokeRect(4, 4, 248, 104);
        var lines = String(txt).split('\n');
        g.textAlign = 'center'; g.fillStyle = '#ffd75e';
        g.font = '900 26px Vazirmatn, sans-serif';
        g.fillText(lines[0] || '', 128, 40);
        g.fillStyle = '#eaf6ff'; g.font = '900 22px Vazirmatn, sans-serif';
        g.fillText(lines[1] || '', 128, 78);
        tex.needsUpdate = true;
      }
    };
  }
  function makeFlag(T3, scene, x, y, z, colHex, dir) {
    var pole = cyl(T3, 0.035, 0.05, 2.8, 6, lamb(T3, 0xcfd6e4, true));
    pole.position.set(x, y + 1.4, z); scene.add(pole);
    var geo = new T3.PlaneGeometry(0.9, 0.56, 8, 3);
    var mat = new T3.MeshBasicMaterial({ color: colHex, side: T3.DoubleSide });
    var cloth = new T3.Mesh(geo, mat);
    cloth.position.set(x + 0.47 * (dir || 1), y + 2.45, z); scene.add(cloth);
    var base = cloth.geometry.attributes.position.array.slice();
    return { tick: function (t, wind) {
      var arr = cloth.geometry.attributes.position.array, i;
      for (i = 0; i < arr.length; i += 3) {
        var u = (base[i] + 0.45) / 0.9;
        arr[i + 2] = Math.sin(t / 300 + u * 5) * 0.1 * u * (0.7 + Math.abs(wind || 0.4) * 1.6);
      }
      cloth.geometry.attributes.position.needsUpdate = true;
    } };
  }
  function makeLights(T3, scene, inten) {
    scene.add(new T3.HemisphereLight(0xbdd8ff, 0x1a2338, 0.95 * (inten || 1)));
    var d = new T3.DirectionalLight(0xfff2d8, 0.85 * (inten || 1));
    d.position.set(18, 30, 12); scene.add(d);
    var d2 = new T3.DirectionalLight(0x9fbfff, 0.4);
    d2.position.set(-14, 20, -18); scene.add(d2);
  }
  function floodTower(T3, scene, x, z, h) {
    var pole = cyl(T3, 0.09, 0.14, h, 6, lamb(T3, 0x39445c, true));
    pole.position.set(x, h / 2, z); scene.add(pole);
    var head = box(T3, 1.7, 0.5, 0.3, new T3.MeshBasicMaterial({ color: 0xfff6d8 }));
    head.position.set(x, h + 0.2, z); scene.add(head);
    var spr = new T3.Sprite(new T3.SpriteMaterial({ map: softTex(T3), color: 0xfff0c0, transparent: true, opacity: 0.55, depthWrite: false }));
    spr.scale.set(4.2, 4.2, 1); spr.position.set(x, h + 0.2, z); scene.add(spr);
  }
  function standBlock(T3, scene, w, h, d, x, y, z, rotY) {
    var b = box(T3, w, h, d, lamb(T3, 0x14213c, true));
    b.position.set(x, y, z); b.rotation.y = rotY || 0; scene.add(b);
    return b;
  }

  /* ---------- ۸) استادیوم دو و میدانی — پیست بافت‌دار + کاسه + تابلو + دکل نور ---------- */
  function buildStadium(T3, scene, Q2, opt) {
    opt = opt || {};
    makeSky(T3, scene, '#0a1631', '#1d3a5c', 300);
    makeMountains(T3, scene, 250, 0x0e2038);
    makeLights(T3, scene, 1);
    /* پیست — بافت بنداری لاین */
    var laneTex = canvasTex(256, 1024, function (g, w, h) {
      g.fillStyle = '#9c3d52'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.05) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
      g.fillStyle = '#f2f4f8';
      [0.14, 0.38, 0.62, 0.86].forEach(function (u) { g.fillRect(u * w - 2, 0, 4, h) });
      g.fillStyle = '#ffffff'; g.fillRect(0, 4, w, 5); g.fillRect(0, h - 9, w, 5);
    });
    var track = new T3.Mesh(new T3.PlaneGeometry(9.4, 116), new T3.MeshLambertMaterial({ map: laneTex }));
    track.rotation.x = -Math.PI / 2; track.position.set(0, 0, -46); scene.add(track);
    var infield = new T3.Mesh(new T3.PlaneGeometry(120, 150), lamb(T3, 0x14522e, true));
    infield.rotation.x = -Math.PI / 2; infield.position.set(0, -0.02, -40); scene.add(infield);
    /* خطوط دهگاه */
    var lineMat = lamb(T3, 0xf2f4f8, false), m;
    for (m = 10; m <= 90; m += 10) {
      var mk = new T3.Mesh(new T3.PlaneGeometry(8.8, 0.14), lineMat);
      mk.rotation.x = -Math.PI / 2; mk.position.set(0, 0.006, -m); scene.add(mk);
    }
    var startL = new T3.Mesh(new T3.PlaneGeometry(9, 0.18), lamb(T3, 0xffffff, false));
    startL.rotation.x = -Math.PI / 2; startL.position.set(0, 0.007, 0); scene.add(startL);
    var finL = new T3.Mesh(new T3.PlaneGeometry(9, 0.34), lamb(T3, 0xffd75e, false));
    finL.rotation.x = -Math.PI / 2; finL.position.set(0, 0.008, -100); scene.add(finL);
    /* نوار پایان + دروازه */
    var poleM = lamb(T3, 0xe8ecf4, false);
    [-4.4, 4.4].forEach(function (x) { var p = cyl(T3, 0.06, 0.06, 3.2, 6, poleM); p.position.set(x, 1.6, -100); scene.add(p) });
    var tape = new T3.Mesh(new T3.PlaneGeometry(8.6, 0.18), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    tape.position.set(0, 1.2, -100); scene.add(tape);
    var gate = box(T3, 9.6, 0.8, 0.2, lamb(T3, 0x0a1730, true)); gate.position.set(0, 3.6, -100.4); scene.add(gate);
    var gateTex = new T3.Mesh(new T3.PlaneGeometry(9.2, 0.6), new T3.MeshBasicMaterial({ map: canvasTex(512, 40, function (g2, w2, h2) {
      g2.fillStyle = '#0a1730'; g2.fillRect(0, 0, w2, h2); g2.fillStyle = '#ffd75e';
      g2.font = '900 26px Vazirmatn, sans-serif'; g2.textAlign = 'center'; g2.fillText('WORLD DOMINION • FINISH', w2 / 2, 30);
    }) }));
    gateTex.position.set(0, 3.6, -100.28); scene.add(gateTex);
    /* کاسه — استاند دور + انتهایی + کوتاه نزدیک (دوربین سمت باز) */
    standBlock(T3, scene, 2.2, 2.1, 116, -8.6, 1.05, -46, 0);
    standBlock(T3, scene, 2.2, 2.1, 116, 8.6, 1.05, -46, 0);
    standBlock(T3, scene, 22, 2.1, 2.2, 0, 1.05, -108, 0);
    standBlock(T3, scene, 16, 1.4, 1.8, 0, 0.7, 8, 0);
    var crowdN = Q2.crowd();
    var spots = [];
    var i;
    for (i = 0; i < crowdN; i++) {
      var side = i % 4;
      if (side === 0) spots.push({ x: -8.6 + (Math.random() - 0.5) * 1.6, y: 1.35 + ((Math.random() * 3) | 0) * 0.6, z: 4 - Math.random() * 100 });
      else if (side === 1) spots.push({ x: 8.6 + (Math.random() - 0.5) * 1.6, y: 1.35 + ((Math.random() * 3) | 0) * 0.6, z: 4 - Math.random() * 100 });
      else if (side === 2) spots.push({ x: -10 + Math.random() * 20, y: 1.35 + ((Math.random() * 3) | 0) * 0.6, z: -108 + (Math.random() - 0.5) * 1.8 });
      else spots.push({ x: -7 + Math.random() * 14, y: 1.0 + ((Math.random() * 2) | 0) * 0.5, z: 8.2 + (Math.random() - 0.5) * 1.6 });
    }
    var crowd = makeCrowd(T3, scene, spots.length, function (j) { return spots[j] });
    /* دکل‌های نور + پرچم‌ها */
    floodTower(T3, scene, -11, 4, 9); floodTower(T3, scene, 11, 4, 9);
    floodTower(T3, scene, -11, -102, 9); floodTower(T3, scene, 11, -102, 9);
    var flags = [];
    flags.push(makeFlag(T3, scene, -7.2, 2.1, -10, 0x33ff9e, 1));
    flags.push(makeFlag(T3, scene, -7.2, 2.1, -55, 0xffd75e, 1));
    flags.push(makeFlag(T3, scene, -7.2, 2.1, -95, 0x7fd8ff, 1));
    flags.push(makeFlag(T3, scene, 7.2, 2.1, -30, 0xff6b8f, -1));
    flags.push(makeFlag(T3, scene, 7.2, 2.1, -80, 0xf6f7fb, -1));
    var board = makeBoard(T3, scene, 0, 3.9, -107.4, 0, 7.2, 3.1);
    /* بنر کنار پیست */
    var banner = new T3.Mesh(new T3.PlaneGeometry(14, 0.9), new T3.MeshBasicMaterial({ map: canvasTex(512, 36, function (g2, w2, h2) {
      g2.fillStyle = '#0d1b36'; g2.fillRect(0, 0, w2, h2); g2.fillStyle = '#7fd8ff';
      g2.font = '900 22px Vazirmatn, sans-serif'; g2.textAlign = 'center';
      g2.fillText('🏟️ المپیک جهانی — WORLD DOMINION', w2 / 2, 26);
    }) }));
    banner.position.set(-7.35, 2.6, -50); banner.rotation.y = Math.PI / 2; scene.add(banner);
    return {
      crowd: crowd, board: board, tape: tape,
      tick: function (dt, t, ctx) {
        crowd.tick(dt, t);
        var wind = 0.4 + Math.sin(t / 2100) * 0.3;
        for (var j = 0; j < flags.length; j++) flags[j].tick(t, wind);
      }
    };
  }

  /* ---------- ۹) استخر — آب زنده + لاین‌ها + دیوارها + تماشاگر ---------- */
  function buildPool(T3, scene, Q2) {
    makeSky(T3, scene, '#0a1a38', '#14324f', 200);
    makeLights(T3, scene, 1.05);
    var L = 27, W = 16, waterY = 0;
    /* کاسه */
    var floor = new T3.Mesh(new T3.PlaneGeometry(W, L + 6), lamb(T3, 0x0e4d6e, true));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, -2.3, -L / 2 + 1); scene.add(floor);
    var deck = new T3.Mesh(new T3.PlaneGeometry(46, 64), lamb(T3, 0x2a6e8f, true));
    deck.rotation.x = -Math.PI / 2; deck.position.set(0, -0.12, -L / 2 + 1); scene.add(deck);
    [-W / 2 - 0.4, W / 2 + 0.4].forEach(function (x) {
      var wall = box(T3, 0.5, 2.4, L + 6, lamb(T3, 0xdde8f2, true));
      wall.position.set(x, -1.2, -L / 2 + 1); scene.add(wall);
    });
    var wallEnd = box(T3, W + 1, 2.4, 0.5, lamb(T3, 0xdde8f2, true));
    wallEnd.position.set(0, -1.2, -L - 0.4); scene.add(wallEnd);
    var wallStart = wallEnd.clone(); wallStart.position.z = 1.4; scene.add(wallStart);
    /* آب زنده — Plane با موج رأسی */
    var wGeo = new T3.PlaneGeometry(W, L + 4, 26, 34);
    var wMat = new T3.MeshLambertMaterial({ color: 0x2ea8e0, transparent: true, opacity: 0.8 });
    var water = new T3.Mesh(wGeo, wMat);
    water.rotation.x = -Math.PI / 2; water.position.set(0, waterY, -L / 2 + 1); scene.add(water);
    var wBase = wGeo.attributes.position.array.slice();
    /* طناب‌های لاین — شناورهای instanced */
    var ropes = [], rGeo = new T3.SphereGeometry(0.06, 6, 5), rMat = lamb(T3, 0xffd75e, false);
    var ropeDummy = new T3.Object3D();
    [-2.4, -1.2, 0, 1.2, 2.4].forEach(function (x) {
      var n2 = 44, inst = new T3.InstancedMesh(rGeo, rMat, n2), arr = [];
      for (var i = 0; i < n2; i++) { var z = 0.6 - i * (L - 1) / n2; arr.push(z); ropeDummy.position.set(x, 0, z); ropeDummy.updateMatrix(); inst.setMatrixAt(i, ropeDummy.matrix) }
      inst.instanceMatrix.needsUpdate = true; scene.add(inst); ropes.push({ inst: inst, x: x, arr: arr });
    });
    /* سکوی شیرجه + پرچم‌ها */
    var blk = box(T3, 0.6, 0.4, 0.6, lamb(T3, 0x2a3a5e, false)); blk.position.set(0, 0.2, 1.2); scene.add(blk);
    var flags = [makeFlag(T3, scene, -6, 0, -6, 0x7fd8ff, 1), makeFlag(T3, scene, -6, 0, -18, 0xffd75e, 1), makeFlag(T3, scene, 6, 0, -12, 0xff6b8f, -1)];
    /* تماشاگر یک سمت */
    standBlock(T3, scene, 3, 2.2, 30, -11, 1.1, -L / 2 + 1, 0);
    var spots = [], i2;
    for (i2 = 0; i2 < Q2.crowd() * 0.6; i2++) spots.push({ x: -11 + (Math.random() - 0.5) * 2.2, y: 1.5 + ((Math.random() * 3) | 0) * 0.62, z: -L / 2 + 1 + (Math.random() - 0.5) * 28 });
    var crowd = makeCrowd(T3, scene, spots.length, function (j) { return spots[j] });
    var board = makeBoard(T3, scene, 0, 3.4, -L / 2 + 1, 0, 6.4, 2.8);
    return {
      crowd: crowd, board: board, waterY: waterY, L: L, W: W,
      tick: function (dt, t, ctx) {
        crowd.tick(dt, t);
        var arr = wGeo.attributes.position.array, i, ds = dt / 1000;
        for (i = 0; i < arr.length; i += 3) {
          var u = wBase[i], v = wBase[i + 1];
          arr[i + 2] = Math.sin(u * 2.1 + t / 460) * 0.055 + Math.sin(v * 1.7 - t / 380) * 0.05;
        }
        wGeo.attributes.position.needsUpdate = true;
        for (i = 0; i < ropes.length; i++) {
          var r = ropes[i];
          for (var j = 0; j < r.arr.length; j += 3) {
            var bob = Math.sin(t / 500 + r.arr[j]) * 0.025;
            ropeDummy.position.set(r.x, bob, r.arr[j]); ropeDummy.updateMatrix();
            r.inst.setMatrixAt(j, ropeDummy.matrix);
          }
          r.inst.instanceMatrix.needsUpdate = true;
        }
        for (i = 0; i < flags.length; i++) flags[i].tick(t, 0.5);
      }
    };
  }

  /* ---------- ۱۰) رینگ بوکس — طناب + کانapy + نور متمرکز ---------- */
  function buildArena(T3, scene, Q2) {
    makeSky(T3, scene, '#05080f', '#101c30', 160);
    makeLights(T3, scene, 0.85);
    /* سکوی رینگ */
    var plat = box(T3, 8.4, 0.6, 8.4, lamb(T3, 0x1a2c50, true)); plat.position.y = 0.3; scene.add(plat);
    var canvasMat = new T3.MeshLambertMaterial({ map: canvasTex(256, 256, function (g, w, h) {
      g.fillStyle = '#e8edf4'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(20,40,80,.16)'; g.lineWidth = 2;
      for (var i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke() }
      g.fillStyle = 'rgba(255,215,94,.85)'; g.font = '900 30px Vazirmatn, sans-serif'; g.textAlign = 'center';
      g.fillText('WD', w / 2, h / 2 + 10);
    }) });
    var floor2 = new T3.Mesh(new T3.PlaneGeometry(8, 8), canvasMat);
    floor2.rotation.x = -Math.PI / 2; floor2.position.y = 0.62; scene.add(floor2);
    /* پایه‌ها + طناب‌ها */
    var postM = lamb(T3, 0x27406e, true), padR = lamb(T3, 0xd42a4a, true), padB = lamb(T3, 0x2a6ed4, true);
    var corners = [[-3.8, -3.8, padR], [3.8, -3.8, padB], [-3.8, 3.8, padB], [3.8, 3.8, padR]];
    corners.forEach(function (c) {
      var p = cyl(T3, 0.09, 0.11, 1.7, 8, postM); p.position.set(c[0], 1.45, c[1]); scene.add(p);
      var pad = cyl(T3, 0.13, 0.13, 1.4, 8, c[2]); pad.position.set(c[0], 1.3, c[1]); scene.add(pad);
    });
    var ropeM = lamb(T3, 0xf2f4f8, false);
    [0.85, 1.2, 1.55].forEach(function (y) {
      [[-3.8, -3.8, 3.8, -3.8], [3.8, -3.8, 3.8, 3.8], [3.8, 3.8, -3.8, 3.8], [-3.8, 3.8, -3.8, -3.8]].forEach(function (seg) {
        var len = Math.hypot(seg[2] - seg[0], seg[3] - seg[1]);
        var rope = cyl(T3, 0.028, 0.028, len, 5, ropeM);
        rope.rotation.x = Math.PI / 2; rope.rotation.z = -Math.atan2(seg[3] - seg[1], seg[2] - seg[0]);
        rope.position.set((seg[0] + seg[2]) / 2, y, (seg[1] + seg[3]) / 2);
        scene.add(rope);
      });
    });
    /* نور متمرکز — مخروط‌های شفاف + دایره‌ی نور */
    [[0, 9, 0], [4, 8, 4], [-4, 8, -4]].forEach(function (p) {
      var cone = new T3.Mesh(new T3.ConeGeometry(2.6, 8.5, 16, 1, true), new T3.MeshBasicMaterial({ color: 0xfff2cc, transparent: true, opacity: 0.05, side: T3.DoubleSide, depthWrite: false }));
      cone.position.set(p[0], p[1] + 3.5, p[2]); scene.add(cone);
      var spr = new T3.Sprite(new T3.SpriteMaterial({ map: softTex(T3), color: 0xfff0c0, transparent: true, opacity: 0.5, depthWrite: false }));
      spr.scale.set(2.6, 2.6, 1); spr.position.set(p[0], p[1], p[2]); scene.add(spr);
    });
    var pool = new T3.Mesh(new T3.CircleGeometry(4.6, 20), new T3.MeshBasicMaterial({ map: softTex(T3), color: 0xfff2cc, transparent: true, opacity: 0.22, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.64; scene.add(pool);
    /* تماشاگر تاریک دور رینگ */
    var spots = [], i;
    for (i = 0; i < Q2.crowd() * 0.55; i++) {
      var a = Math.random() * TAU, r = 7.5 + Math.random() * 4.5;
      spots.push({ x: Math.cos(a) * r, y: 0.75 + ((Math.random() * 3) | 0) * 0.55, z: Math.sin(a) * r });
    }
    var crowd = makeCrowd(T3, scene, spots.length, function (j) { return spots[j] });
    var board = makeBoard(T3, scene, 0, 4.6, -9.5, 0, 6, 2.6);
    return {
      crowd: crowd, board: board,
      tick: function (dt, t, ctx) { crowd.tick(dt, t) }
    };
  }

  /* ---------- ۱۱) میدان تیراندازی با کمان — هدف رسمی + باد + چمن ---------- */
  function buildRange(T3, scene, Q2) {
    makeSky(T3, scene, '#0b1a34', '#25476b', 260);
    makeMountains(T3, scene, 220, 0x122a44);
    makeLights(T3, scene, 1);
    var grass = new T3.Mesh(new T3.PlaneGeometry(90, 160), new T3.MeshLambertMaterial({ map: canvasTex(128, 256, function (g, w, h) {
      g.fillStyle = '#1d5c33'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 500; i++) { g.fillStyle = 'rgba(' + (30 + Math.random() * 40 | 0) + ',' + (90 + Math.random() * 50 | 0) + ',40,.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 3) }
    }) }));
    grass.rotation.x = -Math.PI / 2; grass.position.z = -35; scene.add(grass);
    /* خط شوت + نشان‌های فاصله */
    var lm = lamb(T3, 0xf2f4f8, false);
    var sl = new T3.Mesh(new T3.PlaneGeometry(14, 0.16), lm); sl.rotation.x = -Math.PI / 2; sl.position.set(0, 0.01, 0); scene.add(sl);
    [30, 50, 70].forEach(function (d) {
      var mk = new T3.Mesh(new T3.PlaneGeometry(6, 0.1), lm);
      mk.rotation.x = -Math.PI / 2; mk.position.set(0, 0.008, -d); scene.add(mk);
    });
    /* هدف رسمی — سه تیرک، بازیکن وسط */
    function targetFace() {
      return canvasTex(256, 256, function (g, w, h) {
        var cx = 128, cy = 128, rings = [[122, '#f6f7fb'], [98, '#111318'], [73, '#3aa0e8'], [48, '#e33e4e'], [24, '#ffd75e']];
        g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h);
        rings.forEach(function (r) { g.fillStyle = r[1]; g.beginPath(); g.arc(cx, cy, r[0], 0, TAU); g.fill() });
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5;
        rings.forEach(function (r) { g.beginPath(); g.arc(cx, cy, r[0], 0, TAU); g.stroke() });
      });
    }
    var tgtTex = targetFace();
    var arrows = []; /* فلش‌های فروخورده — حذف در پایان */
    function addTarget(x) {
      var stand = cyl(T3, 0.09, 0.12, 1.4, 6, lamb(T3, 0x6b4a2a, true));
      stand.position.set(x, 0.7, -70); scene.add(stand);
      var face = new T3.Mesh(new T3.CylinderGeometry(0.61, 0.61, 0.12, 24), lamb(T3, 0xe8e2d4, true));
      face.rotation.x = Math.PI / 2; face.position.set(x, 1.45, -70.1); scene.add(face);
      var face2 = new T3.Mesh(new T3.CircleGeometry(0.6, 24), new T3.MeshBasicMaterial({ map: tgtTex }));
      face2.position.set(x, 1.45, -70.02); scene.add(face2);
      return face2;
    }
    var myTarget = addTarget(0); addTarget(-3.2); addTarget(3.2);
    /* سایبان داور + تماشاگر */
    standBlock(T3, scene, 3.4, 2.2, 22, -10.5, 1.1, -40, 0);
    var spots = [], i;
    for (i = 0; i < Q2.crowd() * 0.55; i++) spots.push({ x: -10.5 + (Math.random() - 0.5) * 2, y: 1.5 + ((Math.random() * 3) | 0) * 0.62, z: -50 + Math.random() * 22 });
    var crowd = makeCrowd(T3, scene, spots.length, function (j) { return spots[j] });
    /* درخت‌ها حاشیه */
    var treeG = new T3.Group(), tm = lamb(T3, 0x14472a, true), tm2 = lamb(T3, 0x5a3d22, true);
    for (i = 0; i < 26; i++) {
      var xx = (Math.random() > 0.5 ? 1 : -1) * (16 + Math.random() * 22), zz = -110 + Math.random() * 130;
      var trunk = cyl(T3, 0.14, 0.2, 1.6, 5, tm2); trunk.position.set(xx, 0.8, zz); treeG.add(trunk);
      var crown = new T3.Mesh(new T3.ConeGeometry(1.1 + Math.random(), 2.6 + Math.random() * 1.5, 6), tm);
      crown.position.set(xx, 2.6, zz); treeG.add(crown);
    }
    scene.add(treeG);
    /* پرچم‌های باد — واکنش به wind واقعی هر پایان */
    var wflags = [makeFlag(T3, scene, -2.2, 0, -30, 0x7fd8ff, 1), makeFlag(T3, scene, 2.2, 0, -45, 0xf6f7fb, -1), makeFlag(T3, scene, -2.2, 0, -58, 0xffd75e, 1)];
    var board = makeBoard(T3, scene, 0, 3.2, -76, 0, 5.4, 2.4);
    return {
      crowd: crowd, board: board, myTarget: myTarget, arrows: arrows,
      stickArrow: function (x, y) {
        var a = cyl(T3, 0.012, 0.012, 0.62, 5, lamb(T3, 0xd8c56a, false));
        a.rotation.x = Math.PI / 2 - 0.06;
        a.position.set(x, y, -69.7); scene.add(a); arrows.push(a);
      },
      clearArrows: function () { arrows.forEach(function (a) { scene.remove(a) }); arrows.length = 0 },
      tick: function (dt, t, ctx) {
        crowd.tick(dt, t);
        var w = (ctx && ctx.wind) || 0;
        for (var j = 0; j < wflags.length; j++) wflags[j].tick(t, w * 1.6 + 0.15);
      }
    };
  }

  /* ---------- ۱۲) جاده‌ی رالی — مسیر پیچ‌دار + ماشین + درخت + دروازه‌ها ---------- */
  function buildRoad(T3, scene, Q2, corners) {
    makeSky(T3, scene, '#131033', '#4b2e5c', 280); /* گرگ‌ومیش کوهستانی */
    makeMountains(T3, scene, 240, 0x1a1430);
    makeLights(T3, scene, 0.8);
    var vN = 16; /* سرعت اسمی m/s — مسیر از زمان‌های قطعی aS ساخته می‌شود */
    /* مسیر مرکزی — هر پیچ یک کمان واقعی با جهت seed-محور */
    var pts = [], zs = 0, xs = 0, hd = 0; /* hd: جهت سر (rad) */
    var stepM = 2, total = vN * (corners[corners.length - 1].aS / 1000 + 4);
    var ci = 0;
    for (var s = 0; s <= total; s += stepM) {
      var tHere = s / vN * 1000;
      if (ci < corners.length && tHere >= corners[ci].aS - 380) {
        var cInf = corners[ci];
        var arcLen = 42 + cInf.sharp * 26;
        var turnTotal = cInf.dir * (0.55 + cInf.sharp * 0.75);
        var steps = Math.ceil(arcLen / stepM);
        for (var k = 0; k < steps && s <= total; k++) {
          hd += turnTotal / steps; zs -= Math.cos(hd) * stepM; xs += Math.sin(hd) * stepM; s += stepM;
          pts.push({ x: xs, z: zs, hd: hd, t: s / vN * 1000 });
        }
        ci++;
      }
      zs -= Math.cos(hd) * stepM; xs += Math.sin(hd) * stepM;
      pts.push({ x: xs, z: zs, hd: hd, t: s / vN * 1000 });
    }
    /* مش جاده — نوار از نقاط مرکزی */
    var RW = 4.5;
    var posArr = [], idxArr = [], i;
    for (i = 0; i < pts.length; i++) {
      var p = pts[i], nx = Math.cos(p.hd), nz = Math.sin(p.hd);
      var y = Math.sin(p.z / 55) * 1.1;
      posArr.push(p.x - nx * RW, y, p.z - nz * RW);
      posArr.push(p.x + nx * RW, y, p.z + nz * RW);
    }
    for (i = 0; i < pts.length - 1; i++) {
      var a = i * 2;
      idxArr.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    var rGeo = new T3.BufferGeometry();
    rGeo.setAttribute('position', new T3.Float32BufferAttribute(posArr, 3));
    rGeo.setIndex(idxArr); rGeo.computeVertexNormals();
    var road = new T3.Mesh(rGeo, new T3.MeshLambertMaterial({ map: canvasTex(64, 256, function (g, w, h) {
      g.fillStyle = '#3a3d44'; g.fillRect(0, 0, w, h);
      for (var j = 0; j < 200; j++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
      g.fillStyle = '#e8d44e'; g.fillRect(4, 0, 3, h); g.fillRect(w - 7, 0, 3, h);
    }), side: T3.DoubleSide }));
    scene.add(road);
    /* زمین اطراف */
    var ground = new T3.Mesh(new T3.PlaneGeometry(500, 500), lamb(T3, 0x2a4a2e, true));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -1.4, -120); scene.add(ground);
    /* دروازه‌های پیچ — بیسم/پرچم در t قطعی */
    var gates = [];
    corners.forEach(function (c, j) {
      var p = pts[Math.min(pts.length - 1, Math.floor(c.aS / 1000 * vN / stepM))];
      if (!p) return;
      var archL = box(T3, 0.3, 2.6, 0.3, lamb(T3, 0xffd75e, true));
      var nx = Math.cos(p.hd), nz = Math.sin(p.hd);
      archL.position.set(p.x - nx * (RW + 0.8), 1.3, p.z - nz * (RW + 0.8)); scene.add(archL);
      var archR = archL.clone(); archR.position.set(p.x + nx * (RW + 0.8), 1.3, p.z + nz * (RW + 0.8)); scene.add(archR);
      var fl = makeFlag(T3, scene, p.x - nx * (RW + 0.9), 2.4, p.z - nz * (RW + 0.9), c.dir > 0 ? 0x33ff9e : 0xff6b8f, 1);
      gates.push(fl);
    });
    /* درخت‌ها + سنگ */
    var tm = lamb(T3, 0x14472a, true), tm2 = lamb(T3, 0x4a3220, true), rm = lamb(T3, 0x555a63, true);
    for (i = 0; i < 60; i++) {
      var pi = pts[(Math.random() * pts.length) | 0]; if (!pi) break;
      var side = Math.random() > 0.5 ? 1 : -1, off = 8 + Math.random() * 16;
      var nx2 = Math.cos(pi.hd), nz2 = Math.sin(pi.hd);
      var xx = pi.x + nx2 * off * side, zz = pi.z + nz2 * off * side;
      var trunk = cyl(T3, 0.16, 0.24, 1.8, 5, tm2); trunk.position.set(xx, 0.9, zz); scene.add(trunk);
      var crown = new T3.Mesh(new T3.ConeGeometry(1.3 + Math.random(), 3 + Math.random() * 2, 6), tm);
      crown.position.set(xx, 3, zz); scene.add(crown);
      if (i % 4 === 0) {
        var rock = new T3.Mesh(new T3.DodecahedronGeometry(0.5 + Math.random() * 0.6, 0), rm);
        rock.position.set(pi.x - nx2 * off * side * 0.5, 0.2, pi.z - nz2 * off * side * 0.5);
        rock.rotation.set(Math.random(), Math.random(), Math.random()); scene.add(rock);
      }
    }
    /* ماشین رالی low-poly */
    function buildCar(colHex) {
      var g = new T3.Group();
      var body = box(T3, 1.5, 0.42, 2.9, lamb(T3, colHex, true)); body.position.y = 0.5; g.add(body);
      var cabin = box(T3, 1.3, 0.42, 1.4, lamb(T3, 0x141a26, true)); cabin.position.set(0, 0.88, 0.1); g.add(cabin);
      var spoiler = box(T3, 1.5, 0.06, 0.4, lamb(T3, 0x141a26, true)); spoiler.position.set(0, 0.86, -1.32); g.add(spoiler);
      var lampL = box(T3, 0.24, 0.12, 0.05, new T3.MeshBasicMaterial({ color: 0xfff6d8 })); lampL.position.set(0.45, 0.52, 1.46); g.add(lampL);
      var lampR = lampL.clone(); lampR.position.x = -0.45; g.add(lampR);
      var wheels = [], wm = lamb(T3, 0x14161c, true);
      [[0.72, 1.0], [-0.72, 1.0], [0.72, -1.05], [-0.72, -1.05]].forEach(function (wp) {
        var w = cyl(T3, 0.3, 0.3, 0.22, 10, wm);
        w.rotation.z = Math.PI / 2; w.position.set(wp[0], 0.3, wp[1]); g.add(w); wheels.push(w);
      });
      /* راننده — سر فقط بالای کابین */
      var dri = buildAthlete(T3, { jersey: colHex, shorts: 0x141a26, scale: 0.62 });
      dri.position.set(0, 0.34, 0.12); dri.rotation.y = Math.PI; g.add(dri);
      g.userData.wheels = wheels; g.userData.driver = dri;
      return g;
    }
    var car = buildCar(0xff4d6d); scene.add(car);
    var ghostCar = null;
    return {
      car: car, pts: pts, vN: vN, gates: gates, stepM: stepM,
      setGhostCar: function (colHex) { ghostCar = buildCar(colHex); scene.add(ghostCar); return ghostCar },
      pointAt: function (tMs) { /* موقعیت روی مسیر از زمان */
        var idx = clamp(Math.round(tMs / 1000 * vN / stepM), 0, pts.length - 1);
        return pts[idx];
      },
      yAt: function (z) { return Math.sin(z / 55) * 1.1 },
      tick: function (dt, t, ctx) {
        for (var j = 0; j < gates.length; j++) gates[j].tick(t, 0.6);
      }
    };
  }

  /* ---------- ۱۳) HUD سینمایی فارسی — مینیمال حین گیم‌پلی ---------- */
  function injectCss() {
    if (document.getElementById('oly4d-css')) return;
    var st = document.createElement('style'); st.id = 'oly4d-css';
    st.textContent =
      '#wd33-stage .s33hd{position:relative;z-index:9}#wd33-stage .s33ft{position:relative;z-index:9}' +
      'body.o4d-on #wd60-ghostbar{display:none!important}' +
      '.o4d-layer{position:fixed;inset:0;z-index:4;overflow:hidden;background:#060d1c;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' +
      '.o4d-layer canvas{display:block;width:100%;height:100%}' +
      '.o4d-hud{position:absolute;inset:0;pointer-events:none;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff}' +
      '.o4d-chips{position:absolute;top:8px;right:8px;left:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-start}' +
      '.o4d-chip{padding:4px 11px;border-radius:99px;background:rgba(5,12,26,.78);border:1px solid rgba(255,255,255,.2);font-size:11px;font-weight:900;backdrop-filter:blur(4px);white-space:nowrap}' +
      '.o4d-chip.gold{color:#ffd75e;border-color:rgba(255,215,94,.6)}' +
      '.o4d-chip.ghost{color:#b8f7d4;border-color:rgba(125,255,158,.45)}' +
      '.o4d-chip.pos{color:#7fd8ff;border-color:rgba(127,216,255,.45)}' +
      '.o4d-chip.timer{color:#ffe08a;border-color:rgba(255,224,138,.45);font-variant-numeric:tabular-nums}' +
      '.o4d-big{position:absolute;top:30%;left:0;right:0;text-align:center;font-size:46px;font-weight:900;color:#fff;text-shadow:0 4px 26px rgba(0,0,0,.9);opacity:0;transform:scale(.6);transition:opacity .18s,transform .22s cubic-bezier(.2,1.6,.4,1)}' +
      '.o4d-big.on{opacity:1;transform:scale(1)}' +
      '.o4d-big small{display:block;font-size:13px;color:#ffe08a;margin-top:2px}' +
      '.o4d-msg{position:absolute;left:0;right:0;bottom:88px;text-align:center;font-size:11.5px;color:#dceaff;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.85);padding:0 12px;transition:opacity .25s}' +
      '.o4d-meters{position:absolute;bottom:34px;left:14px;right:14px;display:flex;gap:10px}' +
      '.o4d-meter{flex:1;max-width:220px}' +
      '.o4d-meter .lb{font-size:9px;font-weight:900;color:#9cc3e8;margin-bottom:3px;display:flex;justify-content:space-between}' +
      '.o4d-meter .bar{height:8px;border-radius:99px;background:rgba(255,255,255,.13);overflow:hidden;border:1px solid rgba(255,255,255,.12)}' +
      '.o4d-meter .bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3ee86e,#7dff9e);transition:width .13s linear}' +
      '.o4d-photo{position:absolute;top:20%;left:50%;transform:translateX(-50%);min-width:72%;max-width:94%;border-radius:16px;padding:12px 16px;background:rgba(4,10,24,.93);border:1px solid rgba(255,215,94,.55);font-weight:900;font-size:12px;text-align:center;box-shadow:0 14px 48px rgba(0,0,0,.7);z-index:5}' +
      '.o4d-photo .r{display:flex;justify-content:space-between;gap:10px;padding:4px 2px;font-size:12px}' +
      '.o4d-photo .r.me{color:#7dff9e}.o4d-photo .r.gh{color:#ffe08a}.o4d-photo .r.op{color:#9cc3e8}' +
      '.o4d-photo .hd{color:#ffd75e;font-size:13px;margin-bottom:4px;border-bottom:1px solid rgba(255,215,94,.3);padding-bottom:5px}' +
      '.o4d-btn{position:absolute;border:0;border-radius:16px;font-family:inherit;font-weight:900;font-size:12.5px;color:#fff;background:rgba(8,20,42,.88);border:1.5px solid rgba(0,220,255,.55);padding:14px 18px;pointer-events:auto;z-index:6;transition:transform .08s}' +
      '.o4d-btn:active{transform:scale(.94)}' +
      '.o4d-btn.hot{background:linear-gradient(135deg,rgba(255,215,94,.95),rgba(255,157,60,.95));color:#3a2600;border-color:#ffd75e;animation:o4dPulse .55s infinite alternate}' +
      '.o4d-btn.danger{background:rgba(120,20,40,.85);border-color:rgba(255,107,143,.6)}' +
      '.o4d-btn.zone{bottom:26px;padding:18px 0;font-size:13px}' +
      '@keyframes o4dPulse{from{box-shadow:0 0 6px rgba(255,215,94,.45)}to{box-shadow:0 0 22px rgba(255,215,94,.95)}}' +
      '.o4d-flash{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:7}' +
      '.o4d-tint{position:absolute;inset:0;pointer-events:none;opacity:0;background:linear-gradient(180deg,rgba(20,90,150,.42),rgba(8,40,80,.55));transition:opacity .3s;z-index:2}' +
      '.o4d-tint.on{opacity:1}' +
      '.o4d-tap{position:absolute;top:0;bottom:0;width:50%;pointer-events:none;opacity:0;transition:opacity .16s;z-index:1}' +
      '.o4d-tap.l{left:0;background:linear-gradient(90deg,rgba(0,220,255,.3),transparent)}' +
      '.o4d-tap.r{right:0;background:linear-gradient(-90deg,rgba(255,157,60,.3),transparent)}' +
      '.o4d-reticle{position:absolute;width:120px;height:120px;pointer-events:none;opacity:0;transition:opacity .2s;z-index:3}' +
      '.o4d-reticle.on{opacity:1}' +
      '.o4d-reticle .dot{position:absolute;top:50%;left:50%;width:10px;height:10px;margin:-5px;border-radius:50%;background:#ffd75e;box-shadow:0 0 10px rgba(255,215,94,.9)}' +
      '.o4d-reticle svg{position:absolute;inset:0}' +
      '.o4d-rival{position:absolute;top:16%;left:50%;transform:translateX(-50%);min-width:64%;max-width:92%;border-radius:14px;padding:10px 14px;background:rgba(4,10,24,.88);border:1px solid rgba(255,107,143,.5);text-align:center;font-size:11.5px;font-weight:800;z-index:5;transition:opacity .3s}' +
      '.o4d-rival .nm{color:#ff9db0;font-size:13px;font-weight:900}' +
      '.o4d-rival .st{color:#cfe4ff;font-size:10.5px;margin-top:3px}' +
      '.o4d-wind{position:absolute;top:52px;left:10px;font-size:10px;font-weight:900;color:#cfeaff;background:rgba(5,12,26,.7);border:1px solid rgba(127,216,255,.4);border-radius:99px;padding:3px 10px;white-space:nowrap}' +
      '.o4d-skip{position:absolute;top:8px;left:8px;pointer-events:auto;z-index:8;border:1px solid rgba(255,255,255,.3);background:rgba(5,12,26,.7);color:#cfe4ff;border-radius:99px;font-family:inherit;font-weight:800;font-size:10.5px;padding:6px 13px}' +
      '.o4d-count{position:absolute;top:34%;left:0;right:0;text-align:center;font-size:64px;font-weight:900;color:#fff;text-shadow:0 4px 28px rgba(0,0,0,.9);opacity:0}' +
      '@keyframes o4dCountPop{0%{opacity:0;transform:scale(1.7)}25%{opacity:1;transform:scale(1)}80%{opacity:1}100%{opacity:0}}' +
      '.o4d-note{position:absolute;bottom:130px;left:50%;transform:translateX(-50%);background:rgba(255,215,94,.14);border:1px solid rgba(255,215,94,.5);color:#ffe08a;font-weight:900;font-size:15px;border-radius:12px;padding:8px 18px;white-space:nowrap;opacity:0;transition:opacity .2s;z-index:4}' +
      '.o4d-note.on{opacity:1}';
    document.head.appendChild(st);
  }
  function buildHUD(layer, opt) {
    var hud = document.createElement('div'); hud.className = 'o4d-hud'; layer.appendChild(hud);
    var H = {
      hud: hud, _chips: {}, _meters: {}, _btns: {},
      chip: function (id, txt, cls) {
        var c = H._chips[id];
        if (!c) { c = document.createElement('span'); c.className = 'o4d-chip' + (cls ? ' ' + cls : ''); H._chips[id] = c; hud.querySelector('.o4d-chips').appendChild(c) }
        if (txt != null) c.textContent = txt;
        if (cls != null) c.className = 'o4d-chip ' + cls;
        return c;
      },
      big: function (txt, sub, ms) {
        var b = H._big || (function () { var d = document.createElement('div'); d.className = 'o4d-big'; hud.appendChild(d); H._big = d; return d })();
        b.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
        b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
        if (H._bigT) clearTimeout(H._bigT);
        if (ms !== 0) H._bigT = setTimeout(function () { b.classList.remove('on') }, ms || 950);
        return b;
      },
      count: function (txt) { /* شمارش معکوس با پاپ */
        var c = H._count || (function () { var d = document.createElement('div'); d.className = 'o4d-count'; hud.appendChild(d); H._count = d; return d })();
        c.textContent = txt; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = 'o4dCountPop .82s ease-out forwards';
      },
      say: function (txt) { var m = H._msg || (function () { var d = document.createElement('div'); d.className = 'o4d-msg'; hud.appendChild(d); H._msg = d; return d })(); m.innerHTML = txt; m.style.opacity = txt ? 1 : 0 },
      meter: function (id, label) {
        var m = H._meters[id];
        if (!m) {
          var wrap = H._mwrap || (function () { var d = document.createElement('div'); d.className = 'o4d-meters'; hud.appendChild(d); H._mwrap = d; return d })();
          var d = document.createElement('div'); d.className = 'o4d-meter';
          d.innerHTML = '<div class="lb"><span>' + label + '</span><span></span></div><div class="bar"><i></i></div>';
          wrap.appendChild(d);
          m = H._meters[id] = { bar: d.querySelector('i'), val: d.querySelector('.lb span:last-child'), set: function (v, grad, vtxt) { this.bar.style.width = clamp(v, 0, 1) * 100 + '%'; if (grad) this.bar.style.background = grad; if (vtxt != null) this.val.textContent = vtxt } };
        }
        return m;
      },
      photo: function (html) {
        var p = H._photo;
        if (!html) { if (p) p.remove(); H._photo = null; return }
        if (!p) { p = document.createElement('div'); p.className = 'o4d-photo'; hud.appendChild(p); H._photo = p }
        p.innerHTML = html;
      },
      btn: function (id, label, cb, cls, style) {
        var b = H._btns[id];
        if (!b) {
          b = document.createElement('button'); b.className = 'o4d-btn' + (cls ? ' ' + cls : '');
          if (style) b.setAttribute('style', style);
          b.addEventListener('pointerdown', function (e) { e.stopPropagation(); try { e.preventDefault() } catch (e2) {} cb && cb() });
          hud.appendChild(b); H._btns[id] = b;
        }
        if (label != null) b.textContent = label;
        return b;
      },
      skip: function (cb) {
        var s = H._skip;
        if (!cb) { if (s) s.remove(); H._skip = null; return }
        if (!s) { s = document.createElement('button'); s.className = 'o4d-skip'; hud.appendChild(s); H._skip = s;
          s.addEventListener('pointerdown', function (e) { e.stopPropagation(); cb() }) }
        s.textContent = '⏭ رد کردن';
      },
      flash: function (col, a) {
        var f = H._flash || (function () { var d = document.createElement('div'); d.className = 'o4d-flash'; hud.appendChild(d); H._flash = d; return d })();
        f.style.background = col; f.style.transition = 'none'; f.style.opacity = a || 0.3;
        setTimeout(function () { f.style.transition = 'opacity .5s'; f.style.opacity = 0 }, 40);
      },
      tint: function (on) { var t = H._tint || (function () { var d = document.createElement('div'); d.className = 'o4d-tint'; hud.appendChild(d); H._tint = d; return d })(); t.classList.toggle('on', !!on) },
      taps: function () {
        if (!H._tapL) {
          H._tapL = document.createElement('div'); H._tapL.className = 'o4d-tap l'; hud.appendChild(H._tapL);
          H._tapR = document.createElement('div'); H._tapR.className = 'o4d-tap r'; hud.appendChild(H._tapR);
        }
        var self = H;
        return {
          glow: function (side) { var el = side === 0 ? self._tapL : self._tapR; el.style.opacity = 0.9; setTimeout(function () { el.style.opacity = 0 }, 130) },
          labels: function (l, r) { self._tapL.innerHTML = l ? '<b style="position:absolute;bottom:110px;width:100%;text-align:center;font-size:11px;color:rgba(234,246,255,.9);font-weight:900;text-shadow:0 1px 4px #000">' + l + '</b>' : ''; self._tapR.innerHTML = r ? '<b style="position:absolute;bottom:110px;width:100%;text-align:center;font-size:11px;color:rgba(234,246,255,.9);font-weight:900;text-shadow:0 1px 4px #000">' + r + '</b>' : '' }
        };
      },
      reticle: function () {
        var r = H._ret || (function () {
          var d = document.createElement('div'); d.className = 'o4d-reticle';
          d.innerHTML = '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/><circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/><circle cx="60" cy="60" r="18" fill="none" stroke="rgba(255,215,94,.5)" stroke-width="1.5"/><line x1="60" y1="2" x2="60" y2="16" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/><line x1="60" y1="104" x2="60" y2="118" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/><line x1="2" y1="60" x2="16" y2="60" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/><line x1="104" y1="60" x2="118" y2="60" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/></svg><div class="dot"></div>';
          hud.appendChild(d); H._ret = d; return d;
        })();
        return {
          el: r, dot: r.querySelector('.dot'),
          show: function (on) { r.classList.toggle('on', !!on) },
          pos: function (x, y, steady) { r.style.transform = 'translate(' + x + 'px,' + y + 'px)'; this.dot.style.background = steady ? '#3ee86e' : '#ffd75e'; this.dot.style.boxShadow = '0 0 10px ' + (steady ? 'rgba(62,232,110,.9)' : 'rgba(255,215,94,.9)') }
        };
      },
      wind: function (txt) {
        var w = H._wind;
        if (txt == null) { if (w) w.remove(); H._wind = null; return }
        if (!w) { w = document.createElement('div'); w.className = 'o4d-wind'; hud.appendChild(w); H._wind = w }
        w.textContent = txt;
      },
      note: function (txt) { /* پیس‌نوت کو-رایدر رالی */
        var n = H._note || (function () { var d = document.createElement('div'); d.className = 'o4d-note'; hud.appendChild(d); H._note = d; return d })();
        if (!txt) { n.classList.remove('on'); return }
        n.textContent = txt; n.classList.remove('on'); void n.offsetWidth; n.classList.add('on');
      },
      rival: function (html) {
        var r = H._rival;
        if (!html) { if (r) { r.style.opacity = 0 } return }
        if (!r) { r = document.createElement('div'); r.className = 'o4d-rival'; hud.appendChild(r); H._rival = r }
        r.innerHTML = html; r.style.opacity = 1;
      },
      tick: function () {}
    };
    var chips = document.createElement('div'); chips.className = 'o4d-chips'; hud.appendChild(chips);
    return H;
  }
  /* ورودی یکپارچه — Pointer Events روی لایه‌ی تمام‌صفحه */
  function bindInput(el, h) {
    var act = false;
    function xy(e) { var r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width] }
    function down(e) {
      if (h.multi) { var p = xy(e); h.down && h.down(p[0], p[1], p[2], e); return }
      if (act) return; act = true;
      var p = xy(e); try { e.preventDefault() } catch (e2) {} h.down && h.down(p[0], p[1], p[2], e);
    }
    function move(e) { if (!act && !h.multi) return; var p = xy(e); h.move && h.move(p[0], p[1], p[2], e) }
    function up(e) { if (!act && !h.multi) return; act = false; var p = xy(e); h.up && h.up(p[0], p[1], p[2], e) }
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerup', up, { passive: true });
    el.addEventListener('pointercancel', up, { passive: true });
    return { el: el };
  }

  /* ---------- ۱۴) موتور شبح — رقیب واقعی از تله‌متری رکورددار ---------- */
  function ghostPick() {
    try {
      var g = window.WD33_GHOST_DATA; if (!g) return null;
      var sel = 'global'; try { sel = localStorage.getItem('wdGhostSel') || 'global' } catch (e2) {}
      if (sel === 'off') return null;
      var p = sel === 'personal' ? (g.personal || null) : (g.global || g.personal || null);
      if (!p) return null;
      if (!p.tel && p.logJson) p.tel = p.logJson;
      if (!p.tel || !Array.isArray(p.tel.ev)) return null;
      return { nick: String(p.nick || 'رکورددار').slice(0, 14), score: Number(p.score) || 0, ev: p.tel.ev };
    } catch (e) { return null }
  }
  /* پروفایل واقعی رقیب — فقط از داده‌ی تله‌متری واقعی؛ هیچ جعل Convention نیست */
  function ghostProfile(gh, kind) {
    if (!gh) return null;
    var ev = gh.ev, goT = -1, gaps = [], firstT = -1, lastT = -1, n = 0, rings = [], corners = [], wins = 0;
    var i, e;
    for (i = 0; i < ev.length; i++) {
      e = ev[i]; if (!e || typeof e[0] !== 'string') continue;
      var tt = Number(e[1]) || 0;
      if (kind === 'sprint') {
        if (e[0] === 'go') { goT = tt; continue }
        if (e[0] === 'p' && goT >= 0) { if (firstT < 0) firstT = tt; if (lastT >= 0) gaps.push(tt - lastT); lastT = tt; n++ }
      } else if (kind === 'swim') {
        if (e[0] === 'p') { if (lastT >= 0) gaps.push(tt - lastT); lastT = tt; n++ }
      } else if (kind === 'archery') {
        if (e[0] === 'shot') rings.push(Math.round(Number(e[2]) || 0));
      } else if (kind === 'rally') {
        if (e[0] === 'corner') corners.push(tt);
      } else if (kind === 'boxing') {
        if (e[0] === 'ex') { n++; if (Number(e[3])) wins++ }
      }
    }
    var mean = 0, sd = 0, fade = 0, rt = 0;
    if (gaps.length > 1) {
      for (i = 0; i < gaps.length; i++) mean += gaps[i]; mean /= gaps.length;
      var vs = 0; for (i = 0; i < gaps.length; i++) vs += (gaps[i] - mean) * (gaps[i] - mean);
      sd = Math.sqrt(vs / gaps.length);
      var h1 = gaps.slice(0, Math.max(1, gaps.length / 3 | 0)), h3 = gaps.slice(-Math.max(1, gaps.length / 3 | 0));
      var m1 = 0, m3 = 0; for (i = 0; i < h1.length; i++) m1 += h1[i]; m1 /= h1.length;
      for (i = 0; i < h3.length; i++) m3 += h3[i]; m3 /= h3.length;
      fade = m3 - m1;
    }
    if (kind === 'sprint' && goT >= 0 && firstT > goT) rt = firstT - goT;
    var style = kind === 'archery'
      ? (rings.length ? (rings.indexOf(10) >= 0 ? 'شوت‌های ده خالص — دقت مرگبار' : 'پایدار و خونسرد در پنج پایان') : 'دقت بالا')
      : kind === 'rally'
        ? (corners.length >= 5 ? 'پاس‌نوت‌خوان — زنده روی خط' : 'مسیر را بلد است')
        : kind === 'boxing'
          ? (n ? (wins >= n / 2 ? 'ضربه‌های سنگین و دقیق' : 'دفاع سیم‌کشی‌شده') : 'آماده‌ی رینگ')
          : (rt && rt < 200 ? 'شروع انفجاری' : '') + (sd && sd < 24 ? (rt && rt < 200 ? ' + ' : '') + 'مترونوم' : '') + (fade > 26 ? (style ? ' + ' : '') + 'افت انتها' : fade < -10 ? (style ? ' + ' : '') + 'فینیشر' : '') || 'ریتم پایدار';
    return { nick: gh.nick, score: gh.score, rt: rt, mean: mean, sd: sd, fade: fade, n: n, rings: rings, corners: corners, wins: wins, style: style };
  }
  function ghostStepsAt(gh, t, needGo) {
    if (!gh) return 0;
    var n = 0, ev = gh.ev, goT = needGo ? -1 : 0, i, e;
    for (i = 0; i < ev.length; i++) {
      e = ev[i]; if (!e || typeof e[0] !== 'string') continue;
      var tt = Number(e[1]) || 0;
      if (e[0] === 'go') { if (goT >= 0) break; goT = tt; continue }
      if (e[0] === 'p' && goT >= 0 && tt <= t) n++;
      if (tt > t) break;
    }
    return n;
  }
  /* تگ نام بالای ورزشکار — Sprite با متن واقعی */
  function makeTag(T3, text, colHex) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 72;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(4,10,24,.82)';
    g.beginPath(); g.roundRect ? g.roundRect(28, 8, 200, 52, 24) : g.rect(28, 8, 200, 52); g.fill();
    g.strokeStyle = colHex; g.lineWidth = 3; g.stroke();
    g.fillStyle = colHex; g.font = '900 30px Vazirmatn, sans-serif'; g.textAlign = 'center';
    g.fillText(text, 128, 46);
    var tex = new T3.CanvasTexture(c);
    var spr = new T3.Sprite(new T3.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    spr.scale.set(1.9, 0.53, 1);
    return spr;
  }

  /* ---------- ۱۵) مدیر نشست — تمام‌صفحه، چرخه‌ی حیات کامل ---------- */
  var CTRL = {}; /* پنج کنترلر — بخش‌های بعد */
  function disposeScene(scene) {
    try {
      scene.traverse(function (o) {
        if (o.geometry) try { o.geometry.dispose() } catch (e) {}
        if (o.material) {
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function (mt) {
            try {
              if (mt.map) mt.map.dispose();
              if (mt.spriteMaterial || mt.isSpriteMaterial) { if (mt.map) mt.map.dispose() }
              mt.dispose();
            } catch (e) {}
          });
        }
      });
    } catch (e) {}
  }
  /* مراسم اهدای مدال — سکو + پرچم رنگ + کانفتی + فانفار (۳-۶ ثانیه، قابل رد) */
  function ceremony(S, o, then) {
    var T3 = S.T3, spot = S.ceremonySpot || [0, 0, 12];
    o = o || {};
    var g = new T3.Group();
    var baseY0 = spot[1] || 0;
    var pM = [lamb(T3, 0xffd75e, true), lamb(T3, 0xd8dde6, true), lamb(T3, 0xcd8a4e, true)];
    var hs = [0.62, 0.46, 0.34], xs = [0, -1.15, 1.15], i;
    for (i = 0; i < 3; i++) {
      var b = box(T3, 1.05, hs[i], 1.05, pM[i]);
      b.position.set(spot[0] + xs[i], baseY0 + hs[i] / 2, spot[2]); g.add(b);
    }
    var banner = new T3.Mesh(new T3.PlaneGeometry(5.2, 1.15), new T3.MeshBasicMaterial({ map: canvasTex(512, 116, function (g2, w2, h2) {
      g2.fillStyle = 'rgba(8,16,36,.92)'; g2.fillRect(0, 0, w2, h2);
      g2.strokeStyle = '#ffd75e'; g2.lineWidth = 6; g2.strokeRect(6, 6, w2 - 12, h2 - 12);
      g2.fillStyle = '#ffd75e'; g2.font = '900 44px Vazirmatn, sans-serif'; g2.textAlign = 'center';
      g2.fillText('🥇 ' + (o.title || 'قهرمان'), w2 / 2, 52);
      g2.fillStyle = '#eaf6ff'; g2.font = '800 30px Vazirmatn, sans-serif';
      g2.fillText(o.subtitle || '', w2 / 2, 96);
    }) }));
    banner.position.set(spot[0], 3.4, spot[2] - 2.4); g.add(banner);
    var flagP = cyl(T3, 0.04, 0.05, 4.6, 6, lamb(T3, 0xcfd6e4, true));
    flagP.position.set(spot[0] - 2.4, 2.3, spot[2] - 1.6); g.add(flagP);
    var flagC = new T3.Mesh(new T3.PlaneGeometry(1.5, 0.95), new T3.MeshBasicMaterial({ color: S.flagCol || 0xffd75e, side: T3.DoubleSide }));
    flagC.position.set(spot[0] - 1.62, 4.05, spot[2] - 1.6); g.add(flagC);
    S.scene.add(g);
    var ath = S.athlete;
    if (ath) {
      var baseY = spot[1] || 0;
      ath.userData.J.reset();
      ath.position.set(spot[0], baseY + hs[0], spot[2] + 0.01);
      ath.rotation.set(0, Math.PI, 0); /* رو به دوربین */
      ath.userData.J.root.position.y = 0;
    }
    S.vfx.confettiOn(S.scene);
    AD.music('medal'); AD.fanfare(true); AD.crowdOn(); AD.setIntensity(0.95);
    S.hud.big('🥇', o.subtitle || '', 0);
    S.crowdEx = 1;
    var dur = 4600, t0 = performance.now(), done2 = false;
    S.hud.skip(function () { if (!done2) { done2 = true; fin() } });
    function fin() {
      S.hud.skip(null); S.hud.big('', null, 1);
      S.vfx.confettiOff();
      try { S.scene.remove(g); disposeGroup(g) } catch (e) {}
      if (ath) { ath.rotation.set(0, 0, 0); ath.position.set(0, 0, 0) }
      AD.music('off');
      then && then();
    }
    function disposeGroup(gr) { try { gr.traverse(function (ob) { if (ob.geometry) ob.geometry.dispose(); if (ob.material) { (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(function (m2) { if (m2.map) m2.map.dispose(); m2.dispose() }) } }) } catch (e) {} }
    S.ceremony = {
      tick: function (dt) {
        var t = performance.now() - t0;
        var a = Math.PI * 0.5 + Math.sin(t / 1700) * 0.85;
        var r = 5.2;
        S.rig.go(spot[0] + Math.sin(a) * r, 2.1 + Math.sin(t / 1200) * 0.3, spot[2] + Math.cos(a) * r, spot[0], 1.4, spot[2], dt, 3.2, 50);
        if (ath) celebratePose(ath.userData.J, t), ath.userData.J.apply(dt);
        S.vfx.confettiTick(dt);
        if (t >= dur && !done2) { done2 = true; fin() }
      }
    };
  }
  /* جلسه‌ی 3D — تمام‌صفحه داخل wd33-stage */
  function play3D(key, el, done) {
    if (!RT.three || RT.broken || !CTRL[key]) return false;
    var T3 = RT.three;
    if (RT.S) { try { RT.S.kill(true) } catch (e) {} RT.S = null }
    var savedLen = 0; try { savedLen = A.TELE.list.length } catch (e0) {}
    injectCss();
    try {
      el.innerHTML = '';
      var stage = document.getElementById('wd33-stage');
      var W = Math.max(300, window.innerWidth || 360), H = Math.max(300, window.innerHeight || 640);
      var layer = document.createElement('div'); layer.className = 'o4d-layer';
      layer.style.width = W + 'px'; layer.style.height = H + 'px';
      el.appendChild(layer);
      var rend = getRenderer(W, H); if (!rend) throw new Error('no-renderer');
      rend.domElement.style.width = '100%'; rend.domElement.style.height = '100%';
      layer.appendChild(rend.domElement);
      var scene = new T3.Scene();
      var cam = new T3.PerspectiveCamera(56, W / H, 0.1, 500);
      var gh = ghostPick();
      var prof = ghostProfile(gh, key);
      var vfx = makeVFX(T3, scene, Q.vfx());
      var S = {
        key: key, el: el, stage: stage, layer: layer, W: W, H: H, T3: T3, scene: scene, cam: cam, gh: gh, prof: prof,
        vfx: vfx, over: false, paused: false, t0: performance.now(), _l: 0, tick: null, rig: camRig(cam),
        slowmo: 1, crowdEx: 0, ceremony: null, ceremonySpot: null, flagCol: 0xffd75e, errN: 0,
        T: function () { return performance.now() - S.t0 }, /* ساعت واقعی — داور مقدس است */
        finish: function (score) {
          if (S.over) return; S.over = true;
          try { AD.crowdOff(); AD.engine(false); AD.music('off') } catch (e) {}
          try { A.tm33(function () { try { S.kill() } catch (e) {} }, 950) } catch (e1) { try { S.kill() } catch (e2) {} }
          try { done(Math.max(0, Math.round(score))) } catch (e3) { try { done(0) } catch (e4) {} }
        },
        kill: function (fast) {
          S.over = true; S.paused = true;
          try { document.body.classList.remove('o4d-on') } catch (eB) {}
          try { AD.kill() } catch (e) {}
          try { disposeScene(S.scene) } catch (e) {}
          try { if (layer.parentNode) layer.parentNode.removeChild(layer) } catch (e) {}
          if (RT.S === S) RT.S = null;
        },
        hud: null, athlete: null, ghostA: null, J: null, Jg: null, dbg: null
      };
      S.hud = buildHUD(layer);
      var chips = S.hud.chip;
      chips('mode', modeChip33(), (A.MATCH && A.MATCH.final) ? 'gold' : '');
      chips('score', '۰', 'gold');
      if (gh) chips('ghost', '👻 ' + prof.nick + ' • ' + faN(prof.score), 'ghost');
      /* چرخه‌ی حیات — visibility / context loss / resize */
      try { A.on33(document, 'visibilitychange', function () {
        if (S.over) return;
        if (document.hidden) { S.paused = true; AD.pause() }
        else { S.paused = false; AD.resume(); S._l = performance.now() }
      }) } catch (eV) {}
      try {
        rend.domElement.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (!S.over) { S.paused = true; S._lostAt = performance.now(); try { console.warn('[WD_OLY4D] contextlost @' + key) } catch (e2) {} S.hud.say('⚠️ گرافیک قطع شد — در حال بازیابی…') } }, false);
        rend.domElement.addEventListener('webglcontextrestored', function () { if (!S.over) { S.paused = false; S._l = performance.now(); try { console.warn('[WD_OLY4D] contextrestored @' + key + ' after ' + Math.round(performance.now() - (S._lostAt || 0)) + 'ms') } catch (e2) {} S.hud.say('') } }, false);
      } catch (eC) {}
      try { A.on33(window, 'resize', function () {
        var w2 = Math.max(300, window.innerWidth || S.W), h2 = Math.max(300, window.innerHeight || S.H);
        if (Math.abs(w2 - S.W) + Math.abs(h2 - S.H) > 12) {
          S.W = w2; S.H = h2;
          layer.style.width = w2 + 'px'; layer.style.height = h2 + 'px';
          rend.setSize(w2, h2, false); cam.aspect = w2 / h2; cam.updateProjectionMatrix();
        }
      }) } catch (eR) {}
      S.onQuality = function () { try { rend.setPixelRatio(Math.min(Q.dpr(), (window.devicePixelRatio || 1) || 1)) } catch (e) {} };
      /* کنترلر رشته */
      var ok = CTRL[key](S);
      if (ok === false) throw new Error('ctl');
      RT.S = S;
      try { document.body.classList.add('o4d-on') } catch (eB) {}
      /* تک‌حلقه‌ی مرکزی — خودتاب با بستن صحنه (loop33) */
      A.loop33(function () {
        if (S.over || S.paused) { S._l = performance.now(); return }
        var now = performance.now();
        var dt = Math.min(50, now - (S._l || now)); S._l = now;
        Q.feed(dt, now);
        var dtv = dt * S.slowmo; /* آهسته‌حرکت فقط نمایشی — S.T() همیشه واقعی */
        try { S.tick && S.tick(dtv, dt) } catch (eT2) {
          S.errN++; console.warn('[WD_OLY4D] tick err', (eT2 && eT2.message) || eT2);
          if (S.errN > 3) { S.over = true }
        }
        try { S.rig.tick(dtv) } catch (eR2) {}
        try { if (S.ceremony) S.ceremony.tick(dtv) } catch (eC2) {}
        S.hud.tick && S.hud.tick(dtv);
        try { AD.tick() } catch (eA) {}
        try { rend.render(scene, cam) } catch (eR3) { S.errN++; if (S.errN > 2) S.over = true }
      });
      return true;
    } catch (e) {
      try { console.warn('[WD_OLY4D] play3D fallback (' + key + '): ' + ((e && e.message) || e)) } catch (e2) {}
      try { if (RT.S) { RT.S.kill(); RT.S = null } else { el.innerHTML = '' } } catch (e2) {}
      if (RT.broken) return false;
      var nowLen = 0; try { nowLen = A.TELE.list.length } catch (e3) {}
      if (nowLen <= savedLen) return false; /* تله‌متری دست‌نخورده → 2D امن */
      try { done(0) } catch (e4) {}
      return true;
    }
  }

  /* ============================================================
     ۱۶) دو ۱۰۰ متر — گیم‌پلی واقعی: واکنش + ریتم + استقامت
     تله‌متری: go / fs / p(side) — داور: v3Sprint (بایت‌سازگار)
     ============================================================ */
  CTRL.sprint = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var rngGo = M.rngOf3(seed, 'go');
    var st = { phase: 'entrance', strides: 0, lastSide: -1, gaps: [], lastT: -1, goT: -1, fs: 0, firstT: -1,
      setAt: 0, goAt: 0, dist: 0, tape: false, ph: 0, stam: 100, done2: false, dq: false, boardT: 0 };
    S.dbg = st;
    var env = buildStadium(T3, S.scene, Q);
    S.ceremonySpot = [0, 0, 10];
    var colHex = (window.GD33 && window.GD33.sprint) ? hexCol(window.GD33.sprint.col, 0xff4d6d) : 0xff4d6d;
    S.flagCol = colHex;
    /* ورزشکاران — بازیکن/شبح/۲ دونده‌ی زمین (کادنس قانونی seed-محور، فقط نمایش) */
    var ath = buildAthlete(T3, { jersey: colHex, shorts: 0x14284e }); S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    var lanes = [1.25, 3.75, -1.25, -3.75];
    var ghA = null, Jg = null;
    if (S.gh) { ghA = buildAthlete(T3, { jersey: 0xffd34d, shorts: 0x3a2c00 }); ghA.position.x = lanes[1]; S.scene.add(ghA); S.ghostA = ghA; Jg = ghA.userData.J;
      var tagG = makeTag(T3, S.prof.nick, '#ffe08a'); tagG.position.set(0, 2.15, 0); ghA.add(tagG); }
    var ai = [], aiSt = [];
    var rAI = M.rngOf3(seed, 'f4d:pack');
    for (var i0 = 0; i0 < 2; i0++) {
      var a = buildAthlete(T3, { jersey: [0x7fd8ff, 0x8f7dff][i0], shorts: 0x1a2338 });
      a.position.x = lanes[2 + i0]; S.scene.add(a);
      ai.push(a);
      aiSt.push({ cad: 172 + rAI() * 46, react: 170 + rAI() * 170, n: 0, lastT: -1, next: 0, miss: 12 + (rAI() * 8 | 0), ph: i0 * 2 });
    }
    /* بلوک‌ها */
    lanes.forEach(function (x) { var blk = box(T3, 0.5, 0.12, 0.5, lamb(T3, 0x2a3a5e, false)); blk.position.set(x, 0.06, 0.55); S.scene.add(blk) });
    var tap = S.hud.taps(); tap.labels('پای چپ', 'پای راست');
    var endT = null, ghostFinT = null;
    if (S.gh) { /* زمان واقعی شبح تا ۱۰۰ متر از replay */
      var need = 53, cnt = 0, ev = S.gh.ev, goTg = -1;
      for (var ig = 0; ig < ev.length; ig++) { var eG = ev[ig]; if (!eG || typeof eG[0] !== 'string') continue;
        if (eG[0] === 'go') { goTg = Number(eG[1]) || 0; continue }
        if (eG[0] === 'p' && goTg >= 0) { cnt++; if (cnt >= need) { ghostFinT = (Number(eG[1]) || 0) - goTg; break } } }
    }
    S.hud.say('ورزشکاران وارد می‌شوند…');
    S.hud.meter('stam', 'استقامت'); S.hud.meter('rhy', 'ریتم');
    if (S.prof) S.hud.rival('<div class="nm">⚔️ رقیب تو: ' + esc2(S.prof.nick) + ' — ' + faN(S.prof.score) + ' امتیاز</div><div class="st">' + esc2(S.prof.style) + (S.prof.rt ? ' • واکنش ' + faN(Math.round(S.prof.rt)) + 'ms' : '') + '</div>');
    var entT = performance.now(), skipped = false;
    S.hud.skip(function () { skipped = true });
    AD.crowdOn(); AD.setIntensity(0.35); AD.music('pre');
    /* ورودی — تمام‌صفحه */
    bindInput(S.layer, { multi: true, down: function (x, y, W2) {
      if (S.over || st.done2) return;
      AD.unlock();
      var side = x < W2 / 2 ? 0 : 1;
      var t = S.T();
      if (st.phase === 'marks' || st.phase === 'set') { /* شروع زودهنگام */
        st.fs++; TE('fs', t, st.fs); S.rig.shake(0.1); sfx('alert');
        if (st.fs >= 2) { st.dq = true; st.phase = 'dq'; S.hud.big('❗ اخراج', 'دو شروع زودهنگام', 1600); S.hud.flash('#ff3344', 0.4); AD.crowdOn(); AD.setIntensity(0.8) }
        else { S.hud.big('⚠️ شروع زودهنگام', 'یک بار دیگر = اخراج', 1100); st.phase = 'set'; st.setAt = t; st.goAt = t + 1100 + rngGo() * 1300 }
        return;
      }
      if (st.phase !== 'run') return;
      if (side === st.lastSide) { S.rig.shake(0.04); return }
      if (st.lastT < 0) { if (t - st.goT < 100) return; st.firstT = t; TE('p', t, side) }
      else { var gp = t - st.lastT; if (gp < 150) return; TE('p', t, side); st.gaps.push(gp) }
      st.lastSide = side; st.lastT = t; st.strides++;
      st.dist = Math.min(100, st.strides * 1.9);
      /* استقامت — پوشش گیم‌فیل؛ هیچ‌گاه سدِ رویداد نیست */
      var last = st.gaps.length ? st.gaps[st.gaps.length - 1] : 200;
      var cost = 0.55 + (last > 235 ? (last - 235) * 0.004 : 0) + (last < 175 ? (175 - last) * 0.006 : 0);
      st.stam = clamp(st.stam - cost + (last >= 175 && last <= 235 ? 0.08 : 0), 12, 100);
      st.ph += Math.PI;
      AD.step(side, st.stam > 55);
      S.vfx.dust(ath.position.x, 0.05, ath.position.z + 0.4, 2, 0x8a6a52);
      if (st.stam > 70 && st.gaps.length > 4) S.vfx.speed(0, 1.2, ath.position.z - 1, colHex);
      tap.glow(side);
      if (st.dist >= 100 && !st.tape) { /* فینیش واقعی */
        st.tape = true; st.phase = 'finish'; st.boardT = S.T();
        S.slowmo = 0.45; S.crowdEx = 1; AD.crowdOn(); AD.setIntensity(1);
        env.tape.visible = false; sfx('cheer'); S.hud.flash('#7dff9e', 0.25);
      }
    } });
    function mirrorScore() {
      var dist = Math.min(100, st.strides * 1.9);
      var rt = st.firstT > 0 && st.goT > 0 ? st.firstT - st.goT : 0;
      var rtp = rt <= 180 ? 100 : rt <= 250 ? 80 : rt <= 350 ? 60 : rt <= 500 ? 35 : 15;
      var mean = 0, i; for (i = 0; i < st.gaps.length; i++) mean += st.gaps[i];
      mean = st.gaps.length ? mean / st.gaps.length : 0;
      var vs = 0; for (i = 0; i < st.gaps.length; i++) vs += (st.gaps[i] - mean) * (st.gaps[i] - mean);
      var sd = st.gaps.length > 1 ? Math.sqrt(vs / st.gaps.length) : 0;
      var rhythm = clamp(1 - sd / 160, 0, 1);
      return Math.round(dist * 7.5) + rtp + Math.round(rhythm * 180);
    }
    function showBoard() {
      var dist = Math.min(100, st.strides * 1.9);
      var myT = st.lastT > 0 && st.goT > 0 ? st.lastT - st.goT : 0;
      var sc = mirrorScore();
      var rows = '<div class="hd">📸 فینال عکس — دو ۱۰۰ متر</div>';
      var all = [{ nm: '🏃 تو', t: st.tape ? myT : 99999, cls: 'me', extra: faN(Math.round(dist)) + ' متر' }];
      if (S.gh) all.push({ nm: '👻 ' + S.prof.nick, t: ghostFinT != null ? ghostFinT : 99999, cls: 'gh', extra: faN(S.prof.score) + ' امتیاز' });
      aiSt.forEach(function (a, i) { all.push({ nm: '🎽 حریف ' + faN(i + 1), t: a.finT != null ? a.finT : 99999, cls: 'op', extra: '' }) });
      all.sort(function (a, b) { return a.t - b.t });
      all.forEach(function (r, i) { rows += '<div class="r ' + r.cls + '"><span>' + faN(i + 1) + '. ' + r.nm + '</span><span>' + r.extra + (r.t < 90000 ? ' • ' + faTime(r.t) : '') + '</span></div>' });
      rows += '<div style="margin-top:6px;color:#ffd75e">امتیاز تلاش: ' + faN(sc) + '</div>';
      S.hud.photo(rows);
      return sc;
    }
    var camMode = 0;
    S.tick = function (dt, dtRaw) {
      var t = S.T(), t2 = performance.now() - entT;
      J.fat = 1 - st.stam / 100;
      if (S.ghostA) Jg.fat = 0.15;
      /* — فازها — */
      if (st.phase === 'entrance') {
        var kp = clamp(t2 / 3000, 0, 1);
        ath.position.set(lanes[0], 0, 6 - kp * 5.45); walkPose(J, t2 / 130); J.apply(dt);
        if (ghA) { ghA.position.set(lanes[1], 0, 6.6 - kp * 6.05); walkPose(Jg, t2 / 130 + 0.7); Jg.apply(dt) }
        ai.forEach(function (a, i) { a.position.set(lanes[2 + i], 0, 7 - kp * 6.45); walkPose(a.userData.J, t2 / 130 + i); a.userData.J.apply(dt) });
        S.rig.go(6.2, 1.7, -6 + kp * 4, 0, 1.1, 3 - kp * 2.5, dt, 2.2, 54);
        if (t2 > 2600) { if (!skipped) skipped = true; st.phase = 'marks'; st.setAt = t; st.goAt = t + 900 + rngGo() * 1500; S.hud.rival(null); S.hud.skip(null); S.hud.big('ON YOUR MARKS', 'آماده…', 950); sfx('click') }
      } else if (st.phase === 'marks' || st.phase === 'set') {
        blocksPose(J, st.phase === 'set' ? 1 : 0.45); J.apply(dt);
        if (ghA) { blocksPose(Jg, st.phase === 'set' ? 1 : 0.45); Jg.apply(dt) }
        ai.forEach(function (a) { blocksPose(a.userData.J, st.phase === 'set' ? 1 : 0.45); a.userData.J.apply(dt) });
        AD.setIntensity(0.14); /* سکوت استادیوم */
        if (t >= st.goAt) { /* شلیک */
          st.phase = 'run'; st.goT = t; TE('go', st.goT);
          S.hud.big('⚡ برو!', '', 700); S.hud.count('شلیک!');
          AD.gun(); S.rig.kick(0.1, 'x'); S.hud.flash('#ffffff', 0.22); S.crowdEx = 0.7;
          camMode = 1;
        } else S.rig.go(2.7, 1.45, 2.6, 0, 1.0, 0.2, dt, 2.4, 50);
      } else if (st.phase === 'run') {
        if (st.lastT > 0) {
          var stepK = clamp((t - st.lastT) / 150, 0, 1);
          runPose(J, st.ph + stepK * Math.PI, J.fat, 1);
          ath.position.set(lanes[0], 0, -st.dist);
        } else { runPose(J, 0, 0, 0.4); ath.position.set(lanes[0], 0, 0) }
        J.apply(dt);
        /* شبح واقعی */
        var gz = 0;
        if (ghA) {
          var gs = ghostStepsAt(S.gh, t - (st.goT || 0), true);
          gz = -Math.min(100, gs * 1.9);
          runPose(Jg, st.ph * 0.96 + Math.PI / 2, 0.12, 1);
          ghA.position.set(lanes[1], 0, gz); Jg.apply(dt);
          if (gz <= -100 && !ghA.userData.fin) { ghA.userData.fin = true; S.hud.chip('pos', 'شبح فینیش کرد!', 'ghost') }
        }
        /* حریفان زمین — کادنس قانونی، فقط نمایش */
        aiSt.forEach(function (a, i) {
          var A2 = ai[i], Ja = A2.userData.J;
          if (a.finT != null) { runPose(Ja, a.ph, 0.2, 0.6); Ja.apply(dt); return }
          if (a.lastT < 0) a.next = st.goT + a.react;
          if (t >= a.next) {
            if (a.lastT >= 0) {
              var gp2 = t - a.lastT; /* همیشه ≥150 — کادنس قطعی قانونی */
              a.n++; a.ph += Math.PI;
              if (a.n % a.miss === 0) a.next = t + 280 + Math.random() * 120; /* اشتباه انسانی */
              else a.next = t + a.cad;
              var d2 = Math.min(100, a.n * 1.9);
              if (d2 >= 100) { a.finT = t - st.goT; a.ph = 0 }
            } else a.next = t + a.cad;
            a.lastT = t;
          }
          var adv = a.finT != null ? 100 : Math.min(100, Math.max(0, a.n * 1.9 + ((t - a.next) / Math.max(120, a.cad)) * 1.9));
          A2.position.set(lanes[2 + i], 0, -adv);
          runPose(Ja, a.ph + clamp((t - a.lastT) / a.cad, 0, 1) * Math.PI, 0.2, 1); Ja.apply(dt);
        });
        /* دوربین — تعقیب سینمایی */
        var prog = st.dist / 100;
        if (camMode === 1 && st.dist > 6) camMode = 2;
        if (camMode === 1) S.rig.go(5.4, 1.8, ath.position.z + 2.4, lanes[0], 1.05, ath.position.z - 2, dt, 5, 52);
        else if (prog < 0.86) S.rig.go(lerp(5.0, 0.9, prog * 1.15), lerp(1.8, 2.5, prog), ath.position.z + 6.2, 0, 1.05, ath.position.z - 4, dt, 4.4, lerp(56, 64, prog));
        else S.rig.go(3.6, 1.5, -95.2, 0, 1.15, -100, dt, 3.6, 48);
        /* HUD زنده */
        var mean = 0, i3; for (i3 = 0; i3 < st.gaps.length; i3++) mean += st.gaps[i3];
        mean = st.gaps.length ? mean / st.gaps.length : 0;
        var vs3 = 0; for (i3 = 0; i3 < st.gaps.length; i3++) vs3 += (st.gaps[i3] - mean) * (st.gaps[i3] - mean);
        var sd3 = st.gaps.length > 1 ? Math.sqrt(vs3 / st.gaps.length) : 0;
        var rh = clamp(1 - sd3 / 160, 0, 1);
        S.hud.meter('stam').set(st.stam / 100, st.stam > 55 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : st.stam > 30 ? 'linear-gradient(90deg,#ffd75e,#ffb02e)' : 'linear-gradient(90deg,#ff8a9d,#ff4d6d)', faN(Math.round(st.stam)) + '٪');
        S.hud.meter('rhy').set(rh, rh > 0.75 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : rh > 0.4 ? 'linear-gradient(90deg,#ffd75e,#ffb02e)' : 'linear-gradient(90deg,#ff8a9d,#ff4d6d)', Math.round(rh * 100) + '٪');
        S.hud.chip('score', faN(Math.round(st.dist)) + ' م', 'gold');
        S.hud.chip('pos', st.goT ? '⏱ ' + faTime(t - st.goT) : '⏱ 0.000', 'timer');
        AD.setIntensity(0.4 + prog * 0.5 + (rh > 0.8 ? 0.1 : 0));
        if (st.strides >= 118 && !st.tape) { /* گارد داور: ≤120 گام */
          st.tape = true; st.phase = 'finish'; st.boardT = t;
        }
        if (t - (st.goT || 0) > 22000 && !st.tape) { st.tape = true; st.phase = 'finish'; st.boardT = t }
      } else if (st.phase === 'finish') {
        sprintFinishPose(J); J.apply(dt);
        var fz = -Math.min(100, st.strides * 1.9);
        ath.position.set(lanes[0], 0, fz);
        S.rig.go(3.4, 1.4, fz - 4.5, lanes[0], 1.1, fz, dt, 3.4, 46);
        if (!st.done2 && performance.now() - (S._finAt || (S._finAt = performance.now())) > (S.slowmo < 1 ? 1400 : 400)) {
          S.slowmo = 1;
          var sc2 = showBoard();
          st.done2 = true;
          var win2 = true;
          if (ghA && ghostFinT != null && st.lastT - st.goT > ghostFinT) win2 = false;
          if (win2) { celebratePose(J, performance.now()); AD.fanfare(true); AD.music('win') } else { tiredPose(J, performance.now()); AD.music('lose') }
          st.phase = 'result';
          A.tm33(function () {
            var pb = 0; try { pb = (window.WD33_GHOST_DATA && window.WD33_GHOST_DATA.personal && Number(window.WD33_GHOST_DATA.personal.score)) || 0 } catch (e) {}
            if (A.MODE !== 'train' && sc2 > pb && sc2 >= 400) {
              ceremony(S, { title: 'قهرمان — ' + faN(sc2) + ' امتیاز', subtitle: 'رکورد شخصی جدید دو ۱۰۰ متر' }, function () { S.finish(sc2) });
            } else S.finish(sc2);
          }, win2 ? 2400 : 2100);
        }
      } else if (st.phase === 'result') {
        if (st.winP) celebratePose(J, t2); 
        J.apply(dt);
      } else if (st.phase === 'dq') {
        defeatPose(J); J.apply(dt);
        AD.setIntensity(0.5);
        if (!st.dqFin && t > 1800) { st.dqFin = true; S.hud.photo('<div class="hd">❗ اخراج</div><div class="r me"><span>دو شروع زودهنگام — دوباره</span><b>۰</b></div>'); S.finish(0) }
      }
      env.tick(dt, t, { crowdEx: S.crowdEx });
    };
    return true;
  };
  function esc2(s) { try { return A.esc(String(s)) } catch (e) { return String(s || '') } }

  /* آینه‌ی محلی archSway — فرمول بایت‌سازگار با سرور (oly3.js آن را اکسپورت نکرده؛
     اینجا با همان rngOf3 اکسپورت‌شده بازسازی می‌شود — صفر تغییر در oly3.js) */
  function archSwayOf(seed, i, tRel) {
    var r = M.rngOf3(seed, 'arch:' + i);
    var f1 = 900 + r() * 700, f2 = 500 + r() * 500;
    var p1 = r() * 6.28318, p2 = r() * 6.28318;
    var wind = r() * 2 - 1;
    var sway = 0.6 * Math.sin((tRel / f1) * 6.28318 + p1) + 0.4 * Math.sin((tRel / f2) * 6.28318 + p2);
    return { off: sway + wind * 0.35, wind: wind };
  }

  /* ============================================================
     ۱۷) کمان — دقت + باد + پنجره‌ی ثبات؛ تیر از پارامتر واقعی
     تله‌متری: draw(i) / shot(ring) — داور: v3Archery (بایت‌سازگار)
     ============================================================ */
  CTRL.archery = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var st = { end: 0, phase: 'intro', drawT: -1, hold: 0, shots: [], drawn: false, relT: 0, flight: null, endT: 0 };
    S.dbg = st;
    var env = buildRange(T3, S.scene, Q);
    S.ceremonySpot = [0, 0, 6];
    var colHex = (window.GD33 && window.GD33.archery) ? hexCol(window.GD33.archery.col, 0x33ff9e) : 0x33ff9e;
    S.flagCol = colHex;
    var ath = buildAthlete(T3, { jersey: colHex, shorts: 0x1a2338 }); ath.rotation.y = 0; S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    ath.position.set(0, 0, 0.8);
    /* کمان ساده در دست چپ */
    var bow = new T3.Mesh(new T3.TorusGeometry(0.55, 0.025, 6, 18, Math.PI), lamb(T3, 0x8a5a2a, false));
    bow.rotation.z = Math.PI / 2; bow.position.set(0.16, 1.35, -0.3); ath.add(bow);
    var str = new T3.Mesh(new T3.CylinderGeometry(0.006, 0.006, 1.1, 4), new T3.MeshBasicMaterial({ color: 0xe8ecf4 }));
    str.position.set(0.16, 1.35, -0.3 + 0.02); ath.add(str);
    /* فلش روی کمان */
    var arrowM = cyl(T3, 0.012, 0.012, 0.7, 5, lamb(T3, 0xd8c56a, false));
    var arrow = arrowM.clone(); arrow.rotation.x = Math.PI / 2; arrow.visible = false; S.scene.add(arrow);
    var ghostArrows = [];
    if (S.gh && S.prof && S.prof.rings) {
      S.prof.rings.slice(0, 5).forEach(function (rg, i) {
        var off = (1 - rg / 10) * 0.52;
        var a2 = arrowM.clone(); a2.rotation.x = Math.PI / 2 - 0.06;
        a2.position.set(((i % 2) ? 1 : -1) * (0.1 + off * 0.4) + 3.2, 1.45 - off * 0.3, -69.7);
        S.scene.add(a2); ghostArrows.push(a2);
      });
      var tg2 = makeTag(T3, S.prof.nick, '#ffe08a'); tg2.position.set(3.2, 2.3, -69.6); S.scene.add(tg2);
    }
    S.hud.meter('draw', 'کشش کمان');
    S.hud.say('نگه دار تا کمان کشیده شود — وسط طلایی رها کن');
    AD.crowdOn(); AD.setIntensity(0.2); AD.music('pre');
    var ret = S.hud.reticle();
    function windOf(i) { var w = archSwayOf(seed, i, 0); return w.wind }
    function showEnd(i) {
      var w = windOf(i);
      var dir = w > 0.3 ? '→→' : w > 0.1 ? '→' : w < -0.3 ? '←←' : w < -0.1 ? '←' : 'آرام';
      S.hud.wind('🌬 باد پایان ' + faN(i + 1) + ': ' + dir);
      S.hud.big('پایان ' + faN(i + 1) + ' از ۵', 'باد ' + dir, 1200);
      env.board.set('🏹 پایان ' + faN(i + 1) + '/۵\nباد ' + dir);
    }
    S.hud.skip(function () { if (st.phase === 'intro') { st.phase = 'ready'; st.endT = S.T(); S.hud.skip(null) } });
    bindInput(S.layer, { down: function () {
      if (S.over) return; AD.unlock();
      if (st.phase !== 'ready' || st.drawn) return;
      st.drawn = true; st.drawT = S.T(); TE('draw', st.drawT, st.end);
      st.phase = 'aim'; ret.show(true); sfx('click');
    }, up: function () {
      if (S.over || st.phase !== 'aim') return;
      var t = S.T(), hold = t - st.drawT;
      if (hold < 120) { /* هنوز کشیده نشده — کشش لغو، همان پایان قابل تکرار */
        st.drawn = false; st.phase = 'ready'; ret.show(false);
        S.hud.meter('draw').set(0); return;
      }
      var ring = M.archRing3(seed, st.end, t, hold).ring; /* همان مقدار سرور — ادعای دقیق */
      TE('shot', t, ring);
      st.shots.push(ring);
      st.phase = 'flight'; st.relT = t;
      st.flight = { t0: t, dur: 620, from: [0.16, 1.35, -0.2], ring: ring, hold: hold };
      arrow.visible = true;
      AD.arrowShot(); AD.crowdOn(); AD.setIntensity(0.3);
      ret.show(false); S.hud.meter('draw').set(0);
      st.drawn = false;
    } });
    function finishAll() {
      var pts = 0, all9 = st.shots.length === 5;
      st.shots.forEach(function (r) { pts += r * 20; if (r < 9) all9 = false });
      if (st.shots.length === 5 && all9) pts += 60;
      var rows = '<div class="hd">🏹 کارنامه‌ی پنج پایان</div>';
      st.shots.forEach(function (r, i) { rows += '<div class="r me"><span>پایان ' + faN(i + 1) + '</span><b>' + faN(r * 20) + ' — حلقه‌ی ' + faN(r) + '</b></div>' });
      if (st.shots.length === 5 && all9) rows += '<div class="r gh"><span>⭐ پنج‌نُه تمام!</span><b>+۶۰</b></div>';
      rows += '<div style="margin-top:6px;color:#ffd75e">امتیاز: ' + faN(pts) + '</div>';
      S.hud.photo(rows);
      AD.music(all9 ? 'win' : 'off');
      var perfect = st.shots.length === 5 && all9;
      A.tm33(function () {
        var pb = 0; try { pb = (window.WD33_GHOST_DATA && window.WD33_GHOST_DATA.personal && Number(window.WD33_GHOST_DATA.personal.score)) || 0 } catch (e) {}
        if (A.MODE !== 'train' && pts > pb && pts >= 400) ceremony(S, { title: 'قهرمان تیراندازی', subtitle: faN(pts) + ' امتیاز — رکورد شخصی جدید' }, function () { S.finish(pts) });
        else S.finish(pts);
      }, perfect ? 3400 : 2600);
    }
    S.tick = function (dt) {
      var t = S.T();
      /* سکوت پیش از شوت — اتمسفر */
      if (st.phase === 'aim') AD.setIntensity(0.08);
      switch (st.phase) {
        case 'intro':
          idlePose(J, t); J.apply(dt);
          S.rig.go(4.6, 1.6, -3.5, 0, 1.3, 0, dt, 2, 50);
          if (t > 1400) { st.phase = 'ready'; st.endT = t; S.hud.skip(null); showEnd(0) }
          break;
        case 'ready':
          idlePose(J, t); J.apply(dt);
          S.rig.go(2.2, 1.5, 2.2, 0, 1.35, -2, dt, 2.4, 50);
          break;
        case 'aim': {
          var hold = t - st.drawT;
          var pull = clamp(hold / 450, 0, 1);
          drawPose(J, pull); J.apply(dt);
          str.scale.y = 1 - pull * 0.35; str.position.z = -0.28 + pull * 0.16;
          S.hud.meter('draw').set(clamp(hold / 2200, 0, 1), hold > 2600 ? 'linear-gradient(90deg,#ff8a9d,#ff4d6d)' : (hold >= 1400 && hold <= 2300 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : 'linear-gradient(90deg,#ffd75e,#ffb02e)'), (hold >= 1400 && hold <= 2300) ? 'ثبات ✦' : hold > 2600 ? 'لرزش!' : faN(Math.round(hold / 100) / 10) + 's');
          /* رتیکل = نقطه‌ی برخورد واقعی (off×amp) — همان مدل سرور */
          var sw = archSwayOf(seed, st.end, t);
          var amp = 1.0 - Math.min(1, hold / 2200) * 0.55;
          if (hold > 2600) amp += Math.min(0.8, (hold - 2600) / 1000 * 0.18);
          var off = sw.off * amp;
          var cx = S.W / 2, cy = S.H / 2; /* دوربین lookAt هدف — رتیکل دقیقاً مرکز */
          ret.pos(cx + off * 46, cy + Math.abs(off) * 4, hold >= 1400 && hold <= 2300 && Math.abs(off) < 0.18);
          /* لرزش بازو در خستگی نگه‌داشتن */
          if (hold > 2600) J.T.headY = Math.sin(t / 90) * 0.03;
          S.rig.go(0.5, 1.5, -2.4, 0, 1.44, -70, dt, 3.4, 16); /* دوربین تله‌فوتو پشت کماندار — هدف در مرکز */
          break;
        }
        case 'flight': {
          drawPose(J, 0.15); J.apply(dt);
          var f = st.flight, p = clamp((t - f.t0) / f.dur, 0, 1);
          var az = lerp(-0.2, -70, p), ay = lerp(1.35, 1.42, p) + Math.sin(p * Math.PI) * 0.5;
          var swf = archSwayOf(seed, st.end, f.t0);
          var ax = swf.wind * 0.3 * p * 2.2;
          arrow.position.set(ax, ay, az);
          S.vfx.speed(ax, ay, az, 0xd8c56a);
          S.rig.go(ax + 1.6, ay + 0.4, az + 5.5, ax, ay, az - 8, dt, 6, 52);
          if (p >= 1) {
            st.phase = 'impact'; st.endT = t;
            AD.arrowHit(f.ring);
            env.stickArrow(ax, 1.45 - (1 - f.ring / 10) * 0.55);
            var sc = f.ring * 20;
            S.hud.big(f.ring >= 9 ? (f.ring === 10 ? '🎯 ده!' : 'نُه!') : 'حلقه‌ی ' + faN(f.ring), '+' + faN(sc) + ' امتیاز', 1000);
            if (f.ring >= 9) { S.hud.flash('#ffd75e', 0.18); S.crowdEx = 0.8; AD.setIntensity(0.6); sfx('cheer') }
          }
          break;
        }
        case 'impact': {
          idlePose(J, t); J.apply(dt);
          S.rig.go(0.4, 1.5, -66.6, 0, 1.45, -70, dt, 3.2, 46);
          if (t - st.endT > 1150) {
            /* فلش‌ها روی هدف می‌مانند (تجمع واقعی تیرها) */
            st.end++;
            if (st.end >= 5) { st.phase = 'result'; finishAll() }
            else { st.phase = 'ready'; showEnd(st.end); arrow.visible = true }
          }
          break;
        }
        case 'result':
          idlePose(J, t); J.apply(dt);
          S.rig.go(3.4, 1.7, -62, 0, 1.5, -70, dt, 2.4, 50);
          break;
      }
      if (arrow.visible && st.phase !== 'flight') { arrow.position.set(0.16, 1.3, -0.55); arrow.rotation.x = Math.PI / 2 }
      env.tick(dt, t, { wind: windOf(st.end) });
    };
    return true;
  };

  /* ============================================================
     ۱۸) شنا ۱۰۰ متر — کرال واقعی: ضربه‌ی متناوب + چرخش دیوار
     تله‌متری: p(side) / turn(q) — داور: v3Swim (بایت‌سازگار)
     ============================================================ */
  CTRL.swim = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var st = { phase: 'dive', n: 0, lastSide: -1, lastT: -1, turns: [], walls: [16, 32, 48], ph: 0,
      turnBtnOpen: -1, turnAt: 0, firstT: -1, finT: null, dived: false, laneY: 0 };
    S.dbg = st;
    var env = buildPool(T3, S.scene, Q);
    S.ceremonySpot = [0, 0, 4];
    var colHex = (window.GD33 && window.GD33.swim) ? hexCol(window.GD33.swim.col, 0x7fd8ff) : 0x7fd8ff;
    S.flagCol = colHex;
    var ath = buildAthlete(T3, { jersey: colHex, shorts: colHex }); S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    var LX = 0.6, GX = -1.8;
    var ghA = null, Jg = null;
    if (S.gh) { ghA = buildAthlete(T3, { jersey: 0xffd34d, shorts: 0x3a2c00 }); ghA.position.x = GX; S.scene.add(ghA); S.ghostA = ghA; Jg = ghA.userData.J;
      var tg3 = makeTag(T3, S.prof.nick, '#ffe08a'); tg3.position.set(0, 1.05, 0); tg3.scale.set(1.4, 0.4, 1); ghA.add(tg3); }
    var tap = S.hud.taps(); tap.labels('دست چپ', 'دست راست');
    S.hud.meter('rhy', 'ریتم ضربه'); S.hud.meter('stam', 'استقامت');
    S.hud.say('شیرجه… بعد یک‌درمیان چپ/راست — سر دیوار دکمه‌ی چرخش!');
    AD.crowdOn(); AD.setIntensity(0.3); AD.music('pre');
    var btnTurn = null;
    function laneZ(d) { /* d = متر طی‌شده در لاین ۲۵ متری، رفت‌وبرگشت */
      var pos = d % 50;
      return pos < 25 ? 0.9 - pos : -24 + (pos - 25);
    }
    function qFor(n2, wall) { return clamp(1 - Math.abs(n2 - wall) / 6, 0.2, 1) }
    function doTurn(q) {
      var t = S.T();
      st.turns.push(q); TE('turn', t, q);
      st.phase = 'turn'; st.turnAt = t; st.turnQ = q;
      AD.turnOk(q); AD.splash(false);
      S.vfx.bubble(ath.position.x, 0.3, ath.position.z, 8);
      if (btnTurn) btnTurn.style.display = 'none';
      st.turnBtnOpen = -1;
      S.hud.note(null);
    }
    bindInput(S.layer, { multi: true, down: function (x, y, W2) {
      if (S.over) return; AD.unlock();
      if (st.phase !== 'swim') return;
      var side = x < W2 / 2 ? 0 : 1;
      var t = S.T();
      if (side === st.lastSide) { S.rig.shake(0.03); return }
      if (st.lastT >= 0 && t - st.lastT < 140) return; /* بازیابی بازو — همان مرز داور */
      if (st.lastT < 0) st.firstT = t;
      else if (st.lastT > 0) S._gaps.push(t - st.lastT);
      TE('p', t, side);
      st.lastSide = side; st.lastT = t; st.n++;
      st.ph += Math.PI;
      AD.step(side, true); AD.splash(false);
      S.vfx.splash(ath.position.x, 0.05, ath.position.z - 0.5, false);
      tap.glow(side);
      /* استقامت نمایشی */
      st.stam = clamp((st.stam == null ? 100 : st.stam) - 0.5 + 0.05, 15, 100);
      /* پنجره‌ی چرخش */
      var wall = st.walls[st.turns.length];
      if (wall && st.turnBtnOpen < 0 && st.n >= wall - 3 && st.n <= wall + 2) {
        st.turnBtnOpen = wall;
        if (!btnTurn) btnTurn = S.hud.btn('turn', '🌀 چرخش!', function () { if (st.turnBtnOpen >= 0) doTurn(qFor(st.n, st.turnBtnOpen)) }, 'hot', 'left:50%;transform:translateX(-50%);bottom:120px;min-width:170px');
        btnTurn.style.display = '';
        S.hud.note('دیوار نزدیک است — چرخش بزن!');
      }
      if (wall && st.n > wall + 2 && st.turnBtnOpen >= 0) doTurn(0.25); /* چرخش خودکار ضعیف */
      if (st.n >= 65) { /* فینیش واقعی ۱۰۰ متر */
        st.phase = 'finish'; st.finT = t;
        S.crowdEx = 1; sfx('cheer'); S.hud.flash('#7dff9e', 0.25);
        if (btnTurn) btnTurn.style.display = 'none';
      }
    } });
    /* ریتم از گپ‌های واقعی ضربه‌ها */
    S._gaps = [];
    function mirrorScore() {
      var gaps = S._gaps;
      var dist = Math.min(100, st.n * 1.55);
      var mean = 0, i; for (i = 0; i < gaps.length; i++) mean += gaps[i];
      mean = gaps.length ? mean / gaps.length : 0;
      var vs = 0; for (i = 0; i < gaps.length; i++) vs += (gaps[i] - mean) * (gaps[i] - mean);
      var sd = gaps.length > 1 ? Math.sqrt(vs / gaps.length) : 0;
      var rhythm = clamp(1 - sd / 170, 0, 1);
      var tPts = 0; st.turns.forEach(function (q) { tPts += Math.round(q * 27) });
      return Math.round(dist * 7) + Math.round(rhythm * 200) + Math.min(81, tPts);
    }
    var diveT0 = performance.now();
    S.tick = function (dt) {
      var t = S.T(), t2 = performance.now() - diveT0;
      J.fat = st.stam != null ? 1 - st.stam / 100 : 0;
      var under = false;
      if (st.phase === 'dive') {
        var p = clamp(t2 / 1700, 0, 1);
        if (p < 0.3) { blocksLike(J, p / 0.3); ath.position.set(LX, 0.25, 1.1); }
        else { divePose(J, p); ath.position.set(LX, p > 0.75 ? 0.05 : lerp(0.3, 0.1, p), 1.1 - p * 4.5) }
        J.apply(dt);
        if (p > 0.42 && !st.dived) { st.dived = true; AD.splash(true); S.vfx.splash(LX, 0.05, 1.1 - p * 4.5, true); AD.crowdOn(); AD.setIntensity(0.5) }
        if (p > 0.55) under = true;
        if (ghA) { glidePose(Jg); Jg.apply(dt); ghA.position.set(GX, 0.05, 0.4 - p * 3) }
        S.rig.go(LX + 2.4, p > 0.5 ? -0.5 : 1.6, p > 0.5 ? ath.position.z + 1.5 : 3.4, LX, 0.2, ath.position.z - 2, dt, 3, 54);
        if (p >= 1) { st.phase = 'swim'; S.hud.note(null) }
      } else if (st.phase === 'swim') {
        var d = Math.min(100, st.n * 1.55);
        swimPose(J, st.ph + t / 260, J.fat); J.apply(dt);
        ath.position.set(LX, 0.05, laneZ(d));
        /* شبح واقعی */
        if (ghA) {
          var gs = ghostStepsAt(S.gh, t, false);
          var gd = Math.min(100, gs * 1.55);
          swimPose(Jg, gs * Math.PI + t / 260, 0.15); Jg.apply(dt);
          ghA.position.set(GX, 0.05, laneZ(gd));
        }
        var prog = d / 100;
        S.rig.go(4.6, 1.7, ath.position.z + 3.2, LX, 0.35, ath.position.z - 1.5, dt, 4, lerp(54, 62, prog));
        var mean = 0, i; for (i = 0; i < S._gaps.length; i++) mean += S._gaps[i];
        var vs = 0; for (i = 0; i < S._gaps.length; i++) vs += (S._gaps[i] - mean) * (S._gaps[i] - mean);
        var sd = S._gaps.length > 1 ? Math.sqrt(vs / S._gaps.length) : 0;
        var rh = clamp(1 - sd / 170, 0, 1);
        S.hud.meter('rhy').set(rh, rh > 0.75 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : 'linear-gradient(90deg,#ffd75e,#ffb02e)', Math.round(rh * 100) + '٪');
        S.hud.meter('stam').set((st.stam || 100) / 100, (st.stam || 100) > 50 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : 'linear-gradient(90deg,#ff8a9d,#ff4d6d)', faN(Math.round(st.stam || 100)) + '٪');
        S.hud.chip('score', faN(Math.round(d)) + ' م', 'gold');
        S.hud.chip('pos', st.firstT > 0 ? '⏱ ' + faTime(t - st.firstT) : '⏱', 'timer');
        AD.setIntensity(0.45 + prog * 0.45);
        if (t > 30000 && st.finT == null) { st.phase = 'finish'; st.finT = t; if (btnTurn) btnTurn.style.display = 'none' }
      } else if (st.phase === 'turn') {
        var tp = clamp((t - st.turnAt) / 800, 0, 1);
        turnPose(J, tp); J.apply(dt);
        under = tp < 0.7;
        var d2 = Math.min(100, st.n * 1.55);
        ath.position.set(LX, tp < 0.5 ? -0.4 : 0.05, laneZ(d2) + (tp < 0.5 ? 0.5 : -0.2));
        S.vfx.bubble(LX, -0.2, ath.position.z, 2);
        S.rig.go(LX + 2.2, tp < 0.6 ? -0.7 : 1.4, ath.position.z + 2, LX, 0.2, ath.position.z, dt, 4, 54);
        if (tp >= 1) { st.phase = 'swim'; glideHold = 300 }
      } else if (st.phase === 'finish') {
        glidePose(J); J.apply(dt);
        ath.position.set(LX, 0.05, laneZ(Math.min(100, st.n * 1.55)));
        var sc = mirrorScore();
        S.rig.go(3.2, 1.5, ath.position.z + 4, LX, 0.3, ath.position.z, dt, 3, 50);
        if (!st.done2) {
          st.done2 = true;
          var rows = '<div class="hd">🏊 پایان مسابقه</div>';
          rows += '<div class="r me"><span>🏃 تو</span><b>' + faN(Math.round(Math.min(100, st.n * 1.55))) + ' متر • ' + faN(st.n) + ' ضربه</b></div>';
          if (S.gh) { var gs2 = ghostStepsAt(S.gh, t, false); rows += '<div class="r gh"><span>👻 ' + esc2(S.prof.nick) + '</span><b>' + faN(Math.round(Math.min(100, gs2 * 1.55))) + ' متر • ' + faN(S.prof.score) + '</b></div>' }
          rows += '<div style="margin-top:6px;color:#ffd75e">امتیاز: ' + faN(sc) + ' • چرخش‌ها: ' + faN(st.turns.length) + '/۳</div>';
          S.hud.photo(rows);
          var bestTurn = Math.max.apply(null, st.turns.concat([0]));
          if (bestTurn >= 0.85) { AD.fanfare(true); AD.music('win') }
          A.tm33(function () {
            var pb = 0; try { pb = (window.WD33_GHOST_DATA && window.WD33_GHOST_DATA.personal && Number(window.WD33_GHOST_DATA.personal.score)) || 0 } catch (e) {}
            if (A.MODE !== 'train' && sc > pb && sc >= 380) ceremony(S, { title: 'قهرمان استخر', subtitle: faN(sc) + ' امتیاز — رکورد شخصی جدید' }, function () { S.finish(sc) });
            else S.finish(sc);
          }, 2600);
        }
      }
      S.hud.tint(under);
      env.tick(dt, t, {});
    };
    var glideHold = 0;
    function blocksLike(J2, p) { blocksPose(J2, p) }
    return true;
  };

  /* ============================================================
     ۱۹) بوکس — واکنش + دفاع + کانتر پرریسک (تله‌گراف خوانا)
     تله‌متری: ex(act, win, rt) ×۹ — داور: v3Boxing (بایت‌سازگار)
     ============================================================ */
  CTRL.boxing = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var st = { phase: 'intro', ex: 0, telT: -1, tel: 0, act: -1, wins: 0, comp: 100, round: 0, phaseT: 0, resolved: false, koDone: false };
    S.dbg = st;
    var env = buildArena(T3, S.scene, Q);
    S.ceremonySpot = [0, 0.62, 5.5];
    var colHex = (window.GD33 && window.GD33.boxing) ? hexCol(window.GD33.boxing.col, 0xffb02e) : 0xffb02e;
    S.flagCol = colHex;
    var ath = buildAthlete(T3, { jersey: colHex, shorts: 0x141a26, shoe: 0xd8dde6 }); S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    var opp = buildAthlete(T3, { jersey: 0xd42a4a, shorts: 0x2a0a12, shoe: 0x14161c }); S.scene.add(opp);
    var Jo = opp.userData.J;
    ath.position.set(0, 0.62, 1.15); ath.rotation.y = Math.PI;
    opp.position.set(0, 0.62, -1.15); opp.rotation.y = 0;
    var per = M.rngOf3(seed, 'f4d:boxper')();
    var oppName = ['کابرا', 'فالکون', 'رکس', 'ولف', 'تایتان'][(per * 5) | 0];
    var tgO = makeTag(T3, oppName, '#ff9db0'); tgO.position.set(0, 2.1, 0); opp.add(tgO);
    S.hud.meter('comp', 'توان رینگ');
    S.hud.chip('round', 'راند ' + faN(1) + '/۳', 'timer');
    if (S.prof) S.hud.rival('<div class="nm">拳 حریف: ' + esc2(S.prof.nick) + ' — ' + faN(S.prof.score) + '</div><div class="st">' + esc2(S.prof.style) + '</div>');
    AD.crowdOn(); AD.setIntensity(0.45); AD.music('pre');
    S.hud.say('بلاک هم‌جهت با مشت حریف — یا کانتر بزن (پرریسک، زمان کمتر)');
    var EX_TEL = 950, EX_GAP = 1250;
    function telOf(i) { return Math.floor(M.rngOf3(seed, 'box:' + i)() * 2) }
    var bHigh = S.hud.btn('bh', '🛡 بلاک بالا', function () { act2(0) }, '', 'left:12px;bottom:26px;min-width:31%'),
        bLow = S.hud.btn('bl', '🛡 بلاک پایین', function () { act2(1) }, '', 'left:50%;transform:translateX(-50%);bottom:26px;min-width:31%'),
        bCnt = S.hud.btn('bc', '💥 کانتر!', function () { act2(2) }, 'danger', 'right:12px;bottom:26px;min-width:31%');
    function act2(act) {
      if (S.over || st.phase !== 'tel' || st.resolved) return;
      var t = S.T(), rt = clamp(t - st.telT, 0, 3000);
      var win = (act === 2) ? rt <= 650 : (act === st.tel && rt <= 900);
      TE('ex', t, act, win ? 1 : 0, rt);
      st.resolved = true; st.phase = 'resolve'; st.phaseT = t; st.act = act; st.win = win; st.rt = rt;
      if (win) {
        st.wins++;
        var pts = 110 + Math.max(0, Math.round((900 - rt) / 10));
        st.comp = clamp(st.comp + (act === 2 ? 8 : 4), 0, 100);
        if (act === 2) { playerPunch(J, st.tel === 0, 0.5); AD.punch(true); S.slowmo = 0.45; S.rig.kick(0.16, 'x'); S.hud.flash('#ffd75e', 0.2); A.tm33(function () { S.slowmo = 1 }, 560); }
        else { blockPose(J, st.tel === 0, 1); AD.block(); S.rig.kick(0.06, 'y') }
        S.vfx.burst(0, 1.45, 0.2, act === 2 ? 16 : 8, 0xffd75e);
        S.hud.big(act === 2 ? '💥 کانتر!' : '🛡 دفاع', '+' + faN(pts), 800);
        S.crowdEx = 0.8; AD.setIntensity(0.75);
      } else {
        st.comp = clamp(st.comp - 18, 0, 100);
        AD.punch(false); AD.setIntensity(0.6);
        S.hud.big('خوردی!', 'دفاع درست: ' + (st.tel === 0 ? 'بالا' : 'پایین'), 800);
        S.rig.shake(0.12);
      }
    }
    function showRoundCard(r, cb) {
      st.phase = 'card'; st.phaseT = S.T();
      S.hud.big('راند ' + faN(r), '۳ رخداد — آماده باش', 1500);
      AD.bell(); AD.setIntensity(0.55);
      A.tm33(cb, 1500);
    }
    function finishAll() {
      var pts = 0;
      /* آینه‌ی داور از تله‌متری ثبت‌شده محاسبه نشده — امتیاز واقعی از سرور می‌آید؛
         نمایش: امتیاز تعاملی از رخدادهای برده */
      var ev = [], i;
      try { ev = A.TELE.list } catch (e) {}
      for (i = 0; i < ev.length; i++) if (ev[i][0] === 'ex' && Number(ev[i][3])) pts += 110 + Math.max(0, Math.round((900 - (Number(ev[i][4]) || 0)) / 10));
      var rows = '<div class="hd">🥊 کارنامه‌ی رینگ</div>';
      rows += '<div class="r me"><span>🥊 تو</span><b>' + faN(st.wins) + '/۹ رخداد برده</b></div>';
      if (S.prof) rows += '<div class="r gh"><span>👊 ' + esc2(S.prof.nick) + '</span><b>' + faN(S.prof.wins || 0) + '/۹ • ' + faN(S.prof.score) + '</b></div>';
      rows += '<div style="margin-top:6px;color:#ffd75e">امتیاز: ' + faN(pts) + '</div>';
      S.hud.photo(rows);
      if (st.wins >= 6) { AD.fanfare(true); AD.music('win') } else AD.music('lose');
      A.tm33(function () {
        var pb = 0; try { pb = (window.WD33_GHOST_DATA && window.WD33_GHOST_DATA.personal && Number(window.WD33_GHOST_DATA.personal.score)) || 0 } catch (e) {}
        if (A.MODE !== 'train' && pts > pb && pts >= 380) ceremony(S, { title: 'قهرمان رینگ', subtitle: faN(pts) + ' امتیاز — ' + faN(st.wins) + ' برد از ۹' }, function () { S.finish(pts) });
        else S.finish(pts);
      }, 2800);
    }
    var introT = performance.now();
    S.tick = function (dt) {
      var t = S.T(), t2 = performance.now() - introT;
      switch (st.phase) {
        case 'intro': {
          guardPose(J, 1, Math.sin(t / 420) * 0.1); J.apply(dt);
          guardPose(Jo, 1, Math.sin(t / 420 + 1) * 0.1); Jo.apply(dt);
          S.rig.go(3.6, 1.9, 3.4, 0, 1.35, 0, dt, 2.2, 52);
          if (t2 > 2000) { S.hud.rival(null); showRoundCard(1, function () { nextExchange() }) }
          break;
        }
        case 'card':
          guardPose(J, 1, Math.sin(t / 420) * 0.1); J.apply(dt);
          guardPose(Jo, 1, 0); Jo.apply(dt);
          S.rig.go(0, 2.4, 4.6, 0, 1.3, 0, dt, 2.4, 54);
          break;
        case 'tel': {
          var tp = clamp((t - st.telT) / EX_TEL, 0, 1);
          windupPose(Jo, st.tel === 0, tp); Jo.apply(dt);
          guardPose(J, 1, Math.sin(t / 380) * 0.08); J.apply(dt);
          S.rig.go(2.6, 1.55, 2.5, 0, 1.3, -0.3, dt, 3, 48);
          if (t - st.telT > EX_TEL + 160 && !st.resolved) missExchange(); /* دیرآمد — rt>900 = بدون برد (مطابق داور) */
          break;
        }
        case 'resolve': {
          var rp = clamp((t - st.phaseT) / 520, 0, 1);
          if (st.win && st.act === 2) { playerPunch(J, true, rp); hitPose(Jo, st.tel === 0, rp); }
          else if (st.win) { blockPose(J, st.tel === 0, 1 - rp * 0.4); punchPose(Jo, st.tel === 0, rp * 0.4) }
          else { punchPose(Jo, st.tel === 0, rp); hitPose(J, st.tel === 0, rp) }
          J.apply(dt); Jo.apply(dt);
          S.rig.go(2.2, 1.45, 2.1, 0, 1.3, -0.4, dt, 4, 46);
          if (rp >= 1) {
            st.ex++;
            if (st.ex >= 9) { st.phase = 'result'; S.hud.photo(null); finishAll(); break }
            if (st.ex % 3 === 0) { st.round++; S.hud.chip('round', 'راند ' + faN(st.round + 1) + '/۳', 'timer'); showRoundCard(st.round + 1, function () { nextExchange() }) }
            else { st.phase = 'idle'; st.phaseT = t }
          }
          break;
        }
        case 'idle': {
          guardPose(J, 1, Math.sin(t / 400) * 0.12); J.apply(dt);
          guardPose(Jo, 1, Math.sin(t / 400 + 0.8) * 0.12); Jo.apply(dt);
          S.rig.go(0.4, 2.0, 4.2, 0, 1.3, 0, dt, 2.4, 54);
          if (t - st.phaseT > 500) nextExchange();
          break;
        }
        case 'down': {
          var dp = clamp((t - st.phaseT) / 1100, 0, 1);
          if (st.whoDown === 'me') { knockdownPose(J, dp < 0.6 ? dp / 0.6 : 1 - (dp - 0.6) / 0.4 * 0.4); J.root.position.y = Math.max(0, J.root.position.y) }
          else { knockdownPose(Jo, dp < 0.55 ? dp / 0.55 : 1 - (dp - 0.55) / 0.45 * 0.45) }
          J.apply(dt); Jo.apply(dt);
          S.rig.go(2.4, 1.2, 2.4, 0, 0.9, 0, dt, 3, 50);
          if (dp >= 1) { if (st.whoDown === 'me') { J.root.rotation.x = 0; J.root.position.y = 0; st.comp = 55 } st.phase = 'idle'; st.phaseT = t }
          break;
        }
        case 'result':
          guardPose(J, st.wins >= 5 ? 1 : 0); J.apply(dt);
          S.rig.go(0, 2.6, 5, 0, 1.4, 0, dt, 2, 52);
          break;
      }
      S.hud.meter('comp').set(st.comp / 100, st.comp > 55 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : 'linear-gradient(90deg,#ff8a9d,#ff4d6d)', faN(Math.round(st.comp)) + '٪');
      env.tick(dt, t, {});
    };
    function nextExchange() {
      if (S.over || st.ex >= 9) return;
      st.tel = telOf(st.ex);
      st.telT = S.T(); st.resolved = false; st.act = -1;
      st.phase = 'tel';
      AD.whoosh(st.tel === 0);
      S.hud.chip('ex', 'رخداد ' + faN(st.ex + 1) + '/۹', '');
    }
    function missExchange() { /* واکنشی نیامد — act=0، rt>900 → winS=0 در داور */
      var t = S.T(), rt = clamp(t - st.telT, 1000, 3000);
      TE('ex', t, 0, 0, rt);
      st.resolved = true; st.phase = 'resolve'; st.phaseT = t; st.act = 0; st.win = false; st.rt = rt;
      st.comp = clamp(st.comp - 18, 0, 100);
      AD.punch(false);
      S.hud.big('دیر بود!', 'دفاع درست: ' + (st.tel === 0 ? 'بالا' : 'پایین'), 800);
      S.rig.shake(0.12);
    }
    return true;
  };

  /* ============================================================
     ۲۰) رالی کوهستانی — فرمان + خط مسابقه + پیس‌نوت
     تله‌متری: corner(i, q) ×۶ در زمان‌های قطعی aS — داور: v3Rally
     ============================================================ */
  CTRL.rally = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    /* پیچ‌ها — aS تجمعی (آینه‌ی دقیق داور) */
    var corners = [], aS = 800, i;
    for (i = 0; i < 6; i++) {
      aS += 1500 + M.rngOf3(seed, 'ral:' + i)() * 700;
      corners.push({ aS: aS, dir: M.rngOf3(seed, 'f4d:dir:' + i)() > 0.5 ? 1 : -1, sharp: M.rngOf3(seed, 'f4d:sh:' + i)(), q: null, fired: false });
    }
    var st = { phase: 'intro', s: 0, v: 12, x: 0, steer: 0, steerT: 0, dragging: false, dragX0: 0, ci: 0, done2: false, offroad: false };
    S.dbg = st;
    var env = buildRoad(T3, S.scene, Q, corners);
    S.ceremonySpot = null;
    var colHex = (window.GD33 && window.GD33.rally) ? hexCol(window.GD33.rally.col, 0xff6b8f) : 0xff6b8f;
    S.flagCol = colHex;
    var car = env.car;
    var gCar = null;
    if (S.gh) { gCar = env.setGhostCar(0xffd34d);
      var tgG = makeTag(T3, S.prof.nick, '#ffe08a'); tgG.scale.set(1.5, 0.42, 1); tgG.position.set(0, 1.75, 0); gCar.add(tgG); }
    var wheelR = 0;
    S.hud.meter('line', 'خط مسابقه');
    S.hud.chip('spd', '۰ km/h', 'timer');
    S.hud.say('انگشتت را بکش تا فرمان بدهی — روی خط بمان تا سرعتت نریزد');
    if (S.prof) S.hud.rival('<div class="nm">🏁 رقیب: ' + esc2(S.prof.nick) + ' — ' + faN(S.prof.score) + '</div><div class="st">' + esc2(S.prof.style) + '</div>');
    AD.crowdOn(); AD.setIntensity(0.25); AD.music('pre');
    S.hud.skip(function () { if (st.phase === 'intro') { st.phase = 'drive'; st.phaseT = S.T(); S.hud.skip(null); S.hud.rival(null); AD.engine(true); AD.music('off') } });
    bindInput(S.layer, { down: function (x) { if (st.phase === 'drive') { st.dragging = true; st.dragX0 = x; st.steer = 0 } },
      move: function (x) { if (st.dragging && st.phase === 'drive') { st.steer = clamp((x - st.dragX0) / 85, -1, 1); st.steerT = performance.now() } },
      up: function () { st.dragging = false } });
    function pacenote(c, i) {
      var sev = c.sharp > 0.66 ? 'بسیار تنگ' : c.sharp > 0.33 ? 'تنگ' : 'باز';
      return 'پیچ ' + faN(i + 1) + ' — ' + (c.dir > 0 ? '↰ چپ ' : '↱ راست ') + sev;
    }
    function mirrorScore() { var p2 = 0; corners.forEach(function (c) { if (c.q != null) p2 += Math.round(c.q * 130) }); return p2 }
    var introT = performance.now();
    S.tick = function (dt, dtRaw) {
      var t = S.T(), ds = dt / 1000;
      if (st.phase === 'intro') {
        var t2 = performance.now() - introT, p = clamp(t2 / 2400, 0, 1);
        var mid = env.pointAt(p * 14000);
        S.rig.snap(mid.x + Math.sin(p * 6) * 10, 9 - p * 3, mid.z + 14 - p * 8, mid.x, 0, mid.z - 20);
        if (p >= 1) { st.phase = 'drive'; st.phaseT = t; S.hud.skip(null); S.hud.rival(null); AD.engine(true); AD.music('off') }
      } else if (st.phase === 'drive') {
        /* سرعت — پیچ = ترمز طبیعی، بیرون خط = سایش */
        var c = corners[st.ci];
        var prox = c ? clamp(1 - Math.abs(t - c.aS) / 1100, 0, 1) : 0;
        var vT = 17.5 - (c ? prox * (4 + c.sharp * 4) : 0);
        st.offroad = Math.abs(st.x) > 3.6;
        if (st.offroad) vT *= 0.55;
        st.v = lerp(st.v, vT, dampK(dt, 2.2));
        st.s += st.v * ds;
        if (!st.dragging) st.steer *= Math.exp(-dt / 160);
        st.x = clamp(st.x + st.steer * st.v * ds * 0.5, -4.4, 4.4);
        var dev = c ? Math.abs(st.x - c.dir * 1.1) : Math.abs(st.x);
        /* پیس‌نوت */
        if (c && !c.fired && t > c.aS - 1500 && t < c.aS - 900) { S.hud.note(pacenote(c, st.ci)); AD.whoosh(false) }
        if (c && !c.fired && t >= c.aS) { /* عبور قطعی پیچ — هم‌زمان داور */
          c.fired = true;
          var q = clamp(1 - dev / 3.0, 0, 1);
          if (st.offroad) q *= 0.55;
          c.q = q;
          /* زمان رویداد = زمان فیزیکی عبور aS (قطعی از seed) — نه زمان تیک مشاهده؛
             در فریم‌دراپ شدید، تیک دیر می‌رسد و پنجره‌ی [aS−350, aS+900] می‌سوزد (درس V92) */
          TE('corner', c.aS, st.ci, q);
          st.ci++;
          AD.turnOk(q); S.hud.note(null);
          S.hud.big(q > 0.8 ? 'عالی!' : q > 0.5 ? 'خوب' : 'بیرون خط!', 'کیفیت پیچ: ' + faN(Math.round(q * 100)) + '٪', 700);
          if (q < 0.35) { S.vfx.smoke(car.position.x, 0.4, car.position.z, 8); S.rig.shake(0.08) }
          S.vfx.dust(car.position.x, 0.2, car.position.z, 6, 0x9c8468);
          /* اسپلیت واقعی مقابل شبح */
          if (gCar && S.prof.corners && S.prof.corners[st.ci - 1] != null) {
            var gT = S.prof.corners[st.ci - 1], dlt = t - gT;
            S.hud.chip('split', (dlt <= 0 ? '🟢 ' : '🔴 ') + (dlt <= 0 ? '−' : '+') + faN(Math.abs(Math.round(dlt / 10) / 100)) + 's', dlt <= 0 ? 'pos' : 'gold');
          }
        }
        /* جای ماشین از مسیر */
        var pt = env.pointAt(st.s / 16 * 1000);
        if (pt) {
          var nx = Math.cos(pt.hd), nz = Math.sin(pt.hd);
          car.position.set(pt.x + nx * st.x, env.yAt(pt.z) + 0.02, pt.z + nz * st.x);
          car.rotation.y = -pt.hd + st.steer * 0.14;
          car.rotation.z = -st.steer * 0.06;
          var Jd = car.userData.driver.userData.J; drivePose(Jd, st.steer); Jd.apply(dt);
        }
        wheelR += st.v * ds / 0.3;
        car.userData.wheels.forEach(function (w) { w.rotation.x = wheelR });
        /* شبح واقعی — جدول زمانی پیچ‌ها */
        if (gCar) {
          var gs = 0;
          var gc = S.prof.corners || [];
          if (t < (gc[0] || 1e9)) gs = t / Math.max(1, (gc[0] || 3000)) * (16 * (gc[0] || 3000) / 1000);
          else {
            var seg = 0;
            while (seg < gc.length && t > gc[seg]) seg++;
            if (seg >= gc.length) gs = 16 * ((gc[gc.length - 1] + 2500) / 1000);
            else { var s0 = seg === 0 ? 0 : 16 * (gc[seg - 1] / 1000), s1 = 16 * (gc[seg] / 1000);
              gs = lerp(s0, s1, (t - (seg === 0 ? 0 : gc[seg - 1])) / Math.max(1, gc[seg] - (seg === 0 ? 0 : gc[seg - 1]))) }
          }
          var gp2 = env.pointAt(gs / 16 * 1000);
          if (gp2) { gCar.position.set(gp2.x - Math.cos(gp2.hd) * 2.2, env.yAt(gp2.z) + 0.02, gp2.z - Math.sin(gp2.hd) * 2.2); gCar.rotation.y = -gp2.hd }
        }
        /* دوربین تعقیب — پشت ماشین در راستای مسیر */
        if (pt) {
          var fx = Math.sin(pt.hd), fz = -Math.cos(pt.hd); /* بردار جلو */
          S.rig.go(car.position.x - fx * 7.4, env.yAt(pt.z) + 3.1, car.position.z - fz * 7.4, car.position.x + fx * 4, 0.9, car.position.z + fz * 4, dt, 5, 60 + clamp(st.v / 17.5, 0, 1) * 8);
        }
        AD.rev(clamp(st.v / 17.5, 0, 1));
        S.hud.chip('spd', faN(Math.round(st.v * 3.6)) + ' km/h', 'timer');
        S.hud.meter('line').set(clamp(1 - dev / 3.0, 0, 1), st.offroad ? 'linear-gradient(90deg,#ff8a9d,#ff4d6d)' : 'linear-gradient(90deg,#3ee86e,#7dff9e)', Math.round(clamp(1 - dev / 3.0, 0, 1) * 100) + '٪');
        if (st.offroad && Math.random() < 0.3) S.vfx.dust(car.position.x, 0.15, car.position.z, 2, 0x9c8468);
        if (Math.abs(st.steer) > 0.72 && prox > 0.3 && Math.random() < 0.4) S.vfx.smoke(car.position.x - Math.cos(pt.hd) * 1.2, 0.15, car.position.z - Math.sin(pt.hd) * 1.2, 2);
        AD.setIntensity(0.3 + prox * 0.4);
        /* پایان استیج */
        if (t > corners[5].aS + 950) {
          st.phase = 'result';
          AD.engine(false); AD.crowdOn(); AD.setIntensity(0.8);
        }
      } else if (st.phase === 'result' && !st.done2) {
        st.done2 = true;
        var v2 = car.position.z; car.position.z = v2; /* توقف */
        st.v = 0;
        var sc = mirrorScore();
        var rows = '<div class="hd">🏁 پایان استیج کوهستان</div>';
        corners.forEach(function (c2, i2) { rows += '<div class="r me"><span>پیچ ' + faN(i2 + 1) + (c2.dir > 0 ? ' ↰' : ' ↱') + '</span><b>' + faN(Math.round((c2.q || 0) * 100)) + '٪ — +' + faN(Math.round((c2.q || 0) * 130)) + '</b></div>' });
        rows += '<div style="margin-top:6px;color:#ffd75e">امتیاز: ' + faN(sc) + '</div>';
        if (S.gh) rows += '<div class="r gh"><span>👻 ' + esc2(S.prof.nick) + '</span><b>' + faN(S.prof.score) + '</b></div>';
        S.hud.photo(rows);
        if (sc >= 550) { AD.fanfare(true); AD.music('win') }
        A.tm33(function () {
          var pb = 0; try { pb = (window.WD33_GHOST_DATA && window.WD33_GHOST_DATA.personal && Number(window.WD33_GHOST_DATA.personal.score)) || 0 } catch (e) {}
          if (A.MODE !== 'train' && sc > pb && sc >= 380) ceremony(S, { title: 'قهرمان رالی', subtitle: faN(sc) + ' امتیاز — استیج بی‌نقص' }, function () { S.finish(sc) });
          else S.finish(sc);
        }, 2900);
      }
      env.tick(dt, t, {});
    };
    return true;
  };

  /* ============================================================
     ۲۱) نصب — پوشش 3D روی GAMES (فقط ۵ رشته) + سقوط امن به 2D
     ============================================================ */
  function prefOn() { try { return (localStorage.getItem('wd3d') || '1') === '1' } catch (e) { return true } }
  function install() {
    var G = A.GAMES; if (!G) return;
    preload(); /* فایل 3D لود شده = قصد استفاده — Three همین حالا پیش‌بارگیری (غیرمسدودکننده) */
    for (var i = 0; i < FIVE.length; i++) {
      (function (key) {
        var prev = G[key]; if (!prev) return;
        G[key] = function (el, done) {
          window.WD_OLY3D_LAST = '2d';
          if (prefOn() && capable() && RT.three) {
            var took = false;
            try { took = play3D(key, el, done) } catch (e3d) { took = false }
            if (took) { window.WD_OLY3D_LAST = '3d'; return }
          }
          return prev(el, done);
        };
      })(FIVE[i]);
    }
    try { console.log('[WD_OLY4D] installed — 5 premium disciplines (tier=' + Q.tier + ', dpr=' + Q.dpr() + ')') } catch (e) {}
  }
  install();

  /* ---------- API عمومی (هاب/QA — سازگار با V3 + توسعه V4) ---------- */
  window.WD_OLY3D_LAST = '2d';
  window.WD_OLY4D = {
    FIVE: FIVE,
    capable: capable,
    ready: function () { return !!RT.three },
    preload: preload,
    low: function () { return RT.LOW },
    tier: function () { return Q.tier },
    audio: function () { return AD },
    active: function () { return !!(RT.S && !RT.S.over) },
    dispose: function () { try { if (RT.S) { RT.S.kill(true); RT.S = null; return true } } catch (e) {} return false },
    info: function () {
      try {
        return {
          three: !!RT.three, broken: RT.broken, low: RT.LOW, tier: Q.tier,
          active: !!(RT.S && !RT.S.over), key: RT.S ? RT.S.key : null,
          st: (function (o) { try { if (o && RT.S) o.now = Math.round(performance.now() - RT.S.t0) } catch (e) {} return o })(RT.S ? (RT.S.dbg || null) : null),
          render: RT.renderer ? { calls: RT.renderer.info.render.calls, tris: RT.renderer.info.render.triangles, frames: RT.renderer.info.render.frame } : null
        };
      } catch (e) { return { three: false, broken: true } }
    }
  };
  window.WD_OLY3D = window.WD_OLY4D; /* سازگاری کامل با هارنس‌های QA قبلی */
})();
