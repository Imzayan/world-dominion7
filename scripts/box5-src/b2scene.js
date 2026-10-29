/* ============================================================
   BOX5 — b2scene: AssetManager + صحنه‌ی آرنا (ring GLB + جمعیت نمونه‌ای + پرچم + نور) + Fighter (ریگ + لایه‌ی انیمیشن رویه‌ای)
   ============================================================ */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { PUNCH, PUNCH_LIST, CFG } from './b1core.js'

/* ---------- AssetManager: load/cache/get/release — lazy و با progress ---------- */
export class AssetManager {
  constructor() { this.cache = {}; this.refs = {} }
  load(key, url, onProgress) {
    if (this.cache[key]) { this.refs[key] = (this.refs[key] || 0) + 1; return Promise.resolve(this.cache[key]) }
    if (!this._loader) this._loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    return new Promise((res, rej) => {
      this._loader.load(url, (gltf) => { this.cache[key] = gltf; this.refs[key] = (this.refs[key] || 0) + 1; res(gltf) },
        (ev) => { if (onProgress && ev.total) onProgress(ev.loaded / ev.total) },
        (err) => rej(err))
    })
  }
  release(key) { /* GLB‌ها بین نشست‌ها کش می‌مانند (ورود مجدد = صفر بارگذاری) — آزادسازی واقعی فقط با disposeAll */ }
  disposeAll() {
    for (const k in this.cache) {
      const g = this.cache[k]
      g.scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { for (const t in m) { if (m[t] && m[t].isTexture) m[t].dispose() } ; m.dispose() }) }
      })
      delete this.cache[k]
    }
  }
}

