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
  var CHESS_BOOK3 = [
    { pos: '......k./.....ppp/......../......../......../......../......../....R..K.', mv: [60, 4] },
    { pos: '.......k/......p./......K./....Q.../......../......../......../......../', mv: [36, 14] },
    { pos: '......rk/......pp/....b.../....n.../......../......../......../......K.', mv: [28, 22] },
    { pos: 'k......./.R.....p/..K...../......../......../......../..R...../......../', mv: [58, 2] },
    { pos: 'k......./..K...../......../......../...B..../....p..Q/......../......../', mv: [46, 6] },
    { pos: '......k./.....p.p/....n.../.......Q/......../...B..../......../R......./', mv: [47, 15] },
    { pos: '.......k/.p....../......K./......../......../......../......../R......./', mv: [56, 0] },
    { pos: '.......k/R......./.....N../......../......../......../....K.../......../', mv: [8, 15] },
    { pos: 'k......./......../.K....../......../......../......../......../...R..../', mv: [59, 3] }
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
    window.addEventListener('resize', size);
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
    try { console.log('[WD_OLY3] engine ready — disciplines:', keys.length) } catch (e) {}
  })();
})();
