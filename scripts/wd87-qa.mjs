// V87 QA: glowing icon dock + real TG link (t.me/worlddaminion) + two-step launch reset + v86 backend regression
// Usage: WD_BASE=http://localhost:3100 node scripts/wd87-qa.mjs
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const BASE = process.env.WD_BASE || 'http://localhost:3100'
const URL = BASE + '/game/index.html?v=' + Date.now()
const TG_EXPECT = 'https://t.me/worlddaminion'
let pass = 0, fail = 0
const check = (name, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + name + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + name + (info ? ' — ' + info : '')) } }
const db = new PrismaClient()
await db.gameSetting.deleteMany({ where: { key: 'wd_test_srvs' } }).catch(() => {})
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

/* ---------- 1) fresh user: glowing dock ---------- */
const NICK1 = 'q87' + Math.random().toString(36).slice(2, 7)
{
  const { ctx, page } = await boot(NICK1)

  const st = await page.evaluate(() => {
    const strip = document.getElementById('hud-strip')
    const dock = document.getElementById('wd87dock')
    const vis = (e) => e && getComputedStyle(e).display !== 'none'
    const btn = (id) => document.getElementById(id)
    const gift = btn('wd87-b-gift')
    return {
      dockInStrip: dock && strip && dock.parentNode === strip,
      dockVisible: vis(dock),
      btns: ['wd87-b-gift', 'wd87-b-gem', 'wd87-b-terr', 'wd87-b-srv', 'wd87-b-snd'].map(id => !!btn(id)),
      giftAnim: gift ? getComputedStyle(gift).animationName : '',
      giftShine: gift ? getComputedStyle(gift, '::after').animationName : '',
      gemBadge: (btn('wd87-b-gem') || {}).textContent || '',
      legacyHidden: ['wd86-gift', 'hud-gem', 'hud-t2', 'hud-srv2', 'hud-snd'].map(id => {
        const e = document.getElementById(id)
        return !e || !strip || e.parentNode !== strip ? 'absent' : getComputedStyle(e).display
      }),
      visibleChildren: strip ? [...strip.children].filter(c => getComputedStyle(c).display !== 'none').map(c => c.id) : [],
      dateVisible: vis(document.getElementById('hud-date')),
      srvOn: !!(btn('wd87-b-srv') && btn('wd87-b-srv').classList.contains('wd87-on')),
      srv2txt: (document.getElementById('wd-srv-b') || {}).textContent || '',
    }
  })
  check('V87 dock built inside hud-strip & visible', st.dockInStrip && st.dockVisible, JSON.stringify(st.visibleChildren))
  check('dock has 5 glowing buttons', st.btns.every(Boolean), JSON.stringify(st.btns))
  check('gift breathing glow + cinematic shine', st.giftAnim.includes('wd87brth') && st.giftShine === 'wd87shine', st.giftAnim + '/' + st.giftShine)
  check('gem badge renders Persian digits', /[۰-۹]/.test(st.gemBadge), st.gemBadge)
  check('legacy text chips hidden in strip', st.legacyHidden.every(d => d === 'absent' || d === 'none'), JSON.stringify(st.legacyHidden))
  check('only visible strip child is the dock', JSON.stringify(st.visibleChildren) === JSON.stringify(['wd87dock']), JSON.stringify(st.visibleChildren))
  check('top-left date chip still visible', st.dateVisible)
  check('fresh user routed to server 2 (server1=test)', st.srv2txt.indexOf('۲') >= 0, st.srv2txt)
  await page.waitForTimeout(4000)
  const srvOn = await page.evaluate(() => { const b = document.getElementById('wd87-b-srv'); return b ? b.classList.contains('wd87-on') : false })
  check('server dot goes live-green after connect', srvOn)

  const meta = await page.evaluate(async () => { try { const r = await sb.rpc('srv_meta'); return r && r.data } catch (e) { return { err: String(e) } } })
  check('srv_meta returns test_srvs [1]', JSON.stringify(meta) === JSON.stringify({ test_srvs: [1] }), JSON.stringify(meta))

  /* ---------- 2) gift → TG modal → real link → 20 gems one-shot ---------- */
  await page.evaluate(() => {
    window.__openUrls = []
    window.open = (u) => { window.__openUrls.push(String(u)); return null }
  })
  await page.evaluate(() => { try { document.getElementById('wd87-b-gift').click() } catch (e) { } })
  await page.waitForTimeout(700)
  const mo = await page.evaluate(() => {
    const m = document.getElementById('wd86-tgm')
    return { open: !!(m && m.classList.contains('active')), copy: m ? m.textContent.includes('جم هدیه') : false, btn: !!document.getElementById('wd86-go') }
  })
  check('dock gift click opens telegram modal', mo.open && mo.copy && mo.btn)
  const gems0 = await page.evaluate(() => { const b = document.getElementById('wd87-b-gem'); return b ? b.textContent : '' })
  await page.evaluate(() => { try { document.getElementById('wd86-go').click() } catch (e) { } })
  await page.waitForTimeout(1200)
  const urls = await page.evaluate(() => window.__openUrls || [])
  check('join button opens https://t.me/worlddaminion', urls.includes(TG_EXPECT), JSON.stringify(urls))
  /* دکمه‌ی مودال خودش tg_bonus را صدا می‌زند — بعد از آن، فراخوانی دستی باید claimed برگردد */
  const c1 = await page.evaluate(async () => { try { const r = await sb.rpc('tg_bonus'); return r && r.data } catch (e) { return { err: String(e).slice(0, 60) } } })
  check('tg_bonus one-shot server-side (button claim already consumed it)', c1 && c1.ok === false && c1.error === 'claimed', JSON.stringify(c1))
  await page.evaluate(async () => { try { await loadWallet() } catch (e) { } })
  await page.waitForTimeout(1800)
  const gemState = await page.evaluate(() => {
    const g = document.getElementById('wd87-b-gift'), b = document.getElementById('wd87-b-gem')
    return { done: !!(g && g.classList.contains('wd87-done')), badge: b ? b.textContent : '' }
  })
  check('gem badge reflects +20 after claim', gemState.badge !== gems0 && /[۰-۹]/.test(gemState.badge), gems0 + ' -> ' + gemState.badge)
  check('gift button dims to claimed state', gemState.done)
  await page.evaluate(() => { try { document.getElementById('wd87-b-gift').click() } catch (e) { } })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/home/z/my-project/download/v87-tg-modal.png' })
  await page.evaluate(() => { try { document.getElementById('wd86-tgm').classList.remove('active') } catch (e) { } })

  /* ---------- 3) sound mirror + doom mirror ---------- */
  await page.evaluate(() => { try { document.getElementById('wd87-b-snd').click() } catch (e) { } })
  await page.waitForTimeout(1600)
  const snd = await page.evaluate(() => {
    const b = document.getElementById('wd87-b-snd'), l = document.getElementById('hud-snd')
    return { muted: !!(b && b.classList.contains('wd87-muted')), legacy: l ? l.textContent : '' }
  })
  check('dock sound button mirrors mute state', snd.muted && String(snd.legacy).indexOf('🔇') >= 0, snd.legacy)
  await page.evaluate(() => { try { document.getElementById('wd87-b-snd').click() } catch (e) { } })
  await page.waitForTimeout(1500)
  const snd2 = await page.evaluate(() => { const b = document.getElementById('wd87-b-snd'); return b ? b.classList.contains('wd87-muted') : null })
  check('unmute mirrors back', snd2 === false)

  const doom = await page.evaluate(async () => {
    try { if (typeof doomChipEnsure === 'function') doomChipEnsure() } catch (e) { }
    const hd = document.getElementById('hud-doom')
    if (!hd) return { none: true }
    const bar = hd.querySelector('.w43-dbar i')
    if (bar) bar.style.width = '42%'
    hd.classList.add('mid')
    await new Promise(r => setTimeout(r, 1600))
    const b = document.getElementById('wd87-b-doom')
    const dst = b && b.querySelector('.wd87-dbar i')
    return { none: false, built: !!b, w: dst ? dst.style.width : '', mid: !!(b && b.classList.contains('wd87-mid')) }
  })
  check('doom chip mirrored into dock (bar+state)', !doom.none && doom.built && doom.w === '42%' && doom.mid, JSON.stringify(doom))

  await page.screenshot({ path: '/home/z/my-project/download/v87-map-top.png' })
  await ctx.close()
}

