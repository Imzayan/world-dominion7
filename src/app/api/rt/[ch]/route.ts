import { NextRequest, NextResponse } from 'next/server'
import { publish, since } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/** POST: broadcast an event on a channel. GET: poll for events after ?since=seq */
export async function POST(req: NextRequest, ctx: { params: Promise<{ ch: string }> }) {
  const { ch } = await ctx.params
  let body: { event?: string; payload?: unknown; from?: string } = {}
  try { body = await req.json() } catch {}
  const ev = publish(ch, String(body.event || 'message'), body.payload ?? null, String(body.from || ''))
  return NextResponse.json({ ok: true, seq: ev.seq })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ ch: string }> }) {
  const { ch } = await ctx.params
  const after = Number(req.nextUrl.searchParams.get('since') || 0)
  const from = String(req.nextUrl.searchParams.get('from') || '')
  return NextResponse.json({ events: since(ch, after, from) })
}
