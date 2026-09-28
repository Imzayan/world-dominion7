// V86 QA: top-strip tidy + telegram reward (20 gems one-shot) + test-server lock + launch reset
// Usage: WD_BASE=http://localhost:3000 node scripts/wd86-qa.mjs
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const BASE = process.env.WD_BASE || 'http://localhost:3000'
const URL = BASE + '/game/index.html?v=' + Date.now()
let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }
const db = new PrismaClient()
/* V89: server1=test-lock لازم است — تنظیم می‌شود (سایت‌های بعدی هم deleteMany می‌زنند) */
await db.gameSetting.upsert({ where: { key: 'wd_test_srvs' }, update: { value: '[1]' }, create: { key: 'wd_test_srvs', value: '[1]' } }).catch(() => {})
const browser = await chromium.launch({ headless: true })
const errors = []

async function boot(nick) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36',
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(5000)
  await page.evaluate(async (nk) => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) {
      n.value = nk; p.value = 'dgtess1234'; p2.value = 'dgtess1234'
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) }
    }
  }, nick)
  await page.waitForTimeout(7000)
  return { ctx, page }
}

/* ---------- 1) fresh user: strip tidy + gift chip + server lock ---------- */
const NICK1 = 'q86' + Math.random().toString(36).slice(2, 7)
{
  const { ctx, page } = await boot(NICK1)

  const st = await page.evaluate(() => {
    const g = document.getElementById('wd86-gift')
    const strip = document.getElementById('hud-strip')
    const inStrip = g && strip && g.parentNode === strip
    const shine = g ? getComputedStyle(g, '::after').animationName : ''
    const glow = g ? getComputedStyle(g).animationName : ''
    const ord = (id) => { const e = document.getElementById(id); return e && strip && e.parentNode === strip ? getComputedStyle(e).order : null }
    return {
      gift: !!g, inStrip, shine, glow,
      badge: g ? (g.querySelector('.wd86-tb') || {}).textContent || '' : '',
      noTerr: !document.getElementById('hud-terr'),
      noSrv: !document.getElementById('hud-srv'),
      srv2txt: (document.getElementById('wd-srv-b') || {}).textContent || '',
      stripOrder: strip ? [...strip.children].filter(c => getComputedStyle(c).display !== 'none').map(c => c.id).sort((a, b) => (ord(a) ?? 99) - (ord(b) ?? 99)) : [],
    }
  })
  check('V86 gift chip built inside hud-strip', st.gift && st.inStrip)
  check('gift chip cinematic shine+glow (CSS anims)', st.shine === 'wd86shine' && st.glow === 'wd86glow', st.shine + '/' + st.glow)
  check('gift badge shows +۲۰', st.badge.includes('۲۰'), st.badge)
  check('legacy junk chips removed (hud-terr/hud-srv)', st.noTerr && st.noSrv)
  check('fresh user routed to server 2 (server1=test)', st.srv2txt.indexOf('۲') >= 0 && st.srv2txt.indexOf('سرور') >= 0, st.srv2txt)
  check('strip row order [gift,gem,countries,server]', JSON.stringify(st.stripOrder) === JSON.stringify(['wd86-gift', 'hud-gem', 'hud-srv2', 'hud-doom']), JSON.stringify(st.stripOrder))

  const meta = await page.evaluate(async () => { try { const r = await sb.rpc('srv_meta'); return r && r.data } catch (e) { return { err: String(e) } } })
  check('srv_meta returns test_srvs [1]', JSON.stringify(meta) === JSON.stringify({ test_srvs: [1] }), JSON.stringify(meta))

  const srvList = await page.evaluate(async () => {
    try { await loadStats(); renderSrv() } catch (e) { }
    const b = document.getElementById('srv-body')
    return b ? b.textContent : ''
  })
  check('servers window: server1 flagged 🧪 تستی + درِ ورود بسته', srvList.includes('🧪 سرور تستی — درِ ورود بسته'), '')
  check('servers window: server2 shows 🟢 باز', srvList.includes('سرور ۲') && srvList.includes('🟢 باز'), '')

  /* test-server server-side guard: territory_sync on server 1 must be refused for fresh non-admin */
  const tg1 = await page.evaluate(async () => {
    try { const r = await sb.rpc('territory_sync', { p_server: 1, p_held: ['Brazil'], p_capital: 'Brazil' }); return r && r.data } catch (e) { return { err: String(e).slice(0, 80) } }
  })
  check('territory_sync on test server refused (test_server:true)', !!tg1 && tg1.test_server === true, JSON.stringify(tg1).slice(0, 90))

  /* ---------- 2) telegram reward flow ---------- */
  await page.evaluate(() => { try { document.getElementById('wd86-gift').click() } catch (e) { } })
  await page.waitForTimeout(700)
  const mo = await page.evaluate(() => {
    const m = document.getElementById('wd86-tgm')
    return { open: !!(m && m.classList.contains('active')), copy: m ? m.textContent.includes('جم هدیه') : false, btn: !!document.getElementById('wd86-go') }
  })
  check('gift click opens telegram modal with copy+button', mo.open && mo.copy && mo.btn)

  const gems0 = await page.evaluate(() => { const g = document.getElementById('hud-gem'); const s = g && g.querySelector('.wd39-gem-n'); return s ? s.textContent : ((g || {}).textContent || '') })
  const c1 = await page.evaluate(async () => { try { const r = await sb.rpc('tg_bonus'); return r && r.data } catch (e) { return { err: String(e).slice(0, 60) } } })
  check('tg_bonus first claim ok granted 20', c1 && c1.ok === true && c1.granted === 20, JSON.stringify(c1))
  const c2 = await page.evaluate(async () => { try { const r = await sb.rpc('tg_bonus'); return r && r.data } catch (e) { return { err: String(e).slice(0, 60) } } })
  check('tg_bonus second claim rejected (claimed)', c2 && c2.ok === false && c2.error === 'claimed', JSON.stringify(c2))
  await page.evaluate(async () => { try { await loadWallet() } catch (e) { } })
  await page.waitForTimeout(1500)
  const gems1 = await page.evaluate(() => { const g = document.getElementById('hud-gem'); const s = g && g.querySelector('.wd39-gem-n'); return s ? s.textContent : ((g || {}).textContent || '') })
  check('gem counter reflects +20 after claim+refresh', gems1 !== gems0, gems0 + ' -> ' + gems1)

  await page.evaluate(() => { try { document.getElementById('wd86-gift').click() } catch (e) { } })
  await page.waitForTimeout(400)
  await page.screenshot({ path: '/home/z/my-project/download/v86-tg-modal.png' })
  const done = await page.evaluate(() => { const g = document.getElementById('wd86-gift'); return g ? g.classList.contains('wd86-done') : false })
  check('gift chip switches to claimed (dimmed) state', done)
  await page.screenshot({ path: '/home/z/my-project/download/v86-map-top.png' })
  await ctx.close()
}

