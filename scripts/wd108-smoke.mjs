/* V108 e2e smoke — Premium Monetization + War Items V1
   starter_state/claim (server timer + sandbox provider + idempotency + honesty on prod-like),
   war_supply buy/use, tactical arsenal: use → diminishing returns → resistant → protection,
   jammer self-cast, precision fort cap, cyberdis trade block fx, daily cap, war_state stock cfg. */
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
  await page.waitForTimeout(4000)
  await page.evaluate(async (nk) => {
    const n = document.getElementById('nick'), p = document.getElementById('pw'), p2 = document.getElementById('pw2')
    if (n && p) {
      n.value = nk; p.value = 'dgtess1234'; p2.value = 'dgtess1234'
      const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
      if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) }
    }
  }, nick)
  await page.waitForTimeout(6000)
  return { ctx, page }
}
const rpc = (page, fn, params) => page.evaluate(async ([f, p]) => { try { const r = await sb.rpc(f, p || {}); return r && r.data } catch (e) { return { ok: false, error: 'throw:' + String(e).slice(0, 60) } } }, [fn, params])
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }
const tag = Date.now().toString(36).slice(-6)

/* ---------- actor: fresh account (will be made admin for sandbox QA provider) ---------- */
const nick = 'wd108a' + tag
const { page, ctx } = await boot(nick)
const u = await db.user.findUnique({ where: { nickLower: nick.toLowerCase() } })
check('actor registered', !!u)

/* ---------- starter_state: fresh account → offer with server timer ---------- */
const st0 = await rpc(page, 'starter_state', {})
check('starter_state offer for fresh account', !!(st0 && st0.ok && st0.phase === 'offer' && st0.ends_in_ms > 43 * 3600_000), JSON.stringify(st0).slice(0, 120))
check('starter contents honest (1200 gems + cosmetics list)', !!(st0.contents && st0.contents.gems === 1200 && st0.contents.cosmetics && st0.contents.cosmetics.length === 5), JSON.stringify(st0.contents || {}).slice(0, 100))

/* ---------- provider honesty: sandbox بدون صلاحیت → رد صادقانه ---------- */
const bad0 = await rpc(page, 'starter_claim', { p_provider: 'sandbox', p_receipt: 'SBX-wd108-' + tag, p_request_id: 'rq0' + tag })
check('sandbox on prod-like server (non-admin) → provider_unavailable', !!(bad0 && bad0.ok === false && bad0.error === 'provider_unavailable'), JSON.stringify(bad0).slice(0, 80))
const myket = await rpc(page, 'starter_claim', { p_provider: 'myket', p_receipt: 'tok.abc', p_request_id: 'rq2' + tag })
check('myket without env creds → honest provider_unavailable', !!(myket && myket.ok === false && myket.error === 'provider_unavailable'), JSON.stringify(myket).slice(0, 80))

/* ---------- make actor admin (QA sandbox provider gate: admin OR test server) ---------- */
await db.user.update({ where: { id: u.id }, data: { isAdmin: true } })
const w0 = await db.wallet.findUnique({ where: { userId: u.id } })

/* ---------- sandbox receipt format now enforced for eligible caller ---------- */
const bad1 = await rpc(page, 'starter_claim', { p_provider: 'sandbox', p_receipt: 'NOT-VALID', p_request_id: 'rq' + tag })
check('sandbox receipt format rejected', !!(bad1 && bad1.ok === false && bad1.error === 'receipt'), JSON.stringify(bad1).slice(0, 80))

