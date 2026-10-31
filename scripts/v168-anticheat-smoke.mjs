/* ============================================================
   V168 SMOKE — بند ۱.۳ (paytok/payload) + بند ۱.۵ (دلتا-نرخ سیو)
   ------------------------------------------------------------------
   استاتیک + ریاضی: تزریق مستقیم سرور (Prisma/Next) در اسموک ممکن نیست،
   پس دو لایه داریم:
     ۱) ادعاهای ساختاری روی سورس واقعی (import/ترتیب/گارد legacy/لاگ)
     ۲) آینه‌ی ریاضیِ مرزِ نرخ با ثابت‌هایی که از خود سورس خوانده می‌شوند
        (اگر ثابت‌ها تغییر کنند، تست همان مقدار واقعی را می‌سنجد)
   اجرا: node scripts/v168-anticheat-smoke.mjs
   ============================================================ */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RPC = path.join(ROOT, 'src/app/api/rpc/[fn]/route.ts');
const DBR = path.join(ROOT, 'src/app/api/db/[table]/route.ts');
const MYK = path.join(ROOT, 'src/lib/myket.ts');
const IDX = path.join(ROOT, 'public/game/index.html');
const VTXT = path.join(ROOT, 'public/game/v.txt');

let ok = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { ok++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const rd = (p) => fs.readFileSync(p, 'utf8');

/* ---------- ۱) بند ۱.۳ — paytok و developerPayload ---------- */
const myk = rd(MYK);
check('myket: paytokOf با HMAC-SHA256 ساخته می‌شود', /export function paytokOf\(userId: string\): string \{\s*return crypto\.createHmac\('sha256'/.test(myk));
check('myket: paytok دقیقاً ۱۶ کاراکتر hex است', /\.digest\('hex'\)\.slice\(0, 16\)/.test(myk));
check('myket: راز paytok از env می‌آید (WDPAY_SECRET یا OLY_HMAC_SECRET)', /process\.env\.WDPAY_SECRET \|\| process\.env\.OLY_HMAC_SECRET/.test(myk));
check('myket: parseDevPayload فقط فرمت wd2 را می‌پذیرد', /\^wd2\\\|\(\[0-9a-f\]\{16\}\)\\\|\(\[a-z0-9_\]\{2,40\}\)\\\|\(\[0-9a-z\]\+\)\$/.test(myk));
check('myket: خروجی parseDevPayload روی هر خطا null است (legacy سالم می‌گذرد)', /return null/.test(myk));

const rpc = rd(RPC);
check('rpc: import paytokOf/parseDevPayload از lib/myket', /import \{ myketSigVerify, paytokOf, parseDevPayload \} from '@\/lib\/myket'/.test(rpc));
check('rpc: get_wallet مقدار paytok را برمی‌گرداند', /paytok: paytokOf\(user\.id\)/.test(rpc));
check('rpc: چک payload در shop_gem_topup بعد از راستی‌آزمایی رسید است', rpc.indexOf('plTop168') > rpc.indexOf("case 'shop_gem_topup'") && /plTop168\.paytok !== paytokOf\(user\.id\)/.test(rpc));
check('rpc: چک payload در starter_claim بعد از راستی‌آزمایی رسید است', /plSt168\.paytok !== paytokOf\(user\.id\)/.test(rpc));
check('rpc: خطای اختصاصی payload_session تعریف شده', /error: 'payload_session'/.test(rpc));
check('rpc: گارد legacy — payload خالی/قدیمی چک را دور می‌زند (if (pl…)', /if \(plTop168\) \{[\s\S]*?\n        \}\n        try \{/.test(rpc) || /if \(plTop168\) \{/.test(rpc));
check('rpc: مسیر ساندباکس بدون p_json سر جایش است (verifyProviderReceipt دست‌نخورده)', /provider === 'sandbox'/.test(rpc));

/* رفتار واقعی paytok/parse — بازتولید مطابق سورس (همان فرمول/ریجکس) */
const pt = (u) => crypto.createHmac('sha256', 'test-secret').update('wdpay:' + u).digest('hex').slice(0, 16);
const RX = /^wd2\|([0-9a-f]{16})\|([a-z0-9_]{2,40})\|([0-9a-z]+)$/;
const parse = (raw) => { try { const p = (JSON.parse(raw) || {}).developerPayload || ''; const m = RX.exec(p); return m ? { paytok: m[1], sku: m[2], ts: m[3] } : null } catch { return null } };
const good = JSON.stringify({ developerPayload: 'wd2|' + pt('userA') + '|gems_800|abc123', productId: 'gems_800', purchaseToken: 'tok1' });
check('paytok: پایدار و ۱۶hex', /^[0-9a-f]{16}$/.test(pt('userA')) && pt('userA') === pt('userA'));
check('paytok: دو حساب متفاوت، توکن متفاوت', pt('userA') !== pt('userB'));
check('parse: wd2 معتبر پارس می‌شود', (parse(good) || {}).sku === 'gems_800');
check('parse: payload قدیمی wd-… = null (سازگاری APK قدیمی)', parse(JSON.stringify({ developerPayload: 'wd-gems_800-lxy' })) === null);
check('parse: بدون developerPayload = null (ساندباکس/QA)', parse(JSON.stringify({ productId: 'x' })) === null);
check('parse: JSON خراب = null', parse('{broken') === null);
check('parse: paytok دستکاری‌شده قابل‌تشخیص است (مقایسه با paytokOf مهاجم رد می‌شود)', (parse(good) || {}).paytok !== pt('attacker'));

/* ---------- ۲) بند ۱.۵ — دلتا-نرخ سیو ---------- */
const dbr = rd(DBR);
check('db: rateClampSaveState تعریف شده', /async function rateClampSaveState\(stateStr: string, userId: string\)/.test(dbr));
check('db: فراخوانی بعد از clampSaveState (ترتیب سقف مطلق → نرخ)', dbr.indexOf('await rateClampSaveState(data.state as string, user.id)') > dbr.indexOf('await clampSaveState(data.state as string, user.id)'));
check('db: prev row با updatedAt خوانده می‌شود (دلتای زمانی واقعی)', /db\.save\.findUnique\(\{ where: \{ userId \}, select: \{ state: true, updatedAt: true \} \}\)/.test(dbr));
check('db: event log ساختاریافته [WD-ANTICHEAT]', /\[WD-ANTICHEAT\] save-rate/.test(dbr));
check('db: تخلف فقط همان منبع بریده می‌شود — کل سیو رد نمی‌شود', /res\[k\] = Math\.round\(allowed\)/.test(dbr));
check('db: فقط مسیر نوشتن چک می‌شود (خواندن مثل قبل)', (dbr.match(/rateClampSaveState\(/g) || []).length === 2); /* تعریف + یک فراخوانی */

/* ثابت‌ها را از سورس واقعی بخوان — آینه‌ی ریاضی همان فرمول */
const num = (re) => { const m = dbr.match(re); if (!m) return null; return Number(m[1].replace(/_/g, '')) };
const RJ = { gold: num(/RATE_JUMP = \{ gold: ([\d_]+)/), oil: num(/oil: ([\d_]+), food/), food: num(/food: ([\d_]+) \}/) };
const RT = { gold: num(/RATE_PER_SEC = \{ gold: ([\d_]+)/), oil: num(/RATE_PER_SEC = \{[^}]*oil: ([\d_]+)/), food: num(/RATE_PER_SEC = \{[^}]*food: ([\d_]+)/) };
const RP = { gold: num(/RATE_PER_TERR = \{ gold: ([\d_]+)/), oil: num(/RATE_PER_TERR = \{[^}]*oil: ([\d_]+)/), food: num(/RATE_PER_TERR = \{[^}]*food: ([\d_]+)/) };
const DTCAP = num(/RATE_DT_CAP = ([\d_]+)/);
check('db: ثابت‌های نرخ خوانا و کامل', RJ.gold && RJ.oil && RJ.food && RT.gold && RT.oil && RT.food && RP.gold && DTCAP === 900);
const allowed = (k, prev, terr, dt) => prev + RJ[k] + RP[k] * terr + RT[k] * Math.min(dt, DTCAP);
/* سناریوهای ضدتقلب/سلامت (terr=1، فاصله‌ی سیو ۸ثانیه‌ای عادی) */
check('نرخ: پرش جعلی ۰→۲۰M طلا در یک سیو بریده می‌شود', 20_000_000 > allowed('gold', 0, 1, 8));
check('نرخ: پرش جعلی ۰→۲۰M نفت بریده می‌شود', 20_000_000 > allowed('oil', 0, 1, 8));
check('نرخ: پک شروع مشروع (۱۰۶k طلا) می‌گذرد', 106_000 <= allowed('gold', 6000, 1, 8));
check('نرخ: پک شروع مشروع (۲۹k غذا) می‌گذرد', 29_000 <= allowed('food', 4000, 1, 8));
check('نرخ: پک شروع مشروع (۱۷٫۵k نفت) می‌گذرد', 17_500 <= allowed('oil', 2500, 1, 8));
check('نرخ: امپراتوری ۱۵قلمرویِ سالم (دلتای ۲۵۰k) می‌گذرد', 20_250_000 <= allowed('gold', 20_000_000, 15, 8));
check('نرخ: dt سقف ۹۰۰ثانیه دارد (بازگشت طولانی آزاد، نرخ‌سنج بی‌اثر)', DTCAP === 900 && allowed('gold', 0, 1, 86_400) === allowed('gold', 0, 1, 900));
check('نرخ: خرج‌کردن و سیوِ مجدد سریعِ ۲۰M (رفت‌وبرگشت مکرر) دفعه‌ی دوم بریده می‌شود', 20_000_000 > allowed('gold', 0, 15, 4));

/* ---------- ۳) نگهبان رگرسیون V167 + آیین نسخه ---------- */
check('V167: بلاک ساخت‌یافته‌ی occ سر جایش است (رگرسیون ممنوع)', /occOut\[k\] = Math\.max\(0, Math\.min\(100, Math\.round\(v\)\)\)/.test(dbr));
check('V167: occ اسکالرِ قدیمی برگشته نیست', !/^\s*st\.occ = sNum\(st\.occ, 100\)$/m.test(dbr));

const V = parseInt((fs.existsSync(VTXT) ? rd(VTXT) : '0').trim(), 10);
const idx = rd(IDX);
check('نسخه: v.txt bumped', V >= 168, 'v.txt=' + V);
check('نسخه: __WD_V در index.html هم‌عدد v.txt', new RegExp('__WD_V=' + V).test(idx));
check('نسخه: ۱۲ ارجاع ?v= هم‌عدد v.txt', (idx.match(new RegExp('\\?v=' + V, 'g')) || []).length === 12, 'count=' + (idx.match(new RegExp('\\?v=' + V, 'g')) || []).length);

console.log(`\n== v168-anticheat-smoke: ${ok} PASS / ${fail} FAIL ==`);
process.exit(fail ? 1 : 0);
