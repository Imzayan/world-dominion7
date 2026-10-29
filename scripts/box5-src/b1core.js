/* ============================================================
   BOX5 — b1core: ثابت‌ها، کیفیت تطبیقی، صدا، VFX استخری، دوربین سینمایی
   V5 Boxing — WORLD DOMINION OLYMPICS
   تک‌حلقه‌ی رندر: tick این موتور فقط یک‌بار در loop33 ثبت می‌شود.
   ============================================================ */
import * as THREE from 'three'

/* ---------- ثابت‌های نبرد (آینه‌ی داور v5Boxing سمت سرور) ---------- */
export const PUNCH = {
  jab:     { id: 0, startup: 0.10, active: 0.06, recovery: 0.16, dmg: 6,  stam: 4,  reach: 1.95, h: 1, score: 9  },
  cross:   { id: 1, startup: 0.16, active: 0.07, recovery: 0.28, dmg: 12, stam: 9,  reach: 2.05, h: 1, score: 15 },
  hookL:   { id: 2, startup: 0.21, active: 0.07, recovery: 0.32, dmg: 14, stam: 11, reach: 1.65, h: 1, score: 17 },
  hookR:   { id: 3, startup: 0.21, active: 0.07, recovery: 0.32, dmg: 14, stam: 11, reach: 1.65, h: 1, score: 17 },
  upper:   { id: 4, startup: 0.25, active: 0.08, recovery: 0.36, dmg: 17, stam: 13, reach: 1.55, h: 1, score: 21 },
  body:    { id: 5, startup: 0.18, active: 0.07, recovery: 0.27, dmg: 10, stam: 8,  reach: 1.75, h: 0, score: 13, stamDmg: 9 },
}
export const PUNCH_LIST = ['jab', 'cross', 'hookL', 'hookR', 'upper', 'body']
export const CFG = {
  hpMax: 100, stMax: 100, guardMax: 60,
  stRegenIdle: 7.5, stRegenMove: 4, stRegenGuard: -6,
  guardDmgMul: 0.22, guardBreakStun: 0.8,
  dodgeDur: 0.34, dodgeIframe: 0.2, dodgeStam: 7, perfectWindow: 0.12, counterWin: 0.55,
  counterMul: 1.65, momHitClean: 6, momCounter: 12, momDodgePerf: 8, momHitTaken: 8, momWhiff: 7, momKd: 20,
  momDmgBonus: 0.15, /* حداکثر +۱۵٪ آسیب با مومنتوم — هرگز تعیین‌کننده‌ی مطلق نیست */
  roundLen: 30, rounds: 3, restLen: 5,
  exhaustedAt: 14, exhaustedSlow: 1.35, exhaustedDmg: 0.6,
  finisherMom: 85, finisherHp: 30,
  kdGetupTaps: 3,
}

/* ---------- کیفیت تطبیقی ULTRA/HIGH/MEDIUM/LOW ---------- */
export function detectTier() {
  let tier = 2
  try {
    const mem = navigator.deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    const mob = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '')
    if (mem >= 6 && cores >= 8) tier = mob ? 2 : 3
    else if (mem >= 4 && cores >= 6) tier = 2
    else if (mem >= 2) tier = 1
    else tier = 0
    if (window.WD60_FX && window.WD60_FX.state && window.WD60_FX.state() === 'on') tier = 0
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) tier = 0
  } catch (e) {}
  return tier
}
export const TIERS = [
  { name: 'LOW',    dpr: 0.8,  shadow: false, shRes: 512,  crowd: 380,  particles: 44,  aa: false, flags: 0, fog: true,  crowdBob: 0.35 },
  { name: 'MEDIUM', dpr: 1.0,  shadow: false, shRes: 512,  crowd: 900,  particles: 80,  aa: false, flags: 4, fog: true,  crowdBob: 0.7 },
  { name: 'HIGH',   dpr: 1.35, shadow: true,  shRes: 1024, crowd: 1500, particles: 130, aa: false, flags: 8, fog: true,  crowdBob: 1 },
  { name: 'ULTRA',  dpr: 2.0,  shadow: true,  shRes: 1024, crowd: 2200, particles: 190, aa: true,  flags: 10, fog: false, crowdBob: 1 },
]

