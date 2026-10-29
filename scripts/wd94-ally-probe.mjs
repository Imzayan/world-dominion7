/* U7 e2e: alliance_create → alliance_op(null) → seed 1995 → real official sprint submit crosses goal → done + 30 gems */
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const br = await chromium.launch()
const errors = []
async function boot(nick) {
  const ctx = await br.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Mobile Chrome/124.0', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))
  await page.goto('http://localhost:3000/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 })
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
const rpc = (page, fn, params) => page.evaluate(async ([f, p]) => { try { const r = await sb.rpc(f, p || {}); return r && r.data } catch (e) { return { ok: false, error: 'throw:' + String(e).slice(0, 60) } } }, [fn, params])
function sprintTel(strides, reactMs = 150, gapMs = 165) {
  const ev = [['go', 300]]
  let t = 300 + reactMs, side = 0
  for (let i = 0; i < strides; i++) { ev.push(['p', Math.round(t), side]); side = 1 - side; t += gapMs }
  return { s: 0, e: Math.round(t + 1500), ev }
}
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }
const nick = 'allop' + Date.now().toString(36).slice(-6)
const { page } = await boot(nick)
const u = await db.user.findUnique({ where: { nickLower: nick.toLowerCase() } })
check('user registered', !!u)

/* اتحاد مستقیم از db — گیت هزینه‌ی alliance_create کد قدیمی‌تر است و هدف تست، U7 است */
const al = await db.alliance.create({ data: { server: 2, name: 'تست جنگ اتحاد', tag: 'T' + Date.now().toString(36).slice(-3).toUpperCase(), ownerUid: u.id, ownerNick: nick } })
await db.allianceMember.create({ data: { allianceId: al.id, userId: u.id, nick, role: 'owner' } })
check('alliance seeded (db)', !!al.id)
const op0 = await rpc(page, 'alliance_op', {})
check('op status before first event', !!(op0 && op0.ok && op0.has_alliance && op0.op === null), JSON.stringify(op0).slice(0, 80))
const wk = (() => { const d = new Date(); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const wd = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() - wd + 1); return t.toISOString().slice(0, 10) })()
const mem = await db.allianceMember.findUnique({ where: { userId: u.id } })
const w0 = await db.wallet.findUnique({ where: { userId: u.id } })
await db.allianceOp.create({ data: { allianceId: mem.allianceId, weekKey: wk, goal: 2000, progress: 1995 } })
const takenT = new Set((await db.territory.findMany({ where: { server: 2 }, select: { country: true } })).map(x => x.country))
const freeC = ['Iran', 'Brazil', 'France', 'Japan', 'Egypt', 'Canada', 'Sweden', 'Kenya', 'Peru', 'Nepal'].find(c => !takenT.has(c)) || ('Qa' + Date.now().toString(36).slice(-6))
await db.territory.create({ data: { server: 2, country: freeC, userId: u.id, nick, isCapital: true } })
const reg = await rpc(page, 'olympic_register', { p_disciplines: ['sprint'], p_country_fa: 'ایران' })
console.log('  register:', JSON.stringify(reg).slice(0, 90))
const st = await rpc(page, 'olympic_start', { p_discipline: 'sprint', p_mode: 'official' })
check('olympic official start (live window)', !!(st && st.ok), JSON.stringify(st).slice(0, 80))
await page.waitForTimeout(9000) /* گیت ۸ ثانیه‌ی lastAt — ضد اتوکلیک */
const tel = sprintTel(40)
const sub = await rpc(page, 'olympic_submit', { p_discipline: 'sprint', p_match_id: st.match_id, p_nonce: st.token, p_telemetry: tel })
check('official submit accepted by judge', !!(sub && sub.ok), JSON.stringify(sub).slice(0, 90))
const op1 = await rpc(page, 'alliance_op', {})
check('op done after real submit (1995+score/100≥2000)', !!(op1 && op1.op && op1.op.done === true), JSON.stringify(op1).slice(0, 120))
check('reward granted 30 gems (atomic, once)', !!(op1 && op1.op && op1.op.rewarded_now === 30), 'rewarded_now=' + (op1 && op1.op ? op1.op.rewarded_now : 'n/a'))
const w1 = await db.wallet.findUnique({ where: { userId: u.id } })
check('wallet gems incremented +30', w1.gems === (w0 ? w0.gems : 0) + 30, (w0 ? w0.gems : 0) + ' -> ' + w1.gems)
const op2 = await rpc(page, 'alliance_op', {})
check('reward NOT double-granted on second call', op2.op.rewarded_now === 0)
const myTop = op1.op.top && op1.op.top.length && op1.op.top[0].v > 0
check('top contributors carries my score', !!myTop)
check('zero pageerrors', errors.length === 0, errors.join(' | '))
await br.close(); await db.$disconnect()
console.log('RESULT ' + ok + ' pass, ' + fail + ' fail')
process.exit(fail ? 1 : 0)
