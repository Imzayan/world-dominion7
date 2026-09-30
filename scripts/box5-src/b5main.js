/* ============================================================
   BOX5 — b5main: نشست موتور + API عمومی (WD_BOX5) + SPAR رسمی با تله‌متری آینه‌ی سرور
   چرخه‌ی کامل: init/start/pause/resume/stop/dispose — بدون لیک و بدون حلقه‌ی دوم
   ============================================================ */
import * as THREE from 'three'
import { CFG, detectTier, TIERS, AudioEngine, VfxPool, CameraDirector, TimeScale } from './b1core.js'
import { AssetManager, Arena, PLATFORM_Y, Fighter } from './b2scene.js'
import { FightCtl, InputRouter, Hud } from './b3combat.js'
import { StoryCtl, RIVALS, ACTS, levelOf, RANKS } from './b4modes.js'

const faN = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/* ---------- PRNG — آینه‌ی بایت‌به‌بایت داور سرور (olyScore rngOf3) ---------- */
export function seedOf3(str) {
  let h = 2166136261 >>> 0
  const s = String(str || '')
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}
export function rngOf3(seed, salt) {
  let a = seedOf3(seed + ':' + salt) | 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- CSS — یک‌بار تزریق ---------- */
function injectCss() {
  if (document.getElementById('b5-css')) return
  const st = document.createElement('style')
  st.id = 'b5-css'
  st.textContent = `
.b5-wrap{position:absolute;inset:0;overflow:hidden;background:#05070d;border-radius:0 0 18px 18px;z-index:3}
.b5-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.b5-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#cfe0f5;z-index:9;background:radial-gradient(ellipse at 50% 35%,rgba(30,45,80,.55),rgba(5,7,13,.96))}
.b5-load .b5-ring{width:64px;height:64px;border-radius:50%;border:4px solid rgba(255,255,255,.12);border-top-color:#ffd75e;animation:b5spin 1s linear infinite}
@keyframes b5spin{to{transform:rotate(360deg)}}
.b5-load b{font-size:14px}
.b5-loadbar{width:min(280px,70%);height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}
.b5-loadbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd75e,#ff4d6d);transition:width .2s}
.b5-hud{position:absolute;inset:0;pointer-events:none;z-index:5;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff}
.b5-top{position:absolute;top:10px;left:0;right:0;display:flex;align-items:center;gap:8px;padding:0 12px}
.b5-name{font-size:11px;font-weight:800;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis}
.b5-name.l{color:#9fe8ff}.b5-name.r{color:#ff9fb0;text-align:left}
.b5-barwrap{flex:1;display:flex;flex-direction:column;gap:3px}
.b5-bar{height:9px;border-radius:5px;background:rgba(255,255,255,.1);position:relative;overflow:hidden}
.b5-bar i{position:absolute;inset:0;transform-origin:left center;border-radius:5px}
.b5-bar{transform-origin:left center}
#b5-php,#b5-ahp{background:linear-gradient(90deg,#22e06a,#7dff9e);transform-origin:left center}
#b5-php.ai,#b5-ahp.ai,#b5-ahp{transform-origin:right center}
#b5-ahp{background:linear-gradient(90deg,#ff4d6d,#ff8ba0)}
#b5-pst{background:#5ec8ff;height:5px}
#b5-ast{background:#8fb8dd;height:5px}
#b5-pmom{background:linear-gradient(90deg,#ffd75e,#fff2b8);height:4px;opacity:.95}
.b5-bar.low{filter:saturate(1.4) brightness(1.2)}
.b5-bar.low:after{content:'';position:absolute;inset:0;background:rgba(255,60,80,.25);animation:b5low .6s ease-in-out infinite alternate}
@keyframes b5low{to{opacity:.4}}
.b5-mid{font-size:10px;font-weight:800;color:#ffd75e;background:rgba(0,0,0,.35);padding:3px 8px;border-radius:10px;border:1px solid rgba(255,215,94,.3);white-space:nowrap}
.b5-clock{position:absolute;top:52px;left:50%;transform:translateX(-50%);font-size:19px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.7);font-variant-numeric:tabular-nums}
.b5-card{position:absolute;top:26%;left:0;right:0;text-align:center;pointer-events:none}
.b5-card-t{font-size:30px;font-weight:900;letter-spacing:1px;text-shadow:0 4px 24px rgba(0,0,0,.8);color:#fff}
.b5-card-s{font-size:12px;color:#ffd75e;font-weight:700;margin-top:4px}
.b5-card.b5-in{animation:b5card .45s cubic-bezier(.2,1.4,.4,1)}
@keyframes b5card{from{transform:scale(1.6);opacity:0}to{transform:scale(1);opacity:1}}
.b5-combo{position:absolute;top:38%;left:0;right:0;text-align:center;font-size:22px;font-weight:900;opacity:0;pointer-events:none;text-shadow:0 3px 16px rgba(0,0,0,.8)}
.b5-combo.b5-pop{animation:b5pop .8s ease-out}
@keyframes b5pop{0%{transform:scale(1.8);opacity:0}18%{transform:scale(1);opacity:1}70%{opacity:1}100%{transform:translateY(-18px);opacity:0}}
.b5-coach{position:absolute;bottom:76px;left:50%;transform:translateX(-50%);max-width:86%;background:rgba(8,14,26,.82);border:1px solid rgba(255,215,94,.35);border-radius:12px;padding:8px 14px;font-size:12px;font-weight:700;color:#ffe9b3;text-align:center;animation:b5card .4s ease-out}
.b5-hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:11px;font-weight:700;color:#9fb6d4;text-shadow:0 2px 8px rgba(0,0,0,.8)}
.b5-knock{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%);width:150px;height:150px;z-index:6}
.b5-knock svg{width:100%;height:100%}
.b5-kring{fill:none;stroke:rgba(255,255,255,.25);stroke-width:5}
.b5-kzone{fill:rgba(125,255,158,.16);stroke:#7dff9e;stroke-width:2.5}
.b5-kmark{fill:#ffd75e;filter:drop-shadow(0 0 6px rgba(255,215,94,.9))}
.b5-klabel{position:absolute;top:100%;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:800;color:#ffe9b3;background:rgba(8,14,26,.7);padding:4px 10px;border-radius:8px}
.b5-fin{position:absolute;bottom:64px;left:50%;transform:translateX(-50%);pointer-events:auto;background:linear-gradient(90deg,#ff9d2e,#ffd75e);border:none;border-radius:14px;padding:12px 26px;font-size:16px;font-weight:900;color:#3a2200;box-shadow:0 0 24px rgba(255,215,94,.6);animation:b5fin .5s ease-in-out infinite alternate;font-family:inherit}
@keyframes b5fin{to{transform:translateX(-50%) scale(1.08)}}
/* منوها */
.b5-overlay{position:absolute;inset:0;z-index:8;overflow-y:auto;background:linear-gradient(180deg,rgba(5,7,13,.82),rgba(5,7,13,.94));padding:14px 12px 24px;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff;direction:rtl}
.b5-story-menu,.b5-create,.b5-result,.b5-choice{max-width:560px;margin:0 auto}
.b5-story-logo{font-size:26px;font-weight:900;letter-spacing:2px;background:linear-gradient(90deg,#ff4d6d,#ffd75e);-webkit-background-clip:text;background-clip:text;color:transparent;text-align:center}
.b5-story-sub{text-align:center;font-size:11px;color:#9fb6d4;margin:2px 0 12px}
.b5-story-head{text-align:center;margin-bottom:10px}
.b5-story-hero{display:flex;justify-content:space-between;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 14px;margin-bottom:12px;font-size:12px}
.b5-story-hero b{font-size:15px;color:#9fe8ff}
.b5-story-hero span{display:block;color:#ffd75e;font-size:11px}
.b5-story-hero i{color:#7d92ad;font-size:10px;font-style:normal}
.b5-hero-r{text-align:left;color:#cfe0f5;font-size:11px;line-height:1.7}
.b5-acts{display:flex;flex-direction:column;gap:8px}
.b5-act{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px 12px}
.b5-act.open{cursor:pointer}
.b5-act.open:active{transform:scale(.985)}
.b5-act.lock{opacity:.42;filter:grayscale(.6)}
.b5-act.final{border-color:rgba(255,215,94,.45)}
.b5-act-ic{font-size:22px;width:34px;text-align:center}
.b5-act-tx{flex:1;font-size:13px}
.b5-act-tx span{display:block;font-size:10.5px;color:#9fb6d4;margin-top:2px}
.b5-act-xp{font-size:10px;color:#7dff9e;font-weight:800}
.b5-story-tip{font-size:10.5px;color:#7d92ad;text-align:center;margin:12px 0;line-height:1.8}
.b5-story-btns{display:flex;gap:8px;justify-content:center;margin-top:10px}
.b5-btn{background:rgba(126,216,255,.14);color:#cfeaff;border:1px solid rgba(126,216,255,.3);border-radius:12px;padding:10px 18px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}
.b5-btn.gold{background:linear-gradient(90deg,#ff9d2e,#ffd75e);color:#3a2200;border:none;box-shadow:0 4px 18px rgba(255,180,60,.3)}
.b5-btn.ghost{background:rgba(255,255,255,.06);color:#9fb6d4;border-color:rgba(255,255,255,.14)}
.b5-create{background:rgba(10,16,30,.9);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(92%,420px);z-index:9}
.b5-create h3{margin:0 0 6px;font-size:17px;color:#ffd75e}
.b5-create-p{font-size:11.5px;color:#9fb6d4;margin:0 0 12px}
.b5-create input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;font-weight:700;font-family:inherit;margin-bottom:10px}
.b5-swatch-row{display:flex;gap:7px;margin-bottom:10px;flex-wrap:wrap}
.b5-swatch-row button{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.2);cursor:pointer}
.b5-swatch-row button.on{border-color:#ffd75e;box-shadow:0 0 10px rgba(255,215,94,.7)}
.b5-cine-card{position:absolute;bottom:18%;left:0;right:0;text-align:center;font-size:14px;font-weight:800;color:#eaf6ff;text-shadow:0 3px 14px rgba(0,0,0,.9);z-index:6;padding:0 20px;animation:b5card .5s ease-out}
.b5-skip{position:absolute;top:14px;left:14px;z-index:9;background:rgba(0,0,0,.5);color:#cfe0f5;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
.b5-result{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(5,7,13,.7);direction:rtl}
.b5-result-in{background:rgba(10,16,30,.95);border:1px solid rgba(255,215,94,.35);border-radius:20px;padding:22px;max-width:min(92%,440px);text-align:center;animation:b5card .45s cubic-bezier(.2,1.4,.4,1)}
.b5-res-big{font-size:26px;font-weight:900;margin-bottom:4px}
.b5-res-sub{font-size:12px;color:#ffd75e;font-weight:700;margin-bottom:10px}
.b5-res-stats{font-size:11.5px;color:#cfe0f5;line-height:1.9;margin-bottom:8px}
.b5-res-xp{font-size:15px;color:#7dff9e;font-weight:900;margin:6px 0}
.b5-res-quote{font-size:11px;color:#9fb6d4;margin:8px 0 4px;line-height:1.8}
.b5-choice{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(5,7,13,.72);direction:rtl;padding:12px}
.b5-choice-in{background:rgba(10,16,30,.95);border:1px solid rgba(255,215,94,.35);border-radius:20px;padding:20px;max-width:min(94%,480px);text-align:center;animation:b5card .45s cubic-bezier(.2,1.4,.4,1)}
.b5-coach-face{font-size:34px;margin-bottom:6px}
.b5-choice-in h3{font-size:13.5px;color:#ffe9b3;margin:0 0 8px;line-height:1.8}
.b5-choice-p{font-size:11.5px;color:#9fb6d4;margin:0 0 14px}
.b5-choice-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.b5-prof{max-width:560px;margin:0 auto;font-family:Vazirmatn,system-ui,sans-serif;color:#eaf6ff;direction:rtl;font-size:12px}
.b5-prof h3{color:#ffd75e;font-size:15px;margin:6px 0}
.b5-prof .row{display:flex;justify-content:space-between;background:rgba(255,255,255,.05);border-radius:10px;padding:8px 12px;margin-bottom:6px;border:1px solid rgba(255,255,255,.08)}
.b5-prof .row b{color:#9fe8ff}
`
  document.head.appendChild(st)
}

/* ---------- نشست ---------- */
const Session = {
  state: 'idle', /* idle|loading|ready|running|paused|closed */
  wrap: null, canvas: null, overlay: null,
  arena: null, assets: null, audio: null, vfx: null, cam: null, ts: null, hud: null,
  tier: null, tierIdx: 1,
  fight: null, story: null, input: null, sceneFighters: [], onTick: null,
  fpsAcc: 0, fpsN: 0, fps: 60, adaptT: 0, adaptDown: 0, adaptUp: 0,
  _lastT: 0, _tickBound: false, _resizeObs: null, _visBound: false, _closeHookPrev: null,
  sparDone: null, storyCtl: null,
}

function ensureArena(onProgress) {
  const S = Session
  if (S.arena) return Promise.resolve()
  S.state = 'loading'
  S.assets = new AssetManager()
  S.arena = new Arena(S.canvas)
  S.arena.buildLights()
  S.audio = new AudioEngine()
  S.ts = new TimeScale()
  S.tierIdx = detectTier()
  S.tier = TIERS[S.tierIdx]
  const ringP = S.arena.buildRing(S.assets, (p) => setLoad(onProgress, p * 0.62))
  const boxP = S.assets.load('boxer', '/game/assets/box/boxer.glb', (p) => setLoad(onProgress, 0.62 + p * 0.38))
  return Promise.all([ringP, boxP]).then(() => {
    S.arena.buildCrowd(S.tier.crowd)
    S.arena.buildDressing()
    S.arena.applyTier(S.tier)
    S.vfx = new VfxPool(S.arena.scene, S.tier.particles)
    S.cam = new CameraDirector(S.arena.camera)
    S.hud = new Hud()
    S.state = 'ready'
  })
}
function setLoad(cb, p) { try { cb && cb(Math.min(1, p)) } catch (e) {} }

function mountWrap(container, clear) {
  const S = Session
  injectCss()
  if (clear && container) container.innerHTML = '' /* باقی‌مانده‌ی شمارش/کارت پاک — تجربه‌ی ۳D مالک صحنه است */
  if (!S.wrap) {
    S.wrap = document.createElement('div')
    S.wrap.className = 'b5-wrap'
    S.canvas = document.createElement('canvas')
    S.wrap.appendChild(S.canvas)
  }
  container.appendChild(S.wrap)
  S.overlay = document.createElement('div')
  S.overlay.className = 'b5-overlay'
  S.overlay.style.display = 'none'
  S.wrap.appendChild(S.overlay)
  if (!S._resizeObs) {
    S._resizeObs = new ResizeObserver(() => resize())
    S._resizeObs.observe(S.wrap)
  }
  resize()
}
function resize() {
  const S = Session
  if (!S.arena || !S.wrap) return
  const r = S.wrap.getBoundingClientRect()
  const w = Math.max(1, r.width | 0), h = Math.max(1, r.height | 0)
  S.arena.renderer.setSize(w, h, false)
  S.arena.camera.aspect = w / h
  S.arena.camera.updateProjectionMatrix()
}
function bindGlobal() {
  const S = Session
  if (S._tickBound) return
  S._tickBound = true
  const A = window.WD33_API
  /* تک‌حلقه — فقط یک chain rAF */
  A.loop33(function (t) {
    if (S.state !== 'running' && S.state !== 'paused') return
    if (S.state === 'paused') { S._lastT = t; return }
    tick(t)
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause()
    else resume()
  })
  S.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); pause(); try { Session.hud && Session.hud.roundCard('⚠️ خطای گرافیک', 'در حال بازیابی…', 2) } catch (er) {} })
  S.canvas.addEventListener('webglcontextrestored', () => { try { resize(); resume() } catch (er) {} })
  /* بستن استیج = تخریب کامل نشست */
  S._closeHookPrev = window.WD33_ONCLOSE || null
  window.WD33_ONCLOSE = function () {
    try { fullDispose() } catch (e) {}
    try { if (S._closeHookPrev) S._closeHookPrev() } catch (e) {}
  }
}
function tick(t) {
  const S = Session
  const dtReal = Math.min(0.05, (t - (S._lastT || t)) / 1000 || 0.016)
  S._lastDt = Math.round(dtReal * 1000)
  S._lastT = t
  const dt = S.ts.update(dtReal) * dtReal
  /* FPS monitor (زمان واقعی — نه dt سقف‌خورده) + کیفیت تطبیقی */
  const nowMs = performance.now()
  if (!S._fpsT0) { S._fpsT0 = nowMs; S._fpsN = 0 }
  S._fpsN++
  if (nowMs - S._fpsT0 >= 1000) {
    S.fps = Math.round(S._fpsN * 1000 / (nowMs - S._fpsT0))
    S._fpsT0 = nowMs; S._fpsN = 0
    adaptQuality()
  }
  const f = S.fight
  if (f) {
    f.update(dtReal)
    S.hud.tick(dtReal, f)
    S.cam.update(dtReal, { player: f.player, ai: f.ai, finalRound: f.round >= f.rounds })
  } else {
    /* صحنه‌ی منو/سینما */
    if (S.onTick) S.onTick(dtReal)
    S.cam.update(dtReal, { player: S.sceneFighters[0] || { pos: new THREE.Vector3(-1, PLATFORM_Y, 0) }, ai: S.sceneFighters[1] || { pos: new THREE.Vector3(1, PLATFORM_Y, 0) }, finalRound: false })
  }
  for (const fr of S.sceneFighters) fr.update(dt)
  S.vfx.update(dt)
  S.arena.updateCrowd(dtReal)
  S.audio.update(dtReal)
  try { S.arena.renderer.render(S.arena.scene, S.arena.camera) } catch (e) {}
}
function adaptQuality() {
  const S = Session
  S.adaptT++
  if (S.adaptT < 3) return
  S.adaptT = 0
  if (S.fps < 27 && S.tierIdx > 0 && S.adaptDown < 2) {
    S.tierIdx--; S.tier = TIERS[S.tierIdx]; S.arena.applyTier(S.tier); S.adaptDown++
    if (S.vfx) S.vfx.cap = S.tier.particles
  } else if (S.fps > 56 && S.adaptUp === 0 && S.tierIdx < 3) {
    S.tierIdx++; S.tier = TIERS[S.tierIdx]; S.arena.applyTier(S.tier); S.adaptUp++
    if (S.vfx) S.vfx.cap = S.tier.particles
  }
}
function pause() {
  const S = Session
  if (S.state === 'running') {
    S.state = 'paused'
    if (S.fight) S.fight.paused = true
    S.audio && S.audio.suspend()
  }
}
function resume() {
  const S = Session
  if (S.state === 'paused') {
    S.state = 'running'
    if (S.fight) S.fight.paused = false
    S.audio && S.audio.resume()
    S._lastT = 0
  }
}
function fullDispose() {
  const S = Session
  if (S.state === 'closed') return
  S.state = 'closed'
  try { S.input && S.input.dispose() } catch (e) {}
  try { S.fight && S.fight.destroy() } catch (e) {}
  S.fight = null
  try { clearSceneFighters() } catch (e) {}
  try { S.hud && S.hud.unmount() } catch (e) {}
  try { S.audio && S.audio.suspend() } catch (e) {}
  try { if (S.wrap && S.wrap.parentNode) S.wrap.parentNode.removeChild(S.wrap) } catch (e) {}
  S.onTick = null; S.storyCtl = null; S.sparDone = null
}
function clearSceneFighters() {
  for (const f of Session.sceneFighters) { try { f.dispose() } catch (e) {} }
  Session.sceneFighters = []
}

