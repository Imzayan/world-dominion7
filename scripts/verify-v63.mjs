// V63 syntax + marker verification for index.html and sw.js
import fs from 'fs'
const h = fs.readFileSync('public/game/index.html', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')
let ok = 0, fail = 0
const check = (name, fn) => { try { fn(); ok++; console.log('PASS ' + name) } catch (e) { fail++; console.log('FAIL ' + name + ' — ' + String(e).slice(0, 140)) } }

check('head beacon present + parses', () => {
  const m = h.match(/<script>window\.__WD_V=63;[^<]*<\/script>/)
  if (!m) throw new Error('marker not found')
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
check('__WD_V appears exactly once (single source)', () => {
  const n = (h.match(/window\.__WD_V=63/g) || []).length
  if (n !== 1) throw new Error('count=' + n)
})
check('sw.js v6: cache name + bypasses + SWR', () => {
  new Function(sw.replace(/\b(self|caches|clients)\b/g, 'globalThis.$1'))
  if (!sw.includes("const CACHE = 'wd-v6'")) throw new Error('cache name')
  if (!sw.includes("url.pathname === '/game/v.txt'")) throw new Error('v.txt bypass missing')
  if (!sw.includes("url.search.indexOf('wdFresh=') === -1")) throw new Error('wdFresh bypass missing')
  if (!sw.includes('if (!cached) return fetch(req);')) throw new Error('cold pass-through missing')
})
check('v.txt = 63', () => { if (fs.readFileSync('public/game/v.txt', 'utf8').trim() !== '63') throw new Error('content') })
check('old v5 strategy gone', () => { if (sw.includes("wd-v5") || sw.includes("3000")) throw new Error('stale v5 remnants') })

console.log(`\n== ${ok}/${ok + fail} ==`)
process.exit(fail ? 1 : 0)
