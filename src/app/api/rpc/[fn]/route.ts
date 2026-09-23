import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/* ============================================================
   Supabase-compatible RPC endpoint.
   Implements every sb.rpc(...) call the game makes:
   get_wallet, spend_gems, is_admin, claim_admin_grants,
   claim_weekly_rewards, release_inactive_territories,
   pvp_attack, pvp_capture_territory, get_world_news,
   get_world_chat, wd_init_player, wd_get_state, olympics (V31)
   ============================================================ */

const GEM_COSTS: Record<string, number> = {
  /* economy boosters (v3) */
  boost: 20, gold: 15, oil: 15, peace: 12, tax: 6,
  /* V27 — cosmetics & services: visuals / convenience / collection only, zero combat power (anti-P2W rule) */
  col_pack: 25, emblem: 20, title: 25, border_glow: 30, fx_conq: 20,
  lucky: 10, medal_s1: 40, vip7: 45, radar: 30, stats: 15, bundle_cos: 100
}
const WEEKLY_REWARDS: Record<number, number> = { 1: 5000, 2: 2500, 3: 1000 }
const WEEKLY_CATEGORIES = ['score', 'kills', 'economy', 'recruits'] as const

function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${week}`
}

async function addNews(server: number, action: string, country: string | null, actorNick: string | null, targetNick: string | null) {
  try {
    await db.worldNews.create({ data: { server, action, country, actorNick, targetNick } })
  } catch (e) { console.log('addNews', e) }
}

async function ensureWallet(userId: string) {
  let w = await db.wallet.findUnique({ where: { userId } })
  if (!w) w = await db.wallet.create({ data: { userId, gems: 0 } })
  return w
}

/** daily login bonus: +20 gems per calendar day */
async function dailyBonus(userId: string) {
  const w = await ensureWallet(userId)
  const today = new Date().toISOString().slice(0, 10)
  const last = w.lastDaily ? new Date(w.lastDaily.toISOString().slice(0, 10)).toISOString().slice(0, 10) : null
  if (last !== today) {
    const updated = await db.wallet.update({ where: { userId }, data: { gems: w.gems + 20, lastDaily: new Date() } })
    return { w: updated, granted: 20 }
  }
  return { w, granted: 0 }
}

/* ---------- capture transfer shared by pvp_attack success & pvp_capture_territory ---------- */
const lastCapture = new Map<string, number>()

async function transferTerritory(server: number, country: string, uid: string, nick: string): Promise<{ ok: boolean; error?: string; prevOwner?: string }> {
  const t = await db.territory.findUnique({ where: { server_country: { server, country } } })
  if (!t) return { ok: false, error: 'not found' }
  if (t.userId === uid) return { ok: false, error: 'own' }
  const prevOwner = t.userId
  await db.territory.update({ where: { server_country: { server, country } }, data: { userId: uid, nick, isCapital: false } })
  const cnt = await db.territory.count({ where: { server, userId: prevOwner } })
  if (cnt === 0) {
    // the defender lost everything: free the capital too so they can restart
    await db.territory.deleteMany({ where: { server, userId: prevOwner } })
  }
  const rows = await db.territory.groupBy({ by: ['userId'], where: { server } })
  const taken = await db.territory.count({ where: { server } })
  await db.serverStat.upsert({
    where: { server },
    create: { server, taken, players: rows.length },
    update: { taken, players: rows.length },
  })
  await addNews(server, 'pvp_capture', country, nick, t.nick)
  return { ok: true, prevOwner }
}

/* ---------- P2P trade offers (V28) ----------
   Resources live inside each player's save.state JSON ({res:{gold,oil,food}}).
   Offers are validated server-side at create AND at accept time, so neither
   side can cheat. A small fee is burned on every completed trade. */
const TRADE_FEE = 0.03
const TRADE_RES = new Set(['gold', 'oil', 'food'])

const resNum = (v: unknown): number => Math.max(0, Math.round(Number(v) || 0))

function tradeRes(stateJson: string): { obj: Record<string, unknown>; res: Record<string, number> } {
  let obj: Record<string, unknown> = {}
  try { obj = JSON.parse(stateJson || '{}') || {} } catch { obj = {} }
  const res = (obj.res || {}) as Record<string, number>
  return { obj, res }
}

async function tradeApply(uid: string, mut: (res: Record<string, number>) => void): Promise<boolean> {
  const save = await db.save.findUnique({ where: { userId: uid } })
  if (!save) return false
  const { obj, res } = tradeRes(save.state)
  mut(res)
  for (const k of ['gold', 'oil', 'food']) {
    if (res[k] === undefined) res[k] = 0
    if (!Number.isFinite(res[k]) || res[k] < 0) return false
  }
  obj.res = res
  await db.save.update({ where: { userId: uid }, data: { state: JSON.stringify(obj) } })
  return true
}

/* ============================================================
   V32 — Olympic Champion (تاج‌گذاری هفتگی + جایزه‌ی واقعی)
   Every 7 days the medal-table #1 is crowned automatically:
   💎 4 gems + 🪙 100,000 gold + 10k oil + 10k food + 5k steel
   + 24h production boost + permanent champion medal (visible to all).
   Crowning is lazy (triggered by olympics/olympic_status/season_reset)
   and race-safe via the unique (server, cycle) constraint.
   ============================================================ */
const CYCLE_MS = 7 * 86400000
const OL_REWARDS = { gems: 4, gold: 100000, oil: 10000, food: 10000, steel: 5000, boost_hours: 24 }
const olCycle = (ms = Date.now()) => Math.floor(ms / CYCLE_MS)

type OlAgg = { server: number; players: number; disciplines: { key: string; top: { nick: string; val: number }[] }[]; medals: { nick: string; g: number; s: number; b: number; total: number; score: number }[] }

/* medal-table computation shared by the olympics page and the crowning (V31 logic, extracted) */
async function olympicCompute(server: number): Promise<OlAgg> {
  const rows = await db.score.findMany({
    where: { server },
    orderBy: [{ score: 'desc' }, { conquered: 'desc' }],
    take: 200,
  })
  const since = new Date(Date.now() - 7 * 86400000)
  const news = await db.worldNews.findMany({
    where: { server, createdAt: { gte: since } },
    select: { action: true, actorNick: true, createdAt: true },
    take: 5000,
  })
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  const cnt: Record<string, Record<string, number>> = { warrior: {}, coup: {}, meteor: {}, trade: {}, today: {} }
  const bump = (k: string, who: string | null) => {
    const w = (who || '').trim()
    if (!w) return
    cnt[k][w] = (cnt[k][w] || 0) + 1
  }
  for (const n of news) {
    if (n.action === 'pvp_capture') bump('warrior', n.actorNick)
    else if (n.action === 'coup') bump('coup', n.actorNick)
    else if (n.action === 'meteor') bump('meteor', n.actorNick)
    else if (n.action === 'trade') bump('trade', n.actorNick)
    if (n.createdAt >= todayUTC && ['capture', 'conquer', 'pvp_capture', 'pvp_attack'].indexOf(n.action) > -1) bump('today', n.actorNick)
  }
  const topOf = (c: Record<string, number>) =>
    Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nick, val]) => ({ nick, val }))
  const disc = [
    { key: 'empire', top: [...rows].sort((a, b) => b.conquered - a.conquered).slice(0, 3).map((r) => ({ nick: r.nick, val: r.conquered })) },
    { key: 'power', top: rows.slice(0, 3).map((r) => ({ nick: r.nick, val: r.score })) },
    { key: 'warrior', top: topOf(cnt.warrior) },
    { key: 'coup', top: topOf(cnt.coup) },
    { key: 'meteor', top: topOf(cnt.meteor) },
    { key: 'trade', top: topOf(cnt.trade) },
    { key: 'today', top: topOf(cnt.today) },
  ]
  const medals: Record<string, { nick: string; g: number; s: number; b: number }> = {}
  const give = (who: string | undefined, k: 'g' | 's' | 'b') => {
    if (!who) return
    const m = medals[who] || (medals[who] = { nick: who, g: 0, s: 0, b: 0 })
    m[k]++
  }
  for (const d of disc) {
    give(d.top[0]?.nick, 'g')
    give(d.top[1]?.nick, 's')
    give(d.top[2]?.nick, 'b')
  }
  const scoreOf = (nick: string) => rows.find((x) => x.nick === nick)?.score || 0
  const table = Object.values(medals)
    .map((m) => ({ ...m, total: m.g + m.s + m.b, score: scoreOf(m.nick) }))
    .sort((a, b) => b.total - a.total || b.g - a.g || b.score - a.score)
  return { server, players: rows.length, disciplines: disc, medals: table.slice(0, 20) }
}

/* champion rewards land directly in the wallet (gems + boost) and in the saved state (gold/oil/food/steel) */
async function applyOlympicRewards(uid: string) {
  const w = await ensureWallet(uid)
  const base = w.boostUntil && w.boostUntil.getTime() > Date.now() ? w.boostUntil.getTime() : Date.now()
  await db.wallet.update({
    where: { userId: uid },
    data: { gems: w.gems + OL_REWARDS.gems, boostUntil: new Date(base + OL_REWARDS.boost_hours * 3600000) },
  })
  const save = await db.save.findUnique({ where: { userId: uid } })
  if (save) {
    let obj: Record<string, unknown> = {}
    try { obj = JSON.parse(save.state || '{}') || {} } catch { obj = {} }
    const res = (obj.res || {}) as Record<string, number>
    const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0))
    res.gold = num(res.gold) + OL_REWARDS.gold
    res.oil = num(res.oil) + OL_REWARDS.oil
    res.food = num(res.food) + OL_REWARDS.food
    res.steel = num(res.steel) + OL_REWARDS.steel
    obj.res = res
    await db.save.update({ where: { userId: uid }, data: { state: JSON.stringify(obj) } })
  }
}

/* lazy crowning: if the previous 7-day cycle ended without a champion row, crown the medal-table #1 now.
   The unique (server, cycle) constraint makes concurrent crowning race-safe — rewards are applied
   only by the request that successfully created the row. */
async function ensureOlympicChampion(server: number) {
  const prev = olCycle() - 1
  const existing = await db.olympicChampion.findUnique({ where: { server_cycle: { server, cycle: prev } } })
  if (existing) return existing
  let champ: { nick: string; userId: string; medals: number; golds: number } | null = null
  try {
    const agg = await olympicCompute(server)
    const top = agg.medals && agg.medals[0]
    if (top && top.total > 0 && top.nick) {
      const u = await db.user.findFirst({ where: { nickLower: top.nick.toLowerCase() } })
      if (u) champ = { nick: top.nick, userId: u.id, medals: top.total, golds: top.g }
    }
  } catch (e) { console.log('olcompute', e) }
  try {
    if (champ) {
      const terr = (await db.territory.findFirst({ where: { server, userId: champ.userId, isCapital: true } }))
        || (await db.territory.findFirst({ where: { server, userId: champ.userId } }))
      const row = await db.olympicChampion.create({
        data: {
          server, cycle: prev, userId: champ.userId, nick: champ.nick,
          country: terr ? terr.country : null, medals: champ.medals, golds: champ.golds,
          rewardGold: OL_REWARDS.gold, rewardGems: OL_REWARDS.gems,
        },
      })
      await applyOlympicRewards(champ.userId)
      await addNews(server, 'olympic_champion', null, champ.nick, null)
      return row
    }
    /* no medalists this cycle — mark it processed so we don't recompute every poll */
    return await db.olympicChampion.create({ data: { server, cycle: prev, userId: 'none', nick: '' } })
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code === 'P2002') {
      return await db.olympicChampion.findUnique({ where: { server_cycle: { server, cycle: prev } } })
    }
    console.log('olcrown', e)
    return null
  }
}

async function latestChampion(server: number) {
  return db.olympicChampion.findFirst({ where: { server, nick: { not: '' } }, orderBy: [{ cycle: 'desc' }] })
}

/* keep the crown on the champion's CURRENT capital: refresh country on every status poll
   (cheap — only runs for the latest champion row; covers capital moves after crowning) */
async function refreshChampCountry(server: number, latest: Awaited<ReturnType<typeof latestChampion>>) {
  if (!latest || !latest.nick) return latest
  try {
    const u = await db.user.findFirst({ where: { nickLower: latest.nick.toLowerCase() } })
    if (!u) return latest
    const terr = (await db.territory.findFirst({ where: { server, userId: u.id, isCapital: true } }))
      || (await db.territory.findFirst({ where: { server, userId: u.id } }))
    if (terr && terr.country !== latest.country) {
      await db.olympicChampion.update({ where: { id: latest.id }, data: { country: terr.country } })
      return { ...latest, country: terr.country }
    }
  } catch (e) { console.log('olcc', e) }
  return latest
}

const olPublic = (r: { nick: string; country: string | null; medals: number; golds: number; cycle: number; createdAt: Date } | null) =>
  r ? { nick: r.nick, country: r.country || null, medals: r.medals, golds: r.golds, cycle: r.cycle, at: r.createdAt.toISOString() } : null

export async function POST(req: NextRequest, ctx: { params: Promise<{ fn: string }> }) {
  const { fn } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: null, error: { message: 'not authenticated', code: '401' } })
  let args: Record<string, unknown> = {}
  try { args = await req.json() } catch {}
  const R = (data: unknown) => NextResponse.json({ data, error: null })

  try {
    switch (fn) {
      /* ---------------- wallet / shop ---------------- */
      case 'get_wallet': {
        const { w, granted } = await dailyBonus(user.id)
        return R({ ok: true, gems: w.gems, boost_until: w.boostUntil ? w.boostUntil.toISOString() : null, daily_granted: granted })
      }
      case 'spend_gems': {
        const item = String(args.p_item || '')
        const cost = GEM_COSTS[item]
        if (!cost) return R({ ok: false, error: 'item' })
        const w = await ensureWallet(user.id)
        if (w.gems < cost) return R({ ok: false, error: 'funds' })
        const data: { gems: number; boostUntil?: Date } = { gems: w.gems - cost }
        const upd: { gems: number; boostUntil?: Date } = { gems: w.gems - cost }
        let boostUntil: Date | null = null
        if (item === 'boost') {
          boostUntil = new Date(Math.max(Date.now(), w.boostUntil ? w.boostUntil.getTime() : 0) + 3600_000)
          upd.boostUntil = boostUntil
        }
        const nw = await db.wallet.update({ where: { userId: user.id }, data: upd })
        return R({ ok: true, gems: nw.gems, boost_until: nw.boostUntil ? nw.boostUntil.toISOString() : null })
      }

      /* ---------------- admin ---------------- */
      case 'is_admin':
        return R(user.isAdmin)
      case 'admin_list_players': {
        if (!user.isAdmin) return R(null)
        const users = await db.user.findMany({
          select: {
            id: true, nick: true, isAdmin: true, createdAt: true,
            score: { select: { server: true, conquered: true, score: true, kills: true, economy: true, recruits: true } },
            wallet: { select: { gems: true } },
            save: { select: { updatedAt: true } },
            territories: { select: { isCapital: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 300,
        })
        const rows = users.map((u) => ({
          user_id: u.id,
          nick: u.nick,
          is_admin: u.isAdmin,
          created_at: u.createdAt.toISOString(),
          server: u.score?.server ?? null,
          conquered: u.score?.conquered ?? 0,
          score: u.score?.score ?? 0,
          kills: u.score?.kills ?? 0,
          economy: u.score?.economy ?? 0,
          recruits: u.score?.recruits ?? 0,
          gems: u.wallet?.gems ?? 0,
          last_save: u.save?.updatedAt ? u.save.updatedAt.toISOString() : null,
          territories: u.territories.length,
          capitals: u.territories.filter((t) => t.isCapital).length,
        }))
        return R(rows)
      }
      case 'admin_set_gems': {
        if (!user.isAdmin) return R(null)
        const uid = String(args.p_user_id || '')
        const delta = Math.round(Number(args.p_delta) || 0)
        if (!uid || !delta) return R({ ok: false })
        const target = await db.user.findUnique({ where: { id: uid } })
        if (!target) return R({ ok: false })
        const w = await ensureWallet(uid)
        const nw = await db.wallet.update({ where: { userId: uid }, data: { gems: Math.max(0, w.gems + delta) } })
        return R({ ok: true, gems: nw.gems })
      }
      case 'claim_admin_grants': {
        const grants = await db.adminGrant.findMany({ where: { userId: user.id, claimed: false }, orderBy: { createdAt: 'asc' } })
        if (!grants.length) return R(null)
        let g = 0, o = 0, f = 0
        for (const gr of grants) { g += gr.gold; o += gr.oil; f += gr.food }
        await db.adminGrant.updateMany({ where: { id: { in: grants.map((x) => x.id) } }, data: { claimed: true } })
        return R([{ o_gold: g, o_oil: o, o_food: f }])
      }

      /* ---------------- weekly rewards ---------------- */
      case 'claim_weekly_rewards': {
        const wk = weekKey()
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        if (!myScore) return R([])
        const out: { rank: number; reward_gold: number; category: string }[] = []
        for (const cat of WEEKLY_CATEGORIES) {
          const top = await db.score.findMany({
            where: { server: myScore.server, [cat]: { gt: 0 } },
            orderBy: { [cat]: 'desc' },
            take: 3,
          })
          const idx = top.findIndex((x) => x.userId === user.id)
          if (idx < 0) continue
          const rank = idx + 1
          const reward = WEEKLY_REWARDS[rank] || 0
          if (!reward) continue
          const already = await db.weeklyClaim.findUnique({
            where: { userId_weekKey_category: { userId: user.id, weekKey: wk, category: cat } },
          })
          if (already) continue
          await db.weeklyClaim.create({ data: { userId: user.id, weekKey: wk, category: cat, rank, rewardGold: reward } })
          out.push({ rank, reward_gold: reward, category: cat })
        }
        return R(out)
      }

      /* ---------------- multiplayer housekeeping ---------------- */
      case 'release_inactive_territories': {
        const cutoff = new Date(Date.now() - 3 * 24 * 3600 * 1000)
        const stale = await db.user.findMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff }, save: null },
              { save: { updatedAt: { lt: cutoff } } },
            ],
          },
          select: { id: true },
        })
        if (stale.length) {
          const servers = await db.territory.groupBy({ by: ['server'], where: { userId: { in: stale.map((u) => u.id) } } })
          await db.territory.deleteMany({ where: { userId: { in: stale.map((u) => u.id) } } })
          for (const s of servers) {
            const rows = await db.territory.groupBy({ by: ['userId'], where: { server: s.server } })
            const taken = await db.territory.count({ where: { server: s.server } })
            await db.serverStat.upsert({ where: { server: s.server }, create: { server: s.server, taken, players: rows.length }, update: { taken, players: rows.length } })
          }
        }
        return R(null)
      }

      /* ---------------- PvP ---------------- */
      case 'pvp_attack': {
        const server = Number(args.p_server || 1)
        const country = String(args.p_country || '')
        const attack = Math.max(0, Number(args.p_attack || 0))
        const t = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!t || t.userId === user.id) return R({ ok: false })
        const defScore = await db.score.findUnique({ where: { userId: t.userId } })
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        const a = Math.max(attack, myScore?.score || 100)
        const d = Math.max(1, (defScore?.score || 200))
        const chance = Math.min(0.85, Math.max(0.2, 0.5 + (a - d) / (2 * (a + d + 500))))
        const win = Math.random() < chance
        if (win) {
          const r = await transferTerritory(server, country, user.id, user.nick)
          if (!r.ok) return R({ ok: false })
        } else {
          await addNews(server, 'pvp_failed', country, user.nick, t.nick)
        }
        return R({ ok: win })
      }
      case 'pvp_capture_territory': {
        const server = Number(args.p_server || 1)
        const country = String(args.p_country || '')
        const now = Date.now()
        const last = lastCapture.get(user.id) || 0
        if (now - last < 15_000) return R(false)
        lastCapture.set(user.id, now)
        const r = await transferTerritory(server, country, user.id, user.nick)
        return R(r.ok)
      }

      /* ---------------- V30 special ops (server-enforced limits) ----------------
         coup  : 100 gems, 1 per 24h per player  — artificial unrest on a foreign country
         meteor:  80 gems, 1 per 72h per player AND max 3 per rolling 7 days server-wide */
      case 'use_special': {
        const item = String(args.p_item || '')
        const country = String(args.p_country || '')
        const server = Math.max(1, Number(args.p_server || 1))
        if (!['coup', 'meteor'].includes(item)) return R({ ok: false, error: 'item' })
        if (!country) return R({ ok: false, error: 'country' })
        const costs: Record<string, number> = { coup: 100, meteor: 80 }
        const cooldownMs: Record<string, number> = { coup: 24 * 3600_000, meteor: 72 * 3600_000 }
        const cost = costs[item]
        const w = await ensureWallet(user.id)
        if (w.gems < cost) return R({ ok: false, error: 'funds' })
        const last = await db.specialUse.findFirst({ where: { userId: user.id, item }, orderBy: { usedAt: 'desc' } })
        if (last && Date.now() - last.usedAt.getTime() < cooldownMs[item]) {
          return R({ ok: false, error: 'cooldown', next_ok: new Date(last.usedAt.getTime() + cooldownMs[item]).toISOString() })
        }
        if (item === 'meteor') {
          /* rolling-week global cap: max 3 meteor strikes in any 7-day window */
          const since = new Date(Date.now() - 7 * 24 * 3600_000)
          const used = await db.specialUse.count({ where: { item: 'meteor', usedAt: { gte: since } } })
          if (used >= 3) {
            const oldest = await db.specialUse.findFirst({ where: { item: 'meteor', usedAt: { gte: since } }, orderBy: { usedAt: 'asc' } })
            return R({ ok: false, error: 'weekly_cap', next_ok: oldest ? new Date(oldest.usedAt.getTime() + 7 * 24 * 3600_000).toISOString() : null })
          }
        }
        const terr = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (terr && terr.userId === user.id) return R({ ok: false, error: 'own' })
        const nw = await db.wallet.update({ where: { userId: user.id }, data: { gems: w.gems - cost } })
        await db.specialUse.create({ data: { userId: user.id, item } })
        await addNews(server, item, country, user.nick, terr && terr.nick ? terr.nick : null)
        return R({ ok: true, gems: nw.gems, owner_nick: terr && terr.nick ? terr.nick : null, next_ok: new Date(Date.now() + cooldownMs[item]).toISOString() })
      }

      /* ---------------- V30 season reset (admin only) ----------------
         Crowns the champion (top-3 by score), archives it into world_news,
         then wipes the map so a new season starts fair for everyone. */
      case 'season_reset': {
        if (!user.isAdmin) return R(null)
        const server = Math.max(1, Number(args.p_server || 1))
        /* V32: crown the pending Olympic champion BEFORE the wipe so medals/scores still count */
        try { await ensureOlympicChampion(server) } catch (e) { console.log('olcrown-reset', e) }
        const top = await db.score.findMany({ where: { server }, orderBy: { score: 'desc' }, take: 3 })
        const top3: { nick: string; score: number }[] = []
        for (const s of top) {
          const u = await db.user.findUnique({ where: { id: s.userId } })
          if (u) top3.push({ nick: u.nick, score: s.score })
        }
        await addNews(server, 'season_champion', null, top3[0] ? top3[0].nick : null, top3[1] ? top3[1].nick : null)
        await db.territory.deleteMany({ where: { server } })
        await db.score.updateMany({ where: { server }, data: { score: 0, conquered: 0, kills: 0 } })
        const players = await db.score.groupBy({ by: ['userId'], where: { server } })
        await db.serverStat.upsert({ where: { server }, create: { server, taken: 0, players: players.length }, update: { taken: 0, players: players.length } })
        return R({ ok: true, top3 })
      }

      /* ---------------- P2P trade offers (V28, escrow) ----------------
         create: give_qty is deducted from the owner's SAVED state immediately (escrow)
                 and from the owner's live resources by the client → no double-spend.
         accept: escrowed goods move to the acceptor; the owner receives want_qty.
         cancel: escrow refunded to the owner's saved state. */
      case 'trade_offer_create': {
        const server = Math.max(1, Number(args.p_server || 1))
        const giveRes = String(args.p_give_res || ''), wantRes = String(args.p_want_res || '')
        const giveQty = Math.round(Number(args.p_give_qty) || 0), wantQty = Math.round(Number(args.p_want_qty) || 0)
        if (!TRADE_RES.has(giveRes) || !TRADE_RES.has(wantRes) || giveRes === wantRes || giveQty < 10 || wantQty < 10)
          return R({ ok: false, reason: 'bad' })
        const mine = await db.save.findUnique({ where: { userId: user.id } })
        if (!mine) return R({ ok: false, reason: 'nosave' })
        const okEscrow = await tradeApply(user.id, (r) => { r[giveRes] = resNum(r[giveRes]) - giveQty })
        if (!okEscrow) return R({ ok: false, reason: 'funds' })
        const open = await db.tradeOffer.count({ where: { ownerUid: user.id, status: 'open' } })
        if (open >= 5) {
          await tradeApply(user.id, (r) => { r[giveRes] = resNum(r[giveRes]) + giveQty })
          return R({ ok: false, reason: 'limit' })
        }
        await db.tradeOffer.create({
          data: { server, ownerUid: user.id, ownerNick: user.nick, giveRes, giveQty, wantRes, wantQty },
        })
        return R({ ok: true })
      }
      case 'trade_offer_list': {
        const server = Math.max(1, Number(args.p_server || 1))
        const rows = await db.tradeOffer.findMany({
          where: { server, status: 'open', createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } },
          orderBy: { createdAt: 'desc' },
          take: 60,
        })
        return R(rows.map((r) => ({
          id: r.id, mine: r.ownerUid === user.id, nick: r.ownerNick,
          give_res: r.giveRes, give_qty: r.giveQty, want_res: r.wantRes, want_qty: r.wantQty,
          created_at: r.createdAt.toISOString(),
        })))
      }
      case 'trade_offer_cancel': {
        const id = String(args.p_id || '')
        const off = await db.tradeOffer.findUnique({ where: { id } })
        if (!off || off.ownerUid !== user.id || off.status !== 'open') return R({ ok: false })
        await db.tradeOffer.update({ where: { id }, data: { status: 'cancelled' } })
        await tradeApply(user.id, (r) => { r[off.giveRes] = resNum(r[off.giveRes]) + off.giveQty }) /* refund escrow */
        return R({ ok: true })
      }
      case 'trade_offer_accept': {
        const id = String(args.p_id || '')
        const off = await db.tradeOffer.findUnique({ where: { id } })
        if (!off || off.status !== 'open' || off.ownerUid === user.id) return R({ ok: false, reason: 'gone' })
        const acceptor = await db.save.findUnique({ where: { userId: user.id } })
        if (!acceptor) return R({ ok: false, reason: 'nosave' })
        const aRes = tradeRes(acceptor.state).res
        if (resNum(aRes[off.wantRes]) < off.wantQty) return R({ ok: false, reason: 'funds' })
        const fee = Math.max(1, Math.round(off.giveQty * TRADE_FEE))
        const acceptorGot = Math.max(0, off.giveQty - fee)
        const okA = await tradeApply(user.id, (r) => {
          r[off.wantRes] = resNum(r[off.wantRes]) - off.wantQty
          r[off.giveRes] = resNum(r[off.giveRes]) + acceptorGot
        })
        const okO = await tradeApply(off.ownerUid, (r) => {
          r[off.wantRes] = resNum(r[off.wantRes]) + off.wantQty /* escrowed give already left the owner at create */
        })
        if (!okA || !okO) return R({ ok: false, reason: 'apply' })
        await db.tradeOffer.update({ where: { id }, data: { status: 'done' } })
        await addNews(off.server, 'trade', null, user.nick, off.ownerNick)
        return R({ ok: true, got: acceptorGot, fee, give_res: off.giveRes })
      }
      case 'trade_offer_mine': {
        /* offers I own that finished in the last 24h — client credits itself once */
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000)
        const rows = await db.tradeOffer.findMany({
          where: { ownerUid: user.id, status: { in: ['done', 'cancelled'] }, createdAt: { gt: cutoff } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
        return R(rows.map((r) => ({
          id: r.id, status: r.status, give_res: r.giveRes, give_qty: r.giveQty,
          want_res: r.wantRes, want_qty: r.wantQty,
        })))
      }

      /* ---------------- V31/V32 olympics: disciplines + medal table + crowned champion ---------------- */
      case 'olympics': {
        const server = Math.max(1, Number(args.p_server || 1))
        /* V32: lazy weekly crowning — also runs here so page viewers trigger it */
        let champRow: Awaited<ReturnType<typeof ensureOlympicChampion>> = null
        try { champRow = await ensureOlympicChampion(server) } catch (e) { console.log('olensure', e) }
        const agg = await olympicCompute(server)
        let latest = champRow && champRow.nick ? champRow : await latestChampion(server)
        return R({
          ...agg, ts: Date.now(),
          champ: champRow && champRow.nick ? olPublic(champRow) : olPublic(latest),
          cycle: { cur: olCycle(), next_at: new Date((olCycle() + 1) * CYCLE_MS).toISOString() },
          rewards: OL_REWARDS,
        })
      }

      /* ---------------- V32 olympic_status: light poll for champion badge/crown (all clients, 90s) ---------------- */
      case 'olympic_status': {
        const server = Math.max(1, Number(args.p_server || 1))
        try { await ensureOlympicChampion(server) } catch (e) { console.log('olstatus', e) }
        const latest = await refreshChampCountry(server, await latestChampion(server))
        return R({
          champion: olPublic(latest),
          cycle: { cur: olCycle(), next_at: new Date((olCycle() + 1) * CYCLE_MS).toISOString() },
          rewards: OL_REWARDS,
        })
      }

      /* ---------------- news / chat ---------------- */
      case 'get_world_news': {
        const server = Number(args.p_server || 1)
        const limit = Math.min(200, Math.max(1, Number(args.p_limit || 60)))
        const rows = await db.worldNews.findMany({ where: { server }, orderBy: { createdAt: 'desc' }, take: limit })
        return R(rows.map((r) => ({
          action: r.action,
          country: r.country,
          actor_nick: r.actorNick,
          target_nick: r.targetNick,
          created_at: r.createdAt.toISOString(),
        })))
      }
      case 'get_world_chat': {
        const server = Number(args.p_server || 1)
        const limit = Math.min(200, Math.max(1, Number(args.p_limit || 100)))
        const rows = await db.worldChat.findMany({ where: { server }, orderBy: { createdAt: 'desc' }, take: limit })
        return R(rows.map((r) => ({
          user_id: r.userId,
          nick: r.nick,
          message: r.message,
          created_at: r.createdAt.toISOString(),
        })))
      }

      /* ---------------- v23 server bridge ---------------- */
      case 'wd_init_player': {
        const server = Math.max(1, Number(args.p_server || 1))
        const nick = String(args.p_nick || user.nick).slice(0, 20)
        await db.score.upsert({
          where: { userId: user.id },
          create: { userId: user.id, nick, server },
          update: { nick, server },
        })
        return R({ ok: true })
      }
      case 'wd_get_state': {
        const save = await db.save.findUnique({ where: { userId: user.id } })
        const st = save ? JSON.parse(save.state || '{}') : {}
        const units = (st.units || {}) as Record<string, number>
        const infra = (st.infra || {}) as Record<string, number>
        const res = (st.res || {}) as Record<string, number>
        const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        return R({
          player: {
            gold: num(res.gold),
            oil: num(res.oil),
            food: num(res.food),
            score: myScore?.score || 0,
          },
          army: {
            infantry: num(units.infantry),
            tanks: num(units.tank),
            aircraft: num(units.fighter),
            artillery: num(units.missile),
            navy: num(units.destroyer),
            special: num(units.drone),
          },
          buildings: {
            farms: 0,
            oil_wells: num(infra.oil),
            factories: num(infra.arms),
            power_plants: 0,
            barracks: 0,
            research: 0,
            storage: num(infra.storage),
          },
        })
      }

      default:
        return NextResponse.json({ data: null, error: { message: `function ${fn} does not exist`, code: '42883' } })
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'rpc failed'
    return NextResponse.json({ data: null, error: { message, code: null } })
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ fn: string }> }) {
  return POST(req, ctx)
}
