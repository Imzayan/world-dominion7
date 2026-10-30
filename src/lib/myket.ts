import crypto from 'crypto'

/* ============================================================
   V144 — راستی‌آزمایی امضای رسید مایکت با «کلید عمومی» (توکن عمومی پنل توسعه‌دهنده)
   ------------------------------------------------------------------
   مایکت (مطابق IAB v3 گوگل) محتوای INAPP_PURCHASE_DATA را با کلید
   خصوصی خودش امضا می‌کند و امضا را در INAPP_DATA_SIGNATURE برمی‌گرداند.
   دارنده‌ی کلید عمومی می‌تواند صحت امضا را تأیید کند — یعنی رسید واقعاً
   از مایکت آمده و دستکاری نشده است.

   دو مسیر راستی‌آزمایی در verifyProviderReceipt (route.ts):
   ۱) API رسمی (developer.myket.ir …/purchases/products/{sku}/verify) —
      نیازمند MYKET_ACCESS_TOKEN یا MYKET_CLIENT_ID/SECRET — اولویت اول.
   ۲) مسیر امضا (همین فایل) — وقتی اعتبار API تنظیم نشده باشد؛
      کلید عمومی از MYKET_PUBLIC_KEY (env اختیاری) یا مقدار پیش‌فرض زیر.

   کلید عمومی راز نیست (داخل هر APK هم می‌رود) — انتشار در ریپو بی‌خطر است.
   الگوریتم: امضای IAB v3 استاندارد SHA1withRSA است؛ برای سازگاری با
   تنظیمات احتمالی آینده‌ی مایکت، SHA256withRSA هم پذیرفته می‌شود
   (هرکدام درست درآمد = رسید معتبر؛ هر دو ناموفق = رسید نامعتبر).
   ============================================================ */

/* کلید عمومی مایکت بازی — تحویل مالک (اکتبر ۲۰۲۶) از پنل توسعه‌دهندگان مایکت */
const MYKET_PUBLIC_KEY_DEFAULT =
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCEA9lv4z/EOHzyEMw2+y7XDK2oHd5ga/PsPK6//qQxrnAzVajtaiQv8pxeDjqYT/2oW6RcQei3ON59WsIqucSUz7qpIAW5yBb6VR6/lOvFWIc7c9ScQTbIJ/ybarwLZTBUP6z3pJShO7akm0+jEptGfqvooukWcHUI+jdLfc0VeQIDAQAB'

/* base64 خام → PEM تا crypto.createVerify بپذیرد */
function toPem(b64: string): string {
  const clean = b64.replace(/\s+/g, '')
  const lines = clean.match(/.{1,64}/g) || []
  return '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----\n'
}

/* امضای رسید را با کلید عمومی مایکت تأیید می‌کند.
   json: دقیقاً همان رشته‌ی INAPP_PURCHASE_DATA (بایت‌به‌بایت — هر دستکاری = رد)
   sigB64: مقدار INAPP_DATA_SIGNATURE (base64)
   env: MYKET_PUBLIC_KEY اختیاری — برای تست یا چرخش کلید بدون دیپلوی کد. */
export function myketSigVerify(json: string, sigB64: string): boolean {
  try {
    const raw = (process.env.MYKET_PUBLIC_KEY || MYKET_PUBLIC_KEY_DEFAULT).replace(/\s+/g, '')
    if (!json || !sigB64 || raw.length < 100) return false
    const key = toPem(raw)
    const data = Buffer.from(json, 'utf8')
    const sig = Buffer.from(sigB64, 'base64')
    for (const alg of ['RSA-SHA1', 'RSA-SHA256']) {
      try {
        const v = crypto.createVerify(alg)
        v.update(data)
        if (v.verify(key, sig)) return true
      } catch {
        /* الگوریتم/کلید ناسازگار — الگوی بعدی */
      }
    }
    return false
  } catch {
    return false
  }
}
