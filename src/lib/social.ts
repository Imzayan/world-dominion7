import { db } from '@/lib/db'

/* ============================================================
   V95 — SOCIAL & PLAYER IDENTITY V1 — موتور مشترک اجتماعی
   این ماژول بین /api/rpc و /api/db مشترک است.
   اصول:
   - هر دستاورد فقط از داده‌ی واقعی سرور صادر می‌شود (idempotent)
   - هیچ مسیر نوشتن مستقیم کلاینت به جدول‌های اجتماعی وجود ندارد
     (جدول‌های V95 در /api/db ثبت نشده‌اند ⇒ deny-by-default)
   - اعلان‌ها ضداسپم: اعلان پیام خصوصی فقط وقتی است که هیچ اعلان
     ناخوانده‌ی دیگری از همان فرستنده باز نباشد
   ============================================================ */

/* ---------- کاتالوگ دستاوردها (۸ دسته) ---------- */
export type AchCat = 'military' | 'economy' | 'olympics' | 'social' | 'progress' | 'alliance' | 'glory' | 'special'
export const ACH_CAT_FA: Record<AchCat, string> = {
  military: 'نظامی',
  economy: 'اقتصاد',
  olympics: 'المپیاد',
  social: 'اجتماعی',
  progress: 'پیشرفت',
  alliance: 'اتحاد',
  glory: 'شکوه',
  special: 'ویژه',
}
export type AchDef = { key: string; fa: string; d: string; cat: AchCat; ico: string }
export const ACH: Record<string, AchDef> = {
  /* نظامی — از تصرف واقعی قلمرو */
  m_cap1: { key: 'm_cap1', fa: 'نخستین فتح', d: 'اولین قلمروت را تصرف کن', cat: 'military', ico: '⚔️' },
  m_cap10: { key: 'm_cap10', fa: 'فاتح دهگانه', d: '۱۰ قلمرو تصرف کن', cat: 'military', ico: '🗺️' },
  m_cap25: { key: 'm_cap25', fa: 'شکارچی بزرگ', d: '۲۵ قلمرو تصرف کن', cat: 'military', ico: '🦅' },
  m_cap50: { key: 'm_cap50', fa: 'موج فتح', d: '۵۰ قلمرو تصرف کن', cat: 'military', ico: '🌊' },
  /* اقتصاد — از متریک واقعی economy رتبه‌بندی */
  ec_10k: { key: 'ec_10k', fa: 'خزانه‌دار', d: 'به اقتصاد ۱۰,۰۰۰ برس', cat: 'economy', ico: '💰' },
  ec_100k: { key: 'ec_100k', fa: 'تابلوی ثروت', d: 'به اقتصاد ۱۰۰,۰۰۰ برس', cat: 'economy', ico: '📈' },
  ec_1m: { key: 'ec_1m', fa: 'تاج‌دار اقتصاد', d: 'به اقتصاد ۱,۰۰۰,۰۰۰ برس', cat: 'economy', ico: '👑' },
  /* المپیاد — از سکو/مدال واقعی و بوکس */
  oly_medal: { key: 'oly_medal', fa: 'مدال‌آور', d: 'روی سکوی المپیاد برو', cat: 'olympics', ico: '🥇' },
  oly_gold: { key: 'oly_gold', fa: 'طلایی المپیک', d: 'طلای یک رشته را بگیر', cat: 'olympics', ico: '🏆' },
  oly_boxer: { key: 'oly_boxer', fa: 'مشت‌زن حرفه‌ای', d: 'اولین پیروزی بوکس', cat: 'olympics', ico: '🥊' },
  /* اجتماعی — از کنش واقعی */
  so_chat: { key: 'so_chat', fa: 'اولین فریاد', d: 'اولین پیامت را در چت جهانی بنویس', cat: 'social', ico: '💬' },
  so_dm: { key: 'so_dm', fa: 'نامه‌رسان', d: 'اولین پیام خصوصی را بفرست', cat: 'social', ico: '✉️' },
  so_friend: { key: 'so_friend', fa: 'هم‌پیمان', d: 'اولین دوستی‌ات را بساز', cat: 'social', ico: '🤝' },
  so_profile: { key: 'so_profile', fa: 'چهره‌ی رسمی', d: 'بیوی پروفایلت را بنویس', cat: 'social', ico: '🪪' },
  /* پیشرفت — از شمارش واقعی قلمرو */
  pr_c3: { key: 'pr_c3', fa: 'فرمانده', d: '۳ کشور در اختیار بگیر', cat: 'progress', ico: '🎖️' },
  pr_c10: { key: 'pr_c10', fa: 'سردار', d: '۱۰ کشور در اختیار بگیر', cat: 'progress', ico: '⭐' },
  pr_c22: { key: 'pr_c22', fa: 'امپراتور', d: '۲۲ کشور در اختیار بگیر', cat: 'progress', ico: '👑' },
  pr_c40: { key: 'pr_c40', fa: 'فرمانروای زمین', d: '۴۰ کشور در اختیار بگیر', cat: 'progress', ico: '🌍' },
  /* اتحاد */
  al_join: { key: 'al_join', fa: 'سرباز اتحاد', d: 'به یک اتحاد بپیوند یا بساز', cat: 'alliance', ico: '🛡️' },
  /* شکوه */
  gl_hof: { key: 'gl_hof', fa: 'ستاره‌ی تالار افتخارات', d: 'یک لقب HOF به‌دست آور', cat: 'glory', ico: '🏛️' },
  /* ویژه */
  sp_shop: { key: 'sp_shop', fa: 'حامی بازار', d: 'اولین خریدت را از فروشگاه کن', cat: 'special', ico: '💎' },
}
export const ACH_CATALOG: AchDef[] = Object.values(ACH)