/* ---------- Arena: صحنه‌ی المپیک — یک‌بار ساخته می‌شود و بین نشست‌ها کش می‌ماند ---------- */
export const PLATFORM_Y = 0.855 /* سطح تشک پس از scale ۰.۹۵ — از سنجش هندسه‌ی GLB */
export const RING_HALF = 3.1 /* محدوده‌ی مجاز حرکت داخل طناب‌ها */
export class Arena {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x05070d)
    this.scene.fog = new THREE.Fog(0x05070d, 14, 34)
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80)
    this.camera.position.set(0, 2.2, 7.5)
    this.root = new THREE.Group()
    this.scene.add(this.root)
    this.ringGroup = null
    this.crowd = null
    this.crowdData = null
    this.flags = []
    this.screens = []
    this.lights = null
    this._crowdCursor = 0
    this.excite = 0
  }
  applyTier(t) {
    const r = this.renderer
    r.setPixelRatio(Math.min(t.dpr, window.devicePixelRatio || 1))
    this.tier = t
    if (this.lights) {
      this.lights.key.castShadow = t.shadow
      if (t.shadow) { this.lights.key.shadow.mapSize.set(t.shRes, t.shRes); if (this.lights.key.shadow.map) { this.lights.key.shadow.map.dispose(); this.lights.key.shadow.map = null } }
    }
    if (this.scene) this.scene.fog = t.fog ? this.scene.fog || new THREE.Fog(0x05070d, 14, 34) : null
    if (this.crowd) this.crowd.count = Math.min(t.crowd, this.crowdMax)
    if (this.flags) this.flags.forEach((f, i) => { f.visible = i < t.flags })
  }
  /* نور: ۱ کلیدی + ۲ کمکی ارزان + محیطی — بدون آبشار سایه */
  buildLights() {
    const hemi = new THREE.HemisphereLight(0x9db4d8, 0x1a1410, 0.75)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff2d8, 1.6)
    key.position.set(4, 9, 3)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -5; key.shadow.camera.right = 5
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5
    key.shadow.camera.far = 22
    key.shadow.bias = -0.0015
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x88b6ff, 0.55)
    rim.position.set(-6, 4, -5)
    this.scene.add(rim)
    const spotGlow = new THREE.PointLight(0xffe9c4, 0.9, 9, 2)
    spotGlow.position.set(0, 5.4, 0)
    this.scene.add(spotGlow)
    this.lights = { hemi, key, rim, spotGlow }
  }
  /* حلقه‌ی بوکس از GLB واقعی — auto-fit */
  async buildRing(assets, onProgress) {
    const gltf = await assets.load('ring', '/game/assets/box/ring.glb', onProgress)
    const g = new THREE.Group()
    const model = skClone(gltf.scene)
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true
        if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { m.envMapIntensity = 0.5 }) }
      }
    })
    g.add(model)
    const box = new THREE.Box3().setFromObject(model)
    const w = box.max.x - box.min.x
    const s = (7.5 / w) * 0.95
    model.scale.setScalar(s)
    model.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s)
    this.root.add(g)
    this.ringGroup = g
    /* شعاع تماس روی تشک */
    return g
  }
  /* جمعیت: InstancedMesh (بدنه+سر جوش‌خورده) + رنگ per-instance + bob گردشی ارزان */
  buildCrowd(count) {
    this.crowdMax = count
    const body = new THREE.CylinderGeometry(0.16, 0.22, 0.55, 5, 1)
    body.translate(0, 0.28, 0)
    const head = new THREE.SphereGeometry(0.13, 5, 4)
    head.translate(0, 0.68, 0)
    const geo = mergeGeos([body, head])
    const mat = new THREE.MeshLambertMaterial({ vertexColors: false })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const data = new Float32Array(count * 3) /* phase, amp, rand */
    let i = 0
    /* ۴ سکو در ۴ جهت — چیدمان قطبی */
    for (let si = 0; si < 4 && i < count; si++) {
      const ang0 = si * Math.PI / 2
      const perSide = Math.floor(count / 4)
      for (let r = 0; r < 8 && i < count; r++) {
        const rowY = 0.6 + r * 0.85
        const rr = 10.4 + r * 0.92
        const perRow = Math.ceil(perSide / 8)
        for (let c = 0; c < perRow && i < count; c++) {
          const tt = (c - perRow / 2) * 0.62 + (Math.random() - 0.5) * 0.18
          dummy.position.set(Math.sin(ang0) * rr + Math.cos(ang0) * tt, rowY, Math.cos(ang0) * rr + Math.sin(ang0) * tt)
          dummy.rotation.y = ang0 + Math.PI + (Math.random() - 0.5) * 0.2
          dummy.scale.setScalar(0.9 + Math.random() * 0.25)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
          col.setHSL(0.55 + Math.random() * 0.35, 0.35 + Math.random() * 0.3, 0.28 + Math.random() * 0.3)
          mesh.setColorAt(i, col)
          data[i * 3] = Math.random() * 6.28
          data[i * 3 + 1] = 0.6 + Math.random() * 0.5
          data[i * 3 + 2] = Math.random()
          i++
        }
      }
    }
    mesh.count = i
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    this.root.add(mesh)
    this.crowd = mesh
    this.crowdData = data
    /* سکوهای تماشاگر (جعبه‌های ساده) */
    const standMat = new THREE.MeshLambertMaterial({ color: 0x141a26 })
    for (let si = 0; si < 4; si++) {
      const ang = si * Math.PI / 2
      const st = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.5, 8.4), standMat)
      st.position.set(Math.sin(ang) * 12.4, 3.2, Math.cos(ang) * 12.4)
      st.rotation.y = ang + Math.PI
      st.rotation.x = -0.42
      this.root.add(st)
    }
    return mesh
  }
  /* پرچم‌ها + تابلوهای بزرگ + نورپردازی ورود */
  buildDressing(flagCountries) {
    /* پرچم‌های ساده‌ی نوارچه — یک canvas اتلاس، ۶ quad */
    const cv = document.createElement('canvas')
    cv.width = 512; cv.height = 128
    const c = cv.getContext('2d')
    const palettes = [['#e02020', '#ffffff', '#e02020'], ['#0055a4', '#ffffff', '#ef4135'], ['#12ad2b', '#fcd116', '#ce1126'], ['#ffffff', '#0038a8', '#d52b1e'], ['#0072ce', '#ffffff', '#0072ce'], ['#046a38', '#ffffff', '#046a38']]
    palettes.forEach((p, i) => {
      c.fillStyle = p[0]; c.fillRect(i * 85, 0, 85, 42)
      c.fillStyle = p[1]; c.fillRect(i * 85, 42, 85, 44)
      c.fillStyle = p[2]; c.fillRect(i * 85, 86, 85, 42)
    })
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    const fmat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + 0.3
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), fmat)
      f.position.set(Math.sin(ang) * 8.6, 6.4 + (i % 3) * 0.7, Math.cos(ang) * 8.6)
      f.rotation.y = ang + Math.PI / 2
      f.userData.ph = Math.random() * 6.28
      this.root.add(f)
      this.flags.push(f)
    }
    /* تابلوهای بزرگ — تکسچر استاتیک (بدون بازنویسی per-frame) */
    const scv = document.createElement('canvas')
    scv.width = 512; scv.height = 160
    const s = scv.getContext('2d')
    const grad = s.createLinearGradient(0, 0, 512, 0)
    grad.addColorStop(0, '#0a1428'); grad.addColorStop(0.5, '#16294d'); grad.addColorStop(1, '#0a1428')
    s.fillStyle = grad; s.fillRect(0, 0, 512, 160)
    s.fillStyle = '#ffd75e'; s.font = 'bold 44px sans-serif'; s.textAlign = 'center'
    s.fillText('WORLD DOMINION', 256, 62)
    s.fillStyle = '#ff4d6d'; s.font = 'bold 58px sans-serif'
    s.fillText('THE LAST ROUND', 256, 126)
    const stex = new THREE.CanvasTexture(scv)
    stex.colorSpace = THREE.SRGBColorSpace
    for (const zz of [-1, 1]) {
      const smat = new THREE.MeshBasicMaterial({ map: stex })
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.2), smat)
      sc.position.set(zz * 0.001 + (zz < 0 ? -7.6 : 7.6), 5.6, zz * 0.001)
      sc.position.set(zz < 0 ? -7.8 : 7.8, 5.6, 0)
      sc.rotation.y = zz < 0 ? Math.PI / 2 : -Math.PI / 2
      this.root.add(sc)
      this.screens.push(sc)
    }
    /* کف سالن */
    const floor = new THREE.Mesh(new THREE.CircleGeometry(20, 28), new THREE.MeshLambertMaterial({ color: 0x0b101c }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.02
    floor.receiveShadow = true
    this.root.add(floor)
    /* حلقه‌های المپیک‌نما بالای حلقه */
    const rings = new THREE.Group()
    const rcols = [0x4d9fff, 0xffd75e, 0x111111, 0x4ddf7d, 0xff4d4d]
    for (let i = 0; i < 5; i++) {
      const tor = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 6, 18), new THREE.MeshBasicMaterial({ color: rcols[i] }))
      tor.position.set((i - 2) * 0.95, 0, 0)
      rings.add(tor)
    }
    rings.position.set(0, 7.6, -8.2)
    this.root.add(rings)
  }
  setFinalArena(big) { /* فینال: نور و فضای بزرگ‌تر */
    if (this.lights) { this.lights.spotGlow.intensity = big ? 1.5 : 0.9; this.lights.hemi.intensity = big ? 0.9 : 0.75 }
    if (this.scene.fog) { this.scene.fog.far = big ? 44 : 34 }
  }
  updateCrowd(dt) {
    if (!this.crowd) return
    const t = this.t = (this.t || 0) + dt
    const d = this.crowdData
    const bob = (this.tier ? this.tier.crowdBob : 1) * (0.6 + this.excite * 1.3)
    const n = this.crowd.count
    /* هر فریم فقط ۱/۸ جمعیت — هزینه‌ی CPU کم و پایدار */
    const step = 8
    for (let k = 0; k < step; k++) {
      const i = this._crowdCursor = (this._crowdCursor + 1) % n
      const ph = d[i * 3], amp = d[i * 3 + 1]
      this.crowd.getMatrixAt(i, this._md || (this._md = new THREE.Matrix4()))
      const e = this._md.elements
      e[13] += Math.sin(t * (2.2 + d[i * 3 + 2]) + ph) * 0.05 * amp * bob
      this.crowd.setMatrixAt(i, this._md)
    }
    this.crowd.instanceMatrix.needsUpdate = true
    this.flags.forEach((f, i) => { f.rotation.z = Math.sin(t * 1.6 + f.userData.ph) * 0.08 })
    this.excite = Math.max(0, this.excite - dt * 0.25)
  }
  exciteBump(v) { this.excite = Math.min(1.6, this.excite + v) }
  dispose() {
    /* آزادسازی کامل — صحنه از نو ساخته می‌شود (تغییر کیفیت/خروج نهایی) */
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { for (const t in m) { if (m[t] && m[t].isTexture) m[t].dispose() } ; m.dispose() }) }
    })
    try { this.renderer.dispose() } catch (e) {}
    this.scene.clear()
  }
}