/* ---------- Audio — WebAudio سینتز زنده (بدون فایل؛ lazy) + موسیقی حالت‌محور ---------- */
export class AudioEngine {
  constructor() { this.ok = false; this.ctx = null; this.intensity = 0.3; this.mode = 'menu'; this.timer = 0; this.step = 0; this._crowdGain = null; this._musicGain = null; this._master = null }
  init() {
    if (this.ok) return true
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return false
      this.ctx = new AC()
      this._master = this.ctx.createGain(); this._master.gain.value = 0.5; this._master.connect(this.ctx.destination)
      /* تماشاگر — نویز لوپ با باندپاس، گینِ متغیر با شدت لحظه */
      const len = 2 * this.ctx.sampleRate
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = buf.getChannelData(0)
      let last = 0
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 }
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6
      this._crowdGain = this.ctx.createGain(); this._crowdGain.gain.value = 0
      src.connect(bp); bp.connect(this._crowdGain); this._crowdGain.connect(this._master)
      src.start()
      this._musicGain = this.ctx.createGain(); this._musicGain.gain.value = 0; this._musicGain.connect(this._master)
      this.ok = true
    } catch (e) { this.ok = false }
    return this.ok
  }
  resume() { try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume() } catch (e) {} }
  suspend() { try { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend() } catch (e) {} }
  setMode(m) { this.mode = m }
  setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)) }
  update(dt) {
    if (!this.ok) return
    this.timer -= dt
    const m = this._musicGain.gain
    const targetMusic = (this.mode === 'menu' || this.mode === 'rest') ? 0.05 : (this.mode === 'final' ? 0.16 + this.intensity * 0.14 : 0.1 + this.intensity * 0.12)
    m.value += (targetMusic - m.value) * Math.min(1, dt * 2)
    if (this._crowdGain) this._crowdGain.gain.value += ((0.05 + this.intensity * 0.3) - this._crowdGain.gain.value) * Math.min(1, dt * 1.5)
    /* پالس ریتمیک — لایه‌ی کیک/هت با شدت (بدون فایل) */
    if (this.timer <= 0 && (this.mode === 'gameplay' || this.mode === 'final')) {
      const bpm = 92 + this.intensity * 46
      this.timer = 60 / bpm / 2
      this.step++
      if (this.step % 2 === 0) this._thump(0.25 + this.intensity * 0.3, 52)
      else if (this.intensity > 0.45) this._hat(0.05 + this.intensity * 0.05)
      if (this.intensity > 0.75 && this.step % 8 === 4) this._thump(0.2, 38)
    }
  }
  _thump(v, f) {
    try {
      const c = this.ctx, t = c.currentTime
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(28, f * 0.55), t + 0.12)
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
      o.connect(g); g.connect(this._musicGain); o.start(t); o.stop(t + 0.2)
    } catch (e) {}
  }
  _hat(v) {
    try {
      const c = this.ctx, t = c.currentTime
      const len = Math.floor(c.sampleRate * 0.04)
      const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const s = c.createBufferSource(); s.buffer = b
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000
      const g = c.createGain(); g.gain.value = v
      s.connect(hp); hp.connect(g); g.connect(this._musicGain); s.start(t)
    } catch (e) {}
  }
  /* SFX */
  bell() { this._metal(880, 0.9); this._metal(1320, 0.7) }
  bellEnd() { this._metal(660, 0.9); this._metal(990, 0.6) }
  _metal(f, v) {
    if (!this.ok) return
    try {
      const c = this.ctx, t = c.currentTime
      const o = c.createOscillator(), g = c.createGain(), o2 = c.createOscillator()
      o.type = 'triangle'; o.frequency.value = f
      o2.type = 'sine'; o2.frequency.value = f * 2.76
      g.gain.setValueAtTime(v * 0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
      o.connect(g); o2.connect(g); g.connect(this._master); o.start(t); o2.start(t); o.stop(t + 1.2); o2.stop(t + 1.2)
    } catch (e) {}
  }
  whoosh(heavy) {
    if (!this.ok) return
    try {
      const c = this.ctx, t = c.currentTime
      const len = Math.floor(c.sampleRate * (heavy ? 0.16 : 0.1))
      const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
      const s = c.createBufferSource(); s.buffer = b
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2
      bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(heavy ? 1400 : 2000, t + 0.09)
      const g = c.createGain(); g.gain.value = heavy ? 0.4 : 0.22
      s.connect(bp); bp.connect(g); g.connect(this._master); s.start(t)
    } catch (e) {}
  }
  impact(heavy) {
    if (!this.ok) return
    try {
      const c = this.ctx, t = c.currentTime
      const len = Math.floor(c.sampleRate * 0.09)
      const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5)
      const s = c.createBufferSource(); s.buffer = b
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = heavy ? 900 : 2200
      const g = c.createGain(); g.gain.value = heavy ? 0.85 : 0.4
      s.connect(lp); lp.connect(g); g.connect(this._master); s.start(t)
      const o = c.createOscillator(), og = c.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(heavy ? 95 : 140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12)
      og.gain.setValueAtTime(heavy ? 0.7 : 0.3, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      o.connect(og); og.connect(this._master); o.start(t); o.stop(t + 0.2)
    } catch (e) {}
  }
  block() { this.impact(false); if (this.ok) { try { const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 210; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); o.connect(g); g.connect(this._master); o.start(t); o.stop(t + 0.08) } catch (e) {} } }
  cheer(big) { if (!this.ok) return; try { const g = this._crowdGain.gain, t = this.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(Math.min(1, g.value + (big ? 0.5 : 0.28)), t); g.linearRampToValueAtTime(0.05 + this.intensity * 0.3, t + (big ? 2.2 : 1.2)) } catch (e) {} }
  dispose() { try { if (this.ctx) { this.ctx.close(); this.ctx = null; this.ok = false } } catch (e) {} }
}

