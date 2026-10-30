/* =====================================================================
   V159 — GLOBAL TENSION INDEX — شاخص تنش جهانی (سرور-مأخذ)
   ---------------------------------------------------------------------
   ذخیره: GameSetting key='world_tension' → JSON {v:{[server]:number}, at}
   − بدون مهاجرت اسکیما، بدون تایمر/کرال: واپس‌زدگی (−۱ در ساعت) «تنبل» است
     و فقط روی دسترسی محاسبه می‌شود ⇒ صفر بیداری اضافه، صفر لگ.
   − نویسنده‌ها: tensionBump روی هر پرتاب WMD (route.ts use_special/war_use_item)
   − خواننده‌ها: war_state / special_status (کلاینت فقط حقیقت سرور را نشان می‌دهد)
   نوشتن خوش‌بینانه با مقایسه‌ی مقدار قبلی (همان الگوی WarState) تا دو پرتاب
   هم‌زمان یک bump را گم نکنند؛ بعد از ۳ تلاش، آخرین مقدار خوانده‌شده برمی‌گردد
   (شاخص نرم است — گم‌شدن نادر یک +۱۵ بحرانی نیست، بن‌بست هم نیست).
   ===================================================================== */
import { db } from '@/lib/db'
import { TENSION_CFG } from '@/lib/balance'

const KEY = 'world_tension'

type TensionData = { v: Record<string, number>; at: number }

function parseTension(raw: string | null | undefined): TensionData {
  try {
    const o = JSON.parse(raw || '{}')
    if (o && typeof o === 'object' && o.v && typeof o.v === 'object') {
      const v: Record<string, number> = {}
      for (const k of Object.keys(o.v)) v[k] = Math.max(0, Math.min(TENSION_CFG.max, Number(o.v[k]) || 0))
      return { v, at: Number(o.at) || Date.now() }
    }
  } catch { /* ردیف خراب = صفر از نو */ }
  return { v: {}, at: Date.now() }
}

/* واپس‌زدگی تنبل: کل ساعت‌های سپری‌شده از آخرین به‌روزرسانی، از همه‌ی سرورها کم می‌شود */
function decayTension(d: TensionData): TensionData {
  const now = Date.now()
  const hrs = Math.floor(Math.max(0, now - d.at) / 3600_000)
  if (hrs <= 0) return d
  const v: Record<string, number> = {}
  for (const k of Object.keys(d.v)) v[k] = Math.max(0, (Number(d.v[k]) || 0) - hrs * TENSION_CFG.decayPerHour)
  return { v, at: d.at + hrs * 3600_000 } /* باقیمانده‌ی ساعت ناقص حفظ می‌شود */
}

async function readTension(): Promise<TensionData> {
  const row = await db.gameSetting.findUnique({ where: { key: KEY }, select: { value: true } })
  return decayTension(parseTension(row?.value))
}

async function writeTension(next: TensionData, expectRaw: string | null): Promise<boolean> {
  const raw = JSON.stringify(next)
  if (expectRaw == null) {
    try {
      await db.gameSetting.create({ data: { key: KEY, value: raw } })
      return true
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') return false /* مسابقه با create — دوباره بخوان */
      throw e
    }
  }
  const upd = await db.gameSetting.updateMany({ where: { key: KEY, value: expectRaw }, data: { value: raw } })
  return upd.count === 1
}

/** تنش فعلی یک سرور (با واپس‌زدگی تنبل؛ اگر واپس‌زدگی واقعی رخ داد، همان‌جا پایدار می‌شود) */
export async function tensionOf(server: number): Promise<number> {
  for (let i = 0; i < 3; i++) {
    const row = await db.gameSetting.findUnique({ where: { key: KEY }, select: { value: true } })
    const cur = decayTension(parseTension(row?.value))
    const val = Math.max(0, Math.min(TENSION_CFG.max, cur.v[String(server)] || 0))
    const changed = JSON.stringify(cur) !== (row?.value ?? '')
    if (!changed) return val
    if (await writeTension(cur, row ? row.value : null)) return val
  }
  const fallback = await readTension()
  return Math.max(0, Math.min(TENSION_CFG.max, fallback.v[String(server)] || 0))
}

/** افزایش تنش سرور (پرتاب WMD) — مقدار جدید را برمی‌گرداند */
export async function tensionBump(server: number, amount: number): Promise<number> {
  const k = String(server)
  for (let i = 0; i < 3; i++) {
    const row = await db.gameSetting.findUnique({ where: { key: KEY }, select: { value: true } })
    const cur = decayTension(parseTension(row?.value))
    cur.v[k] = Math.max(0, Math.min(TENSION_CFG.max, (cur.v[k] || 0) + amount))
    if (await writeTension(cur, row ? row.value : null)) return cur.v[k]
  }
  const last = await readTension()
  return Math.max(0, Math.min(TENSION_CFG.max, last.v[k] || 0))
}
