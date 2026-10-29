import { cookies } from 'next/headers'
import crypto from 'crypto'

export const SESSION_COOKIE = 'wd_session'
const SESSION_DAYS = 30

export function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(12).toString('hex')
  const hash = crypto.scryptSync(password, s, 32).toString('hex')
  return `${s}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt] = stored.split(':')
    const candidate = hashPassword(password, salt)
    const a = Buffer.from(candidate.split(':')[1], 'hex')
    const b = Buffer.from(stored.split(':')[1], 'hex')
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function newToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE_OFF !== '1',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE_OFF !== '1',
    path: '/',
    maxAge: 0,
  })
}

export type SessionUser = {
  id: string
  email: string
  nick: string
  isAdmin: boolean
  deviceId: string | null
}

/* V54 — ناک‌های ادمین از env (ADMIN_NICKS، جدا با کاما). پیش‌فرض: صاحب بازی.
   روی سرور تازه‌ی مایکت هم فقط این نام‌ها ادمین می‌شوند. */
const ADMIN_NICKS = (process.env.ADMIN_NICKS || 'alireza')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

/** live list of reserved admin nicks (env-configurable) */
export function adminNicks(): string[] {
  return ADMIN_NICKS
}

/* V144-PERF: کش نشست درون‌پردازه‌ای (TTL ۳۰ثانیه) — قبلاً «هر» درخواست API (برای هر بازیکنِ
   آنلاین ۲۰-۴۰ درخواست در دقیقه: سیو، سینک، حضور، اخبار، چت…) یک findUnique روی جدول sessions
   با include user می‌زد = هزاران کوئری اضافه در دقیقه فقط برای احراز هویت. TTL کوتاه یعنی
   انصراف/حذف نشست حداکثر ۳۰ثانیه دیر بسته می‌شود — برای این بازی قابل قبول. */
const SES_CACHE = new Map<string, { u: SessionUser; at: number }>()
const SES_TTL_MS = 30_000

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const hit = SES_CACHE.get(token)
    if (hit && Date.now() - hit.at < SES_TTL_MS) return hit.u
    const { db } = await import('@/lib/db')
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) {
      await db.session.delete({ where: { token } }).catch(() => {})
      return null
    }
    const u: SessionUser = {
      id: session.user.id,
      email: session.user.email,
      nick: session.user.nick,
      isAdmin: session.user.isAdmin || ADMIN_NICKS.includes(session.user.nickLower),
      deviceId: session.user.deviceId,
    }
    if (SES_CACHE.size > 5000) {
      const now = Date.now()
      for (const [k, v] of SES_CACHE) if (now - v.at > SES_TTL_MS) SES_CACHE.delete(k)
    }
    SES_CACHE.set(token, { u, at: Date.now() })
    return u
  } catch {
    return null
  }
}

/** Public shape mimicking a Supabase auth user (fields the game reads). */
export function supaUser(u: SessionUser, deviceId?: string | null) {
  return {
    id: u.id,
    email: u.email,
    user_metadata: { nick: u.nick, device_id: deviceId ?? u.deviceId },
  }
}
