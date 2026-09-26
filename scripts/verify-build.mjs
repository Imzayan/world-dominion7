// Build verifier — VERSION-AGNOSTIC (single source = public/game/v.txt).
// Replaces verify-v63.mjs (its hard-coded version pins would break every release).
// Guards include the V64 blank-page root-cause fixes:
//   - .wd31-rise must never gate visibility behind animation (lowfx/old-WebView blank pages)
//   - hubNotice must be the single visible fallback for every empty-hub path (no silent gates)
// Usage: node scripts/verify-build.mjs
import fs from 'fs'
const h = fs.readFileSync('public/game/index.html', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')
const V = fs.readFileSync('public/game/v.txt', 'utf8').trim()
if (!/^\d+$/.test(V)) { console.log('FATAL: v.txt invalid'); process.exit(1) }
let ok = 0, fail = 0
const check = (name, fn) => { try { fn(); ok++; console.log('PASS ' + name) } catch (e) { fail++; console.log('FAIL ' + name + ' — ' + String(e).slice(0, 140)) } }

check(`head beacon present + parses (v.txt=${V})`, () => {
  const m = h.match(new RegExp('<script>window\\.__WD_V=' + V + ';[^<]*</script>'))
  if (!m) throw new Error('marker not found for V=' + V)
  new Function(m[0].replace(/<\/?script>/g, ''))
})
check('self-heal body present + parses', () => {
  const i = h.indexOf('/* V63 self-heal')
  if (i < 0) throw new Error('comment not found')
  const j = h.indexOf('   </script>', i)
  if (j < 0) throw new Error('script end not found')
  let body = h.slice(i, j)
  body = body.replace(/\/\* V63 self-heal[\s\S]*?\*\//, '')
  new Function(body)
})
check('wgRefresh 10s hang guard (single impl, reuses error card)', () => {
  if (!h.includes("Promise.race([rpc33('olympic_games'")) throw new Error('guard missing')
  if ((h.match(/Promise\.race\(\[rpc33\('olympic_games'/g) || []).length !== 1) throw new Error('duplicated')
})
check('V64 guard: .wd31-rise has NO base opacity:0 (visibility never depends on animation)', () => {
  const m = h.match(/\.wd31-rise\{[^}]*\}/)
  if (!m) throw new Error('rule missing')
  if (m[0].includes('opacity:0')) throw new Error('base opacity:0 returned: ' + m[0])
  if (!m[0].includes('both')) throw new Error('fill both missing: ' + m[0])
})
check('V64 guard: keyframes carry the from{opacity:0} state (visual parity on healthy devices)', () => {
  const m = h.match(/@keyframes wd31Rise\{[^}]*\}/)
  if (!m || !m[0].includes('from{opacity:0')) throw new Error('from state missing: ' + (m && m[0]))
})
check('V64 guard: hubNotice single impl covers no-sb / no-acc / rpc-fail (no silent empty hub)', () => {
  const defs = (h.match(/function hubNotice\(/g) || []).length
  if (defs !== 1) throw new Error('hubNotice defs=' + defs)
  const i = h.indexOf('function hubNotice')
  const body = h.slice(i, i + 1400)
  if (!body.includes("document.getElementById('wg33-wrap')")) throw new Error('scope-dependent H() inside hubNotice (V62 ReferenceError regression)')
  const wi = h.indexOf('async function wgRefresh')
  const seg = h.slice(wi, wi + 2200)
  if (!seg.includes("!sb){hubNotice(")) throw new Error('no-sb gate not painted')
  if (!seg.includes('!ACC.uid){strip33Update(null);hubNotice(')) throw new Error('no-acc gate not painted')
  if (!seg.includes('hubNotice(') || (seg.match(/hubNotice\(/g) || []).length < 3) throw new Error('rpc-fail card missing')
  const uses = (h.match(/hubNotice\(/g) || []).length
  if (uses !== 4) throw new Error('hubNotice uses=' + uses + ' (expect 1 def + 3 calls)')
})
check('__WD_V appears exactly once (single source, matches v.txt)', () => {
  const all = h.match(/window\.__WD_V=\d+/g) || []
  if (all.length !== 1) throw new Error('beacons=' + all.join(','))
  if (all[0] !== 'window.__WD_V=' + V) throw new Error('beacon ' + all[0] + ' != v.txt ' + V)
})
check('sw.js v6: cache name + bypasses + SWR', () => {
  new Function(sw.replace(/\b(self|caches|clients)\b/g, 'globalThis.$1'))
  if (!sw.includes("const CACHE = 'wd-v6'")) throw new Error('cache name')
  if (!sw.includes("url.pathname === '/game/v.txt'")) throw new Error('v.txt bypass missing')
  if (!sw.includes("url.search.indexOf('wdFresh=') === -1")) throw new Error('wdFresh bypass missing')
  if (!sw.includes('if (!cached) return fetch(req);')) throw new Error('cold pass-through missing')
})
check('old v5 strategy gone', () => { if (sw.includes("wd-v5") || sw.includes("3000")) throw new Error('stale v5 remnants') })

console.log(`\n== ${ok}/${ok + fail} ==`)
process.exit(fail ? 1 : 0)