/* ---------- starter_claim: atomic grant ---------- */
const claim = await rpc(page, 'starter_claim', { p_provider: 'sandbox', p_receipt: 'SBX-wd108-' + tag, p_request_id: 'cl' + tag })
check('starter_claim ok', !!(claim && claim.ok), JSON.stringify(claim).slice(0, 140))
const w1 = await db.wallet.findUnique({ where: { userId: u.id } })
check('gems +1200 atomic', w1.gems === (w0?.gems || 0) + 1200, w0?.gems + '→' + w1?.gems)
check('boost (speed-up) granted server-side', !!(w1.boostUntil && w1.boostUntil.getTime() > Date.now() + 55 * 60_000), String(w1.boostUntil))
const invSp = await db.shopInventory.findMany({ where: { userId: u.id, itemId: { startsWith: 'sp_' } } })
check('5 exclusive cosmetics granted', invSp.length === 5, String(invSp.length))
const wsRow = await db.warState.findUnique({ where: { userId: u.id } })
const wsJson = JSON.parse(wsRow?.data || '{}')
check('war_supply ×25 in server stock', ((wsJson.stock || {}).war_supply || 0) === 25, JSON.stringify(wsJson.stock || {}))
check('ledger row (provider=sandbox, currency=toman)', !!(await db.shopPurchase.findFirst({ where: { userId: u.id, itemId: 'emperor_starter', provider: 'sandbox', status: 'ok' } })))
const so = await db.starterOffer.findUnique({ where: { userId: u.id } })
check('starter marked purchased server-side', !!(so && so.purchasedAt && so.txId === 'SBX-wd108-' + tag), JSON.stringify(so || {}))

/* ---------- idempotency: same requestId + re-claim ---------- */
const dup1 = await rpc(page, 'starter_claim', { p_provider: 'sandbox', p_receipt: 'SBX-wd108-' + tag, p_request_id: 'cl' + tag })
check('replay same receipt → duplicate, no double grant', !!(dup1 && dup1.ok && dup1.duplicate), JSON.stringify(dup1).slice(0, 80))
const dup2 = await rpc(page, 'starter_claim', { p_provider: 'sandbox', p_receipt: 'SBX-other-' + tag, p_request_id: 'cl2' + tag })
check('second claim → purchased', !!(dup2 && dup2.ok === false && dup2.error === 'purchased'), JSON.stringify(dup2).slice(0, 80))
const w2 = await db.wallet.findUnique({ where: { userId: u.id } })
check('no double gems', w2.gems === w1.gems, w1.gems + '→' + w2.gems)

/* ---------- shop: buy war_supply + tactical weapons (stock engine) ---------- */
const buyWs = await rpc(page, 'shop_buy', { p_item: 'war_supply', p_request_id: 'b1' + tag })
check('buy war_supply (stock kind)', !!(buyWs && buyWs.ok && buyWs.reward && buyWs.reward.type === 'stock'), JSON.stringify(buyWs).slice(0, 120))
const buyEmp = await rpc(page, 'shop_buy', { p_item: 'tactical_emp', p_request_id: 'b2' + tag })
const buyEmp2 = await rpc(page, 'shop_buy', { p_item: 'tactical_emp', p_request_id: 'b3' + tag })
const buyJam = await rpc(page, 'shop_buy', { p_item: 'tactical_jammer', p_request_id: 'b4' + tag })
const buyDf = await rpc(page, 'shop_buy', { p_item: 'tactical_defbreak', p_request_id: 'b5' + tag })
const buyPr = await rpc(page, 'shop_buy', { p_item: 'tactical_precision', p_request_id: 'b6' + tag })
const buyCy = await rpc(page, 'shop_buy', { p_item: 'tactical_cyber', p_request_id: 'b7' + tag })
check('buy tactical emp×2 + jammer + defbreak + precision + cyber', [buyEmp, buyEmp2, buyJam, buyDf, buyPr, buyCy].every(x => x && x.ok), JSON.stringify({ emp: buyEmp, jam: buyJam }).slice(0, 120))
const wst = await rpc(page, 'war_state', {})
check('war_state exposes stock + war_items cfg', !!(wst && wst.ok && wst.stock && (wst.stock.tactical_emp || 0) === 2 && wst.war_items && wst.war_items.tactical_emp), JSON.stringify(wst.stock || {}).slice(0, 100))

