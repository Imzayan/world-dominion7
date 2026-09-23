import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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
    /* keep the table small (V33.1): the olympic/aggregation scans read it every cycle */
    const cnt = await db.worldNews.count()
    if (cnt > 500) {
      const old = await db.worldNews.findMany({ orderBy: { createdAt: 'asc' }, take: cnt - 300, select: { id: true } })
      if (old.length) await db.worldNews.deleteMany({ where: { id: { in: old.map((r) => r.id) } } })
    }
  } catch (e) { console.log('addNews', e) }
}

async function ensureWallet(userId: string) {
  let w = await db.wallet.findUnique({ where: { userId } })
  if (!w) w = await db.wallet.create({ data: { userId, gems: 0 } })
  return w
}

/** daily login bonus: +20 gems per calendar day (atomic — no double-claim race) */
async function dailyBonus(userId: string) {
  await ensureWallet(userId)
  const today = new Date().toISOString().slice(0, 10)
  const dayStart = new Date(today + 'T00:00:00.000Z')
  const upd = await db.wallet.updateMany({
    where: { userId, OR: [{ lastDaily: null }, { lastDaily: { lt: dayStart } }] },
    data: { gems: { increment: 20 }, lastDaily: new Date() },
  })
  const w = await ensureWallet(userId)
  return { w, granted: upd.count > 0 ? 20 : 0 }
}

/* ---------- capture transfer shared by pvp_attack success & pvp_capture_territory ---------- */
const lastCapture = new Map<string, number>()
let lastReleaseRun = 0

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

