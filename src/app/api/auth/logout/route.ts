import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, clearSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Supabase-compatible signOut. */
export async function POST() {
  try {
    const user = await getSessionUser()
    if (user) {
      await db.session.deleteMany({ where: { userId: user.id } })
    }
  } catch {}
  await clearSessionCookie()
  return NextResponse.json({ data: {}, error: null })
}
