# Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: بررسی بازی World Dominion (upload/index.html)، آنلاین‌سازی با دیتابیس، رفع باگ، ارتقای جذابیت/نقشه/کارایی/انیمیشن دکمه‌ها

Work Log:
- بازی 5166 خطی بررسی شد: نقشه Leaflet، ارتش ۱۰ یگانه، اقتصاد، PvP، چت، رتبه‌بندی، فروشگاه جم، درخت تکنولوژی، سیستم روزانه
- Next.js 16 scaffold راه‌اندازی شد (fullstack-dev skill)
- Leaflet 1.9.4 + countries.geo.json در public/cdn/ دانلود شد
- Prisma schema کامل طراحی شد: users, sessions, saves, scores, server_stats, territories, admin_grants, world_chat, world_news, wallets, weekly_claims
- API routes ساخته شد:
  - /api/auth/{signup,login,logout,session} (سازگار با supabase-js auth)
  - /api/db/[table] — REST سازگار با Supabase (select/insert/update/delete + eq/in/order/limit/single/maybeSingle + hooks: recompute score، server_stats، sanitize چت، rate-limit)
  - /api/rpc/[fn] — تمام ۱۲ RPC بازی: get_wallet, spend_gems, is_admin, claim_admin_grants, claim_weekly_rewards, release_inactive_territories, pvp_attack, pvp_capture_territory, get_world_news, get_world_chat, wd_init_player, wd_get_state
  - /api/rt/[ch] (+ /sse) — Realtime hub درون-حافظه‌ای با SSE + polling fallback برای نبردهای زنده PvP
- شیم سازگار Supabase در public/cdn/npm/@supabase/supabase-js@2/dist/umd/supabase.js نوشته شد (بازی بدون تغییر منطق به سرور خودمان وصل می‌شود)
- باگ‌های شیم/بک‌اند حین تست E2E پیدا و رفع شد:
  1. maybeSingle باید آبجکت برگرداند نه آرایه (سبب لغو همه حملات و خرابی restore سیو بود)
  2. state باید JSONB-semantics داشته باشد (waterfall: object→JSON string→object) — قبلاً "[object Object]" ذخیره می‌شد
- باگ‌های بازی رفع شد: چت auto-refresh (open→active)، محو کشورهای کوچک در simplify، flagUrl، SW 404 (sw.js واقعی ساخته شد)، متن‌های SQL قدیمی، race condition رنگ‌آمیزی قلمرو بعد از ریلود (paint loop)، W.map.getContainer
- رفع لگ: updateUI به uiText diff-based + renderUnits/renderLobbyInfra کش HTML (بخشی از قبل بود، مکمل شد)
- نقشه: اقیانوس گرادیانی + وینیت + گراتیکول + هاور درخشان + حلقه انتخاب + لیبل فارسی همه کشورها (دیکشنری ۱۷۰+ نام) + پالت جدید baseStyle
- دکمه‌ها: ریپل + press + hover-glow + پاپ شمارنده منابع + نبض مالیات/کمک + badge ناوبار + انیمیشن مودال‌ها
- جذابیت: سیستم لقب/رتبه روی HUD (۸ مرحله)، تاج 👑 نفر اول، ۴۰ جم خوش‌آمد + ۲۰ جم روزانه، شمار بازیکنان آنلاین، toastهای پاداش
- استقرار Render: prisma/schema.postgres.prisma + scripts/prisma-setup.mjs (انتخاب خودکار SQLite/Postgres از روی DATABASE_URL) + build/start scripts + .env.example + README.md کامل فارسی
- تست E2E با agent-browser: ثبت‌نام → انتخاب پایتخت → مالیات → حمله (تاکتیک → نبرد → تصرف ۱۰٪) → رتبه‌بندی با تاج → چت دوطرفه → فروشگاه جم (خرید ۱۵۰۰ طلا با ۱۵ جم) → ریلود و بازیابی کامل سیو → صفر خطای کنسول

Stage Summary:
- بازی کاملاً آنلاین شد با سرور/دیتابیس اختصاصی بدون Supabase
- فایل اصلی بازی: public/game/index.html (served at /game/index.html، root redirect به آن)
- اسکرین‌شات‌ها در download/ (register, rank, shop, map views)
- آماده استقرار: push به GitHub → Render Web Service (+ اختیاری Render Postgres) طبق README.md

