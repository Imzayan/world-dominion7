/* ============================================================
   WORLD DOMINION — OLYMPICS V3 (V92) — WD_OLY3D
   Premium 3D Skill Engine — stylized low-poly sports runtime
   ============================================================
   معماری (OLYMPICS V3 PHASE 3):
   - لایه‌ی 3D «روی» سیستم داده‌ی المپیک سوار است؛ هیچ وضعیت
     سرور/بازی را تکرار نمی‌کند. داوری = همان داورهای v3 سرور
     (src/lib/olyScore.ts) — این فایل فقط تله‌متری بایت‌سازگار
     با همان قرارداد تولید می‌کند و نمایش می‌دهد.
   - lazy-load: فقط با اولین ورود به نسخه‌ی 3D لود می‌شود
     (الگوی cv-engine.js). Three.js r160 ESM هم فقط همین‌جا
     با import() پویا لود می‌شود (public/game/vendor/).
   - تک‌حلقه‌ی rAF: از A.loop33 رجیستری مرکزی صحنه (خودتاب
     با بستن صحنه) — هیچ حلقه‌ی دائمی جدیدی ساخته نمی‌شود.
   - Performance Manager: DPR سقف‌دار، بدون سایه‌ی واقعی
     (blob shadow)، InstancedMesh تماشاگر، dispose کامل
     صحنه در پایان هر تلاش، توقف خودکار با پنهان‌شدن تب.
   - Fallback امن: هر خطا در هر مرحله = بازگشت به موتور 2D
     نسل ۳ (oly3.js) — بازی هرگز قفل نمی‌شود.
   نسخه: با ?v=91 کنترل می‌شود (همگام با __WD_V).
   ============================================================ */
