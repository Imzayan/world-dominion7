/* ============================================================
   BOX5 — b3combat: کنترل‌کننده‌ی نبرد (فازها/راند/ناک‌داون) + AI (۱۳ حالت + شخصیت + تطبیق) + ورودی حرکتی + HUD
   تک‌حلقه: update(dt) از b5main صدا زده می‌شود.
   تله‌متری: فقط رویدادهای عددی — p / atk / bell / rl / kd / end (آینه‌ی داور v5Boxing)
   ============================================================ */
import { CFG, PUNCH, PUNCH_LIST } from './b1core.js'
import { Fighter } from './b2scene.js'
import { PLATFORM_Y, RING_HALF } from './b2scene.js'

const faN = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])

/* ============================================================
   AI — شخصیت‌محور، ۱۳ حالت، تصمیم ۷-۹ هرتز، تطبیق با عادت بازیکن
   حالت‌ها: IDLE APPROACH KEEP_DISTANCE ATTACK COMBO DEFEND DODGE COUNTER
           RETREAT STAGGER EXHAUSTED DESPERATE FINISHING
   ============================================================ */
export class AI {
  constructor(profile, rng, diff) {
    this.p = profile
    this.rng = rng
    this.diff = diff || 1
    this.defOnly = false /* spar: حمله فقط از برنامه‌ی seed */
    this.state = 'IDLE'
    this.thinkT = 0
    this.comboQueue = []
    this.comboT = 0
    this.mem = { punches: [], body: 0, dodges: 0, counters: 0, passiveT: 0 }
    this.caution = 0
  }
  sk(v) { return Math.min(0.97, v * this.diff) }
  notePlayer(type, data) {
    const m = this.mem
    if (type === 'punch') { m.punches.push(data); if (m.punches.length > 14) m.punches.shift(); if (data === 'body') m.body++ }
    else if (type === 'dodge') m.dodges++
    else if (type === 'counter') m.counters++
  }
  think(dt, me, foe, ctl) {
    this.thinkT -= dt
    if (this.thinkT > 0) return
    this.thinkT = 0.12 + this.rng() * 0.05 /* ۷-۹ هرتز */
    const dist = Math.abs(me.pos.z - foe.pos.z)
    const m = this.mem
    if (m.counters >= 3) this.caution = Math.min(1, this.caution + 0.15)
    const passive = m.passiveT > 3.2
    const agg = Math.min(1.15, this.p.aggr * (passive ? 1.35 : 1) * (me.st < 25 ? 0.6 : 1) * (1 - this.caution * 0.45))
    const hpDiff = me.hp - foe.hp
    let want = 'KEEP_DISTANCE'
    if (me.hp <= 0 || me.kdState !== 0) want = 'IDLE'
    else if (me.exhausted()) want = 'RETREAT'
    else if (me.stunT > 0) want = 'STAGGER'
    else if (this.state === 'DESPERATE' || (me.hp < 22 && foe.hp > 45 && this.rng() < 0.5)) want = 'DESPERATE'
    else if (foe.hp <= CFG.finisherHp && me.momentum > 55) want = 'FINISHING'
    else if (dist > 2.2) want = agg > 0.35 ? 'APPROACH' : 'KEEP_DISTANCE'
    else if (dist < 1.15) want = this.p.style === 'defensive' ? 'KEEP_DISTANCE' : 'ATTACK'
    else if (agg > 0.55 && this.rng() < 0.5) want = 'ATTACK'
    else if (this.rng() < this.sk(this.p.counter) * 0.3 && foe.action) want = 'COUNTER'
    else if (this.rng() < this.sk(this.p.guard) * 0.35) want = 'DEFEND'
    else want = this.rng() < 0.5 ? 'ATTACK' : 'KEEP_DISTANCE'
    if (hpDiff < -30 && this.rng() < 0.3) want = 'DESPERATE'
    this.state = want
    switch (want) {
      case 'APPROACH': this.moveToward(me, foe, dt); break
      case 'KEEP_DISTANCE': {
        if (dist < 1.5) this.cmd(me, { t: 'back' })
        else if (this.rng() < 0.3) this.cmd(me, { t: 'strafe', dir: this.rng() < 0.5 ? -1 : 1 })
        break
      }
      case 'RETREAT': this.cmd(me, { t: 'back' }); break
      case 'ATTACK': case 'DESPERATE': case 'FINISHING': {
        if (this.defOnly) { this.moveToward(me, foe, dt); break }
        const r = this.rng()
        let kind = 'jab'
        if (r < 0.34) kind = 'jab'
        else if (r < 0.55) kind = 'cross'
        else if (r < 0.72) kind = this.rng() < 0.5 ? 'hookL' : 'hookR'
        else if (r < 0.82) kind = 'body'
        else kind = 'upper'
        if (want === 'DESPERATE') kind = this.rng() < 0.6 ? 'upper' : (this.rng() < 0.5 ? 'hookL' : 'hookR')
        if (this.rng() < this.sk(this.p.combo) * 0.5) {
          this.comboQueue = [kind]
          const n = 1 + Math.floor(this.rng() * 2)
          for (let i = 0; i < n; i++) this.comboQueue.push(PUNCH_LIST[Math.floor(this.rng() * 3)])
          this.comboT = 0.05
        } else this.cmd(me, { t: 'punch', kind })
        break
      }
      case 'DEFEND': this.cmd(me, { t: 'guardOn' }); this._guardOffAt = 0.5 + this.rng() * 0.7; break
      case 'COUNTER': this.cmd(me, { t: 'guardOn' }); break
      case 'STAGGER': this.cmd(me, { t: 'back' }); break
      default: break
    }
    /* واکنش دفاعی به استارتاپ ضربه‌ی بازیکن — تأخیر واکنش واقعی */
    if (foe.action && foe.action.type === 'punch' && !foe.action._aiSeen && foe.action.t < 0.1) {
      foe.action._aiSeen = true
      const roll = this.rng()
      const dodgeSk = this.sk(this.p.dodge)
      const guardSk = this.sk(this.p.guard)
      const cntSk = this.sk(this.p.counter) * (1 - this.caution * 0.3)
      if (roll < dodgeSk * 0.42) this.cmd(me, { t: 'dodge', dir: this.rng() < 0.5 ? -1 : 1 })
      else if (roll < dodgeSk * 0.42 + guardSk * 0.75) this.cmd(me, { t: 'guardOn' })
      else if (roll < dodgeSk * 0.42 + guardSk * 0.75 + cntSk * 0.35) this.cmd(me, { t: 'dodge', dir: this.rng() < 0.5 ? -1 : 1 })
    }
    if (this.comboQueue.length && this.comboT <= 0 && !me.action && me.stunT <= 0 && !this.defOnly) {
      const k = this.comboQueue.shift()
      this.cmd(me, { t: 'punch', kind: k })
      this.comboT = 0.14
    }
    this.comboT -= dt
    if (me.guarding && !foe.action && (want === 'ATTACK' || want === 'APPROACH')) this.cmd(me, { t: 'guardOff' })
  }
  moveToward(me, foe, dt) {
    const dist = Math.abs(me.pos.z - foe.pos.z)
    if (dist > 1.7) this.cmd(me, { t: 'fwd' })
    else if (this.rng() < 0.25) this.cmd(me, { t: 'strafe', dir: this.rng() < 0.5 ? -1 : 1 })
  }
  cmd(me, c) { if (me.cmdQueue.length < 3) me.cmdQueue.push(c) }
}

