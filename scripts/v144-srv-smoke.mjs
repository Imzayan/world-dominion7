/* V144 smoke — free server choice + fresh-install picker + online-info freshness.
   Owner directive: «پلیرهای جدید که کشور انتخاب نکردن آزادانه به سرورها رفت‌وآمد داشته باشن،
   فضای درون سرورها رو ببینن و انتخاب کنن در کدوم سرور باشن — رو هر سرور بزنن وارد نقشه همون
   سرور بشن» + fix «اطلاعات آنلاین بودن هر سرور دیر/سرور یک در سرورهای بعدی نشون داده میشه».
   (1) verbatim source guards  (2) real-browser behavior with a mocked multiplayer layer
   Run: node scripts/v144-srv-smoke.mjs */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }

/* ---------- ① verbatim source guards (shipped file = single source of truth) ---------- */
const html = readFileSync(join(ROOT, 'public/game/index.html'), 'utf8')
const social = readFileSync(join(ROOT, 'public/game/social.js'), 'utf8')
const rpcRoute = readFileSync(join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8')
const signupRoute = readFileSync(join(ROOT, 'src/app/api/auth/signup/route.ts'), 'utf8')

check('srvOpen = free choice (non-test only, no chain)', html.includes("const srvOpen=k=>{k=Number(k);return k>=1&&!isTst(k)}"))
check('chain lock function srvFrontier deleted', !html.includes('srvFrontier'))
check('srvListTop spawn rule: new empty server only when ALL non-test known are full',
  html.includes('if(allFull&&M<500)M=M+1') && html.includes('function srvListTop()'))
check('pickServer scans to srvListTop (first non-full recommendation)', html.includes('function pickServer(){const N=srvListTop();for(let k=1;k<=N;k++)if(srvOpen(k)&&taken(k)<SRV_CAP)return k;return N}'))
check('territory_sync: full-server refusal (server_full) replaces chain lock',
  rpcRoute.includes('server_full: true') && !rpcRoute.includes('srvChainOpen') && !rpcRoute.includes('server_locked'))
check('territory_sync member exemption kept (score.server match)',
  rpcRoute.includes('const isMember = !!scRow && scRow.server === server'))
check('wd_servers spawn rule: SRV_COUNT = maxKnown, +1 only when allKnownFull',
  rpcRoute.includes('const SRV_COUNT = allKnownFull ? maxKnown + 1 : maxKnown') && rpcRoute.includes('let allKnownFull = true'))
check('signup creates score with server=0 (unassigned) so fresh installs SEE the picker',
  signupRoute.includes("db.score.create({ data: { userId: user.id, nick, server: 0 } })") && !signupRoute.includes('server: srv0') && !signupRoute.includes('let srv0'))
check('chooseSrv renders space of every server (X/90 + players + live online with patchable id)',
  html.includes("ol.id='wdonl-'+k;r.append(ol);") && html.includes('در حال دریافت آنلاین‌ها…'))
check('beat response never rebuilds an open picker or release flow (__wd139pick/__wdRelFlow guard)',
  html.includes('!bb.__wd139pick&&!bb.__wdRelFlow)renderSrv()'))
check('wdPaintOnlineCounts patches per-row online counters (wdonl-K)',
  html.includes("document.querySelectorAll('[id^=\"wdonl-\"]')"))
check('release flow marked __wdRelFlow=1 (beats cannot kidnap it mid-choice)',
  html.includes("b.__wd139pick=null;b.__wdRelFlow=1;"))
check('initServer: instant presence move + social refresh after server assignment',
  html.includes("window.dispatchEvent(new CustomEvent('wd-srv-changed',{detail:SRV}))") && html.includes('try{wdPresenceBeat(true)}catch(e){}\n  renderSrvChip()'))
check('wdEnterSrv: persist → presence move → reload (tap = enter that server map)',
  html.includes("window.dispatchEvent(new CustomEvent('wd-srv-changed',{detail:k}))}catch(e){}\n    try{wdPresenceBeat(true)}catch(e){}"))
check('social.js: heartbeat fires instantly on wd-srv-changed (no 45s stale online badge)',
  social.includes("window.addEventListener('wd-srv-changed',function(){try{if(myUid())heartbeat()}catch(e){}})"))
check('social.js: m-srv open ALWAYS refetches wd_servers (no 60s stale counts)',
  social.includes('refreshSrvs().then(function(){augmentSrvList()});') && !social.includes('if(!ST.srvs){refreshSrvs()'))
check('no chain-locked rows text anywhere', !html.includes('بعد از پُر شدن سرورهای قبلی باز می‌شود') && !html.includes('قفل زنجیره‌ای دارند'))
check('full-server label honest (90/90 — no room for newcomers)', html.includes('۹۰/۹۰؛ برای تازه‌واردها جا ندارد'))
check('wd31 grid uses srvListTop', html.includes("let M31=(typeof srvListTop==='function')?srvListTop()"))
check('version beacon bumped', html.includes('__WD_V=144') && readFileSync(join(ROOT, 'public/game/v.txt'), 'utf8').trim() === '144')

/* ---------- ② real-browser behavior with mocked multiplayer layer ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf' }
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '').split('?')[0])
  if (p === '/') p = '/game/index.html'
  const f = join(ROOT, 'public', p)
  if (existsSync(f) && !f.endsWith('/')) { res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) } else { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => srv.listen(8944, r))

const errors = []
const br = await chromium.launch()
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
await page.goto('http://localhost:8944/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(3500)
check('zero pageerror on boot', errors.length === 0, errors.join(' | '))
check('V144 beacon live in browser', await page.evaluate(() => window.__WD_V === 144))

/* mock the multiplayer layer: STATS srv1=20/90, srv2=2/90, srv3=90/90(full), no test servers;
   scores row exists with server=0 (fresh-install unassigned state).
   NOTE: game state lives in top-level `let` bindings — assign the bindings directly. */
await page.evaluate(() => {
  const callLog = window.__v144log = { update: [], presence: [] }
  const statsRows = [{ server: 1, taken: 20, players: 3 }, { server: 2, taken: 2, players: 1 }, { server: 3, taken: 90, players: 5 }]
  const qres = (rows) => ({ data: rows, error: null, eq(){ return qres(rows) }, order(){ return qres(rows) }, limit(){ return qres(rows) }, maybeSingle: async () => ({ data: rows[0] || null, error: null }) })
  sb = {
    from(t) {
      return {
        select(){ return qres(t === 'server_stats' ? statsRows : t === 'scores' ? [{ server: 0 }] : []) },
        update(row){ callLog.update.push(row); return { eq(){ return { select: async () => ({ data: [row], error: null }) } } } },
        insert: async (row) => ({ error: null, data: [row] }),
      }
    },
    rpc(fn, args) {
      if (fn === 'srv_meta') return Promise.resolve({ data: { test_srvs: [], cap: 90 } })
      if (fn === 'wd_presence') { callLog.presence.push(args && args.p_server); return Promise.resolve({ data: { servers: [{ server: 1, online: 7 }, { server: 2, online: 4 }, { server: 3, online: 0 }], total: 11, players: [{ nick: 'X' }] } }) }
      return Promise.resolve({ data: null })
    },
  }
  MP_OK = true
  STATS = {}; statsRows.forEach((x) => (STATS[x.server] = x))
  WD_TST = []
  SRV_CAP = 90
  ACC.uid = 'u144'; ACC.nick = 'T144'; ACC.ready = true
  myCountryName = null
  DBMINE = new Set()
})

/* --- spawn rule + recommendation semantics --- */
const sem = await page.evaluate(() => ({
  srvOpen2: srvOpen(2), srvOpen3: srvOpen(3),
  top: srvListTop(), pick: pickServer(),
  topAfterAllFull: (function () { const s1 = STATS[1].taken, s2 = STATS[2].taken; STATS[1].taken = 90; STATS[2].taken = 90; const t = srvListTop(); STATS[1].taken = s1; STATS[2].taken = s2; return t })(),
  pickWhenAllFull: (function () { const s1 = STATS[1].taken, s2 = STATS[2].taken; STATS[1].taken = 90; STATS[2].taken = 90; const p = pickServer(); STATS[1].taken = s1; STATS[2].taken = s2; return p })(),
}))
check('srvOpen: every non-test server is open (2 and 3)', sem.srvOpen2 === true && sem.srvOpen3 === true, JSON.stringify(sem))
check('srvListTop: shows known servers 1..3, NO fake 4th while world has room', sem.top === 3, 'top=' + sem.top)
check('srvListTop: next server appears ONLY when all non-test are 90/90', sem.topAfterAllFull === 4, 'top=' + sem.topAfterAllFull)
check('pickServer recommends first non-full (server 1)', sem.pick === 1, 'pick=' + sem.pick)
check('pickServer falls to the freshly-spawned server when everything is full', sem.pickWhenAllFull === 4, 'pick=' + sem.pickWhenAllFull)

/* --- the REAL fresh-install boot: initServer → picker opens → tap server 2 → persists --- */
const flow = await page.evaluate(() => new Promise((res) => {
  initServer() /* async — opens the picker for the unassigned (server=0) player */
  setTimeout(() => {
    const b = document.getElementById('srv-body')
    const rows = [...b.querySelectorAll('.lobby-item')]
    const srvRows = rows.filter((r) => r.querySelector('.lobby-item-text'))
    const info = {
      rows: srvRows.length,
      texts: srvRows.map((r) => (r.querySelector('.lobby-item-text') || {}).textContent || ''),
      full3: srvRows.some((r) => (r.textContent || '').indexOf('شلوغ — ۹۰/۹۰') >= 0 && (r.textContent || '').indexOf('سرور ۳') >= 0),
      onlineLine: srvRows.some((r) => (r.textContent || '').indexOf('بازیکن آنلاین') >= 0),
      placeholder: [...b.querySelectorAll('[id^="wdonl-"]')].length,
      rec: rows.some((r) => (r.textContent || '').indexOf('پیشنهادی') >= 0 && (r.textContent || '').indexOf('سرور ۱') >= 0),
    }
    const r2 = srvRows.find((r) => (r.textContent || '').indexOf('سرور ۲') >= 0)
    if (r2) r2.click()
    setTimeout(() => res({ info, srv: SRV, updates: window.__v144log.update.slice(), presence: window.__v144log.presence.slice() }), 900)
  }, 200)
}))
await page.waitForTimeout(300)
const pickState = { info: flow.info, updates: flow.updates, presence: flow.presence, k: flow.srv }
check('picker lists exactly the known servers (3 rows, no fake locked row)', pickState.info && pickState.info.rows === 3, JSON.stringify(pickState.info && pickState.info.rows))
check('picker shows free space of every server (X/90 • players)', pickState.info && pickState.info.texts.every((t) => /کشور •/.test(t)), JSON.stringify(pickState.info && pickState.info.texts))
check('picker shows live online line per row (placeholder or number)', pickState.info && pickState.info.onlineLine === true)
check('picker has patchable online counters (wdonl-1..3)', pickState.info && pickState.info.placeholder === 3, JSON.stringify(pickState.info && pickState.info.placeholder))
check('full server 3 labeled شلوغ ۹۰/۹۰', pickState.info && pickState.info.full3 === true)
check('recommended = server 1 (first non-full)', pickState.info && pickState.info.rec === true)
check('free choice: tapping server 2 settles SRV=2 (not the recommendation)', pickState.k === 2, 'SRV=' + pickState.k)
check('choice persisted immediately (scores.update server=2)', JSON.stringify(pickState.updates) === JSON.stringify([{ server: 2 }]), JSON.stringify(pickState.updates))
check('presence moved instantly to the chosen server (beat with p_server=2)', pickState.presence.indexOf(2) >= 0, JSON.stringify(pickState.presence))

/* --- beat response must NOT rebuild an open picker (kidnap fix) --- */
const kidnap = await page.evaluate(async () => {
  const p = chooseSrv()
  setTimeout(() => { try { closeModal('m-srv') } catch (e) {} }, 900)
  await new Promise((r) => setTimeout(r, 120))
  const b = document.getElementById('srv-body')
  const marker = document.createElement('div'); marker.id = 'v144-marker'; b.appendChild(marker)
  await wdPresenceBeat(true)
  return { kept: !!document.getElementById('v144-marker'), patched: (document.getElementById('wdonl-2') || {}).textContent || '' }
})
check('presence beat does NOT wipe an open picker (rows intact)', kidnap.kept === true)
check('beat patches the row counter in place (server 2 → 4 online)', (kidnap.patched || '').indexOf('۴') >= 0 || (kidnap.patched || '').indexOf('4') >= 0, kidnap.patched)
await page.waitForTimeout(1100)
await page.evaluate(() => { try { closeModal('m-srv') } catch (e) {} })

/* --- wdEnterSrv guards (direct binding state) --- */
const guards = await page.evaluate(async () => {
  const n0 = window.__v144log.update.length
  myCountryName = 'Iraq'
  await wdEnterSrv(2) /* has country → must refuse + release guidance, NO persist */
  const refused = window.__v144log.update.length === n0
  try { closeModal('m-srv') } catch (e) {}
  myCountryName = null
  STATS[3] = { server: 3, taken: 90, players: 5 }
  await wdEnterSrv(3) /* full → refused, no persist */
  const fullRefused = window.__v144log.update.length === n0
  WD_TST = [9]
  await wdEnterSrv(9) /* test → refused */
  const tstRefused = window.__v144log.update.length === n0
  WD_TST = []
  return { refused, fullRefused, tstRefused }
})
check('wdEnterSrv: player WITH country is refused (release path, no membership write)', guards.refused)
check('wdEnterSrv: full server 90/90 refused for fresh claims', guards.fullRefused)
check('wdEnterSrv: test server refused', guards.tstRefused)

check('zero pageerror through the whole flow', errors.length === 0, errors.join(' | '))

br.close(); srv.close()
console.log('\nV144 smoke: ' + ok + ' pass / ' + fail + ' fail')
process.exit(fail ? 1 : 0)