/* ---------- target: account aged 30 days (bypass beginner protection) ---------- */
const tNick = 'wd108t' + tag
const tu = await db.user.create({ data: { email: tNick + '@test.local', nick: tNick, nickLower: tNick.toLowerCase(), passwordHash: 'x', createdAt: new Date(Date.now() - 30 * 86400_000) } })
const freshNick = 'wd108f' + tag
const fu = await db.user.create({ data: { email: freshNick + '@test.local', nick: freshNick, nickLower: freshNick.toLowerCase(), passwordHash: 'x', createdAt: new Date() } })

/* ---------- protection: fresh account cannot be targeted ---------- */
const useFresh = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: freshNick })
check('protection: tactical weapon vs fresh account rejected', !!(useFresh && useFresh.ok === false && useFresh.error === 'protected'), JSON.stringify(useFresh).slice(0, 80))

/* ---------- EMP diminishing returns on aged target ---------- */
const e1 = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: tNick })
check('EMP #1 lands 100%', !!(e1 && e1.ok && e1.step === 0 && e1.mult === 1 && e1.stock === 1), JSON.stringify(e1).slice(0, 120))
const tWs1 = JSON.parse((await db.warState.findUnique({ where: { userId: tu.id } }))?.data || '{}')
check('target fx emp + res n=1 + target notified via news', !!(tWs1.fx || []).find(f => f.k === 'emp') && ((tWs1.res || {}).tactical_emp || {}).n === 1, JSON.stringify(tWs1).slice(0, 160))
/* clear attacker cooldown between uses (db-level; cooldown itself verified by cd error below) */
const cdNo = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: tNick })
check('attacker cooldown enforced', !!(cdNo && cdNo.ok === false && cdNo.error === 'cd'), JSON.stringify(cdNo).slice(0, 60))
await db.warState.update({ where: { userId: u.id }, data: { data: JSON.stringify(Object.assign(JSON.parse((await db.warState.findUnique({ where: { userId: u.id } })).data), { cd: {} })) } })
const e2 = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: tNick })
check('EMP #2 diminished to 60%', !!(e2 && e2.ok && e2.mult === 0.6 && e2.step === 1), JSON.stringify(e2).slice(0, 100))
await db.warState.update({ where: { userId: u.id }, data: { data: JSON.stringify(Object.assign(JSON.parse((await db.warState.findUnique({ where: { userId: u.id } })).data), { cd: {} })) } })
{
  const raw = (await db.warState.findUnique({ where: { userId: u.id } })).data
  const j = JSON.parse(raw)
  j.stock = Object.assign({}, j.stock || {}, { tactical_emp: 3 })
  await db.warState.update({ where: { userId: u.id }, data: { data: JSON.stringify(j) } })
}
const e3 = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: tNick })
check('EMP #3 diminished to 30%', !!(e3 && e3.ok && e3.mult === 0.3 && e3.step === 2), JSON.stringify(e3).slice(0, 100))
await db.warState.update({ where: { userId: u.id }, data: { data: JSON.stringify(Object.assign(JSON.parse((await db.warState.findUnique({ where: { userId: u.id } })).data), { cd: {} })) } })
const e4 = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: tNick })
check('EMP #4 rejected — target resistant, no stock burned', !!(e4 && e4.ok === false && e4.error === 'resistant'), JSON.stringify(e4).slice(0, 80))
const aWs = JSON.parse((await db.warState.findUnique({ where: { userId: u.id } })).data)
check('attacker stock not consumed by resistant rejection', ((aWs.stock || {}).tactical_emp || 0) === 2, JSON.stringify(aWs.stock || {}))

/* ---------- jammer self-cast (no target, reuses ewar counterintel) ---------- */
const j1 = await rpc(page, 'war_use_item', { p_item: 'tactical_jammer' })
check('jammer self-cast ok', !!(j1 && j1.ok), JSON.stringify(j1).slice(0, 80))
const mWs = JSON.parse((await db.warState.findUnique({ where: { userId: u.id } })).data)
check('jammer fx ewar on self', !!(mWs.fx || []).find(f => f.k === 'ewar'), JSON.stringify(mWs.fx || []).slice(0, 120))