/* ============================================================
   FightCtl — کنترل کامل نبرد
   ============================================================ */
export class FightCtl {
  constructor(env, opts) {
    this.env = env
    this.opts = opts
    this.mode = opts.mode
    this.phase = 'IDLE'
    this.phaseT = 0
    this.round = 0
    this.rounds = opts.rounds || CFG.rounds
    this.roundLen = opts.roundLen || CFG.roundLen
    this.restLen = opts.restLen != null ? opts.restLen : CFG.restLen
    this.clock = 0
    this.time = 0
    this.teach = !!opts.teach
    this.buffs = opts.buffs || {}
    this.kdRing = null
    this.finisherUsed = false
    this.flashKd = { p: false, a: false }
    this.decision = [0, 0]
    this.result = null
    this.paused = false
    this.hintSent = {}
    this.punchLog = []
    this.atkLog = []
    this.kdLog = []
    this._dt = 0.016
    const envA = env.arena
    this.player = new Fighter(envA, env.assets, { side: -1, tint: opts.playerTint, gloves: opts.playerGloves, shorts: opts.playerShorts, name: opts.playerName })
    this.ai = new Fighter(envA, env.assets, { side: 1, tint: opts.aiProfile.tint, gloves: opts.aiProfile.gloves, shorts: opts.aiProfile.shorts, name: opts.aiProfile.name, isCyborg: opts.aiProfile.cyborg })
    this.player.opp = this.ai; this.ai.opp = this.player
    this.player.onActive = (kind) => this.resolvePunch(this.player, kind)
    this.ai.onActive = (kind) => this.resolvePunch(this.ai, kind)
    this.player.cmdQueue = []
    this.ai.cmdQueue = []
    this.plan = null
    if (this.mode === 'spar') this.plan = this.buildPlan()
    this.aiBrain = new AI(opts.aiProfile, opts.rng || Math.random, opts.aiDiff || 1)
    this.aiBrain.defOnly = this.mode === 'spar'
    this.planIdx = 0
    this.player.pos.set(0, PLATFORM_Y, -1.6) /* بازیکن سمت دورتر از دوربین — رو به حریف */
    this.ai.pos.set(0, PLATFORM_Y, +1.6)
  }
  buildPlan() {
    /* برنامه‌ی حمله‌ی AI از seed — داور سرور همان را بازمی‌سازد (آینه) */
    const r = this.opts.seedRng
    const plan = []
    for (let rd = 0; rd < this.rounds; rd++) {
      const n = 7 + Math.floor(r() * 4)
      const list = []
      let t = 2.5 + r() * 2.5
      for (let i = 0; i < n; i++) {
        const kind = PUNCH_LIST[Math.floor(r() * 6)]
        list.push({ t, kind })
        t += 2.4 + r() * 2.6
        if (t > this.roundLen - 1) break /* انتهای راند — مونوتونیک می‌ماند (آینه‌ی داور) */
      }
      plan.push(list)
    }
    return plan
  }
  start() {
    this.phase = 'INTRO'; this.phaseT = 0
    this.env.cam.to('INTRO', 3.2)
    this.env.audio.setMode('menu')
    this.env.hud.showFighters(this.opts.playerName, this.opts.aiProfile.name, this.opts.aiProfile.flag)
    this.env.hud.roundCard(this.opts.aiProfile.name || 'SPAR', this.mode === 'spar' ? 'جلسه‌ی بوکس رسمی — ۳ راند' : this.opts.aiProfile.title || '', 2.6)
  }
  /* ---------- ورودی بازیکن ---------- */
  command(c) {
    if (this.phase !== 'FIGHT' || this.paused) return
    const p = this.player
    if (c.t === 'guardOn') { p.guarding = true; if (this.teach && !this.hintSent.g) { this.hintSent.g = 1 } }
    else if (c.t === 'guardOff') p.guarding = false
    else if (c.t === 'dodge') { if (p.startDodge(c.dir)) this.aiBrain.notePlayer('dodge') }
    else if (c.t === 'backstep') { if (p.canAct()) p.pos.z = Math.max(-RING_HALF, p.pos.z - 0.4) }
    else if (c.t === 'punch') this.tryPunch(p, c.kind, true)
    else if (c.t === 'finisher') this.tryFinisher()
  }
  tryPunch(p, kind, isPlayer) {
    const P = PUNCH[kind]
    if (!p) return false
    if (p.guarding) p.guarding = false
    const ok = p.punch(kind)
    if (ok) {
      if (isPlayer) this.aiBrain.notePlayer('punch', kind)
      this.env.audio.whoosh(P.dmg >= 12)
    }
    return ok
  }
  tryFinisher() {
    const p = this.player, foe = this.ai
    if (this.finisherUsed || p.momentum < CFG.finisherMom || foe.hp > CFG.finisherHp || p.kdState !== 0 || this.phase !== 'FIGHT') return false
    this.finisherUsed = true
    this.env.ts.slow(0.45, 1.1)
    this.env.cam.knockdown()
    this.env.hud.comboPop('FINISHER!', '#ffd75e')
    const seq = ['upper', 'hookR', 'cross']
    const exec = (i) => {
      if (i >= seq.length || this.phase !== 'FIGHT' || this.result) return
      if (Math.abs(p.pos.z - foe.pos.z) > 1.8) p.pos.z = foe.pos.z - 1.5
      this.tryPunch(p, seq[i], true)
      setTimeout(() => exec(i + 1), 420)
    }
    exec(0)
    return true
  }
  movePlayer(axis) {
    if (this.phase !== 'FIGHT' || this.paused) return
    const p = this.player
    if (p.kdState !== 0 || p.stunT > 0) return
    const sp = p.exhausted() ? 1.05 : 1.65
    p.pos.z = Math.max(-RING_HALF, Math.min(RING_HALF - 0.3, p.pos.z - axis * sp * this._dt))
  }
  /* ---------- حل رضربه — تله‌متری دقیقاً همینجا صادر می‌شود ---------- */
  resolvePunch(att, kind) {
    const foe = att.opp
    const P = PUNCH[kind]
    const dist = Math.abs(att.pos.z - foe.pos.z)
    const rec = { kind, t: this.time, res: 0, dmg: 0, guarded: false, counter: false }
    if (dist > P.reach + 0.25) { rec.res = 0; this.momentumAdd(att, -CFG.momWhiff * 0.4) }
    else if (foe.iframe > 0) {
      rec.res = 0; foe.stats.dodges++
      foe.counterT = CFG.counterWin /* داوج کامل → پنجره‌ی کانتر */
      this.momentumAdd(foe, CFG.momDodgePerf * 0.6)
    } else if (foe.kdState !== 0) {
      rec.res = 2; rec.dmg = P.dmg * 0.5
      foe.takeHit(rec.dmg, {})
    } else {
      const guarded = foe.guarding && (P.h === 1 || Math.random() < 0.35)
      const dmgBase = P.dmg * (att === this.player && this.buffs.dmg ? 1.08 : 1) * (1 + att.momentum / 100 * CFG.momDmgBonus) * (att.exhausted() ? CFG.exhaustedDmg : 1)
      rec.guarded = guarded
      if (guarded) {
        rec.res = 1; rec.dmg = dmgBase
        foe.takeHit(dmgBase, { guarded: true, body: P.h === 0 })
        this.env.audio.block()
        foe.stats.blocked++
        this.momentumAdd(foe, 2)
      } else {
        rec.res = 2
        const isCounter = (att.counterT > 0) || (att.action && att.action._counterWish)
        rec.counter = !!isCounter
        let d = dmgBase * (rec.counter ? CFG.counterMul : 1)
        rec.dmg = d
        foe.takeHit(d, { body: P.h === 0 })
        if (P.stamDmg) foe.st = Math.max(0, foe.st - P.stamDmg)
        att.stats.landed++
        if (rec.counter) { att.stats.counters++; this.momentumAdd(att, CFG.momCounter); this.env.hud.comboPop('کانتر!', '#7dff9e') }
        else this.momentumAdd(att, P.dmg >= 12 ? CFG.momHitClean : CFG.momHitClean * 0.7)
        att.stats.combo++
        att.stats.maxCombo = Math.max(att.stats.maxCombo, att.stats.combo)
        if (att.stats.combo >= 3) this.momentumAdd(att, 4)
        att.roundScore += P.score * (rec.counter ? 1.6 : 1)
        /* HIT FEEL */
        const heavy = d >= 11
        this.env.audio.impact(heavy)
        const hx = foe.pos.x + (Math.random() - 0.5) * 0.3
        this.env.vfx.burst(hx, P.h === 1 ? 1.55 : 1.05, foe.pos.z - foe.side * -0.25, heavy ? 14 : 7, heavy ? 0xffd75e : 0xfff2d8, heavy ? 2.6 : 1.6, heavy ? 2.2 : 1.2)
        this.env.cam.impact(heavy ? 0.24 : 0.1)
        this.env.arena.exciteBump(heavy ? 0.25 : 0.1)
        this.env.haptic(heavy ? 24 : 10)
        if (heavy) this.env.ts.slow(0.75, 0.12)
        if (foe.guardBreak) { foe.guardBreak = false; this.env.hud.comboPop('گارد شکست!', '#ff8ba0') }
        if (foe.guard === 0 && d >= 12 && !this.flashKd[foe === this.player ? 'p' : 'a'] && foe.kdState === 0) {
          this.flashKd[foe === this.player ? 'p' : 'a'] = true
          this.beginKnockdown(foe)
        }
        if (foe.hp <= 0 && foe.kdState === 0) this.beginKnockdown(foe)
      }
    }
    rec.dmg = Math.round(rec.dmg * 100) / 100
    /* تله‌متری */
    if (att === this.player) {
      this.punchLog.push({ kind, t: rec.t, res: rec.res, dmg: rec.dmg, counter: rec.counter })
      this.ev('p', rec.t, P.id, rec.res, rec.dmg, rec.counter ? 1 : 0)
    } else if (rec.planIdx != null) {
      this.atkLog.push({ t: rec.t, idx: rec.planIdx, res: rec.res })
      this.ev('atk', rec.t, rec.planIdx, rec.res, 0)
    }
    if (att === this.player && rec.counter) this.aiBrain.notePlayer('counter')
    return rec
  }
  momentumAdd(f, v) {
    f.momentum = Math.max(0, Math.min(100, f.momentum + v))
  }
  /* ---------- ناک‌داون ---------- */
  beginKnockdown(who) {
    if (this.phase === 'KD') return
    const isPlayer = who === this.player
    who.kdState = 1; who.kdT = 0
    who.stats.kd++
    this.kdWho = isPlayer ? 0 : 1
    this.kdCount = 0
    this.phase = 'KD'
    this.phaseT = 0
    this.env.ts.slow(0.35, 0.9)
    this.env.cam.knockdown()
    this.env.audio.bellEnd()
    this.env.arena.exciteBump(1)
    this.momentumAdd(isPlayer ? this.ai : this.player, CFG.momKd)
    this.kdLog.push({ t: this.time, who: isPlayer ? 0 : 1 })
    this.ev('kd', this.time, isPlayer ? 0 : 1, 0)
    this.env.hud.roundCard(isPlayer ? 'DOWN!' : 'ناک‌داون!', isPlayer ? 'برای برگشتن بزن!' : 'حریف زمین خورد', 1.6)
    if (isPlayer) {
      this.env.hud.knockUI(true, 0)
      this.kdRing = { t: 0, dir: 1, pos: 0.5, speed: 1.15 + (1 - this.player.hp / 100) * 0.7, ok: 0, fail: 0 }
    } else {
      this._aiGetupNeed = 1 + (this.opts.aiProfile.cyborg ? 0 : Math.floor((this.opts.aiDiff || 1) * 1.5))
    }
  }
  knockTap() {
    if (!this.kdRing || this.phase !== 'KD' || this.kdWho !== 0) return
    const r = this.kdRing
    if (Math.abs(r.pos - 0.5) < 0.16) {
      r.ok++
      this.env.audio.cheer(false)
      this.env.hud.knockUI(true, r.ok)
      if (r.ok >= CFG.kdGetupTaps) {
        this.env.hud.knockUI(false, 0)
        this.kdRing = null
        this.doGetup(this.player)
      }
    } else {
      r.fail++
      this.kdCount++
      this.env.hud.knockUI(true, r.ok, true)
      if (r.fail >= 3) {
        this.env.hud.knockUI(false, 0)
        this.kdRing = null
        this.koFinish(this.ai)
      }
    }
  }
  doGetup(f) {
    f.kdState = 3; f.kdT = 0
    f.st = Math.max(f.st, 30)
    f.momentum = Math.max(0, f.momentum - 25)
    f.guard = CFG.guardMax
    this.phase = 'FIGHT'
    this.env.cam.gameplay()
    if (f === this.player) this.env.hud.roundCard('برگشتی!', 'ادامه بده', 1.2)
    this.ev('kd', this.time, f === this.player ? 0 : 1, 1)
  }
  koFinish(winner) {
    const loser = winner.opp
    loser.kdState = 2
    this.finish(winner, true)
  }
  /* ---------- فازها ---------- */
  update(dtReal) {
    if (this.paused || this.result) return
    const ts = this.env.ts.update(dtReal)
    const dt = dtReal * ts
    this._dt = dt
    this.time += dt
    this.phaseT += dt
    const p = this.player, a = this.ai
    if (this.phase === 'FIGHT') {
      this.aiBrain.think(dt, a, p, this)
      this.applyCommands(a, dt)
      this.applyCommands(p, dt)
    }
    p.update(dt); a.update(dt)
    const dz = a.pos.z - p.pos.z
    if (Math.abs(dz) < 0.95 && p.kdState === 0 && a.kdState === 0) {
      const push = (0.95 - Math.abs(dz)) / 2 * (dz >= 0 ? 1 : -1)
      a.pos.z += push; p.pos.z -= push
    }
    if (a.guarding && a._guardOffAt != null) { a._guardOffAt -= dt; if (a._guardOffAt <= 0) { a.guarding = false; a._guardOffAt = null } }
    switch (this.phase) {
      case 'INTRO': {
        if (this.phaseT > (this.mode === 'spar' ? 2.6 : 4.2)) this.nextRound(1)
        break
      }
      case 'ROUND_CARD': {
        if (this.phaseT > 1.8) {
          this.phase = 'FIGHT'; this.phaseT = 0; this.clock = this.roundLen
          this.env.cam.gameplay()
          this.env.audio.setMode(this.round >= this.rounds ? 'final' : 'gameplay')
          this.env.audio.bell()
          if (this.round >= this.rounds) this.env.cam.to('FINAL_ROUND')
          if (this.teach && !this.hintSent.r1) { this.hintSent.r1 = 1; this.env.hud.hint('تپ=جب • دبل‌تپ=کراس • سوایپ چپ/راست=داوج • نگه‌دار=گارد') }
        }
        break
      }
      case 'FIGHT': {
        this.clock -= dt
        if (this.plan && this.planIdx < this.plan[this.round - 1].length) {
          const step = this.plan[this.round - 1][this.planIdx]
          if (this.roundLen - this.clock >= step.t) {
            const idx = this.planIdx
            this.planIdx++
            if (Math.abs(a.pos.z - p.pos.z) <= PUNCH[step.kind].reach + 0.4 && a.canAct()) {
              this.tryPunch(a, step.kind, false)
              if (a.action) a.action.planIdx = idx
            }
          }
        }
        if (this.clock <= 0) this.endRound()
        break
      }
      case 'REST': {
        if (this.phaseT > this.restLen) this.nextRound(this.round + 1)
        break
      }
      case 'KD': {
        if (this.kdWho === 1 && a.kdState === 2) {
          if (this.phaseT > 1.2 + this._aiGetupNeed * 0.8) {
            if (a.hp <= 6 && !this.opts.aiProfile.cyborg && this.aiBrain.rng() < 0.25) this.koFinish(p)
            else this.doGetup(a)
          }
        }
        if (this.kdWho === 0 && this.kdRing) {
          const r = this.kdRing
          r.t += dt
          r.pos += r.dir * r.speed * dt
          if (r.pos > 1) { r.pos = 1; r.dir = -1 }
          if (r.pos < 0) { r.pos = 0; r.dir = 1 }
          this.env.hud.knockRing(r.pos)
          if (this.kdCount >= 9) { this.env.hud.knockUI(false, 0); this.kdRing = null; this.koFinish(a) }
          else if (r.t > 3.4) {
            r.t = 0; this.kdCount++
            if (this.kdCount >= 9) { this.env.hud.knockUI(false, 0); this.kdRing = null; this.koFinish(a) }
          }
        }
        break
      }
      case 'VERDICT': {
        if (this.phaseT > (this.mode === 'spar' ? 2.2 : 3.4)) this.finish(this._winner, this._byKo)
        break
      }
      default: break
    }
    if (this.phase === 'FIGHT') {
      const inten = 0.22 + p.momentum / 150 + (a.hp < 35 ? 0.2 : 0) + (p.hp < 35 ? 0.1 : 0)
      this.env.audio.setIntensity(Math.min(1, inten))
    }
  }
  applyCommands(f, dt) {
    const q = f.cmdQueue
    while (q.length) {
      const c = q.shift()
      if (c.t === 'punch') this.tryPunch(f, c.kind, false)
      else if (c.t === 'guardOn') f.guarding = true
      else if (c.t === 'guardOff') f.guarding = false
      else if (c.t === 'dodge') f.startDodge(c.dir)
      else if (c.t === 'fwd') f.pos.z -= 1.15 * dt * (f.exhausted() ? 0.6 : 1)
      else if (c.t === 'back') f.pos.z += 1.25 * dt * (f.exhausted() ? 0.55 : 1)
      else if (c.t === 'strafe') f.pos.x = Math.max(-2.2, Math.min(2.2, f.pos.x + c.dir * 1.0 * dt))
    }
  }
  nextRound(n) {
    this.round = n
    if (n > this.rounds) { this.verdictByDecision(); return }
    this.phase = 'ROUND_CARD'
    this.phaseT = 0
    this.player.resetRound(); this.ai.resetRound()
    this.planIdx = 0
    this.env.hud.roundCard('راند ' + faN(n), n === this.rounds ? 'راند آخر — همه‌چیز عوض می‌شود' : '', 1.7)
    this.env.cam.to('ROUND_START', 1.6)
    this.ev('bell', this.time, n)
  }
  endRound() {
    this.env.audio.bellEnd()
    const ps = Math.round(this.player.roundScore), as = Math.round(this.ai.roundScore)
    if (ps > as) { this.decision[0] += 10; this.decision[1] += 9; this.momentumAdd(this.player, 15) }
    else if (as > ps) { this.decision[0] += 9; this.decision[1] += 10; this.momentumAdd(this.ai, 15) }
    else { this.decision[0] += 10; this.decision[1] += 10 }
    this.ev('rl', this.time, this.round, this.player.stats.thrown, this.player.stats.landed, this.player.stats.blocked + this.player.stats.dodges, this.player.stats.kd, this.ai.stats.kd)
    this.flashKd = { p: false, a: false }
    this.player.roundScore = 0; this.ai.roundScore = 0
    this.phase = 'REST'
    this.phaseT = 0
    this.env.audio.setMode('rest')
    this.env.hud.coach(this.coachLine())
    this.env.cam.to('CORNER', this.restLen)
  }
  coachLine() {
    const st = this.player.stats
    const acc = st.thrown ? st.landed / st.thrown : 0
    const lines = this.opts.coach || {}
    if (st.kd >= 1) return lines.kd || '«بلند شدی. حالا با عقل بجنگ.»'
    if (st.thrown >= 6 && acc < 0.25) return lines.acc || '«هدر نده — هر ضربه قیمت دارد.»'
    if (st.combo >= 3) return lines.combo || '«همین ترکیب را نگه دار!»'
    if (this.player.st < 30) return lines.stam || '«نفست را هدر ندهی، می‌بری.»'
    if (st.blocked + st.dodges === 0 && st.landed >= 3) return lines.def || '«دفاع یادت رفت — گارد بالا!»'
    return lines.generic || '«یکی می‌ماند. آرام باش.»'
  }
  verdictByDecision() {
    const pWin = this.decision[0] > this.decision[1]
    const winner = pWin ? this.player : this.ai
    this.env.hud.roundCard('پایان مسابقه', 'به داوری — ' + (pWin ? 'کارت‌ها به سود تو' : 'کارت‌ها به سود حریف'), 2.2)
    this.finish(winner, false)
  }
  finish(winner, byKo) {
    if (this.result) return
    this.phase = 'VERDICT'
    this.phaseT = 0
    this._winner = winner
    this._byKo = byKo
    const playerWon = winner === this.player
    this.env.hud.roundCard(playerWon ? 'پیروزی!' : 'باخت', byKo ? 'با ناک‌اوت' : 'با داوری', 2.4)
    if (playerWon) { this.player.emote = { type: 'victory' }; this.ai.emote = { type: 'defeat' }; this.env.cam.to('VICTORY', 3.2); this.env.audio.cheer(true); this.env.arena.exciteBump(1.5) }
    else { this.player.emote = { type: 'defeat' }; this.ai.emote = { type: 'victory' }; this.env.cam.to('DEFEAT', 3.2) }
    this.env.audio.bellEnd()
    this.ev('end', this.time, playerWon ? 1 : 0, byKo ? 1 : 0)
    setTimeout(() => this.finishFinal(playerWon, byKo), this.mode === 'spar' ? 2200 : 3200)
  }
  finishFinal(playerWon, byKo) {
    if (this.result) return
    this.result = {
      verdict: playerWon ? 1 : 0,
      byKo,
      rounds: this.rounds,
      decision: this.decision.slice(),
      stats: {
        thrown: this.player.stats.thrown, landed: this.player.stats.landed, blocked: this.player.stats.blocked,
        dodges: this.player.stats.dodges, counters: this.player.stats.counters, kd: this.player.stats.kd, kdTaken: this.ai.stats.kd,
        maxCombo: this.player.stats.maxCombo,
      },
      durMs: Math.round(this.time * 1000),
      scoreLocal: this.computeScore(),
    }
    this.opts.onEnd && this.opts.onEnd(this.result)
  }
  computeScore() {
    /* نمایش محلی — داوری نهایی با سرور (آینه‌ی v5Boxing) */
    let s = 0
    let chain = 0, chainT = -9
    for (const e of this.punchLog) {
      const P = PUNCH[e.kind]
      if (!P) continue
      if (e.res === 2) {
        s += Math.round(P.score * (e.counter ? 1.6 : 1))
        if (e.t - chainT < 1.1) { chain++; if (chain >= 3) s += 5 } else chain = 1
        chainT = e.t
      } else if (e.res === 1) s += 3
    }
    for (const a of this.atkLog) { if (a.res === 1) s += 4; else if (a.res === 3) s += 6 }
    const kdOpp = this.kdLog.filter((k) => k.who === 1).length
    s += Math.min(3, kdOpp) * 40
    if (this.result ? this.result.verdict : (this.decision[0] > this.decision[1])) s += 120
    return Math.max(0, Math.round(s))
  }
  ev() {
    if (this.mode !== 'spar' || !this.opts.onEvent) return
    /* زمان تله‌متری = میلی‌ثانیه (آینه‌ی TELE) — this.time ثانیه است */
    const a = Array.prototype.slice.call(arguments)
    a[1] = Math.round((Number(a[1]) || 0) * 1000)
    try { this.opts.onEvent.apply(null, a) } catch (e) {}
  }
  destroy() {
    this.player.dispose()
    this.ai.dispose()
  }
}