/* محیطی که به FightCtl/StoryCtl/TrainingCtl داده می‌شود */
function env() {
  const S = Session
  return {
    arena: S.arena, assets: S.assets, audio: S.audio, vfx: S.vfx, cam: S.cam, ts: S.ts, hud: S.hud,
    tier: S.tier,
    sndK2: (k) => { try { window.WD33_API.sndK2(k) } catch (e) {} },
    haptic: (ms) => { try { navigator.vibrate && navigator.vibrate(ms) } catch (e) {} },
    rpc: async (fn, args) => {
      try {
        if (!window.sb) return null
        const r = await window.sb.rpc(fn, args)
        if (r && r.error) return null
        return r ? r.data : null
      } catch (e) { return null }
    },
    beginScene: (container) => beginScene(container),
    endScene: () => endScene(),
    hubContainer: () => Session.overlay,
    attachInput: (fight) => attachInput(fight),
    detachInput: () => detachInput(),
  }
}
function beginScene(container) {
  const S = Session
  S.fight = null
  clearSceneFighters()
  S.overlay.style.display = 'none'
  S.hud.unmount()
  S.hud.mount(S.wrap)
  S.cam.to('GAMEPLAY', 0)
  S.audio.setMode('gameplay')
  return {
    fighter: (side, opts) => {
      const f = new Fighter(S.arena, S.assets, Object.assign({ side }, opts))
      S.sceneFighters.push(f)
      return f
    },
    canvas: S.canvas,
    set onTick(fn) { S.onTick = fn },
    get onTick() { return S.onTick },
  }
}
function endScene() {
  const S = Session
  clearSceneFighters()
  S.onTick = null
  S.hud.unmount()
  S.overlay.style.display = ''
  S.audio.setMode('menu')
}

