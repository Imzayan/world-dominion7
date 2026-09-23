/* In-memory realtime hub for PvP battle channels.
   Works with SSE streaming + polling fallback (see shim supabase.js).
   V33.1: subscriber identity is server-side (uid per connection) — the old
   design keyed subscriptions by a client-claimed `from`, which could be
   spoofed to suppress/impersonate events, and two tabs of the same user
   overwrote each other's subscription. */

export interface RtEvent {
  seq: number
  event: string
  payload: unknown
  from: string
  at: number
}

export interface Sub {
  uid: string
  send: (e: RtEvent) => void
}

interface Channel {
  evs: RtEvent[]
  subs: Map<string, Sub>
}

interface Hub {
  ch: Map<string, Channel>
  seq: number
}

declare global {
  var __wd_rt_hub: Hub | undefined
}

export function hub(): Hub {
  if (!globalThis.__wd_rt_hub) {
    globalThis.__wd_rt_hub = { ch: new Map(), seq: 0 }
  }
  return globalThis.__wd_rt_hub
}

export function getChannel(name: string): Channel {
  const h = hub()
  let c = h.ch.get(name)
  if (!c) {
    c = { evs: [], subs: new Map() }
    h.ch.set(name, c)
  }
  return c
}

export function publish(chName: string, event: string, payload: unknown, from: string): RtEvent {
  const h = hub()
  const c = getChannel(chName)
  h.seq += 1
  const ev: RtEvent = { seq: h.seq, event, payload, from, at: Date.now() }
  c.evs.push(ev)
  if (c.evs.length > 300) c.evs.splice(0, c.evs.length - 300)
  for (const [, s] of c.subs) {
    if (s.uid === from) continue // broadcast self:false — by server-side uid
    try { s.send(ev) } catch {}
  }
  return ev
}

export function since(chName: string, afterSeq: number, from: string): RtEvent[] {
  const c = getChannel(chName)
  return c.evs.filter((e) => e.seq > afterSeq && e.from !== from)
}

/* V33.1: evict channels with no subscribers and no fresh events — the map used to
   grow forever (every distinct ?since= poll created a channel). Called on publish. */
const STALE_MS = 10 * 60 * 1000
export function sweep() {
  const h = hub()
  const now = Date.now()
  for (const [name, c] of h.ch) {
    if (c.subs.size === 0) {
      const lastAt = c.evs.length ? c.evs[c.evs.length - 1].at : 0
      if (now - lastAt > STALE_MS) h.ch.delete(name)
    }
  }
}