async function tradeApply(uid: string, mut: (res: Record<string, number>) => void, tx?: Prisma.TransactionClient): Promise<boolean> {
  const conn = tx || db
  const save = await conn.save.findUnique({ where: { userId: uid } })
  if (!save) return false
  const { obj, res } = tradeRes(save.state)
  mut(res)
  for (const k of ['gold', 'oil', 'food']) {
    if (res[k] === undefined) res[k] = 0
    if (!Number.isFinite(res[k]) || res[k] < 0) return false
  }
  obj.res = res
  await conn.save.update({ where: { userId: uid }, data: { state: JSON.stringify(obj) } })
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
    data: { gems: { increment: OL_REWARDS.gems }, boostUntil: new Date(base + OL_REWARDS.boost_hours * 3600000) },
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

/* V32 weekly crowning was superseded in V33 by the Olympic Games closing ceremony
   (closeGamesEdition → crowns the Games champion into the same OlympicChampion table). */

/* ============================================================
   V33 — OLYMPIC GAMES (ایونت کامل سه‌پرده‌ای)
   30-day cycle anchored to Jan 1 2026 UTC (same as war season):
     day 16 → registration opens (pick 3 of 10 disciplines)
     day 25 → opening ceremony, Games LIVE for 5 days (truce!) — ALL 10 disciplines open
     day 30 → closing: freeze medals, crown champion, archive, rewards
   10 mini-game disciplines (all playable through the whole live window,
   "today" pair is just the featured match). Medals by COUNTRY, live table
   computed from entries during the games.
   Deterministic host city (hash of edition) so all clients agree.
   OL_OFFSET env shifts time (E2E testing only).
   ============================================================ */
const ED_ANCHOR = Date.UTC(2026, 0, 1)
const ED_LEN = 30 * 86400000
const ED_REG = 15 * 86400000
const ED_OPEN = 24 * 86400000
const ED_CLOSE = 29 * 86400000
const GD_DAY: Record<string, number> = { sprint: 0, archery: 0, swim: 1, gym: 1, weight: 2, cycling: 2, chess: 3, volley: 3, football: 4, wrestle: 4 }
const GD_MAX: Record<string, number> = { sprint: 1000, archery: 1000, swim: 1000, gym: 1000, weight: 1000, cycling: 1000, chess: 1000, volley: 1000, football: 1000, wrestle: 1000 }
const HOSTS: { c: string; n: string; f: string }[] = [
  { c: 'توکیو', n: 'ژاپن', f: 'jp' }, { c: 'پاریس', n: 'فرانسه', f: 'fr' }, { c: 'لس‌آنجلس', n: 'آمریکا', f: 'us' },
  { c: 'لندن', n: 'بریتانیا', f: 'gb' }, { c: 'ریودوژانیرو', n: 'برزیل', f: 'br' }, { c: 'پکن', n: 'چین', f: 'cn' },
  { c: 'آتن', n: 'یونان', f: 'gr' }, { c: 'سیدنی', n: 'استرالیا', f: 'au' }, { c: 'بارسلونا', n: 'اسپانیا', f: 'es' },
  { c: 'سئول', n: 'کره‌ی جنوبی', f: 'kr' }, { c: 'مسکو', n: 'روسیه', f: 'ru' }, { c: 'مونترال', n: 'کانادا', f: 'ca' },
  { c: 'مونیخ', n: 'آلمان', f: 'de' }, { c: 'مکزیکوسیتی', n: 'مکزیک', f: 'mx' }, { c: 'رم', n: 'ایتالیا', f: 'it' },
  { c: 'هلزینکی', n: 'فنلاند', f: 'fi' }, { c: 'آمستردام', n: 'هلند', f: 'nl' }, { c: 'استکهلم', n: 'سوئد', f: 'se' },
  { c: 'استانبول', n: 'ترکیه', f: 'tr' }, { c: 'قاهره', n: 'مصر', f: 'eg' }, { c: 'دهلی‌نو', n: 'هند', f: 'in' },
  { c: 'بوئنوس‌آیرس', n: 'آرژانتین', f: 'ar' }, { c: 'نایروبی', n: 'کنیا', f: 'ke' }, { c: 'دبی', n: 'امارات', f: 'ae' },
  { c: 'سنگاپور', n: 'سنگاپور', f: 'sg' }, { c: 'کیپ‌تاون', n: 'آفریقای جنوبی', f: 'za' }, { c: 'لیما', n: 'پرو', f: 'pe' },
  { c: 'ورشو', n: 'لهستان', f: 'pl' }, { c: 'لیسبون', n: 'پرتغال', f: 'pt' }, { c: 'لاگوس', n: 'نیجریه', f: 'ng' },
  { c: 'کوالالامپور', n: 'مالزی', f: 'my' }, { c: 'دوحه', n: 'قطر', f: 'qa' },
]
const olNow = () => Date.now() + (Number(process.env.OL_OFFSET || 0) || 0)
const hashEd = (e: number) => { let h = (e * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return h >>> 0 }
const hostOf = (edition: number) => HOSTS[hashEd(edition) % HOSTS.length]

function gamesPhase(now = olNow()) {
  const edition = Math.floor((now - ED_ANCHOR) / ED_LEN) + 1
  const start = ED_ANCHOR + (edition - 1) * ED_LEN
  const regAt = start + ED_REG, openAt = start + ED_OPEN, closeAt = start + ED_CLOSE
  const nextReg = start + ED_LEN + ED_REG
  let phase: 'pre' | 'reg' | 'live' | 'after' = 'pre'
  if (now >= closeAt) phase = 'after'
  else if (now >= openAt) phase = 'live'
  else if (now >= regAt) phase = 'reg'
  const gameDay = Math.min(4, Math.max(0, Math.floor((now - openAt) / 86400000)))
  const today = phase === 'live' ? Object.keys(GD_DAY).filter((k) => GD_DAY[k] === gameDay) : []
  return { edition, phase, gameDay, regAt, openAt, closeAt, nextReg, host: hostOf(edition), today }
}

/* per-discipline podium freeze (race-safe via unique (edition,discipline,rank)) */
async function freezeDiscipline(edition: number, key: string) {
  const done = await db.olympicResult.findFirst({ where: { edition, discipline: key } })
  if (done) return
  const rows = await db.olympicEntry.findMany({ where: { edition, discipline: key, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }], take: 3 })
  for (let i = 0; i < rows.length; i++) {
    try {
      await db.olympicResult.create({ data: { edition, discipline: key, rank: i + 1, userId: rows[i].userId, nick: rows[i].nick, country: rows[i].country, countryFa: rows[i].countryFa, score: rows[i].best } })
    } catch (e) {
      const c = (e as { code?: string })?.code
      if (c !== 'P2002') console.log('freeze', e)
    }
  }
  if (rows.length) await addNews(0, 'olympic_podium', key, rows[0].nick, null)
}

/* closing ceremony: freeze all, medal table by country, crown champion player,
   rewards (4 gems + 100k gold + resources + boost), participant gems, archive row.
   V33.1: the archive row is written BEFORE any reward is paid — its unique(edition)
   constraint makes concurrent lazy closes safe (only the claim winner pays out). */
async function closeGamesEdition(edition: number) {
  const exists = await db.olympicArchive.findUnique({ where: { edition } })
  if (exists) return exists
  const host = hostOf(edition)
  for (const k of Object.keys(GD_DAY)) { try { await freezeDiscipline(edition, k) } catch (e) { console.log('frz', e) } }
  const results = await db.olympicResult.findMany({ where: { edition } })
  const byC: Record<string, { country: string; countryFa: string; g: number; s: number; b: number; total: number }> = {}
  const byP: Record<string, { nick: string; userId: string; g: number; s: number; b: number; total: number }> = {}
  for (const r of results) {
    const ck = r.country || '?'
    const c = byC[ck] || (byC[ck] = { country: ck, countryFa: r.countryFa || ck, g: 0, s: 0, b: 0, total: 0 })
    if (r.rank === 1) c.g++; else if (r.rank === 2) c.s++; else c.b++
    c.total++
    const p = byP[r.userId] || (byP[r.userId] = { nick: r.nick, userId: r.userId, g: 0, s: 0, b: 0, total: 0 })
    if (r.rank === 1) p.g++; else if (r.rank === 2) p.s++; else p.b++
    p.total++
  }
  const table = Object.values(byC).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.total - a.total)
  const players = Object.values(byP).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.total - a.total)
  const champ = players[0] || null
  const champCountry = table[0] || null
  const parts = await db.olympicEntry.findMany({ where: { edition, attempts: { gt: 0 } }, select: { userId: true } })
  const uids = [...new Set(parts.map((p) => p.userId))]
  const recs = await db.olympicRecord.findMany({ take: 10, orderBy: [{ discipline: 'asc' }] })
  const podiums: Record<string, { rank: number; nick: string; country: string; countryFa: string; score: number }[]> = {}
  for (const r of results) {
    const arr = podiums[r.discipline] || (podiums[r.discipline] = [])
    arr.push({ rank: r.rank, nick: r.nick, country: r.country || '?', countryFa: r.countryFa || r.country || '?', score: r.score })
  }
  /* CLAIM the close atomically — a second concurrent closer exits here */
  try {
    await db.olympicArchive.create({
      data: {
        edition, hostCity: host.c, hostCountry: host.n, hostCc: host.f,
        championCountry: champCountry ? champCountry.countryFa : null, championNick: champ ? champ.nick : null,
        medalsJson: JSON.stringify(podiums), tableJson: JSON.stringify(table.slice(0, 12)),
        recordsJson: JSON.stringify(recs), participants: uids.length,
      },
    })
  } catch (e) {
    const c = (e as { code?: string })?.code
    if (c === 'P2002') return await db.olympicArchive.findUnique({ where: { edition } })
    console.log('arch', e)
  }
  /* ---- rewards: only the close-winner reaches this line ---- */
  if (champ) {
    const u = await db.user.findFirst({ where: { nickLower: champ.nick.toLowerCase() } })
    if (u) {
      await applyOlympicRewards(u.id)
      const terr = (await db.territory.findFirst({ where: { userId: u.id, isCapital: true } }))
        || (await db.territory.findFirst({ where: { userId: u.id } }))
      for (let s = 1; s <= 5; s++) {
        try {
          await db.olympicChampion.create({ data: { server: s, cycle: edition, userId: u.id, nick: champ.nick, country: terr ? terr.country : null, medals: champ.total, golds: champ.g, rewardGold: OL_REWARDS.gold, rewardGems: OL_REWARDS.gems } })
        } catch (e) {
          const c = (e as { code?: string })?.code
          if (c !== 'P2002') console.log('champrow', e)
        }
      }
      await addNews(0, 'olympic_champion', null, champ.nick, null)
    }
  }
  /* participation reward: +3 gems for everyone who actually played (atomic increment) */
  for (const uid of uids) {
    try {
      await db.wallet.update({ where: { userId: uid }, data: { gems: { increment: 3 } } })
    } catch (e) { console.log('partgem', e) }
  }
  await addNews(0, 'olympic_close', null, champ ? champ.nick : null, champCountry ? champCountry.countryFa : null)
  return { edition, table, champ }
}

