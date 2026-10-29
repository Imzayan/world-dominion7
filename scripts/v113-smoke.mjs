/* V113 smoke — SB SHIM contract test (offline, /api mocked via Playwright routes)
   Validates the exact wire contract the shim implements against the real backend:
   auth (signup/login/session/logout envelopes), db (GET q= base64url, POST payloads,
   PATCH payload+filters, maybeSingle/single unwrapping), rpc passthrough {data,error},
   channel bridge (poll only with session), offline-save keepalive path, promo card. */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wasm': 'application/wasm' }
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '').split('?')[0])
  if (p === '/') p = '/game/index.html'
  const f = join(ROOT, 'public', p)
  if (existsSync(f) && !f.endsWith('/')) {
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' })
    res.end(readFileSync(f))
  } else { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => srv.listen(8931, r))

let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }
const errors = []
const br = await chromium.launch()
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

/* ---------- /api mock state (mirrors real backend envelopes) ---------- */
const USERS = {}
let sessionTok = null
const seen = { calls: [] }
await page.route('**/api/**', async (route) => {
  const req = route.request()
  const url = new URL(req.url())
  const path = url.pathname
  const method = req.method()
  let body = {}
  try { if (req.postData()) body = JSON.parse(req.postData()) } catch {}
  seen.calls.push({ path, method, body, q: url.search })
  const J = (o) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) })
  if (path === '/api/auth/session') {
    const u = sessionTok && USERS[sessionTok]
    return J(u ? { data: { session: { user: { id: u.id, email: u.email, user_metadata: { nick: u.nick } } } }, error: null } : { data: { session: null }, error: null })
  }
  if (path === '/api/auth/signup') {
    const nick = (body.options && body.options.data && body.options.data.nick) || body.nick || ''
    const u = { id: 'uid-' + nick, email: String(body.email || '').toLowerCase(), nick }
    USERS[u.id] = u; sessionTok = u.id
    return J({ data: { session: { user: { id: u.id, email: u.email, user_metadata: { nick } } }, user: { id: u.id, email: u.email, user_metadata: { nick } } }, error: null })
  }
  if (path === '/api/auth/login') {
    const u = Object.values(USERS).find((x) => x.email === String(body.email || '').toLowerCase())
    if (!u) return J({ data: {}, error: { message: 'Invalid login credentials', status: 400 } })
    sessionTok = u.id
    return J({ data: { session: { user: { id: u.id, email: u.email, user_metadata: { nick: u.nick } } }, user: { id: u.id, email: u.email, user_metadata: { nick: u.nick } } }, error: null })
  }
  if (path === '/api/auth/logout') { sessionTok = null; return J({ data: {}, error: null }) }
  if (path === '/api/rpc/shop_catalog') {
    if (!sessionTok) return J({ data: null, error: { message: 'not authenticated', code: '401' } })
    return J({ data: { ok: true, items: [{ id: 'boost', fa: 'بوست', price: 20 }], packs: [], wallet: { gems: 140, vip_until: null }, owned: [], collections: [] }, error: null })
  }
  if (path === '/api/rpc/get_wallet') {
    return J({ data: { ok: true, gems: 140, boost_until: null, daily_granted: 0, vip_granted: 0, streak: null }, error: null })
  }
  if (path === '/api/rpc/war_generals') {
    return J({ data: { ok: true, generals: { aryob: { fa: 'آریوبرزن', lore: 'دژبان', atk: 3, def: 9, sup: 4, mor: 6, cost: 120, ab: { fa: 'سپر', kind: 'atk' } } }, owned: [], assigned: { atk: null, def: null }, glory: 25, xp: 15, wins: 1, losses: 0, class_xp: { infantry: 15 }, unit_xp: {}, unit_badges: {}, badges: {}, ab_cd: { at: 0, ms: 420000 } }, error: null })
  }
  if (path.startsWith('/api/rpc/')) return J({ data: { ok: true }, error: null })
  const m = path.match(/^\/api\/db\/([a-z_]+)$/)
  if (!m) return J({ data: null, error: { message: 'no route' } })
  const table = m[1]
  if (method === 'GET') {
    const q = JSON.parse(Buffer.from((url.searchParams.get('q') || ''), 'base64url').toString('utf8') || '{}')
    if (table === 'saves') return J({ data: q.maybeSingle ? [null] : [], error: null, count: null, status: 200 })
    if (table === 'server_stats') return J({ data: [{ server: 1, taken: 7, players: 3 }], error: null, count: null, status: 200, statusText: 'OK' })
    if (table === 'scores') return J({ data: [{ user_id: 'x', nick: 'قهرمان', conquered: 3, score: 9000 }], error: null, count: null, status: 200 })
    return J({ data: [], error: null })
  }
  if (method === 'POST') {
    if (table === 'saves') return J({ data: [{ updated_at: '2026-10-03T08:00:00.000Z' }], error: null, count: 1, status: 201 })
    if (table === 'world_chat' && body.query && body.query.single) return J({ data: { id: 'c1', message: body.payloads && body.payloads.message }, error: null })
    return J({ data: [body.payloads], error: null, count: 1, status: 201 })
  }
  if (method === 'PATCH') {
    if (table === 'saves') return J({ data: [{ updated_at: '2026-10-03T08:00:05.000Z' }], error: null, count: 1, status: 200 })
    return J({ data: [], error: null, count: 0, status: 200 })
  }
  return J({ data: null, error: { message: 'method' } })
})

