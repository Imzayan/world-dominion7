import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, newToken, setSessionCookie, supaUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Supabase-compatible signUp. Body: { email, password, nick?, device_id? } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email || '').toLowerCase().trim()
    const password = String(body.password || '')
    const nick = String(body.nick || body.options?.data?.nick || '').trim()
    const deviceId = String(body.device_id || body.options?.data?.device_id || '') || null

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ data: {}, error: { message: 'Invalid email', status: 400 } })
    }
    if (password.length < 6) {
      return NextResponse.json({ data: {}, error: { message: 'Password should be at least 6 characters', status: 400 } })
    }
    if (nick.length < 2 || nick.length > 20) {
      return NextResponse.json({ data: {}, error: { message: 'Nickname must be 2-20 characters', status: 400 } })
    }

    const nickLower = nick.toLowerCase()
    const existingNick = await db.user.findUnique({ where: { nickLower } })
    if (existingNick) {
      return NextResponse.json({
        data: {},
        error: { message: 'User already registered', status: 400 },
      })
    }
    if (deviceId) {
      const existingDevice = await db.user.findFirst({ where: { deviceId } })
      if (existingDevice) {
        return NextResponse.json({
          data: {},
          error: { message: 'device already registered on this browser', status: 400 },
        })
      }
    }

    const user = await db.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        nick,
        nickLower,
        passwordHash: hashPassword(password),
        deviceId,
        isAdmin: nickLower === 'alireza',
      },
    })
    // welcome wallet: 40 gems
    await db.wallet.create({ data: { userId: user.id, gems: 40 } })
    await db.score.create({ data: { userId: user.id, nick } })

    const token = newToken()
    await db.session.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    })
    await setSessionCookie(token)

    const su = supaUser(
      { id: user.id, email: user.email, nick: user.nick, isAdmin: user.isAdmin, deviceId: user.deviceId },
      deviceId,
    )
    return NextResponse.json({ data: { session: { user: su }, user: su }, error: null })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'signup failed'
    return NextResponse.json({ data: {}, error: { message, status: 500 } })
  }
}