/* ============================================================
   InputRouter — ژست‌های موبایل + کیبورد
   چپ: drag جلو/عقب • راست: tap=جب، دبل‌تپ=کراس، سوایپ چپ/راست=داوج،
   بالا=آپرکات، پایین=بدن، قطری بالا=هوک، نگه‌داشتن=گارد
   ============================================================ */
export class InputRouter {
  constructor(canvas, hooks) {
    this.hooks = hooks
    this.canvas = canvas
    this._moved = false
    this._sx = 0; this._sy = 0
    this._st = 0
    this._holdTm = 0
    this._holding = false
    this._lastTap = 0
    this._side = 'right'
    this._moving = false
    this._moveAxis = 0
    this._kb = {}
    this.onKeyDown = (e) => {
      if (this._kb[e.code]) return
      this._kb[e.code] = 1
      this.hooks.anyInput && this.hooks.anyInput()
      switch (e.code) {
        case 'KeyJ': hooks.cmd({ t: 'punch', kind: 'jab' }); break
        case 'KeyK': hooks.cmd({ t: 'punch', kind: 'cross' }); break
        case 'KeyU': hooks.cmd({ t: 'punch', kind: 'hookL' }); break
        case 'KeyI': hooks.cmd({ t: 'punch', kind: 'hookR' }); break
        case 'KeyO': hooks.cmd({ t: 'punch', kind: 'upper' }); break
        case 'KeyL': hooks.cmd({ t: 'punch', kind: 'body' }); break
        case 'KeyQ': hooks.cmd({ t: 'dodge', dir: -1 }); break
        case 'KeyE': hooks.cmd({ t: 'dodge', dir: 1 }); break
        case 'Space': hooks.cmd({ t: 'guardOn' }); e.preventDefault(); break
        case 'KeyF': hooks.cmd({ t: 'finisher' }); break
        case 'KeyX': hooks.cmd({ t: 'backstep' }); break
      }
    }
    this.onKeyUp = (e) => { this._kb[e.code] = 0; if (e.code === 'Space') hooks.cmd({ t: 'guardOff' }) }
    window.addEventListener('keydown', this.onKeyDown, { passive: false })
    window.addEventListener('keyup', this.onKeyUp)
    this.pd = (ev) => {
      ev.preventDefault()
      const r = canvas.getBoundingClientRect()
      this._sx = ev.clientX - r.left; this._sy = ev.clientY - r.top
      this._st = performance.now()
      this._moved = false
      this._side = this._sx < r.width * 0.42 ? 'left' : 'right'
      clearTimeout(this._holdTm)
      this._holdTm = setTimeout(() => {
        if (!this._moved && this._st && performance.now() - this._st >= 260) { this._holding = true; hooks.cmd({ t: 'guardOn' }); hooks.haptic && hooks.haptic(8) }
      }, 264)
      /* تپ روی مینی‌گیم ناک‌داون */
      if (this.hooks.knockTap) this.hooks.knockTap()
      hooks.anyInput && hooks.anyInput()
    }
    this.pm = (ev) => {
      if (!this._st) return
      const r = canvas.getBoundingClientRect()
      const x = ev.clientX - r.left, y = ev.clientY - r.top
      const dx = x - this._sx, dy = y - this._sy
      if (Math.abs(dx) > 26 || Math.abs(dy) > 26) {
        if (!this._moved) {
          this._moved = true
          clearTimeout(this._holdTm)
          if (this._holding) { this._holding = false; hooks.cmd({ t: 'guardOff' }) }
          if (this._side === 'left') {
            this._moving = true
            this._moveAxis = Math.max(-1, Math.min(1, dy / 60))
          } else {
            if (Math.abs(dx) > Math.abs(dy)) {
              if (dy < -34) hooks.cmd({ t: 'punch', kind: dx < 0 ? 'hookL' : 'hookR' })
              else hooks.cmd({ t: 'dodge', dir: dx < 0 ? -1 : 1 })
            } else if (dy < 0) hooks.cmd({ t: 'punch', kind: 'upper' })
            else hooks.cmd({ t: 'punch', kind: 'body' })
            this._st = 0
          }
        } else if (this._moving && this._side === 'left') {
          this._moveAxis = Math.max(-1, Math.min(1, dy / 60))
        }
      }
    }
    this.pu = (ev) => {
      clearTimeout(this._holdTm)
      if (this._holding) { this._holding = false; hooks.cmd({ t: 'guardOff' }) }
      if (this._st && !this._moved) {
        const now = performance.now()
        const dt = now - this._st
        if (dt < 260 && this._side === 'right') {
          if (now - this._lastTap < 340) { hooks.cmd({ t: 'punch', kind: 'cross' }); this._lastTap = 0 }
          else { hooks.cmd({ t: 'punch', kind: 'jab' }); this._lastTap = now }
        }
      }
      this._st = 0; this._moving = false; this._moveAxis = 0
    }
    canvas.addEventListener('pointerdown', this.pd, { passive: false })
    canvas.addEventListener('pointermove', this.pm, { passive: false })
    canvas.addEventListener('pointerup', this.pu, { passive: false })
    canvas.addEventListener('pointercancel', this.pu, { passive: false })
    this._kbLoop = setInterval(() => {
      if (this._moving && this._moveAxis) hooks.move(this._moveAxis)
      else if (this._kb['KeyW'] || this._kb['ArrowUp']) hooks.move(-1)
      else if (this._kb['KeyS'] || this._kb['ArrowDown']) hooks.move(1)
    }, 33)
  }
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    clearInterval(this._kbLoop)
    clearTimeout(this._holdTm)
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.pd)
      this.canvas.removeEventListener('pointermove', this.pm)
      this.canvas.removeEventListener('pointerup', this.pu)
      this.canvas.removeEventListener('pointercancel', this.pu)
    }
  }
}