/* ============================================================
   SPAR — مسابقه‌ی رسمی (تله‌متری → داور v5Boxing سرور)
   ورودی sync: true/false — راه‌اندازی async داخل خودش
   ============================================================ */
function openSpar(container, done) {
  const S = Session
  const A = window.WD33_API
  if (!supported()) return false
  if (S.state === 'running' && S.fight) return true
  mountWrap(container, true)
  bindGlobal()
  S.sparDone = done
  S.state = 'loading'
  const load = document.createElement('div')
  load.className = 'b5-load'
  load.innerHTML = '<div class="b5-ring"></div><b>🏟 ورود به حلقه…</b><div class="b5-loadbar"><i id="b5-lb"></i></div>'
  container.appendChild(load)
  const lb = () => container.querySelector('#b5-lb')
  ;(async () => {
    try {
      await ensureArena((p) => { const e = lb(); if (e) e.style.width = Math.round(p * 100) + '%' })
    } catch (e) {
      console.log('b5load', e)
      try { load.remove() } catch (e2) {}
      try { done && done(0) } catch (e2) {}
      return
    }
    try { load.remove() } catch (e2) {}
    try {
      const seed = (A.MATCH && A.MATCH.seed) || 'box5'
      S.hud.mount(S.wrap)
      S.state = 'running'
      S._lastT = 0
      S.fight = new FightCtl(env(), {
        mode: 'spar',
        seed,
        seedRng: rngOf3(seed, 'plan'),
        rounds: 3, roundLen: 30, restLen: 4,
        aiProfile: sparProfile(seed),
        aiDiff: 1,
        rng: rngOf3(seed, 'jitter'),
        playerTint: 0xffffff, playerGloves: 0xd8232a, playerShorts: 0x1a1a1a,
        playerName: 'تو',
        spar: true,
        onEvent: function () { try { A.TELE.ev.apply(A.TELE, arguments) } catch (e) {} },
        onEnd: (res) => onSparEnd(res),
      })
      attachInput(S.fight)
      try { A.TELE.ev('v5', 0, 3) } catch (e) {}
      S.fight.start()
    } catch (e) {
      console.log('b5spar-init', e)
      S.state = 'ready'
      try { done && done(0) } catch (e2) {}
    }
  })()
  return true
}
function sparProfile(seed) {
  /* رقیبِ سپار: متعادل با تغییرات seed — داور همان را از seed می‌سازد */
  const r = rngOf3(seed, 'prof')
  const base = { name: 'حریف سپار', tint: 0x9aa7b8, gloves: 0xb0122a, shorts: 0x111827, aggr: 0.55 + r() * 0.2, guard: 0.5 + r() * 0.2, dodge: 0.35 + r() * 0.2, counter: 0.4 + r() * 0.2, stamEff: 0.6, combo: 0.35 + r() * 0.2, adapt: 0.4 }
  return base
}
function onSparEnd(res) {
  const S = Session
  /* تخریب نبرد و بازگرداندن امتیاز به پوسته (shell خودش صفحه‌ی نتیجه + ارسال دارد) */
  const score = res.scoreLocal
  try { S.input && S.input.dispose() } catch (e) {}
  S.input = null
  S.fight = null
  clearSceneFighters()
  S.hud.unmount()
  S.audio.setMode('menu')
  S.state = 'ready'
  const d = S.sparDone
  S.sparDone = null
  /* پوسته محتوای bd را عوض می‌کند — wrap ما حذف می‌شود؛ Arena در حافظه کش می‌ماند */
  if (S.wrap && S.wrap.parentNode) S.wrap.parentNode.removeChild(S.wrap)
  try { d && d(score) } catch (e) { try { d && d(0) } catch (e2) {} }
}

