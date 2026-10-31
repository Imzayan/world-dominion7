/* V163 smoke — UI/UX phase 1: design tokens + mobile shell (HUD/nav/safe-area)
   Owner mission: «ارتقای حرفه‌ای رابط کاربری و تجربه بازی، مخصوصاً در موبایل — مکانیک‌ها و داده دست نمی‌خورند»
   (1) version ritual  (2) tokens  (3) dead nav generations purged  (4) live shell definitions
   (5) hud-terr resurrection (V152 honest message)  (6) haptics + admin icon
   Run: node scripts/v163-shell-smoke.mjs */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }

const html = readFileSync(join(ROOT, 'public/game/index.html'), 'utf8')
const vTxt = readFileSync(join(ROOT, 'public/game/v.txt'), 'utf8').trim()

/* ---------- ① version ritual ---------- */
/* V164: version expectation now derives from v.txt (single source of truth) —
   the smoke stays valid for every future release instead of breaking each bump */
const V = vTxt
check('v.txt numeric and in sync with __WD_V', /^[0-9]+$/.test(V) && html.includes('window.__WD_V=' + V + ';'), vTxt)
check('__WD_V matches v.txt', html.includes('window.__WD_V=' + V + ';'), V)
check('exactly 12 ?v=' + V + ' asset pins', (html.match(new RegExp('\\?v=' + V, 'g')) || []).length === 12, String((html.match(new RegExp('\\?v=' + V, 'g')) || []).length))
check('no stale ?v pins from previous release', !html.includes('?v=' + (Number(V) - 1)))

/* ---------- ② design tokens (base :root extended, not a 6th block) ---------- */
check('font scale tokens live', html.includes('--wd-f-xs: 10px') && html.includes('--wd-f-xl: 17px'))
check('spacing/radius/shadow/glass tokens live', html.includes('--wd-glass: rgba(4, 11, 22, 0.92)') && html.includes('--wd-sh-2: 0 12px 32px rgba(0, 0, 0, 0.45)'))
check('nav label consumes token (--wd-f-xs)', html.includes('.bottom-nav .nav-btn span:last-child{font-size:var(--wd-f-xs,10px)!important'))

/* ---------- ③ dead nav generations purged (single live dock = wd16 grid) ---------- */
check('gen-1 (base full-width bar) deleted', !html.includes('position: fixed; bottom: 0; left: 0; right: 0; height: 56px; z-index: 9999;'))
check('gen-2 (floaty animation + gradient) deleted', !html.includes('animation:floaty 3s ease-in-out infinite'))
check('gen-3 (V10 64px bar) deleted', !html.includes('height:64px!important;padding:4px 6px calc(4px'))
check('gen-4 (V12 floating dock) deleted', !html.includes('.bottom-nav{left:8px!important;right:8px!important;bottom:calc(7px'))
check('V12 media inset line deleted', !html.includes('.bottom-nav{left:6px!important;right:6px!important}'))
check('dead V15 shadow line deleted', !html.includes('.bottom-nav{box-shadow:0 -8px 24px rgba(0,0,0,.38)!important}'))
check('desktop centering exists exactly once', (html.match(/@media\(min-width:701px\)\{\.bottom-nav\{left:50%/g) || []).length === 1)

/* ---------- ④ live shell definitions ---------- */
check('dock = adaptive grid (shop/admin no longer clipped to invisible row 2)',
  html.includes('display:grid!important;grid-template-columns:repeat(auto-fit,minmax(0,1fr))!important'))
check('dock height 58px (orb 34px + label 10px fits)', html.includes('height:58px!important;min-height:58px!important;padding:4px!important;'))
check('nav button 48px target', html.includes('height:48px!important;padding:2px 1px!important;'))
check('nav label 10px @430 → 9.5px', html.includes('.bottom-nav .nav-btn span:last-child{font-size:9.5px!important}'))
check('wd7-btn 52px target above dock', html.includes('bottom:calc(72px + var(--wd-safe-bottom,0px))!important;z-index:10001!important;width:52px!important;height:52px!important'))
check('country-drawer clears the 58px dock', html.includes('bottom:calc(74px + var(--wd-safe-bottom))!important'))
check('ticker above dock (was bottom:56px colliding)', html.includes('#ticker{position:fixed;left:0;right:0;bottom:calc(74px + var(--wd-safe-bottom,0px))'))
check('wd6-toast safe-bottom offset', html.includes('#wd6-toast{position:fixed;left:50%;bottom:calc(90px + var(--wd-safe-bottom,0px))'))

/* ---------- ⑤ hud-terr resurrection (V152 owner directive was invisible) ---------- */
check('#hud-terr no longer display:none by v4', !html.includes('#hud-terr{display:none!important}'))
check('#hud-terr re-shown (flex)', html.includes('#hud-terr{display:flex!important}'))
check('hud chips 30px/10px + font 11px', html.includes('#hud-strip .hchip{height:30px!important;padding:0 10px!important;border-radius:13px!important}') && html.includes('#hud-strip .hchip{padding:0 10px!important;font-size:11px!important}'))

/* ---------- ⑥ haptics + admin SVG icon ---------- */
check('haptic feedback script installed (8ms, passive, guarded)', html.includes('__wd163shell') && html.includes('navigator.vibrate(8)'))
check('admin nav icon → icon-settings SVG', html.includes("'btn-m-admin':'icon-settings'"))
check('icon-settings symbol exists', html.includes('<symbol id="icon-settings"'))

/* ---------- ⑦ mechanics untouched (red line) ---------- */
const route = readFileSync(join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8')
check('server route untouched by V163 (no UI markers leaked)', !route.includes('V163') && !route.includes('wd163'))
check('balance.js untouched', !readFileSync(join(ROOT, 'public/game/balance.js'), 'utf8').includes('V163'))
check('storage keys unchanged (wd_last/wd_seen still the only auth keys referenced)', html.includes("LS.get('wd_last')") && html.includes("LS.get('wd_seen')"))

console.log(`\n=== v163-shell-smoke: ${ok} ok, ${fail} fail ===`)
process.exit(fail ? 1 : 0)