/* ---------- VFX استخری — THREE.Points با data per-particle (بدون GC) ---------- */
export class VfxPool {
  constructor(scene, cap) {
    this.cap = cap
    this.pos = new Float32Array(cap * 3)
    this.col = new Float32Array(cap * 3)
    this.vel = new Float32Array(cap * 3)
    this.life = new Float32Array(cap)
    this.life0 = new Float32Array(cap)
    this.head = 0
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage))
    g.setDrawRange(0, 0)
    const m = new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending })
    this.points = new THREE.Points(g, m)
    this.points.frustumCulled = false
    this.points.renderOrder = 5
    scene.add(this.points)
    this.geo = g
  }
  burst(x, y, z, n, color, spd, up) {
    const c = new THREE.Color(color)
    for (let i = 0; i < n; i++) {
      const k = this.head; this.head = (this.head + 1) % this.cap
      this.pos[k * 3] = x; this.pos[k * 3 + 1] = y; this.pos[k * 3 + 2] = z
      const a = Math.random() * 6.283, r = Math.random()
      this.vel[k * 3] = Math.cos(a) * spd * r
      this.vel[k * 3 + 1] = up * (0.4 + Math.random() * 0.8)
      this.vel[k * 3 + 2] = Math.sin(a) * spd * r
      this.col[k * 3] = c.r; this.col[k * 3 + 1] = c.g; this.col[k * 3 + 2] = c.b
      this.life[k] = this.life0[k] = 0.35 + Math.random() * 0.35
    }
  }
  update(dt) {
    const p = this.pos, v = this.vel
    let any = false
    for (let k = 0; k < this.cap; k++) {
      if (this.life[k] <= 0) continue
      any = true
      this.life[k] -= dt
      if (this.life[k] <= 0) { p[k * 3 + 1] = -50; continue }
      v[k * 3 + 1] -= 5 * dt
      p[k * 3] += v[k * 3] * dt; p[k * 3 + 1] += v[k * 3 + 1] * dt; p[k * 3 + 2] += v[k * 3 + 2] * dt
      if (p[k * 3 + 1] < 0.02) { p[k * 3 + 1] = 0.02; v[k * 3 + 1] *= -0.3; v[k * 3] *= 0.7; v[k * 3 + 2] *= 0.7 }
    }
    this.points.visible = any
    if (any) { this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; this.geo.setDrawRange(0, this.cap) }
  }
  dispose(scene) {
    try { scene.remove(this.points); this.geo.dispose(); this.points.material.dispose() } catch (e) {}
  }
}

