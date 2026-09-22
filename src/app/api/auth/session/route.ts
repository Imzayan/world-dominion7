import { NextResponse } from 'next/server'
import { getSessionUser, supaUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Supabase-compatible getSession. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: { session: null }, error: null })
  return NextResponse.json({
    data: { session: { user: supaUser(user) } },
    error: null,
  })
}