(function () {
  'use strict';
  var A = window.WD33_API;
  if (!A || !A.GAMES) return; /* صحنه‌ی المپیک نیست — هیچ */

  /* ---------- ۰) ثابت‌ها و ابزار ---------- */
  var FIVE = ['sprint', 'archery', 'swim', 'boxing', 'rally'];
  var TAU = Math.PI * 2;
  var M = (window.WD_OLY3 && window.WD_OLY3.mirrors) || null; /* آینه‌های سرور */
  function faN(v) { try { return A.faN(v) } catch (e) { return String(v) } }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }
  function seedOf() { return (A.MATCH && A.MATCH.seed) ? String(A.MATCH.seed) : '' }
  /* آینه‌ی محلی archSway (در mirrors عمومی oly3 نیست — بایت‌به‌بایت با سرور: ۵ قرعه f1,f2,p1,p2,wind) */
  function swayOf(seed, i, tRel) {
    var r = M.rngOf3(seed, 'arch:' + i);
    var f1 = 900 + r() * 700, f2 = 500 + r() * 500;
    var p1 = r() * TAU, p2 = r() * TAU;
    var wind = r() * 2 - 1;
    var sway = 0.6 * Math.sin((tRel / f1) * TAU + p1) + 0.4 * Math.sin((tRel / f2) * TAU + p2);
    return { off: sway, wind: wind };
  }
  function sfx(k) { try { if (A.sndK2) A.sndK2(k) } catch (e) {} }
  function TE() { try { A.TELE.ev.apply(A.TELE, arguments) } catch (e) {} }
  function stT() { return performance.now() - ((RT.S && RT.S.t0) || performance.now()) }

  /* ---------- ۱) Performance Manager + Capability ---------- */
  var RT = { three: null, loading: null, broken: false, renderer: null, S: null, LOW: false, V: (window.WD3D_V || '91') };
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
  /* پیش‌بارگیری نرم — در intro هاب صدا زده می‌شود؛ هرگز خطا پرتاب نمی‌کند */
  function preload() { if (!RT.three && !RT.broken && M) { try { ensureThree().catch(function () {}) } catch (e) { RT.broken = true } } return !!RT.three }

  /* ---------- ۲) Renderer — یک‌بار برای کل صفحه ---------- */
  function getRenderer(w, h) {
    var T3 = RT.three;
    if (!RT.renderer) {
      try { RT.renderer = new T3.WebGLRenderer({ antialias: !RT.LOW, powerPreference: 'high-performance' }) }
      catch (e) { RT.broken = true; return null }
      var dpr = Math.min(RT.LOW ? 1 : 1.8, (window.devicePixelRatio || 1) || 1);
      RT.renderer.setPixelRatio(dpr);
    }
    RT.renderer.setSize(w, h, false);
    return RT.renderer;
  }

  /* ---------- ۳) CSS داخلی (خوداتکا — بدون دست‌زدن به index.html) ---------- */
  function injectCss() {
    if (document.getElementById('oly3d-css')) return;
    var st = document.createElement('style'); st.id = 'oly3d-css';
    st.textContent =
      '.o3d-wrap{position:relative;display:block;margin:6px auto 0;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:#0b1830;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' +
      '.o3d-wrap canvas{display:block;width:100%;height:100%}' +
      '.o3d-hud{position:absolute;inset:0;pointer-events:none;font-family:Vazirmatn,system-ui,sans-serif}' +
      '.o3d-msg{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:11px;color:#dceaff;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.8);padding:0 10px}' +
      '.o3d-tl{position:absolute;top:8px;left:8px;right:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}' +
      '.o3d-chip{padding:4px 10px;border-radius:99px;background:rgba(6,16,34,.72);border:1px solid rgba(255,255,255,.18);color:#eaf6ff;font-size:11px;font-weight:900;backdrop-filter:blur(3px)}' +
      '.o3d-chip.gold{color:#ffd75e;border-color:rgba(255,215,94,.55)}' +
      '.o3d-chip.ghost{color:#b8f7d4;border-color:rgba(125,255,158,.4)}' +
      '.o3d-meter{position:absolute;bottom:34px;left:12px;right:12px;height:7px;border-radius:99px;background:rgba(255,255,255,.13);overflow:hidden}' +
      '.o3d-meter i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3ee86e,#7dff9e);transition:width .12s linear}' +
      '.o3d-zone{position:absolute;bottom:0;top:55%;pointer-events:none;display:flex;width:100%}' +
      '.o3d-zone span{flex:1;border-left:1px dashed rgba(255,255,255,.12)}' +
      '.o3d-zone span b{position:absolute;bottom:52px;width:100%;text-align:center;font-size:10px;color:rgba(234,246,255,.85);font-weight:900;text-shadow:0 1px 4px #000}' +
      '.o3d-tap{position:absolute;top:0;bottom:0;width:50%;pointer-events:none;opacity:0;transition:opacity .18s}' +
      '.o3d-tap.l{left:0;background:linear-gradient(90deg,rgba(0,220,255,.28),transparent)}' +
      '.o3d-tap.r{right:0;background:linear-gradient(-90deg,rgba(255,157,60,.28),transparent)}' +
      '.o3d-flash{position:absolute;inset:0;pointer-events:none;opacity:0;background:#fff}' +
      '.o3d-count{position:absolute;top:38%;left:0;right:0;text-align:center;font-size:52px;font-weight:900;color:#fff;text-shadow:0 3px 22px rgba(0,0,0,.85)}' +
      '.o3d-photo{position:absolute;top:22%;left:50%;transform:translateX(-50%);min-width:70%;max-width:92%;border-radius:16px;padding:10px 14px;background:rgba(5,12,26,.9);border:1px solid rgba(255,215,94,.5);color:#fff;font-weight:900;font-size:12px;text-align:center;box-shadow:0 12px 44px rgba(0,0,0,.6)}' +
      '.o3d-photo .r{display:flex;justify-content:space-between;gap:10px;padding:3px 2px;font-size:11.5px}' +
      '.o3d-photo .r.me{color:#7dff9e}.o3d-photo .r.gh{color:#ffe08a}' +
      '.o3d-btn{position:absolute;border:0;border-radius:14px;font-family:inherit;font-weight:900;font-size:12px;color:#fff;background:rgba(10,26,52,.85);border:1.5px solid rgba(0,220,255,.55);padding:12px 18px;pointer-events:auto}' +
      '.o3d-btn.hot{background:linear-gradient(135deg,rgba(255,215,94,.9),rgba(255,157,60,.9));color:#3a2600;border-color:#ffd75e;animation:o3dPulse .5s infinite alternate}' +
      '.o3d-btn:active{transform:scale(.95)}' +
      '@keyframes o3dPulse{from{box-shadow:0 0 4px rgba(255,215,94,.4)}to{box-shadow:0 0 18px rgba(255,215,94,.95)}}';
    document.head.appendChild(st);
  }

  /* ---------- ۴) متریال/هندسه‌ی کمکی (low-poly تمیز) ---------- */
  function lamb(T3, color, flat) { return new T3.MeshLambertMaterial({ color: color, flatShading: !!flat }) }
  function box(T3, w, h, d, mat) { return new T3.Mesh(new T3.BoxGeometry(w, h, d), mat) }
  function cyl(T3, rt, rb, h, seg, mat) { return new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, seg || 8), mat) }
  function sph(T3, r, mat, seg) { return new T3.Mesh(new T3.SphereGeometry(r, seg || 10, seg ? Math.max(6, seg - 2) : 8), mat) }
  function cap(T3, r, len, mat) { return new T3.Mesh(new T3.CapsuleGeometry(r, len, 3, 8), mat) }

  /* ---------- ۵) ورزشکار Procedural Low-Poly (PHASE 5) ---------- */
  /* یک اسکلت سلسله‌مراتبی + پوزهای رویه‌ای؛ هیچ مدل سنگینی لود نمی‌شود */
  var SKINS = [0x8d5524, 0xa9714b, 0xc68642, 0xe0ac69, 0xf1c27d];
  function buildAthlete(T3, opt) {
    opt = opt || {};
    var skin = lamb(T3, opt.skin || SKINS[(Math.abs(opt.seedN || 3)) % SKINS.length], false);
    var jersey = lamb(T3, opt.jersey || 0x2bb8ff, false);
    var shorts = lamb(T3, opt.shorts || 0x14284e, false);
    var hair = lamb(T3, opt.hair || 0x1c1620, false);
    var shoe = lamb(T3, 0xf2f4f8, false);
    var root = new T3.Group();
    var J = {};
    function limb(px, py, upR, upL, loR, loL, matUp, matLo, tipMesh) {
      var g = new T3.Group(); g.position.set(px, py, 0);
      var up = cap(T3, upR, upL, matUp); up.position.y = -upL / 2 - upR * 0.4; g.add(up);
      var knee = new T3.Group(); knee.position.y = -upL - upR * 0.8; g.add(knee);
      var lo = cap(T3, loR, loL, matLo); lo.position.y = -loL / 2 - loR * 0.4; knee.add(lo);
      if (tipMesh) { tipMesh.position.y = -loL - loR * 0.7; knee.add(tipMesh) }
      return { g: g, knee: knee };
    }
    /* لگن + تنه */
    var hips = new T3.Group(); hips.position.y = 0.92; root.add(hips); J.hips = hips;
    var pelvis = box(T3, 0.30, 0.16, 0.19, shorts); hips.add(pelvis);
    var spine = new T3.Group(); hips.add(spine); J.spine = spine;
    var torso = box(T3, 0.34, 0.44, 0.21, jersey); torso.position.y = 0.30; spine.add(torso);
    var chest = box(T3, 0.37, 0.14, 0.22, jersey); chest.position.y = 0.47; spine.add(chest);
    var neck = new T3.Group(); neck.position.y = 0.55; spine.add(neck); J.neck = neck;
    var headM = box(T3, 0.23, 0.25, 0.23, skin); headM.position.y = 0.15; neck.add(headM);
    var hairM = box(T3, 0.245, 0.09, 0.245, hair); hairM.position.y = 0.255; neck.add(hairM);
    /* دست‌ها */
    var aL = limb(-0.225, 0.50, 0.055, 0.24, 0.048, 0.22, skin, skin, sph(T3, 0.055, skin)); spine.add(aL.g); J.armL = aL;
    var aR = limb(0.225, 0.50, 0.055, 0.24, 0.048, 0.22, skin, skin, sph(T3, 0.055, skin)); spine.add(aR.g); J.armR = aR;
    /* پاها */
    var lL = limb(-0.095, 0.02, 0.07, 0.34, 0.06, 0.32, skin, skin, box(T3, 0.10, 0.07, 0.22, shoe)); hips.add(lL.g); J.legL = lL;
    lL.g.children[0].material = skin; lL.knee.children[0].material = skin;
    var lR = limb(0.095, 0.02, 0.07, 0.34, 0.06, 0.32, skin, skin, box(T3, 0.10, 0.07, 0.22, shoe)); hips.add(lR.g); J.legR = lR;
    /* سایه‌ی blob (بدون سایه‌ی واقعی — Performance) */
    var shMat = new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 });
    var shadow = new T3.Mesh(new T3.CircleGeometry(0.42, 14), shMat);
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.012; root.add(shadow); J.shadow = shadow;
    root.userData.J = J;
    root.userData.mat = { skin: skin, jersey: jersey, shorts: shorts, hair: hair, shoe: shoe, sh: shMat };
    return root;
  }
  /* damp یک زاویه — هیچ پوزی پرشی نیست (PHASE 6: blend نرم) */
  function dmp(o, ax, target, dt, k) { o.rotation[ax] += (target - o.rotation[ax]) * Math.min(1, dt * (k || 14)) }
  function dmpY(o, target, dt, k) { o.position.y += (target - o.position.y) * Math.min(1, dt * (k || 12)) }
  /* پوز دویدن/گام رویه‌ای — ph فاز، k شدت 0..1 */
  function runPose(J, ph, k, lean) {
    var s = Math.sin(ph), c = Math.sin(ph + Math.PI);
    dmp(J.legL.g, 'x', s * 0.95 * k - 0.12, 14, 22); dmp(J.legL.knee, 'x', Math.max(0.08, -s) * 1.45 * k + 0.15, 14, 22);
    dmp(J.legR.g, 'x', c * 0.95 * k - 0.12, 14, 22); dmp(J.legR.knee, 'x', Math.max(0.08, -c) * 1.45 * k + 0.15, 14, 22);
    dmp(J.armL.g, 'x', c * 0.85 * k, 14, 22); dmp(J.armL.knee, 'x', -1.15 * k - 0.2, 14, 22);
    dmp(J.armR.g, 'x', s * 0.85 * k, 14, 22); dmp(J.armR.knee, 'x', -1.15 * k - 0.2, 14, 22);
    dmp(J.spine, 'x', (lean || 0.16) * k + 0.03, 10, 12);
    dmp(J.hips, 'y', 0, 10, 12); J.hips.position.y = 0.92 + Math.abs(s) * 0.045 * k;
  }
  function idlePose(J, t) {
    var b = Math.sin(t / 620) * 0.03;
    dmp(J.legL.g, 'x', 0.03, 8, 8); dmp(J.legR.g, 'x', -0.03, 8, 8);
    dmp(J.legL.knee, 'x', 0.1, 8, 8); dmp(J.legR.knee, 'x', 0.12, 8, 8);
    dmp(J.armL.g, 'x', 0.08 + b, 8, 8); dmp(J.armR.g, 'x', 0.08 - b, 8, 8);
    dmp(J.armL.knee, 'x', -0.25, 8, 8); dmp(J.armR.knee, 'x', -0.25, 8, 8);
    dmp(J.spine, 'x', 0.04 + b * 0.4, 8, 8);
  }
  function victoryPose(J, t) {
    var w = Math.sin(t / 130) * 0.35;
    dmp(J.armL.g, 'x', Math.PI - 0.5 + w, 8, 8); dmp(J.armR.g, 'x', Math.PI - 0.5 - w, 8, 8);
    dmp(J.armL.knee, 'x', -0.4, 8, 8); dmp(J.armR.knee, 'x', -0.4, 8, 8);
    dmp(J.spine, 'x', -0.12, 8, 8);
  }
  function defeatPose(J) {
    dmp(J.armL.g, 'x', 0.35, 6, 6); dmp(J.armR.g, 'x', 0.35, 6, 6);
    dmp(J.armL.knee, 'x', -0.5, 6, 6); dmp(J.armR.knee, 'x', -0.5, 6, 6);
    dmp(J.spine, 'x', 0.42, 6, 6); dmp(J.neck, 'x', 0.3, 6, 6);
  }

  /* ---------- ۶) محیط مشترک (PHASE 4: استایل یکپارچه) ---------- */
  function makeSky(T3, scene, fogNear, fogFar) {
    var col = 0x0b1830;
    scene.background = new T3.Color(col);
    scene.fog = new T3.Fog(col, fogNear || 30, fogFar || 160);
    var hemi = new T3.HemisphereLight(0xcfe4ff, 0x1a2a4a, 1.02); scene.add(hemi);
    var dir = new T3.DirectionalLight(0xffe9c4, 1.18); dir.position.set(7, 14, 5); scene.add(dir);
    var dir2 = new T3.DirectionalLight(0x7fa8ff, 0.35); dir2.position.set(-9, 8, -6); scene.add(dir2);
  }
  /* تماشاگر Instanced — ارزان و زنده (نه بازیکن جعلی؛ تماشاچی صحنه) */
  function makeCrowd(T3, scene, cx, cz, len, rotY, n) {
    n = n || (RT.LOW ? 140 : 320);
    var geo = new T3.BoxGeometry(0.34, 0.42, 0.3);
    var mat = new T3.MeshLambertMaterial({ color: 0xffffff });
    var inst = new T3.InstancedMesh(geo, mat, n);
    var dummy = new T3.Object3D(), col = new T3.Color();
    var palette = [0xff6b8f, 0x7fd8ff, 0xffd75e, 0x8f7dff, 0x7dffb0, 0xffb02e, 0xf6f7fb];
    for (var i = 0; i < n; i++) {
      dummy.position.set(cx + (Math.random() - 0.5) * len, 1.15 + Math.floor(Math.random() * 3) * 0.55, cz + (Math.random() - 0.5) * 2.6);
      dummy.rotation.y = rotY || 0; dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      col.setHex(palette[(Math.random() * palette.length) | 0]); inst.setColorAt(i, col);
    }
    inst.instanceMatrix.needsUpdate = true; scene.add(inst); return inst;
  }
  function makeStands(T3, scene, z, len) {
    var standMat = lamb(T3, 0x14213c, true);
    for (var r = 0; r < 3; r++) {
      var st = box(T3, len, 0.55, 1.4, standMat);
      st.position.set(0, 0.55 + r * 0.55, z - r * 1.1);
      scene.add(st);
    }
  }
  function makeFlag(T3, scene, x, y, z, colHex) {
    var pole = cyl(T3, 0.03, 0.03, 1.6, 6, lamb(T3, 0xd8dee8, false)); pole.position.set(x, y + 0.8, z); scene.add(pole);
    var fl = new T3.Mesh(new T3.PlaneGeometry(0.62, 0.4), new T3.MeshLambertMaterial({ color: colHex, side: T3.DoubleSide }));
    fl.position.set(x + 0.33, y + 1.38, z); scene.add(fl); return fl;
  }
  function disposeScene(scene) {
    if (!scene) return;
    scene.traverse(function (o) {
      if (o.geometry) { try { o.geometry.dispose() } catch (e) {} }
      if (o.material) {
        var ms = Array.isArray(o.material) ? o.material : [o.material];
        for (var i = 0; i < ms.length; i++) { try { if (ms[i].map) ms[i].map.dispose(); ms[i].dispose() } catch (e) {} }
      }
    });
    scene.clear();
  }

  /* ---------- ۷) دوربین سینمایی (PHASE 7) — interpolasi نرم، بدون clip ---------- */
  function camRig(cam) {
    return {
      mode: 'intro', t: 0,
      p: cam.position.clone(), l: new RT.three.Vector3(0, 1, 0),
      go: function (px, py, pz, lx, ly, lz, dt, k) {
        var f = 1 - Math.exp(-dt * (k || 3.4));
        cam.position.x += (px - cam.position.x) * f;
        cam.position.y += (py - cam.position.y) * f;
        cam.position.z += (pz - cam.position.z) * f;
        this.l.x += (lx - this.l.x) * f; this.l.y += (ly - this.l.y) * f; this.l.z += (lz - this.l.z) * f;
        cam.lookAt(this.l);
      },
      shake: function (amp) { this._sh = Math.max(this._sh || 0, amp) },
      tickShake: function (dt) {
        if (this._sh > 0.002) {
          cam.position.x += (Math.random() - 0.5) * this._sh;
          cam.position.y += (Math.random() - 0.5) * this._sh;
          this._sh *= Math.exp(-dt * 7);
        }
      }
    };
  }

  /* ---------- ۸) HUD فارسی (RTL) + Flash ---------- */
  function buildHUD(wrap, opt) {
    opt = opt || {};
    var hud = document.createElement('div'); hud.className = 'o3d-hud';
    var tl = document.createElement('div'); tl.className = 'o3d-tl';
    var scoreChip = document.createElement('span'); scoreChip.className = 'o3d-chip gold'; scoreChip.textContent = '۰';
    tl.appendChild(scoreChip);
    if (opt.modeChip) { var mc = document.createElement('span'); mc.className = 'o3d-chip'; mc.textContent = opt.modeChip; tl.appendChild(mc) }
    if (opt.ghostChip) { var gc = document.createElement('span'); gc.className = 'o3d-chip ghost'; gc.textContent = opt.ghostChip; tl.appendChild(gc) }
    hud.appendChild(tl);
    var meter = null;
    if (opt.meter) {
      meter = document.createElement('div'); meter.className = 'o3d-meter';
      var bar = document.createElement('i'); meter.appendChild(bar); hud.appendChild(meter);
      meter.set = function (v, col) { bar.style.width = clamp(v, 0, 1) * 100 + '%'; if (col) bar.style.background = col };
    }
    var msg = document.createElement('div'); msg.className = 'o3d-msg'; msg.textContent = opt.msg || ''; hud.appendChild(msg);
    var flash = document.createElement('div'); flash.className = 'o3d-flash'; hud.appendChild(flash);
    var count = document.createElement('div'); count.className = 'o3d-count'; hud.appendChild(count);
    wrap.appendChild(hud);
    var flashV = 0;
    return {
      hud: hud, msg: msg, score: scoreChip, count: count,
      meter: meter,
      setScore: function (v) { scoreChip.textContent = faN(Math.round(v)) },
      say: function (t) { msg.textContent = t },
      flash: function (col, a) { flash.style.background = col || '#fff'; flashV = a || 0.3 },
      photo: function (rowsHtml) {
        var old = hud.querySelector('.o3d-photo'); if (old) old.remove();
        var p = document.createElement('div'); p.className = 'o3d-photo'; p.innerHTML = rowsHtml; hud.appendChild(p); return p;
      },
      button: function (label, x, cls) {
        var b = document.createElement('button'); b.className = 'o3d-btn' + (cls ? ' ' + cls : '');
        b.textContent = label; b.style.left = x; b.style.bottom = '56px'; hud.appendChild(b); return b;
      },
      tick: function (dt) {
        if (flashV > 0) { flashV = Math.max(0, flashV - dt / 380); flash.style.opacity = flashV }
      }
    };
  }

  /* ---------- ۹) ورودی Pointer (ضد دبل‌تریگر — الگوی inputOf) ---------- */
  function bindInput(el, h) {
    var act = false;
    function xy(e) { var r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width] }
    function down(e) { if (act) return; act = true; var p = xy(e); try { e.preventDefault() } catch (e2) {} h.down && h.down(p[0], p[1], p[2], e) }
    function move(e) { if (!act) return; var p = xy(e); h.move && h.move(p[0], p[1], p[2], e) }
    function up(e) { if (!act) return; act = false; var p = xy(e); h.up && h.up(p[0], p[1], p[2], e) }
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('pointermove', move, { passive: false });
    el.addEventListener('pointerup', up, { passive: false });
    el.addEventListener('pointercancel', up, { passive: false });
    el.addEventListener('contextmenu', function (e) { try { e.preventDefault() } catch (e2) {} });
  }

  /* ---------- ۱۰) شبح Replay واقعی (PHASE 12 — بدون داده‌ی جعلی) ---------- */
  /* تله‌متری واقعی رکورددار (olympic_ghost) → حرکت واقعی شبح از روی رویدادهای ثبت‌شده */
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
  /* گام‌های شبح تا زمان t — از رویدادهای p واقعی رکورد (needGo: اسپرینت به go نیاز دارد، شنا نه) */
  function ghostStepsAt(gh, t, needGo) {
    if (!gh) return 0;
    var n = 0, ev = gh.ev, goT = needGo ? -1 : 0;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i]; if (!e || typeof e[0] !== 'string') continue;
      var tt = Number(e[1]) || 0;
      if (e[0] === 'go') { if (goT >= 0) break; goT = tt; continue }
      if (e[0] === 'p' && goT >= 0 && tt <= t) n++;
      if (tt > t) break;
    }
    return n;
  }

  /* ============================================================
     ۱۱) مدیر نشست 3D — ساخت صحنه/حلقه/پاک‌سازی (تک‌نشست فعال)
     ============================================================ */
  var CTRL = {}; /* پنج کنترلر رشته — بخش‌های بعد */
  function hexCol(c, fb) { try { var n = parseInt(String(c).replace('#', ''), 16); return isFinite(n) ? n : fb } catch (e) { return fb } }
  function modeChip33() { return A.MODE === 'train' ? '🌀 تمرین' : ((A.MATCH && A.MATCH.final) ? '🏁 فینال' : 'کوالیفیکیشن') }

  function play3D(key, el, done) {
    if (!RT.three || RT.broken || !CTRL[key]) return false;
    var T3 = RT.three;
    if (RT.S) { try { RT.S.kill(true) } catch (e) {} RT.S = null }
    var savedLen = 0; try { savedLen = A.TELE.list.length } catch (e0) {}
    injectCss();
    try {
      el.innerHTML = '';
      /* ردیف چیپ‌ها — هم‌سبک mkStage (chip33 موجود در استایل هاب) */
      var chip = document.createElement('div'); chip.className = 'oly3-chiprow';
      chip.innerHTML = (A.MATCH && A.MATCH.final ? '<span class="chip33" style="color:#ffd75e;border-color:rgba(255,215,94,.5)">🏁 فینال</span>' : '') +
        '<span class="chip33">' + modeChip33() + '</span><span class="chip33" id="oly3-score">۰</span>';
      el.appendChild(chip);
      /* ابعاد هم‌اندازه‌ی صحنه‌ی 2D */
      var r = el.getBoundingClientRect();
      var W = Math.round(Math.min(520, (r.width || 340)));
      var H = Math.round(Math.max(240, Math.min(430, (window.innerHeight || 600) * 0.5)));
      var wrap = document.createElement('div'); wrap.className = 'o3d-wrap';
      wrap.style.width = W + 'px'; wrap.style.height = H + 'px';
      el.appendChild(wrap);
      var rend = getRenderer(W, H); if (!rend) throw new Error('no-renderer');
      rend.domElement.style.width = '100%'; rend.domElement.style.height = '100%';
      wrap.appendChild(rend.domElement);
      var scene = new T3.Scene();
      var cam = new T3.PerspectiveCamera(56, W / H, 0.1, 420);
      var gh = ghostPick();
      var S = {
        key: key, el: el, wrap: wrap, W: W, H: H, T3: T3, scene: scene, cam: cam, gh: gh,
        over: false, t0: performance.now(), _l: 0, tick: null, rig: camRig(cam),
        T: function () { return performance.now() - S.t0 },
        finish: function (score) {
          if (S.over) return; S.over = true;
          try { A.tm33(function () { try { S.kill() } catch (e) {} }, 900) } catch (e1) { try { S.kill() } catch (e2) {} }
          try { done(Math.max(0, Math.round(score))) } catch (e3) { try { done(0) } catch (e4) {} }
        },
        kill: function (fast) {
          S.over = true;
          try { disposeScene(S.scene) } catch (e) {}
          try { if (rend.domElement && rend.domElement.parentNode) rend.domElement.parentNode.removeChild(rend.domElement) } catch (e) {}
          if (RT.S === S) RT.S = null;
        },
        hud: null, athlete: null, ghostA: null, Jg: null
      };
      /* HUD */
      S.hud = buildHUD(wrap, {
        modeChip: modeChip33(),
        meter: (key === 'sprint'),
        msg: ''
      });
      /* شبح چیپ — واقعی از olympic_ghost */
      if (gh) { var gchip = document.createElement('span'); gchip.className = 'o3d-chip ghost'; gchip.textContent = '👻 ' + gh.nick + ' • ' + faN(gh.score); chip.appendChild(gchip) }
      /* تغییر اندازه — پاک‌سازی خودکار با CL صحنه */
      try { A.on33(window, 'resize', function () {
        var r2 = S.el.getBoundingClientRect();
        var w2 = Math.round(Math.min(520, (r2.width || S.W)));
        var h2 = Math.round(Math.max(240, Math.min(430, (window.innerHeight || 600) * 0.5)));
        if (w2 > 0 && Math.abs(w2 - S.W) + Math.abs(h2 - S.H) > 8) {
          S.W = w2; S.H = h2; wrap.style.width = w2 + 'px'; wrap.style.height = h2 + 'px';
          rend.setSize(w2, h2, false); cam.aspect = w2 / h2; cam.updateProjectionMatrix();
        }
      }) } catch (eR) {}
      /* کنترلر رشته */
      var ok = CTRL[key](S);
      if (ok === false) throw new Error('ctl');
      RT.S = S;
      /* تک‌حلقه‌ی مرکزی — با بستن صحنه خودتاب (loop33) */
      A.loop33(function () {
        if (S.over) return;
        var now = performance.now();
        var dt = Math.min(50, now - (S._l || now)); S._l = now;
        try { S.tick && S.tick(dt) } catch (eT2) { console.warn('[WD_OLY3D] tick err', (eT2 && eT2.message) || eT2) }
        S.hud && S.hud.tick && S.hud.tick(dt);
        try { rend.render(scene, cam) } catch (eR2) { S.over = true }
      });
      return true;
    } catch (e) {
      try { console.warn('[WD_OLY3D] play3D fallback (' + key + '): ' + ((e && e.message) || e)) } catch (e2) {}
      try { if (RT.S) { RT.S.kill(); RT.S = null } else { el.innerHTML = '' } } catch (e2) {}
      if (RT.broken) return false;
      /* اگر تله‌متری دست‌نخورده است → سقوط امن به موتور 2D نسل ۳ */
      var nowLen = 0; try { nowLen = A.TELE.list.length } catch (e3) {}
      if (nowLen <= savedLen) return false;
      try { done(0) } catch (e4) {}
      return true;
    }
  }

  /* ============================================================
     ۱۲) دو ۱۰۰ متر 3D — استادیوم شب + دوربین تعقیبی + فینال عکس
     تله‌متری: go / fs / p(side) — داور: v3Sprint (بایت‌سازگار)
     ============================================================ */
  CTRL.sprint = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var rngGo = M.rngOf3(seed, 'go');
    var st = { strides: 0, lastSide: -1, gaps: [], lastT: -1, goT: -1, fs: 0, firstT: -1, phase: 'set', goAt: 900 + rngGo() * 1400, dur: 8000, dq: false, dist: 0, tape: false, ph: 0 };
    S.dbg = st; /* QA/harness — وضعیت زنده بدون دستکاری گیم‌پلی */
    makeSky(T3, S.scene, 46, 230);
    /* پیست — در جهت Z، فینیش در Z=-100 */
    var track = new T3.Mesh(new T3.PlaneGeometry(9, 108), lamb(T3, 0x9c3d52, true));
    track.rotation.x = -Math.PI / 2; track.position.set(0, 0, -49); S.scene.add(track);
    var infield = new T3.Mesh(new T3.PlaneGeometry(90, 130), lamb(T3, 0x14522e, true));
    infield.rotation.x = -Math.PI / 2; infield.position.set(0, -0.02, -49); S.scene.add(infield);
    /* خط‌های لاین */
    var lineMat = lamb(T3, 0xf2f4f8, false);
    [-3.75, -1.25, 1.25, 3.75].forEach(function (x) {
      var ln = new T3.Mesh(new T3.PlaneGeometry(0.09, 108), lineMat);
      ln.rotation.x = -Math.PI / 2; ln.position.set(x, 0.005, -49); S.scene.add(ln);
    });
    for (var m = 10; m <= 90; m += 10) {
      var mk = new T3.Mesh(new T3.PlaneGeometry(7.6, 0.12), lineMat);
      mk.rotation.x = -Math.PI / 2; mk.position.set(0, 0.006, -m); S.scene.add(mk);
    }
    /* خط استارت و فینیش + نوار پایان */
    var startL = new T3.Mesh(new T3.PlaneGeometry(7.6, 0.16), lamb(T3, 0xffffff, false));
    startL.rotation.x = -Math.PI / 2; startL.position.set(0, 0.007, 0); S.scene.add(startL);
    var finL = new T3.Mesh(new T3.PlaneGeometry(7.6, 0.3), lamb(T3, 0xffd75e, false));
    finL.rotation.x = -Math.PI / 2; finL.position.set(0, 0.008, -100); S.scene.add(finL);
    var poleM = lamb(T3, 0xe8ecf4, false);
    [-3.6, 3.6].forEach(function (x) { var p = cyl(T3, 0.05, 0.05, 2.6, 6, poleM); p.position.set(x, 1.3, -100); S.scene.add(p) });
    var tape = new T3.Mesh(new T3.PlaneGeometry(7.2, 0.16), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    tape.position.set(0, 1.15, -100); S.scene.add(tape); st.tapeM = tape;
    /* سکوها + تماشاگر (فقط سمت دور — دوربین سمت باز) */
    var standFar = box(T3, 1.6, 1.7, 104, lamb(T3, 0x14213c, true)); standFar.position.set(-7.2, 0.85, -49); S.scene.add(standFar);
    /* تماشاگر واقعی در راستای Z */
    (function () {
      var n = RT.LOW ? 130 : 300;
      var geo = new T3.BoxGeometry(0.34, 0.42, 0.3);
      var mat = new T3.MeshLambertMaterial({ color: 0xffffff });
      var inst = new T3.InstancedMesh(geo, mat, n);
      var dummy = new T3.Object3D(), col = new T3.Color();
      var pal = [0xff6b8f, 0x7fd8ff, 0xffd75e, 0x8f7dff, 0x7dffb0, 0xffb02e, 0xf6f7fb];
      for (var i = 0; i < n; i++) {
        dummy.position.set(-7.2 + (Math.random() - 0.5) * 1.4, 1.15 + Math.floor(Math.random() * 3) * 0.52, -4 - Math.random() * 98);
        dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
        col.setHex(pal[(Math.random() * pal.length) | 0]); inst.setColorAt(i, col);
      }
      inst.instanceMatrix.needsUpdate = true; S.scene.add(inst);
    })();
    /* استاند پشت فینیش + بنر */
    var standEnd = box(T3, 14, 1.9, 1.6, lamb(T3, 0x14213c, true)); standEnd.position.set(0, 0.95, -107); S.scene.add(standEnd);
    var banner = new T3.Mesh(new T3.PlaneGeometry(10, 1.5), new T3.MeshBasicMaterial({ color: 0x0a1730 }));
    banner.position.set(0, 2.6, -106.8); S.scene.add(banner);
    /* دکل‌های نور */
    [[-8, 6], [8, 6], [-8, -104], [8, -104]].forEach(function (pp) {
      var pole = cyl(T3, 0.09, 0.12, 9, 6, lamb(T3, 0x39445c, true)); pole.position.set(pp[0], 4.5, pp[1]); S.scene.add(pole);
      var head = box(T3, 1.6, 0.5, 0.3, new T3.MeshBasicMaterial({ color: 0xfff6d8 })); head.position.set(pp[0], 9.1, pp[1]); S.scene.add(head);
    });
    makeFlag(T3, S.scene, -6, 0, -8, hexCol('33ff9e', 0x33ff9e));
    makeFlag(T3, S.scene, -6, 0, -92, hexCol('#ffd75e', 0xffd75e));
    /* ورزشکار + شبح واقعی */
    var colHex = (window.GD33 && window.GD33.sprint) ? window.GD33.sprint.col : '#ff4d6d';
    var ath = buildAthlete(T3, { jersey: hexCol(colHex, 0xff4d6d), shorts: 0x14284e, seedN: 3 });
    S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    var ghA = null, Jg = null;
    if (S.gh) {
      ghA = buildAthlete(T3, { jersey: 0xffd34d, shorts: 0x3a2c00, seedN: 1 });
      ghA.position.x = 2.5; S.scene.add(ghA); S.ghostA = ghA; Jg = ghA.userData.J;
    }
    /* بلوک استارت */
    var blk = box(T3, 0.5, 0.12, 0.5, lamb(T3, 0x2a3a5e, false)); blk.position.set(0, 0.06, 0.6); S.scene.add(blk);
    /* لایه‌های لمس چپ/راست */
    var tapL = document.createElement('div'); tapL.className = 'o3d-tap l'; S.hud.hud.appendChild(tapL);
    var tapR = document.createElement('div'); tapR.className = 'o3d-tap r'; S.hud.hud.appendChild(tapR);
    var tapGlowL = 0, tapGlowR = 0;
    S.hud.say('در «مرد آماده» دست نگه دار؛ بعد از شلیک یک‌درمیان چپ/راست بزن!');
    bindInput(S.wrap, {
      down: function (x, y, W) {
        if (S.over) return;
        var side = x < W / 2 ? 0 : 1;
        if (st.phase === 'set') {
          st.fs++; TE('fs', S.T(), st.fs); S.rig.shake(0.09); sfx('alert');
          if (st.fs >= 2) { st.dq = true; S.hud.say('❗ اخراج — دو شروع زودهنگام'); S.hud.flash('#ff3344', 0.4) }
          else S.hud.say('⚠️ شروع زودهنگام! یک بار دیگر = اخراج');
          return;
        }
        if (st.phase !== 'run') return;
        var t = S.T();
        if (side === st.lastSide) { S.rig.shake(0.05); return }
        if (st.lastT < 0) { st.firstT = t; TE('p', t, side) }
        else if (t - st.lastT >= 150) { TE('p', t, side); st.gaps.push(t - st.lastT) }
        else return;
        st.lastSide = side; st.lastT = t; st.strides++;
        st.dist = Math.min(100, st.strides * 1.9);
        st.ph += Math.PI;
        sfx('click');
        if (side === 0) tapGlowL = 1; else tapGlowR = 1;
        if (st.dist >= 100 && !st.tape) { st.tape = true; S.hud.flash('#7dff9e', 0.28); sfx('cheer') }
      }
    });
    S.tick = function (dt) {
      var t = S.T();
      if (st.phase === 'set' && t >= st.goAt) {
        st.phase = 'run'; st.goT = t; TE('go', st.goT);
        S.hud.flash('#ffffff', 0.3); sfx('stamp');
        S.hud.say('⚡ بدو! یک‌درمیان چپ/راست');
      }
      var gz = 0, az = -st.dist;
      if (st.phase === 'run') {
        var stepK = clamp((t - (st.lastT || t)) / 150, 0, 1);
        runPose(J, st.ph + stepK * Math.PI, 1, 0.2);
        ath.position.set(0, 0, az);
        if (ghA) {
          var gs = ghostStepsAt(S.gh, t - st.goT, true);
          gz = -Math.min(100, gs * 1.9);
          runPose(Jg, st.ph * 0.96 + Math.PI / 2, 1, 0.2);
          ghA.position.set(2.5, 0, gz);
        }
      } else {
        /* مرد آماده — خم блок */
        dmp(J.legL.g, 'x', 0.55, 10, 10); dmp(J.legR.g, 'x', -0.5, 10, 10);
        dmp(J.legL.knee, 'x', 1.1, 10, 10); dmp(J.legR.knee, 'x', 0.4, 10, 10);
        dmp(J.armL.g, 'x', -0.9, 10, 10); dmp(J.armR.g, 'x', -0.9, 10, 10);
        dmp(J.spine, 'x', 0.75, 10, 10); J.hips.position.y = 0.68;
        ath.position.set(0, 0, 0.35);
        if (ghA) { idlePose(Jg, t); ghA.position.set(2.5, 0, 0.35) }
      }
      if (st.dq && t >= 1800) { /* DQ تمیز — سرور پرچم dq_false_start برمی‌گرداند */
        defeatPose(J); S.finish(0); return;
      }
      /* دوربین: معرفی → نمای نزدیک آماده → تعقیب جانبی → فینیش */
      var rz = az;
      if (st.phase === 'set') S.rig.go(2.6, 1.6, 3.4, 0, 1.05, 0.2, dt, 2.6);
      else if (rz > -88) S.rig.go(6.4, 2.0, rz + 2.6, 0, 1.05, rz - 2.5, dt, 5.2);
      else S.rig.go(3.4, 1.4, -95.5, 0, 1.1, -100, dt, 4.2);
      S.rig.tickShake(dt);
      if (S.hud.meter) {
        var mean = 0, i; for (i = 0; i < st.gaps.length; i++) mean += st.gaps[i];
        mean = st.gaps.length ? mean / st.gaps.length : 0;
        var vs = 0; for (i = 0; i < st.gaps.length; i++) vs += (st.gaps[i] - mean) * (st.gaps[i] - mean);
        var sd = st.gaps.length > 1 ? Math.sqrt(vs / st.gaps.length) : 0;
        var rh = clamp(1 - sd / 160, 0, 1);
        S.hud.meter.set(st.phase === 'set' ? 1 : rh, rh > 0.75 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : rh > 0.4 ? 'linear-gradient(90deg,#ffd75e,#ffb02e)' : 'linear-gradient(90deg,#ff8a9d,#ff4d6d)');
      }
      tapGlowL = Math.max(0, tapGlowL - dt / 260); tapGlowR = Math.max(0, tapGlowR - dt / 260);
      tapL.style.opacity = tapGlowL * 0.9; tapR.style.opacity = tapGlowR * 0.9;
      /* پایان زمان */
      if (st.phase === 'run' && t - st.goT >= st.dur) {
        st.phase = 'end';
        var dist = Math.min(100, st.strides * 1.9);
        var rt = st.firstT > 0 && st.goT > 0 ? st.firstT - st.goT : 0;
        var rtp = rt <= 180 ? 100 : rt <= 250 ? 80 : rt <= 350 ? 60 : rt <= 500 ? 35 : 15;
        var mean = 0, i; for (i = 0; i < st.gaps.length; i++) mean += st.gaps[i]; mean = st.gaps.length ? mean / st.gaps.length : 0;
        var vs = 0; for (i = 0; i < st.gaps.length; i++) vs += (st.gaps[i] - mean) * (st.gaps[i] - mean);
        var sd = st.gaps.length > 1 ? Math.sqrt(vs / st.gaps.length) : 0;
        var rhythm = clamp(1 - sd / 160, 0, 1);
        var score = Math.round(dist * 7.5) + rtp + Math.round(rhythm * 180);
        if (dist >= 100) victoryPose(J); else if (dist < 55) defeatPose(J);
        var rows = '<div class="r me"><span>🏃 تو</span><span>' + faN(Math.round(dist)) + ' متر • واکنش ' + faN(rt) + 'ms</span><b>' + faN(score) + '</b></div>';
        if (S.gh) {
          var gd = Math.min(100, ghostStepsAt(S.gh, st.dur, true) * 1.9);
          rows += '<div class="r gh"><span>👻 ' + S.gh.nick + '</span><span>' + faN(Math.round(gd)) + ' متر • ' + faN(S.gh.score) + '</span><b>' + faN(S.gh.score) + '</b></div>';
        }
        S.hud.photo(rows);
        sfx(dist >= 100 ? 'cheer' : 'click');
        S.finish(score);
      }
    };
    return true;
  };

  /* ============================================================
     ۱۳) شنا 3D — استخر ۲۵م + آب زنده + چرخش دیوار
     تله‌متری: p(side) / turn(q) — داور: v3Swim (بایت‌سازگار)
     ============================================================ */
  CTRL.swim = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed) return false;
    var st = { n: 0, lastSide: -1, gaps: [], lastT: -1, turns: [], dur: 10000, dist: 0, turnOpen: -1, ph: 0 };
    S.dbg = st;
    makeSky(T3, S.scene, 34, 150);
    /* کاسه‌ی استخر */
    var deck = new T3.Mesh(new T3.PlaneGeometry(60, 34), lamb(T3, 0x9fb6d4, true));
    deck.rotation.x = -Math.PI / 2; deck.position.y = -0.06; S.scene.add(deck);
    var waterGeo = new T3.PlaneGeometry(30, 10, 26, 10);
    var water = new T3.Mesh(waterGeo, new T3.MeshPhongMaterial({ color: 0x1e8fd8, transparent: true, opacity: 0.86, shininess: 110, specular: 0x9fd8ff, flatShading: true }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.02; S.scene.add(water); st.water = water;
    var wpos = waterGeo.attributes.position;
    /* دیوارها + پد قرمز */
    [-15.2, 15.2].forEach(function (x) {
      var wall = box(T3, 0.4, 0.5, 10.4, lamb(T3, 0xdfeefc, true)); wall.position.set(x, 0.2, 0); S.scene.add(wall);
      var pad = box(T3, 0.12, 0.4, 2.2, lamb(T3, 0xe83a4a, false)); pad.position.set(x + (x < 0 ? 0.27 : -0.27), 0.18, 0); S.scene.add(pad);
    });
    /* خط‌های لاین (شناور) */
    var ropeMat = lamb(T3, 0xffd75e, false);
    [-3.6, -1.8, 1.8, 3.6].forEach(function (z) {
      var rope = box(T3, 29.6, 0.07, 0.07, ropeMat); rope.position.set(0, 0.05, z); S.scene.add(rope);
    });
    /* تماشاگر سمت دور */
    var stand = box(T3, 30, 1.6, 1.4, lamb(T3, 0x14213c, true)); stand.position.set(0, 0.8, -8.5); S.scene.add(stand);
    var inst = (function () {
      var n = RT.LOW ? 90 : 200;
      var geo = new T3.BoxGeometry(0.32, 0.4, 0.28);
      var mat = new T3.MeshLambertMaterial({ color: 0xffffff });
      var im = new T3.InstancedMesh(geo, mat, n);
      var dummy = new T3.Object3D(), col = new T3.Color();
      var pal = [0xff6b8f, 0x7fd8ff, 0xffd75e, 0x8f7dff, 0xf6f7fb];
      for (var i = 0; i < n; i++) {
        dummy.position.set(-14.5 + Math.random() * 29, 1.15 + Math.floor(Math.random() * 2) * 0.55, -8.5 + (Math.random() - 0.5) * 1.2);
        dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
        col.setHex(pal[(Math.random() * pal.length) | 0]); im.setColorAt(i, col);
      }
      im.instanceMatrix.needsUpdate = true; S.scene.add(im); return im;
    })();
    /* شنای حرفه‌ای + شبح */
    var colHex = (window.GD33 && window.GD33.swim) ? window.GD33.swim.col : '#2bb8ff';
    var ath = buildAthlete(T3, { jersey: hexCol(colHex, 0x2bb8ff), shorts: 0x14284e, seedN: 2 });
    ath.rotation.x = -Math.PI / 2; /* خوابیده روی آب */
    ath.userData.J.shadow.visible = false;
    S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    var ghA = null, Jg = null;
    if (S.gh) {
      ghA = buildAthlete(T3, { jersey: 0xffd34d, shorts: 0x3a2c00, seedN: 1 });
      ghA.rotation.x = -Math.PI / 2; ghA.userData.J.shadow.visible = false;
      ghA.position.z = 2.7; S.scene.add(ghA); S.ghostA = ghA; Jg = ghA.userData.J;
    }
    /* دکمه‌ی چرخش */
    var turnBtn = S.hud.button('🔄 بچرخ!', 'calc(50% - 62px)', 'hot');
    turnBtn.style.display = 'none';
    turnBtn.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); e.preventDefault();
      if (st.turnOpen > 0 && !S.over) doTurn();
    }, { passive: false });
    function doTurn() {
      var t = S.T();
      var q = clamp(1 - Math.abs(t - st.turnOpen) / 700, 0, 1);
      TE('turn', t, q); st.turns.push(q);
      S.hud.flash('#7dff9e', 0.18); sfx(q > 0.7 ? 'coin' : 'click');
      S.hud.say('چرخش ' + faN(Math.round(q * 100)) + '٪');
      st.turnOpen = -1; turnBtn.style.display = 'none';
    }
    S.hud.say('یکی‌درمیان چپ/راست! روی دیوار ۲۵م، دکمه‌ی چرخش را به‌موقع بزن');
    bindInput(S.wrap, {
      down: function (x, y, W, H) {
        if (S.over) return;
        var t = S.T();
        if (st.turnOpen > 0 && y > S.H * 0.66) { doTurn(); return }
        var side = x < W / 2 ? 0 : 1;
        if (side === st.lastSide) { S.rig.shake(0.04); return }
        if (st.lastT >= 0 && t - st.lastT < 140) return;
        if (st.lastT >= 0) st.gaps.push(t - st.lastT);
        TE('p', t, side); /* تله‌متری ضربه — داور v3Swim */
        st.lastSide = side; st.lastT = t; st.n++;
        st.dist = Math.min(100, st.n * 1.55);
        st.ph += Math.PI;
        sfx('click');
        var wall = [16, 32, 48][st.turns.length];
        if (st.turns.length < 3 && st.n === wall) {
          st.turnOpen = t; turnBtn.style.display = 'block';
          S.hud.say('دیوار ' + faN(25 * (st.turns.length + 1)) + ' متر — بچرخ!');
        }
      }
    });
    S.tick = function (dt) {
      var t = S.T();
      /* موج آب — CPU سبک (۲۹۷ رأس) */
      var tm = t / 1000;
      for (var vi = 0; vi < wpos.count; vi++) {
        var vx = wpos.getX(vi), vy = wpos.getY(vi);
        wpos.setZ(vi, Math.sin(vx * 0.9 + tm * 2.2) * 0.055 + Math.sin(vy * 1.4 + tm * 2.9) * 0.04);
      }
      wpos.needsUpdate = true;
      /* موقعیت لاین‌به‌لاین (۴×۲۵م) */
      var lap = Math.floor(st.dist / 25), inLap = st.dist - lap * 25;
      var dir = (lap % 2 === 0) ? 1 : -1;
      var sx = dir === 1 ? (-12.5 + inLap) : (12.5 - inLap);
      var sd = dir;
      ath.position.set(sx, 0.32, 0);
      dmp(ath, 'y', sd === 1 ? -Math.PI / 2 : Math.PI / 2, 10, 6);
      if (st.lastT >= 0) {
        var stepK = clamp((t - st.lastT) / 140, 0, 1);
        var ph = st.ph + stepK * Math.PI;
        var sA = Math.sin(ph), cA = Math.sin(ph + Math.PI);
        dmp(J.armL.g, 'x', -2.4 + sA * 2.1, 16, 26); dmp(J.armR.g, 'x', -2.4 + cA * 2.1, 16, 26);
        dmp(J.armL.knee, 'x', -0.4, 14, 20); dmp(J.armR.knee, 'x', -0.4, 14, 20);
        dmp(J.legL.g, 'x', Math.sin(ph * 2) * 0.35, 20, 26); dmp(J.legR.g, 'x', -Math.sin(ph * 2) * 0.35, 20, 26);
        dmp(J.legL.knee, 'x', 0.2, 20, 26); dmp(J.legR.knee, 'x', 0.2, 20, 26);
        J.hips.position.y = 0.92;
      } else idle3(J, t);
      if (ghA) {
        var gs = ghostStepsAt(S.gh, t, false);
        var gd = Math.min(100, gs * 1.55);
        var glap = Math.floor(gd / 25), gIn = gd - glap * 25, gdir = (glap % 2 === 0) ? 1 : -1;
        var gx = gdir === 1 ? (-12.5 + gIn) : (12.5 - gIn);
        ghA.position.set(gx, 0.32, 2.7);
        dmp(ghA, 'y', gdir === 1 ? -Math.PI / 2 : Math.PI / 2, 10, 6);
        dmp(Jg.armL.g, 'x', -2.4 + Math.sin(t / 240) * 2.0, 14, 22);
        dmp(Jg.armR.g, 'x', -2.4 - Math.sin(t / 240) * 2.0, 14, 22);
      }
      if (st.turnOpen > 0 && t - st.turnOpen > 700) { st.turnOpen = -1; turnBtn.style.display = 'none' }
      /* دوربین جانبی تعقیبی */
      S.rig.go(sx * 0.72, st.turnOpen > 0 ? 1.5 : 3.1, 7.2, sx, 0.4, 0, dt, 4.4);
      S.rig.tickShake(dt);
      /* پایان */
      if (t >= st.dur) {
        var dist = Math.min(100, st.n * 1.55);
        var mean = 0, i; for (i = 0; i < st.gaps.length; i++) mean += st.gaps[i]; mean = st.gaps.length ? mean / st.gaps.length : 0;
        var vs = 0; for (i = 0; i < st.gaps.length; i++) vs += (st.gaps[i] - mean) * (st.gaps[i] - mean);
        var sdv = st.gaps.length > 1 ? Math.sqrt(vs / st.gaps.length) : 0;
        var rhythm = clamp(1 - sdv / 170, 0, 1);
        var tPts = 0; for (i = 0; i < st.turns.length; i++) tPts += Math.round(st.turns[i] * 27);
        var score = Math.round(dist * 7) + Math.round(rhythm * 200) + Math.min(81, tPts);
        if (dist >= 88) victoryPose(J); else if (dist < 45) defeatPose(J);
        var rows = '<div class="r me"><span>🏊 تو</span><span>' + faN(Math.round(dist)) + ' متر • ' + faN(st.n) + ' ضربه • ' + faN(st.turns.length) + ' چرخش</span><b>' + faN(score) + '</b></div>';
        if (S.gh) {
          var gdf = Math.min(100, ghostStepsAt(S.gh, st.dur, false) * 1.55);
          rows += '<div class="r gh"><span>👻 ' + S.gh.nick + '</span><span>' + faN(Math.round(gdf)) + ' متر</span><b>' + faN(S.gh.score) + '</b></div>';
        }
        S.hud.photo(rows);
        S.finish(score);
      }
    };
    function idle3(J, t) { idlePose(J, t) }
    return true;
  };

  /* ============================================================
     ۱۴) تیراندازی با کمان 3D — نوسان قطعی میرور + کنترل نفس
     تله‌متری: draw(i) / shot(ring) — داور: v3Archery (بایت‌سازگار)
     گارد 250ms بین شوت‌ها (جلوگیری از impossible_rate — بدون
     تغییر سقف امتیاز؛ همان物理 میرور archRing3)
     ============================================================ */
  CTRL.archery = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var st = { shot: 0, drawT: -1, hold0: 0, pts: 0, rings: [], done: false, lastShot: -1 };
    S.dbg = st;
    makeSky(T3, S.scene, 30, 130);
    /* چمن + خط‌های فاصله */
    var grass = new T3.Mesh(new T3.PlaneGeometry(80, 120), lamb(T3, 0x1d5c33, true));
    grass.rotation.x = -Math.PI / 2; grass.position.z = -30; S.scene.add(grass);
    var lineMat = lamb(T3, 0xf2f4f8, false);
    [10, 30, 50, 70].forEach(function (d) {
      var ln = new T3.Mesh(new T3.PlaneGeometry(6, 0.14), lineMat);
      ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.006, -d); S.scene.add(ln);
    });
    /* هدف استاندارد — ۵ حلقه‌ی واقعی (سفید/سیاه/آبی/قرمز/طلایی) */
    var tgtZ = -70, ringCols = [0xf6f7fb, 0x1c2030, 0x2a7de8, 0xe83a4a, 0xffd34d];
    var tgt = new T3.Group(); tgt.position.set(0, 1.32, tgtZ);
    var radii = [0.61, 0.49, 0.37, 0.25, 0.125];
    for (var ri = 0; ri < 5; ri++) {
      var disc = cyl(T3, radii[ri], radii[ri], 0.045, 26, lamb(T3, ringCols[ri], false));
      disc.rotation.x = Math.PI / 2; disc.position.z = ri * 0.012;
      tgt.add(disc);
    }
    var legMat = lamb(T3, 0x6b4b2a, true);
    [-0.5, 0.5].forEach(function (x) { var leg = cyl(T3, 0.045, 0.06, 1.35, 6, legMat); leg.position.set(x, -0.65, 0.06); leg.rotation.z = x > 0 ? -0.12 : 0.12; tgt.add(leg) });
    S.scene.add(tgt);
    /* بادبان باد (نمایش واقعی باد میرور) */
    var windFlag = makeFlag(T3, S.scene, 3.4, 0, -35, 0xffd75e);
    /* ردیف درخت low-poly دور */
    for (var ti = 0; ti < (RT.LOW ? 8 : 16); ti++) {
      var ang = (ti / 16) * TAU;
      var trunk = cyl(T3, 0.12, 0.16, 1.2, 5, legMat); trunk.position.set(Math.cos(ang) * 38, 0.6, -30 + Math.sin(ang) * 45); S.scene.add(trunk);
      var crown = sph(T3, 1.3 + Math.random() * 0.5, lamb(T3, 0x2a7a44, true), 7); crown.position.set(trunk.position.x, 1.9, trunk.position.z); S.scene.add(crown);
    }
    /* تیرانداز + کمان */
    var colHex = (window.GD33 && window.GD33.archery) ? window.GD33.archery.col : '#ffb02e';
    var ath = buildAthlete(T3, { jersey: hexCol(colHex, 0xffb02e), shorts: 0x14284e, seedN: 4 });
    S.scene.add(ath); S.athlete = ath;
    var J = ath.userData.J;
    /* کمان: قوس + زه */
    var bowMat = lamb(T3, 0x8a5a2b, false);
    var bow = new T3.Group();
    var arc = new T3.Mesh(new T3.TorusGeometry(0.52, 0.022, 6, 18, Math.PI), bowMat);
    arc.rotation.z = Math.PI / 2; bow.add(arc);
    var stringM = new T3.Mesh(new T3.PlaneGeometry(0.012, 1.02), new T3.MeshBasicMaterial({ color: 0xf2f4f8, side: T3.DoubleSide }));
    bow.add(stringM); st.stringM = stringM;
    bow.position.set(0.34, 1.28, -0.28); ath.add(bow); st.bow = bow;
    var arrow = cyl(T3, 0.012, 0.012, 0.72, 5, lamb(T3, 0xd8b25a, false));
    arrow.rotation.x = Math.PI / 2; arrow.position.set(0.34, 1.28, -0.6); ath.add(arrow); st.arrowM = arrow;
    /* تیرهای خورده‌شده در هدف */
    var stuck = [];
    S.hud.say('برای کشیدن کمان دست نگه دار؛ در مرکز رها کن — صبر زیاد = خستگی!');
    var holdPct = 0;
    bindInput(S.wrap, {
      down: function () {
        if (S.over || st.done || st.drawT >= 0) return;
        var t = S.T();
        if (st.lastShot > 0 && t - st.lastShot < 250) return; /* گارد گپ داور */
        st.drawT = t; TE('draw', t, st.shot); sfx('click');
        S.hud.say('نفس را حبس کن… در مرکز رها کن');
      },
      up: function () {
        if (S.over || st.done || st.drawT < 0) return;
        var t = S.T(), hold = t - st.drawT;
        var m = M.archRing3(seed, st.shot, t, hold);
        var sw0 = swayOf(seed, st.shot, 0);
        TE('shot', t, m.ring);
        st.rings.push(m.ring); st.pts += m.ring * 20; st.lastShot = t;
        S.hud.setScore(st.pts);
        S.hud.flash(m.ring >= 9 ? '#7dff9e' : '#ffffff', m.ring >= 9 ? 0.22 : 0.12);
        sfx(m.ring >= 9 ? 'coin' : m.ring >= 5 ? 'click' : 'alert');
        st.flight = { t0: t, from: new T3.Vector3(ath.position.x + 0.34, 1.28, ath.position.z - 0.7), to: new T3.Vector3(m.off * 0.9, 1.32 + (Math.sin(t / 700) * 0.12) * (1 - m.ring / 10) * 1.4, tgtZ + 0.1), ring: m.ring };
        var fly = cyl(T3, 0.012, 0.012, 0.72, 5, lamb(T3, 0xd8b25a, false));
        fly.rotation.x = Math.PI / 2; S.scene.add(fly); st.fly = fly;
        st.drawT = -1; st.shot++;
        if (st.shot >= 5) {
          st.done = true;
          var all9 = true; for (var i = 0; i < 5; i++) if (st.rings[i] < 9) all9 = false;
          var score = st.pts + (all9 ? 60 : 0);
          if (all9) { victoryPose(J); sfx('cheer') } else if (st.pts < 300) defeatPose(J);
          var rows = '<div class="r me"><span>🏹 حلقه‌ها</span><span>' + st.rings.map(function (rv) { return faN(rv) }).join(' • ') + '</span><b>' + faN(score) + '</b></div>';
          S.hud.photo(rows);
          S.finish(score);
        } else {
          var w = sw0.wind;
          S.hud.say('تیر ' + faN(st.shot + 1) + ' از ۵ — باد: ' + (w > 0.3 ? '→→' : w > 0.1 ? '→' : w < -0.3 ? '←←' : w < -0.1 ? '←' : 'آرام'));
        }
      }
    });
    var camPos = new T3.Vector3();
    S.tick = function (dt) {
      var t = S.T();
      /* نوسان میرور — نشانگر واقعی */
      var hold = st.drawT >= 0 ? t - st.drawT : 0;
      var sw = swayOf(seed, st.shot, t);
      var amp = (function (h) { var a = 1.0 - Math.min(1, h / 2200) * 0.55; if (h > 2600) a += Math.min(0.8, (h - 2600) / 1000 * 0.18); return a })(hold);
      var aimX = sw.off * amp, aimY = Math.sin(t / 700) * 0.12 * amp;
      /* پوز تیرانداز */
      idlePose(J, t);
      var drawn = st.drawT >= 0 ? clamp(hold / 700, 0, 1) : 0;
      dmp(J.armR.g, 'x', -1.45, 10, 10); dmp(J.armR.knee, 'x', -0.1, 10, 10); /* دست کمان کشیده به جلو */
      dmp(J.armL.g, 'x', -1.1 - drawn * 0.25, 10, 10); dmp(J.armL.knee, 'x', -1.5 * drawn - 0.3, 10, 10); /* دست زه */
      dmp(J.spine, 'y', aimX * 0.22, 8, 8); dmp(J.neck, 'x', 0.05, 8, 8);
      /* کمان/تیر/زه */
      bow.position.x = 0.34 + aimX * 0.1; bow.position.y = 1.28 + aimY * 0.08;
      arrow.position.x = bow.position.x; arrow.position.y = bow.position.y;
      stringM.rotation.z = drawn * 0.18; stringM.scale.y = 1 - drawn * 0.12;
      arrow.position.z = -0.6 - drawn * 0.22;
      /* پرواز تیر */
      if (st.fly && st.flight) {
        var k = clamp((t - st.flight.t0) / 620, 0, 1);
        st.fly.position.lerpVectors(st.flight.from, st.flight.to, k);
        st.fly.position.y += Math.sin(k * Math.PI) * 0.5;
        if (k >= 1) {
          st.stuckMesh = st.fly; /* تیر گیر‌کرده در هدف — می‌ماند (dispose با صحنه) */
          st.stuckMesh.position.copy(st.flight.to); st.stuckMesh.rotation.x = Math.PI / 2;
          stuck.push(st.stuckMesh);
          st.fly = null; st.flight = null;
          S.hud.flash('#ffd75e', 0.14); S.rig.shake(0.02);
        }
      }
      /* بادبان */
      windFlag.rotation.y = Math.sin(t / 900) * 0.3 + sw.wind * 0.5;
      /* دوربین: پشت‌شانه هنگام نشانه‌گیری */
      var zoomK = st.drawT >= 0 ? 1 : 0;
      camPos.set(1.5 - zoomK * 0.55, 1.72 + aimY * 0.05, 2.6 - zoomK * 0.7);
      S.rig.go(camPos.x, camPos.y, camPos.z, aimX * 2.4, 1.3 + aimY * 1.6, tgtZ, dt, 5);
      S.rig.tickShake(dt);
      /* متر ثبات */
      if (S.hud.meter) {
        var q = st.drawT >= 0 ? clamp(1 - Math.abs(sw.off) * amp, 0, 1) : 0;
        S.hud.meter.set(q, q > 0.85 ? 'linear-gradient(90deg,#3ee86e,#7dff9e)' : q > 0.5 ? 'linear-gradient(90deg,#ffd75e,#ffb02e)' : 'linear-gradient(90deg,#ff8a9d,#ff4d6d)');
        if (st.drawT >= 0 && hold > 2600) S.hud.say('خسته شدی — رها کن!');
        else if (st.drawT >= 0) S.hud.say('ثبات: ' + faN(Math.round(q * 100)) + '٪');
      }
    };
    return true;
  };

  /* ============================================================
     ۱۵) رالی 3D — جاده‌ی پیچ‌دار + فرمان زنده + ۶ دروازه
     تله‌متری: corner(t,0,q) — داور: v3Rally (بایت‌سازگار)
     aS تجمعی: aS += 1500+rng('ral:'+i)*700 از 800 — پنجره‌ی مجاز سرور
     [aS-350, aS+900] → ثبت در لحظه‌ی عبور از دروازه (aS)
     ideal = sin((i+1)*2.1) → q = clamp(1-|steer-0.4·sin|/0.6,0,1)
     ============================================================ */
  CTRL.rally = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var corners = [];
    /* V92: aS تجمعی — بایت‌سازگار با داور جدید (olyScore.v3Rally) — گپ مجاورها ۱۵۰۰..۲۲۰۰ms */
    var aSAcc = 800;
    for (var i = 0; i < 6; i++) { aSAcc += 1500 + M.rngOf3(seed, 'ral:' + i)() * 700; corners.push(aSAcc) }
    var st = { i: 0, pts: 0, steer: 0, steerT: 0, touching: false, tPx: 0.5 };
    S.dbg = st;
    var V = 12; /* سرعت ثابت m/s — زمان = مسافت/V */
    makeSky(T3, S.scene, 40, 200);
    /* زمین */
    var ground = new T3.Mesh(new T3.PlaneGeometry(120, 340), lamb(T3, 0x27402a, true));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -140); S.scene.add(ground);
    /* جاده — نواری با انحنای پیچ‌ها (bend = sin((i+1)*2.1)) */
    var roadMat = lamb(T3, 0x3c4148, true);
    var segs = 130, roadLen = 175, segLen = roadLen / segs;
    var bendAt = function (tMs) { /* انحنای مرکز جاده در زمان t */
      var b = 0;
      for (var ci = 0; ci < 6; ci++) {
        var d = (tMs - corners[ci]) / 1000 * V;
        var w = Math.exp(-Math.pow(d / 14, 2));
        b += Math.sin((ci + 1) * 2.1) * w * 3.4;
      }
      return b;
    };
    var roadGeo = new T3.PlaneGeometry(7.2, roadLen, 1, segs);
    var road = new T3.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    var rp = roadGeo.attributes.position;
    for (var si = 0; si < rp.count; si++) {
      var zz = rp.getY(si); /* بعد از چرخش، Y صفحه → Z جهان */
      var tMs = (zz + roadLen / 2) / V * 1000; /* نگاشت صحیح: local +Y → world -Z */
      rp.setX(si, bendAt(tMs));
    }
    rp.needsUpdate = true;
    road.position.set(0, 0, 2 - roadLen / 2); S.scene.add(road);
    /* خطوط کنار جاده */
    var edgeMat = lamb(T3, 0xf2f4f8, false);
    for (var ei = 0; ei < 24; ei++) {
      var tt = ei * (roadLen / 24);
      var tMsE = (tt / V) * 1000;
      var bx = bendAt(tMsE);
      [-3.8, 3.8].forEach(function (ex) {
        var dash = box(T3, 0.16, 0.02, 3, edgeMat);
        dash.position.set(bx + ex, 0.012, 2 - tt); S.scene.add(dash);
      });
    }
    /* دروازه‌های پیچ + مخروط‌ها */
    var gateMat = new T3.MeshBasicMaterial({ color: 0xffd75e });
    var gates = [], cones = [];
    for (var gi = 0; gi < 6; gi++) {
      var gz = 2 - V * (corners[gi] / 1000);
      var gx = bendAt(corners[gi]);
      var gate = new T3.Mesh(new T3.BoxGeometry(6.4, 2.2, 0.1), gateMat.clone());
      gate.material.transparent = true; gate.material.opacity = 0.32;
      gate.position.set(gx, 1.1, gz); S.scene.add(gate); gates.push(gate);
      var nCon = RT.LOW ? 3 : 5;
      for (var ci2 = 0; ci2 < nCon; ci2++) {
        var cone = cyl(T3, 0.02, 0.16, 0.34, 6, lamb(T3, 0xff7a2e, false));
        var side = (ci2 % 2 === 0) ? -1 : 1;
        cone.position.set(gx + side * (3.2 + Math.floor(ci2 / 2) * 0.7), 0.17, gz + (ci2 - 2) * 0.9);
        S.scene.add(cone); cones.push(cone);
      }
    }
    /* ماشین low-poly */
    var car = new T3.Group();
    var body = box(T3, 1.15, 0.34, 2.1, lamb(T3, 0xff9d3c, true)); body.position.y = 0.34; car.add(body);
    var cabin = box(T3, 0.85, 0.3, 0.9, lamb(T3, 0x18243e, true)); cabin.position.set(0, 0.62, -0.1); car.add(cabin);
    var spoil = box(T3, 1.05, 0.05, 0.3, lamb(T3, 0x18243e, true)); spoil.position.set(0, 0.66, 0.95); car.add(spoil);
    var wheels = [];
    [[-0.56, 0.72], [0.56, 0.72], [-0.56, -0.72], [0.56, -0.72]].forEach(function (wp) {
      var wh = cyl(T3, 0.24, 0.24, 0.16, 10, lamb(T3, 0x10141c, false));
      wh.rotation.z = Math.PI / 2; wh.position.set(wp[0], 0.24, wp[1]); car.add(wh); wheels.push(wh);
    });
    S.scene.add(car); S.athlete = car; st.wheels = wheels;
    /* راننده */
    var drv = buildAthlete(T3, { jersey: 0xff9d3c, shorts: 0x14284e, seedN: 5 });
    drv.scale.setScalar(0.62); drv.position.set(0, 0.42, -0.1); car.add(drv);
    var J = drv.userData.J;
    /* درخت‌های کنار مسیر */
    var legMat = lamb(T3, 0x6b4b2a, true);
    for (var di = 0; di < (RT.LOW ? 14 : 30); di++) {
      var dz = -di * 6 - 4, sideD = (di % 2 === 0) ? -1 : 1;
      var trx = sideD * (7 + Math.random() * 5) + bendAt(-dz / V * 1000);
      var tr = cyl(T3, 0.14, 0.2, 1.4, 5, legMat); tr.position.set(trx, 0.7, dz); S.scene.add(tr);
      var cr = sph(T3, 1.2 + Math.random() * 0.7, lamb(T3, 0x2a7a44, true), 7); cr.position.set(trx, 2.2, dz); S.scene.add(cr);
    }
    S.hud.say('فرمان را با لمس بگیر — هر پیچ را از خط ایده‌آل رد کن!');
    bindInput(S.wrap, {
      down: function (x, y, W) { st.touching = true; st.tPx = x / W },
      move: function (x, y, W) { if (st.touching) st.tPx = x / W },
      up: function () { st.touching = false }
    });
    S.tick = function (dt) {
      var t = S.T();
      /* فرمان نرم */
      var target = st.touching ? clamp((st.tPx - 0.5) * 2, -1, 1) : 0;
      st.steer += (target - st.steer) * Math.min(1, dt * 9);
      /* حرکت — زمان‌محور (تضمین پنجره‌ی داور) */
      var z = 2 - V * (t / 1000);
      if (z < -roadLen - 4) z = -roadLen - 4;
      var bx = bendAt(t);
      car.position.set(bx + st.steer * 2.9, 0, z);
      car.rotation.y = -st.steer * 0.24 + (bendAt(t + 300) - bendAt(t)) * 0.02;
      car.rotation.z = st.steer * 0.06;
      for (var wi = 0; wi < st.wheels.length; wi++) { st.wheels[wi].rotation.x -= dt * 0.02; if (wi < 2) st.wheels[wi].rotation.y = -st.steer * 0.4 }
      dmp(J.armL.g, 'x', -1.15, 8, 8); dmp(J.armR.g, 'x', -1.15, 8, 8);
      dmp(J.armL.knee, 'x', -0.9 + st.steer * 0.3, 8, 8); dmp(J.armR.knee, 'x', -0.9 - st.steer * 0.3, 8, 8);
      /* عبور از دروازه‌ی پیچ */
      if (st.i < 6) {
        var aS = corners[st.i];
        if (t >= aS) {
          var ideal = Math.sin((st.i + 1) * 2.1);
          var q = clamp(1 - Math.abs(st.steer - 0.4 * ideal) / 0.6, 0, 1);
          q = Math.round(q * 20) / 20;
          /* زمان رویداد = زمان فیزیکی عبور (aS قطعی از seed) نه زمان تیکِ مشاهده —
             stall/فریم‌دراپ هرگز دو پیچ را هم‌زمان ثبت نمی‌کند (گپ داور ۳۸۰ms) و
             t همیشه دقیقاً وسط پنجره‌ی مجاز سرور [aS−350, aS+900] است. */
          TE('corner', aS, 0, q);
          st.pts += Math.round(q * 130);
          S.hud.setScore(st.pts);
          gates[st.i].material.color.setHex(q >= 0.8 ? 0x7dff9e : 0xffd75e);
          gates[st.i].material.opacity = 0.55;
          S.hud.flash(q >= 0.8 ? '#7dff9e' : '#ffe08a', 0.14);
          sfx(q >= 0.8 ? 'cheer' : 'click');
          S.hud.say('پیچ ' + faN(st.i + 1) + '/۶ — ' + faN(Math.round(q * 100)) + '٪');
          st.i++;
        } else {
          /* نشانگر پیچ نزدیک */
          var rel = aS - t;
          if (rel < 900) {
            gates[st.i].material.opacity = 0.32 + 0.3 * Math.sin(t / 90);
            S.hud.meter && S.hud.meter.set(clamp(1 - rel / 900, 0, 1), 'linear-gradient(90deg,#ffd75e,#ffb02e)');
          }
        }
      }
      /* دوربین تعقیبی */
      S.rig.go(car.position.x * 0.55, 3.4, z + 7.4, car.position.x * 0.8, 0.7, z - 9, dt, 5);
      S.rig.tickShake(dt);
      /* پایان */
      if (st.i >= 6 && !S.over) {
        victoryPose(J);
        var rows = '<div class="r me"><span>🚙 رالی</span><span>' + faN(6) + ' پیچ کامل</span><b>' + faN(st.pts) + '</b></div>';
        S.hud.photo(rows);
        S.finish(st.pts);
      }
    };
    return true;
  };

  /* ============================================================
     ۱۶) بوکس 3D — رینگ + خواندن حمله + بلاک/کانتر
     تله‌متری: ex(t, act, win, rt) — داور: v3Boxing=v3CombatGeo (بایت‌سازگار)
     قرارداد دقیق 2D: tel_i=floor(rng('box:'+i)*2) — act 0=بلاک بالا،
     1=بلاک پایین، 2=کانتر — win=act2?rt≤650:(act==tel&&rt≤900) — rt از
     لحظه‌ی شروع رد و بدل (تپ شروع) — ۹ رد و بدل — گپ داور 400ms
     ============================================================ */
  CTRL.boxing = function (S) {
    var T3 = S.T3, seed = seedOf(); if (!seed || !M) return false;
    var st = { n: 0, pts: 0, phase: 'idle', telT: -1, tel: 0, hitFx: 0, winFx: 0, lunge: 0, oppRecoil: 0, myHit: 0, oppHit: 0 };
    S.dbg = st;
    makeSky(T3, S.scene, 26, 110);
    /* رینگ */
    var floorP = box(T3, 7.2, 0.5, 7.2, lamb(T3, 0x2a4d8f, true)); floorP.position.y = -0.25; S.scene.add(floorP);
    var mat0 = new T3.Mesh(new T3.PlaneGeometry(6.4, 6.4), lamb(T3, 0x3a6fd8, true));
    mat0.rotation.x = -Math.PI / 2; mat0.position.y = 0.005; S.scene.add(mat0);
    var postM = lamb(T3, 0xe8ecf4, false), padM = lamb(T3, 0xe83a4a, false);
    var posts = [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]];
    posts.forEach(function (pp) {
      var p = cyl(T3, 0.09, 0.09, 1.7, 8, postM); p.position.set(pp[0], 0.85, pp[1]); S.scene.add(p);
      var pad = cyl(T3, 0.13, 0.13, 0.5, 8, padM); pad.position.set(pp[0], 1.45, pp[1]); S.scene.add(pad);
    });
    var ropeM = [0xf2f4f8, 0xffd75e, 0xf2f4f8];
    for (var lvl = 0; lvl < 3; lvl++) {
      var y = 0.55 + lvl * 0.42;
      [[-3.2, -3.2, 3.2, -3.2], [-3.2, 3.2, 3.2, 3.2], [-3.2, -3.2, -3.2, 3.2], [3.2, -3.2, 3.2, 3.2]].forEach(function (rr2) {
        var rope = box(T3, Math.abs(rr2[0] - rr2[2]) || 0.06, 0.045, Math.abs(rr2[1] - rr2[3]) || 0.06, lamb(T3, ropeM[lvl], false));
        rope.position.set((rr2[0] + rr2[2]) / 2, y, (rr2[1] + rr2[3]) / 2);
        S.scene.add(rope);
      });
    }
    /* نور بالای رینگ + تماشاگر دور */
    var rig = box(T3, 2.4, 0.16, 2.4, new T3.MeshBasicMaterial({ color: 0xfff6d8 })); rig.position.set(0, 4.6, 0); S.scene.add(rig);
    [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (pp) {
      var cable = cyl(T3, 0.015, 0.015, 2.2, 4, postM); cable.position.set(pp[0], 5.7, pp[1]); S.scene.add(cable);
    });
    (function () {
      var n = RT.LOW ? 110 : 240;
      var geo = new T3.BoxGeometry(0.34, 0.42, 0.3);
      var mat = new T3.MeshLambertMaterial({ color: 0xffffff });
      var inst = new T3.InstancedMesh(geo, mat, n);
      var dummy = new T3.Object3D(), col = new T3.Color();
      var pal = [0xff6b8f, 0x7fd8ff, 0xffd75e, 0x8f7dff, 0x7dffb0];
      for (var i = 0; i < n; i++) {
        var a = (i / n) * TAU, rad = 7.5 + (i % 3) * 0.9;
        dummy.position.set(Math.cos(a) * rad, 1.1 + (i % 2) * 0.5, Math.sin(a) * rad);
        dummy.lookAt(0, 1, 0); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
        col.setHex(pal[(Math.random() * pal.length) | 0]); inst.setColorAt(i, col);
      }
      inst.instanceMatrix.needsUpdate = true; S.scene.add(inst);
    })();
    /* دو بوکسور */
    var me = buildAthlete(T3, { jersey: 0x2a7de8, shorts: 0x14284e, seedN: 2 });
    me.position.set(0, 0, 1.35); S.scene.add(me); S.athlete = me;
    var Jm = me.userData.J;
    me.userData.J.shadow.position.y = -0.98; /* سایه روی صفحه‌ی رینگ */
    var opp = buildAthlete(T3, { jersey: 0xe83a4a, shorts: 0x3a0410, seedN: 1 });
    opp.position.set(0, 0, -1.35); opp.rotation.y = Math.PI; S.scene.add(opp);
    var Jo = opp.userData.J;
    opp.userData.J.shadow.position.y = -0.98;
    function guard(J) {
      dmp(J.armL.g, 'x', -2.15, 12, 18); dmp(J.armR.g, 'x', -2.15, 12, 18);
      dmp(J.armL.knee, 'x', -1.95, 12, 18); dmp(J.armR.knee, 'x', -1.95, 12, 18);
      dmp(J.spine, 'x', 0.14, 10, 12);
    }
    /* برچسب مناطق */
    var zone = document.createElement('div'); zone.className = 'o3d-zone';
    zone.innerHTML = '<span><b>🛡️ بلاک بالا</b></span><span><b>💥 کانتر</b></span><span><b>🛡️ بلاک پایین</b></span>';
    S.hud.hud.appendChild(zone);
    S.hud.say('برای شروع هر رد و بدل بزن — حمله را بخوان: بلاک یا کانتر سریع!');
    var missTimer = 0;
    bindInput(S.wrap, {
      down: function (x, y, W) {
        if (S.over) return;
        var t = S.T();
        if (st.phase === 'idle') {
          var i2 = st.n; if (i2 >= 9) return;
          st.tel = Math.floor(M.rngOf3(seed, 'box:' + i2)() * 2);
          st.telT = t; st.phase = 'tel'; st.lunge = 1;
          missTimer = 1600; sfx('click');
          return;
        }
        if (st.phase !== 'tel') return;
        var act = x < W / 3 ? 0 : x < (W * 2) / 3 ? 2 : 1;
        var rt = t - st.telT;
        var win = act === 2 ? (rt <= 650 ? 1 : 0) : ((act === st.tel && rt <= 900) ? 1 : 0);
        TE('ex', t, act, win, Math.round(rt));
        if (win) {
          st.pts += 110 + Math.max(0, Math.round((900 - rt) / 10));
          sfx('punch'); S.hud.flash('#7dff9e', 0.2);
          if (act === 2) { st.oppHit = 1 } else { st.oppRecoil = 1 }
        } else {
          sfx('alert'); S.rig.shake(0.08); S.hud.flash('#ff3344', 0.22);
          if (act !== 2) { st.myHit = 1 }
        }
        S.hud.setScore(st.pts);
        st.n++; st.phase = 'idle';
        if (st.n >= 9) {
          try { A.tm33(function () { if (!S.over) {
            var rows = '<div class="r me"><span>🥊 تو</span><span>' + faN(st.n) + ' رد و بدل</span><b>' + faN(st.pts) + '</b></div>';
            S.hud.photo(rows);
            if (st.pts >= 500) { victoryPose(Jm); defeatPose(Jo) } else if (st.pts < 250) { defeatPose(Jm); victoryPose(Jo) }
            S.finish(st.pts);
          } }, 600) } catch (e) { S.finish(st.pts) }
        }
      }
    });
    S.tick = function (dt) {
      var t = S.T();
      /* گارد پایه + تنفس */
      guard(Jm); guard(Jo);
      var bob = Math.sin(t / 260) * 0.03;
      Jm.hips.position.y = 0.92 + bob; Jo.hips.position.y = 0.92 - bob;
      dmp(Jm.legL.g, 'x', 0.14, 10, 12); dmp(Jm.legR.g, 'x', -0.14, 10, 12);
      dmp(Jo.legL.g, 'x', -0.14, 10, 12); dmp(Jo.legR.g, 'x', 0.14, 10, 12);
      /* شروع رد و بدل — لانگ جلو */
      if (st.lunge > 0) {
        st.lunge = Math.max(0, st.lunge - dt / 260);
        me.position.z = 1.35 - st.lunge * 0.5;
      } else me.position.z += (1.35 - me.position.z) * Math.min(1, dt * 8);
      /* تلگراف حمله — همان تأخیر میرور */
      if (st.phase === 'tel') {
        missTimer -= dt;
        var rt2 = t - st.telT;
        var show = rt2 > 350 + M.rngOf3(seed, 'boxd:' + st.n)() * 300;
        if (missTimer <= 0) { st.phase = 'idle'; sfx('alert'); S.rig.shake(0.05) } /* دقتی همان 2D — بدون رویداد */
        else if (show) {
          if (st.tel === 0) { dmp(Jo.armR.g, 'x', -2.9, 16, 24); dmp(Jo.armR.knee, 'x', -0.4, 16, 24); opp.position.z = -1.35 + Math.min(0.5, rt2 / 1400) }
          else { dmp(Jo.armR.g, 'x', -1.1, 16, 24); dmp(Jo.armR.knee, 'x', -0.5, 16, 24); opp.position.z = -1.35 + Math.min(0.5, rt2 / 1400) }
        }
        S.hud.meter && S.hud.meter.set(clamp(1 - rt2 / 900, 0, 1), 'linear-gradient(90deg,#ff8a9d,#ff4d6d)');
      }
      /* اصابت‌ها */
      if (st.myHit > 0) {
        st.myHit = Math.max(0, st.myHit - dt / 300);
        dmp(Jm.neck, 'x', 0.55 * st.myHit, 20, 30);
        opp.position.z = -1.35; /* برگشت */
      }
      if (st.oppHit > 0) {
        st.oppHit = Math.max(0, st.oppHit - dt / 300);
        dmp(Jo.neck, 'x', 0.6 * st.oppHit, 20, 30);
        opp.position.z = -1.35 - st.oppHit * 0.4;
      }
      if (st.oppRecoil > 0) {
        st.oppRecoil = Math.max(0, st.oppRecoil - dt / 260);
        dmp(Jo.spine, 'x', -0.3 * st.oppRecoil, 18, 26);
      }
      /* دوربین: نمای رینگ + پانچ روی رد و بدل */
      var close = st.phase === 'tel' ? 0.5 : 0;
      S.rig.go(2.5 - close, 1.75 - close * 0.25, 2.5 - close, 0, 1.05, 0, dt, 3.2);
      S.rig.tickShake(dt);
    };
    return true;
  };

  /* ============================================================
     ۱۷) نصب — پوشش 3D روی GAMES (فقط ۵ رشته) + سقوط امن به 2D
     ============================================================ */
  function prefOn() { try { return (localStorage.getItem('wd3d') || '1') === '1' } catch (e) { return true } }
  function install() {
    var G = A.GAMES; if (!G) return;
    preload(); /* V92: فایل 3D لود شده = قصد استفاده — Three را همین حالا پیش‌بارگیری کن (غیرمسدودکننده) */
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
    try { console.log('[WD_OLY3D] installed — 5 premium 3D disciplines (LOW=' + RT.LOW + ')') } catch (e) {}
  }
  install();

  /* ---------- API عمومی (هاب/UI/QA) ---------- */
  window.WD_OLY3D_LAST = '2d';
  window.WD_OLY3D = {
    FIVE: FIVE,
    capable: capable,
    ready: function () { return !!RT.three },
    preload: preload,
    low: function () { return RT.LOW },
    active: function () { return !!(RT.S && !RT.S.over) },
    dispose: function () { try { if (RT.S) { RT.S.kill(true); RT.S = null; return true } } catch (e) {} return false },
    info: function () {
      try {
        return {
          three: !!RT.three, broken: RT.broken, low: RT.LOW,
          active: !!(RT.S && !RT.S.over), key: RT.S ? RT.S.key : null,
          st: (function (o) { try { if (o && RT.S) o.now = Math.round(performance.now() - RT.S.t0) } catch (e) {} return o })(RT.S ? (RT.S.dbg || null) : null),
          render: RT.renderer ? { calls: RT.renderer.info.render.calls, tris: RT.renderer.info.render.triangles, frames: RT.renderer.info.render.frame } : null
        };
      } catch (e) { return { three: false, broken: true } }
    }
  };
})();
