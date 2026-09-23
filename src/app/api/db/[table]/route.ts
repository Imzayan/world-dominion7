import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, type SessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/* ============================================================
   Supabase-compatible table REST endpoint.
   The game client talks through a small shim that maps
   sb.from(table).select().eq().order().limit()... chains onto
   GET/POST/PATCH/DELETE here, returning {data, error} envelopes.
   ============================================================ */

type ColType = 'string' | 'int' | 'bool' | 'date'
interface TableSpec {
  model: string             // Prisma model accessor (singular)
  cols: Record<string, string>
  types: Record<string, ColType>
  owned?: boolean        // user_id forced to session user
  publicRead?: boolean   // readable without session
  adminWrite?: boolean   // only admins may insert
  readOnly?: boolean
}

const T: Record<string, TableSpec> = {
  saves: {
    model: 'save',
    cols: { user_id: 'userId', nick: 'nick', state: 'state', updated_at: 'updatedAt' },
    types: { updated_at: 'date' },
    owned: true,
  },
  scores: {
    model: 'score',
    cols: { user_id: 'userId', nick: 'nick', server: 'server', conquered: 'conquered', score: 'score', kills: 'kills', economy: 'economy', recruits: 'recruits' },
    types: { server: 'int', conquered: 'int', score: 'int', kills: 'int', economy: 'int', recruits: 'int' },
    owned: true,
    publicRead: true,
  },
  server_stats: {
    model: 'serverStat',
    cols: { server: 'server', taken: 'taken', players: 'players' },
    types: { server: 'int', taken: 'int', players: 'int' },
    readOnly: true,
    publicRead: true,
  },
  territories: {
    model: 'territory',
    cols: { server: 'server', country: 'country', user_id: 'userId', nick: 'nick', is_capital: 'isCapital', updated_at: 'updatedAt' },
    types: { server: 'int', is_capital: 'bool' },
    owned: true,
    publicRead: true,
  },
  admin_grants: {
    model: 'adminGrant',
    cols: { id: 'id', user_id: 'userId', gold: 'gold', oil: 'oil', food: 'food', claimed: 'claimed', created_at: 'createdAt' },
    types: { gold: 'int', oil: 'int', food: 'int', claimed: 'bool' },
    adminWrite: true,
  },
  world_chat: {
    model: 'worldChat',
    cols: { id: 'id', server: 'server', user_id: 'userId', nick: 'nick', message: 'message', created_at: 'createdAt' },
    types: { server: 'int' },
    owned: true,
    publicRead: true,
  },
  world_news: {
    model: 'worldNews',
    cols: { id: 'id', server: 'server', action: 'action', country: 'country', actor_nick: 'actorNick', target_nick: 'targetNick', created_at: 'createdAt' },
    types: { server: 'int' },
    readOnly: true,
    publicRead: true,
  },
}

interface Filter { op: 'eq' | 'in'; col: string; val: unknown }
interface Query {
  select?: string[]
  filters?: Filter[]
  order?: { col: string; asc: boolean }
  limit?: number
  single?: boolean
  maybeSingle?: boolean
}

const err = (message: string, code?: string) => ({ message, code: code || null, details: null, hint: null })

function cast(col: string, val: unknown, spec: TableSpec): unknown {
  const t = spec.types[col]
  if (val === null || val === undefined) return val
  if (t === 'int') return Math.round(Number(val) || 0)
  if (t === 'bool') return val === true || val === 'true'
  if (t === 'date') return new Date(String(val))
  return String(val)
}

function buildWhere(filters: Filter[] | undefined, spec: TableSpec, userId: string | null): Record<string, unknown> {
  const and: Record<string, unknown>[] = []
  for (const f of filters || []) {
    const pr = spec.cols[f.col]
    const t = spec.types[f.col]
    if (f.op === 'eq') {
      if (f.col === 'updated_at' && t === 'date') {
        // optimistic-concurrency compare with 1s tolerance
        const d = new Date(String(f.val))
        and.push({ [pr]: { gte: new Date(d.getTime() - 1000), lte: new Date(d.getTime() + 1000) } })
      } else {
        and.push({ [pr]: cast(f.col, f.val, spec) })
      }
    } else if (f.op === 'in') {
      const arr = Array.isArray(f.val) ? f.val : []
      and.push({ [pr]: { in: arr.map((v) => cast(f.col, v, spec)) } })
    }
  }
  if (spec.owned && userId) and.push({ userId })
  return and.length ? { AND: and } : {}
}