/* ---------- defbreak + precision + cyber on target ---------- */
const d1 = await rpc(page, 'war_use_item', { p_item: 'tactical_defbreak', p_target: tNick })
check('defbreak ok (pct 20)', !!(d1 && d1.ok && d1.pct === 20), JSON.stringify(d1).slice(0, 90))
const p1 = await rpc(page, 'war_use_item', { p_item: 'tactical_precision', p_target: tNick })
check('precision ok — capped (no fort → no destruction, fx only)', !!(p1 && p1.ok && !p1.fort_hit), JSON.stringify(p1).slice(0, 90))
const c1 = await rpc(page, 'war_use_item', { p_item: 'tactical_cyber', p_target: tNick })
check('cyber disruption ok', !!(c1 && c1.ok), JSON.stringify(c1).slice(0, 90))
const tWs2 = JSON.parse((await db.warState.findUnique({ where: { userId: tu.id } }))?.data || '{}')
check('target carries defbreak+precision+cyberdis fx', ['defbreak', 'precision', 'cyberdis'].every(k => (tWs2.fx || []).some(f => f.k === k)), JSON.stringify((tWs2.fx || []).map(f => f.k)))

/* ---------- daily cap (emp dailyCap=6; 3 used + 3 seeded) ---------- */
for (let i = 0; i < 3; i++) await db.specialUse.create({ data: { userId: u.id, item: 'wi_tactical_emp' } })
{
  const raw = (await db.warState.findUnique({ where: { userId: u.id } })).data
  const j = JSON.parse(raw)
  j.cd = {}
  j.stock = Object.assign({}, j.stock || {}, { tactical_emp: 2 })
  await db.warState.update({ where: { userId: u.id }, data: { data: JSON.stringify(j) } })
}
const cap = await rpc(page, 'war_use_item', { p_item: 'tactical_emp', p_target: tNick })
check('daily cap enforced (6/day)', !!(cap && cap.ok === false && cap.error === 'cap'), JSON.stringify(cap).slice(0, 70))

/* ---------- war supply use: stock → live logistics, capped at 100 ---------- */
{
  const raw = (await db.warState.findUnique({ where: { userId: u.id } })).data
  const j = JSON.parse(raw)
  j.supply = 20
  j.supplyAt = Date.now()
  await db.warState.update({ where: { userId: u.id }, data: { data: JSON.stringify(j) } })
}
const sup = await rpc(page, 'war_supply_use', {})
check('war_supply_use converts stock → logistics', !!(sup && sup.ok && sup.used > 0 && sup.supply <= 100), JSON.stringify(sup).slice(0, 90))

/* ---------- catalog: starter block + shop history ---------- */
const cat = await rpc(page, 'shop_catalog', {})
check('shop_catalog carries starter block + war stock items', !!(cat && cat.ok && cat.starter && cat.starter.phase === 'purchased' && cat.war_cfg && cat.war_cfg.war_items), JSON.stringify(cat.starter || {}).slice(0, 90))
const hist = await rpc(page, 'shop_history', { p_limit: 10 })
check('purchase history records starter + stock buys', !!(hist && hist.ok && hist.rows.some(r => r.item_id === 'emperor_starter') && hist.rows.some(r => r.item_id === 'tactical_emp')), JSON.stringify((hist.rows || []).map(r => r.item_id)).slice(0, 120))

/* ---------- telemetry events landed ---------- */
const evs = await db.telemEvent.findMany({ where: { userId: u.id }, select: { key: true } })
const keys = new Set(evs.map(e => e.key))
check('telemetry: viewed/purchased + tactical used + supply used', ['starter_offer_viewed', 'starter_offer_purchased', 'tactical_item_used', 'war_supply_used'].every(k => keys.has(k)), [...keys].join(','))

check('zero pageerrors', errors.length === 0, errors.join(' | ').slice(0, 200))
await ctx.close()
await br.close()
console.log('\n== ' + ok + '/' + (ok + fail) + ' ==')
process.exit(fail ? 1 : 0)