/* ---------- 4) admin: two-step launch reset ---------- */
const NICK2 = 'q87a' + Math.random().toString(36).slice(2, 6)
{
  await db.user.updateMany({ where: { nickLower: NICK2 }, data: { isAdmin: false } })
  const { ctx, page } = await boot(NICK2)
  const u = await db.user.findUnique({ where: { nickLower: NICK2 } })
  if (u) {
    await db.wallet.upsert({ where: { userId: u.id }, create: { userId: u.id, gems: 5 }, update: {} })
    await db.user.update({ where: { id: u.id }, data: { isAdmin: true } })
  }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(8000)

  /* seed gameplay rows so the wipe has something real to erase */
  if (u) {
    await db.score.create({ data: { userId: u.id, server: 2, conquered: 3, score: 500 } }).catch((e) => console.log('seed score', String(e).slice(0, 80)))
    await db.territory.create({ data: { userId: u.id, server: 2, country: 'Brazil', nick: NICK2 } }).catch((e) => console.log('seed terr', String(e).slice(0, 80)))
    await db.save.create({ data: { userId: u.id, nick: NICK2, state: JSON.stringify({ gold: 1000 }) } }).catch((e) => console.log('seed save', String(e).slice(0, 80)))
  }
  const before = {
    scores: await db.score.count({ where: { userId: u ? u.id : '' } }),
    terr: await db.territory.count({ where: { userId: u ? u.id : '' } }),
    saves: await db.save.count({ where: { userId: u ? u.id : '' } }),
  }
  check('seed rows present before reset', before.scores >= 1 && before.terr >= 1 && before.saves >= 1, JSON.stringify(before))

  await page.evaluate(async () => {
    try {
      if (typeof openModal === 'function') openModal('m-admin')
      else { const m = document.getElementById('m-admin'); if (m) m.classList.add('active') }
    } catch (e) { }
  })
  await page.waitForTimeout(4200) /* adminCheck interval builds the box while modal is active */
  const btnOk = await page.evaluate(() => !!document.getElementById('wd86-launch') && !!document.getElementById('wd86-goreset'))
  check('admin panel shows Myket launch-reset button', btnOk)

  /* first click = arm only (no RPC, no reset) */
  await page.evaluate(() => { try { document.getElementById('wd86-goreset').click() } catch (e) { } })
  await page.waitForTimeout(600)
  const arm = await page.evaluate(() => {
    const b = document.getElementById('wd86-goreset')
    return { armed: !!(b && b.classList.contains('wd87-armed')), txt: b ? b.textContent : '', disabled: b ? b.disabled : null }
  })
  check('1st click arms the button (two-step, no window.confirm)', arm.armed && arm.txt.indexOf('⚠️') >= 0 && arm.disabled === false, arm.txt)
  const midCount = await db.score.count()
  check('armed click did NOT wipe yet', midCount >= 1, 'scores=' + midCount)

  /* second click = fire */
  await page.evaluate(() => { try { document.getElementById('wd86-goreset').click() } catch (e) { } })
  await page.waitForTimeout(5000) /* rpc + wipe + auto reload */
  const after = {
    scores: await db.score.count(), terr: await db.territory.count(), saves: await db.save.count(),
    champs: await db.olympicChampion.count(),
  }
  check('two-step reset wipes records/territories/saves/medals', after.scores === 0 && after.terr === 0 && after.saves === 0 && after.champs === 0, JSON.stringify(after))
  const u2 = await db.user.findUnique({ where: { nickLower: NICK2 }, include: { wallet: true } })
  check('wallet preserved through reset', !!u2 && !!u2.wallet && u2.wallet.gems >= 5, 'gems=' + (u2 && u2.wallet ? u2.wallet.gems : '?'))

  const meta2 = await page.evaluate(async () => { try { const r = await sb.rpc('srv_meta'); return r && r.data } catch (e) { return {} } })
  check('after reset: test_srvs [] (server1 open for Myket)', JSON.stringify(meta2) === JSON.stringify({ test_srvs: [] }), JSON.stringify(meta2))
  const pick1 = await page.evaluate(() => { try { WD_TST = []; return pickServer() } catch (e) { return 'ERR:' + String(e).slice(0, 60) } })
  check('after reset pickServer() -> 1 (fresh Myket start)', pick1 === 1, String(pick1))
  await ctx.close()
}

console.log(`\n=== wd87-qa: ${pass} pass, ${fail} fail, pageerrors=${errors.length} ===`)
if (errors.length) console.log('pageerrors:', errors.slice(0, 4))
await db.$disconnect()
await browser.close()
process.exit(fail || errors.length ? 1 : 0)