function serialize(row: Record<string, unknown>, spec: TableSpec, select?: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [snake, camel] of Object.entries(spec.cols)) {
    if (select && select.length && !select.includes(snake)) continue
    let v = row[camel]
    if (v instanceof Date) v = v.toISOString()
    // JSONB semantics: the game expects the save state as a parsed object
    if (snake === 'state' && typeof v === 'string') {
      try { v = JSON.parse(v) } catch { /* keep raw string */ }
    }
    out[snake] = v
  }
  return out
}

/* ---------- hooks ---------- */

const ARMY_ATK: Record<string, number> = { infantry: 4, tank: 40, bomber: 300, fighter: 120, heli: 65, missile: 250, drone: 35, transport: 15, destroyer: 180, carrier: 600 }
const AIR_UNITS = new Set(['bomber', 'fighter', 'heli', 'drone'])

function computeMetrics(stateJson: string) {
  let st: Record<string, unknown> = {}
  try { st = JSON.parse(stateJson) || {} } catch {}
  const conq = Array.isArray(st.conq) ? (st.conq as unknown[]).length : 0
  const my = st.my ? 1 : 0
  const units = (st.units || {}) as Record<string, number>
  const infra = (st.infra || {}) as Record<string, number>
  const res = (st.res || {}) as Record<string, number>
  const airMult = 1 + Math.min(3, infra.air || 0) * 0.1
  let attack = 0, recruits = 0
  for (const [k, c] of Object.entries(units)) {
    const n = Math.max(0, Math.round(Number(c) || 0))
    recruits += n
    attack += n * (ARMY_ATK[k] || 0) * (AIR_UNITS.has(k) ? airMult : 1)
  }
  const conquered = conq + my
  return {
    conquered,
    score: Math.max(0, Math.round(conquered * 1000 + attack)),
    kills: Math.round(attack / 10),
    economy: Math.max(0, Math.round((res.gold || 0) + conquered * 750 + (infra.arms || 0) * 400 + (infra.oil || 0) * 300 + (infra.air || 0) * 500)),
    recruits,
  }
}

async function recomputeScore(userId: string, nick: string, stateJson: string) {
  try {
    let m = { conquered: 0, score: 0, kills: 0, economy: 0, recruits: 0 }
    try {
      const parsed = typeof stateJson === 'string' ? JSON.parse(stateJson || '{}') : stateJson
      m = computeMetrics(typeof parsed === 'string' ? '{}' : JSON.stringify(parsed))
    } catch { /* default metrics */ }
    const prev = await db.score.findUnique({ where: { userId } })
    await db.score.upsert({
      where: { userId },
      create: { userId, nick, ...m },
      update: { nick, ...m, server: prev?.server || 1 },
    })
  } catch (e) { console.log('recomputeScore', e) }
}

async function recomputeServerStat(server: number) {
  if (!Number.isFinite(server)) return
  try {
    const rows = await db.territory.groupBy({ by: ['userId'], where: { server } })
    const taken = await db.territory.count({ where: { server } })
    await db.serverStat.upsert({
      where: { server },
      create: { server, taken, players: rows.length },
      update: { taken, players: rows.length },
    })
  } catch (e) { console.log('recomputeServerStat', e) }
}

async function addNews(server: number, action: string, country: string | null, actorNick: string | null, targetNick: string | null) {
  try {
    await db.worldNews.create({ data: { server, action, country, actorNick, targetNick } })
    // keep table small
    const cnt = await db.worldNews.count({ where: { server } })
    if (cnt > 500) {
      const old = await db.worldNews.findMany({ where: { server }, orderBy: { createdAt: 'desc' }, skip: 300, take: cnt })
      if (old.length) await db.worldNews.deleteMany({ where: { id: { in: old.map((r) => r.id) } } })
    }
  } catch (e) { console.log('addNews', e) }
}

/* ---------- handlers ---------- */