/* ============================================================
   Hud — DOM مینیمال، آپدیت ۱۰ هرتز، transform-only
   ============================================================ */
export class Hud {
  constructor() { this.el = null; this.refs = {}; this._last = {}; this._hudT = 0 }
  mount(container) {
    this.unmount()
    const el = document.createElement('div')
    el.className = 'b5-hud'
    el.innerHTML =
      '<div class="b5-top">' +
      '<div class="b5-name l" id="b5-pn">تو</div>' +
      '<div class="b5-barwrap pl"><div class="b5-bar" id="b5-php"></div><div class="b5-bar" id="b5-pst"></div><div class="b5-bar" id="b5-pmom"></div></div>' +
      '<div class="b5-mid" id="b5-round"></div>' +
      '<div class="b5-barwrap ai"><div class="b5-bar" id="b5-ahp"></div><div class="b5-bar" id="b5-ast"></div></div>' +
      '<div class="b5-name r" id="b5-an">حریف</div>' +
      '</div>' +
      '<div class="b5-clock" id="b5-clock"></div>' +
      '<div class="b5-card" id="b5-card" style="display:none"><div class="b5-card-t" id="b5-card-t"></div><div class="b5-card-s" id="b5-card-s"></div></div>' +
      '<div class="b5-combo" id="b5-combo"></div>' +
      '<div class="b5-coach" id="b5-coach" style="display:none"></div>' +
      '<div class="b5-knock" id="b5-knock" style="display:none"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="b5-kring"/><circle cx="60" cy="60" r="20" class="b5-kzone"/><circle id="b5-kmark" cx="60" cy="8" r="8" class="b5-kmark"/></svg><div class="b5-klabel" id="b5-klabel"></div></div>' +
      '<button class="b5-fin" id="b5-fin" style="display:none">⚡ FINISHER</button>' +
      '<div class="b5-hint" id="b5-hint"></div>'
    container.appendChild(el)
    this.el = el
    const g = (id) => el.querySelector('#' + id)
    this.refs = {
      pn: g('b5-pn'), an: g('b5-an'), php: g('b5-php'), pst: g('b5-pst'), pmom: g('b5-pmom'),
      ahp: g('b5-ahp'), ast: g('b5-ast'), round: g('b5-round'), clock: g('b5-clock'),
      card: g('b5-card'), cardT: g('b5-card-t'), cardS: g('b5-card-s'), combo: g('b5-combo'),
      coach: g('b5-coach'), knock: g('b5-knock'), kmark: g('b5-kmark'), klabel: g('b5-klabel'),
      fin: g('b5-fin'), hint: g('b5-hint'),
    }
  }
  showFighters(pn, an, flag) {
    this.refs.pn.textContent = pn || 'تو'
    this.refs.an.textContent = (flag ? flag + ' ' : '') + (an || 'حریف')
  }
  tick(dt, f) {
    this._hudT -= dt
    if (this._hudT > 0) return
    this._hudT = 0.1
    const r = this.refs
    if (!r.php) return
    const php = Math.max(0.001, f.player.hp / CFG.hpMax)
    const ahp = Math.max(0.001, f.ai.hp / CFG.hpMax)
    const pst = Math.max(0, f.player.st / CFG.stMax)
    const ast = Math.max(0, f.ai.st / CFG.stMax)
    const pmom = Math.max(0, f.player.momentum / 100)
    r.php.style.transform = 'scaleX(' + php.toFixed(3) + ')'
    r.ahp.style.transform = 'scaleX(' + ahp.toFixed(3) + ')'
    r.pst.style.transform = 'scaleX(' + pst.toFixed(3) + ')'
    r.ast.style.transform = 'scaleX(' + ast.toFixed(3) + ')'
    r.pmom.style.transform = 'scaleX(' + pmom.toFixed(3) + ')'
    r.php.classList.toggle('low', php < 0.3)
    r.ahp.classList.toggle('low', ahp < 0.3)
    r.pst.classList.toggle('low', pst < 0.2)
    const rnd = 'راند ' + faN(Math.max(1, f.round)) + '/' + faN(f.rounds)
    if (this._last.round !== rnd) { this._last.round = rnd; r.round.textContent = rnd }
    const cs = '۰:' + faN(String(Math.max(0, Math.ceil(f.clock))).padStart(2, '0'))
    if (this._last.clock !== cs) { this._last.clock = cs; r.clock.textContent = cs }
    const finOk = f.phase === 'FIGHT' && f.player.momentum >= CFG.finisherMom && f.ai.hp <= CFG.finisherHp && !f.finisherUsed
    if (this._last.fin !== finOk) { this._last.fin = finOk; r.fin.style.display = finOk ? '' : 'none' }
  }
  roundCard(t, s, dur) {
    const r = this.refs
    if (!r.card) return
    r.cardT.textContent = t
    r.cardS.textContent = s || ''
    r.card.style.display = ''
    r.card.classList.remove('b5-in'); void r.card.offsetWidth; r.card.classList.add('b5-in')
    clearTimeout(this._cardTm)
    this._cardTm = setTimeout(() => { if (r.card) r.card.style.display = 'none' }, (dur || 2) * 1000)
  }
  comboPop(t, col) {
    const r = this.refs.combo
    if (!r) return
    r.textContent = t
    r.style.color = col || '#ffd75e'
    r.classList.remove('b5-pop'); void r.offsetWidth; r.classList.add('b5-pop')
  }
  coach(line) {
    const r = this.refs.coach
    if (!r) return
    r.textContent = '🧑‍🏫 مربی: ' + line
    r.style.display = ''
    clearTimeout(this._coachTm)
    this._coachTm = setTimeout(() => { if (r) r.style.display = 'none' }, 4200)
  }
  hint(t) { if (this.refs.hint) this.refs.hint.textContent = t || '' }
  knockUI(show, ok, shake) {
    const r = this.refs
    if (!r.knock) return
    r.knock.style.display = show ? '' : 'none'
    r.klabel.textContent = ok ? faN(ok) + '/' + faN(3) + ' — ادامه بده' : 'برای برگشتن — در حلقه بزن!'
    if (shake) { r.klabel.style.color = '#ff8ba0'; setTimeout(() => { if (r.klabel) r.klabel.style.color = '' }, 220) }
  }
  knockRing(pos) {
    if (!this.refs.kmark) return
    const a = pos * Math.PI * 2
    const R = 52
    this.refs.kmark.setAttribute('cx', (60 + Math.cos(a) * R).toFixed(1))
    this.refs.kmark.setAttribute('cy', (60 + Math.sin(a) * R).toFixed(1))
  }
  unmount() {
    clearTimeout(this._cardTm); clearTimeout(this._coachTm)
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el)
    this.el = null
    this.refs = {}
    this._last = {}
  }
}