/* ---------- mergeGeos — ادغام ساده‌ی دو BufferGeometry بدون وابستگی ---------- */
function mergeGeos(list) {
  let vTotal = 0, iTotal = 0, hasIdx = true
  for (const g of list) { vTotal += g.attributes.position.count; iTotal += g.index ? g.index.count : g.attributes.position.count; if (!g.index) hasIdx = false }
  const pos = new Float32Array(vTotal * 3), nor = new Float32Array(vTotal * 3), uv = new Float32Array(vTotal * 2)
  const idx = new Uint16Array(iTotal)
  let vo = 0, io = 0
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv
    pos.set(p.array, vo * 3)
    if (n) nor.set(n.array, vo * 3)
    if (u) uv.set(u.array, vo * 2)
    const c = g.index ? g.index.array : null
    const cnt = c ? c.length : g.attributes.position.count
    for (let i = 0; i < cnt; i++) idx[io + i] = (c ? c[i] : i) + vo
    vo += g.attributes.position.count; io += cnt
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  out.setIndex(new THREE.BufferAttribute(idx, 1))
  return out
}

/* ============================================================
   Fighter — ریگ ورزشکار + لایه‌ی انیمیشن رویه‌ای نبرد
   پایه: کلیپ Mixamo (footwork) — پانچ/داوج/گارد/ضربه/ناک‌داون: رویه‌ای روی استخوان
   ============================================================ */