/* ============================================================
   STORY — منوی کمپین
   ============================================================ */
async function openStory(container) {
  const S = Session
  if (!supported()) { return false }
  mountWrap(container, true)
  bindGlobal()
  S.state = 'loading'
  const load = document.createElement('div')
  load.className = 'b5-load'
  load.innerHTML = '<div class="b5-ring"></div><b>🏟 استادیوم المپیک…</b><div class="b5-loadbar"><i id="b5-lb"></i></div>'
  container.appendChild(load)
  const lb = () => container.querySelector('#b5-lb')
  try { await ensureArena((p) => { const e = lb(); if (e) e.style.width = Math.round(p * 100) + '%' }) } catch (e) { console.log('b5load', e); load.remove(); return false }
  load.remove()
  S.state = 'running'
  S._lastT = 0
  /* پس‌زمینه‌ی زنده: حلقه‌ی خالی با دوربین آرام */
  S.cam.to('INTRO', 99)
  S.audio.setMode('menu')
  const prof = await env().rpc('boxing_load', {})
  const save = (prof && prof.ok && prof.profile) ? prof.profile : { act: 0, actClear: [], xp: 0, wins: 0, losses: 0, kos: 0, counters: 0, dodges: 0, gloves: 0xd8232a, shorts: 0x1a1a1a, name: '' }
  S.hud.mount(S.wrap)
  S.overlay.style.display = ''
  S.storyCtl = new StoryCtl(env(), save, () => {})
  S.storyCtl.renderMenu(S.overlay)
  return true
}

