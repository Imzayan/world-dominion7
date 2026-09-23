import { NextRequest, NextResponse } from 'next/server'
import { publish, since, sweep } from '@/lib/realtime'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/* V33.1: realtime channels used to be fully open — anyone could publish fake
   battle/cinema events (or spoof another user's `from`). Now a session is
   required on both verbs and the sender identity is bound server-side. */

const MAX_PAYLOAD = 8000

/** POST: broadcast an event on a channel. GET: poll for events after ?since=seq */
export async function POST(req: NextRequest, ctx: { params: Promise<{ ch: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ ok: false, error: 'not authenticated' }, { status: 401 })
  const { ch } = await ctx.params
  let body: { event?: string; payload?: unknown; from?: string } = {}
  try { body = await req.json() } catch {}
  let payload: unknown = body.payload ?? null
  try {
    if (JSON.stringify(payload ?? null).length > MAX_PAYLOAD) payload = null
  } catch { payload = null }
  const ev = publish(ch, String(body.event || 'message').slice(0, 64), payload, user.id)
  sweep()
  return NextResponse.json({ ok: true, seq: ev.seq })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ ch: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ events: [], error: 'not authenticated' }, { status: 401 })
  const { ch } = await ctx.params
  const after = Number(req.nextUrl.searchParams.get('since') || 0)
  /* exclusion is by the SERVER-side user id (client `from` param no longer trusted) */
  return NextResponse.json({ events: since(ch, after, user.id) })
}
