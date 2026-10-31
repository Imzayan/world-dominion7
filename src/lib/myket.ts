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

/* ============================================================
   V168 — بند ۱.۳ سند امنیتی: developerPayload مقید به «خریدار»
   ------------------------------------------------------------------
   تا V167 payload خرید «wd-{sku}-{ts}» بود — به هیچ هویتی بسته نبود و
   سرور هم آن را چک نمی‌کرد؛ یعنی رسیدِ دزدیده‌شده می‌توانست روی حسابِ
   دیگری گرنت بخورد (تا اولین گرنتِ توکن، که فقط همان یک‌بار را می‌بندد).

   طراحی (ریختِ متفاوت از پیشنهاد سند — با دلیل مستند):
   سند «payload = wd|$sessionId|$sku|$ts» را پیشنهاد می‌دهد، اما بایند به
   «نشست» جریان بازیابی خودکار خرید (wdRestoreBoot — بند قفل‌شده ۹) را
   می‌شکند: خرید در نشستِ اول انجام و اپ قبل از claim کرش می‌کند ⇒
   بازیابی از نشستِ جدید با payloadِ نشستِ مرده می‌آید ⇒ ردِ ناعادلانه.
   پس به‌جای نشست، «paytok» می‌سازیم: توکن ماتِ پایدارِ مقید به حساب،
   با راز سرور ساخته‌شده (کلاینت فقط آن را دریافت و منعکس می‌کند —
   نمی‌تواند برای حسابِ دیگری بسازد):
     paytok = HMAC-SHA256(secret, 'wdpay:' + user.id).hex[0..16)
   معیار پذیرش سند کامل برآورده می‌شود: رسیدی که برای حسابی ساخته شده،
   توسط حسابِ دیگر گرنت نمی‌شود (paytokِ مهاجم ≠ paytokِ داخل رسیدِ
   امضاشده؛ دستکاری payload هم امضای RSA را می‌شکند).
   و بازیابی همان حساب همیشه سالم می‌ماند (paytok پایدار است).

   چرخش راز: اگر WDPAY_SECRET/OLY_HMAC_SECRET عوض شود، paytokهای داخل
   رسیدهای در جریان mismatch می‌شوند — رسیدهای قدیمی مثل امروز از مسیر
   legacy (payload بدون wd2) می‌گذرند و فقط رسیدهای جدیدِ در جریان اثر
   می‌گیرند؛ پس چرخش فقط باید با آگاهی از خریدهای لحظه‌ی انتقال انجام شود.
   ============================================================ */

/* راز paytok — ترتیب اولویت ثابت؛ fallback فقط برای محیط محلی (روی پروداکشن env ست شود) */
function paySecret(): string {
  return process.env.WDPAY_SECRET || process.env.OLY_HMAC_SECRET || 'wd-pay-v1-local-fallback'
}

/* توکن مات مقید به حساب — پایدار، غیرقابل‌ساخت توسط کلاینت، بی‌خطر برای انتشار (هیچ چیزی لو نمی‌دهد) */
export function paytokOf(userId: string): string {
  return crypto.createHmac('sha256', paySecret()).update('wdpay:' + userId).digest('hex').slice(0, 16)
}

/* استخراج developerPayload از INAPP_PURCHASE_DATA خام — فقط فرمت جدید wd2؛
   هر چیز دیگر (فرمت قدیمی wd-… / خالی / خراب) = null یعنی «چک payload اعمال نمی‌شود»
   تا APKهای قدیمی و مسیر QA ساندباکس دقیقاً مثل امروز کار کنند (سازگاری عقب). */
export function parseDevPayload(rawJson: string): { paytok: string; sku: string; ts: string } | null {
  try {
    if (!rawJson || rawJson.length < 2 || rawJson.length > 8192) return null
    const j = JSON.parse(rawJson) as { developerPayload?: unknown }
    const p = typeof j.developerPayload === 'string' ? j.developerPayload : ''
    const m = /^wd2\|([0-9a-f]{16})\|([a-z0-9_]{2,40})\|([0-9a-z]+)$/.exec(p)
    if (!m) return null
    return { paytok: m[1], sku: m[2], ts: m[3] }
  } catch {
    return null
  }
}
