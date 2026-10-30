/* ============================================================
   V146 — تست ایستای سه تغییر پرداخت مایکت (دستور مالک):
     ۱) MYKET_ACCESS_TOKEN فقط سمت سرور (.env گیت‌نشده) — صفر نشت به کلاینت/گیت
     ۲) حذف کامل مودال «نصب/به‌روزرسانی از مایکت» — اتصال مستقیم + یک تلاش مجدد خودکار + toast صادقانه
     ۳) مورد ۱ و ۲ گزارش: بازیابی خریدهای ناقص (wdRestoreItems) + بازیابی خودکار در استارت (wdRestoreBoot)
   اجرا: node scripts/v146-iab-restore.mjs
   ============================================================ */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { ok++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const shop = read('public/game/shop-v2.js');
const html = read('public/game/index.html');
const vtxt = read('public/game/v.txt').trim();

/* ---------- ۱) توکن فقط سمت سرور ---------- */
const TOKEN = read('.env').match(/MYKET_ACCESS_TOKEN=(\S+)/)?.[1] || '';
check('.env: MYKET_ACCESS_TOKEN تنظیم شده', TOKEN.length >= 30);
check('.env: گیت‌نشده (git check-ignore)', (() => { try { execSync('git check-ignore .env', { cwd: ROOT, stdio: 'pipe' }); return true; } catch { return false; } })());
let leak = '';
try { leak = execSync(`rg -l "${TOKEN}" --hidden -g '!.git' -g '!.env' .`, { cwd: ROOT, stdio: 'pipe' }).toString().trim(); } catch { /* no match = خوب */ }
check('صفر نشت توکن در کل پروژه (به‌جز .env)', !leak, leak || '');
check('توکن در هیچ فایل کلاینت نیست (public/، apk-build/)', !shop.includes(TOKEN) && !html.includes(TOKEN));
const route = read('src/app/api/rpc/[fn]/route.ts');
check('route.ts: مسیر API رسمی از process.env.MYKET_ACCESS_TOKEN می‌خواند (سمت سرور)', route.includes('process.env.MYKET_ACCESS_TOKEN'));
check('route.ts: هدر رسمی X-Access-Token', route.includes("'X-Access-Token'"));

/* ---------- ۲) حذف مودال + اتصال مستقیم ---------- */
check('shop-v2: تابع مودال wdStoreHelp به‌کلی حذف شد', !shop.includes('wdStoreHelp'));
check('shop-v2: ثابت WD_STORE_URL حذف شد', !shop.includes('WD_STORE_URL'));
check('shop-v2: هیچ اثری از کلاس‌های wd142 نماند', !shop.includes('wd142-'));
check('shop-v2: پیام «نصب / به‌روزرسانی از مایکت» حذف شد', !shop.includes('نصب / به‌روزرسانی از مایکت'));
check('shop-v2: پیام «خرید جم الان باز نشد» حذف شد', !shop.includes('خرید جم الان باز نشد'));
check('shop-v2: مسیر myket:// حذف شد', !shop.includes('myket://'));
check('shop-v2: نگاشت خطای 0:nomyket به toast صادقانه', shop.includes("'0:nomyket':'❌ اتصال به فروشگاه برقرار نشد"));
check('shop-v2: تلاش مجدد خودکار اتصال مستقیم (V146 retry)', shop.includes('WD_NOMYKET_RETRY') && shop.includes("startPurchase(String(sku))") && shop.includes('},1500)'));
check('shop-v2: مسیر 0:nomyket دیگر wdStoreHelp صدا نمی‌زند', !/if\(r==='0:nomyket'\)\{wdStoreHelp/.test(shop));

/* ---------- ۳) مورد ۱ و ۲ گزارش — بازیابی ---------- */
check('shop-v2: بدنه‌ی بازیابی به wdRestoreItems جدا شد', shop.includes('function wdRestoreItems(arr)'));
check('shop-v2: wdRestore از wdRestoreItems استفاده می‌کند', /function wdRestore\(\)\{[\s\S]*?wdRestoreItems\(JSON\.parse\(window\.WDAndroid\.ownedPurchases\(\)\|\|'\[\]'\)\)/.test(shop));
check('shop-v2: wdRestoreBoot (بازیابی خودکار در استارت) تعریف شد', shop.includes('function wdRestoreBoot()'));
check('shop-v2: سقف ۴ تلاش فاصله‌دار در استارت', shop.includes('WD_BOOT_TRIES>=4') && shop.includes('setTimeout(wdRestoreBoot,8000)'));
check('shop-v2: boot66 بازیابی استارت را زمان‌بندی می‌کند', shop.includes('setTimeout(wdRestoreBoot,6000)'));
check('shop-v2: بازیابی مسیر gem و starter سرور-مأخذ ماند', shop.includes("rpc('shop_gem_topup',{p_sku:sku,p_token:tok") && shop.includes("rpc('starter_claim',{p_provider:'myket',p_receipt:tok"));
check('shop-v2: مصرف فقط بعد از ok سرور', /if\(d&&d\.ok\)\{\s*try\{window\.WDAndroid\.consumePurchase\(tok\)\}/.test(shop));

/* ---------- جاوا (APK) — V151: ریشه‌ی اصلی بسته شد + بازیابی امضادار ---------- */
const iab = read('apk-build/app/java/com/worlddominion/game/WDIab.java');
const bridge = read('apk-build/app/java/com/worlddominion/game/WDBridge.java');
const manifest = read('apk-build/app/AndroidManifest.xml');
check('WDIab.java: منطق bind/buy/consume/ownedPurchases سر جایش', ['bindService', 'getBuyIntent', 'consumePurchase', 'getPurchases', 'queuedSku'].every((s) => iab.includes(s)));
check('WDIab.java: ownedPurchases امضای رسید را برمی‌گرداند (G1 — INAPP_DATA_SIGNATURE_LIST)', iab.includes('INAPP_DATA_SIGNATURE_LIST') && iab.includes('"raw"') && iab.includes('"sig"'));
check('WDBridge.java: پل WDAndroid دست‌نخورده', bridge.includes('startPurchase') && bridge.includes('billingAvailable'));
check('Manifest: مجوز پرداخت خودِ مایکت (ir.mservices.market.BILLING — ریشه‌ی «اتصال برقرار نشد» طبق مستند رسمی مایکت) + queries', manifest.includes('ir.mservices.market.BILLING') && manifest.includes('ir.mservices.market"'));

/* ---------- نسخه (V152: نسخه-آگاه — الگوی V138، v.txt تک‌منبع؛ شماره‌ها دیگر هاردکد نیستند) ---------- */
const CUR = (vtxt || '').trim();
check('v.txt: عدد تمیز ۳رقمی', /^\d{3}$/.test(CUR), vtxt);
check('index.html: __WD_V=v.txt', html.includes('__WD_V=' + CUR) && !html.includes('__WD_V=' + (Number(CUR) - 1)));
const vcur = (html.match(new RegExp('\\?v=' + CUR, 'g')) || []).length;
check('index.html: ۱۲ × ?v=CUR (' + CUR + ')', vcur === 12, String(vcur));
check('index.html: صفر باقی‌مانده‌ی نسخه‌های کهنه', !/\?v=(14[0-9]|15[0-9])/.test(html.replace(new RegExp('\\?v=' + CUR, 'g'), '')));
check('index.html: فیکس‌های کارایی V148/V149 در ربیب دست‌نخورده', html.includes('wd-terr-') || html.includes('wd_srv_cache'));

/* ---------- V152 — سقوط امپراتوری + پرف دوم (بازگشت‌ناپذیری در ربیب‌ها) ---------- */
check('V152: ماژول سقوط (پنجره/بنر/هایلایت/چیپ 🏳️) سالم', ['wdElimShow', 'wdElimState', 'wdElimBanner', 'wdElimPulse', 'wdElimPickMode', 'wd-elim-banner', 'm-elim', 'هیچ کشوری نداری'].every((s) => html.includes(s)));
check('V152: سیم‌کشی syncTerr (پنجره‌ی سقوط + wdElimState)', html.includes('wdElimShow({cap:oc') && html.includes('try{wdElimState()}catch(e){}'));
check('V152: claimCapital دوباره‌مسلح + چیپ درجا', html.includes('wdElimState();renderSrvChip()'));
check('V152: تلاش دومِ سینک بعد از مدعای پایتخت (نرخ syncBusy)', html.includes('setTimeout(function(){try{if(!window.__wdRel)syncTerr()}catch(e){}},2500)'));
check('V152 پرف: .own بدون blur روی موبایل + پرچم بدون transition', /@media \(hover:none\),\(pointer:coarse\)/.test(html) && html.includes('.own{backdrop-filter:none!important') && /\.flag\{transition:none!important\}/.test(html));
check('V152 پرف: سیو دوره‌ای حین ژست ممنوع', html.includes('!document.hidden&&!window.__wdMapBusy)saveNow()'));
check('V152 پرف: arm() نرخ ۱۲۰۰ms', html.includes('now-_aAt<1200'));

/* ---------- سینتکس ---------- */
try { execSync('node --check public/game/shop-v2.js', { cwd: ROOT, stdio: 'pipe' }); check('shop-v2.js: node --check', true); }
catch (e) { check('shop-v2.js: node --check', false, String(e.stderr || e.message).slice(0, 120)); }

console.log('V146-STATIC: ' + ok + ' ok, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
