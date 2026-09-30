/* ============================================================
   WD_OLY3 — نسل ۳ المپیک World Dominion: موتور Gameplay مهارتی
   PHASE 1 (Engine) + PHASE 2 (تعامل واقعی) + PHASE 12 (Input)
   + PHASE 11 (کیفیت سه‌سطحی) — آینه‌ی بایت‌به‌بایت داور سرور
   (src/lib/olyScore.ts → SKILL3). هیچ امتیازی محلی نیست؛ خروجی
   این فایل فقط نمایش است، داوری = بازمحاسبه‌ی سرور از تله‌متری.
   نسخه: با ?v= از index.html کنترل می‌شود (V70).
   ============================================================ */
(function () {
  'use strict';
  var A = window.WD33_API;
  if (!A || !A.GAMES) return;

  /* ---------- PRNG — آینه‌ی دقیق سرور (seedOf3/rngOf3) ---------- */
  function seedOf3(str) {
    var h = 2166136261 >>> 0, s = String(str || '');
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
    return h >>> 0;
  }
  function rngOf3(seed, salt) {
    var a = seedOf3(seed + ':' + salt) | 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp3(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }
  var TAU = 6.28318;

  /* ---------- آینه‌ی فیزیک سرور (قطعی از seed) ---------- */
  function archRing3(seed, i, tRel, holdMs) {
    var r = rngOf3(seed, 'arch:' + i);
    var f1 = 900 + r() * 700, f2 = 500 + r() * 500;
    var p1 = r() * TAU, p2 = r() * TAU;
    var wind = r() * 2 - 1;
    var sway = 0.6 * Math.sin((tRel / f1) * TAU + p1) + 0.4 * Math.sin((tRel / f2) * TAU + p2);
    var amp = 1.0 - Math.min(1, holdMs / 2200) * 0.55;
    if (holdMs > 2600) amp += Math.min(0.8, (holdMs - 2600) / 1000 * 0.18);
    var d = Math.abs(sway + wind * 0.35) * amp;
    return { ring: Math.max(0, Math.round((1 - Math.min(1, d)) * 10)), off: (sway + wind * 0.35), amp: amp, wind: wind };
  }
  function archAmp(holdMs) {
    var amp = 1.0 - Math.min(1, holdMs / 2200) * 0.55;
    if (holdMs > 2600) amp += Math.min(0.8, (holdMs - 2600) / 1000 * 0.18);
    return amp;
  }
  function archSway(seed, i, tRel) {
    var r = rngOf3(seed, 'arch:' + i);
    var f1 = 900 + r() * 700, f2 = 500 + r() * 500;
    var p1 = r() * TAU, p2 = r() * TAU;
    var wind = r() * 2 - 1;
    var sway = 0.6 * Math.sin((tRel / f1) * TAU + p1) + 0.4 * Math.sin((tRel / f2) * TAU + p2);
    return { off: sway + wind * 0.35, wind: wind };
  }
  function weightPos3(seed, i, tRel) {
    var r = rngOf3(seed, 'wgt:' + i);
    var period = 900 + r() * 500, ph = r() * TAU;
    return Math.sin((tRel / period) * TAU + ph);
  }
  function cycTarget3(seed, seg) {
    var r = rngOf3(seed, 'cyc:' + seg);
    return [400, 520, 330, 300][Math.floor(r() * 4)];
  }
  /* V75 — P5: کتاب بازنویسی شد — رشته‌های ۶۴نویسه‌ای بدون اسلش (a8=0 … h1=63).
     قبلاً رشته‌ها با «/» بودند و کلاینت pos[sq] را روی رشته‌ی خام می‌خواند —
     نتیجه: صفحه‌ی نمایش به‌هم‌ریخته و هیچ پازلی قابل حل نبود. حالا مختصات
     صفحه = مختصات رشته؛ حرکت کتاب = مات-در-یک اثبات‌شده (scripts/chess-book-test.mjs). */
  var CHESS_BOOK3 = [
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
  ];
  function chessPick3(seed) {
    var r = rngOf3(seed, 'chess'), pick = [];
    while (pick.length < 3) {
      var i = Math.floor(r() * CHESS_BOOK3.length);
      if (pick.indexOf(i) < 0) pick.push(i);
    }
    return pick;
  }
  function fbDive3(seed, i) { return Math.floor(rngOf3(seed, 'fb:' + i)() * 3) }
  function volBlock3(seed, i) { return Math.floor(rngOf3(seed, 'vol:' + i)() * 3) }
  function ljBoard3(seed, i) { return 14 + Math.floor(rngOf3(seed, 'lj:' + i)() * 5) }
  function wreRival3(seed, b) {
    var r = rngOf3(seed, 'wre:' + b);
    return { base: 2.0 + r() * 0.8, s1: 2500 + r() * 3000, s2: 6500 + r() * 3000 };
  }
  function gymMove3(seed, i) {
    var r = rngOf3(seed, 'gym:' + i);
    var tk = Math.floor(r() * 3);
    return { type: ['arrow', 'hold', 'rapid'][tk], k: tk, dir: Math.floor(r() * 4) };
  }

  /* ---------- کیفیت سه‌سطحی (PHASE 11) — Gameplay یکسان، افکت متفاوت ---------- */
  var LOWFX = false;
  try {
    LOWFX = (window.WD60_FX && window.WD60_FX.state() === 'on') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { LOWFX = false }
  var DPR = Math.min(LOWFX ? 1 : 2, (window.devicePixelRatio || 1) || 1);

  /* ---------- ابزار صحنه: کانواس + HUD سبک ---------- */
  var faN = A.faN || function (n) { return String(n) };
  var snd = A.sndK2 || function () {};
  var FX = A.FX || { spark: function () {}, conf: function () {}, text: function () {}, ring: function () {}, shake: function () {}, flash: function () {}, punch: function () {}, dust: function () {}, pt: function () { return { x: 0, y: 0 } } };

  function mkStage(el, col, mode) {
    el.innerHTML = '';
    var chip = document.createElement('div');
    chip.className = 'oly3-chiprow';
    var finalChip = (A.MATCH && A.MATCH.final) ? '<span class="chip33" style="color:#ffd75e;border-color:rgba(255,215,94,.5)">🏁 فینال</span>' : '';
    var modeChip = mode === 'train' ? '<span class="chip33">🌀 تمرین</span>' : '<span class="chip33" style="color:#9fe8ff">کوالیفیکیشن</span>';
    chip.innerHTML = finalChip + modeChip + '<span class="chip33" id="oly3-score">۰</span>';
    el.appendChild(chip);
    var cv = document.createElement('canvas');
    cv.className = 'oly3-cv';
    cv.style.cssText = 'touch-action:none;-webkit-user-select:none;user-select:none;display:block;margin:6px auto 0;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));max-width:100%';
    el.appendChild(cv);
    var msg = document.createElement('div');
    msg.className = 'oly3-msg';
    msg.style.cssText = 'text-align:center;font-size:11px;color:#9fb6d4;margin-top:7px;min-height:16px;font-weight:700';
    el.appendChild(msg);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0;
    function size() {
      var r = el.getBoundingClientRect();
      var maxW = Math.min(520, (r.width || 340));
      var maxH = Math.max(240, Math.min(430, (window.innerHeight || 600) * 0.5));
      W = Math.round(maxW); H = Math.round(maxH);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    /* V71: addEventListener خام حذف شد — هر نشست بازی یک listener دائمی + نگه‌داشت کانواس می‌ساخت؛ مسیر CL (خط بعد) کافی است */
    A.on33(window, 'resize', function () { size() }); /* پاک‌سازی خودکار با CL */
    return { cv: cv, ctx: ctx, W: function () { return W }, H: function () { return H }, size: size, msg: msg, chip: chip, score: function (v) { var s = document.getElementById('oly3-score'); if (s) s.textContent = faN(Math.round(v)) } };
  }
  function txt(ctx, s, x, y, size, col, align, weight) {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = (weight || 700) + ' ' + size + 'px Vazirmatn, system-ui, sans-serif';
    ctx.fillStyle = col || '#eaf6ff';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  /* ---------- Input Manager (PHASE 12): ضد دبل‌تریگر ---------- */
  function inputOf(cv, handlers) {
    /* فقط Pointer Events — Touch/Click/Mouse جدا هیچ‌وقت بایند نمی‌شوند (ضد دبل‌تریگر) */
    var lastDown = 0;
    function down(ev) {
      ev.preventDefault();
      var now = performance.now();
      if (now - lastDown < 30) return; /* گارد تریگر دوگانه‌ی سیستمی */
      lastDown = now;
      var r = cv.getBoundingClientRect();
      var x = (ev.clientX - r.left), y = (ev.clientY - r.top);
      if (handlers.down) handlers.down(x, y, ev);
    }
    function move(ev) {
      var r = cv.getBoundingClientRect();
      var x = (ev.clientX - r.left), y = (ev.clientY - r.top);
      if (handlers.move) handlers.move(x, y, ev);
    }
    function up(ev) {
      ev.preventDefault();
      var r = cv.getBoundingClientRect();
      var x = (ev.clientX - r.left), y = (ev.clientY - r.top);
      if (handlers.up) handlers.up(x, y, ev);
      if (handlers.swipe) {
        if (handlers._dx !== undefined && (Math.abs(handlers._dx) > 24 || Math.abs(handlers._dy) > 24)) {
          handlers.swipe(handlers._dx, handlers._dy);
        }
        handlers._dx = undefined; handlers._dy = undefined;
      }
    }
    function mdown(ev) { if (handlers._sx === undefined) { handlers._sx = ev.clientX; handlers._sy = ev.clientY; handlers._dx = 0; handlers._dy = 0 } down(ev) }
    function mmove(ev) {
      if (handlers._sx !== undefined) { handlers._dx = ev.clientX - handlers._sx; handlers._dy = ev.clientY - handlers._sy }
      move(ev);
    }
    function mup(ev) { up(ev); handlers._sx = undefined; handlers._sy = undefined }
    A.on33(cv, 'pointerdown', mdown, { passive: false });
    A.on33(cv, 'pointermove', mmove, { passive: false });
    A.on33(cv, 'pointerup', mup, { passive: false });
    A.on33(cv, 'pointercancel', function (ev) { handlers._sx = undefined; handlers._sy = undefined; if (handlers.cancel) handlers.cancel(ev) }, { passive: false });
  }

  /* ---------- Game base: تک‌حلقه‌ی rAF، پایان یکتا ---------- */
  var TE = function () { try { A.TELE.ev.apply(A.TELE, arguments) } catch (e) {} };
  function Tnow() { return performance.now() - ((A.TELE && A.TELE.t0) || performance.now()) }
  function game(key, cfg) {
    /* cfg: {col, hint, build(st), frame(st,t,dt), input(st), done}  */
    var el = cfg.el, done = cfg.done;
    var st = { over: false, t0: performance.now() };
    var fired = false;
    try { if (cfg.build) cfg.build(st) } catch (e) {} /* وضعیت اولیه‌ی هر بازی — الزامی قبل از حلقه/ورودی */
    st.finish = function (score) {
      if (fired || st.over) return;
      fired = true; st.over = true;
      try { done(Math.max(0, Math.round(score))) } catch (e) { try { done(0) } catch (e2) {} }
    };
    st.T = function () { return performance.now() - st.t0 };
    var S = mkStage(el, cfg.col, A.MODE);
    st.S = S;
    var last = performance.now();
    /* حلقه‌ی واحد rAF روی loop33 رجیستری CL — با بستن صحنه خودکار قطع می‌شود (بدون لیک) */
    A.loop33(function (tt) {
      if (st.over) return;
      var now = performance.now();
      var dt = Math.min(50, now - last); last = now;
      try { cfg.frame(st, now - st.t0, dt) } catch (e) {}
    });
    try { if (cfg.hint) S.msg.textContent = cfg.hint } catch (e) {}
    inputOf(S.cv, cfg.input ? cfg.input(st) : {});
    return st;
  }

  /* ---------- Gate نسلی — هم‌راستا با داور سرور (SKILL3_ED=10) ---------- */
  function skillActive() {
    try {
      if (A.MODE === 'train') return true; /* تمرین همیشه با موتور جدید (سرور v3 در train می‌پذیرد) */
      var ed = window.WD33_EDITION || 0;
      if (!ed) { var p = (window.WD33_PHASE && window.WD33_PHASE()) || null; ed = (p && p.edition) || 0 }
      return ed >= 10;
    } catch (e) { return false }
  }
  function seedOf() { return (A.MATCH && A.MATCH.seed) ? String(A.MATCH.seed) : '' }
  function modeChip() { return A.MODE === 'train' }

  var G3 = {}; /* ۱۱ بازی نسل ۳ */
  window.WD_OLY3 = { G3: G3, skillActive: skillActive, mirrors: { archRing3: archRing3, weightPos3: weightPos3, cycTarget3: cycTarget3, chessPick3: chessPick3, fbDive3: fbDive3, volBlock3: volBlock3, ljBoard3: ljBoard3, wreRival3: wreRival3, gymMove3: gymMove3, rngOf3: rngOf3, seedOf3: seedOf3 } };

  /* ============================================================
     ۱) دو ۱۰۰ متر — Reaction Start + گام متناوب + ریتم
     تله‌متری: go / fs / p(side) — داور: v3Sprint
     ============================================================ */
  G3.sprint = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('sprint', {
      el: el, done: done, col: '#ff4d6d', hint: 'در «مرد آماده» دست نگه دار؛ بعد از شلیک، یک‌درمیان چپ/راست بزن!',
      build: function (st) {
        st.strides = 0; st.lastSide = -1; st.gaps = []; st.lastT = -1; st.goT = -1; st.fs = 0; st.firstT = -1;
        st.phase = 'set'; st.goAt = 900 + rngOf3(seed, 'go')() * 1400; st.dur = 8000;
        st.dq = false; st.dist = 0; st.flash = 0;
      },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over) return;
            var W = st.S.W();
            var side = x < W / 2 ? 0 : 1;
            if (st.phase === 'set') {
              st.fs++; TE('fs', st.T(), st.fs); FX.shake(); snd('alert');
              if (st.fs >= 2) { st.dq = true; st.finish(0); return }
              st.S.msg.textContent = '⚠️ شروع زودهنگام! یک بار دیگر = اخراج';
              return;
            }
            if (st.phase !== 'run') return;
            var t = st.T();
            if (side === st.lastSide) { FX.shake(); return } /* یک‌درمیان */
            if (st.lastT < 0) { st.firstT = t; TE('p', t, side) }
            else if (t - st.lastT >= 150) { TE('p', t, side); st.gaps.push(t - st.lastT) }
            else return; /* گپ غیرممکن محلی — سرور هم رد می‌کند */
            st.lastSide = side; st.lastT = t; st.strides++;
            st.dist = Math.min(100, st.strides * 1.9);
            snd('click'); FX.dust(x, y + 6, LOWFX ? 3 : 5);
            if (st.dist >= 100 && !st.tape) { st.tape = true; FX.flash('#7dff9e', .25); snd('crowd') }
          }
        };
      },
      frame: function (st, t, dt) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        /* فاز آماده‌باش */
        if (st.phase === 'set' && t >= st.goAt) {
          st.phase = 'run'; st.goT = st.T(); TE('go', st.goT);
          st.flash = 1; snd('stamp'); FX.flash('#fff', .3);
          st.S.msg.textContent = '⚡ شروع! یک‌درمیان چپ/راست';
        }
        /* پیست */
        var laneY = H * 0.52, laneH = Math.min(86, H * 0.3);
        var grad = c.createLinearGradient(0, laneY - laneH / 2, 0, laneY + laneH / 2);
        grad.addColorStop(0, 'rgba(255,77,109,.16)'); grad.addColorStop(1, 'rgba(255,77,109,.05)');
        c.fillStyle = grad; rr(c, 8, laneY - laneH / 2, W - 16, laneH, 14); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1; c.stroke();
        for (var m = 10; m <= 90; m += 10) {
          var mx = 8 + (m / 100) * (W - 16);
          c.strokeStyle = 'rgba(255,255,255,.10)';
          c.beginPath(); c.moveTo(mx, laneY - laneH / 2 + 6); c.lineTo(mx, laneY + laneH / 2 - 6); c.stroke();
          txt(c, faN(m), mx, laneY - laneH / 2 - 10, 9, 'rgba(255,255,255,.35)');
        }
        /* نوار پایان */
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.fillRect(W - 14, laneY - laneH / 2, 3, laneH);
        /* زمان‌سنج */
        var left = st.phase === 'set' ? 1 : Math.max(0, 1 - (t - st.goT) / st.dur);
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, 12, 12, W - 24, 8, 4); c.fill();
        c.fillStyle = left > .3 ? '#7dff9e' : '#ff8ba0'; rr(c, 12, 12, (W - 24) * left, 8, 4); c.fill();
        /* دونده */
        var rx = 8 + (st.dist / 100) * (W - 16);
        c.font = Math.round(laneH * 0.62) + 'px serif';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🏃', Math.min(W - 30, rx), laneY + 4);
        if (st.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + (st.flash * .5) + ')'; rr(c, 0, 0, W, H, 16); c.fill(); st.flash -= dt / 300 }
        /* آمار زنده */
        var rt = st.firstT > 0 && st.goT > 0 ? st.firstT - st.goT : 0;
        txt(c, 'متر: ' + faN(Math.round(st.dist)) + (rt ? '  •  واکنش: ' + faN(rt) + 'ms' : ''), W / 2, laneY + laneH / 2 + 22, 12, '#9fb6d4');
        txt(c, st.phase === 'set' ? 'مرد آماده…' : (st.tape ? '🏁 گوش تا گوش!' : 'بزن! بزن! بزن!'), W / 2, H - 18, 13, st.phase === 'set' ? '#ffd75e' : '#7dff9e');
        /* پایان زمان */
        if (st.phase === 'run' && t - st.goT >= st.dur) {
          var dist = Math.min(100, st.strides * 1.9);
          var rtp = rt <= 180 ? 100 : rt <= 250 ? 80 : rt <= 350 ? 60 : rt <= 500 ? 35 : 15;
          var mean = 0, i; for (i = 0; i < st.gaps.length; i++) mean += st.gaps[i]; mean = st.gaps.length ? mean / st.gaps.length : 0;
          var vs = 0; for (i = 0; i < st.gaps.length; i++) vs += (st.gaps[i] - mean) * (st.gaps[i] - mean);
          var sd = st.gaps.length > 1 ? Math.sqrt(vs / st.gaps.length) : 0;
          var rhythm = clamp3(1 - sd / 160, 0, 1);
          var score = st.dq ? 0 : (Math.round(dist * 7.5) + rtp + Math.round(rhythm * 180));
          if (!st.dq && dist >= 100) { FX.conf(LOWFX ? 30 : 70); snd('cheer') }
          st.S.score(score);
          st.finish(score);
        }
      }
    });
    return true;
  };

  /* ============================================================
     ۲) تیراندازی با کمان — نوسان قطعی + کنترل نفس (Hold/Release)
     تله‌متری: draw(i) / shot(ring) — داور: v3Archery
     ============================================================ */
  G3.archery = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('archery', {
      el: el, done: done, col: '#ffb02e', hint: 'نگه دار تا دستت آرام بگیرد، در مرکز رها کن — صبر زیاد = خستگی!',
      build: function (st) { st.shot = 0; st.drawT = -1; st.hold0 = 0; st.pts = 0; st.rings = []; st.done = false },
      input: function (st) {
        return {
          down: function () {
            if (st.over || st.done || st.drawT >= 0) return;
            st.drawT = st.T(); TE('draw', st.drawT, st.shot); snd('click');
            st.S.msg.textContent = 'نفس را حبس کن… در مرکز رها کن';
          },
          up: function () {
            if (st.over || st.done || st.drawT < 0) return;
            var t = st.T(), hold = t - st.drawT;
            var m = archRing3(seed, st.shot, t, hold);
            TE('shot', t, m.ring);
            st.rings.push(m.ring); st.pts += m.ring * 20;
            st.S.score(st.pts);
            FX.text(FX.pt(st.S.cv).x || st.S.W() / 2, st.S.H() * 0.32, faN(m.ring), m.ring >= 9 ? '#7dff9e' : m.ring >= 6 ? '#ffd75e' : '#ff8ba0', 22);
            snd(m.ring >= 9 ? 'coin' : m.ring >= 5 ? 'click' : 'alert');
            st.drawT = -1; st.shot++;
            if (st.shot >= 5) {
              st.done = true;
              var all9 = true; for (var i = 0; i < 5; i++) if (st.rings[i] < 9) all9 = false;
              var score = st.pts + (all9 ? 60 : 0);
              if (all9) { FX.conf(LOWFX ? 30 : 60); snd('cheer') }
              st.S.msg.textContent = all9 ? '💥 پنج تیر طلایی!' : 'پنج تیر تمام — ' + faN(st.pts) + ' امتیاز';
              st.finish(score);
            } else {
              st.S.msg.textContent = 'تیر ' + faN(st.shot + 1) + ' از ۵ — باد: ' + (function (w) { return w > .3 ? '→→' : w > .1 ? '→' : w < -.3 ? '←←' : w < -.1 ? '←' : 'آرام' })(archSway(seed, st.shot, 0).wind);
            }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var cx = W / 2, cy = H * 0.42, R = Math.min(W, H) * 0.34;
        /* هدف */
        var cols = ['#f6f7fb', '#ff4d4d', '#f6f7fb', '#ff4d4d', '#ffd75e'];
        for (var i = 5; i >= 1; i--) {
          c.beginPath(); c.arc(cx, cy, R * i / 5, 0, TAU);
          c.fillStyle = i === 1 ? '#ffd75e' : (i % 2 ? '#f6f7fb' : '#ff4d4d'); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke();
        }
        txt(c, '۱۰', cx, cy, 10, '#7a5b00');
        /* نوسان نشانگر */
        var hold = st.drawT >= 0 ? t - st.drawT : 0;
        var sw = archSway(seed, st.shot, t);
        var amp = archAmp(hold);
        var ox = sw.off * amp * R, oy = Math.sin(t / 700) * 0.12 * amp * R;
        /* باد */
        txt(c, '🌬️ باد: ' + (sw.wind > .3 ? '→→' : sw.wind > .1 ? '→' : sw.wind < -.3 ? '←←' : sw.wind < -.1 ? '←' : 'آرام'), W / 2, 16, 11, '#9fb6d4');
        /* نشانگر */
        c.beginPath(); c.arc(cx + ox, cy + oy, 6, 0, TAU);
        c.fillStyle = st.drawT >= 0 ? '#ff4d6d' : '#cdd7e8'; c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
        /* نوار نفس */
        var bw = W * 0.6, bx = (W - bw) / 2, by = H - 34;
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, bx, by, bw, 8, 4); c.fill();
        var q = st.drawT >= 0 ? clamp3(1 - Math.abs(sw.off) * amp, 0, 1) : 0;
        c.fillStyle = q > .85 ? '#7dff9e' : q > .5 ? '#ffd75e' : '#ff8ba0';
        rr(c, bx, by, bw * q, 8, 4); c.fill();
        txt(c, st.drawT >= 0 ? (hold > 2600 ? 'خسته شدی — رها کن!' : 'ثبات: ' + faN(Math.round(q * 100)) + '٪') : 'برای کشیدن کمان دست نگه دار', W / 2, H - 14, 11, '#9fb6d4');
        for (i = 0; i < st.rings.length; i++) txt(c, faN(st.rings[i]), 16 + i * 22, H - 52, 12, st.rings[i] >= 9 ? '#7dff9e' : '#cdd7e8');
      }
    });
    return true;
  };

  /* ============================================================
     ۳) شنا — ضربه‌ی متناوب + ریتم + چرخش دیوار
     تله‌متری: p(side) / turn(q) — داور: v3Swim
     ============================================================ */
  G3.swim = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('swim', {
      el: el, done: done, col: '#2bb8ff', hint: 'یکی‌درمیان چپ/راست! روی دیوار ۲۵م، دکمه‌ی 🔄 را به‌موقع بزن',
      build: function (st) { st.n = 0; st.lastSide = -1; st.gaps = []; st.lastT = -1; st.turns = []; st.dur = 10000; st.dist = 0; st.turnOpen = -1 },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over) return;
            var W = st.S.W(), H = st.S.H();
            var t = st.T();
            /* دکمه‌ی چرخش — وسط پایین */
            if (st.turnOpen > 0 && y > H * 0.66) {
              var q = clamp3(1 - Math.abs(t - st.turnOpen) / 700, 0, 1);
              TE('turn', t, q); st.turns.push(q);
              FX.text(W / 2, H * 0.5, 'چرخش ' + faN(Math.round(q * 100)) + '٪', q > .7 ? '#7dff9e' : '#ffd75e', 16);
              snd(q > .7 ? 'coin' : 'click'); st.turnOpen = -1; return;
            }
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) { FX.shake(); return }
            if (st.lastT >= 0 && t - st.lastT < 140) return;
            if (st.lastT >= 0) st.gaps.push(t - st.lastT);
            st.lastSide = side; st.lastT = t; st.n++;
            st.dist = Math.min(100, st.n * 1.55);
            snd('click'); FX.spark(x, y, ['#2bb8ff', '#fff'], LOWFX ? 4 : 7, 70, .35);
            var wall = [16, 32, 48][st.turns.length];
            if (st.turns.length < 3 && st.n === wall) st.turnOpen = t;
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var laneY = H * 0.42, laneH = Math.min(80, H * 0.26);
        var grad = c.createLinearGradient(0, laneY - laneH / 2, 0, laneY + laneH / 2);
        grad.addColorStop(0, 'rgba(43,184,255,.2)'); grad.addColorStop(1, 'rgba(43,184,255,.06)');
        c.fillStyle = grad; rr(c, 8, laneY - laneH / 2, W - 16, laneH, 14); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.stroke();
        /* خط‌چین لاین */
        c.setLineDash([8, 10]); c.strokeStyle = 'rgba(255,255,255,.14)';
        c.beginPath(); c.moveTo(16, laneY); c.lineTo(W - 16, laneY); c.stroke(); c.setLineDash([]);
        var left = Math.max(0, 1 - t / st.dur);
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, 12, 12, W - 24, 8, 4); c.fill();
        c.fillStyle = '#2bb8ff'; rr(c, 12, 12, (W - 24) * left, 8, 4); c.fill();
        var sx = 8 + (st.dist / 100) * (W - 16);
        c.font = Math.round(laneH * 0.6) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🏊', Math.min(W - 30, sx), laneY + 2);
        txt(c, 'متر: ' + faN(Math.round(st.dist)) + '  •  ضربه: ' + faN(st.n), W / 2, laneY + laneH / 2 + 20, 12, '#9fb6d4');
        if (st.turnOpen > 0) {
          var q2 = clamp3(1 - Math.abs(t - st.turnOpen) / 700, 0, 1);
          if (q2 <= 0) st.turnOpen = -1;
          else {
            c.fillStyle = 'rgba(255,215,94,' + (0.25 + q2 * 0.4) + ')';
            rr(c, W / 2 - 64, H * 0.72, 128, 44, 12); c.fill();
            txt(c, '🔄 بچرخ!', W / 2, H * 0.72 + 22, 16, '#fff');
          }
        }
        txt(c, st.turnOpen > 0 ? 'دیوار ۲۵ متر — بچرخ!' : 'یکی‌درمیان! ریتم را نگه دار', W / 2, H - 14, 12, st.turnOpen > 0 ? '#ffd75e' : '#9fb6d4');
        if (t >= st.dur) {
          var dist = Math.min(100, st.n * 1.55);
          var mean = 0, i; for (i = 0; i < st.gaps.length; i++) mean += st.gaps[i]; mean = st.gaps.length ? mean / st.gaps.length : 0;
          var vs = 0; for (i = 0; i < st.gaps.length; i++) vs += (st.gaps[i] - mean) * (st.gaps[i] - mean);
          var sd = st.gaps.length > 1 ? Math.sqrt(vs / st.gaps.length) : 0;
          var rhythm = clamp3(1 - sd / 170, 0, 1);
          var tPts = 0; for (i = 0; i < st.turns.length; i++) tPts += Math.round(st.turns[i] * 27);
          var score = Math.round(dist * 7) + Math.round(rhythm * 200) + Math.min(81, tPts);
          st.S.score(score); st.finish(score);
        }
      }
    });
    return true;
  };

  /* ============================================================
     ۴) ژیمناستیک — روتین seed-محور: سوایپ/نگه‌داشتن/تندزنی + سختی انتخابی
     تله‌متری: diff(lvl) / mv(ok,fast) — داور: v3Gym
     ============================================================ */
  G3.gym = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('gym', {
      el: el, done: done, col: '#b06bff', hint: 'روتین انتخاب کن — حرکات را به‌موقع و دقیق اجرا کن',
      build: function (st) { st.phase = 'pick'; st.lvl = 0; st.i = 0; st.pts = 0; st.streak = 0; st.best = 0; st.miss = 0; st.log = []; st.move = null; st.moveT0 = 0; st.holdA = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var W = st.S.W(), H = st.S.H();
            if (st.over) return;
            if (st.phase === 'pick') {
              var bw = Math.min(150, (W - 40) / 3);
              if (y > H * 0.3 && y < H * 0.3 + 56) {
                var idx = Math.floor((x - 20) / (bw + 8));
                if (idx >= 0 && idx <= 2) {
                  st.lvl = idx; TE('diff', st.T(), idx); st.phase = 'run';
                  st.moveT0 = st.T(); snd('stamp');
                  st.S.msg.textContent = ['روتین پایه', 'روتین پیشرفته ×۱٫۱۸', 'روتین المپیکی ×۱٫۳۵'][idx];
                }
              }
              return;
            }
            if (st.phase !== 'run' || !st.move) return;
            var t = st.T();
            var win = 2200 - st.lvl * 250;
            var mv = st.move;
            if (mv.type === 'hold') {
              if (st.holdA) return;
              st.holdA = t; return;
            }
            if (mv.type === 'arrow') {
              /* سوایپ با pointermove یا تپ روی ۴ ناحیه */
              st._pd = { x: x, y: y, t: t };
              return;
            }
            if (mv.type === 'rapid') {
              st.rap = st.rap || { n: 0, t0: t };
              st.rap.n++;
              if (t - st.rap.t0 > 1600) { st.rap.n = 1; st.rap.t0 = t }
              if (st.rap.n >= 3) { gymResolve(st, true, (t - st.moveT0) < win * 0.45, 2, 0); st.rap = null }
              snd('click');
            }
          },
          move: function (x, y) {
            if (st.phase !== 'run' || !st.move || st.move.type !== 'arrow' || !st._pd) return;
            var dx = x - st._pd.x, dy = y - st._pd.y;
            if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return;
            var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 1 : 0);
            var t = st.T();
            var ok = dir === st.move.dir;
            gymResolve(st, ok, ok && (t - st.moveT0) < (2200 - st.lvl * 250) * 0.45, 0, dir);
            st._pd = null;
          },
          up: function (x, y) {
            if (st.phase !== 'run' || !st.move) return;
            var t = st.T(), win = 2200 - st.lvl * 250;
            if (st.move.type === 'hold' && st.holdA) {
              var hold = t - st.holdA; st.holdA = 0;
              /* هدف: نگاه‌داشتن تا حلقه در ناحیه (۵۵۰..۱۵۰۰ms) */
              var ok = hold >= 550 && hold <= 1500;
              gymResolve(st, ok, ok && hold < 1000, 1, 0);
              return;
            }
            if (st.move.type === 'arrow' && st._pd) {
              /* تپ ساده روی ناحیه‌ها هم پذیرفته است */
              var W = st.S.W(), H = st.S.H();
              var dir = -1;
              if (y < H * 0.28) dir = 0; else if (y > H * 0.62) dir = 1;
              else if (x < W / 2) dir = 2; else dir = 3;
              var ok2 = dir === st.move.dir;
              gymResolve(st, ok2, ok2 && (t - st.moveT0) < win * 0.45, 0, dir);
              st._pd = null;
            }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.phase === 'pick') {
          txt(c, 'ژیمناستیک — روتینت را انتخاب کن', W / 2, H * 0.16, 15, '#ffd75e');
          var bw = Math.min(150, (W - 40) / 3);
          var opts = [['🟢 پایه', '×۱٫۰۰'], ['🟡 پیشرفته', '×۱٫۱۸'], ['🔴 المپیکی', '×۱٫۳۵']];
          for (var i = 0; i < 3; i++) {
            var bx = 20 + i * (bw + 8);
            c.fillStyle = ['rgba(125,255,158,.14)', 'rgba(255,215,94,.14)', 'rgba(255,77,109,.16)'][i];
            rr(c, bx, H * 0.3, bw, 56, 12); c.fill();
            c.strokeStyle = 'rgba(255,255,255,.2)'; c.stroke();
            txt(c, opts[i][0], bx + bw / 2, H * 0.3 + 22, 12, '#fff');
            txt(c, opts[i][1], bx + bw / 2, H * 0.3 + 40, 11, '#9fb6d4');
          }
          txt(c, 'سخت‌تر = امتیاز بیشتر — خطا هم سنگین‌تر', W / 2, H * 0.3 + 84, 10, '#9fb6d4');
          return;
        }
        var win = 2200 - st.lvl * 250;
        /* حرکت جاری */
        if (!st.move && st.i < 10) {
          st.move = gymMove3(seed, st.i);
          st.moveT0 = t; st.holdA = 0; st.rap = null;
          var names = { arrow: 'سوایپ کن', hold: 'نگه دار و در حلقه رها کن', rapid: '۳ بار تند بزن' };
          st.S.msg.textContent = 'حرکت ' + faN(st.i + 1) + '/۱۰: ' + names[st.move.type];
        }
        if (st.move) {
          var el0 = t - st.moveT0;
          if (st.move.type === 'arrow') {
            var icons = ['⬆️', '⬇️', '⬅️', '➡️'];
            txt(c, icons[st.move.dir], W / 2, H * 0.4, Math.min(64, W * 0.18), '#fff');
            txt(c, 'سوایپ در همین جهت', W / 2, H * 0.58, 11, '#9fb6d4');
          } else if (st.move.type === 'hold') {
            /* حلقه‌ی هدف */
            var R0 = Math.min(W, H) * 0.24;
            c.beginPath(); c.arc(W / 2, H * 0.4, R0, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 3; c.stroke();
            var ph = clamp3(el0 / 1600, 0, 1.2);
            var rr2 = R0 * (1 - ph * 0.55);
            c.beginPath(); c.arc(W / 2, H * 0.4, rr2, 0, TAU); c.strokeStyle = (ph >= 0.35 && ph <= 0.85) ? '#7dff9e' : '#ff8ba0'; c.lineWidth = 5; c.stroke();
            txt(c, st.holdA ? 'حالا رها کن…' : 'نگه دار (حلقه در ناحیه سبز)', W / 2, H * 0.58, 11, '#9fb6d4');
          } else {
            txt(c, '⚡⚡⚡', W / 2, H * 0.4, 40, '#ffd75e');
            txt(c, '۳ بار تند بزن', W / 2, H * 0.58, 11, '#9fb6d4');
          }
          /* تایم‌سنج حرکت */
          var lp = clamp3(el0 / win, 0, 1);
          c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, 12, 12, W - 24, 8, 4); c.fill();
          c.fillStyle = lp > .8 ? '#ff8ba0' : '#b06bff'; rr(c, 12, 12, (W - 24) * lp, 8, 4); c.fill();
          if (el0 >= win) { gymResolve(st, false, false, st.move.k, 0) }
        }
        /* نوار پیشرفت روتین + امتیاز */
        for (var k = 0; k < 10; k++) {
          c.fillStyle = k < st.log.length ? (st.log[k] ? '#7dff9e' : '#ff8ba0') : 'rgba(255,255,255,.15)';
          rr(c, W / 2 - 105 + k * 21, H - 30, 16, 6, 3); c.fill();
        }
        txt(c, 'امتیاز: ' + faN(Math.max(0, st.pts)) + (st.streak >= 2 ? '  🔥 کمبو ' + faN(st.streak) : ''), W / 2, H - 12, 11, '#9fb6d4');
        if (st.i >= 10 && !st._fin) gymFinish(st);
      }
    });
    function gymResolve(st, ok, fast, kind, dir) {
      if (st.over || !st.move) return;
      var mi = st.i;
      TE('mv', st.T(), ok ? 1 : 0, fast ? 1 : 0, mi, kind || 0, dir || 0);
      st.log.push(!!ok);
      if (ok) { st.pts += 60 + (fast ? 25 : 0); st.streak++; if (st.streak > st.best) st.best = st.streak; snd('coin'); FX.text(st.S.W() / 2, st.S.H() * 0.3, fast ? 'عالی! +' + faN(85) : 'خوب +۶۰', '#7dff9e', 15) }
      else { st.pts -= 20; st.miss++; st.streak = 0; snd('alert'); FX.shake(); FX.text(st.S.W() / 2, st.S.H() * 0.3, 'خطا −۲۰', '#ff8ba0', 15) }
      st.S.score(Math.max(0, st.pts));
      st.move = null; st.i++;
      if (st.miss >= 4) gymFinish(st); /* ۴ خطا = پایان روتین (داور هم همین‌جا قطع می‌کند) */
    }
    function gymFinish(st) {
      if (st.over || st._fin) return;
      st._fin = true;
      var bonus = st.best >= 3 ? Math.min(80, (st.best - 2) * 15) : 0;
      var mult = [1, 1.18, 1.35][st.lvl];
      var score = Math.max(0, Math.round((st.pts + bonus) * mult));
      if (score >= 700) { FX.conf(LOWFX ? 30 : 60); snd('cheer') }
      st.S.score(score); st.finish(score);
    }
    return true;
  };

  /* ============================================================
     ۵) وزنه‌برداری — میله‌ی نوسانی قطعی، دقت لحظه‌ی ضربه
     تله‌متری: lift(p) — داور: v3Weight (p سرور از seed)
     ============================================================ */
  G3.weight = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('weight', {
      el: el, done: done, col: '#ff7847', hint: 'وقتی نشانگر وسط ناحیه‌ی طلایی است بزن — ۵ حرکت',
      build: function (st) { st.lift = 0; st.pts = 0; st.streak = 0; st.flash = 0; st.lastP = 0 },
      input: function (st) {
        return {
          down: function () {
            if (st.over || st.lift >= 5) return;
            var t = st.T();
            var pos = weightPos3(seed, st.lift, t);
            var pS = 1 - Math.min(1, Math.abs(pos));
            TE('lift', t, pS);
            st.lastP = pS;
            st.pts += Math.round(200 * pS);
            if (pS >= 0.8) { st.streak++; st.pts += Math.min(100, st.streak * 25) } else st.streak = 0;
            st.S.score(st.pts);
            st.flash = 1;
            if (pS >= 0.92) { FX.text(st.S.W() / 2, st.S.H() * 0.3, 'کامل!', '#7dff9e', 18); snd('cheer') }
            else if (pS >= 0.7) { FX.text(st.S.W() / 2, st.S.H() * 0.3, '+' + faN(Math.round(200 * pS)), '#ffd75e', 16); snd('coin') }
            else { FX.text(st.S.W() / 2, st.S.H() * 0.3, 'کج رفت', '#ff8ba0', 15); snd('alert') }
            st.lift++;
            if (st.lift >= 5) {
              var score = st.pts;
              if (score >= 800) { FX.conf(LOWFX ? 30 : 60) }
              st.S.msg.textContent = 'پنج حرکت تمام — ' + faN(score) + ' امتیاز';
              st.finish(score);
            } else {
              st.S.msg.textContent = 'حرکت ' + faN(st.lift + 1) + ' از ۵ — ' + faN(120 + st.lift * 35) + ' کیلوگرم';
            }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var cy = H * 0.4, barW = W * 0.8, bx = (W - barW) / 2;
        /* میله */
        c.strokeStyle = '#cdd7e8'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(bx, cy); c.lineTo(bx + barW, cy); c.stroke();
        /* دیسک‌ها */
        c.fillStyle = '#ff7847';
        c.beginPath(); c.arc(bx, cy, 15, 0, TAU); c.fill();
        c.beginPath(); c.arc(bx + barW, cy, 15, 0, TAU); c.fill();
        /* ناحیه‌ی طلایی */
        var zw = 34;
        c.fillStyle = 'rgba(125,255,158,.18)'; rr(c, W / 2 - zw, cy - 26, zw * 2, 52, 8); c.fill();
        c.strokeStyle = 'rgba(125,255,158,.6)'; c.lineWidth = 1.5; c.stroke();
        /* نشانگر متحرک */
        var pos = weightPos3(seed, st.lift, t);
        var px = W / 2 + pos * (barW / 2 - 20);
        c.beginPath(); c.arc(px, cy, 11, 0, TAU);
        c.fillStyle = Math.abs(pos) < 0.18 ? '#7dff9e' : '#fff'; c.fill();
        c.strokeStyle = '#ff7847'; c.lineWidth = 2.5; c.stroke();
        if (st.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + (st.flash * .25) + ')'; rr(c, 0, 0, W, H, 16); c.fill(); st.flash -= 0.06 }
        /* وزنه و پیشرفت */
        txt(c, '🏋️ ' + faN(120 + st.lift * 35) + ' کیلوگرم', W / 2, cy - 52, 14, '#ffd75e');
        for (var k = 0; k < 5; k++) {
          c.fillStyle = k < st.lift ? 'rgba(125,255,158,.7)' : 'rgba(255,255,255,.15)';
          rr(c, W / 2 - 60 + k * 25, H - 30, 20, 7, 3); c.fill();
        }
        txt(c, st.lift < 5 ? 'وقتی نشانگر روی سبز است بزن!' : 'تمام شد', W / 2, H - 12, 11, '#9fb6d4');
      }
    });
    return true;
  };

  /* ============================================================
     ۶) دوچرخه‌سواری — ریتم پدال در برابر مسیر seed-محور
     تله‌متری: pedal(dt) — داور: v3Cycling
     ============================================================ */
  G3.cycling = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('cycling', {
      el: el, done: done, col: '#3ee86e', hint: 'هر ضربه را با ریتم مسیر هماهنگ کن — ثبات = سبقت',
      build: function (st) { st.lastT = -1; st.qs = []; st.dur = 20000; st.lastQ = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over) return;
            var t = st.T();
            if (st.lastT >= 0) {
              var dt = t - st.lastT;
              if (dt < 90) return; /* سریع‌تر از حد فیزیکی — بی‌صدا (EV_GAP داور = ۹۰) */
              TE('pedal', t, Math.round(dt)); /* dt فقط برای نمایش — داور از فاصله‌ی واقعی می‌سازد */
              if (dt > 2600) { st.qs = []; st.lastQ = 0 } /* توقف/ساحل‌گیری — ریتم ریست */
              else {
                var seg = Math.floor(t / 3500);
                var q = clamp3(1 - Math.abs(dt - cycTarget3(seed, seg)) / 220, 0, 1);
                st.qs.push(q); st.lastQ = q;
                if (q > 0.85) { snd('coin'); FX.text(x, y - 14, 'عالی', '#7dff9e', 13) }
                else snd('click');
                if (st.qs.length > 160) { /* داور overrun — زودتر تمام کن */ st.finish(cycMirror(st)); return }
              }
            }
            st.lastT = t;
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        /* پروفایل مسیر */
        var segs = Math.ceil(st.dur / 3500);
        var names = ['جاده', 'سربالایی', 'سرپایینی', 'اسپرینت'];
        var cols = ['rgba(255,255,255,.25)', 'rgba(255,120,71,.7)', 'rgba(126,216,255,.7)', 'rgba(255,215,94,.8)'];
        var seg = Math.min(segs - 1, Math.floor(t / 3500));
        var ty = cycTarget3(seed, seg);
        for (var i = 0; i < segs; i++) {
          var sxx = 14 + i * ((W - 28) / segs);
          c.fillStyle = cols[cycTarget3(seed, i) === 400 ? 0 : cycTarget3(seed, i) === 520 ? 1 : cycTarget3(seed, i) === 330 ? 2 : 3];
          c.globalAlpha = i === seg ? 1 : 0.35;
          rr(c, sxx, 16, (W - 28) / segs - 5, 12, 4); c.fill();
          c.globalAlpha = 1;
        }
        txt(c, names[[400, 520, 330, 300].indexOf(ty)] + ' — ریتم هدف: ' + faN(ty) + 'ms', W / 2, 44, 11, '#9fb6d4');
        /* جاده */
        var ry = H * 0.5;
        c.strokeStyle = 'rgba(62,232,110,.4)'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(8, ry + 30); c.quadraticCurveTo(W / 2, ry - 24, W - 8, ry + 18); c.stroke();
        /* دوچرخه‌سوار با انیمیشن پدال */
        var prog = (t % 3600) / 3600;
        var rx = 30 + prog * (W - 60);
        c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🚴', rx, ry);
        /* کادنسی */
        var bw = W * 0.6, bx = (W - bw) / 2, by = H - 40;
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, bx, by, bw, 10, 5); c.fill();
        c.fillStyle = st.lastQ > .85 ? '#7dff9e' : st.lastQ > .5 ? '#ffd75e' : '#ff8ba0';
        rr(c, bx, by, bw * st.lastQ, 10, 5); c.fill();
        txt(c, 'تعداد ضربه: ' + faN(st.qs.length) + '  •  ثبات آخرین: ' + faN(Math.round(st.lastQ * 100)) + '٪', W / 2, by + 22, 11, '#9fb6d4');
        var left = Math.max(0, 1 - t / st.dur);
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 12, H - 12, (W - 24) * left, 4, 2); c.fill();
        if (t >= st.dur) { st.finish(cycMirror(st)) }
      }
    });
    function cycMirror(st) {
      if (st.qs.length < 4) return 0;
      var sum = 0, i; for (i = 0; i < st.qs.length; i++) sum += st.qs[i];
      var avg = sum / st.qs.length;
      var vs = 0; for (i = 0; i < st.qs.length; i++) vs += (st.qs[i] - avg) * (st.qs[i] - avg);
      var sd = Math.sqrt(vs / st.qs.length);
      var cons = clamp3(1 - sd / 0.35, 0, 1);
      var score = Math.round(avg * 800) + Math.round(cons * 200);
      st.S.score(score);
      return score;
    }
    return true;
  };

  /* ============================================================
     ۷) شطرنج — مات‌در-یک واقعی از کتاب seed-محور (Tap piece → Tap target)
     تله‌متری: mv(idx,from,to) / puz(idx,ok,dt) — داور: v3Chess
     ============================================================ */
  G3.chess = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var PICK = chessPick3(seed);
    var GLYPH = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    var g = game('chess', {
      el: el, done: done, col: '#9fb6e8', hint: 'مات در یک حرکت! مهره را بزن، بعد خانه‌ی مقصد را',
      build: function (st) { st.pi = 0; st.pts = 0; st.solved = 0; st.sel = -1; st.pT0 = st.T(); st.pDur = 45000; st.lock = false },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over || st.lock) return;
            var W = st.S.W(), H = st.S.H();
            var bs = Math.min(W - 24, H - 90), bx = (W - bs) / 2, by = 40;
            if (x < bx || x > bx + bs || y < by || y > by + bs) return;
            var sq = Math.floor((y - by) / (bs / 8)) * 8 + Math.floor((x - bx) / (bs / 8));
            var pos = CHESS_BOOK3[PICK[st.pi]].pos;
            var piece = pos[sq];
            if (st.sel < 0) {
              if (piece && piece !== '.' && piece === piece.toUpperCase()) { st.sel = sq; snd('click') }
              return;
            }
            if (sq === st.sel) { st.sel = -1; return }
            /* حرکت انجام شد */
            var from = st.sel, to = sq;
            st.sel = -1; st.lock = true;
            var ok = (from === CHESS_BOOK3[PICK[st.pi]].mv[0] && to === CHESS_BOOK3[PICK[st.pi]].mv[1]) ? 1 : 0;
            var dt = Math.round(st.T() - st.pT0);
            TE('mv', st.T(), st.pi, from, to);
            TE('puz', st.T(), st.pi, ok, dt);
            if (ok) {
              st.pts += 200 + (dt < 6000 ? 50 : dt < 10000 ? 25 : 0); st.solved++;
              st.S.score(st.pts); snd('coin');
              FX.text(W / 2, H * 0.75, '♟ مات! +' + faN(200 + (dt < 6000 ? 50 : dt < 10000 ? 25 : 0)), '#7dff9e', 17);
            } else {
              snd('alert'); FX.shake();
              FX.text(W / 2, H * 0.75, 'مات نبود…', '#ff8ba0', 15);
            }
            setTimeout(function () {
              if (st.over) return;
              st.lock = false; st.pi++;
              if (st.pi >= 3) {
                var score = st.pts + (st.solved === 3 ? 60 : 0);
                if (st.solved === 3) { FX.conf(LOWFX ? 30 : 60); snd('cheer') }
                st.S.msg.textContent = 'پایان — ' + faN(st.solved) + ' از ۳ مات';
                st.finish(score);
              } else { st.pT0 = st.T(); st.S.msg.textContent = 'پازل ' + faN(st.pi + 1) + ' از ۳' }
            }, 900);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var pos = CHESS_BOOK3[PICK[Math.min(2, st.pi)]].pos;
        var bs = Math.min(W - 24, H - 90), bx = (W - bs) / 2, by = 40;
        var cs = bs / 8;
        txt(c, 'مات در یک حرکت — حرکت با سفید', W / 2, 20, 12, '#ffd75e');
        for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
          var dark = (r + f) % 2 === 1;
          c.fillStyle = dark ? 'rgba(159,182,232,.30)' : 'rgba(255,255,255,.10)';
          c.fillRect(bx + f * cs, by + r * cs, cs, cs);
          var sq = r * 8 + f;
          if (sq === st.sel) { c.fillStyle = 'rgba(255,215,94,.35)'; c.fillRect(bx + f * cs, by + r * cs, cs, cs) }
          var pc = pos[sq];
          if (pc && pc !== '.') {
            c.font = Math.round(cs * 0.72) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(GLYPH[pc] || '?', bx + f * cs + cs / 2, by + r * cs + cs / 2 + 1);
          }
        }
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5;
        c.strokeRect(bx, by, bs, bs);
        /* تایمر پازل */
        var left = Math.max(0, 1 - (t - st.pT0) / st.pDur);
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, 12, H - 26, W - 24, 8, 4); c.fill();
        c.fillStyle = left > .4 ? '#9fb6e8' : '#ff8ba0'; rr(c, 12, H - 26, (W - 24) * left, 8, 4); c.fill();
        txt(c, 'پازل ' + faN(st.pi + 1) + ' از ۳  •  حل‌شده: ' + faN(st.solved), W / 2, H - 10, 11, '#9fb6d4');
        /* تایم‌اوت */
        if (!st.lock && t - st.pT0 >= st.pDur) {
          st.lock = true;
          TE('puz', st.T(), st.pi, 0, st.pDur);
          snd('alert');
          setTimeout(function () {
            if (st.over) return;
            st.lock = false; st.pi++;
            if (st.pi >= 3) { var score = st.pts + (st.solved === 3 ? 60 : 0); st.finish(score) }
            else { st.pT0 = st.T(); st.S.msg.textContent = 'زمان تمام شد — پازل بعدی' }
          }, 700);
        }
      }
    });
    return true;
  };

  /* ============================================================
     ۸) والیبال ساحلی — زمان‌بندی ضربه + انتخاب جهت در برابر بلوکر قطعی
     تله‌متری: hit(q,dir) / fault — داور: v3Volley
     ============================================================ */
  G3.volley = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('volley', {
      el: el, done: done, col: '#ffd84d', hint: 'وقتی توپ در زون سبز فرود می‌آید بزن — جهت را از بلوکر دور کن!',
      build: function (st) { st.hits = 0; st.faults = 0; st.pts = 0; st.dur = 25000; st.ballT0 = st.T(); st.lastRes = 0; st.served = false },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over) return;
            var W = st.S.W(), H = st.S.H();
            var t = st.T();
            var per = Math.max(750, 1400 - st.hits * 90);
            var phase = ((t - st.ballT0) % per) / per;
            var inZone = phase > 0.72;
            var off = Math.abs(phase - 0.86) / 0.14;
            var q = clamp3(1 - off, 0, 1);
            var dir = x < W / 3 ? 0 : x < W * 2 / 3 ? 1 : 2;
            if (!inZone || !st.served) {
              if (st.served) { TE('fault', t); st.faults++; st.hits = 0; st.lastRes = -1; snd('alert'); FX.shake(); st.ballT0 = t; st.S.msg.textContent = 'خطا! توپ در زون نبود' }
              else { st.served = true; st.ballT0 = t; st.S.msg.textContent = 'سرویس رفت! حالا رالی' }
              return;
            }
            var block = volBlock3(seed, st.hits);
            var win = dir !== block && q >= 0.30 + Math.min(0.4, st.hits * 0.04);
            TE('hit', t, q, dir);
            if (win) {
              st.pts += 70 + Math.min(30, st.hits * 4);
              st.hits++;
              st.S.score(st.pts); snd('coin'); snd('thump');
              FX.text(W / 2, H * 0.4, '💥 امتیاز! رالی ' + faN(st.hits), '#7dff9e', 15);
              st.lastRes = 1;
            } else {
              st.hits = 0; st.faults++; st.lastRes = -1;
              snd('alert'); FX.shake();
              FX.text(W / 2, H * 0.4, block === dir ? '🧱 بلوک شد!' : ' Quality کم بود', '#ff8ba0', 14);
            }
            st.ballT0 = t;
            if (st.faults > 12 || st.hits >= 24) st.finish(st.pts);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var netX = W / 2, netY = H * 0.42, netH = Math.min(90, H * 0.24);
        /* تور */
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(netX, netY); c.lineTo(netX, netY + netH); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(netX - 1, netY, 2, netH);
        /* زمین‌ها */
        c.fillStyle = 'rgba(255,216,77,.05)'; rr(c, 8, netY + netH + 8, W / 2 - 14, H - netY - netH - 22, 12); c.fill();
        c.fillStyle = 'rgba(255,77,109,.05)'; rr(c, W / 2 + 6, netY + netH + 8, W / 2 - 14, H - netY - netH - 22, 12); c.fill();
        /* زون سبز ضربه */
        var per = Math.max(750, 1400 - st.hits * 90);
        var phase = ((t - st.ballT0) % per) / per;
        var zx = 14, zw = W / 2 - 22, zy = H - 56, zh = 34;
        c.fillStyle = phase > 0.72 ? 'rgba(125,255,158,.35)' : 'rgba(125,255,158,.12)';
        rr(c, zx, zy, zw, zh, 10); c.fill();
        txt(c, phase > 0.72 ? 'بزن!' : 'زون ضربه', zx + zw / 2, zy + zh / 2, 12, phase > 0.72 ? '#7dff9e' : '#9fb6d4');
        /* توپ — قوس بین دو زمین */
        var prog = phase;
        var bx2 = zx + zw - prog * (2 * zw + 14);
        var by2 = zy - 24 - Math.sin(prog * Math.PI) * (H * 0.34);
        c.beginPath(); c.arc(bx2, by2, 9, 0, TAU);
        c.fillStyle = '#ffd84d'; c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
        /* امتیاز/وضعیت */
        txt(c, 'رالی: ' + faN(st.hits) + '  •  امتیاز: ' + faN(st.pts) + '  •  خطا: ' + faN(st.faults), W / 2, 16, 11, '#9fb6d4');
        var left = Math.max(0, 1 - t / st.dur);
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 12, H - 12, (W - 24) * left, 4, 2); c.fill();
        if (t >= st.dur) { st.S.score(st.pts); st.finish(st.pts) }
      }
    });
    return true;
  };



  /* ============================================================
     ۹) ضربات پنالتی — انتخاب گوشه + قدرت در باند، دروازه‌بان قطعی seed
     تله‌متری: shot(zi,kd,goal,rd,pow) — داور: v3Football
     ============================================================ */
  G3.football = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('football', {
      el: el, done: done, col: '#7fd8ff', hint: 'گوشه را بزن — نوار قدرت وسط بماند (نه ضعیف، نه انفجاری)',
      build: function (st) { st.shot = 0; st.round = 0; st.goals = 0; st.pts = 0; st.pow = 0.5; st.powDir = 1; st.anim = 0; st.log = [] },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over || st.anim > 0) return;
            var W = st.S.W();
            var gy = st.S.H() * 0.30, gh = st.S.H() * 0.30;
            if (y < gy || y > gy + gh) return;
            var zi = x < W / 3 ? 0 : x < W * 2 / 3 ? 1 : 2;
            var dive = fbDive3(seed, st.shot);
            var pow = clamp3(st.pow, 0, 1);
            var goal = (zi !== dive && pow >= 0.35 && pow <= 0.95) ? 1 : 0;
            var kd = dive; /* فقط برای نمایش/ریپلی */
            TE('shot', st.T(), zi, kd, goal, st.round, pow);
            st.log.push({ zi: zi, dive: dive, goal: goal });
            if (goal) { st.pts += 90; st.goals++; snd('cheer'); FX.text(W / 2, gy - 18, '⚽ گُل!', '#7dff9e', 17) }
            else if (pow < 0.35 || pow > 0.95) { snd('alert'); FX.text(W / 2, gy - 18, pow < 0.35 ? 'ضعیف بود' : 'بیرون رفت!', '#ff8ba0', 15) }
            else { snd('alert'); FX.shake(); FX.text(W / 2, gy - 18, '🧱 دروازه‌بان گفت نه', '#ff8ba0', 14) }
            st.S.score(st.pts);
            st.anim = 1; st._lastGoal = goal; st._lastDive = dive;
            st.shot++;
          }
        };
      },
      frame: function (st, t, dt) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var gy = H * 0.30, gh = H * 0.30, gw = W * 0.86, gx = (W - gw) / 2;
        /* دروازه */
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
        c.strokeRect(gx, gy, gw, gh);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(gx, gy, gw, gh);
        /* تور */
        c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 1;
        for (var i = 1; i < 8; i++) { c.beginPath(); c.moveTo(gx + i * gw / 8, gy); c.lineTo(gx + i * gw / 8, gy + gh); c.stroke() }
        for (var j = 1; j < 5; j++) { c.beginPath(); c.moveTo(gx, gy + j * gh / 5); c.lineTo(gx + gw, gy + j * gh / 5); c.stroke() }
        /* ۳ زون هدف */
        var zl = ['چپ', 'وسط', 'راست'];
        for (i = 0; i < 3; i++) {
          var zx = gx + i * (gw / 3);
          c.fillStyle = 'rgba(127,216,255,.10)';
          rr(c, zx + 4, gy + 4, gw / 3 - 8, gh - 8, 8); c.fill();
          txt(c, zl[i], zx + gw / 6, gy + gh / 2, 11, 'rgba(255,255,255,.35)');
        }
        /* دروازه‌بان */
        if (st.anim > 0) {
          var dx = gx + (st._lastDive + 0.5) * (gw / 3);
          c.font = '34px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(st._lastGoal ? '🧤' : '🧤✋', dx, gy + gh / 2);
          st.anim -= dt / 900;
          if (st.anim <= 0) {
            st.anim = 0;
            if (st.shot >= 3) {
              if (st.goals >= 2) { st.pts += [100, 150, 200][Math.min(2, st.round)]; st.S.score(st.pts); FX.text(W / 2, gy - 40, '✅ دور ' + faN(st.round + 1) + ' گذر شد!', '#7dff9e', 14); snd('crowd') }
              else { FX.text(W / 2, gy - 40, '❌ حذف در دور ' + faN(st.round + 1), '#ff8ba0', 14) }
              if (st.round >= 2 || st.goals < 2) {
                var score = st.pts;
                st.S.msg.textContent = 'پایان ناکاوت — ' + faN(score) + ' امتیاز';
                st.finish(score);
                return;
              }
              st.round++; st.shot = 0; st.goals = 0;
            }
            st.S.msg.textContent = 'دور ' + faN(st.round + 1) + '/۳ — ضربه ' + faN(st.shot + 1) + ' از ۳';
          }
        } else {
          c.font = '30px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('🧍', gx + gw / 2, gy + gh / 2);
        }
        /* توپ */
        c.beginPath(); c.arc(W / 2, gy + gh + 46, 11, 0, TAU);
        c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#333'; c.stroke();
        /* نوار قدرت */
        if (st.anim <= 0) {
          st.pow += st.powDir * dt / 1300;
          if (st.pow >= 1) { st.pow = 1; st.powDir = -1 }
          if (st.pow <= 0) { st.pow = 0; st.powDir = 1 }
          var bw = W * 0.7, bx2 = (W - bw) / 2, by = H - 34;
          c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, bx2, by, bw, 10, 5); c.fill();
          var band = st.pow >= 0.35 && st.pow <= 0.95;
          c.fillStyle = band ? '#7dff9e' : '#ff8ba0';
          rr(c, bx2, by, bw * st.pow, 10, 5); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1;
          c.strokeRect(bx2 + bw * 0.35, by - 2, bw * 0.6, 14);
          txt(c, 'قدرت — در نوار سبز شوت کن', W / 2, H - 12, 10, '#9fb6d4');
        }
        txt(c, 'دور ' + faN(st.round + 1) + '/۳ • ضربه ' + faN(Math.min(st.shot + 1, 3)) + '/۳ • گل: ' + faN(st.goals), W / 2, 16, 11, '#9fb6d4');
      }
    });
    return true;
  };

  /* ============================================================
     ۱۰) پرش طول — سرعت دویدن از گام‌ها + تخته‌ی قطعی seed
     تله‌متری: p(side) + jump(m) — داور: v3LJ
     ============================================================ */
  G3.lj = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('lj', {
      el: el, done: done, col: '#4de3c0', hint: 'چپ/راست تند بزن تا سریع شوی؛ روی تخته‌ی سبز «پرش» را بزن',
      build: function (st) { st.jumps = 0; st.strides = 0; st.lastSide = -1; st.recent = []; st.lastT = -1; st.pts = 0; st.phase = 'run'; st.animT = 0; st.lastM = 0; st.lastFoul = false; st.dur = 55000 },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over) return;
            var W = st.S.W(), H = st.S.H();
            var t = st.T();
            if (st.phase === 'run') {
              /* دکمه‌ی پرش وسط پایین */
              if (y > H * 0.72 && Math.abs(x - W / 2) < 70) { ljTakeoff(st); return }
              var side = x < W / 2 ? 0 : 1;
              if (side === st.lastSide) return;
              if (st.lastT >= 0 && t - st.lastT < 140) return;
              if (st.lastT >= 0) { st.recent.push(t - st.lastT); if (st.recent.length > 6) st.recent.shift() }
              st.lastSide = side; st.lastT = t; st.strides++;
              snd('click');
            } else if (st.phase === 'land' && st.animT <= 0) {
              st.phase = 'run'; st.strides = 0; st.recent = []; st.lastSide = -1;
              st.S.msg.textContent = 'پرش ' + faN(st.jumps + 1) + ' از ۳ — گرم کن!';
            }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var laneY = H * 0.42, laneH = Math.min(72, H * 0.22);
        var boardB = ljBoard3(seed, st.jumps);
        var laneMax = (boardB + 5) * 1.15;
        function xOf(m) { return 10 + (m / laneMax) * (W - 20) }
        /* باند */
        c.fillStyle = 'rgba(77,227,192,.10)'; rr(c, 8, laneY - laneH / 2, W - 16, laneH, 12); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.15)'; c.stroke();
        /* شن‌گاه */
        var pitX = xOf((boardB + 1.2) * 1.15);
        c.fillStyle = 'rgba(255,216,77,.22)'; rr(c, pitX, laneY - laneH / 2, W - pitX - 8, laneH, 8); c.fill();
        /* تخته + خطای خط قرمز */
        var bx3 = xOf(boardB * 1.15);
        c.fillStyle = 'rgba(125,255,158,.45)'; c.fillRect(bx3 - 7, laneY - laneH / 2 + 4, 12, laneH - 8);
        c.fillStyle = 'rgba(255,77,109,.75)'; c.fillRect(bx3 + 10, laneY - laneH / 2 + 4, 3, laneH - 8);
        txt(c, 'تخته', bx3, laneY - laneH / 2 - 10, 9, '#7dff9e');
        /* دونده */
        var posM = st.strides * 1.15;
        var rx2 = st.phase === 'run' ? xOf(Math.min(posM, laneMax)) : xOf(boardB * 1.15);
        c.font = Math.round(laneH * 0.6) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(st.phase === 'run' ? '🏃' : (st.animT > 0 ? '🦘' : '🧍'), rx2, laneY);
        /* سرعت */
        var sum = 0, i; for (i = 0; i < st.recent.length; i++) sum += st.recent[i];
        var ai = st.recent.length ? sum / st.recent.length : 600;
        var speed = clamp3((520 - ai) / 260, 0.15, 1);
        var bw = W * 0.5, bx4 = (W - bw) / 2, by = H - 52;
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, bx4, by, bw, 9, 4); c.fill();
        c.fillStyle = speed > .8 ? '#7dff9e' : '#4de3c0'; rr(c, bx4, by, bw * speed, 9, 4); c.fill();
        txt(c, 'سرعت: ' + faN(Math.round(speed * 100)) + '٪', W / 2, by + 20, 10, '#9fb6d4');
        if (st.phase === 'run') {
          c.fillStyle = 'rgba(255,215,94,.25)'; rr(c, W / 2 - 66, H * 0.76, 132, 40, 12); c.fill();
          txt(c, '🦘 پرش!', W / 2, H * 0.76 + 20, 15, '#fff');
          if (posM > boardB * 1.15 + 0.4) txt(c, '⚠️ از تخته رد شدی — خطا!', W / 2, laneY - laneH / 2 - 12, 11, '#ff8ba0');
        }
        /* انیمیشن پرواز/فرود */
        if (st.phase !== 'run') {
          st.animT -= 16;
          if (st.phase === 'land' && st.animT <= 0 && !st._waitTap) {
            st._waitTap = true;
            st.S.msg.textContent = st.lastFoul ? 'خطا! پرش نامعتبر' : 'پرش: ' + faN(st.lastM.toFixed(1)).replace('٫', '٫') + ' متر — بزن برای بعدی';
          }
        }
        /* پیشرفت پرش‌ها */
        for (i = 0; i < 3; i++) {
          c.fillStyle = i < st.jumps ? 'rgba(125,255,158,.7)' : 'rgba(255,255,255,.15)';
          rr(c, W / 2 - 50 + i * 36, H - 30, 30, 7, 3); c.fill();
        }
        txt(c, 'امتیاز: ' + faN(st.pts), W / 2, H - 12, 11, '#9fb6d4');
        if (t >= st.dur) { st.finish(st.pts) }
      }
    });
    function ljTakeoff(st) {
      if (st.over || st.phase !== 'run' || st.jumps >= 3) return;
      var t = st.T();
      if (st.strides < 3) { st.S.msg.textContent = 'اول چند قدم بدو!'; return }
      var boardB = ljBoard3(seed, st.jumps);
      var board = boardB * 1.15;
      var pos = st.strides * 1.15;
      var sum = 0, i; for (i = 0; i < st.recent.length; i++) sum += st.recent[i];
      var ai = st.recent.length ? sum / st.recent.length : 600;
      var speed = clamp3((520 - ai) / 260, 0.15, 1);
      var prec = 1 - Math.min(1, Math.abs(pos - board) / 1.15);
      var foul = pos > board + 0.4;
      var mS = foul ? 0 : 4.6 + speed * 3.9 + prec * 1.4;
      TE('jump', t, Math.round(mS * 10) / 10);
      st.pts += Math.round(mS * 45);
      st.S.score(st.pts);
      st.lastM = mS; st.lastFoul = foul;
      st.jumps++; st.phase = 'land'; st.animT = 1100; st._waitTap = false;
      if (foul) { snd('alert'); FX.shake(); FX.text(st.S.W() / 2, st.S.H() * 0.3, 'خطا!', '#ff8ba0', 17) }
      else { snd(mS > 8 ? 'cheer' : 'coin'); FX.text(st.S.W() / 2, st.S.H() * 0.3, faN(mS.toFixed(1)) + ' متر', '#7dff9e', 17); FX.dust(st.S.W() / 2, st.S.H() * 0.55, LOWFX ? 4 : 8) }
      if (st.jumps >= 3) {
        var score = st.pts;
        st.S.msg.textContent = 'سه پرش تمام — ' + faN(score) + ' امتیاز';
        setTimeout(function () { if (!st.over) st.finish(score) }, 800);
      }
    }
    return true;
  };

  /* ============================================================
     ۱۱) کشتی — طناب‌کشی در برابر حریف قطعی seed (تند و پیوسته بزن)
     تله‌متری: p + bout(win,left) — داور: v3Wrestle (برنده را سرور می‌شمارد)
     ============================================================ */
  G3.wrestle = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var g = game('wrestle', {
      el: el, done: done, col: '#e05299', hint: 'تند و پیوسته بزن! نشان را از خط سرخ عبور بده — حریف فشار می‌آورد',
      build: function (st) {
        st.bout = 0; st.pts = 0; st.marker = 50; st.prevT = -1; st.boutStart = -1; st.crossedAt = -1; st.lostAt = -1;
        st.dur = 12000; st.phase = 'bout'; st.lastTap = 0;
      },
      input: function (st) {
        return {
          down: function (x, y) {
            if (st.over || st.phase !== 'bout') return;
            var t = st.T();
            if (t - st.lastTap < 55) return; /* گپ حداقل — آینه‌ی داور */
            st.lastTap = t;
            if (st.prevT < 0) { st.prevT = t; st.boutStart = t }
            var dt = t - st.prevT;
            var rv = wreRival3(seed, st.bout);
            var push = rv.base;
            if ((t >= rv.s1 && t < rv.s1 + 800) || (t >= rv.s2 && t < rv.s2 + 800)) push += 2.0;
            st.marker += push * (dt / 1000);
            st.marker -= 1.6;
            st.prevT = t;
            TE('p', t, 0);
            snd('click');
            if (st.marker <= 20 && st.crossedAt < 0) { st.crossedAt = t; endBout(st, 1) }
            else if (st.marker >= 80 && st.crossedAt < 0 && st.lostAt < 0) { st.lostAt = t; endBout(st, 0) }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var rv = wreRival3(seed, st.bout);
        /* رینگ + طناب */
        var ry = H * 0.42;
        c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(16, ry); c.lineTo(W - 16, ry); c.stroke();
        /* خطوط قرمز دو طرف */
        c.fillStyle = 'rgba(255,77,109,.5)';
        c.fillRect(16 + (W - 32) * 0.2 - 2, ry - 22, 4, 44);
        c.fillRect(16 + (W - 32) * 0.8 - 2, ry - 22, 4, 44);
        /* نشانگر — درون‌یابی فشار حریف بین ضربه‌ها */
        var mVis = st.marker;
        if (st.prevT >= 0 && st.phase === 'bout' && st.crossedAt < 0 && st.lostAt < 0) {
          var dtn = t - st.prevT;
          var push2 = rv.base;
          if ((t >= rv.s1 && t < rv.s1 + 800) || (t >= rv.s2 && t < rv.s2 + 800)) push2 += 2.0;
          mVis = Math.min(80, st.marker + push2 * (dtn / 1000));
        }
        var mx = 16 + (W - 32) * (mVis / 100);
        c.strokeStyle = '#e05299'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(mx, ry - 20); c.lineTo(mx, ry + 20); c.stroke();
        c.font = '26px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🦸', 26, ry); c.fillText('🦍', W - 26, ry);
        /* هشدار رگبار حریف */
        var surge = (t >= rv.s1 && t < rv.s1 + 800) || (t >= rv.s2 && t < rv.s2 + 800);
        if (surge && st.phase === 'bout') txt(c, '⚠️ حریف فشار می‌آورد!', W / 2, ry - 48, 12, '#ff8ba0');
        /* تایمر گیر */
        var el0 = st.boutStart > 0 ? t - st.boutStart : 0;
        var left = Math.max(0, 1 - el0 / st.dur);
        c.fillStyle = 'rgba(255,255,255,.12)'; rr(c, 12, 12, W - 24, 8, 4); c.fill();
        c.fillStyle = '#e05299'; rr(c, 12, 12, (W - 24) * left, 8, 4); c.fill();
        txt(c, 'گیر ' + faN(st.bout + 1) + ' از ۳  •  امتیاز: ' + faN(st.pts), W / 2, H - 16, 12, '#9fb6d4');
        /* تایم‌اوت گیر */
        if (st.phase === 'bout' && st.boutStart > 0 && el0 >= st.dur && st.crossedAt < 0 && st.lostAt < 0) endBout(st, 0);
      }
    });
    function endBout(st, win) {
      if (st.phase !== 'bout') return;
      st.phase = 'wait';
      var t = st.T();
      var left = win ? Math.max(0, 12000 - (st.crossedAt - st.boutStart)) : 0;
      TE('bout', t, win, Math.round(left));
      if (win) { st.pts += 250 + Math.round(left / 12000 * 150); snd('cheer'); snd('thump'); FX.text(st.S.W() / 2, st.S.H() * 0.3, '💪 بردی! +' + faN(250 + Math.round(left / 12000 * 150)), '#7dff9e', 16) }
      else { snd('alert'); FX.shake(); FX.text(st.S.W() / 2, st.S.H() * 0.3, '😮 باختی این گیر را', '#ff8ba0', 15) }
      st.S.score(st.pts);
      st.bout++;
      if (st.bout >= 3) {
        var score = st.pts;
        st.S.msg.textContent = 'دیدار تمام — ' + faN(score) + ' امتیاز';
        setTimeout(function () { if (!st.over) st.finish(score) }, 900);
      } else {
        setTimeout(function () {
          if (st.over) return;
          st.marker = 50; st.prevT = -1; st.boutStart = -1; st.crossedAt = -1; st.lostAt = -1; st.phase = 'bout';
          st.S.msg.textContent = 'گیر ' + faN(st.bout + 1) + ' — آماده؟';
        }, 900);
      }
    }
    return true;
  };

  /* ============================================================
     نصب: دیسپچ GAMES — هر رشته: اگر gate نسلی فعال بود → نسل ۳،
     وگرنه gameplay قبلی (V41) بدون هیچ دست‌خوردگی (fallback امن)
     ============================================================ */
  /* ============================================================
     V89 — OLYMPICS V2: ۲۵ رشته‌ی جدید — ۸ خانواده‌ی gameplay متمایز.
     هر بازی هندسه‌اش از seed سرور بازسازی می‌شود (آینه‌ی داور v3 در
     olyScore.ts) — امتیاز فقط از تله‌متری راستی‌آزمایی می‌شود.
     helpers مشترک:
     ============================================================ */
  function ph3(seed, salt, i, t, f0, f1) {
    var r = rngOf3(seed, salt + ':' + i);
    var f = f0 + r() * (f1 - f0), p = r() * 6.28318;
    return Math.sin((t / f) * 6.28318 + p);
  }
  function angD3(a, b) { var d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d }

  /* ——— ۱۲) ۱۱۰ متر بارییر: دویدن + پرش زمان‌دار روی موانع — داور: v3Hurdles ——— */
  G3.hurdles = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var r = rngOf3(seed, 'hurd'); var B = [];
    for (var i = 0; i < 8; i++) B.push(9 + i * 7 + Math.floor(r() * 3) - 1);
    return game('hurdles', {
      el: el, done: done, col: '#ff6b4d', hint: 'یک‌درمیان بدو؛ وقتی به بارییر رسیدی بپر — تصادف = پایان دو!',
      build: function (st) { st.goT = -1; st.goAt = 800 + rngOf3(seed, 'hg')() * 900; st.strides = 0; st.lastSide = -1; st.lastT = -1; st.jumps = 0; st.clean = 0; st.phase = 'set'; st.crashed = false; st.jumpAnim = -1 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W(), H = st.S.H();
            if (st.phase === 'set') { if (t < st.goAt) { st.phase = 'over'; TE('go', t); TE('crash', t); st.finish(0) } else { st.phase = 'run'; TE('go', t); st.goT = t; st.S.msg.textContent = 'بدو!' } return }
            if (st.phase !== 'run') return;
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) return;
            if (st.lastT >= 0 && t - st.lastT < 55) return;
            st.lastT = t; st.lastSide = side; st.strides++;
            TE('p', t, side);
            if (y > H * 0.55 && st.jumps < 8) {
              var ok = Math.abs(st.strides - B[st.jumps]) <= 2 ? 1 : 0;
              TE('jump', t, ok); st.jumps++; if (ok) st.clean++;
              st.jumpAnim = t; snd(ok ? 'cheer' : 'alert');
              if (!ok) { FX.shake() }
            }
            if (st.strides > B[7] + 3 && !st.crashed) { st.crashed = false; TE('end', t); st.finish(st.strides * 8 + st.clean * 240) }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.phase === 'set') { txt(c, t < st.goAt - 250 ? 'آماده…' : 'حالا!', W / 2, H * 0.4, 22, t < st.goAt - 250 ? '#ffd75e' : '#7dff9e'); return }
        /* مسیر + بارییرها بر اساس گام */
        c.fillStyle = 'rgba(255,107,77,.14)'; rr(c, 0, H * 0.55, W, H * 0.2, 10); c.fill();
        for (var i = 0; i < 8; i++) {
          var rel = B[i] - st.strides;
          if (rel < -1 || rel > 9) continue;
          var bx = W * (1 - rel / 10);
          c.fillStyle = 'rgba(255,255,255,' + (0.25 + (rel === 1 ? 0.5 : 0)) + ')';
          rr(c, bx - 4, H * 0.42, 8, H * 0.33, 3); c.fill();
          c.fillStyle = rel <= 2 ? '#ffd75e' : '#ff6b4d'; rr(c, bx - 10, H * 0.42, 20, 5, 2); c.fill();
        }
        txt(c, 'گام: ' + faN(st.strides) + '  •  پرش تمیز: ' + faN(st.clean) + '/۸', W / 2, H * 0.88, 12, '#9fb6d4');
        txt(c, 'پایین صفحه بزن = پرش', W / 2, H - 24, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۱۳) ۴۰۰ متر استقامت: ریتم سه فاز — داور: v3Run400 ——— */
  G3.run400 = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var r = rngOf3(seed, 'r400');
    var tgt = [430 + r() * 40, 380 + r() * 40, 470 + r() * 40];
    return game('run400', {
      el: el, done: done, col: '#ffa64d', hint: 'به ریتم نوار هدف گوش بده — هر فاز ریتم خودش را می‌خواهد؛ یک‌درمیان بزن',
      build: function (st) { st.strides = 0; st.lastSide = -1; st.lastT = -1; st.laps = 0; st.sum = 0; st.phase = 'go' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) return;
            if (st.lastT >= 0) {
              var g = t - st.lastT;
              if (g < 60) return;
              var target = tgt[Math.min(2, Math.floor(st.strides / 60))];
              var q = Math.max(0, 1 - Math.abs(g - target) / 220);
              st.sum += q;
              if (q > 0.75) snd('click'); else snd('alert');
            }
            st.lastT = t; st.lastSide = side; st.strides++;
            TE('p', t, side);
            if ((st.strides === 60 || st.strides === 120 || st.strides === 180) && st.laps < 3) { TE('lap', t, st.laps); st.laps++ }
            if (st.strides >= 180) { st.finish(Math.round(st.sum * 14) + st.laps * 40) }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var ph = Math.min(2, Math.floor(st.strides / 60)), target = tgt[ph];
        var lastG = st.lastT >= 0 ? t - st.lastT : 0;
        /* نوار ریتم: نشانگر فاصله‌ی گام فعلی نسبت به هدف */
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 20, H * 0.35, W - 40, 26, 13); c.fill();
        var zoneW = (W - 40) * 0.28;
        c.fillStyle = 'rgba(125,255,158,.35)'; rr(c, (W - zoneW) / 2, H * 0.35, zoneW, 26, 13); c.fill();
        var mpos = Math.max(0, Math.min(1, (lastG - (target - 220)) / 440));
        c.fillStyle = '#ffd75e'; rr(c, 20 + (W - 44) * mpos, H * 0.35 - 4, 8, 34, 4); c.fill();
        txt(c, 'فاز ' + faN(ph + 1) + '/۳ — ریتم هدف: ' + faN(Math.round(target)) + 'ms', W / 2, H * 0.28, 13, '#ffe08a');
        /* پیست */
        c.fillStyle = 'rgba(255,166,77,.12)'; rr(c, 0, H * 0.55, W, 40, 8); c.fill();
        var prog = st.strides / 180;
        c.fillStyle = '#ffa64d'; rr(c, W * prog - 12, H * 0.55 + 12, 24, 16, 6); c.fill();
        txt(c, 'دور ' + faN(st.laps) + '/۳  •  امتیاز لحظه‌ای: ' + faN(Math.round(st.sum * 14)), W / 2, H * 0.75, 12, '#9fb6d4');
        txt(c, 'چپ/راست یک‌درمیان — داخل نوار سبز بزن', W / 2, H - 22, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۱۴) پرش ارتفاع: سنجه‌ی نوسانی + ریسک — داور: v3Highjump ——— */
  G3.highjump = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('highjump', {
      el: el, done: done, col: '#4de3a0', hint: 'وقتی سنجه بالاست بپر؛ دکمه‌ی ریسک ارتفاع بیشتر ولی رکورد شکننده‌تر',
      build: function (st) { st.att = 0; st.best = 0; st.clears = 0; st.risk = 0; st.phase = 'aim' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase !== 'aim') return;
            if (x < W * 0.28) { st.risk = st.risk ? 0 : 1; snd('click'); return }
            var i = st.att, ph = ph3(seed, 'hj', i, t, 900, 1500);
            var h = Math.round(150 + 42 * ph + st.risk * 22 + i * 8);
            TE('jump', t, h, st.risk);
            st.best = Math.max(st.best, h); if (h >= 180) st.clears++;
            st.S.score(st.best * 6 + st.clears * 60);
            FX.text(W / 2, st.S.H() * 0.4, faN(h) + ' سانت', h >= 180 ? '#7dff9e' : '#ffe08a', 18);
            snd(h >= 180 ? 'cheer' : 'stamp');
            st.att++; st.phase = 'wait';
            setTimeout(function () { if (!st.over) { st.phase = 'aim'; if (st.att >= 3) st.finish(st.best * 6 + st.clears * 60) } }, 800);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.phase !== 'aim') { txt(c, '…', W / 2, H / 2, 20, '#9fb6d4'); return }
        var ph = ph3(seed, 'hj', st.att, t, 900, 1500);
        var hNow = 150 + 42 * ph + st.risk * 22 + st.att * 8;
        /* میله + ورزشکار */
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(W * 0.2, H * 0.45); c.lineTo(W * 0.8, H * 0.45); c.stroke();
        var jy = H * 0.62 - (H * 0.3) * Math.max(0, (hNow - 140) / 110);
        c.font = '28px serif'; c.textAlign = 'center'; c.fillText('🏃', W / 2, jy);
        txt(c, 'ارتفاع: ' + faN(Math.round(hNow)) + ' سانت', W / 2, H * 0.18, 16, '#ffe08a');
        txt(c, 'تلاش ' + faN(st.att + 1) + '/۳ • بهترین: ' + faN(st.best), W / 2, H * 0.78, 12, '#9fb6d4');
        var rb = st.risk ? 'ریسک: روشن (بالاتر، سخت‌تر)' : 'ریسک: خاموش — دکمه‌ی چپ';
        txt(c, rb, W * 0.6, H - 22, 10, st.risk ? '#ff8ba0' : '#7d92ad');
      }
    });
  };

  /* ——— ۱۵/۱۶/۱۷) پرتاب‌ها: دویدن نرم + سنجه‌ی زاویه + باد — داور: v3ThrowGeom ——— */
  function throwGame(key, col, cfg) {
    return function (el, done) {
      var seed = seedOf(); if (!seed) return false;
      return game(key, {
        el: el, done: done, col: col, hint: cfg.hint,
        build: function (st) { st.att = 0; st.taps = 0; st.dists = []; st.phase = 'run' },
        input: function (st) {
          return {
            down: function (x, y) {
              var t = st.T(); var W = st.S.W();
              if (st.phase === 'run') { st.taps++; TE('p', t); snd('click'); if (st.taps >= 6) st.phase = 'aim'; return }
              if (st.phase !== 'aim') return;
              var i = st.att;
              var r = rngOf3(seed, cfg.salt + ':' + i);
              var wind = r() * 2 - 1;
              var ph = ph3(seed, cfg.salt + 'ph', i, t, 700, 1400);
              var angleQ = Math.max(0, 1 - Math.abs(ph));
              var powerQ = Math.min(1, st.taps / 8);
              var q = 0.6 * angleQ + 0.4 * powerQ;
              var d = cfg.dist(q, wind);
              TE('throw', t, Math.round(d * 10) / 10);
              st.dists.push(d);
              st.S.score(Math.round((function () { var s = st.dists.slice().sort(function (a, b) { return b - a }); var p = 0; for (var j = 0; j < Math.min(3, s.length); j++) p += s[j]; return p * cfg.mul })()));
              FX.text(W / 2, st.S.H() * 0.35, faN(Math.round(d)) + ' متر', d >= cfg.hi * 0.85 ? '#7dff9e' : '#ffe08a', 17);
              snd('stamp');
              st.att++; st.taps = 0; st.phase = 'run';
              if (st.att >= 5) setTimeout(function () { if (!st.over) { var s = st.dists.slice().sort(function (a, b) { return b - a }); var p = 0; for (var j = 0; j < Math.min(3, s.length); j++) p += s[j]; st.finish(Math.round(p * cfg.mul)) } }, 700);
            }
          };
        },
        frame: function (st, t) {
          var c = st.S.ctx, W = st.S.W(), H = st.S.H();
          c.clearRect(0, 0, W, H);
          c.fillStyle = 'rgba(255,255,255,.06)'; rr(c, 0, H * 0.62, W, H * 0.16, 8); c.fill();
          if (st.phase === 'run') { txt(c, 'سریع بزن — شتاب ' + faN(st.taps) + '/۶', W / 2, H * 0.3, 15, '#ffe08a') }
          else {
            var ph = ph3(seed, cfg.salt + 'ph', st.att, t, 700, 1400);
            var w = (rngOf3(seed, cfg.salt + ':' + st.att)() * 2 - 1);
            var mx = W / 2 + ph * (W * 0.34);
            c.fillStyle = 'rgba(125,255,158,.3)'; rr(c, W / 2 - W * 0.06, H * 0.42, W * 0.12, 26, 13); c.fill();
            c.fillStyle = '#ffd75e'; rr(c, mx - 5, H * 0.42 - 6, 10, 38, 5); c.fill();
            txt(c, 'باد: ' + (w > 0.3 ? '→→' : w > 0.1 ? '→' : w < -0.3 ? '←←' : w < -0.1 ? '←' : 'آرام'), W / 2, H * 0.3, 12, '#8fb8dd');
            txt(c, 'در نوار سبز رها کن — پرتاب ' + faN(st.att + 1) + '/۵', W / 2, H * 0.8, 12, '#9fb6d4');
          }
          txt(c, 'بهترین‌ها: ' + (st.dists.length ? st.dists.slice().sort(function (a, b) { return b - a }).slice(0, 3).map(function (d) { return faN(Math.round(d)) }).join(' • ') : '—'), W / 2, H - 22, 10, '#7d92ad');
        }
      });
    };
  }
  G3.javelin = throwGame('javelin', '#5ec8ff', { salt: 'jav', mul: 12, hi: 90, hint: 'شتاب بگیر، بعد زاویه‌ی بهینه را در نوار سبز رها کن — باد حریف توست', dist: function (q, w) { return 35 + 50 * q + w * 5 } });
  G3.discus = throwGame('discus', '#c08bff', { salt: 'dis', mul: 14, hi: 66, hint: 'چرخش بگیر و دیسک را در زاویه‌ی طلایی رها کن', dist: function (q, w) { return 22 + 40 * q + w * 4 } });
  G3.shotput = throwGame('shotput', '#ff8b6b', { salt: 'sht', mul: 40, hi: 21, hint: 'قدرت جمع کن و در لحظه‌ی درست پرتاب کن', dist: function (q) { return 7 + 13 * q } });

  /* ——— ۱۸) بوکس V5: تجربه‌ی سینمایی سه‌بعدی — داور: v5Boxing (آینه‌ی seed) ———
     در نبود WebGL یا موتور box5 → بوکس ۲D قدیمی (boxing2d) fallback می‌شود */
  G3.boxing2d = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('boxing', {
      el: el, done: done, col: '#ff4d6d', hint: 'حمله‌ی بالا/پایین را بلاک کن یا کانتر بزن — کانتر سریع‌ترین امتیاز را دارد',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'idle'; st.telT = -1; st.tel = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase === 'idle') {
              var i = st.n; if (i >= 9) return;
              st.tel = Math.floor(rngOf3(seed, 'box:' + i)() * 2);
              st.telT = t; st.phase = 'tel';
              setTimeout(function () { if (!st.over && st.phase === 'tel') { st.phase = 'idle'; snd('alert'); FX.shake() } }, 1600);
              return;
            }
            if (st.phase !== 'tel') return;
            var act = x < W / 3 ? 0 : x < (W * 2) / 3 ? 2 : 1; /* چپ=بلاک بالا، وسط=کانتر، راست=بلاک پایین */
            var rt = t - st.telT;
            var win = act === 2 ? rt <= 650 : (act === st.tel && rt <= 900) ? 1 : 0;
            TE('ex', t, act, win, Math.round(rt));
            if (win) { st.pts += 110 + Math.max(0, Math.round((900 - rt) / 10)); snd('punch'); FX.flash('#7dff9e', .2) }
            else { snd('alert'); FX.shake() }
            st.S.score(st.pts); st.n++; st.phase = 'idle';
            if (st.n >= 9) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.font = '34px serif'; c.textAlign = 'center'; c.fillText('🥊', W / 2, H * 0.45);
        if (st.phase === 'tel') {
          var rt = t - st.telT;
          var show = rt > 350 + rngOf3(seed, 'boxd:' + st.n)() * 300;
          if (show) txt(c, st.tel === 0 ? '⬆️ حمله‌ی بالا!' : '⬇️ حمله‌ی پایین!', W / 2, H * 0.3, 18, '#ff8ba0');
        }
        txt(c, 'راند ' + faN(Math.floor(st.n / 3) + 1) + '/۳  •  رد و بدل ' + faN(st.n % 3 + 1) + '/۳', W / 2, H * 0.66, 12, '#9fb6d4');
        txt(c, 'چپ: بلاک بالا • وسط: کانتر • راست: بلاک پایین', W / 2, H - 22, 10, '#7d92ad');
      }
    });
  };
  /* V5 — لانچر بوکس: موتور سه‌بعدی lazy (box5.js)؛ فقط نشست رسمی/تمرین با seed */
  G3.boxing = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var B5 = window.WD_BOX5;
    if (!B5) {
      /* ثبت نشست به‌عنوان pending — هم برای اولین درخواست و هم برای درخواست‌های همزمان */
      G3._b5pending = [el, done];
      if (G3._b5loading) {
        setTimeout(function () { if (!G3._b5fired && G3._b5pending) { G3._b5fired = true; G3._b5pending = null; try { done(0) } catch (e2) {} } }, 12000);
        return true;
      }
      G3._b5loading = true;
      var sc = document.createElement('script');
      sc.src = '/game/box5.js?v=91';
      sc.onload = function () {
        G3._b5loading = false;
        var p = G3._b5pending; G3._b5pending = null;
        if (p) { var r5 = G3.boxing(p[0], p[1]); if (r5 === false && !G3._b5fired) { G3._b5fired = true; try { p[1](0) } catch (e3) {} } }
      };
      sc.onerror = function () { G3._b5loading = false; G3._b5fired = true; G3._b5pending = null; try { done(0) } catch (e4) {} };
      document.head.appendChild(sc);
      return true; /* نتیجه بعد از لود — بدون fallback همزمان */
    }
    var ok5 = false;
    try { ok5 = B5.openSpar(el, done) } catch (e) { console.log('b5spar', e); ok5 = false }
    if (ok5) return true;
    return G3.boxing2d(el, done); /* بدون WebGL → نسخه‌ی ۲D */
  };

  /* ——— ۱۹) شمشیربازی: فینت + لانگ/ریپوست — داور: v3Fencing ——— */
  G3.fencing = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('fencing', {
      el: el, done: done, col: '#8fd0ff', hint: 'فینت حریف را بخوان — لانگ سریع به سمت باز، یا ریپوست با زمان‌بندی',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'idle'; st.telT = -1; st.tel = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase === 'idle') {
              var i = st.n; if (i >= 8) return;
              st.tel = Math.floor(rngOf3(seed, 'fen:' + i)() * 2);
              st.telT = t; st.phase = 'tel';
              setTimeout(function () { if (!st.over && st.phase === 'tel') { st.phase = 'idle'; snd('alert') } }, 1500);
              return;
            }
            if (st.phase !== 'tel') return;
            var act = x < W / 2 ? 0 : 1;
            var rt = t - st.telT;
            var r2 = rngOf3(seed, 'fend:' + st.n);
            var lo = 120 + r2() * 200;
            var win = act === 1 ? (rt >= lo && rt <= 620) : (act === st.tel && rt <= 380) ? 1 : 0;
            TE('touch', t, act, win, Math.round(rt));
            if (win) { st.pts += 130 + Math.max(0, Math.round((700 - rt) / 8)); snd('cheer'); FX.text(W / 2, st.S.H() * 0.35, 'تاچ!', '#7dff9e', 16) }
            else { snd('alert'); FX.shake() }
            st.S.score(st.pts); st.n++; st.phase = 'idle';
            if (st.n >= 8) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.font = '30px serif'; c.textAlign = 'center'; c.fillText('🤺', W / 2, H * 0.45);
        if (st.phase === 'tel') {
          var rt = t - st.telT;
          var show = rt > 300;
          if (show) txt(c, st.tel === 0 ? '🤺 سمت چپ باز است!' : '🤺 سمت راست باز است!', W / 2, H * 0.3, 16, '#8fd0ff');
        }
        txt(c, 'تاچ ' + faN(st.n + 1) + '/۸  •  امتیاز: ' + faN(st.pts), W / 2, H * 0.66, 12, '#9fb6d4');
        txt(c, 'چپ: لانگ سریع • راست: ریپوست زمان‌دار', W / 2, H - 22, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۲۰) جودو: نقطه‌ی گیر — داور: v3Judo ——— */
  G3.judo = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('judo', {
      el: el, done: done, col: '#e05299', hint: 'وقتی گیر کامل است (نوار وسط) ضربه بزن — سه پرتاب',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'aim' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T();
            if (st.phase !== 'aim' || st.n >= 3) return;
            var ph = ph3(seed, 'judo', st.n, t, 1100, 1900);
            var q = Math.max(0, 1 - Math.abs(ph));
            TE('throw', t, Math.round(q * 100) / 100);
            st.pts += Math.round(300 * q);
            st.S.score(st.pts);
            FX.text(st.S.W() / 2, st.S.H() * 0.35, q > 0.8 ? 'ایپون!' : q > 0.5 ? 'وازاری' : 'ضعیف', q > 0.8 ? '#7dff9e' : '#ffe08a', 18);
            snd(q > 0.8 ? 'cheer' : 'stamp');
            st.n++; st.phase = 'wait';
            setTimeout(function () { if (!st.over) { st.phase = 'aim'; if (st.n >= 3) st.finish(st.pts) } }, 800);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.phase !== 'aim') { txt(c, '…', W / 2, H / 2, 20, '#9fb6d4'); return }
        var ph = ph3(seed, 'judo', st.n, t, 1100, 1900);
        c.font = '30px serif'; c.textAlign = 'center'; c.fillText('🥋', W / 2 + ph * 30, H * 0.42);
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 20, H * 0.55, W - 40, 24, 12); c.fill();
        var zw = (W - 40) * 0.22;
        c.fillStyle = 'rgba(125,255,158,.35)'; rr(c, (W - zw) / 2, H * 0.55, zw, 24, 12); c.fill();
        c.fillStyle = '#ffd75e'; rr(c, 20 + (W - 44) * ((ph + 1) / 2), H * 0.55 - 4, 8, 32, 4); c.fill();
        txt(c, 'گیر: ' + faN(Math.round((1 - Math.abs(ph)) * 100)) + '٪ — پرتاب ' + faN(st.n + 1) + '/۳', W / 2, H * 0.78, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۱) دوئل واکنش: ۵ ایستگاه خالص — داور: v3Reaction ——— */
  G3.reaction = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('reaction', {
      el: el, done: done, col: '#ffd84d', hint: 'صبر کن سبز شود — ضربه‌ی زودتر = خطا؛ ۵ ایستگاه',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'wait'; st.waitT = st.T(); st.waitEmit = false; st.delay = 2300 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T();
            if (st.phase === 'wait') { st.phase = 'go'; snd('stamp'); FX.flash('#7dff9e', .25); return }
            if (st.phase !== 'go') return;
            var rt = t - st.waitT - st.delay;
            if (rt < 0) { /* خطا: تکرار ایستگاه */
              snd('alert'); FX.shake(); st.phase = 'wait'; st.waitEmit = false; return;
            }
            TE('go', t, Math.round(rt));
            if (rt >= 100) { var p = Math.max(20, Math.round((550 - rt) * 1.6)); st.pts += p; st.S.score(st.pts); FX.text(st.S.W() / 2, st.S.H() * 0.35, faN(rt) + 'ms', rt < 250 ? '#7dff9e' : '#ffe08a', 18) }
            snd('click');
            st.n++; st.phase = 'idle';
            setTimeout(function () { if (!st.over) { if (st.n >= 5) { st.finish(st.pts) } else { st.phase = 'wait'; st.waitEmit = false } } }, 700);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.phase === 'wait') {
          if (!st.waitEmit) {
            var rr2 = rngOf3(seed, 'react:' + st.n);
            st.delay = 1200 + rr2() * 2300;
            st.waitT = st.T();
            TE('wait', st.waitT, st.n);
            st.waitEmit = true;
          }
          c.fillStyle = 'rgba(255,77,109,.25)'; rr(c, 0, 0, W, H, 0); c.fill();
          txt(c, 'مکث…', W / 2, H * 0.45, 22, '#ff8ba0');
        } else if (st.phase === 'go') {
          c.fillStyle = 'rgba(125,255,158,.28)'; rr(c, 0, 0, W, H, 0); c.fill();
          txt(c, 'بزن!', W / 2, H * 0.45, 30, '#7dff9e');
        }
        txt(c, 'ایستگاه ' + faN(st.n + 1) + '/۵ • امتیاز: ' + faN(st.pts), W / 2, H - 26, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۲) تیراندازی: ثبات مچ + نگه‌داشتن — داور: v3Shooting ——— */
  G3.shooting = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('shooting', {
      el: el, done: done, col: '#9fe8ff', hint: 'نگه دار تا هدف ثابت شود، بعد شلیک — ۵ گلوله',
      build: function (st) { st.n = 0; st.pts = 0; st.hold0 = -1; st.phase = 'aim' },
      input: function (st) {
        return {
          down: function (x, y) { var t = st.T(); if (st.phase === 'aim' && st.n < 5) { st.hold0 = t; st.phase = 'hold'; snd('click') } },
          up: function (x, y) {
            var t = st.T();
            if (st.phase !== 'hold') return;
            var hold = t - st.hold0;
            if (hold < 300) { st.phase = 'aim'; return }
            var i = st.n;
            var amp = Math.min(0.85, 0.3 + hold / 8000 + rngOf3(seed, 'shoot:' + i)() * 0.1);
            var sway = Math.abs(ph3(seed, 'shootsw', i, t, 800, 1600));
            var q = Math.round(100 * Math.max(0, 1 - sway * amp - 0.05));
            TE('shot', t, q, Math.round(hold));
            st.pts += Math.round(q * 2.2); st.S.score(st.pts);
            FX.text(st.S.W() / 2, st.S.H() * 0.3, faN(q), q >= 85 ? '#7dff9e' : '#ffe08a', 18);
            snd(q >= 85 ? 'cheer' : 'stamp');
            st.n++; st.phase = 'aim';
            if (st.n >= 5) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        /* هدف */
        c.fillStyle = 'rgba(159,232,255,.12)'; c.beginPath(); c.arc(W / 2, H * 0.4, W * 0.22, 0, 6.28318); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(W / 2, H * 0.4, W * 0.12, 0, 6.28318); c.stroke();
        if (st.phase === 'hold') {
          var sway = ph3(seed, 'shootsw', st.n, t, 800, 1600);
          var cx = W / 2 + sway * W * 0.14, cy = H * 0.4 + sway * H * 0.05;
          c.strokeStyle = '#ffd75e'; c.lineWidth = 2;
          c.beginPath(); c.arc(cx, cy, 12, 0, 6.28318); c.stroke();
          c.beginPath(); c.moveTo(cx - 18, cy); c.lineTo(cx + 18, cy); c.moveTo(cx, cy - 18); c.lineTo(cx, cy + 18); c.stroke();
          txt(c, 'رها کن!', W / 2, H * 0.72, 12, '#7dff9e');
        } else txt(c, 'نگه دار…', W / 2, H * 0.72, 12, '#9fb6d4');
        txt(c, 'گلوله ' + faN(st.n + (st.phase === 'hold' ? 1 : 0)) + '/۵ • امتیاز: ' + faN(st.pts), W / 2, H - 24, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۳) هدف متحرک: رهگیری — داور: v3MovingTarget ——— */
  G3.movingtarget = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var apps = [];
    for (var i = 0; i < 10; i++) apps.push(500 + i * (900 + rngOf3(seed, 'mt:' + i)() * 500));
    return game('movingtarget', {
      el: el, done: done, col: '#7dffb0', hint: 'اهداف رد می‌شوند — هرچه مرکزی‌تر بزنی امتیاز بیشتر (۱۰ هدف)',
      build: function (st) { st.n = 0; st.pts = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.n >= 10) return;
            var aS = apps[st.n];
            if (t < aS - 100 || t > aS + 2800) return;
            var prog = Math.max(0, Math.min(1, (t - aS) / 2600));
            var tx = W * (0.08 + prog * 0.84);
            var dist = Math.abs(x - tx) / (W * 0.12);
            var q = Math.max(0, Math.round(100 * (1 - Math.min(1, dist))));
            TE('hit', t, q);
            st.pts += Math.round(q * 1.5); st.S.score(st.pts);
            FX.text(tx, st.S.H() * 0.4, faN(q), q >= 80 ? '#7dff9e' : '#ffe08a', 15);
            snd(q >= 80 ? 'cheer' : 'click');
            st.n++;
            if (st.n >= 10) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.n < 10) {
          var aS = apps[st.n];
          if (t >= aS - 100) {
            var prog = Math.max(0, Math.min(1.15, (t - aS) / 2600));
            var tx = W * (0.08 + Math.min(1, prog) * 0.84);
            c.font = '26px serif'; c.textAlign = 'center'; c.fillText('🎯', tx, H * 0.4);
            c.strokeStyle = 'rgba(125,255,176,.5)'; c.beginPath(); c.arc(tx, H * 0.4 - 8, W * 0.12, 0, 6.28318); c.stroke();
          }
        }
        txt(c, 'هدف ' + faN(st.n + 1) + '/۱۰ • امتیاز: ' + faN(st.pts), W / 2, H - 24, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۴) تک‌تیرانداز: نفس + باد — داور: v3Sniper ——— */
  G3.sniper = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('sniper', {
      el: el, done: done, col: '#6b8bff', hint: 'چرخه‌ی نفس را دنبال کن — در آرامش شلیک کن؛ ۳ گلوله',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'aim' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T();
            if (st.phase !== 'aim' || st.n >= 3) return;
            var wind = Math.abs(rngOf3(seed, 'snip:' + st.n)() * 2 - 1);
            var breath = Math.abs(ph3(seed, 'snipb', st.n, t, 2600, 3800));
            var q = Math.round(100 * Math.max(0, 1 - breath * 1.3 - wind * 0.25));
            TE('shot', t, q);
            st.pts += Math.round(q * 3.4); st.S.score(st.pts);
            FX.text(st.S.W() / 2, st.S.H() * 0.32, faN(q), q >= 80 ? '#7dff9e' : '#ffe08a', 18);
            snd(q >= 80 ? 'cheer' : 'stamp');
            st.n++;
            if (st.n >= 3) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(107,139,255,.1)'; rr(c, 0, 0, W, H, 0); c.fill();
        var breath = ph3(seed, 'snipb', st.n < 3 ? st.n : 2, t, 2600, 3800);
        var s = 1 + breath * 0.18;
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
        c.beginPath(); c.arc(W / 2, H * 0.42, W * 0.13 * s, 0, 6.28318); c.stroke();
        c.beginPath(); c.arc(W / 2, H * 0.42, 3, 0, 6.28318); c.stroke();
        /* نوار نفس */
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 20, H * 0.66, W - 40, 12, 6); c.fill();
        c.fillStyle = Math.abs(breath) < 0.3 ? '#7dff9e' : '#ff8ba0'; rr(c, 20, H * 0.66, (W - 40) * (1 - Math.abs(breath)), 12, 6); c.fill();
        txt(c, Math.abs(breath) < 0.3 ? 'آرام — شلیک کن!' : 'نفس…', W / 2, H * 0.76, 13, Math.abs(breath) < 0.3 ? '#7dff9e' : '#ff8ba0');
        txt(c, 'گلوله ' + faN(st.n + 1) + '/۳ • امتیاز: ' + faN(st.pts), W / 2, H - 24, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۵) تیر سریع: ۱۵ هدف لحظه‌ای — داور: v3RapidTarget ——— */
  G3.rapidtarget = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var apps = [], lifes = [];
    for (var i = 0; i < 15; i++) { var r = rngOf3(seed, 'rt:' + i); apps.push(600 + i * (820 + r() * 300)); lifes.push(900 + r() * 400) }
    return game('rapidtarget', {
      el: el, done: done, col: '#ffe06b', hint: 'اهداف لحظه‌ای ظاهر می‌شوند — هرچه سریع‌تر، امتیاز بیشتر',
      build: function (st) { st.n = 0; st.pts = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T();
            if (st.n >= 15) return;
            var aS = apps[st.n];
            if (t < aS - 80) return;
            var rt = t - aS;
            TE('hit', t, 0, Math.round(rt));
            var p = Math.max(10, Math.round((900 - rt) / 3));
            st.pts += Math.max(0, p); st.S.score(st.pts);
            FX.text(st.S.W() / 2, st.S.H() * 0.4, (rt < 350 ? '⚡ ' : '') + faN(Math.max(0, p)), rt < 350 ? '#7dff9e' : '#ffe08a', 16);
            snd(rt < 350 ? 'cheer' : 'click');
            st.n++;
            if (st.n >= 15) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.n < 15 && t >= apps[st.n] - 80 && t <= apps[st.n] + lifes[st.n] + 120) {
          var x = W * (0.2 + ((st.n * 37) % 60) / 100), y = H * (0.3 + ((st.n * 53) % 40) / 100);
          c.font = '30px serif'; c.textAlign = 'center'; c.fillText('🎈', x, y);
        }
        txt(c, 'هدف ' + faN(st.n + 1) + '/۱۵ • امتیاز: ' + faN(st.pts), W / 2, H - 24, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۶) شنای ۵۰ متر انفجاری — داور: v3Swim50 ——— */
  G3.swim50 = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('swim50', {
      el: el, done: done, col: '#2bb8ff', hint: 'انفجاری و سریع — یک‌درمیان! ۲۶ ضربه = پایان کامل',
      build: function (st) { st.n = 0; st.sum = 0; st.lastT = -1; st.lastSide = -1 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) return;
            if (st.lastT >= 0) {
              var g = t - st.lastT;
              if (g < 80 || g > 1500) return;
              st.sum += Math.max(0, 20 - (g - 110) / 22);
            }
            st.lastT = t; st.lastSide = side; st.n++;
            TE('p', t, side);
            if (st.n % 4 === 0) snd('click');
            if (st.n >= 26) st.finish(Math.round(st.sum) + 120);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(43,184,255,.14)'; rr(c, 0, 0, W, H, 0); c.fill();
        var prog = Math.min(1, st.n / 26);
        c.font = '30px serif'; c.textAlign = 'center'; c.fillText('🏊', W * prog * 0.9 + W * 0.05, H * 0.45 + Math.sin(t / 160) * 8);
        txt(c, 'ضربه ' + faN(st.n) + '/۲۶ • سرعت: ' + faN(Math.round(Math.min(99, st.sum / Math.max(1, st.n) * 6))) , W / 2, H * 0.7, 13, '#ffe08a');
        txt(c, 'چپ/راست سریع — انفجار!', W / 2, H - 24, 11, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۷) شیرجه: توالی حرکات + ورود — داور: v3Diving ——— */
  G3.diving = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('diving', {
      el: el, done: done, col: '#4dd2ff', hint: 'توالی حرکات را به‌ترتیب و به‌موقع بزن؛ آخرین ورود را وسط بگیر',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'idle' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase === 'idle') {
              if (st.n >= 3) return;
              var r = rngOf3(seed, 'dive:' + st.n);
              st.len = 4 + Math.floor(r() * 3);
              st.codes = [];
              for (var j = 0; j < st.len + 2; j++) st.codes.push(Math.floor(r() * 4)); /* سمبل‌ها محلی‌اند — داور فقط len/ok را می‌سنجد */
              st.i = 0; st.ok = 0; st.i0 = t; st.phase = 'seq';
              return;
            }
            if (st.phase === 'entry') {
              /* ورود: هرچه نزدیک سنکرون بزنی بهتر */
              var entry = Math.max(0, Math.min(1, 1 - Math.abs(Math.sin((t - st.entryT) / 420 * 6.28318))));
              entry = Math.round(entry * 20) / 20;
              TE('dive', t, st.ok, entry, st.len);
              st.pts += st.ok * 90 + Math.round(entry * 160); st.S.score(st.pts);
              FX.text(st.S.W() / 2, st.S.H() * 0.5, entry >= 0.8 ? 'ورود تمیز!' : faN(Math.round(entry * 100)) + '٪', entry >= 0.8 ? '#7dff9e' : '#ffe08a', 15);
              snd(entry >= 0.8 ? 'cheer' : 'stamp');
              st.n++; st.phase = 'idle2';
              setTimeout(function () { if (!st.over) { if (st.n >= 3) st.finish(st.pts); else st.phase = 'idle' } }, 700);
              return;
            }
            if (st.phase !== 'seq') return;
            var W2 = st.S.W();
            var dir = x < W2 / 4 ? 0 : x < W2 / 2 ? 1 : x < (W2 * 3) / 4 ? 2 : 3;
            var el0 = t - st.i0;
            var win = 700 + st.i * 130;
            if (el0 > win + 900) { /* انقضا */ st.phase = 'entry'; st.entryT = t; return }
            if (dir === st.codes[st.i] && Math.abs(el0 - win) < 520) { st.ok++; snd('click'); FX.text(W2 / 2, st.S.H() * 0.3, '✓', '#7dff9e', 14) }
            else { snd('alert') }
            st.i++;
            if (st.i >= st.len) { st.phase = 'entry'; st.entryT = t }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(77,210,255,.1)'; rr(c, 0, H * 0.6, W, H * 0.4, 0); c.fill();
        if (st.phase === 'seq') {
          var ar = ['←', '↑', '→', '↓'];
          for (var j = 0; j < st.len; j++) {
            c.font = '24px serif'; c.textAlign = 'center';
            c.fillStyle = j < st.i ? 'rgba(125,255,158,.9)' : j === st.i ? '#ffd75e' : 'rgba(255,255,255,.25)';
            c.fillText(ar[st.codes[j]], W / 2 + (j - (st.len - 1) / 2) * 34, H * 0.35);
          }
        } else if (st.phase === 'entry') {
          var ph = Math.sin((t - st.entryT) / 420 * 6.28318);
          c.font = '26px serif'; c.fillText('🤿', W / 2 + ph * W * 0.12, H * 0.5);
          txt(c, 'ورود را وسط بزن!', W / 2, H * 0.72, 12, '#ffe08a');
        } else txt(c, 'شیرجه ' + faN(st.n + 1) + '/۳ — بزن تا شروع شود', W / 2, H * 0.35, 13, '#ffe08a');
        if (st.phase === 'entry') {
          /* ورود با هر ضربه بسته می‌شود — در down هندل نمی‌شود چون seq فعال است؛ اینجا از تایمر */
          if (t - st.entryT > 1500) {
            var entry = Math.max(0, 1 - Math.abs(Math.sin((t - st.entryT) / 420 * 6.28318)));
            TE('dive', t, st.ok, Math.round(entry * 20) / 20, st.len);
            st.pts += st.ok * 90 + Math.round(entry * 160); st.S.score(st.pts);
            snd('stamp'); st.n++; st.phase = 'idle2';
            setTimeout(function () { if (!st.over) { if (st.n >= 3) st.finish(st.pts); else st.phase = 'idle' } }, 700);
          }
        }
        txt(c, 'شیرجه ' + faN(st.n + 1) + '/۳ • امتیاز: ' + faN(st.pts), W / 2, H - 22, 11, '#9fb6d4');
      }
    });
  };

  /* ——— ۲۸) روئینگ: سنکرون پارو — داور: v3Rowing ——— */
  G3.rowing = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('rowing', {
      el: el, done: done, col: '#7dffc4', hint: 'پارو چپ/راست وقتی سنکرون وسط است — ۲۶ پارو',
      build: function (st) { st.n = 0; st.pts = 0; st.lastSide = -1 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) return;
            if (st.n >= 26) return;
            var drift = ph3(seed, 'row', Math.floor(st.n / 6), t, 1500, 2400);
            var qS = Math.max(0, 1 - Math.abs(drift) / 0.5);
            TE('stroke', t, side, Math.round(qS * 100) / 100);
            st.pts += Math.round(qS * 16); st.S.score(st.pts);
            if (qS > 0.8) snd('click'); else snd('alert');
            st.lastSide = side; st.n++;
            if (st.n >= 26) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 500);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(125,255,196,.09)'; rr(c, 0, H * 0.5, W, H * 0.3, 0); c.fill();
        var drift = ph3(seed, 'row', Math.floor(st.n / 6), t, 1500, 2400);
        c.font = '30px serif'; c.textAlign = 'center'; c.fillText('🚣', W / 2 + drift * W * 0.1, H * 0.45);
        c.fillStyle = 'rgba(255,255,255,.1)'; rr(c, 20, H * 0.68, W - 40, 18, 9); c.fill();
        var zw = (W - 40) * 0.3;
        c.fillStyle = 'rgba(125,255,158,.3)'; rr(c, (W - zw) / 2, H * 0.68, zw, 18, 9); c.fill();
        c.fillStyle = '#ffd75e'; rr(c, 20 + (W - 44) * ((drift + 1) / 2), H * 0.68 - 4, 8, 26, 4); c.fill();
        txt(c, 'پارو ' + faN(st.n) + '/۲۶ • امتیاز: ' + faN(st.pts), W / 2, H * 0.82, 12, '#9fb6d4');
        txt(c, 'یک‌درمیان چپ/راست — داخل نوار سبز', W / 2, H - 22, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۲۹) کایاک اسلالوم: دروازه‌ها — داور: v3Kayak ——— */
  G3.kayak = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var gates = [];
    for (var i = 0; i < 10; i++) gates.push(12 + i * 10 + Math.floor(rngOf3(seed, 'kay:' + i)() * 5) - 2);
    return game('kayak', {
      el: el, done: done, col: '#3ee8d0', hint: 'پارو بزن؛ وقتی از دروازه رد شدی (پنجره‌ی سبز) دکمه‌ی دروازه را بزن',
      build: function (st) { st.strokes = 0; st.g = 0; st.pts = 0; st.lastSide = -1 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W(), H = st.S.H();
            if (st.g < 10 && x > W * 0.72 && y < H * 0.3) {
              /* دکمه‌ی دروازه */
              var gS = gates[st.g];
              var ok = (st.strokes >= gS - 2 && st.strokes <= gS + 2) ? 1 : 0;
              TE('gate', t, st.g, ok);
              if (ok) { st.pts += 110; snd('cheer'); FX.text(W * 0.5, H * 0.4, '✓ دروازه', '#7dff9e', 15) }
              else { snd('alert'); FX.text(W * 0.5, H * 0.4, '✗ از دست رفت', '#ff8ba0', 14) }
              st.S.score(st.pts); st.g++;
              return;
            }
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) return;
            st.lastSide = side; st.strokes++;
            TE('p', t, side);
            snd('click');
            if (st.g >= 10 && st.strokes > gates[9] + 4) st.finish(st.pts + Math.min(120, st.strokes * 6));
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(62,232,208,.08)'; rr(c, 0, 0, W, H, 0); c.fill();
        if (st.g < 10) {
          var gS = gates[st.g];
          var near = Math.abs(st.strokes - gS) <= 2;
          c.fillStyle = near ? 'rgba(125,255,158,.45)' : 'rgba(255,255,255,.14)';
          rr(c, W * 0.3, H * 0.35, W * 0.4, H * 0.2, 10); c.fill();
          txt(c, 'دروازه ' + faN(st.g + 1) + '/۱۰' + (near ? ' — الان!' : ' — پارو ادامه بده'), W / 2, H * 0.46, 13, near ? '#7dff9e' : '#9fb6d4');
        } else txt(c, 'پایان مسیر — ادامه بده', W / 2, H * 0.4, 13, '#ffe08a');
        c.font = '26px serif'; c.textAlign = 'center'; c.fillText('🛶', W / 2 + Math.sin(st.strokes / 2) * 12, H * 0.62);
        txt(c, 'پارو: ' + faN(st.strokes) + ' • امتیاز: ' + faN(st.pts) + ' • دکمه‌ی دروازه: بالا-راست', W / 2, H - 22, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۳۰) موتور‌کراس: سرعت + خیز بیدوقع — داور: v3Moto ——— */
  G3.moto = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var obs = [];
    for (var i = 0; i < 60; i++) obs.push(10 + i * 8 + Math.floor(rngOf3(seed, 'moto:' + i)() * 5) - 2);
    return game('moto', {
      el: el, done: done, col: '#ff9d3c', hint: 'گاز بده؛ وقت‌ی مانع روبه‌رو شد «خیز» بزن — خیز وسط = نزدیک و امتیاز بیشتر',
      build: function (st) { st.taps = 0; st.i = 0; st.pts = 0; st.lastSide = -1; st.done = false },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W(), H = st.S.H();
            if (st.i < 60 && y < H * 0.3 && x > W * 0.7) {
              /* دکمه‌ی خیز */
              var oS = obs[st.i];
              var diff = st.taps - oS;
              var pass = Math.abs(diff) <= 1 ? 1 : 0, near = (pass && Math.abs(diff) === 1) ? 1 : 0;
              TE('ob', t, pass, near);
              st.pts += pass * 70 + near * 30; st.S.score(st.pts);
              if (pass) { snd('cheer'); FX.text(W * 0.5, H * 0.42, near ? 'نزدیک! +' + faN(100) : '✓ +' + faN(70), '#7dff9e', 14) }
              else { snd('alert'); FX.shake(); FX.text(W * 0.5, H * 0.42, 'برخورد!', '#ff8ba0', 15) }
              st.i++;
              if (st.i >= 60 && !st.done) { st.done = true; setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600) }
              return;
            }
            var side = x < W / 2 ? 0 : 1;
            if (side === st.lastSide) return;
            st.lastSide = side; st.taps++;
            TE('p', t, side);
            if (st.taps % 3 === 0) snd('click');
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,157,60,.1)'; rr(c, 0, H * 0.45, W, H * 0.3, 0); c.fill();
        if (st.i < 60) {
          var rel = obs[st.i] - st.taps;
          if (rel <= 6 && rel >= -1) {
            var ox = W * (1 - Math.max(0, rel) / 7);
            c.font = '26px serif'; c.textAlign = 'center'; c.fillText('🛢️', ox, H * 0.52);
            if (rel <= 1) txt(c, 'خیز! (بالا-راست)', W / 2, H * 0.32, 12, '#ffe08a');
          }
        }
        c.font = '28px serif'; c.fillText('🏍️', W * 0.16 + (st.taps % 4) * 3, H * 0.55);
        txt(c, 'مانع ' + faN(st.i) + '/۶۰ • گاز: ' + faN(st.taps) + ' • امتیاز: ' + faN(st.pts), W / 2, H * 0.8, 12, '#9fb6d4');
        txt(c, 'چپ/راست = گاز • بالا-راست = خیز', W / 2, H - 22, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۳۱) رالی: ۶ پیچ — داور: v3Rally ——— */
  G3.rally = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var corners = [];
    /* V92: aS تجمعی — بایت‌سازگار با داور جدید (olyScore.v3Rally) — گپ مجاورها ۱۵۰۰..۲۲۰۰ms */
    var aSAcc = 800;
    for (var i = 0; i < 6; i++) { aSAcc += 1500 + rngOf3(seed, 'ral:' + i)() * 700; corners.push(aSAcc) }
    return game('rally', {
      el: el, done: done, col: '#c9a06b', hint: 'وقتی پیچ نزدیک شد درست فرمان بده — دقت فرمان = امتیاز',
      build: function (st) { st.i = 0; st.pts = 0; st.phase = 'ready' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase !== 'corner' || st.i >= 6) return;
            var aS = corners[st.i];
            if (t < aS - 350) return;
            var ideal = W / 2 + Math.sin((st.i + 1) * 2.1) * W * 0.2;
            var q = Math.max(0, Math.min(1, 1 - Math.abs(x - ideal) / (W * 0.3)));
            q = Math.round(q * 20) / 20;
            TE('corner', t, 0, q);
            st.pts += Math.round(q * 130); st.S.score(st.pts);
            FX.text(W / 2, st.S.H() * 0.4, faN(Math.round(q * 100)) + '٪', q >= 0.8 ? '#7dff9e' : '#ffe08a', 16);
            snd(q >= 0.8 ? 'cheer' : 'click');
            st.i++; st.phase = 'ready';
            if (st.i >= 6) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(201,160,107,.1)'; rr(c, 0, H * 0.5, W, H * 0.35, 0); c.fill();
        if (st.i < 6) {
          var aS = corners[st.i];
          var rel = aS - t;
          if (rel < 900 && rel > -350) {
            st.phase = 'corner';
            var bend = Math.sin((st.i + 1) * 2.1);
            c.strokeStyle = 'rgba(255,215,94,.7)'; c.lineWidth = 5;
            c.beginPath(); c.moveTo(W / 2, H * 0.85); c.quadraticCurveTo(W / 2 + bend * W * 0.4, H * 0.6, W / 2 + bend * W * 0.45, H * 0.45); c.stroke();
            txt(c, 'پیچ ' + faN(st.i + 1) + '/۶ — فرمان بزن!', W / 2, H * 0.3, 14, '#ffe08a');
          } else st.phase = 'ready';
        }
        c.font = '26px serif'; c.textAlign = 'center'; c.fillText('🚙', W / 2, H * 0.78);
        txt(c, 'پیچ ' + faN(Math.min(6, st.i + 1)) + '/۶ • امتیاز: ' + faN(st.pts), W / 2, H - 22, 11, '#9fb6d4');
      }
    });
  };

  /* ——— ۳۲) فرمول یک: خط رانندگی + اوج — داور: v3Formula ——— */
  G3.formula = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    var turns = [];
    for (var i = 0; i < 8; i++) turns.push(700 + i * (1200 + rngOf3(seed, 'frm:' + i)() * 500));
    return game('formula', {
      el: el, done: done, col: '#ff4d88', hint: 'اپکس هر پیچ را بگیر — دقت بالا فقط در پنجره‌ی اپکس معتبر است',
      build: function (st) { st.i = 0; st.pts = 0; st.phase = 'ready' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase !== 'turn' || st.i >= 8) return;
            var aS = turns[st.i];
            if (t < aS - 250) return;
            var ideal = W / 2 + Math.sin((st.i + 1) * 1.7) * W * 0.24;
            var q = Math.max(0, Math.min(1, 1 - Math.abs(x - ideal) / (W * 0.28)));
            q = Math.round(q * 20) / 20;
            TE('turn', t, 0, q);
            st.pts += Math.round(q * 140); st.S.score(st.pts);
            FX.text(W / 2, st.S.H() * 0.38, q >= 0.85 ? 'اپکس! +' + faN(Math.round(q * 140)) : faN(Math.round(q * 100)) + '٪', q >= 0.85 ? '#7dff9e' : '#ffe08a', 16);
            snd(q >= 0.85 ? 'cheer' : 'click');
            st.i++; st.phase = 'ready';
            if (st.i >= 8) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.i < 8) {
          var rel = turns[st.i] - t;
          if (rel < 800 && rel > -250) {
            st.phase = 'turn';
            var bend = Math.sin((st.i + 1) * 1.7);
            c.strokeStyle = 'rgba(255,77,136,.6)'; c.lineWidth = 6;
            c.beginPath(); c.moveTo(W / 2, H * 0.9); c.quadraticCurveTo(W / 2 + bend * W * 0.42, H * 0.55, W / 2 + bend * W * 0.3, H * 0.35); c.stroke();
            c.fillStyle = 'rgba(125,255,158,.25)'; c.beginPath(); c.arc(W / 2 + bend * W * 0.3, H * 0.38, W * 0.09, 0, 6.28318); c.fill();
            txt(c, 'اپکس ' + faN(st.i + 1) + '/۸', W / 2, H * 0.24, 14, '#ffe08a');
          } else st.phase = 'ready';
        }
        c.font = '26px serif'; c.textAlign = 'center'; c.fillText('🏎️', W / 2, H * 0.82);
        txt(c, 'پیچ ' + faN(Math.min(8, st.i + 1)) + '/۸ • امتیاز: ' + faN(st.pts), W / 2, H - 22, 11, '#9fb6d4');
      }
    });
  };

  /* ——— ۳۳) قایق‌سواری: موج — داور: v3Boat ——— */
  G3.boat = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('boat', {
      el: el, done: done, col: '#3bb8e8', hint: 'پارو در آرامش موج — ۲۲ پارو',
      build: function (st) { st.n = 0; st.pts = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T();
            if (st.n >= 22) return;
            var wv = Math.abs(ph3(seed, 'boat', Math.floor(st.n / 5), t, 1100, 1700));
            var qS = Math.max(0, 1 - wv);
            TE('stroke', t, Math.round(qS * 100) / 100);
            st.pts += Math.round(qS * 15); st.S.score(st.pts);
            if (qS > 0.75) snd('click'); else snd('alert');
            st.n++;
            if (st.n >= 22) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 500);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var wv = ph3(seed, 'boat', Math.floor(st.n / 5), t, 1100, 1700);
        c.fillStyle = 'rgba(59,184,232,.12)'; rr(c, 0, H * 0.5 + wv * 10, W, H * 0.5, 0); c.fill();
        c.font = '30px serif'; c.textAlign = 'center'; c.fillText('⛵', W / 2 + wv * 20, H * 0.42 + wv * 12);
        txt(c, 'موج: ' + (Math.abs(wv) < 0.35 ? 'آرام — پارو بزن!' : 'طوفانی…'), W / 2, H * 0.68, 13, Math.abs(wv) < 0.35 ? '#7dff9e' : '#ff8ba0');
        txt(c, 'پارو ' + faN(st.n) + '/۲۲ • امتیاز: ' + faN(st.pts), W / 2, H * 0.8, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۳۴) تعادل: روی خط بمان — داور: v3Balance ——— */
  G3.balance = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('balance', {
      el: el, done: done, col: '#b06bff', hint: 'روی طناب بمان — چپ/راست بزن تا از خط نیفتی؛ ۳ دور',
      build: function (st) { st.n = 0; st.pos = 0; st.v = 0; st.ms = 0; st.pts = 0; st.phase = 'run'; st.falls = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var W = st.S.W();
            st.v += (x < W / 2 ? -0.42 : 0.42);
            snd('click');
          }
        };
      },
      frame: function (st, t, dt) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        if (st.phase === 'run') {
          st.v += Math.sin(t / 700 + st.n) * 0.012 * (dt / 16);
          st.v *= 0.985;
          st.pos += st.v * (dt / 16);
          st.ms += dt;
          if (Math.abs(st.pos) > 1) {
            var q = Math.min(1, st.ms / 8000);
            TE('round', st.T(), Math.round(st.ms), Math.round(q * 20) / 20);
            st.pts += Math.round(st.ms / 40) + Math.round(q * 50); st.S.score(st.pts);
            st.n++; st.pos = 0; st.v = 0; st.ms = 0;
            snd('alert');
            if (st.n >= 3) { st.phase = 'done'; setTimeout(function () { if (!st.over) st.finish(st.pts) }, 500) }
          }
        }
        /* طناب + بازیکن */
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, H * 0.5); c.bezierCurveTo(W * 0.3, H * 0.44, W * 0.7, H * 0.56, W, H * 0.5); c.stroke();
        var px = W / 2 + st.pos * W * 0.42;
        c.font = '28px serif'; c.textAlign = 'center'; c.fillText('🤸', px, H * 0.5 - 12);
        c.fillStyle = Math.abs(st.pos) > 0.75 ? '#ff8ba0' : '#7dff9e';
        rr(c, 20, H * 0.75, (W - 40) * Math.min(1, st.ms / 8000), 10, 5); c.fill();
        txt(c, 'دور ' + faN(st.n + 1) + '/۳ • دوام: ' + faN(Math.round(st.ms / 100) / 10) + 's • امتیاز: ' + faN(st.pts), W / 2, H * 0.85, 12, '#9fb6d4');
        txt(c, 'چپ/راست بزن تا نیفتی', W / 2, H - 20, 10, '#7d92ad');
      }
    });
  };

  /* ——— ۳۵) تایمینگ: ساعت متوقف — داور: v3Timing ——— */
  G3.timing = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('timing', {
      el: el, done: done, col: '#ffd75e', hint: 'عقربه را داخل قوس هدف متوقف کن — ۸ دور',
      build: function (st) { st.n = 0; st.pts = 0 },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T();
            if (st.n >= 8) return;
            var r = rngOf3(seed, 'tim:' + st.n);
            var w = 0.8 + r() * 1.4, a0 = r() * 360, ac = 40 + r() * 280;
            var theta = (a0 + w * (t / 1000) * 360) % 360;
            var qS = Math.round(100 * Math.max(0, 1 - angD3(theta, ac) / 60));
            TE('stop', t, 0, qS);
            st.pts += Math.round(qS * 10) + (qS >= 95 ? 40 : 0); st.S.score(st.pts);
            FX.text(st.S.W() / 2, st.S.H() * 0.3, qS >= 95 ? 'کامل! +' + faN(Math.round(qS * 10) + 40) : faN(qS), qS >= 95 ? '#7dff9e' : '#ffe08a', 16);
            snd(qS >= 95 ? 'cheer' : 'stamp');
            st.n++;
            if (st.n >= 8) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var cx = W / 2, cy = H * 0.45, rad = Math.min(W, H) * 0.3;
        var r = rngOf3(seed, 'tim:' + (st.n < 8 ? st.n : 7));
        var w = 0.8 + r() * 1.4, a0 = r() * 360, ac = 40 + r() * 280;
        c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 10;
        c.beginPath(); c.arc(cx, cy, rad, 0, 6.28318); c.stroke();
        /* قوس هدف */
        c.strokeStyle = 'rgba(125,255,158,.75)';
        c.beginPath(); c.arc(cx, cy, rad, (ac - 24) * 6.28318 / 360 - 1.5708, (ac + 24) * 6.28318 / 360 - 1.5708); c.stroke();
        var theta = (a0 + w * (t / 1000) * 360) % 360;
        var ha = theta * 6.28318 / 360 - 1.5708;
        c.strokeStyle = '#ffd75e'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ha) * rad, cy + Math.sin(ha) * rad); c.stroke();
        txt(c, 'دور ' + faN(st.n + 1) + '/۸ • امتیاز: ' + faN(st.pts), cx, H * 0.82, 12, '#9fb6d4');
      }
    });
  };

  /* ——— ۳۶) رمز حافظه: دنباله‌ی بلندشونده — داور: v3Memory ——— */
  G3.memory = function (el, done) {
    var seed = seedOf(); if (!seed) return false;
    return game('memory', {
      el: el, done: done, col: '#8f7dff', hint: 'دنباله را به‌خاطر بسپار و تکرار کن — ۸ مرحله',
      build: function (st) { st.n = 0; st.pts = 0; st.phase = 'idle' },
      input: function (st) {
        return {
          down: function (x, y) {
            var t = st.T(); var W = st.S.W();
            if (st.phase === 'idle') {
              if (st.n >= 8) return;
              st.len = 3 + st.n;
              var r = rngOf3(seed, 'mem:' + st.n);
              st.codes = [];
              for (var j = 0; j < st.len + 2; j++) st.codes.push(Math.floor(r() * 4));
              st.i = 0; st.ok = 0; st.showT = t; st.phase = 'show';
              setTimeout(function () { if (!st.over && st.phase === 'show') st.phase = 'input' }, 650 + st.len * 380);
              return;
            }
            if (st.phase !== 'input') return;
            var dir = x < W / 4 ? 0 : x < W / 2 ? 1 : x < (W * 3) / 4 ? 2 : 3;
            if (dir === st.codes[st.i]) { st.ok++; snd('click') } else { snd('alert') }
            st.i++;
            if (st.i >= st.len) {
              TE('seq', t, st.ok, st.len);
              st.pts += st.ok * 40; st.S.score(st.pts);
              FX.text(W / 2, st.S.H() * 0.3, faN(st.ok) + '/' + faN(st.len), st.ok === st.len ? '#7dff9e' : '#ffe08a', 17);
              st.n++; st.phase = 'idle';
              if (st.n >= 8) setTimeout(function () { if (!st.over) st.finish(st.pts) }, 600);
            }
          }
        };
      },
      frame: function (st, t) {
        var c = st.S.ctx, W = st.S.W(), H = st.S.H();
        c.clearRect(0, 0, W, H);
        var ar = ['←', '↑', '→', '↓'];
        if (st.phase === 'show') {
          var lit = Math.floor((t - st.showT) / 380);
          for (var j = 0; j < st.len; j++) {
            c.font = '26px serif'; c.textAlign = 'center';
            c.fillStyle = j === lit ? '#ffd75e' : 'rgba(255,255,255,.2)';
            c.fillText(ar[st.codes[j]], W / 2 + (j - (st.len - 1) / 2) * 32, H * 0.38);
          }
        } else if (st.phase === 'input') {
          txt(c, 'تکرار کن: ' + faN(st.i) + '/' + faN(st.len), W / 2, H * 0.36, 14, '#ffe08a');
          txt(c, '← ↑ → ↓', W / 2, H * 0.44, 18, 'rgba(255,255,255,.35)');
        } else txt(c, st.n < 8 ? 'مرحله ' + faN(st.n + 1) + '/۸ — بزن تا نشان بدهد' : 'پایان', W / 2, H * 0.38, 13, '#ffe08a');
        txt(c, 'امتیاز: ' + faN(st.pts), W / 2, H * 0.8, 12, '#9fb6d4');
      }
    });
  };

  (function install() {
    var G = A.GAMES, prev = {}, keys = [];
    for (var k in G) { if (Object.prototype.hasOwnProperty.call(G, k)) { prev[k] = G[k]; keys.push(k) } }
    for (var i = 0; i < keys.length; i++) {
      (function (key) {
        G[key] = function (el, done) {
          var okGate = false;
          try { okGate = skillActive() && !!G3[key] && !!seedOf() } catch (e) { okGate = false }
          if (okGate) {
            var r = G3[key](el, done);
            if (r !== false) return;
          }
          return prev[key](el, done);
        };
      })(keys[i]);
    }
    /* V89: رشته‌های فقط-نسل۳ — بدون fallback قدیمی؛ seed نبود = امتیاز صفر امن */
    for (var k3 in G3) {
      if (!Object.prototype.hasOwnProperty.call(G3, k3) || Object.prototype.hasOwnProperty.call(G, k3)) continue;
      (function (key3) {
        G[key3] = function (el, done) {
          var r3 = false;
          try { r3 = G3[key3](el, done) } catch (e3) { console.log('wg33g3', e3) }
          if (r3 === false) { try { done(0) } catch (e4) {} }
        };
      })(k3);
    }
    try { console.log('[WD_OLY3] engine ready — disciplines:', keys.length + '+', Object.keys(G3).length) } catch (e) {}
  })();
})();