/* lazy trigger: close any edition whose time has come (also covers missed closes) */
async function ensureGamesClosed() {
  const now = olNow()
  const cur = gamesPhase(now)
  const prev = gamesPhase(now - ED_LEN)
  const cands = new Set<number>()
  if (now >= cur.closeAt) cands.add(cur.edition)
  if (prev.edition < cur.edition && now >= prev.closeAt) cands.add(prev.edition)
  for (const e of [...cands].sort((a, b) => a - b).slice(-2)) {
    try { await closeGamesEdition(e) } catch (err) { console.log('closeEd', err) }
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
        /* atomic conditional decrement — no read-modify-write race, no double-spend */
        const dec = await db.wallet.updateMany({ where: { userId: user.id, gems: { gte: cost } }, data: { gems: { decrement: cost } } })
        if (dec.count === 0) return R({ ok: false, error: 'funds' })
        let boostUntil: Date | null = null
        if (item === 'boost') {
          const w2 = await ensureWallet(user.id)
          boostUntil = new Date(Math.max(Date.now(), w2.boostUntil ? w2.boostUntil.getTime() : 0) + 3600_000)
          await db.wallet.update({ where: { userId: user.id }, data: { boostUntil } })
        }
        const nw = await ensureWallet(user.id)
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

      /* ---------------- multiplayer housekeeping (V33.1: 60s throttle regardless of callers) ---------------- */
      case 'release_inactive_territories': {
        const nowR = Date.now()
        if (nowR - lastReleaseRun < 60_000) return R(null)
        lastReleaseRun = nowR
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
        if (gamesPhase().phase === 'live') return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس المپیک */
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '')
        /* V33.1: attacker strength comes from the SERVER-side score only — the client's
           p_attack is no longer trusted (it could be spoofed to pin the 0.85 win cap) */
        const t = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!t || t.userId === user.id) return R({ ok: false })
        const defScore = await db.score.findUnique({ where: { userId: t.userId } })
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        const a = Math.max(1, myScore?.score || 100)
        const d = Math.max(1, (defScore?.score || 200))
        const chance = Math.min(0.85, Math.max(0.2, 0.5 + (a - d) / (2 * (a + d + 500))))
        const win = Math.random() < chance
        if (win) {
          const r = await transferTerritory(server, country, user.id, user.nick)
          if (!r.ok) return R({ ok: false })
        } else {
          await addNews(server, 'pvp_failed', country, user.nick, t.nick)
        }
        /* rich payload (V33.1): the tactical drawer consumes occupation/gain/ratio/
           defense/captured — before this it always computed 0% and 60% losses and
           syncTerr deleted the just-won territory */
        return R({ ok: win, captured: win, busy: false, occupation: win ? 100 : 0, gain: win ? 100 : 0, defense: d, ratio: a / d })
      }
      case 'pvp_capture_territory': {
        if (gamesPhase().phase === 'live') return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس المپیک */
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '')
        /* V33.1: free capture is for NEUTRAL land only — owned territories must be
           fought for via pvp_attack (this was a free-steal of any player's land) */
        const t0 = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!t0) return R(false)
        if (t0.userId && t0.userId !== user.id) return R({ ok: false, error: 'owned' })
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
        if (gamesPhase().phase === 'live') return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس المپیک */
        const item = String(args.p_item || '')
        const country = String(args.p_country || '')
        const server = Math.max(1, Number(args.p_server) || 1)
        if (!['coup', 'meteor'].includes(item)) return R({ ok: false, error: 'item' })
        if (!country) return R({ ok: false, error: 'country' })
        const costs: Record<string, number> = { coup: 100, meteor: 80 }
        const cooldownMs: Record<string, number> = { coup: 24 * 3600_000, meteor: 72 * 3600_000 }
        const cost = costs[item]
        /* V33.1: validate the TARGET before any charge — gems were burning on no-op strikes */
        const terr = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!terr) return R({ ok: false, error: 'country' })
        if (terr.userId === user.id) return R({ ok: false, error: 'own' })
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
        const dec = await db.wallet.updateMany({ where: { userId: user.id, gems: { gte: cost } }, data: { gems: { decrement: cost } } })
        if (dec.count === 0) return R({ ok: false, error: 'funds' })
        try {
          await db.specialUse.create({ data: { userId: user.id, item } })
        } catch (e) {
          await db.wallet.update({ where: { userId: user.id }, data: { gems: { increment: cost } } }).catch(() => {})
          throw e
        }
        const nw = await ensureWallet(user.id)
        await addNews(server, item, country, user.nick, terr.nick ? terr.nick : null)
        return R({ ok: true, gems: nw.gems, owner_nick: terr.nick ? terr.nick : null, next_ok: new Date(Date.now() + cooldownMs[item]).toISOString() })
      }

      /* ---------------- V30 season reset (admin only) ----------------
         Crowns the champion (top-3 by score), archives it into world_news,
         then wipes the map so a new season starts fair for everyone. */
      case 'season_reset': {
        if (!user.isAdmin) return R(null)
        const server = Math.max(1, Number(args.p_server) || 1)
        /* V33: close pending Games editions BEFORE the wipe so medals still count */
        try { await ensureGamesClosed() } catch (e) { console.log('olclose-reset', e) }
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
        const server = Math.max(1, Number(args.p_server) || 1)
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
        const server = Math.max(1, Number(args.p_server) || 1)
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
        if (!off || off.ownerUid !== user.id) return R({ ok: false })
        /* atomic claim: cancel only wins if the offer is still open (no accept/cancel race) */
        const cl = await db.tradeOffer.updateMany({ where: { id, status: 'open' }, data: { status: 'cancelled' } })
        if (cl.count === 0) return R({ ok: false })
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
        /* V33.1: claim the offer ATOMICALLY first (two concurrent accepts/cancels can no
           longer double-pay the owner), then move resources inside one transaction */
        const cl = await db.tradeOffer.updateMany({ where: { id, status: 'open' }, data: { status: 'done' } })
        if (cl.count === 0) return R({ ok: false, reason: 'gone' })
        let moved = false
        try {
          moved = await db.$transaction(async (tx) => {
            const okA = await tradeApply(user.id, (r) => {
              r[off.wantRes] = resNum(r[off.wantRes]) - off.wantQty
              r[off.giveRes] = resNum(r[off.giveRes]) + acceptorGot
            }, tx)
            if (!okA) return false
            const okO = await tradeApply(off.ownerUid, (r) => {
              r[off.wantRes] = resNum(r[off.wantRes]) + off.wantQty /* escrowed give already left the owner at create */
            }, tx)
            return okO
          })
        } catch (e) { moved = false }
        if (!moved) {
          /* release the claim so the offer is not lost */
          await db.tradeOffer.updateMany({ where: { id, status: 'done' }, data: { status: 'open' } }).catch(() => {})
          return R({ ok: false, reason: 'apply' })
        }
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
        let champRow: Awaited<ReturnType<typeof latestChampion>> = null
        champRow = await latestChampion(server)
        try { await ensureGamesClosed() } catch (e) { console.log('olensure', e) }
        const agg = await olympicCompute(server)
        const latest = champRow && champRow.nick ? champRow : await latestChampion(server)
        return R({
          ...agg, ts: Date.now(),
          champ: champRow && champRow.nick ? olPublic(champRow) : olPublic(latest),
          cycle: { cur: olCycle(), next_at: new Date((olCycle() + 1) * CYCLE_MS).toISOString() },
          rewards: OL_REWARDS,
        })
      }

      /* ---------------- V32/V33 olympic_status: badges/crown + games phase (all clients, 90s) ---------------- */
      case 'olympic_status': {
        const server = Math.max(1, Number(args.p_server || 1))
        try { await ensureGamesClosed() } catch (e) { console.log('olstatus', e) }
        const latest = await refreshChampCountry(server, await latestChampion(server))
        const g = gamesPhase()
        return R({
          champion: olPublic(latest),
          cycle: { cur: olCycle(), next_at: new Date((olCycle() + 1) * CYCLE_MS).toISOString() },
          rewards: OL_REWARDS,
          games: {
            phase: g.phase, edition: g.edition, game_day: g.gameDay, today: g.today,
            host: g.host, truce: g.phase === 'live',
            reg_at: new Date(g.regAt).toISOString(), open_at: new Date(g.openAt).toISOString(),
            close_at: new Date(g.closeAt).toISOString(), next_reg: new Date(g.nextReg).toISOString(),
          },
        })
      }

      /* ---------------- V33 olympic_games: full hub payload (state, schedule, table, records, archive) ---------------- */
      case 'olympic_games': {
        try { await ensureGamesClosed() } catch (e) { console.log('olgames', e) }
        const g = gamesPhase()
        const edition = g.edition
        if (g.phase === 'after') for (const k of Object.keys(GD_DAY)) { try { await freezeDiscipline(edition, k) } catch (e) {} }
        /* live medal table by COUNTRY: during the games standings come straight from
           entry bests (top-3 per discipline, same ranking as the freeze), after close
           they come from the frozen olympicResult rows */
        const byC: Record<string, { country: string; countryFa: string; g: number; s: number; b: number; total: number }> = {}
        if (g.phase === 'live') {
          const ents = await db.olympicEntry.findMany({ where: { edition, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }] })
          const picked: Record<string, number> = {}
          for (const e of ents) {
            const n = picked[e.discipline] || 0
            if (n >= 3) continue
            picked[e.discipline] = n + 1
            const ck = e.country || '?'
            const c = byC[ck] || (byC[ck] = { country: ck, countryFa: e.countryFa || ck, g: 0, s: 0, b: 0, total: 0 })
            if (n === 0) c.g++; else if (n === 1) c.s++; else c.b++
            c.total++
          }
        } else {
          const results = await db.olympicResult.findMany({ where: { edition } })
          for (const r of results) {
            const ck = r.country || '?'
            const c = byC[ck] || (byC[ck] = { country: ck, countryFa: r.countryFa || ck, g: 0, s: 0, b: 0, total: 0 })
            if (r.rank === 1) c.g++; else if (r.rank === 2) c.s++; else c.b++
            c.total++
          }
        }
        const table = Object.values(byC).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.total - a.total)
        const myEntries = await db.olympicEntry.findMany({ where: { edition, userId: user.id } })
        const records = await db.olympicRecord.findMany({ take: 12 })
        const allResults = await db.olympicResult.findMany({ orderBy: [{ edition: 'asc' }], take: 400 })
        const career: Record<string, { nick: string; g: number; s: number; b: number; total: number; eds: number[] }> = {}
        for (const r of allResults) {
          const c2 = career[r.nick] || (career[r.nick] = { nick: r.nick, g: 0, s: 0, b: 0, total: 0, eds: [] })
          if (r.rank === 1) c2.g++; else if (r.rank === 2) c2.s++; else c2.b++
          c2.total++
          if (c2.eds.indexOf(r.edition) < 0) c2.eds.push(r.edition)
        }
        const rivals = Object.values(career).sort((a, b) => b.total - a.total || b.g - a.g).slice(0, 8).map((c3) => ({ nick: c3.nick, medals: c3.total }))
        const myReg = myEntries.map((e) => e.discipline)
        const myE: Record<string, { best: number; attempts: number }> = {}
        for (const e of myEntries) myE[e.discipline] = { best: e.best, attempts: e.attempts }
        const torch = await db.olympicArchive.findFirst({ where: { championNick: { not: null } }, orderBy: [{ edition: 'desc' }] })
        const archives = await db.olympicArchive.findMany({ orderBy: [{ edition: 'desc' }], take: 8 })
        const champRow = await latestChampion(Math.max(1, Number(args.p_server || 1)))
        return R({
          edition, phase: g.phase, game_day: g.gameDay, today: g.today, host: g.host,
          reg_at: new Date(g.regAt).toISOString(), open_at: new Date(g.openAt).toISOString(),
          close_at: new Date(g.closeAt).toISOString(), next_reg: new Date(g.nextReg).toISOString(),
          truce: g.phase === 'live',
          my: { reg: myReg, entries: myE, country: (myEntries[0] && myEntries[0].countryFa) || null },
          table, records, career, rivals, torch: torch ? { edition: torch.edition, nick: torch.championNick, country: torch.championCountry } : null,
          archive: archives.map((a) => ({
            edition: a.edition, host_city: a.hostCity, host_country: a.hostCountry, host_cc: a.hostCc,
            champion_country: a.championCountry, champion_nick: a.championNick, participants: a.participants,
            podiums: JSON.parse(a.medalsJson || '{}'), table: JSON.parse(a.tableJson || '[]'),
          })),
          reigning: champRow ? { nick: champRow.nick, medals: champRow.medals, cycle: champRow.cycle } : null,
          rewards: OL_REWARDS,
        })
      }

      /* ---------------- V33 olympic_register: pick 3 of 10 (reg window + late entry while live) ----------------
         Late registration during live keeps existing rows (best/attempts preserved)
         so editing your pick mid-games never wipes scores. */
      case 'olympic_register': {
        const g = gamesPhase()
        if (g.phase !== 'reg' && g.phase !== 'live') return R({ ok: false, reason: 'window' })
        const list = Array.isArray(args.p_disciplines) ? args.p_disciplines.map((x) => String(x)) : []
        const keys = [...new Set(list)].filter((k) => GD_DAY[k] !== undefined)
        if (!keys.length || keys.length > 3) return R({ ok: false, reason: 'quota' })
        const cap = (await db.territory.findFirst({ where: { userId: user.id, isCapital: true } }))
          || (await db.territory.findFirst({ where: { userId: user.id } }))
        if (!cap) return R({ ok: false, reason: 'capital' })
        const prior = await db.olympicEntry.findMany({ where: { edition: g.edition, userId: user.id } })
        for (const p of prior) { if (keys.indexOf(p.discipline) < 0) await db.olympicEntry.delete({ where: { id: p.id } }) }
        const keep = new Set(prior.map((p) => p.discipline).filter((k) => keys.indexOf(k) > -1))
        const cfa = String(args.p_country_fa || cap.country).slice(0, 40)
        for (const k of keys) {
          if (keep.has(k)) continue
          await db.olympicEntry.create({ data: { edition: g.edition, userId: user.id, nick: user.nick, country: cap.country, countryFa: cfa, discipline: k } })
        }
        return R({ ok: true, keys })
      }

      /* ---------------- V33 olympic_submit: mini-game score (registered + live + attempts + rate) ---------------- */
      case 'olympic_submit': {
        const g = gamesPhase()
        const key = String(args.p_discipline || '')
        if (GD_DAY[key] === undefined) return R({ ok: false, reason: 'discipline' })
        if (g.phase !== 'live') return R({ ok: false, reason: 'window' })
        const score = Math.round(Number(args.p_score) || 0)
        if (!(score >= 0 && score <= GD_MAX[key] + 50)) return R({ ok: false, reason: 'score' })
        const ent = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
        if (!ent) return R({ ok: false, reason: 'not_registered' })
        /* V33.1: attempts + 8s rate gate atomically (concurrent submits can't exceed 5).
           lastAt is NOT NULL in the schema (default now()), so a plain lte covers it. */
        const rateCut = new Date(Date.now() - 8000)
        const gate = await db.olympicEntry.updateMany({
          where: { id: ent.id, attempts: { lt: 5 }, lastAt: { lte: rateCut } },
          data: { attempts: { increment: 1 }, lastAt: new Date() },
        })
        if (gate.count === 0) return R({ ok: false, reason: ent.attempts >= 5 ? 'attempts' : 'rate' })
        const cfa = ent.countryFa || ent.country || null
        const record = await db.olympicRecord.findUnique({ where: { discipline: key } })
        let recordBroken = false
        if (!record || score > record.score) {
          if (record && score > record.score) {
            recordBroken = true
            await addNews(0, 'olympic_record', key, user.nick, null)
          }
          await db.olympicRecord.upsert({
            where: { discipline: key },
            create: { discipline: key, score, nick: user.nick, country: cfa, edition: g.edition },
            update: { score, nick: user.nick, country: cfa, edition: g.edition },
          })
        }
        const best = Math.max(ent.best, score)
        await db.olympicEntry.update({ where: { id: ent.id }, data: { best } })
        const better = await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best: { gt: best } } })
        return R({ ok: true, best, attempts: ent.attempts + 1, rank: better + 1, record_broken: recordBroken })
      }

      /* ---------------- news / chat ---------------- */
      case 'get_world_news': {
        const server = Number(args.p_server || 1)
        const limit = Math.min(200, Math.max(1, Number(args.p_limit || 60)))
        /* server 0 = global channel (V33 olympic games) — visible on every server's ticker */
        const rows = await db.worldNews.findMany({ where: { server: { in: [server, 0] } }, orderBy: { createdAt: 'desc' }, take: limit })
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
        const server = Math.max(1, Number(args.p_server) || 1)
        /* V33.1: nick is FORCED to the session user's nick — a client-chosen p_nick let
           anyone impersonate arbitrary players on leaderboards and medal tables */
        await db.score.upsert({
          where: { userId: user.id },
          create: { userId: user.id, nick: user.nick, server },
          update: { nick: user.nick, server },
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