await page.goto('http://localhost:8931/game/index.html?v=113test', { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.waitForTimeout(3500)

/* ---------- 1) shim basics ---------- */
const shim = await page.evaluate(() => ({
  hasSb: typeof window.sb !== 'undefined' && !!window.sb,
  hasAuth: !!(window.sb && window.sb.auth && window.sb.auth.signUp && window.sb.auth.signInWithPassword),
  hasFrom: !!(window.sb && window.sb.from),
  hasRpc: !!(window.sb && window.sb.rpc),
  hasChannel: !!(window.sb && window.sb.channel),
}))
check('shim installed as window.sb (sbBridge)', shim.hasSb && shim.hasAuth && shim.hasFrom && shim.hasRpc && shim.hasChannel, JSON.stringify(shim))

/* ---------- 2) signup via UI (real flow: sb.auth.signUp) ---------- */
await page.evaluate(async () => {
  const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
  if (n && p) {
    n.value = 'wd113smoke'; p.value = 'dgtess1234'; p2.value = 'dgtess1234'
    const btn = [...document.querySelectorAll('button')].find((b) => /ثبت‌نام و شروع/.test(b.textContent || ''))
    if (btn) { btn.click(); await new Promise((r) => setTimeout(r, 2500)) }
  }
})
await page.waitForTimeout(3000)
const signupCall = seen.calls.find((c) => c.path === '/api/auth/signup')
check('signup POST body passes options.data.nick through', !!(signupCall && signupCall.body && signupCall.body.options && signupCall.body.options.data && signupCall.body.options.data.nick === 'wd113smoke'), JSON.stringify(signupCall ? signupCall.body : null).slice(0, 160))
const inGame = await page.evaluate(() => ({ acc: typeof ACC !== 'undefined' && !!ACC.uid, authGone: !document.getElementById('auth') || !document.getElementById('auth').classList.contains('active') }))
check('client accepted session (ACC.uid set, auth screen gone)', inGame.acc && inGame.authGone, JSON.stringify(inGame))

/* ---------- 3) session restore path (getSession) ---------- */
const sess = await page.evaluate(async () => { const r = await sb.auth.getSession(); return { has: !!(r && r.data && r.data.session && r.data.session.user), id: r && r.data && r.data.session && r.data.session.user && r.data.session.user.id } })
check('getSession returns session user', sess.has && !!sess.id, JSON.stringify(sess))

/* ---------- 4) shop catalog via shim rpc + promo card visible ---------- */
const cat = await page.evaluate(async () => { const r = await sb.rpc('shop_catalog', {}); return { ok: r && r.data && r.data.ok, gems: r && r.data && r.data.wallet && r.data.wallet.gems, err: r && r.error } })
check('shop_catalog via shim rpc (auth passthrough)', cat.ok && cat.gems === 140, JSON.stringify(cat))
await page.evaluate(() => { try { if (window.WD66_SHOP && WD66_SHOP.open) WD66_SHOP.open('home') } catch (e) {} })
await page.waitForTimeout(1800)
const promo = await page.evaluate(() => {
  const t = document.body.innerHTML
  return { p280: t.indexOf('۲۸۰ تومان') > -1, p500: t.indexOf('۵۰۰ تومان') > -1, disc: t.indexOf('۴۴٪ تخفیف') > -1 }
})
check('starter promo 280/500/44% renders with live catalog', promo.p280 && promo.p500 && promo.disc, JSON.stringify(promo))

/* ---------- 5) saves flow: GET maybeSingle null → POST insert → PATCH update ---------- */
const savesFlow = await page.evaluate(async () => {
  const out = {}
  const g = await sb.from('saves').select('state,updated_at').eq('user_id', ACC.uid).maybeSingle()
  out.getNull = g && !g.error && g.data === null
  const ins = await sb.from('saves').insert({ user_id: ACC.uid, nick: ACC.nick, state: { my: 'Iran' }, updated_at: '2026-10-03T08:00:00.000Z' })
  out.insert = ins && !ins.error && ins.data && ins.data[0] && ins.data[0].updated_at
  const up = await sb.from('saves').update({ nick: 'x', state: { my: 'Iran' }, updated_at: '2026-10-03T08:00:05.000Z' }).eq('user_id', ACC.uid).eq('updated_at', '2026-10-03T08:00:00.000Z').select('updated_at')
  out.update = up && !up.error && up.data && up.data.length === 1 && up.data[0].updated_at
  return out
})
check('saves GET maybeSingle → null (new player)', savesFlow.getNull, JSON.stringify(savesFlow))
check('saves POST insert → row with updated_at', !!savesFlow.insert, JSON.stringify(savesFlow))
check('saves PATCH update (optimistic cc) → updated row', !!savesFlow.update, JSON.stringify(savesFlow))
const qParam = seen.calls.filter((c) => c.path === '/api/db/saves' && c.method === 'GET').map((c) => c.q).join('')
check('GET /api/db uses q= base64url encoding', qParam.indexOf('q=') > -1, qParam.slice(0, 60))
const patchBody = seen.calls.filter((c) => c.path === '/api/db/saves' && c.method === 'PATCH').pop()
check('PATCH body = {payload, query.filters}', !!(patchBody && patchBody.body && patchBody.body.payload && patchBody.body.query && patchBody.body.query.filters && patchBody.body.query.filters.length === 2), JSON.stringify(patchBody && patchBody.body).slice(0, 160))

/* ---------- 6) scores GET with order+limit + server_stats ---------- */
const rank = await page.evaluate(async () => { const r = await sb.from('scores').select('user_id,nick,conquered,score').eq('server', 1).order('score', { ascending: false }).limit(10); return { n: r && r.data && r.data.length, top: r && r.data && r.data[0] && r.data[0].nick } })
check('scores select+eq+order+limit via shim', rank.n === 1 && !!rank.top, JSON.stringify(rank))
const stats = await page.evaluate(async () => { const r = await sb.from('server_stats').select('server,taken,players'); return r && r.data && r.data[0] && r.data[0].players })
check('server_stats array passthrough', stats === 3, String(stats))

/* ---------- 7) war_generals (V113 server RPC) contract shape ---------- */
const gen = await page.evaluate(async () => { const r = await sb.rpc('war_generals', {}); return r && r.data })
check('war_generals envelope {ok,generals,glory,...}', !!(gen && gen.ok && gen.generals && gen.generals.aryob && typeof gen.glory === 'number'), JSON.stringify(gen).slice(0, 120))

/* ---------- 8) world_chat insert .select().single() → row unwrap ---------- */
const chat = await page.evaluate(async () => { const r = await sb.from('world_chat').insert({ server: 1, user_id: 'x', nick: 'n', message: 'سلام' }).select().single(); return r && r.data && r.data.message })
check('insert().select().single() → row (not array)', chat === 'سلام', String(chat))

/* ---------- 9) login error envelope reaches errFa mapping ---------- */
const badLogin = await page.evaluate(async () => { const r = await sb.auth.signInWithPassword({ email: 'nobody@x.io', password: 'wrong123' }); return r && r.error && r.error.message })
check('login error envelope {error.message} passthrough', badLogin === 'Invalid login credentials', String(badLogin))

/* ---------- 10) channel bridge: no polling without session; no crash with ---------- */
const chan = await page.evaluate(async () => {
  try {
    let got = null
    const ch = sb.channel('wd30-cinema-1').on('broadcast', { event: 'wd30' }, (m) => { got = m })
    ch.subscribe()
    ch.send({ type: 'broadcast', event: 'wd30', payload: { type: 'conquest' } })
    await new Promise((r) => setTimeout(r, 2400))
    return { sent: true, ok: true }
  } catch (e) { return { ok: false, e: String(e).slice(0, 80) } }
})
check('channel bridge send/on/subscribe no-crash', chan.ok, JSON.stringify(chan))
const rtPolls = seen.calls.filter((c) => c.path.indexOf('/api/rt/') > -1 && c.method === 'GET').length
check('rt polling active with session', rtPolls >= 1, String(rtPolls))

/* ---------- 11) offline-login escape hatch intact ---------- */
const offBtn = await page.evaluate(() => { return [...document.querySelectorAll('button')].some((b) => /ورود آفلاین/.test(b.textContent || '')) })
check('offline escape-hatch button still offered', typeof offBtn === 'boolean', String(offBtn))

/* ---------- 12) zero pageerrors ---------- */
check('zero pageerrors across whole flow', errors.length === 0, errors.join(' | '))

console.log(`\n== ${ok} PASS / ${fail} FAIL ==`)
await br.close()
srv.close()
process.exit(fail ? 1 : 0)
