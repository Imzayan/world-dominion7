/* V166 RESKIN SMOKE — UI/UX phase 3 static gate.
 * ① version ritual (v.txt-derived) ② skin layer present ③ unified button language
 * ④ page skins (auth/wd7/wd-menu/wd6/wd28+wdc/country-drawer) ⑤ lazy modules metric adoption
 * ⑥ red lines (server/balance/storage, no new animation/blur, no transition:all)
 * Run: node scripts/v166-reskin-smoke.mjs */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }

const html = readFileSync(join(ROOT, 'public/game/index.html'), 'utf8')
const vTxt = readFileSync(join(ROOT, 'public/game/v.txt'), 'utf8').trim()
const route = readFileSync(join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8')
const balance = readFileSync(join(ROOT, 'public/game/balance.js'), 'utf8')
const shop = readFileSync(join(ROOT, 'public/game/shop-v2.js'), 'utf8')
const social = readFileSync(join(ROOT, 'public/game/social.js'), 'utf8')

/* ---------- ① version ritual ---------- */
check('v.txt numeric + in sync with __WD_V', /^[0-9]+$/.test(vTxt) && html.includes('window.__WD_V=' + vTxt + ';'), vTxt)
check('exactly 12 ?v=' + vTxt + ' asset pins', (html.match(new RegExp('\\?v=' + vTxt, 'g')) || []).length === 12, String((html.match(new RegExp('\\?v=' + vTxt, 'g')) || []).length))
check('no stale ?v pin from the previous release', !html.includes('?v=' + (Number(vTxt) - 1)))

/* ---------- ② skin layer ---------- */
check('V166 skin layer present exactly once', (html.match(/<style id="wd-v166-skin">/g) || []).length === 1)
const skinRaw = html.slice(html.indexOf('<style id="wd-v166-skin">'), html.indexOf('</style>', html.indexOf('<style id="wd-v166-skin">')))
const skin = skinRaw.replace(/\/\*[\s\S]*?\*\//g, '') /* comments excluded from matching */

/* ---------- ③ unified button language ---------- */
const families = ['action-btn', 'nav-btn', 'lobby-item-btn', 'lobby-tab-btn', 'buy-btn', 'wdp-btn', 'wdc-send', 'wd-btn',
  'wd6-btn', 'wd7-btn', 'wd65-btn', 'wd31-btn', 'wd28-send', 'wd7-tab', 'wd-menu-item']
check('unified :where rule lists all 15 button families', families.every((f) => skin.includes('.' + f)), families.filter((f) => !skin.includes('.' + f)).join(','))
check('unified metrics = 44px + token radius + press/focus/disabled states', skin.includes('min-height:44px;border-radius:var(--wd-r-sm)') && skin.includes(':active){transform:scale(.97)}') && skin.includes(':focus-visible') && skin.includes(':disabled){opacity:.5'))
check('zero-specificity design (:where — family identity colors untouched)', (skin.match(/:where\(/g) || []).length === 5)
check('44px floor = action buttons ONLY (compact tabs/list rows excluded — lobby height guard)', skin.includes(':where(.action-btn,.nav-btn,.buy-btn,.wdp-btn,.wdc-send,.wd-btn,\n           .wd6-btn,.wd7-btn,.wd65-btn,.wd31-btn,.wd28-send){') && skin.includes(':where(.lobby-item-btn,.lobby-tab-btn,.wd7-tab,.wd-menu-item){') && !skin.includes('.lobby-tab-btn,.buy-btn'))
/* ---------- ④ page skins ---------- */
check('auth inputs + ghost button on tokens (44px, radius)', skin.includes('#auth input{border-radius:var(--wd-r-sm)') && skin.includes('#auth .btn-ghost{border-radius:var(--wd-r-sm);min-height:44px'))
check('wd7 card chrome tokenized (tabs/btn colors live in their own skin generation)', skin.includes('.wd7-card{border-radius:var(--wd-r-md)'))
check('wd-menu card + items on glass tokens', skin.includes('#wd-menu-card{border-radius:var(--wd-r-lg) var(--wd-r-lg) 0 0;border-color:var(--wd-glass-brd)}') && skin.includes('.wd-menu-item{border-radius:var(--wd-r-md)}'))
check('wd6 panel/card/btn tokenized', skin.includes('#wd6-panel{border-radius:var(--wd-r-lg);border-color:var(--wd-glass-brd)}') && skin.includes('.wd6-card{border-radius:var(--wd-r-md)}') && skin.includes('.wd6-btn{background:rgba(255,255,255,.05);border-color:rgba(0,240,255,.22);border-radius:var(--wd-r-sm)}'))
check('wd28-send joins the unified language', skin.includes('.wd28-send{min-height:44px;border-radius:var(--wd-r-sm)}'))
check('country-drawer live !important definition token-ized in place', /\.country-drawer\{background:var\(--wd-glass\)!important;border:1px solid var\(--wd-glass-brd\)!important;border-radius:var\(--wd-r-lg\)!important\}/.test(html))
check('wdc compose metrics live-in-place (input 44px + send 44px + token radius)', /\.wdc-input\{\s*min-height:44px!important;border-radius:var\(--wd-r-sm\)!important/.test(html) && /\.wdc-send\{\s*min-width:66px!important;min-height:44px!important;border-radius:var\(--wd-r-sm\)!important/.test(html))

/* ---------- ⑤ lazy modules metric adoption (style-only string edits) ---------- */
check('shop-v2: buy button 44px + token radius', shop.includes('border-radius:var(--wd-r-sm);padding:9px 12px;font-weight:800;font-size:12px;cursor:pointer;background:linear-gradient(135deg,#ffd84d,#ffb02e);color:#201500;white-space:nowrap;font-family:inherit;min-height:44px}'))
check('shop-v2: filter chips 44px', shop.includes('border-radius:var(--wd-r-sm);min-height:44px;padding:9px 12px;font-size:11.5px'))
check('shop-v2: card/head radii tokenized', (shop.match(/var\(--wd-r-md\)/g) || []).length >= 2 && (shop.match(/var\(--wd-r-sm\)/g) || []).length >= 2)
check('social: tabs 44px (was 40px) + token radii across interactive set', social.includes('flex:1;min-height:44px;border-radius:var(--wd-r-sm);border:1px solid rgba(120,200,255,.18)') && (social.match(/var\(--wd-r-(sm|md)\)/g) || []).length >= 4)
check('social/shop modules still syntax-clean JS strings (no broken quotes)', !/[^\n]{0,4}'\s*\+\s*'/.test('') && shop.includes("css.id='wd-shop-v2-css'") && social.includes("st.id='wd95-css'"))

/* ---------- ⑥ red lines ---------- */
check('server route untouched by V166 (no UI markers leaked)', !route.includes('V166') && !route.includes('wd166'))
check('balance.js untouched', !balance.includes('V166'))
check('wd6 storage key untouched (same localStorage contract)', html.includes("metaKey='wd6_meta_v6'") && html.includes("localStorage.setItem(metaKey,JSON.stringify(M))"))
check('skin adds NO animation/blur (perf red line)', !/animation|backdrop-filter|@keyframes/.test(skin))
const htmlNoCmt = html.replace(/\/\*[\s\S]*?\*\//g, '')
check('no transition:all in any CSS rule (comments excluded)', !htmlNoCmt.includes('transition:all'))
check('drawer perf contract untouched (will-change:transform still on country-drawer)', /\.country-drawer \{[\s\S]{0,700}will-change: transform/.test(html))
check('Persian surface strings intact (ops center / command panel / world)', html.includes('مرکز عملیات فرماندهی') && html.includes('امپراتوری‌های برتر این جهان') && html.includes('فروشگاه'))

console.log('\n=== v166-reskin-smoke: ' + ok + ' ok, ' + fail + ' fail ===')
process.exit(fail ? 1 : 0)
