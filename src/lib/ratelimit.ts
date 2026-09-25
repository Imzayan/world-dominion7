import { NextRequest, NextResponse } from 'next/server'

/**
 * V59 wave-2 (§17): in-memory sliding-window rate limiter.
 * Per serverless instance — still raises the bar massively against brute-force
 * and RPC spam (each cold start resets, attackers cannot rely on that either).
 * Envelope matches the Supabase-compatible shape used by all routes.
 */

type Bucket = { hits: number[] }
const buckets = new Map<string, Bucket>()

/* periodic prune so the map cannot grow unbounded */
let lastPrune = 0
function prune(now: number) {
  if (now - lastPrune < 60_000) return
  lastPrune = now
  const cutoff = now - 120_000
  for (const [k, b] of buckets) {
    b.hits = b.hits.filter(t => t > cutoff)
    if (!b.hits.length) buckets.delete(k)
  }
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Returns a 429-style NextResponse when over limit, otherwise null.
 * @param key     unique bucket key (e.g. `login:1.2.3.4`)
 * @param limit   max hits inside windowMs
 * @param windowMs sliding window length
 */
export function rateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now()
  prune(now)
  const k = key
  const b = buckets.get(k) || { hits: [] }
  b.hits = b.hits.filter(t => now - t < windowMs)
  if (b.hits.length >= limit) {
    buckets.set(k, b)
    return NextResponse.json(
      { data: null, error: { message: 'Too many requests — try again shortly', code: '429' } },
      { status: 429 }
    )
  }
  b.hits.push(now)
  buckets.set(k, b)
  return null
}
