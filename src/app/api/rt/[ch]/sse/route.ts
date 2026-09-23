import { NextRequest } from 'next/server'
import { getChannel, sweep, type RtEvent } from '@/lib/realtime'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** SSE stream of a channel's broadcast events (excludes the sender's own events).
    V33.1: requires a session; subscription key = server-side user id. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ ch: string }> }) {
  const user = await getSessionUser()
  if (!user) return new Response('not authenticated', { status: 401 })
  const { ch } = await ctx.params
  const from = user.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (ev: RtEvent) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`))
        } catch {
          closed = true
        }
      }
      const c = getChannel(ch)
      /* unique key per connection — same user in two tabs must not overwrite each other */
      const subKey = from + '#' + Math.random().toString(36).slice(2, 8)
      c.subs.set(subKey, { uid: from, send })
      // initial keepalive so EventSource fires onopen immediately
      try { controller.enqueue(encoder.encode(`: ok\n\n`)) } catch {}
      const ka = setInterval(() => {
        if (closed) return
        try { controller.enqueue(encoder.encode(`: ka\n\n`)) } catch { closed = true }
      }, 20000)
      const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(ka)
        c.subs.delete(subKey)
        try { controller.close() } catch {}
      }
      req.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
