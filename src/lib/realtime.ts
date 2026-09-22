/* In-memory realtime hub for PvP battle channels.
   Works with SSE streaming + polling fallback (see shim supabase.js). */

export interface RtEvent {
  seq: number
  event: string
  payload: unknown
  from: string
  at: number
}

interface Channel {
  evs: RtEvent[]
  subs: Map<string, (e: RtEvent) => void>
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
  for (const [subId, send] of c.subs) {
    if (subId === from) continue // broadcast self:false
    try { send(ev) } catch {}
  }
  return ev
}

export function since(chName: string, afterSeq: number, from: string): RtEvent[] {
  const c = getChannel(chName)
  return c.evs.filter((e) => e.seq > afterSeq && e.from !== from)
}