/* ---------- 3) admin: launch reset ---------- */
const NICK2 = 'q86a' + Math.random().toString(36).slice(2, 6)
{
  await db.user.updateMany({ where: { nickLower: NICK2 }, data: { isAdmin: false } })
  const { ctx, page } = await boot(NICK2)
  const u = await db.user.findUnique({ where: { nickLower: NICK2 } })
  if (u) { await db.wallet.upsert({ where: { userId: u.id }, create: { userId: u.id, gems: 5 }, update: {} }); await db.user.update({ where: { id: u.id }, data: { isAdmin: true } }) }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(8000) /* adminCheck interval (2.5s) + wallet boot */
  const adm = await page.evaluate(async () => { try { const r = await sb.rpc('is_admin'); return r && r.data } catch (e) { return false } })
  check('QA admin flagged (is_admin RPC)', adm === true)

  const btn = await page.evaluate(async () => {
    try {
      if (typeof openModal === 'function') openModal('m-admin')
      else { const m = document.getElementById('m-admin'); if (m) m.classList.add('active') }
      return true
    } catch (e) { return false }
  })
  await page.waitForTimeout(4000) /* adminCheck interval builds the box while modal is active */
  const btnOk = await page.evaluate(() => !!document.getElementById('wd86-launch') && !!document.getElementById('wd86-goreset'))
  check('admin panel shows Myket launch-reset button', !!btn && btnOk)

  const reset = await page.evaluate(async () => { try { const r = await sb.rpc('admin_launch_reset'); return r && r.data } catch (e) { return { err: String(e).slice(0, 80) } } })
  check('admin_launch_reset ok', !!reset && reset.ok === true, JSON.stringify(reset))

  const meta2 = await page.evaluate(async () => { try { const r = await sb.rpc('srv_meta'); return r && r.data } catch (e) { return {} } })
  check('after reset: test_srvs [] (server1 open for Myket)', JSON.stringify(meta2) === JSON.stringify({ test_srvs: [] }), JSON.stringify(meta2))

  const scores = await db.score.count()
  const terr = await db.territory.count()
  const champs = await db.olympicChampion.count()
  const u2 = await db.user.findUnique({ where: { nickLower: NICK2 }, include: { wallet: true } })
  check('records/territories/olympic medals wiped', scores === 0 && terr === 0 && champs === 0, `scores=${scores} terr=${terr} champs=${champs}`)
  check('wallet (gems/tg flag) preserved', !!u2 && !!u2.wallet && u2.wallet.gems >= 5, 'gems=' + (u2 && u2.wallet ? u2.wallet.gems : '?'))

  const pick1 = await page.evaluate(() => { try { WD_TST = []; return pickServer() } catch (e) { return 'ERR:' + String(e).slice(0, 60) } })
  check('after reset pickServer() -> 1 (fresh Myket start)', pick1 === 1, String(pick1))
  await ctx.close()
}

console.log(`\n=== wd86-qa: ${pass} pass, ${fail} fail, pageerrors=${errors.length} ===`)
if (errors.length) console.log('pageerrors:', errors.slice(0, 4))
await db.$disconnect()
await browser.close()
process.exit(fail || errors.length ? 1 : 0)