/* ---------- دوربین سینمایی — حالت‌محور، CONTROL ALWAYS WINS ---------- */
export const CAMS = ['INTRO', 'WALKOUT', 'CORNER', 'ROUND_START', 'GAMEPLAY', 'IMPACT', 'KNOCKDOWN', 'COUNTER', 'FINAL_ROUND', 'VICTORY', 'DEFEAT', 'MEDAL']
export class CameraDirector {
  constructor(camera) {
    this.cam = camera
    this.state = 'GAMEPLAY'
    this.until = 0
    this.t = 0
    this.shakeAmp = 0
    this.punchIn = 0
    this.tmp = new THREE.Vector3()
    this.tmp2 = new THREE.Vector3()
    this.look = new THREE.Vector3()
    this.orbitA = 0
  }
  to(state, dur) { this.state = state; this.until = this.t + (dur || 0); this.orbitA = Math.random() * 6.28 }
  gameplay() { this.to('GAMEPLAY', 0) }
  impact(strength) { this.shakeAmp = Math.min(0.3, this.shakeAmp + strength); this.punchIn = Math.min(1, this.punchIn + strength * 4) }
  knockdown() { this.to('KNOCKDOWN', 2.6) }
  update(dt, ctx) {
    /* ctx: {player, ai, phase, finalRound} */
    this.t += dt
    if (this.until > 0 && this.t > this.until && this.state !== 'GAMEPLAY') this.state = 'GAMEPLAY'
    const cam = this.cam
    const mid = this.tmp.set((ctx.player.pos.x + ctx.ai.pos.x) / 2, 1.35, (ctx.player.pos.z + ctx.ai.pos.z) / 2)
    const dist = Math.abs(ctx.player.pos.z - ctx.ai.pos.z)
    const tp = this.tmp2
    let look = mid
    let smooth = 3.2
    switch (this.state) {
      case 'INTRO': case 'WALKOUT': {
        const a = this.t * 0.25 + 1.2
        tp.set(Math.sin(a) * 5.5, 1.6 + Math.sin(this.t * 0.4) * 0.2, mid.z + Math.cos(a) * 5.5)
        smooth = 1.6
        break
      }
      case 'ROUND_START': {
        tp.set(mid.x, 3.4, mid.z + 8.6)
        smooth = 2.2
        break
      }
      case 'CORNER': {
        tp.set(ctx.player.pos.x + 1.6, 1.75, ctx.player.pos.z - 2.8)
        look = mid.set(ctx.player.pos.x, 1.5, ctx.player.pos.z); smooth = 2
        break
      }
      case 'KNOCKDOWN': {
        const a = this.orbitA + this.t * 0.22
        tp.set(mid.x + Math.sin(a) * 5.8, 1.35, mid.z + Math.cos(a) * 5.8)
        smooth = 2.4
        break
      }
      case 'VICTORY': case 'MEDAL': {
        const a = this.orbitA + this.t * 0.16
        const f = ctx.player
        tp.set(f.pos.x + Math.sin(a) * 5.8, 2.4 + Math.sin(this.t * 0.3) * 0.3, f.pos.z + Math.cos(a) * 5.8)
        look = mid.set(f.pos.x, 1.4, f.pos.z); smooth = 1.8
        break
      }
      case 'DEFEAT': {
        tp.set(ctx.player.pos.x - 2.4, 1.2, ctx.player.pos.z + 3.4)
        look = mid.set(ctx.player.pos.x, 0.9, ctx.player.pos.z); smooth = 1.6
        break
      }
      default: { /* GAMEPLAY — بلنددهی پخش تلویزیونی، بیرون طناب‌ها */
        const px = ctx.player.pos.x, pz = ctx.player.pos.z
        const portrait = (this.cam.aspect || 1) < 1
        const cf = portrait ? 1.22 : 1
        const sx = px > 0 ? -1 : 1
        tp.set(px * 0.45 + sx * (2.3 + Math.min(1.1, dist * 0.22)) * cf, 3.35, mid.z + (7.2 + Math.min(2.0, dist * 0.5)) * cf)
        smooth = 4.2
        if (ctx.finalRound) { tp.y += 0.35; tp.x *= 0.92 } /* راند آخر — زاویه‌ی بالاتر و دراماتیک‌تر */
      }
    }
    /* پانچ-این روی ضربه */
    this.punchIn = Math.max(0, this.punchIn - dt * 5)
    const pi = this.punchIn * 0.45
    tp.sub(look).multiplyScalar(1 - pi * 0.16).add(look)
    cam.position.lerp(tp, Math.min(1, dt * smooth))
    this.look.lerp(look, Math.min(1, dt * smooth * 1.3))
    /* لرزش — کنترل‌شده و کوچک */
    this.shakeAmp = Math.max(0, this.shakeAmp - dt * 1.4)
    const sh = this.shakeAmp * 0.06
    cam.position.x += (Math.random() - 0.5) * sh
    cam.position.y += (Math.random() - 0.5) * sh
    cam.lookAt(this.look)
  }
}

/* ---------- TimeScale — اسلوموشن کنترل‌شده ---------- */
export class TimeScale {
  constructor() { this.scale = 1; this.target = 1; this.until = 0 }
  slow(scale, sec) { this.scale = scale; this.target = scale; this.until = sec }
  update(dtReal) {
    if (this.until > 0) { this.until -= dtReal; if (this.until <= 0) this.target = 1 }
    this.scale += (this.target - this.scale) * Math.min(1, dtReal * 8)
    return this.scale
  }
}
