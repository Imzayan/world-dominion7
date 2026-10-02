import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/* ============================================================
   V95 — Section 12: قرارداد جنگ
   کلاینت فقط USE_TACTICAL_ITEM می‌فرستد:
     POST /api/war/use-tactical-item
     body: { p_item, p_target | p_target_player_id + p_target_country_id }
   این مسیر یک پوشش نازک روی هندلر واحد سرور (rpc «use_tactical_item»)
   است — تک‌منبع منطق؛ هیچ اعتبارسنجی/اثری کلاینت-محور وجود ندارد.
   ============================================================ */
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: null, error: { message: 'not authenticated', code: '401' } })
  const rl = rateLimit(req, 'war95:' + user.id, 30, 60_000)
  if (rl) return rl
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch {}
  const base = new URL(req.url).origin
  try {
    const res = await fetch(base + '/api/rpc/use_tactical_item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        /* سشن کوکی‌محور است — باید حفظ شود */
        'Cookie': req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
    const j = await res.json()
    return NextResponse.json(j, { status: res.status })
  } catch {
    return NextResponse.json({ data: null, error: { message: 'war engine unavailable', code: '502' } })
  }
}