---
Task ID: 2
Agent: Super Z (main)
Task: آماده‌سازی پروژه برای GitHub (پاک‌سازی ریپو + بسته ZIP)

Work Log:
- فایل .env که قبلاً track شده بود از git حذف شد (نکته امنیتی)
- .gitignore به‌روز شد: db/, download/, upload/, tool-results/, .zscripts/, examples/, mini-services/, tests/, Caddyfile, worklog.md, bun.lock
- اسکریپت‌های کمکی push-to-github.bat (ویندوز) و push-to-github.sh ساخته شدند
- README.md قدم ۱ با میان‌بر اسکریپت‌ها و هشدار .env به‌روز شد
- commit پاک‌سازی انجام شد (۹۰ فایل، صفر فایل اضافی)
- بسته world-dominion.zip با git archive ساخته شد (۳۵۶KB) = دقیقاً همان فایل‌هایی که به GitHub می‌روند

Stage Summary:
- ریپو آماده push است: git remote add origin + git push
- ZIP آماده دانلود: download/world-dominion.zip (شامل بازی کامل، پرisma، README، اسکریپت‌های push)

---
Task ID: 3
Agent: Super Z (main)
Task: Push پروژه به GitHub کاربر (Imzayan/world-dominion7) با توکن موقت

Work Log:
- مخزن کاربر بررسی شد: فقط ۱۴ فایل قدیمی (نسخه Supabase) داشت
- اسکریپت‌های push با آدرس واقعی مخزن + force push به‌روز شدند
- کاربر fine-grained PAT ساخت و ارسال کرد
- توکن تأیید شد (push: true) و force push انجام شد: f999df6 → a120e1b
- با API گیت‌هاب تأیید شد: ۹۰ فایل، شامل game/index.html، هر دو اسکیمای prisma، ۹ route سرور، اسکریپت‌های کمکی

Stage Summary:
- مخزن https://github.com/Imzayan/world-dominion7 کامل و به‌روز است (branch: main)
- کاربر باید توکن را حذف کند
- گام بعدی: ساخت PostgreSQL + Web Service روی Render طبق README

---
Task ID: 4
Agent: Super Z (main)
Task: دیباگ 502 روی Render و فیکس crash سرور

Work Log:
- سایت زنده 502 می‌داد با اینکه لاگ Render «Your service is live» بود
- build محلی تست شد: سالم (exit 0، همه روت‌ها)
- سرور standalone محلی تست شد: سالم (game 200، session 200، redirect 307)
- crash بازسازی شد: Render متغیر HOSTNAME کانتینر را ست می‌کند و Next standalone آن را به‌عنوان bind address می‌گیرد → getaddrinfo ENOTFOUND → crash
- فیکس: HOSTNAME=0.0.0.0 در اسکریپت‌های start و render-start در package.json
- فیکس تست شد: با HOSTNAME غلط هم سرور بالا می‌ماند
- commit 1ae5b88 با توکن هنوز معتبر push شد (Render auto-deploy)

Stage Summary:
- منتظر deploy خودکار Render؛ بعدش سایت باید زنده شود
- یادآوری حذف توکن به کاربر

---
Task ID: 5
Agent: Super Z (main)
Task: V22 — آپدیت بزرگ بازی طبق درخواست کاربر (اینترو، سینمای جنگ، هشور مالکیت، پنل ادمین v2، آیکون‌ها، دریای آبی، منو، لگ)