export async function GET(req: NextRequest, ctx: { params: Promise<{ table: string }> }) {
  const { table } = await ctx.params
  const spec = T[table]
  if (!spec) return NextResponse.json({ data: null, error: err('relation "' + table + '" does not exist', '42P01') })
  if (!spec.publicRead && !spec.owned) return NextResponse.json({ data: null, error: err('permission denied') })
  const user = await getSessionUser()
  if (spec.owned && !user && table === 'saves') return NextResponse.json({ data: [], error: null })
  let q: Query = {}
  const rawQ = req.nextUrl.searchParams.get('q')
  if (rawQ) { try { q = JSON.parse(Buffer.from(rawQ, 'base64url').toString('utf8')) } catch { return NextResponse.json({ data: null, error: err('bad query') }) } }
  // world_chat/world_news readable by anyone; saves require session
  const where = buildWhere(q.filters, spec, table === 'saves' || table === 'world_chat' ? user?.id || 'none' : null)
  const model = db as unknown as Record<string, { findMany: (a: object) => Promise<Record<string, unknown>[]> }>
  try {
    const rows = await model[spec.model].findMany({
      where,
      ...(q.order ? { orderBy: { [spec.cols[q.order.col] || 'id']: q.order.asc ? 'asc' : 'desc' } } : {}),
      ...(q.limit ? { take: Math.min(q.limit, 1000) } : {}),
    })
    let data = rows.map((r) => serialize(r, spec, q.select))
    if (q.maybeSingle) data = data.length ? [data[0]] : [null]
    if (q.single) {
      if (!data.length) return NextResponse.json({ data: null, error: err('JSON object requested, multiple (or no) rows returned', 'PGRST116') })
      data = [data[0]]
    }
    return NextResponse.json({ data, error: null, count: null, status: 200, statusText: 'OK' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'query failed'
    return NextResponse.json({ data: null, error: err(message) })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ table: string }> }) {
  const { table } = await ctx.params
  const spec = T[table]
  if (!spec) return NextResponse.json({ data: null, error: err('relation "' + table + '" does not exist', '42P01') })
  if (spec.readOnly) return NextResponse.json({ data: null, error: err('permission denied') })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: null, error: err('not authenticated', '401') })
  if (spec.adminWrite && !user.isAdmin) return NextResponse.json({ data: null, error: err('permission denied') })
  let body: { payloads?: unknown; query?: Query } = {}
  try { body = await req.json() } catch {}
  const list = Array.isArray(body.payloads) ? body.payloads : [body.payloads]
  const model = db as unknown as Record<string, { create: (a: object) => Promise<Record<string, unknown>> }>
  try {
    const created: Record<string, unknown>[] = []
    for (const raw of list) {
      const p = await preparePayload(table, spec, raw, user)
      const row = await model[spec.model].create({ data: p })
      created.push(row)
    }
    if (table === 'world_chat' && created.length) chatMark(user.id)
    await afterWrite(table, created, user)
    const data = created.map((r) => serialize(r, spec, body.query?.select))
    if (body.query?.single) return NextResponse.json({ data: data[0] || null, error: null })
    return NextResponse.json({ data, error: null, count: data.length, status: 201 })
  } catch (e: unknown) {
    const anyE = e as { code?: string; message?: string }
    if (anyE?.code === 'P2002') return NextResponse.json({ data: null, error: err('duplicate key value violates unique constraint', '23505') })
    const message = anyE instanceof Error ? anyE.message : 'insert failed'
    return NextResponse.json({ data: null, error: err(message) })
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ table: string }> }) {
  const { table } = await ctx.params
  const spec = T[table]
  if (!spec) return NextResponse.json({ data: null, error: err('relation "' + table + '" does not exist', '42P01') })
  if (spec.readOnly) return NextResponse.json({ data: null, error: err('permission denied') })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: null, error: err('not authenticated', '401') })
  /* V33.1: adminWrite tables (admin_grants) were PATCHable by ANY user → free resource minting */
  if (spec.adminWrite && !user.isAdmin) return NextResponse.json({ data: null, error: err('permission denied') })
  let body: { payload?: Record<string, unknown>; query?: Query } = {}
  try { body = await req.json() } catch {}
  const model = db as unknown as {
    findMany: (a: object) => Promise<Record<string, unknown>[]>
    updateMany: (a: object) => Promise<{ count: number }>
  }
  try {
    const where = buildWhere(body.query?.filters, spec, user.id)
    const existing = await model[spec.model].findMany({ where })
    if (!existing.length) return NextResponse.json({ data: [], error: null, count: 0, status: 200 })
    const p = await preparePayload(table, spec, body.payload || {}, user, true)
    /* V33.1: update by the SAME ownership-scoped where — the old key-by-id fallback
       produced {id:{in:[undefined]}} for id-less tables (scores/territories) and the
       client's server-change sync silently failed forever */
    await model[spec.model].updateMany({ where, data: p })
    const updated = await model[spec.model].findMany({ where })
    await afterWrite(table, updated, user)
    const data = updated.map((r) => serialize(r, spec, body.query?.select))
    return NextResponse.json({ data, error: null, count: data.length, status: 200 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'update failed'
    return NextResponse.json({ data: null, error: err(message) })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ table: string }> }) {
  const { table } = await ctx.params
  const spec = T[table]
  if (!spec) return NextResponse.json({ data: null, error: err('relation "' + table + '" does not exist', '42P01') })
  if (spec.readOnly) return NextResponse.json({ data: null, error: err('permission denied') })
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: null, error: err('not authenticated', '401') })
  /* V33.1: adminWrite tables (admin_grants) were DELETEable by ANY user → could wipe everyone's grants */
  if (spec.adminWrite && !user.isAdmin) return NextResponse.json({ data: null, error: err('permission denied') })
  let q: Query = {}
  const rawQ = req.nextUrl.searchParams.get('q')
  if (rawQ) { try { q = JSON.parse(Buffer.from(rawQ, 'base64url').toString('utf8')) } catch {} }
  try {
    const where = buildWhere(q.filters, spec, user.id)
    const model = db as unknown as Record<string, { deleteMany: (a: object) => Promise<{ count: number }> }>
    const res = await model[spec.model].deleteMany({ where })
    if (table === 'territories') {
      const servers = new Set<number>()
      for (const f of q.filters || []) if (f.col === 'server') servers.add(Number(f.val))
      for (const s of servers) await recomputeServerStat(s)
    }
    return NextResponse.json({ data: [], error: null, count: res.count, status: 200 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'delete failed'
    return NextResponse.json({ data: null, error: err(message) })
  }
}

/* ---------- payload preparation & write hooks ---------- */

const chatLast = new Map<string, number>()

async function preparePayload(table: string, spec: TableSpec, raw: Record<string, unknown>, user: SessionUser, isUpdate = false): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {}
  for (const [col, val] of Object.entries(raw || {})) {
    if (!spec.cols[col]) continue
    if (spec.types[col] === 'date' && isUpdate) continue // let @updatedAt handle it
    // JSONB semantics: the save state must be stored as JSON text, never String()-mangled
    if (table === 'saves' && col === 'state') {
      data.state = typeof val === 'string' ? val : JSON.stringify(val ?? {})
      continue
    }
    data[spec.cols[col]] = cast(col, val, spec)
  }
  if (spec.owned) data.userId = user.id
  if (table === 'saves') {
    data.nick = user.nick
    if (typeof data.state !== 'string' || !data.state) data.state = '{}'
  }
  if (table === 'territories') data.nick = user.nick
  if (table === 'world_chat') {
    data.userId = user.id
    data.nick = user.nick
    let msg = String(data.message || '')
    if (msg.length > 300) msg = msg.slice(0, 300)
    msg = msg.replace(/[<>]/g, '')
    data.message = msg
    const now = Date.now()
    const last = chatLast.get(user.id) || 0
    if (now - last < 1200) throw new Error('rate limited')
    /* note: the timestamp is stamped AFTER a successful insert (see POST) so a
       failed write no longer burns the 1.2s window; map is pruned below */
    if (chatLast.size > 5000) chatLast.clear()
  }
  return data
}

function chatMark(userId: string) {
  chatLast.set(userId, Date.now())
}

async function afterWrite(table: string, rows: Record<string, unknown>[], user: SessionUser) {
  if (!rows.length) return
  if (table === 'saves') {
    for (const r of rows) await recomputeScore(String(r.userId), String(r.nick), String(r.state || '{}'))
  }
  if (table === 'territories') {
    const servers = new Set<number>()
    rows.forEach((r) => servers.add(Number(r.server)))
    for (const s of servers) await recomputeServerStat(s)
  }
}
