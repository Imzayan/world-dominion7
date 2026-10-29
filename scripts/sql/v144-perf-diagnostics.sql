-- ============================================================
-- V144-PERF-R2 — ابزار عیب‌یابی دیتابیس (فقط-خواندنی؛ اجرای تکراری بی‌خطر)
-- نحوه اجرا: psql "$DATABASE_URL" -f v144-perf-diagnostics.sql
-- یا در pgAdmin/TablePlus پنل Render، هر بخش جداگانه.
-- هیچ دستور نوشتن در این فایل نیست؛ فقط تشخیص.
-- ============================================================

-- ---------- بخش ۱: آیا تریگرهای قدیمی (دوران Supabase) هنوز روی این دیتابیس هستند؟ ----------
-- کاربر فهرست wd_saves_guard / wd_saves_sync / zz_wd_anticheat / zz_wd_rank_from_save را داده؛
-- در معماری فعلی (Prisma + بک‌اند خودِ سایت) معادل‌ها در کد اپلیکیشن هستند، نه در دیتابیس.
-- اگر این کوئری تریگر برگرداند، یعنی بار دوباره‌ای روی هر سیو هست که باید ببینیم.
SELECT tgrelid::regclass AS table_name,
       tgname,
       CASE tgenabled WHEN 'O' THEN 'فعال' ELSE 'غیرفعال (' || tgenabled || ')' END AS status
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY 1, 2;

-- ---------- بخش ۲: آیا ایندکس تازه‌ی رتبه‌بندی اعمال شده؟ ----------
-- بعد از دیپلوی V144 باید idx_scores_server_score و idx_scores_server_server دیده شوند
-- (اسکریپت build، prisma db push را اجرا می‌کند؛ این فقط صحت‌سنجی است).
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('scores', 'saves', 'territories', 'sessions')
ORDER BY tablename, indexname;

-- ---------- بخش ۳ (اختیاری): سنگین‌ترین کوئری‌های واقعی ----------
-- نیازمند اکستنشن pg_stat_statements (روی Render قابل فعال‌سازی است).
-- اگر خطا داد، همین بخش را حذف کن — بقیه مستقل‌اند.
SELECT calls,
       round(total_exec_time::numeric, 0)          AS total_ms,
       round(mean_exec_time::numeric, 2)           AS mean_ms,
       rows,
       left(query, 140)                            AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 15;

-- ---------- بخش ۴: حجم جداول و ردیف‌ها (سیگنال بادکردن جدول) ----------
SELECT relname                                                   AS table_name,
       n_live_tup                                                AS rows,
       pg_size_pretty(pg_total_relation_size(relid))             AS total_size
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 15;

-- ---------- بخش ۵: اتصال‌های باز (سقف پلن) ----------
SELECT state, count(*) AS connections
FROM pg_stat_activity
GROUP BY state
ORDER BY 2 DESC;

-- ============================================================
-- پیوست: معادل دستیِ ایندکس V144 (اگر خواستی بدون دیپلوی، دستی اعمال کنی)
-- idempotent است — اجرای تکراری خطا نمی‌دهد. با دیپلوی عادی نیازی به آن نیست.
--
-- CREATE INDEX IF NOT EXISTS idx_scores_server_score ON scores (server, score DESC);
-- CREATE INDEX IF NOT EXISTS idx_scores_server ON scores (server);
-- ============================================================