Work Log:
- اینترو: کشف شد سه اسکریپت قدیمی اسپلش را در ۳۲۰-۷۰۰ms می‌بستند و استایل V13 آن را به «تخم‌مرغ ثابت» تبدیل کرده بود؛ همه بازنشسته شدند → کره زمین چرخان + حروف staggered + نوار پیشرفت سینک (۳.۳۵ ثانیه، لمس=رد)
- سینمای جنگ: وینیت قرمز + لرزش نقشه + بنر «حمله آغاز شد» + طبل WebAudio + موج انفجار روی کشور هدف + تم قرمز مودال نبرد (MutationObserver)
- هشور مالکیت: هر بازیکن الگوی dash/رنگ مخصوص (hash نام) + هاله؛ امپراتوری خودی خط طلایی متحرک؛ لیبل نام مالک
- باگ بحرانی حل شد: پولیگون‌های هشور کانواس دوم می‌ساختند که روی کانواس کشورها بود و همه کلیک‌های نقشه را می‌بلعید → renderer مشترک با لایه کشورها
- باگ let/const: دسترسی‌های window.X به نام مستقیم تغییر کرد (OTH، layersByName، map، myCountryName، ACC، sb و...)
- ادمین v2: دو RPC جدید (admin_list_players + admin_set_gems) + پنل کامل (آمار کلی، جستجو، دارایی همه بازیکنان، هدیه طلا/نفت/غذا/جم)
- آیکون‌ها: SVG گرادیانی برای ناوبار/منو؛ رتبه‌بندی: سکو + مدال + نقطه رنگی + قرص امتیاز
- منوی ☰ جدید: راهنما، تنظیمات/کارایی، سرورها، خلاصه فرماندهی، رتبه‌بندی، خروج، ادمین — هوک روی wd7-btn (دکمه واقعی) + wd5
- دریا: آبی روشن + پالت خشکی متناسب؛ برچسب کشورها برای پس‌زمینه روشن تنظیم شد
- لگ: sizeFlags با rAF، گلو با opacity به‌جای box-shadow، autodetect دستگاه ضعیف + HeadlessChrome، toggle کارایی در تنظیمات، skip کاروان‌ها در حالت کارایی
- تست E2E با مرورگر: ثبت‌نام ادمین → پایتخت مصر → کلیک کشورها (بعد از فیکس renderer) → دکترین → سینمای جنگ ثبت شد
- نکته: سرور dev سندباکس (پورت ۳۰۰۰) خراب بود؛ تست روی standalone پورت ۳۱۰۰

Stage Summary:
- commit 8a80fd5 به GitHub push شد → Render auto-deploy
- ZIP به‌روز شد: download/world-dominion.zip
- توکن هنوز معتبر — کاربر باید بعد از تأیید دیپلوی حذفش کند

---
Task ID: 5
Agent: Super Z (main)
Task: آپدیت V25 بازی بر اساس بازخورد کاربر: رفع لگ انیمیشن اول، رفع عدم واکنش کلیک کشورها، حذف آیکون زیرساخت بالا-راست، ری‌دیزای UI با الهام از اسکرین‌شات‌های GeoWar + امضای شخصی

