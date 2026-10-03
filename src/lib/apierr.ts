import { NextResponse } from 'next/server'

/*
 * V116 — بهداشت خطا (بازخورد بازبین مایکت: «خطا the column» روی ثبت‌نام)
 * متن خام Prisma/SQLite/JS هرگز به کلاینت نمی‌رود — نه اطلاعات دیتابیس لو می‌رود
 * و نه متن ترسناک انگلیسی به بازیکن نشان داده می‌شود. جزئیات کامل فقط در لاگ سرور.
 * کلاینت توکن پایدار «server_busy» را در errFa به پیام فارسی دوستانه نگاشت می‌کند.
 */
export function safeErr(scope: string, e: unknown, body: Record<string, unknown> = { data: {}, error: { message: 'server_busy', status: 500 } }) {
  try {
    const raw = e instanceof Error ? (e.stack || e.message) : String(e)
    console.error('[wd-api:' + scope + ']', String(raw).slice(0, 1200))
  } catch { /* لاگ هرگز مسیر اصلی را نمی‌شکند */ }
  return NextResponse.json(body)
}