/* ============================================================
   PROFILE — کارت بوکس (DOM سبک)
   ============================================================ */
async function openProfile(container) {
  injectCss()
  const el = document.createElement('div')
  el.className = 'b5-prof'
  el.innerHTML = '<h3>🥊 پروفایل بوکس</h3><div id="b5-prof-in">⏳ …</div>'
  container.appendChild(el)
  const box = el.querySelector('#b5-prof-in')
  const r = await (async () => { try { if (!window.sb) return null; const x = await window.sb.rpc('boxing_load', {}); return (x && !x.error) ? x.data : null } catch (e) { return null } })()
  if (!r || !r.ok || !r.profile) { box.innerHTML = '<div class="row"><span>کمپین «دور آخر» را شروع نکرده‌ای</span><b>—</b></div><div style="font-size:11px;color:#7d92ad">از کارت بوکس، «داستان: دور آخر» را باز کن.</div>'; return el }
  const p = r.profile
  const lv = levelOf(p.xp || 0)
  box.innerHTML =
    '<div class="row"><span>بوکسور</span><b>' + esc(p.name || '—') + '</b></div>' +
    '<div class="row"><span>رتبه</span><b>' + esc(RANKS[Math.min(5, lv - 1)]) + ' • سطح ' + faN(lv) + '</b></div>' +
    '<div class="row"><span>کارنامه</span><b>' + faN(p.wins || 0) + ' برد / ' + faN(p.losses || 0) + ' باخت</b></div>' +
    '<div class="row"><span>ناک‌اوت / کانتر / داوج</span><b>' + faN(p.kos || 0) + ' / ' + faN(p.counters || 0) + ' / ' + faN(p.dodges || 0) + '</b></div>' +
    '<div class="row"><span>XP</span><b>' + faN(p.xp || 0) + '</b></div>' +
    '<div class="row"><span>پرده‌ی جاری «دور آخر»</span><b>' + faN(p.act || 0) + ' از ۵</b></div>'
  return el
}