Work Log:
- 4 اسکرین‌شات GeoWar (ir.geowar.app) تحلیل شد: کارت‌های سرمه‌ای گرد، فونت فارسی، اعداد فارسی، نوار رنگی زیر آمار، پادیوم رنکینگ، دکمه‌های بزرگ رنگی
- باگ بحرانی کشف شد: public/cdn/leaflet/leaflet.min.css وجود نداشت و dev-server روی فایل مفقود hang می‌کرد → پارسر برای همیشه بلاک، بازی هرگز بالا نمی‌آمد (ریشه اصلی «لگ/فریز» تجربه‌شده). CSS دانلود و commit شد
- باگ کلیک: مارکرهای سایت زیرساخت interactive بودند و تپ کشورها را می‌بلعیدند → interactive:false در هر دو نقطه ساخت مارکر (خطوط ~2148 و ~2712) + CSS pointer-events:none روی .site-wrap
- ضد-تپ-مرده: watchdog هر 1.5s اگر battleBusy=true ولی مودال نبرد بسته بود، بعد از 3.5s قفل را آزاد می‌کند؛ wrapper نهایی onCountryClick هنگام busy به‌جای سکوت toast «نبرد در جریان است» نشان می‌دهد؛ pvp_attack RPC با timeout 25s wrap شد
- حذف آیکون‌های زیرساخت بالا-راست: بلوک ساخت #wd-infra-chip (V22) و چیپ 🏗️ hud-strip (V3) حذف شدند — زیرساخت از کشوی کشور، لابی و منوی ☰ در دسترس است
- اسپلش: تایم‌لاین 3.35s→2.3s، حالت fast با sessionStorage (0.85s، بدون انیمیشن حروف)، عنوان w2 طلایی (امضا)، کلاس .fast انیمیشن‌ها را می‌بندد
- اسکین «wd-geo-skin» append شد: دریای آبی روشن (#2e83ba + گرادیان #5cbcec)، کارت‌های گرد GeoWar، نوار رنگی زیر هر stat-box کشوی کشور (آبی/قرمز/طلایی/فیروزه‌ای/سبز/بنفش)، دکمه‌های بزرگ گرادیانی، مودال‌های گرد، تب فعال با گرادیان طلایی-فیروزه‌ای (امضا)، آیکون‌های سایت 22→30px با پس‌زمینه سفید، لیبل کشورها سفید با استروک تیره، حذف sweep/scan/oceanWave پرهزینه
- اسکریپت «wd-geo-js» append شد: اعداد فارسی (sweep 1.2s روی ~17 سلکتور + فوری برای کشوی کشور)، منوی ☰ کاملاً جدید (wd-menu): پروفایل با آواتار گرادیانی، قلمروهای من (پرش روی نقشه+بازکردن کشو)، رتبه‌بندی، فروشگاه جم، چت جهانی، زیرساخت‌ها، لابی، آرسنال، مشاور، تنظیمات (کارایی/صدا/برچسب با SET مشترک wd22)، خروج، پنل مدیریت (شرطی isAdmin) — bind بعد از هوک‌های قبلی (3.6s و 5.3s)
- تست کامل agent-browser: لود کامل صفحه (readyState complete)، ورود مهمان، کلیک ترکیه→کشو باز شد، claim پایتخت، کلیک عراق→دکمه حمله، منوی ☰ با هدر «مهمان • ۱ قلمرو • ۴۰ جم» (اعداد فارسی)، قلمروهای من (ترکیه/پایتخت)، رنکینگ با اعداد فارسی، اسپلش full و fast — بدون هیچ خطای کنسول
- commit 5b612a4 push شد به github.com/Imzayan/world-dominion7 (main) — Render auto-deploy خواهد شد
- download/world-dominion.zip بازسازی شد (386KB)

Stage Summary:
- ریشه اصلی «لگ» = فایل CSS مفقود لیفلت بود (بازی پشت پارسر بلاک‌شده فریز می‌کرد) + مارکرهای interactive
- همه ۴ خواسته کاربر انجام شد: لگ انیمیشن اول، واکنش کلیک کشورها، حذف آیکون زیرساخت بالا-راست، استایل GeoWar با امضای طلایی-فیروزه‌ای WD
- نکته برای آینده: توکن GitHub هنوز معتبر است (کاربر حذف نکرده)؛ remote origin با token در URL تنظیم است

---
Task ID: 6
Agent: Super Z (main)
Task: تأیید نهایی دیپلوی زنده Render پس از فیکس 502 (کاربر URL سایت را فرستاد)

Work Log:
- curl: root 200 (با redirect)، /game/index.html 200، /api/auth/session 200 → مشکل 502 کاملاً حل شد (فیکس HOSTNAME=0.0.0.0 کار کرد)
- نسخه دیپلوی‌شده بایت‌به‌بایت با commit 5b612a4 (V25) مطابقت دارد (460712 بایت، wd-geo-skin/wd-geo-js حضور دارند)
- تست E2E با مرورر هدلس روی سایت زنده: ورود مهمان ✓، کلیک ترکیه → کشو باز شد («آماده انتخاب به‌عنوان پایتخت») ✓، انتخاب پایتخت ✓، کلیک عراق → دکمه «فرمان حمله» + زیرساخت‌های واقعی ✓، منوی ☰ جدید باز شد (پروفایل مهمان + ۴۰ جم با اعداد فارسی) ✓
- بدون خطای کنسول؛ اقیانوس آبی روشن (#2e83ba)؛ چیپ زیرساخت بالا-راست غایب (infraChip:false)؛ ۱۸۰ لایه کشور لود شد
- اسکرین‌شات‌های تست در scripts/ (live-1 تا live-4)

Stage Summary:
- سایت زنده https://world-dominionnrg.onrender.com/ سالم و کامل با همه آپدیت‌های V25 در حال سرویس است
- هیچ تغییر کدی لازم نبود؛ فقط تأیید
- یادآوری: کاربر باید توکن GitHub را حذف کند (هنوز در remote URL است)