/* کش درون-پردازه: هر (کاربر،دستاورد) فقط یک‌بار DB-check می‌شود */
const ACH_SEEN = new Set<string>()

/* صدور دستاورد — idempotent؛ true = همین حالا صادر شد */
export async function grantAch(userId: string, nick: string, key: string, server = 0): Promise<boolean> {
  const def = ACH[key]
  if (!def || !userId) return false
  const ck = userId + ':' + key
  if (ACH_SEEN.has(ck)) return false
  ACH_SEEN.add(ck)
  try {
    const prev = await db.userTrophy.findUnique({ where: { userId_key: { userId, key } } })
    if (prev) return false
    await db.userTrophy.create({ data: { userId, key, category: def.cat } })
    await notify(userId, server, 'ach', def.ico + ' دستاورد: ' + def.fa, def.d, key)
    return true
  } catch (e) {
    console.log('grantAch', key, e)
    return false
  }
}

/* اعلان — ضداسپم برای dm: فقط وقتی اعلان ناخوانده‌ی دیگری از همان فرستنده باز نیست */
export async function notify(userId: string, server: number, kind: string, title: string, body = '', refId: string | null = null, dedupOpen = false): Promise<void> {
  if (!userId) return
  try {
    if (dedupOpen && refId) {
      const open = await db.notification.findFirst({ where: { userId, kind, refId, readAt: null }, select: { id: true } })
      if (open) return
    }
    await db.notification.create({ data: { userId, server, kind, title: String(title).slice(0, 120), body: String(body).slice(0, 300), refId } })
    /* جدول کوچک می‌ماند: بیش از ۶۰ ردیف ⇒ قدیمی‌ها پاک */
    const cnt = await db.notification.count({ where: { userId } })
    if (cnt > 60) {
      const old = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip: 40, take: cnt })
      if (old.length) await db.notification.deleteMany({ where: { id: { in: old.map((r) => r.id) } } })
    }
  } catch (e) { console.log('notify', e) }
}

/* پاک‌سازی تنبل حضور: ردیف‌های بی‌علامت بیش از ۲۴ ساعت — حداکثر هر ۱۰ دقیقه */
let lastSweep = 0
export async function presenceSweep(): Promise<void> {
  const now = Date.now()
  if (now - lastSweep < 600_000) return
  lastSweep = now
  try { await db.presence.deleteMany({ where: { lastSeen: { lt: new Date(now - 86_400_000) } } }) } catch (e) { console.log('sweep', e) }
}

/* شمارش آنلاین واقعی از presence با پنجره‌ی ۹۰ ثانیه — به‌ازای هر سرور */
export async function onlineByServer(): Promise<Record<number, number>> {
  const since = new Date(Date.now() - 90_000)
  const out: Record<number, number> = {}
  try {
    const rows = await db.presence.groupBy({ by: ['server'], where: { lastSeen: { gte: since }, status: 'online' }, _count: { _all: true } })
    for (const r of rows) out[r.server] = r._count._all
  } catch (e) { console.log('onlineByServer', e) }
  return out
}

/* یافتن کاربر دیگر با uid یا nick یکتا (nickLower) */
export async function resolveSocialTarget(p_uid: unknown, p_nick: unknown) {
  const uid = p_uid != null && p_uid !== '' ? String(p_uid).slice(0, 40) : ''
  const nk = p_nick != null ? String(p_nick).trim().slice(0, 40) : ''
  if (uid) { try { return await db.user.findUnique({ where: { id: uid } }) } catch { return null } }
  if (nk) { try { return await db.user.findUnique({ where: { nickLower: nk.toLowerCase() } }) } catch { return null } }
  return null
}

/* پاک‌سازی بدنه‌ی پیام — همان سبک چت جهانی */
export function cleanBody(v: unknown, cap: number): string {
  return String(v ?? '').replace(/[<>]/g, '').slice(0, cap).trim()
}