const BONE_KEYS = {
  hips: 'Hips_', spine: 'Spine_', spine1: 'Spine1_', spine2: 'Spine2_',
  neck: 'Neck_', head: 'Head_',
  lSho: 'LeftShoulder_', lArm: 'LeftArm_', lFore: 'LeftForeArm_', lHand: 'LeftHand_',
  rSho: 'RightShoulder_', rArm: 'RightArm_', rFore: 'RightForeArm_', rHand: 'RightHand_',
  lUpLeg: 'LeftUpLeg_', rUpLeg: 'RightUpLeg_', lLeg: 'LeftLeg_', rLeg: 'RightLeg_',
}
export class Fighter {
  constructor(arena, assets, opts) {
    /* opts: {side: -1|+1, tint, gloves, shorts, name, isCyborg} */
    this.arena = arena
    this.opts = opts
    this.side = opts.side
    this.pos = new THREE.Vector3(this.side * 1.6, PLATFORM_Y, 0)
    this.heading = 0
    this.root = new THREE.Group()
    arena.root.add(this.root)
    const src = assets.cache['boxer'].scene
    this.model = skClone(src)
    this.model.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true; o.frustumCulled = false
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material]
          this.mats = this.mats || []
          ms.forEach((m) => { const c = m.clone(); c.color = new THREE.Color(opts.tint || 0xffffff); this.mats.push(c); o.material = Array.isArray(o.material) ? [c] : c })
        }
      }
    })
    this.root.add(this.model)
    /* استخوان‌ها */
    this.bones = {}
    this.model.traverse((o) => { if (o.isBone) { for (const k in BONE_KEYS) { if (o.name.indexOf(BONE_KEYS[k]) === 0) { this.bones[k] = o; break } } } })
    /* میکسر + کلیپ پایه */
    this.mixer = new THREE.AnimationMixer(this.model)
    const gltf = assets.cache['boxer']
    if (gltf.animations && gltf.animations.length) {
      this.baseClip = this.mixer.clipAction(gltf.animations[0])
      this.baseClip.play()
      this.baseClip.setEffectiveWeight(1)
    }
    /* لایه‌ی رویه‌ای */
    this.action = null /* {type:'punch', kind, side, t} */
    this.guardW = 0
    this.hitT = -1
    this.dodgeT = -1
    this.kdState = 0 /* 0 عادی، 1 افتادن، 2 روی زمین، 3 بلند شدن */
    this.kdT = 0
    this.emote = null /* victory/defeat */
    this._q = new THREE.Quaternion()
    this._e = new THREE.Euler()
    /* وضعیت نبرد */
    this.hp = CFG.hpMax; this.st = CFG.stMax; this.guard = CFG.guardMax
    this.momentum = 0
    this.guarding = false
    this.dodgeDir = 0
    this.iframe = 0
    this.counterT = 0
    this.stunT = 0
    this.busy = 0 /* کل زمان قفل اکشن */
    this.cmd = null
    this.stats = { thrown: 0, landed: 0, blocked: 0, defOk: 0, counters: 0, dodges: 0, kd: 0, maxCombo: 0, combo: 0 }
    this.roundScore = 0
    this.tint = opts.tint
    this.cosmeticMeshes = []
    if (opts.gloves) this.addGloves(opts.gloves)
    if (opts.shorts) this.addShorts(opts.shorts)
  }
  /* دستکش رویه‌ای — دو کره‌ی کم‌ضلع چسبیده به استخوان دست (کاستوم رنگ) */
  addGloves(color) {
    for (const h of ['lHand', 'rHand']) {
      const b = this.bones[h]
      if (!b) continue
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6), new THREE.MeshLambertMaterial({ color }))
      m.scale.set(1.15, 1.3, 0.85)
      m.position.y = -0.06
      m.castShadow = false
      b.add(m)
      this.cosmeticMeshes.push(m)
    }
  }
  addShorts(color) {
    const hips = this.bones.hips
    if (!hips) return
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.34, 8, 1, true), new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }))
    m.position.y = 0.02
    hips.add(m)
    this.cosmeticMeshes.push(m)
  }
  setCosmetics(gloves, shorts) {
    this.cosmeticMeshes.forEach((m) => { m.parent.remove(m); m.geometry.dispose(); m.material.dispose() })
    this.cosmeticMeshes = []
    if (gloves) this.addGloves(gloves)
    if (shorts) this.addShorts(shorts)
  }
  /* --- لایه‌ی رویه‌ای: بعد از mixer.update اجرا می‌شود --- */
  applyPose(dt) {
    const B = this.bones
    const set = (b, x, y, z, w) => {
      if (!b || w <= 0) return
      this._e.set(x, y, z)
      this._q.setFromEuler(this._e)
      b.quaternion.slerp(this._q, Math.min(1, w))
    }
    const t = performance.now() / 1000
    /* گارد نرم */
    if (this.guarding && this.kdState === 0) this.guardW = Math.min(1, this.guardW + dt * 8)
    else this.guardW = Math.max(0, this.guardW - dt * 8)
    if (this.guardW > 0) {
      const w = this.guardW
      set(B.lArm, -0.85, 0.1, -0.55, w * 0.75); set(B.rArm, -0.85, -0.1, 0.55, w * 0.75)
      set(B.lFore, -1.85, 0.2, 0.15, w * 0.8); set(B.rFore, -1.85, -0.2, -0.15, w * 0.8)
      set(B.spine2, 0.08, 0, 0, w * 0.5)
    }
    /* ضربه‌ی رویه‌ای — فازهای startup/active/recovery (آینه‌ی جدول PUNCH) */
    const A = this.action
    if (A && A.type === 'punch') {
      const P = PUNCH[A.kind]
      const p = A.t / (P.startup + P.active + P.recovery)
      const su = P.startup / (P.startup + P.active + P.recovery)
      const ac = (P.startup + P.active) / (P.startup + P.active + P.recovery)
      let ph, w
      if (p < su) { ph = (p / su) * 0.25; w = 1 } /* بادگیر */
      else if (p < ac) { ph = 0.25 + ((p - su) / (ac - su)) * 0.75; w = 1 } /* ضربه — سریع */
      else { ph = 1 - (p - ac) / (1 - ac); w = 0.9 * (1 - (p - ac) / (1 - ac) * 0.4) } /* بازگشت */
      ph = Math.min(1, ph)
      const L = A.kind === 'hookL' || A.kind === 'jab' ? 1 : 0
      const isHook = A.kind === 'hookL' || A.kind === 'hookR'
      const isUpper = A.kind === 'upper'
      const isBody = A.kind === 'body'
      const arm = L ? 'lArm' : 'rArm', fore = L ? 'lFore' : 'rFore', sho = L ? 'lSho' : 'rSho'
      const ext = ph /* 0..1 — امتداد */
      const fwd = -0.25 - ext * (isHook ? 0.55 : isUpper ? 0.95 : 1.25)
      const sideS = L ? -1 : 1
      set(B[sho], 0, 0, sideS * 0.25 * (1 - ext), w)
      set(B[arm], fwd, isHook ? sideS * (0.7 - ext * 0.9) : sideS * 0.08 * (1 - ext), sideS * (isHook ? 0.5 : 0.12) * (1 - ext), w)
      set(B[fore], isHook ? -1.5 + ext * 0.4 : isUpper ? -1.7 + ext * 0.9 : -0.35 + ext * 0.15, 0, 0, w)
      /* چرخش تنه — قدرت پانچ */
      const twist = (isHook ? 0.55 : 0.3) * ext * sideS
      set(B.spine2, isUpper ? -0.18 * ext : isBody ? 0.35 * ext : 0.06 * ext, twist, 0, w)
      set(B.spine1, twist * 0.5, 0, 0, w * 0.8)
      if (isBody) set(B.hips, 0.3 * ext, 0, 0, w * 0.6)
      if (isUpper) set(B.hips, -0.15 * ext, 0, 0, w * 0.5)
    }
    /* داوج — جابه‌جایی ریشه + خم تنه */
    if (this.dodgeT >= 0) {
      this.dodgeT += dt
      const p = this.dodgeT / CFG.dodgeDur
      if (p >= 1) this.dodgeT = -1
      else {
        const d = Math.sin(p * Math.PI) * (this.dodgeDir || 1)
        this.poseShiftX = d * 0.42
        set(B.spine2, 0, 0, d * 0.55, 0.9)
        set(B.head, 0, 0, -d * 0.3, 0.6)
        set(B.hips, 0, 0, d * 0.12, 0.5)
      }
    }
    if (this.poseShiftX && this.dodgeT < 0) this.poseShiftX = 0
    /* واکنش ضربه */
    if (this.hitT >= 0) {
      this.hitT += dt
      const p = this.hitT / 0.34
      if (p >= 1) this.hitT = -1
      else {
        const d = Math.sin(p * Math.PI)
        set(B.head, d * 0.5, d * 0.3, 0, 0.9)
        set(B.spine2, -d * 0.22, 0, 0, 0.7)
        this.poseShiftZ = -d * 0.14
      }
    }
    if (this.poseShiftZ && this.hitT < 0) this.poseShiftZ = 0
    /* ناک‌داون/بلند شدن — کامل رویه‌ای */
    if (this.kdState > 0) {
      this.kdT += dt
      if (this.kdState === 1) { /* افتادن */
        const p = Math.min(1, this.kdT / 0.55)
        const e = 1 - Math.pow(1 - p, 2)
        this.root.position.y = PLATFORM_Y - e * (PLATFORM_Y - 0.18)
        this.root.rotation.x = -e * 1.45
        set(B.hips, 0, 0, 0, e)
        if (p >= 1) { this.kdState = 2; this.kdT = 0 }
      } else if (this.kdState === 2) { /* روی زمین — شمارش */
        this.root.position.y = PLATFORM_Y - (PLATFORM_Y - 0.18)
        this.root.rotation.x = -1.45
      } else if (this.kdState === 3) { /* بلند شدن */
        const p = Math.min(1, this.kdT / 0.9)
        const e = p * p
        this.root.position.y = PLATFORM_Y - (1 - e) * (PLATFORM_Y - 0.18)
        this.root.rotation.x = -(1 - e) * 1.45
        if (p >= 1) { this.kdState = 0; this.root.rotation.x = 0; this.root.position.y = PLATFORM_Y }
      }
    } else {
      this.root.rotation.x = 0
    }
    /* اموتی برد/باخت */
    if (this.emote) {
      this.emote.t = (this.emote.t || 0) + dt
      if (this.emote.type === 'victory') {
        const b = Math.abs(Math.sin(this.emote.t * 4)) * 0.12
        set(B.lArm, -2.5, 0, -0.4, 0.85); set(B.rArm, -2.5, 0, 0.4, 0.85)
        set(B.lFore, -0.4, 0, 0, 0.7); set(B.rFore, -0.4, 0, 0, 0.7)
        this.root.position.y = PLATFORM_Y + b
      } else {
        set(B.spine2, 0.55, 0, 0, 0.8); set(B.head, 0.5, 0, 0, 0.8)
        set(B.lArm, -0.1, 0, -0.1, 0.6); set(B.rArm, -0.1, 0, 0.1, 0.6)
      }
    }
  }
  update(dt) {
    this.mixer.update(dt)
    this.applyPose(dt)
    /* جهت + موقعیت ریشه */
    const opp = this.opp
    if (opp && this.kdState === 0) {
      const dx = opp.pos.x - this.pos.x, dz = opp.pos.z - this.pos.z
      this.heading = Math.atan2(dx, dz)
    }
    const sx = this.poseShiftX || 0, sz = this.poseShiftZ || 0
    this.root.position.set(this.pos.x + sx, this.pos.y, this.pos.z + sz)
    this.root.rotation.y = this.heading
    /* فاز اکشن */
    if (this.action) {
      this.action.t += dt
      const kind = this.action.kind
      if (kind && PUNCH[kind]) {
        const P = PUNCH[kind]
        if (this.action.t >= P.startup && !this.action.fired) { this.action.fired = true; this.onActive && this.onActive(kind) }
        if (this.action.t >= P.startup + P.active + P.recovery) { this.action = null }
      } else this.action = null
    }
    /* تایمرها */
    if (this.iframe > 0) this.iframe -= dt
    if (this.counterT > 0) this.counterT -= dt
    if (this.stunT > 0) this.stunT -= dt
    /* ریجن استقامت + بازسازی تدریجی گارد */
    if (this.kdState === 0) this.guard = Math.min(CFG.guardMax, this.guard + 4 * dt)
    if (!this.guarding && !this.action && this.stunT <= 0) this.st = Math.min(CFG.stMax, this.st + CFG.stRegenIdle * dt)
    else if (this.guarding) this.st = Math.max(0, this.st + CFG.stRegenGuard * dt)
  }
  exhausted() { return this.st < CFG.exhaustedAt }
  canAct() { return this.kdState === 0 && !this.action && this.stunT <= 0 && !this.emote }
  punch(kind) {
    const P = PUNCH[kind]
    if (!this.canAct() || this.st < P.stam * 0.6) return false
    this.st -= P.stam
    const slow = this.exhausted() ? CFG.exhaustedSlow : 1
    this.action = { type: 'punch', kind, t: 0, slow }
    this.stats.thrown++
    return true
  }
  startDodge(dir) {
    /* داوج فقط خارج از ریکاوری ضربه — ضد کسل‌کردن فریم‌ها (و تله‌متری زیرگپ) */
    if (this.kdState !== 0 || this.dodgeT >= 0 || this.action || this.st < CFG.dodgeStam * 0.7) return false
    this.st -= CFG.dodgeStam
    this.dodgeT = 0
    this.dodgeDir = dir
    this.iframe = CFG.dodgeIframe
    return true
  }
  takeHit(dmg, opts) {
    /* opts: {guarded, body, counter} */
    let d = dmg
    if (opts.guarded) {
      d *= CFG.guardDmgMul
      this.guard -= dmg * 0.85
      if (this.guard <= 0) { this.guard = 0; this.stunT = CFG.guardBreakStun; this.guardBreak = true }
    }
    if (this.exhausted()) d *= 1.15
    this.hp = Math.max(0, this.hp - d)
    this.momentum = Math.max(0, this.momentum - CFG.momHitTaken)
    this.hitT = -0.001
    this.stats.combo = 0
    return d
  }
  resetRound() {
    this.guard = CFG.guardMax
    this.st = Math.min(CFG.stMax, this.st + 35)
    this.action = null; this.stunT = 0; this.hitT = -1; this.dodgeT = -1
    this.guarding = false
    this.kdState = 0; this.root.rotation.x = 0; this.root.position.y = PLATFORM_Y
  }
  dispose() {
    /* هندسه‌ی مشترک (SkeletonUtils.clone) dispose نمی‌شود — فقط کالون‌های متریال/کاسمتیک */
    this.arena.root.remove(this.root)
    this.mixer.stopAllAction()
    this.mats = this.mats || []
    this.mats.forEach((m) => m.dispose())
    this.cosmeticMeshes.forEach((m) => { m.geometry.dispose(); m.material.dispose() })
    this.cosmeticMeshes = []
  }
}