/* ---------- ورودی + پشتیبانی ---------- */
function attachInput(fight) {
  const S = Session
  if (S.input) { try { S.input.dispose() } catch (e) {} }
  S.input = new InputRouter(S.canvas, {
    cmd: (c) => { if (S.fight) S.fight.command(c) },
    move: (ax) => { if (S.fight) S.fight.movePlayer(ax) },
    knockTap: () => { if (S.fight && S.fight.phase === 'KD') S.fight.knockTap() },
    anyInput: () => {
      /* CONTROL ALWAYS WINS — اولین ورودی، دوربین را به گیم‌پلی برمی‌گرداند */
      if (S.fight && S.fight.phase === 'FIGHT' && S.cam.state !== 'GAMEPLAY') S.cam.gameplay()
      S.audio && S.audio.resume()
    },
    haptic: (ms) => { try { navigator.vibrate && navigator.vibrate(ms) } catch (e) {} },
  })
  try {
    S.hud.refs.fin.addEventListener('click', (e) => { e.stopPropagation(); S.fight && S.fight.command({ t: 'finisher' }) })
  } catch (e) {}
}
function detachInput() {
  const S = Session
  if (S.input) { try { S.input.dispose() } catch (e) {} }
  S.input = null
}
function supported() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch (e) { return false }
}

/* ---------- API عمومی ---------- */
window.WD_BOX5 = {
  openSpar,
  openStory,
  openProfile,
  supported,
  pause,
  resume,
  dispose: fullDispose,
  version: 5,
  _debug: () => ({ state: Session.state, phase: Session.fight ? Session.fight.phase : null, round: Session.fight ? Session.fight.round : null, clock: Session.fight ? Math.round(Session.fight.clock * 10) / 10 : null, time: Session.fight ? Math.round(Session.fight.time * 10) / 10 : null, cam: Session.cam ? Session.cam.state : null, fps: Session.fps, tier: Session.tier ? Session.tier.name : null, lastDt: Session._lastDt, now: Math.round(performance.now()) }),
}
