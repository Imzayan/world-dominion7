/* V165 COMPONENT-SYSTEM SMOKE — UI/UX phase 2 static gate.
 * ① version ritual (v.txt-derived, release-proof) ② toast unification (wd6 dead system gone)
 * ③ skeleton system (CSS+helper+converted spots) ④ modal swipe-down handler
 * ⑤ grab-handle affordance ⑥ unified touch feedback ⑦ red lines (server/balance/storage)
 * Run: node scripts/v165-comp-smoke.mjs */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }

const html = readFileSync(join(ROOT, 'public/game/index.html'), 'utf8')
const vTxt = readFileSync(join(ROOT, 'public/game/v.txt'), 'utf8').trim()
const route = readFileSync(join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8')
const balance = readFileSync(join(ROOT, 'public/game/balance.js'), 'utf8')

/* ---------- ① version ritual ---------- */
check('v.txt numeric + in sync with __WD_V', /^[0-9]+$/.test(vTxt) && html.includes('window.__WD_V=' + vTxt + ';'), vTxt)
check('exactly 12 ?v=' + vTxt + ' asset pins', (html.match(new RegExp('\\?v=' + vTxt, 'g')) || []).length === 12, String((html.match(new RegExp('\\?v=' + vTxt, 'g')) || []).length))
check('no stale ?v pin from the previous release', !html.includes('?v=' + (Number(vTxt) - 1)))

/* ---------- ② toast unification ---------- */
check('#wd6-toast CSS generation deleted', !html.includes('#wd6-toast{'))
check('#wd6-toast element creation deleted', !html.includes("toastEl.id='wd6-toast'"))
check('wd6 toast() delegates to central showToast', /function toast\(t\)\{try\{showToast\(t,'win'\)\}catch\(e\)\{\}\}/.test(html))
check('central showToast + pre/post hook registry intact', html.includes('window.WD_TOAST_HOOKS={pre:[],post:[]}') && html.includes('function showToast(msg, kind)'))
check('adapter family still delegates (toast26/showToast2/showToast33/toast65)', (html.match(/typeof showToast==='function'\)showToast\(/g) || []).length >= 4)

/* ---------- ③ skeleton system ---------- */
check('.wd-skel CSS live (shimmer bar)', html.includes('.wd-skel{display:inline-block;height:10px') && html.includes('background-size:200% 100%'))
check('wdSkel keyframes + reduced-motion fallback', html.includes('@keyframes wdSkel') && html.includes('@media (prefers-reduced-motion:reduce){.wd-skel{animation:none'))
check('wdSkel helper defined early (next to showToast)', (html.match(/window\.wdSkel=function/g) || []).length === 1)
check('skeleton consumes converted loading spots', (html.match(/class="wd-skel"/g) || []).length >= 8 && (html.match(/window\.wdSkel\(/g) || []).length >= 7, 'inline=' + (html.match(/class="wd-skel"/g) || []).length + ' js=' + (html.match(/window\.wdSkel\(/g) || []).length)
check('no bare text-loading left (only the labeled wd105 variant)', (html.match(/در حال دریافت/g) || []).length === 1, String((html.match(/در حال دریافت/g) || []).length))

/* ---------- ④ modal swipe-down ---------- */
check('swipe handler installed with pinned exclusions', html.includes("EXC={'m-battle':1,'auth':1}") && html.includes("closest('.modal.active')"))
check('swipe is passive + rAF-throttled + 90px threshold', (html.match(/\{passive:true\}/g) || []).length >= 3 && html.includes('requestAnimationFrame') && html.includes('if(went>90)'))
check('swipe closes through the single closeModal path', /setTimeout\(function\(\)\{try\{if\(mid\)closeModal\(mid\)\}catch\(e\)\{\}/.test(html))

/* ---------- ⑤ grab handle ---------- */
check('grab handle on coarse pointers only', html.includes('@media (pointer:coarse)') && html.includes('.modal.active .modal-card::before'))
check('battle/auth never get the handle', html.includes('#m-battle .modal-card::before,#auth .modal-card::before{display:none}'))

/* ---------- ⑥ unified touch feedback ---------- */
check('44px min target + press scale for primary button families', html.includes('.wdp-btn,.wd65-btn,.wd-btn{min-height:44px}') && html.includes('.wdp-btn:active,.wd65-btn:active,.wd-btn:active{transform:scale(.98)}'))
const htmlNoCmt = html.replace(/\/\*[\s\S]*?\*\//g, '')
check('no transition:all in any CSS rule (comments excluded)', !htmlNoCmt.includes('transition:all'))

/* ---------- ⑦ red lines ---------- */
check('server route untouched by V165 (no UI markers leaked)', !route.includes('V165') && !route.includes('wd165'))
check('balance.js untouched', !balance.includes('V165'))
check('wd6 storage key untouched (same localStorage contract)', html.includes("metaKey='wd6_meta_v6'") && html.includes("localStorage.setItem(metaKey,JSON.stringify(M))"))

console.log('\n=== v165-comp-smoke: ' + ok + ' ok, ' + fail + ' fail ===')
process.exit(fail ? 1 : 0)
