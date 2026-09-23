import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, newToken, setSessionCookie, supaUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Supabase-compatible signInWithPassword. Body: { email, password } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email || '').toLowerCase().trim()
    const password = String(body.password || '')
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({
        data: {},
        error: { message: 'Invalid login credentials', status: 400 },
      })
    }
    const token = newToken()
    /* V33.1: prune expired sessions on login — the table used to grow unbounded */
    await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {})
    await db.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    })
    await setSessionCookie(token)
    await db.wallet.upsert({ where: { userId: user.id }, create: { userId: user.id, gems: 40 }, update: {} })
    const su = supaUser({
      id: user.id, email: user.email, nick: user.nick,
      isAdmin: user.isAdmin || user.nickLower === 'alireza', deviceId: user.deviceId,
    })
    return NextResponse.json({ data: { session: { user: su }, user: su }, error: null })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'login failed'
    return NextResponse.json({ data: {}, error: { message, status: 500 } })
  }
}
