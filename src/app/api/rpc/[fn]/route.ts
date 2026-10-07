import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { safeErr } from '@/lib/apierr' /* V116: متن خام Prisma هرگز به کلاینت نمی‌رود */
import { computeScore, hasRecalc, SIM_V2_ED, type Telemetry, type TelemEvent } from '@/lib/olyScore'
import {
  skillOf, consistencyOf, potentialOf, evalAchievements, achDef, bullseyesFromTelemetry,
  attrsFromProfiles,
  /* V90 §34-36: رده‌بندی المپیکی */
  OLY_TIERS, tierIndex, tierOf, perfRatingOf, ratingPerfStep, ratingDuelStep, overallRatingOf,
  RD_START, RD_MIN, RD_MAX,
  type RecentScore,
} from '@/lib/olyProfile'
import { cvGenerateLayout, cvEnrich, cvCountryExists, type CvProvince } from '@/lib/cvGeo'
import { OL_REWARDS, SPECIAL_OPS, MENTOR_REWARDS, OL_PARTICIPATION_GEMS, OL_PODIUM_REWARDS, PVP_ATTACK } from '@/lib/balance' /* V72: توازن سرور متمرکز (PHASE 4) — V75: + PVP_ATTACK */
import { WAR_ITEMS, STARTER_PACK, WAR_RESIST_WINDOW_MS, WAR_RESIST_STEPS, PROTECTION_MIN_AGE_MS } from '@/lib/balance' /* V108: تدارک جنگی + زرادخانه تاکتیکی + پک شروع */
import {
  cvDef, cvCost, cvTimeSec, cvProdPerMin, cvCatalogPublic, cvTechMults,
  CV_TECH, CV_MAX_LEVEL, CV_OFFLINE_CAP_MS, CV_FOCUS, type CvTechLine, type CvFocus,
  cvFocusMap, cvFocusMult,
} from '@/lib/cvCatalog'

export const dynamic = 'force-dynamic'

/* ============================================================
   Supabase-compatible RPC endpoint.
   Implements every sb.rpc(...) call the game makes:
   get_wallet, spend_gems, is_admin, claim_admin_grants,
   claim_weekly_rewards, release_inactive_territories,
   pvp_attack, pvp_capture_territory, territory_sync (V60sec), get_world_news,
   get_world_chat, wd_init_player, wd_get_state, olympics (V31)
   ============================================================ */

/* V66: قیمت‌های legacy GEM_COSTS/EMST_COSTS در SHOP_ITEMS ادغام شدند (تک‌منبع قیمت).
   EMST_COSTS فقط برای سازگاری نام emst_* در shopBuy نگه داشته شده است. */
const EMST_COSTS: Record<string, number> = {
  gold: 25, fire: 30, ice: 30, galaxy: 35, dragon: 40,
  royal: 35, shadow: 30, neon: 45, phoenix: 35, orbit: 50,
}
const WEEKLY_REWARDS: Record<number, number> = { 1: 5000, 2: 2500, 3: 1000 }
const WEEKLY_CATEGORIES = ['score', 'kills', 'economy', 'recruits'] as const

/* ============================================================
   V66 — SHOP V2: کاتالوگ واحد سمت سرور (تک‌منبع قیمت/نوع/کمیابی)
   - همه‌ی شناسه‌های قدیمی حفظ شده‌اند (spend_gems قدیمی بدون تغییر کار می‌کند)
   - kind: consumable(اثر سمت کلاینت طبق الگوی موجود) | cosmetic(گرنت انبار)
           service(انقضا) | mystery(قرعه‌ی سرور) | bundle | limited(پنجره‌ی زمانی)
   - هیچ قیمتی از کلاینت پذیرفته نمی‌شود؛ فقط p_item.
   ============================================================ */
type ShopKind = 'consumable' | 'cosmetic' | 'service' | 'mystery' | 'bundle' | 'limited' | 'stock'
type ShopItemDef = {
  id: string; fa: string; d: string; icon: string
  price: number; kind: ShopKind; cat: string; rar: string
  days?: number
  serverEffect?: 'boost'
  window?: { from: number; to: number }
  expands?: 'season'
  grants?: string[]
  slot?: string
  hidden?: boolean
  qty?: number /* V108: برای kind:'stock' — مقدار افزوده به انبار در هر خرید */
}
const RAR_FA: Record<string, string> = { common: 'معمولی', uncommon: 'غیرمعمولی', rare: 'کمیاب', epic: 'حماسی', legendary: 'افسانه‌ای', mythic: 'اسطوره‌ای' }
const SHOP_ITEMS: ShopItemDef[] = [
  /* منابع و بوست (مصرفی — الگوی v3) */
  { id: 'boost', fa: 'دو برابر شدن درآمدها (۱ ساعت)', d: 'همه‌ی درآمدها ۶۰ دقیقه دو برابر.', icon: '⚡', price: 20, kind: 'consumable', cat: 'resource', rar: 'common', serverEffect: 'boost' },
  { id: 'gold', fa: '۱۵۰۰ طلا فوری', d: 'خزانه‌ی امپراتوری پر می‌شود.', icon: '💰', price: 15, kind: 'consumable', cat: 'resource', rar: 'common' },
  { id: 'oil', fa: '۱۰۰۰ نفت فوری', d: 'موتور جنگ روشن می‌ماند.', icon: '🛢️', price: 15, kind: 'consumable', cat: 'resource', rar: 'common' },
  { id: 'peace', fa: 'لغو تحریم‌ها', d: 'تحریم برداشته می‌شود و تنش جهانی کم می‌شود.', icon: '🕊️', price: 12, kind: 'consumable', cat: 'resource', rar: 'common' },
  { id: 'tax', fa: 'آماده شدن فوری مالیات', d: 'کول‌داون مالیات صفر می‌شود.', icon: '⏩', price: 6, kind: 'consumable', cat: 'resource', rar: 'common' },
  /* Imperial Identity */
  { id: 'col_pack', fa: 'رنگ اختصاصی امپراتوری', d: 'رنگ قلمروهایت را خودت انتخاب کن.', icon: '🎨', price: 25, kind: 'cosmetic', cat: 'identity', rar: 'epic', slot: 'hue' },
  { id: 'emblem', fa: 'نشان اختصاصی', d: 'نماد اختصاصی کنار نامت روی نقشه و رتبه‌بندی.', icon: '🏳️', price: 20, kind: 'cosmetic', cat: 'identity', rar: 'rare', slot: 'emblem' },
  { id: 'title', fa: 'لقب اختصاصی', d: 'امپراتور، فاتح، سایه… کنار اسمت می‌درخشد.', icon: '👑', price: 25, kind: 'cosmetic', cat: 'identity', rar: 'rare', slot: 'title' },
  { id: 'emp_nameplate', fa: 'پلاک نام سلطنتی', d: 'نامت در چیپ حساب و رتبه‌بندی با قاب طلایی نمایش داده می‌شود.', icon: '🏷️', price: 18, kind: 'cosmetic', cat: 'identity', rar: 'uncommon', slot: 'nameplate' },
  { id: 'emp_power_badge', fa: 'نشان قدرت', d: 'نشان ستاره‌ی قدرت کنار نام امپراتوریت.', icon: '🌟', price: 15, kind: 'cosmetic', cat: 'identity', rar: 'uncommon', slot: 'power_badge' },
  /* Battle Cosmetics — صفر قدرت جنگی، فقط نمایش */
  { id: 'fx_conq', fa: 'افکت فتح اختصاصی', d: 'هر فتح با انیمیشن مخصوص خودت پخش می‌شود.', icon: '🎆', price: 20, kind: 'cosmetic', cat: 'battle', rar: 'rare', slot: 'fx' },
  { id: 'fx_storm', fa: 'افکت فتح: طوفان', d: 'طوفان فیروزه‌ای روی سرزمین تازه‌فتح.', icon: '🌀', price: 22, kind: 'cosmetic', cat: 'battle', rar: 'rare', slot: 'fx' },
  { id: 'fx_comet', fa: 'افکت فتح: شهاب', d: 'شهاب بنفش با رد نور.', icon: '☄️', price: 22, kind: 'cosmetic', cat: 'battle', rar: 'rare', slot: 'fx' },
  { id: 'war_badge', fa: 'نشان جنگ', d: 'نشان ⚔️ کنار نامت — امضای جنگاور بودن.', icon: '⚔️', price: 12, kind: 'cosmetic', cat: 'battle', rar: 'uncommon', slot: 'war_badge' },
  { id: 'battle_frame', fa: 'قاب پروفایل جنگی', d: 'قاب سرخ‌وطلایی دور نامت در رتبه‌بندی.', icon: '🛡️', price: 35, kind: 'cosmetic', cat: 'battle', rar: 'epic', slot: 'frame' },
  /* Map Cosmetics — کلاس‌محور، تک‌فعال، بدون دست‌کاری قانون کانونیک دریا */
  { id: 'border_glow', fa: 'مرز درخشان متحرک', d: 'مرز قلمروهایت هاله‌ی طلایی می‌گیرد.', icon: '✨', price: 30, kind: 'cosmetic', cat: 'map', rar: 'epic', slot: 'border_glow' },
  { id: 'map_ocean_azure', fa: 'تم اقیانوس: لاجورد', d: 'دریای روشن لاجوردی — فقط برای نقشه‌ی خودت.', icon: '🌊', price: 28, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'map_ocean_midnight', fa: 'تم اقیانوس: نیمه‌شب', d: 'دریای عمیق نیمه‌شبی برای فرماندهان شب‌کار.', icon: '🌙', price: 32, kind: 'cosmetic', cat: 'map', rar: 'epic', slot: 'map_theme' },
  { id: 'map_ocean_jade', fa: 'تم اقیانوس: یشم', d: 'دریای سبز یشمی — امضای امپراتوری شرق.', icon: '💚', price: 28, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'empire_highlight', fa: 'برجسته‌سازی امپراتوری', d: 'پایتختت با نشان ✦ و هاله‌ی ویژه متمایز می‌شود.', icon: '💠', price: 24, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'empire_highlight' },
  /* Capital Customization */
  { id: 'cap_aura_gold', fa: 'هاله‌ی پایتخت: طلا', d: 'پرچم پایتختت هاله‌ی طلایی ثابت می‌گیرد.', icon: '🟡', price: 26, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_aura' },
  { id: 'cap_aura_ice', fa: 'هاله‌ی پایتخت: یخ', d: 'هاله‌ی یخیِ سرد و آرام دور پرچم پایتخت.', icon: '🔵', price: 26, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_aura' },
  { id: 'cap_aura_flame', fa: 'هاله‌ی پایتخت: شعله', d: 'هاله‌ی آتشین برای پایتخت جنگاورها.', icon: '🔴', price: 26, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_aura' },
  { id: 'cap_monument', fa: 'بنای یادبود', d: 'بنای 🏛 کنار پرچم پایتختت.', icon: '🏛️', price: 20, kind: 'cosmetic', cat: 'capital', rar: 'uncommon', slot: 'cap_monument' },
  { id: 'cap_nameplate', fa: 'پلاک پایتخت', d: 'نام پایتختت روی پلاک شیشه‌ای نمایش داده می‌شود.', icon: '🪧', price: 16, kind: 'cosmetic', cat: 'capital', rar: 'uncommon', slot: 'cap_nameplate' },
  { id: 'cap_theme_royal', fa: 'تم سلطنتی پایتخت', d: 'هاله‌ی طلا + پلاک + بنای یادبود — بسته‌ی کامل سلطنتی.', icon: '🏰', price: 40, kind: 'cosmetic', cat: 'capital', rar: 'legendary', slot: 'cap_theme' },
  /* زینتی‌های سینمایی (V43) */
  { id: 'anthem', fa: 'سرود اختصاصی امپراتوری', d: 'ملودی ورود و فتح — سه ملودی قابل انتخاب.', icon: '🎺', price: 35, kind: 'cosmetic', cat: 'cinematic', rar: 'epic', slot: 'anthem' },
  { id: 'frame', fa: 'قاب پروفایل پویا', d: 'حلقه‌ی نورانی چرخان دور نامت در رتبه‌بندی.', icon: '🖼️', price: 30, kind: 'cosmetic', cat: 'cinematic', rar: 'legendary', slot: 'frame' },
  { id: 'entrance', fa: 'صحنه‌ی ورود سینمایی', d: 'پرچمت با شعار اختصاصی سینمایی وارد می‌شود.', icon: '🎬', price: 25, kind: 'cosmetic', cat: 'cinematic', rar: 'epic', slot: 'entrance' },
  { id: 'announce', fa: 'صدای اعلام‌کننده', d: 'گوینده هر فتح را اعلام می‌کند.', icon: '🔊', price: 22, kind: 'cosmetic', cat: 'cinematic', rar: 'rare', slot: 'announce' },
  /* VIP — راحتی و ظاهر، صفر قدرت جنگی */
  { id: 'vip7', fa: 'VIP هفتگی', d: '۷ روز: نشان 👑 + جم روزانه‌ی سرور + قاب VIP + فروشگاه VIP.', icon: '📅', price: 45, kind: 'service', cat: 'vip', rar: 'epic', days: 7, slot: 'vip' },
  { id: 'vip30', fa: 'VIP ماهانه', d: '۳۰ روز با تخفیف: همه‌ی مزایای VIP + نشان ویژه‌ی ماهانه.', icon: '👑', price: 150, kind: 'service', cat: 'vip', rar: 'legendary', days: 30, slot: 'vip' },
  { id: 'radar', fa: 'رادار حمله (۷ روز)', d: 'حمله‌ها به قلمروت را اول از همه می‌فهمی.', icon: '🔔', price: 30, kind: 'service', cat: 'vip', rar: 'rare', days: 7, slot: 'radar' },
  { id: 'stats', fa: 'آمار و تحلیل پیشرفته', d: 'نمودار روند امتیاز، قلمرو و طلا. دائمی.', icon: '📊', price: 15, kind: 'service', cat: 'vip', rar: 'common', slot: 'stats' },
  /* Limited — پنجره‌ی زمانی سمت سرور اعتبارسنجی می‌شود */
  { id: 'medal_s1', fa: 'مدال فصل', d: 'آیتم کمیاب فصلی — بعد از پایان فصل دیگر گیر نمی‌آید؛ برای همیشه در موزه.', icon: '🏆', price: 40, kind: 'limited', cat: 'limited', rar: 'mythic', expands: 'season' },
  { id: 'lim_persian_1404', fa: 'مدال یادبود گشایش ۱۴۰۴', d: 'نسخه‌ی محدود جشن یک‌سالگی جهانِ سلطنت — فقط تا پایان مهر ۱۴۰۴.', icon: '🎖️', price: 55, kind: 'limited', cat: 'limited', rar: 'mythic', window: { from: Date.UTC(2026, 8, 20), to: Date.UTC(2026, 9, 21) } },
  /* Mystery — قرعه فقط سمت سرور، شفاف */
  { id: 'lucky', fa: 'باکس شانسی روزانه', d: 'قرعه سمت سرور: جم یا آیتم کازمتیک. ۳ بار در روز.', icon: '🎁', price: 10, kind: 'mystery', cat: 'mystery', rar: 'common' },
  { id: 'mystery_premium', fa: 'صندوق گنج پیشرفته', d: 'شانس بسیار بهتر برای کمیاب‌ها و افسانه‌ای‌ها. قرعه فقط سمت سرور.', icon: '🧰', price: 48, kind: 'mystery', cat: 'mystery', rar: 'legendary' },
  /* Bundle */
  { id: 'bundle_cos', fa: 'پک کامل امپراتور', d: 'رنگ + نشان + لقب + مرز درخشان + افکت فتح — به‌جای ۱۲۰، فقط ۱۰۰ جم.', icon: '📦', price: 100, kind: 'bundle', cat: 'identity', rar: 'legendary', grants: ['col_pack', 'emblem', 'title', 'border_glow', 'fx_conq'] },
  /* پاداش تکمیل مجموعه (فقط از مسیر claim — هرگز در فروشگاه نمایش داده نمی‌شود) */
  { id: 'col_war_reward', fa: 'لقب «جنگاور افسانه‌ای»', d: 'پاداش تکمیل مجموعه‌ی جنگ.', icon: '⚔️', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'title', hidden: true },
  { id: 'col_imperial_reward', fa: 'نشان ویژه ‌⚜️ امپراتوری', d: 'پاداش تکمیل مجموعه‌ی امپراتوری.', icon: '⚜️', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'emblem', hidden: true },
  { id: 'col_royal_reward', fa: 'لقب «حامی تاج‌وتخت»', d: 'پاداش تکمیل مجموعه‌ی سلطنتی.', icon: '💎', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'title', hidden: true },
  { id: 'col_map_reward', fa: 'نشان ویژه 🧭 نقشه', d: 'پاداش تکمیل مجموعه‌ی نقشه.', icon: '🧭', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'emblem', hidden: true },
  { id: 'col_season_reward', fa: 'نشان ویژه 🏅 فصل', d: 'پاداش تکمیل مجموعه‌ی فصل.', icon: '🏅', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'emblem', hidden: true },
  { id: 'col_event_reward', fa: 'نشان ویژه 🎪 ایونت', d: 'پاداش تکمیل مجموعه‌ی ایونت.', icon: '🎪', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'emblem', hidden: true },
  { id: 'col_limited_reward', fa: 'لقب «نگهبان گنج نادر»', d: 'پاداش تکمیل مجموعه‌ی محدود.', icon: '🔥', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'mythic', slot: 'title', hidden: true },
]
/* emst_* — نشان‌های ویژه V50 به کاتالوگ واحد اضافه می‌شوند (قیمت: EMST_COSTS) */
for (const [emstId, emstCost] of Object.entries(EMST_COSTS)) {
  const emstRar: Record<string, string> = { gold: 'rare', fire: 'rare', ice: 'rare', galaxy: 'epic', dragon: 'epic', royal: 'epic', shadow: 'rare', neon: 'legendary', phoenix: 'epic', orbit: 'legendary' }
  SHOP_ITEMS.push({ id: 'emst_' + emstId, fa: 'طرح نشان: ' + emstId, d: 'طرح ویژه‌ی نشان روی نقشه، رتبه‌بندی و پروفایل.', icon: '💠', price: emstCost, kind: 'cosmetic', cat: 'identity', rar: emstRar[emstId] || 'rare', slot: 'emst' })
}
const SHOP_ITEM_MAP = new Map(SHOP_ITEMS.map((x) => [x.id, x]))

/* ============================================================
   V88 — SHOP V3 + WAR DEPTH (افزودنی — سیستم V66 دست‌نخورده)
   ساختار ۱۲ بخشی امپراتوری: identity/capital/map/war/landmark/
   vault/vip/limited/pass/trophies/cosmetic + packs
   قانون: هر آیتم حداقل یکی از IDENTITY/STATUS/COLLECTION/
   EXPERIENCE/CONVENIENCE/STRATEGIC CHOICE — هیچ آیتم بی‌خاصیتی نیست.
   هیچ آیتم جنگی instant-win نیست؛ همه ≤ چند درصد با سقف سخت سرور.
   ============================================================ */
const V88_ITEMS: ShopItemDef[] = [
  /* ---- 1) EMPIRE IDENTITY — پرچم‌ها و عناوین جنگی (در منو/نمای کشور/گزارش نبرد دیده می‌شوند) ---- */
  { id: 'banner_war', fa: 'پرچم جنگ', d: 'پرچم ⚔ امپراتوری در منو و نمای کشورت اهتزاز دارد.', icon: '🏴', price: 24, kind: 'cosmetic', cat: 'identity', rar: 'uncommon', slot: 'banner' },
  { id: 'banner_victory', fa: 'پرچم پیروزی', d: 'پرچم 🎌 طلایی پیروزی — امضای فاتح‌ها.', icon: '🎌', price: 26, kind: 'cosmetic', cat: 'identity', rar: 'rare', slot: 'banner' },
  { id: 'banner_defeat', fa: 'پرچم پایداری', d: 'پرچم 🏁 پایداری در شکست — افتخار مدافعان.', icon: '🏁', price: 24, kind: 'cosmetic', cat: 'identity', rar: 'uncommon', slot: 'banner' },
  { id: 'wt_legion', fa: 'لقب «آهنین»', d: 'لقب جنگی کنار نامت در رتبه‌بندی و گزارش نبرد.', icon: '⚔️', price: 30, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'title' },
  { id: 'wt_shadow', fa: 'لقب «سایه‌ی جنگ»', d: 'لقب ویژه‌ی فرماندهان شب‌کار.', icon: '🌑', price: 30, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'title' },
  /* ---- 2) CAPITAL SKINS ×12 — تغییر واقعی ظاهر پایتخت روی نقشه + نمای کشور ---- */
  { id: 'csk_imperial', fa: 'پایتخت امپراتوری', d: 'شکوه طلایی با هاله‌ی امپراتوری دور پرچم پایتخت.', icon: '🏛️', price: 50, kind: 'cosmetic', cat: 'capital', rar: 'epic', slot: 'cap_skin' },
  { id: 'csk_royal', fa: 'پایتخت سلطنتی', d: 'ظرف بنفش سلطنتی + نشان تاج.', icon: '👑', price: 45, kind: 'cosmetic', cat: 'capital', rar: 'epic', slot: 'cap_skin' },
  { id: 'csk_cyber', fa: 'پایتخت سایبری', d: 'نئون فیروزه‌ای با خطوط داده.', icon: '🤖', price: 45, kind: 'cosmetic', cat: 'capital', rar: 'epic', slot: 'cap_skin' },
  { id: 'csk_desert', fa: 'پایتخت کویری', d: 'کهربای گرم شن‌های طلایی.', icon: '🏜️', price: 40, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_skin' },
  { id: 'csk_arctic', fa: 'پایتخت قطبی', d: 'یخ‌بلور سرد و آرام.', icon: '❄️', price: 40, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_skin' },
  { id: 'csk_industrial', fa: 'پایتخت صنعتی', d: 'فولاد و دودکش — قلب کارخانه‌ها.', icon: '🏭', price: 40, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_skin' },
  { id: 'csk_golden', fa: 'پایتخت طلایی', d: 'تمام‌طلایی — گران‌ترین شکوه فروشگاه.', icon: '🟡', price: 70, kind: 'cosmetic', cat: 'capital', rar: 'legendary', slot: 'cap_skin' },
  { id: 'csk_military', fa: 'پایتخت نظامی', d: 'خاکی نظامی با نشان ستاره.', icon: '🎖️', price: 42, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_skin' },
  { id: 'csk_olympic', fa: 'پایتخت المپیکی', d: 'حلقه‌های پنج‌گانه دور پرچم پایتخت.', icon: '🥇', price: 42, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_skin' },
  { id: 'csk_neon', fa: 'پایتخت نئون', d: 'نور صورتی سایبری برای شب‌های بی‌خوابی.', icon: '💜', price: 48, kind: 'cosmetic', cat: 'capital', rar: 'epic', slot: 'cap_skin' },
  { id: 'csk_ancient', fa: 'پایتخت باستان', d: 'سنگ‌نگاره و ستون‌های هزارساله.', icon: '🏺', price: 42, kind: 'cosmetic', cat: 'capital', rar: 'rare', slot: 'cap_skin' },
  { id: 'csk_future', fa: 'پایتخت آینده', d: 'هاله‌ی هولوگرام نسل بعد.', icon: '🛸', price: 55, kind: 'cosmetic', cat: 'capital', rar: 'legendary', slot: 'cap_skin' },
  /* ---- 3) MAP THEMES ×10 — اتمسفر کامل نقشه (CSS-محور، سبک، فقط برای خودت) ---- */
  { id: 'map_global_night', fa: 'تم: شب جهانی', d: 'شب همیشگی با چراغ شهرها.', icon: '🌃', price: 38, kind: 'cosmetic', cat: 'map', rar: 'epic', slot: 'map_theme' },
  { id: 'map_satellite', fa: 'تم: ماهواره‌ای', d: 'دید ماهواره‌ای خنثی و دقیق.', icon: '🛰️', price: 36, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'map_coldwar', fa: 'تم: جنگ سرد', d: 'خاکستر و مه آیرونی قرن بیستم.', icon: '🌫️', price: 34, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'map_frozen', fa: 'تم: جهان یخ‌زده', d: 'همه‌جا قطب است.', icon: '🧊', price: 34, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'map_desert', fa: 'تم: جهان کویر', d: 'ریگ‌زار بی‌پایان زیر آفتاب.', icon: '🏜️', price: 34, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'map_golden', fa: 'تم: عصر طلایی', d: 'تاریخ‌نگاری زرین امپراتوری‌ها.', icon: '🖼️', price: 38, kind: 'cosmetic', cat: 'map', rar: 'epic', slot: 'map_theme' },
  { id: 'map_neon', fa: 'تم: نئون‌ورلد', d: 'مرزهای نئونی شب‌های سایبری.', icon: '🌆', price: 38, kind: 'cosmetic', cat: 'map', rar: 'epic', slot: 'map_theme' },
  { id: 'map_atlas', fa: 'تم: اطلس کلاسیک', d: 'کاغذ قدیمی اطلس‌های چاپی.', icon: '📜', price: 32, kind: 'cosmetic', cat: 'map', rar: 'uncommon', slot: 'map_theme' },
  { id: 'map_storm', fa: 'تم: جهان طوفان', d: 'آسمان طوفانی و دریای خشمگین.', icon: '⛈️', price: 36, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  { id: 'map_industrial', fa: 'تم: عصر صنعتی', d: 'ذغال و بخار، زادگاه کارخانه‌ها.', icon: '⚙️', price: 34, kind: 'cosmetic', cat: 'map', rar: 'rare', slot: 'map_theme' },
  /* ---- 4) WAR COSMETICS — ۶ لژیون + نشان/افکت/پرتره/انیمیشن (صفر قدرت جنگی) ---- */
  { id: 'wfr_iron', fa: 'قاب آهنین (IRON LEGION)', d: 'قاب فولادی گزارش نبرد و کشو حمله.', icon: '🛡️', price: 35, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'wframe' },
  { id: 'wfr_thunder', fa: 'قاب رعد (THUNDER COMMAND)', d: 'قاب آذرخش برای فرماندهان تندباد.', icon: '⚡', price: 45, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'wframe' },
  { id: 'wfr_redstorm', fa: 'قاب طوفان سرخ (RED STORM)', d: 'قاب سرخ آتشین.', icon: '🔥', price: 42, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'wframe' },
  { id: 'wfr_phoenix', fa: 'قاب ققنوس (PHOENIX GUARD)', d: 'قاب پر‌زدودن ققنوس — از خاکستر برمی‌خیزیم.', icon: '🦅', price: 48, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'wframe' },
  { id: 'wfr_night', fa: 'قاب ناوگان شب (NIGHT FLEET)', d: 'قاب سرمه‌ای ناوگان شب.', icon: '🌙', price: 42, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'wframe' },
  { id: 'wfr_steel', fa: 'قاب فولاد (STEEL EMPIRE)', d: 'قاب مینیمال فولادی.', icon: '⚙️', price: 38, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'wframe' },
  { id: 'we_iron', fa: 'نشان جنگی آهنین', d: 'نشان لژیون کنار نامت در منو و گزارش نبرد.', icon: '🔱', price: 18, kind: 'cosmetic', cat: 'war', rar: 'uncommon', slot: 'war_emblem' },
  { id: 'we_thunder', fa: 'نشان جنگی رعد', d: 'نشان آذرخش کنار نامت.', icon: '🌩️', price: 20, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'war_emblem' },
  { id: 'vs_gold', fa: 'صفحه‌ی پیروزی: طلا', d: 'جشن سینمایی طلایی بعد از هر پیروزی.', icon: '🏆', price: 28, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'victory_fx' },
  { id: 'vs_thunder', fa: 'صفحه‌ی پیروزی: رعد', d: 'آذرخش پیروزی روی صفحه.', icon: '⚡', price: 30, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'victory_fx' },
  { id: 'cp_iron', fa: 'پرتره: ژنرال آهنین', d: 'پرتره‌ی فرمانده +۳٪ دفاع در کارت فرمانده.', icon: '🎖️', price: 22, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'cmd_portrait' },
  { id: 'cp_sky', fa: 'پرتره: فرمانده آسمان', d: 'پرتره‌ی خلبان عملیات هوایی.', icon: '✈️', price: 22, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'cmd_portrait' },
  { id: 'cp_admiral', fa: 'پرتره: دریاسالار', d: 'پرتره‌ی ناوگان دریایی.', icon: '⚓', price: 22, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'cmd_portrait' },
  { id: 'at_slash', fa: 'انیمیشن حمله: ضربه‌ی شمشیر', d: 'جرقه‌ی ضربه هنگام اعلام حمله.', icon: '🗡️', price: 20, kind: 'cosmetic', cat: 'war', rar: 'uncommon', slot: 'atk_anim' },
  { id: 'df_shield', fa: 'انیمیشن دفاع: سپر نور', d: 'هاله‌ی سپر هنگام دفاع.', icon: '💠', price: 20, kind: 'cosmetic', cat: 'war', rar: 'uncommon', slot: 'def_anim' },
  /* ---- 5) WAR UTILITY (جم) — اطلاعات/تسهیلات/گزینه‌ی استراتژیک؛ صفر برد آنی، همه سمت سرور ---- */
  { id: 'intel_l1', fa: 'گزارش اطلاعاتی (Scout)', d: 'برای همیشه: سطح ۲ اطلاعات — ارتش + دفاع + اقتصاد با دقت بهتر.', icon: '📡', price: 100, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'intel' },
  { id: 'intel_l2', fa: 'شناسایی پیشرفته (Advanced Recon)', d: 'برای همیشه: سطح ۳ — + استحکامات/آمادگی/نفت هدف.', icon: '🛰️', price: 250, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'intel' },
  { id: 'wo_emsupply', fa: 'سفارش: تدارک اضطراری', d: 'قابل خرید برای همیشه — هر بار: +۴۰ تدارک (۶ساعت کول‌داون، هزینه‌ی غذا/نفت).', icon: '🚑', price: 300, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'order' },
  { id: 'wo_reserve', fa: 'سفارش: ذخیره‌ی استراتژیک', d: 'قابل خرید برای همیشه — حمله‌ی بعدی +۱۲٪ قدرت (۲۴ساعت کول‌داون، مصرف یک‌بار).', icon: '⚡', price: 400, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'order' },
  { id: 'wo_convoy', fa: 'سفارش: کاروان تدارکات', d: 'قابل خرید برای همیشه — ۳۰دقیقه تلفات −۷٪.', icon: '🚚', price: 250, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'order' },
  { id: 'wo_airrecon', fa: 'سفارش: شناسایی هوایی', d: 'قابل خرید برای همیشه — ۱۲ساعت سطح اطلاعات +۱.', icon: '✈️', price: 200, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'order' },
  { id: 'wo_blockade', fa: 'سفارش: محاصره‌ی دریایی', d: 'قابل خرید برای همیشه — ۱۲ساعت دفاع هدف در نبرد بعدی −۵٪.', icon: '🚢', price: 400, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'order' },
  { id: 'wo_edefense', fa: 'سفارش: دفاع اضطراری', d: 'قابل خرید برای همیشه — ۳۰دقیقه دفاع +۱۵٪ (خودکار هنگام حمله).', icon: '🛡️', price: 300, kind: 'cosmetic', cat: 'war', rar: 'epic', slot: 'order' },
  { id: 'wo_mobilize', fa: 'سفارش: بسیج سریع', d: 'قابل خرید برای همیشه — ۲۰دقیقه قدرت +۸٪.', icon: '📣', price: 200, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'order' },
  { id: 'wo_reconsweep', fa: 'سفارش: جاروی اطلاعاتی', d: 'قابل خرید برای همیشه — یک گزارش کامل سطح ۴ فوری.', icon: '🔍', price: 150, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'order' },
  { id: 'wo_ewar', fa: 'سفارش: جنگ الکترونیک', d: 'قابل خرید برای همیشه — ۱۲ساعت ضداطلاعات: گزارش دشمن بی‌دقت + خرابکاری خنثی.', icon: '📻', price: 200, kind: 'cosmetic', cat: 'war', rar: 'rare', slot: 'order' },
  { id: 'cmd_training', fa: 'توکن آموزش فرمانده', d: 'فعال‌سازی = +۹۰۰ XP به فرمانده فعال امپراتوری.', icon: '🎓', price: 350, kind: 'consumable', cat: 'war', rar: 'epic' },
  { id: 'tactical_slot', fa: 'اسلات تاکتیکی دوم', d: 'برای همیشه: نمایش و شلیک همزمان دو سفارش تاکتیکی — ظرفیت فرماندهی.', icon: '🎚️', price: 600, kind: 'cosmetic', cat: 'war', rar: 'legendary', slot: 'tslot' },
  { id: 'war_prep_pack', fa: 'پک آماده‌سازی جنگ', d: 'بسته‌ی کامل ورود به جنگ: تدارک اضطراری + بسیج سریع + پرچم جنگ + قاب آهنین — به‌جای ۵۵۹، فقط ۵۰۰.', icon: '🎒', price: 500, kind: 'bundle', cat: 'war', rar: 'epic', grants: ['wo_emsupply', 'wo_mobilize', 'banner_war', 'wfr_iron'] },
  /* ---- 6) WAR PACKS — بسته‌های واقعی (ارزش > قیمت) ---- */
  { id: 'war_starter', fa: '⚔️ پک شروع جنگ', d: 'تدارک اضطراری + جاروی اطلاعاتی + پرچم جنگ + قاب آهنین — ارزش ۵۶۳، فقط ۵۰۰.', icon: '⚔️', price: 500, kind: 'bundle', cat: 'war', rar: 'epic', grants: ['wo_emsupply', 'wo_reconsweep', 'banner_war', 'wfr_iron'] },
  { id: 'war_commander', fa: '🔥 پک فرمانده', d: 'پرتره ژنرال آهنین + صفحه پیروزی طلا + لقب آهنین + ذخیره استراتژیک — ارزش ۱۰۸۰، فقط ۱۰۰۰.', icon: '🎖️', price: 1000, kind: 'bundle', cat: 'war', rar: 'legendary', grants: ['cp_iron', 'vs_gold', 'wt_legion', 'wo_reserve'] },
  { id: 'war_defender', fa: '🛡️ پک مدافع', d: 'دفاع اضطراری + کاروان + جنگ الکترونیک + نشان آهنین + سپر نور — ارزش ۸۰۸، فقط ۸۰۰.', icon: '🛡️', price: 800, kind: 'bundle', cat: 'war', rar: 'epic', grants: ['wo_edefense', 'wo_convoy', 'wo_ewar', 'we_iron', 'df_shield'] },
  { id: 'war_imperial', fa: '👑 صندوق جنگی امپراتوری', d: 'اسلات تاکتیکی + محاصره دریایی + شناسایی پیشرفته + قاب رعد + پیروزی رعد + لقب سایه — ارزش ۱۵۵۳، فقط ۱۵۰۰.', icon: '👑', price: 1500, kind: 'bundle', cat: 'war', rar: 'legendary', grants: ['tactical_slot', 'wo_blockade', 'intel_l2', 'wfr_thunder', 'vs_thunder', 'wt_shadow'] },
  /* ---- 7) LANDMARKS ×12 — بنای ماندگار کشور شما (نمای کشور + پروفایل + مجموعه) ---- */
  { id: 'lm_monument', fa: 'بنای جهانی', d: 'بنای یادبود جهانی کنار پایتختت — ماندگار در تاریخ کشور.', icon: '🗽', price: 40, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_palace', fa: 'کاخ امپراتوری', d: 'کاخ باشکوه اقامتگاه فرمانروایی.', icon: '🏯', price: 45, kind: 'cosmetic', cat: 'landmark', rar: 'epic', slot: 'landmark' },
  { id: 'lm_victory', fa: 'بنای پیروزی', d: 'طاق نصرت برای فاتحان.', icon: '🏛️', price: 42, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_space', fa: 'مرکز فضایی', d: 'سکوی پرتاب — آینده از اینجا شروع می‌شود.', icon: '🚀', price: 48, kind: 'cosmetic', cat: 'landmark', rar: 'epic', slot: 'landmark' },
  { id: 'lm_stadium', fa: 'ورزشگاه بزرگ', d: 'ورزشگاه ملی صد‌هزارنفری.', icon: '🏟️', price: 42, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_trade', fa: 'مرکز تجارت جهانی', d: 'برج‌های دوقلوی تجارت.', icon: '🏢', price: 44, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_command', fa: 'قرارگاه فرماندهی', d: 'مرکز عملیات نظامی کشور.', icon: '🪖', price: 44, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_olympic', fa: 'ورزشگاه المپیک', d: 'میخانه‌ی افتخار المپیکی کشورت.', icon: '🥇', price: 46, kind: 'cosmetic', cat: 'landmark', rar: 'epic', slot: 'landmark' },
  { id: 'lm_energy', fa: 'برج انرژی', d: 'برج تولید توان بی‌پایان.', icon: '⚡', price: 42, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_peace', fa: 'بنای صلح', d: 'کبوتر صلح بر فراز کشور.', icon: '🕊️', price: 40, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_factory', fa: 'مگا کارخانه', d: 'غول صنعتی تولید ملی.', icon: '🏭', price: 42, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  { id: 'lm_museum', fa: 'موزه‌ی ملی', d: 'نگهبان تاریخ و گنج‌هایت.', icon: '🖼️', price: 40, kind: 'cosmetic', cat: 'landmark', rar: 'rare', slot: 'landmark' },
  /* ---- 8) LIMITED واقعی — پنجره‌ی سمت سرور، بعدش فقط موزه ---- */
  { id: 'lim_war_banner', fa: 'پرچم جنگی ویژه (محدود)', d: 'پرچم حماسی ۷۲ساعته — بعد از پایان فقط در موزه.', icon: '🚩', price: 699, kind: 'limited', cat: 'limited', rar: 'legendary', slot: 'banner', window: { from: Date.UTC(2026, 8, 28), to: Date.UTC(2026, 9, 1) } },
  { id: 'lim_leg_capital', fa: 'پایتخت افسانه‌ای (محدود)', d: 'اسکین اسطوره‌ای پایتخت — فقط ۷ روز.', icon: '🏰', price: 1499, kind: 'limited', cat: 'limited', rar: 'legendary', slot: 'cap_skin', window: { from: Date.UTC(2026, 8, 28), to: Date.UTC(2026, 9, 5) } },
  { id: 'lm_mythic_monument', fa: 'بنای اسطوره‌ای (محدود)', d: 'نادرترین بنای فروشگاه — ۷۲ ساعت.', icon: '🗿', price: 1999, kind: 'limited', cat: 'limited', rar: 'mythic', slot: 'landmark', window: { from: Date.UTC(2026, 8, 28), to: Date.UTC(2026, 9, 1) } },
  /* ---- 9) خزانه‌ی امپراتوری — صندوق سوم (آیتم + استخر قرعه) ---- */
  { id: 'vault_mythic', fa: 'خزانه‌ی امپراتوری', d: 'قرعه سمت سرور با ۵ سطح کمیابی شفاف — جم یا آیتم‌های کمیاب تا افسانه‌ای. همه‌ی آیتم‌ها مسیر خرید مستقیم هم دارند.', icon: '🏛️', price: 120, kind: 'mystery', cat: 'mystery', rar: 'legendary' },
]
SHOP_ITEMS.push(...V88_ITEMS)
/* refresh the map with the new ids (const rebinding is not allowed → mutate in place) */
V88_ITEMS.forEach((x) => SHOP_ITEM_MAP.set(x.id, x))
/* پاداش‌های مجموعه‌های V88 (hidden — فقط از مسیر claim) */
const V88_REWARDS: ShopItemDef[] = [
  { id: 'col_thunder_reward', fa: 'لقب «فرمانده رعد»', d: 'پاداش تکمیل مجموعه‌ی رعد.', icon: '⚡', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'title', hidden: true },
  { id: 'col_warlord_reward', fa: 'نشان ⚜ استراتژیست', d: 'پاداش تکمیل مجموعه‌ی استراتژیست جنگ.', icon: '⚜️', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'emblem', hidden: true },
  { id: 'col_landmark_reward', fa: 'لقب «شهرساز»', d: 'پاداش تکمیل مجموعه‌ی بناها.', icon: '🗿', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'title', hidden: true },
  { id: 'col_capital_reward', fa: 'نشان 🏛 معمار پایتخت‌ها', d: 'پاداش تکمیل مجموعه‌ی پایتخت‌ها.', icon: '🏛️', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'legendary', slot: 'emblem', hidden: true },
  { id: 'col_vault_reward', fa: 'لقب «افسانه‌ی خزانه»', d: 'پاداش تکمیل مجموعه‌ی خزانه.', icon: '💎', price: 0, kind: 'cosmetic', cat: 'reward', rar: 'mythic', slot: 'title', hidden: true },
]
SHOP_ITEMS.push(...V88_REWARDS)
V88_REWARDS.forEach((x) => SHOP_ITEM_MAP.set(x.id, x))

/* ============================================================
   V108 — WAR ITEMS V1: تدارک جنگی + زرادخانه تاکتیکی (kind:'stock')
   مصرفیِ شمارشی — انبار در WarState.data.stock (سمت سرور).
   قیمت/اثر/مدت/کول‌داون از balance.ts (تک‌منبع) — این‌جا فقط def فروشگاه.
   + کازمتیک‌های انحصاری پک شروع (hidden — فقط از مسیر starter_claim).
   ============================================================ */
const WAR_STOCK_ITEMS: ShopItemDef[] = Object.entries(WAR_ITEMS).map(([id, w]) => ({
  id,
  fa: w.fa,
  d: w.d,
  icon: w.ic,
  price: w.price,
  kind: 'stock' as ShopKind,
  cat: 'war',
  rar: id === 'war_supply' ? 'rare' : id === 'tactical_precision' ? 'epic' : id === 'tactical_defbreak' ? 'epic' : 'rare',
  qty: w.add,
}))
SHOP_ITEMS.push(...WAR_STOCK_ITEMS)
WAR_STOCK_ITEMS.forEach((x) => SHOP_ITEM_MAP.set(x.id, x))

const STARTER_COSMETICS: ShopItemDef[] = STARTER_PACK.grants.map((g) => ({
  id: g.id,
  fa: g.fa,
  d: 'انحصاری پک شروع امپراتور — از هیچ مسیر دیگری دریافت نمی‌شود.',
  icon: g.ic,
  price: 0,
  kind: 'cosmetic' as ShopKind,
  cat: 'reward',
  rar: 'legendary',
  slot: g.slot,
  hidden: true,
}))
SHOP_ITEMS.push(...STARTER_COSMETICS)
STARTER_COSMETICS.forEach((x) => SHOP_ITEM_MAP.set(x.id, x))

/* افزودن/کسر شمارشی انبار WarState با قفل خوش‌بینانه (string-guard روی raw JSON).
   موفق = true؛ تلاش مجدد در برخورد هم‌زمان (دو دستگاه/دبل‌تپ) با خواندن تازه. */
async function warStockAdjust(userId: string, id: string, delta: number, cap = 999): Promise<{ ok: boolean; now: number }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await warStateRow(userId)
    const raw = row.data
    const data = warParse(raw)
    const stock = { ...(data.stock || {}) }
    const next = Math.max(0, Math.min(cap, (stock[id] || 0) + delta))
    stock[id] = next
    data.stock = stock
    const upd = await db.warState.updateMany({ where: { userId, data: raw }, data: { data: JSON.stringify(data) } })
    if (upd.count === 1) return { ok: true, now: next }
  }
  return { ok: false, now: 0 }
}

/* ============================================================
   V88 — WAR DEPTH: پیکربندی جنگ (تک‌منبع سرور)
   ============================================================ */
type AtkTypeDef = { fa: string; d: string; atk: number; loss: number; supply: number; gold: number; oil: number; defPen?: number; defDown?: number; selfDefFx?: number; blockTarget?: boolean }
const ATK_TYPES: Record<string, AtkTypeDef> = {
  balanced: { fa: '⚖️ متعادل', d: 'بدون بونوس/جریمه — مصرف تدارک پایه', atk: 1, loss: 1, supply: 5, gold: 0, oil: 0 },
  blitz: { fa: '⚡ برق‌آسا', d: '+۱۰٪ قدرت، +۸٪ تلفات — تدارک بیشتر', atk: 1.10, loss: 1.08, supply: 8, gold: 0, oil: 0 },
  siege: { fa: '🏰 محاصره', d: 'نصف اثر استحکامات دفاعی هدف، +۱۰٪ تلفات — پرهزینه', atk: 1.06, loss: 1.10, supply: 12, gold: 200, oil: 0, defPen: 0.5 },
  defensive: { fa: '🛡️ تدافعی', d: '−۱۰٪ قدرت حمله؛ اما ۶ساعت دفاع +۲۵٪ برای خودت', atk: 0.90, loss: 0.95, supply: 2, gold: 0, oil: 0, selfDefFx: 6 * 3600_000 },
  naval: { fa: '⚓ یورش دریایی', d: '+۸٪ قدرت — ۱۵۰ نفت + ۳۰۰ طلا؛ ۱۲ساعت دفاع هدف −۵٪', atk: 1.08, loss: 1, supply: 10, gold: 300, oil: 150, blockTarget: true },
  air: { fa: '✈️ حمله‌ی هوایی', d: '+۱۲٪ قدرت، +۱۵٪ تلفات — ۱۲۰ نفت؛ ۶ساعت اطلاعات +۱', atk: 1.12, loss: 1.15, supply: 9, gold: 0, oil: 120, selfDefFx: 0 },
  economic: { fa: '💰 فشار اقتصادی', d: 'قدرت عادی — ۵۰۰ طلا؛ دفاع هدف همین نبرد −۸٪', atk: 1, loss: 1, supply: 4, gold: 500, oil: 0, defDown: 0.08 },
}
type OrderDef = { fa: string; ic: string; cd: number; gold: number; oil: number; food: number; fx?: string; dur?: number; supply?: number; instant?: string; target?: boolean }
const WAR_ORDERS: Record<string, OrderDef> = {
  emsupply: { fa: 'تدارک اضطراری', ic: '🚑', cd: 6 * 3600_000, gold: 0, oil: 500, food: 2000, supply: 40 },
  reserve: { fa: 'ذخیره‌ی استراتژیک', ic: '⚡', cd: 24 * 3600_000, gold: 3000, oil: 0, food: 0, fx: 'reserve', dur: 24 * 3600_000 },
  convoy: { fa: 'کاروان تدارکات', ic: '🚚', cd: 12 * 3600_000, gold: 0, oil: 0, food: 3000, fx: 'convoy', dur: 30 * 60_000 },
  mobilize: { fa: 'بسیج سریع', ic: '📣', cd: 8 * 3600_000, gold: 2000, oil: 0, food: 1000, fx: 'mobilize', dur: 20 * 60_000 },
  edefense: { fa: 'دفاع اضطراری', ic: '🛡️', cd: 8 * 3600_000, gold: 2500, oil: 0, food: 1500, fx: 'edef', dur: 30 * 60_000 },
  airrecon: { fa: 'شناسایی هوایی', ic: '✈️', cd: 12 * 3600_000, gold: 0, oil: 400, food: 0, fx: 'airrecon', dur: 12 * 3600_000 },
  reconsweep: { fa: 'جاروی اطلاعاتی', ic: '🔍', cd: 12 * 3600_000, gold: 0, oil: 300, food: 0, instant: 'intel4' },
  ewar: { fa: 'جنگ الکترونیک', ic: '📻', cd: 24 * 3600_000, gold: 1500, oil: 0, food: 0, fx: 'ewar', dur: 12 * 3600_000 },
  blockade: { fa: 'محاصره‌ی دریایی', ic: '🚢', cd: 48 * 3600_000, gold: 2000, oil: 600, food: 0, target: true },
  sabotage: { fa: 'مأموریت خرابکاری', ic: '💣', cd: 48 * 3600_000, gold: 1500, oil: 500, food: 0, target: true },
}
const WAR_INTEL_FA = ['پایه (عمومی)', 'سطح ۱ — ارتش تقریبی', 'سطح ۲ — + دفاع و اقتصاد', 'سطح ۳ — + استحکامات و آمادگی', 'سطح ۴ — اطلاعات کامل']
/* سقف سخت توازن: جمع بونوس جم‌محور V88 روی حمله هرگز بیش از +۲۲٪ نیست (ضد P2W) */
const WAR_MAX_ADD = 0.22
const SUPPLY_REGEN_MS = 6 * 60_000 /* +۱ تدارک هر ۶ دقیقه */
const SUPPLY_MAX = 100

type WarFx = { k: string; until: number; data?: Record<string, unknown> }
type WarData = { supply?: number; supplyAt?: number; cd?: Record<string, number>; fx?: WarFx[]; blk?: Record<string, number>; atkt?: string; stock?: Record<string, number>; res?: Record<string, { n: number; until: number }> }

function warStateRow(userId: string) {
  return db.warState.upsert({ where: { userId }, update: {}, create: { userId } })
}
function warParse(raw: string): WarData {
  try { return (JSON.parse(raw) || {}) as WarData } catch { return {} }
}
/* بازیابی تنبل تدارک — بدون تایمر؛ در هر خواندن محاسبه و ذخیره می‌شود.
   V108: حین افکت EMP فعال، بازیابی تدارک متوقف می‌شود (زیرساخت مختل) —
   زمانِ توقف نه برگردانده می‌شود نه جبران؛ بازیابی از پایان EMP ادامه می‌یابد. */
async function warStateOf(userId: string): Promise<{ data: WarData; row: { data: string } }> {
  const row = await warStateRow(userId)
  const data = warParse(row.data)
  const now = Date.now()
  const empUntil = ((data.fx || []).find((f) => f.k === 'emp') || {}).until || 0
  const last = data.supplyAt || 0
  let supply = typeof data.supply === 'number' ? data.supply : SUPPLY_MAX
  if (supply < SUPPLY_MAX && last) {
    const effFrom = empUntil > last ? empUntil : last
    const regen = Math.floor((now - effFrom) / SUPPLY_REGEN_MS)
    if (regen > 0) supply = Math.min(SUPPLY_MAX, supply + regen)
  }
  data.supply = supply
  data.supplyAt = now
  data.fx = (data.fx || []).filter((f) => f.until > now)
  return { data, row }
}
async function warStateSave(userId: string, data: WarData) {
  await db.warState.upsert({ where: { userId }, update: { data: JSON.stringify(data) }, create: { userId, data: JSON.stringify(data) } })
}
function warFxOf(data: WarData, now: number): Record<string, WarFx> {
  const out: Record<string, WarFx> = {}
  for (const f of data.fx || []) if (f.until > now) out[f.k] = f
  return out
}
/* سرورِ فعلی کاربر برای اخبار جنگ (از Score — همان منبع ثبت‌نام) */
async function warUserServer(userId: string): Promise<number> {
  try { const s = await db.score.findUnique({ where: { userId }, select: { server: true } }); return Math.max(1, s?.server || 1) } catch { return 1 }
}

/* ============================================================
   V113 — WAR CAREER (فتح‌نامه‌ی لشکر — war_generals / war_general_op)
   کارنامه‌ی واقعی نبرد فقط از PvP داوری‌شده‌ی سرور پر می‌شود (هوک داخل
   pvp_attack). ذخیره در GameSetting key='war105:{uid}' — همان الگوی
   تنظیمات سرور؛ بدون مهاجرت اسکیما. RPCهای همتای Supabase قبلی که با
   پروژه‌ی قدیمی از دسترس خارج شده بودند — حالا روی بک‌اند خودی.
   ============================================================ */
type WarCareer = {
  glory: number; xp: number; wins: number; losses: number
  class_xp: Record<string, number>
  unit_xp: Record<string, number>
  owned: string[]
  assigned: { atk: string | null; def: string | null }
  ab_cd: { at: number; ms: number }
}
const WAR_GENERALS: Record<string, { fa: string; lore: string; atk: number; def: number; sup: number; mor: number; cost: number; ab: { fa: string; kind: 'atk' | 'refund' | 'glory' } }> = {
  aryob:  { fa: 'آریوبرزن', lore: 'سردار دژبان — دروازه‌ی روشن را به دشمن نمی‌دهد.', atk: 3, def: 9, sup: 4, mor: 6, cost: 120, ab: { fa: 'سپر کوهستان', kind: 'atk' } },
  surena: { fa: 'سورنا', lore: 'فرمانده‌ی سواران — ضربت نخست همه‌چیز را می‌گوید.', atk: 9, def: 3, sup: 5, mor: 7, cost: 150, ab: { fa: 'تازش سواران', kind: 'atk' } },
  bartar: { fa: 'بارتار', lore: 'ناخدای دریای مواج — کاروانِ بی‌ترس، غنیمتِ برگشته.', atk: 6, def: 6, sup: 8, mor: 5, cost: 180, ab: { fa: 'کاروان بازگشت', kind: 'refund' } },
  garin:  { fa: 'گارین', lore: 'خزانه‌دار سپاه — هر لشکرکشی حساب‌کتابه دارد.', atk: 4, def: 5, sup: 10, mor: 6, cost: 220, ab: { fa: 'حساب سرداری', kind: 'refund' } },
  rostam: { fa: 'رستم', lore: 'پهلوان زابل — تیرش خطا نمی‌رود، عهدش نمی‌شکند.', atk: 10, def: 8, sup: 3, mor: 9, cost: 400, ab: { fa: 'پیکار پهلوانی', kind: 'atk' } },
  kaveh:  { fa: 'کاوه', lore: 'آهنگرِ درفش — کاویانی که برمی‌خیزد، پایین نمی‌آید.', atk: 7, def: 7, sup: 6, mor: 10, cost: 500, ab: { fa: 'درفش کاویانی', kind: 'glory' } },
}
const WAR_CLS_FA_KEYS = ['infantry', 'armor', 'arty', 'air', 'navy', 'elite']
/* دکترین حمله → کلاس تمرینی که XP می‌گیرد (طعمِ روایت — سقف واقعی سمت کلاینت نمایش داده می‌شود) */
const WAR_ATK_CLS: Record<string, string> = { blitz: 'armor', heavy: 'arty', precision: 'air', defensive: 'infantry', balanced: 'infantry' }
const warCareerKey = (uid: string) => 'war105:' + uid
const WAR_CAREER_ZERO = (): WarCareer => ({ glory: 0, xp: 0, wins: 0, losses: 0, class_xp: {}, unit_xp: {}, owned: [], assigned: { atk: null, def: null }, ab_cd: { at: 0, ms: 420000 } })
async function warCareerGet(uid: string): Promise<WarCareer> {
  try {
    const g = await db.gameSetting.findUnique({ where: { key: warCareerKey(uid) } })
    if (g) { const v = JSON.parse(g.value); if (v && typeof v === 'object') return Object.assign(WAR_CAREER_ZERO(), v) }
  } catch (e) { console.log('war105get', e) }
  return WAR_CAREER_ZERO()
}
async function warCareerSet(uid: string, c: WarCareer) {
  try {
    await db.gameSetting.upsert({ where: { key: warCareerKey(uid) }, create: { key: warCareerKey(uid), value: JSON.stringify(c) }, update: { value: JSON.stringify(c) } })
  } catch (e) { console.log('war105set', e) }
}
/* هوک کارنامه — بعد از داوری واقعی pvp_attack صدا زده می‌شود (fail-safe) */
async function warCareerPostBattle(attackerUid: string, defenderUid: string, attackerWon: boolean, atkType: string | null) {
  try {
    const a = await warCareerGet(attackerUid)
    a.xp += 15; a.glory += attackerWon ? 25 : 8
    if (attackerWon) a.wins += 1; else a.losses += 1
    const cls = WAR_ATK_CLS[atkType || 'balanced'] || 'infantry'
    a.class_xp[cls] = (a.class_xp[cls] || 0) + 15
    await warCareerSet(attackerUid, a)
    /* مدافع: دفاع موفق = پیروزی کارنامه‌ای */
    const d = await warCareerGet(defenderUid)
    if (!attackerWon) { d.xp += 8; d.glory += 10; d.wins += 1; d.class_xp['infantry'] = (d.class_xp['infantry'] || 0) + 8 }
    else { d.xp += 4; d.losses += 1 }
    await warCareerSet(defenderUid, d)
  } catch (e) { console.log('war105post', e) }
}

/* بسته‌های جم — تنها بخشی که پرداخت واقعی دارد؛ url خالی یعنی «به‌زودی» (هیچ قیمتی سمت کلاینت اعمال نمی‌شود) */
const SHOP_PACKS = [
  /* PriceSync-v4 (V115): بازسازی دو پک به درخواست مالک — پک فاتح: ۸۰۰جم=۳۰۰٬۰۰۰ تومان / پک امپراتور: ۱۵۰۰جم=۶۹۰٬۰۰۰ تومان.
     نرخ هر جم: ۴۰۰ / ۳۶۷ / ۳۷۵ / ۴۶۰ (بهترین نرخ اکنون بسته‌ی ۳۰۰ جم است). شناسه‌های SKU مایکت عمداً ثابت می‌مانند:
     gems_550 اکنون ۸۰۰جم و gems_1000 اکنون ۱۵۰۰جم تحویل می‌دهد — در پنل مایکت فقط عنوان و قیمت به‌روز شود. کاتالوگ سمت سرور تنها مرجع قیمت است؛ کلاینت فقط نمایش می‌دهد. */
  { id: 'gems_100', gems: 100, price: '۴۰٬۰۰۰ تومان', perGem: '۴۰۰', name: 'شروع', tier: '', url: '' },
  { id: 'gems_300', gems: 300, price: '۱۱۰٬۰۰۰ تومان', perGem: '۳۶۷', name: 'جنگاور', tier: '', url: '' },
  { id: 'gems_550', gems: 800, price: '۳۰۰٬۰۰۰ تومان', perGem: '۳۷۵', name: 'فاتح', tier: '', url: '' },
  { id: 'gems_1000', gems: 1500, price: '۶۹۰٬۰۰۰ تومان', perGem: '۴۶۰', name: 'امپراتور', tier: '', url: '' },
]

/* مجموعه‌ها — members فقط شناسه‌های سرور-شناخته (medal_s1* = هر مدال فصلی) */
const SHOP_COLLECTIONS: { id: string; fa: string; icon: string; members: string[]; reward: string }[] = [
  { id: 'war', fa: 'جنگ', icon: '⚔️', members: ['fx_conq', 'fx_storm', 'fx_comet', 'war_badge', 'battle_frame', 'radar'], reward: 'col_war_reward' },
  { id: 'imperial', fa: 'امپراتوری', icon: '👑', members: ['col_pack', 'emblem', 'title', 'emp_nameplate', 'emp_power_badge', 'emst_gold', 'emst_fire', 'emst_ice', 'emst_galaxy', 'emst_dragon', 'emst_royal', 'emst_shadow', 'emst_neon', 'emst_phoenix', 'emst_orbit'], reward: 'col_imperial_reward' },
  { id: 'royal', fa: 'سلطنتی', icon: '💎', members: ['vip7', 'vip30', 'frame', 'anthem', 'entrance', 'announce', 'bundle_cos'], reward: 'col_royal_reward' },
  { id: 'map', fa: 'نقشه', icon: '🗺️', members: ['border_glow', 'map_ocean_azure', 'map_ocean_midnight', 'map_ocean_jade', 'empire_highlight'], reward: 'col_map_reward' },
  { id: 'season', fa: 'فصل', icon: '🏆', members: ['medal_s1*'], reward: 'col_season_reward' },
  { id: 'event', fa: 'ایونت', icon: '🎪', members: ['lim_persian_1404'], reward: 'col_event_reward' },
  { id: 'limited', fa: 'محدود', icon: '🔥', members: ['medal_s1*', 'lim_persian_1404'], reward: 'col_limited_reward' },
]

/* استخر قرعه — شفاف: همین اعداد به کلاینت نمایش داده می‌شود؛ تاس فقط این‌جا ریخته می‌شود */
type MysteryTier = { w: number; kind: 'gems' | 'item'; min?: number; max?: number; ids?: string[]; fa: string }
const SHOP_MYSTERY: Record<string, { fa: string; tiers: MysteryTier[]; dupGems: number }> = {
  lucky: {
    fa: 'باکس شانسی روزانه',
    dupGems: 10,
    tiers: [
      { w: 45, kind: 'gems', min: 10, max: 30, fa: 'جم' },
      { w: 25, kind: 'item', ids: ['emp_nameplate', 'war_badge', 'cap_nameplate', 'cap_monument', 'emp_power_badge'], fa: 'غیرمعمولی' },
      { w: 20, kind: 'gems', min: 30, max: 60, fa: 'جم' },
      { w: 10, kind: 'item', ids: ['emblem', 'title', 'cap_aura_gold', 'map_ocean_jade'], fa: 'کمیاب' },
    ],
  },
  mystery_premium: {
    fa: 'صندوق گنج پیشرفته',
    dupGems: 45,
    tiers: [
      { w: 25, kind: 'gems', min: 60, max: 140, fa: 'جم' },
      { w: 30, kind: 'item', ids: ['fx_storm', 'fx_comet', 'cap_aura_ice', 'cap_aura_flame', 'map_ocean_azure', 'empire_highlight', 'announce'], fa: 'کمیاب' },
      { w: 25, kind: 'item', ids: ['battle_frame', 'map_ocean_midnight', 'anthem', 'entrance', 'emst_galaxy', 'emst_royal', 'emst_phoenix'], fa: 'حماسی' },
      { w: 20, kind: 'item', ids: ['frame', 'cap_theme_royal', 'emst_neon', 'emst_orbit'], fa: 'افسانه‌ای' },
    ],
  },
}

/* V88 — مجموعه‌های جدید + خزانه‌ی امپراتوری (بعد از تعریف اصلی) */
SHOP_COLLECTIONS.push(
  { id: 'thunder', fa: 'رعد', icon: '⚡', members: ['wfr_thunder', 'we_thunder', 'vs_thunder', 'banner_war', 'at_slash'], reward: 'col_thunder_reward' },
  { id: 'warlord', fa: 'استراتژیست جنگ', icon: '⚜️', members: ['wo_reserve', 'wo_blockade', 'wo_mobilize', 'wo_emsupply', 'intel_l2'], reward: 'col_warlord_reward' },
  { id: 'landmarks', fa: 'بناها', icon: '🗿', members: ['lm_monument', 'lm_palace', 'lm_victory', 'lm_space', 'lm_stadium', 'lm_trade'], reward: 'col_landmark_reward' },
  { id: 'capitals', fa: 'پایتخت‌ها', icon: '🏛️', members: ['csk_imperial', 'csk_cyber', 'csk_arctic', 'csk_golden', 'csk_neon'], reward: 'col_capital_reward' },
  { id: 'vault', fa: 'خزانه', icon: '💎', members: ['csk_golden', 'wfr_phoenix', 'wfr_night', 'lm_peace', 'lm_museum'], reward: 'col_vault_reward' },
)
/* خزانه‌ی امپراتوری — صندوق سوم با شانس شفاف + همه‌ی آیتم‌ها مسیر خرید مستقیم دارند (بدون dark pattern) */
SHOP_MYSTERY['vault_mythic'] = {
  fa: 'خزانه‌ی امپراتوری',
  dupGems: 60,
  tiers: [
    { w: 20, kind: 'gems', min: 40, max: 90, fa: 'جم' },
    { w: 30, kind: 'item', ids: ['map_golden', 'map_neon', 'wfr_steel', 'cp_sky', 'cp_admiral', 'lm_stadium', 'lm_energy'], fa: 'کمیاب' },
    { w: 28, kind: 'item', ids: ['wfr_redstorm', 'vs_thunder', 'csk_neon', 'lm_palace', 'lm_space', 'banner_victory'], fa: 'حماسی' },
    { w: 17, kind: 'item', ids: ['csk_golden', 'csk_future', 'wfr_phoenix', 'wfr_night'], fa: 'افسانه‌ای' },
    { w: 5, kind: 'item', ids: ['lm_peace', 'lm_museum'], fa: 'اسطوره‌ای' },
  ],
}

/* فصل جاری برای مدال فصلی (همان منطق تقویم کلاینت — فصل‌های ۳ ماهه) */
function shopSeasonSlug(d = new Date()): { slug: string; fa: string; to: number } {
  const m = d.getUTCMonth() + 1
  const y = d.getUTCFullYear()
  const q = Math.ceil(m / 3)
  const names = ['', 'بهار', 'تابستان', 'پاییز', 'زمستان']
  const endMonth = q * 3
  const to = Date.UTC(endMonth === 12 ? y + 1 : y, endMonth === 12 ? 0 : endMonth, 1)
  return { slug: 'season-' + y + '-' + q, fa: names[q] + ' ' + y, to }
}

/* ابزارهای فروشگاه */
async function shopOwnedRows(userId: string) {
  return db.shopInventory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
}
async function shopGrant(userId: string, itemId: string, source: string, rar: string, expiresAt: Date | null, meta: Record<string, unknown> = {}) {
  await db.shopInventory.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: { userId, itemId, source, rarity: rar, expiresAt, meta: JSON.stringify(meta) },
    update: expiresAt ? { expiresAt, meta: JSON.stringify(meta) } : {},
  })
}
function shopWindowOf(def: ShopItemDef, now: number): { ok: boolean; expandTo: string | null; to: number | null } {
  if (def.expands === 'season') {
    const s = shopSeasonSlug(new Date(now))
    return { ok: now < s.to, expandTo: def.id + '@' + s.slug, to: s.to }
  }
  if (def.window) return { ok: now >= def.window.from && now < def.window.to, expandTo: null, to: def.window.to }
  return { ok: true, expandTo: null, to: null }
}
function shopRollTier(tiers: MysteryTier[]): MysteryTier {
  const total = tiers.reduce((a, t) => a + t.w, 0)
  let r = Math.random() * total
  for (const t of tiers) { r -= t.w; if (r <= 0) return t }
  return tiers[tiers.length - 1]
}

/* موتور واحد خرید — spend_gems (قدیمی) و shop_buy (جدید) هر دو همین‌جا می‌روند.
   ترتیب: Idempotency → کاتالوگ → پنجره/موجودی → مالکیت → کسر اتمیک → گرنت → Ledger → پاسخ */
async function shopBuy(userId: string, p_item: string, requestId: string | null) {
  const rawId = String(p_item || '')
  const emstBase = rawId.startsWith('emst_') ? rawId.slice(5) : null
  const def = SHOP_ITEM_MAP.get(rawId) ?? (emstBase && EMST_COSTS[emstBase] != null
    ? SHOP_ITEM_MAP.get('emst_' + emstBase) ?? null : null)
  if (!def) return { ok: false, error: 'item' as const }
  const now = Date.now()
  const win = shopWindowOf(def, now)
  if (!win.ok) return { ok: false, error: 'expired' as const, until: win.to }
  const grantId = win.expandTo || def.id

  /* ۱) Idempotency — همان requestId = همان پاسخ، بدون کسر دوباره */
  if (requestId) {
    const prior = await db.shopPurchase.findFirst({
      where: { userId, requestId, status: 'ok' }, orderBy: { createdAt: 'desc' },
    })
    if (prior) {
      const w0 = await ensureWallet(userId)
      return { ok: true, gems: w0.gems, boost_until: w0.boostUntil ? w0.boostUntil.toISOString() : null, vip_until: w0.vipUntil ? w0.vipUntil.toISOString() : null, duplicate: true, grant: prior.itemId, item_id: prior.itemId }
    }
  }

  const price = def.price
  const kind = def.kind

  /* ۲) مالکیت — آیتم غیرمصرفیِ دارای انبار دوباره پول نمی‌گیرد */
  if (kind === 'cosmetic' || kind === 'limited' || kind === 'bundle') {
    const ids = kind === 'bundle' ? (def.grants || []) : [grantId]
    const ownedRows = await db.shopInventory.findMany({ where: { userId, itemId: { in: ids } }, select: { itemId: true } })
    const ownedSet = new Set(ownedRows.map((r) => r.itemId))
    const missing = ids.filter((x) => !ownedSet.has(x))
    if (missing.length === 0) {
      const w0 = await ensureWallet(userId)
      return { ok: true, gems: w0.gems, boost_until: w0.boostUntil ? w0.boostUntil.toISOString() : null, vip_until: w0.vipUntil ? w0.vipUntil.toISOString() : null, owned: true, grant: def.id, item_id: def.id }
    }
  }

  /* ۳) سقف روزانه‌ی باکس شانسی — سمت سرور از روی Ledger (۳ در روز) */
  if (kind === 'mystery' && def.id === 'lucky') {
    const dayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')
    const todayN = await db.shopPurchase.count({ where: { userId, itemId: 'lucky', status: 'ok', createdAt: { gte: dayStart } } })
    if (todayN >= 3) return { ok: false, error: 'limit' as const }
  }

  /* ۴) کسر اتمیک — بدون read-modify-write، بدون ریس-کانديشن، بدون جم منفی */
  let dec = { count: 0 }
  if (price > 0) {
    dec = await db.wallet.updateMany({ where: { userId, gems: { gte: price } }, data: { gems: { decrement: price } } })
    if (dec.count === 0) {
      await db.shopPurchase.create({ data: { userId, itemId: def.id, price, status: 'failed', provider: 'shop', meta: JSON.stringify({ reason: 'funds' }) } }).catch(() => {})
      return { ok: false, error: 'funds' as const }
    }
  }

  /* ۵) گرنت — هر خطا = بازگشت کامل جم (الگوی اثبات‌شده‌ی use_special) */
  try {
    let reward: Record<string, unknown> | null = null
    if (kind === 'consumable') {
      /* اثر بوست سمت سرور (الگوی قدیمی spend_gems حفظ شد) — بقیه‌ی مصرفی‌ها اثر کلاینت دارند (ذخیره‌ی بازی خودِ بازیکن) */
      if (def.serverEffect === 'boost') {
        const w2 = await ensureWallet(userId)
        const until = new Date(Math.max(now, w2.boostUntil ? w2.boostUntil.getTime() : 0) + 3600_000)
        await db.wallet.update({ where: { userId }, data: { boostUntil: until } })
      }
    } else if (kind === 'cosmetic' || kind === 'limited') {
      await shopGrant(userId, grantId, 'shop', def.rar, null, { price })
    } else if (kind === 'bundle') {
      for (const g of def.grants || []) {
        const gd = SHOP_ITEM_MAP.get(g)
        await shopGrant(userId, g, 'shop', gd ? gd.rar : 'common', null, { bundle: def.id })
      }
    } else if (kind === 'service') {
      const w2 = await ensureWallet(userId)
      if (def.id === 'vip7' || def.id === 'vip30') {
        const base = w2.vipUntil && w2.vipUntil.getTime() > now ? w2.vipUntil.getTime() : now
        const until = new Date(base + (def.days || 7) * 86400_000)
        await db.wallet.update({ where: { userId }, data: { vipUntil: until } })
        await shopGrant(userId, def.id, 'shop', def.rar, until, { days: def.days })
      } else if (def.days) {
        const inv = await db.shopInventory.findUnique({ where: { userId_itemId: { userId, itemId: def.id } } })
        const base = inv?.expiresAt && inv.expiresAt.getTime() > now ? inv.expiresAt.getTime() : now
        await shopGrant(userId, def.id, 'shop', def.rar, new Date(base + def.days * 86400_000), {})
      } else {
        await shopGrant(userId, def.id, 'shop', def.rar, null, {})
      }
    } else if (kind === 'stock') {
      /* V108 — مصرفیِ شمارشی: انبار در WarState.data.stock سمت سرور؛ اثر فقط با war_use_item */
      const wdef = WAR_ITEMS[def.id]
      const qty = wdef ? wdef.add : (def.qty || 1)
      const add = await warStockAdjust(userId, def.id, qty)
      if (!add.ok) throw new Error('stock_race')
      reward = { type: 'stock', item: def.id, fa: def.fa, count: add.now }
    } else if (kind === 'mystery') {
      const mdef = SHOP_MYSTERY[def.id]
      if (!mdef) throw new Error('mystery_def_missing')
      const tiers = mdef.tiers
      let granted = false
      for (let attempt = 0; attempt < 8 && !granted; attempt++) {
        const tier = shopRollTier(tiers)
        if (tier.kind === 'gems') {
          const amt = (tier.min || 5) + Math.floor(Math.random() * ((tier.max || 10) - (tier.min || 5) + 1))
          await db.wallet.update({ where: { userId }, data: { gems: { increment: amt } } })
          reward = { type: 'gems', amount: amt, tier: tier.fa }
          granted = true
        } else {
          const pool = (tier.ids || []).filter((x) => x)
          if (!pool.length) continue
          const pick = pool[Math.floor(Math.random() * pool.length)]
          const has = await db.shopInventory.findUnique({ where: { userId_itemId: { userId, itemId: pick } } })
          if (has) continue /* ضدتکرار — دوباره در tiers می‌چرخیم */
          const pd = SHOP_ITEM_MAP.get(pick)
          await shopGrant(userId, pick, 'mystery', pd ? pd.rar : 'rare', null, { from: def.id })
          reward = { type: 'item', item: pick, fa: pd ? pd.fa : pick, icon: pd ? pd.icon : '🎁', tier: tier.fa }
          granted = true
        }
      }
      if (!granted) {
        /* همه‌ی استخرِ آیتمی از قبل مالِ کاربر بود → جم جایگزین (پاداش ضدتکرار) */
        const amt = mdef.dupGems
        await db.wallet.update({ where: { userId }, data: { gems: { increment: amt } } })
        reward = { type: 'gems', amount: amt, tier: 'پاداش ضدتکرار' }
      }
    }

    /* ۶) Ledger موفق */
    await db.shopPurchase.create({
      data: { userId, itemId: grantId, price, status: 'ok', provider: kind === 'mystery' ? 'mystery' : 'shop', requestId, meta: JSON.stringify({ kind, reward }) },
    })
    /* V108 §21 — تله‌متری خرید (fire-and-forget) */
    {
      const srv = await warUserServer(userId).catch(() => 1)
      void telem('shop_item_purchased', userId, srv, def.id, { price, kind })
      if (def.id === 'war_supply') void telem('war_supply_purchased', userId, srv, def.id, { price })
      if (def.id.indexOf('tactical_') === 0) void telem('tactical_item_purchased', userId, srv, def.id, { price })
    }
    /* V88 — اخبار جهانی برای خریدهای اسطوره‌ای (ضد اسپم: فقط mythic) */
    if (def.rar === 'mythic') {
      try {
        const bu = await db.user.findUnique({ where: { id: userId }, select: { nick: true } })
        await addNews(await warUserServer(userId), 'shop_mythic', null, bu?.nick || '—', def.fa)
      } catch (e) { console.log('mythicnews', e) }
    }
    const nw = await ensureWallet(userId)
    return {
      ok: true, gems: nw.gems,
      boost_until: nw.boostUntil ? nw.boostUntil.toISOString() : null,
      vip_until: nw.vipUntil ? nw.vipUntil.toISOString() : null,
      grant: kind === 'mystery' ? null : grantId,
      reward, item_id: def.id, expires: kind === 'service' && def.days ? shopServiceExpiry(userId, def.id) : null,
    }
  } catch (e) {
    if (price > 0) await db.wallet.update({ where: { userId }, data: { gems: { increment: price } } }).catch(() => {})
    throw e
  }
}
async function shopServiceExpiry(userId: string, itemId: string): Promise<string | null> {
  const inv = await db.shopInventory.findUnique({ where: { userId_itemId: { userId, itemId } }, select: { expiresAt: true } })
  return inv?.expiresAt ? inv.expiresAt.toISOString() : null
}

/* ============================================================
   V108 — پک شروع امپراتور: وضعیت خرید فقط از سرور.
   V114 — آفر برای «همه‌ی بازیکنان» دیده می‌شود و تا خرید فعال می‌ماند
   (پنجره‌ی ۴۸ ساعته حذف شد؛ محدودیت واقعی = فقط یک‌بار برای هر حساب،
   در starter_claim اعمال می‌شود). پاک‌کردن حافظه/نصب مجدد/تغییر دستگاه
   /دستکاری ساعتِ دستگاه اثری ندارد.
   ============================================================ */
async function starterStateOf(userId: string) {
  let row = await db.starterOffer.findUnique({ where: { userId } })
  if (!row) {
    const u = await db.user.findUnique({ where: { id: userId }, select: { createdAt: true } })
    try {
      row = await db.starterOffer.create({ data: { userId, startedAt: u?.createdAt || new Date() } })
    } catch {
      row = (await db.starterOffer.findUnique({ where: { userId } }))!
    }
  }
  const endsAt = row.startedAt.getTime() + STARTER_PACK.windowMs
  const purchasedAt = row.purchasedAt
  /* V114: تا وقتی خریداری نشده، همیشه «offer» — حساب‌های قدیمی هم پک ۲۸۰ تومانی را می‌بینند */
  const phase: 'offer' | 'expired' | 'purchased' = purchasedAt ? 'purchased' : 'offer'
  return { row, startedAt: row.startedAt, endsAt, purchasedAt, phase }
}

function starterContents() {
  return {
    gems: STARTER_PACK.gems,
    gold: STARTER_PACK.gold,
    oil: STARTER_PACK.oil,
    food: STARTER_PACK.food,
    boost_min: Math.round(STARTER_PACK.boostMs / 60_000),
    war_supply: STARTER_PACK.warSupply,
    tax_instant: STARTER_PACK.taxInstant,
    cosmetics: STARTER_PACK.grants.map((g) => ({ id: g.id, fa: g.fa, ic: g.ic })),
  }
}

/* V118 — درزِ راستی‌آزمایی پرداخت واقعی.
   - myket:  فعال با MYKET_ACCESS_TOKEN (هدر X-Access-Token) یا MYKET_CLIENT_ID/MYKET_CLIENT_SECRET (Basic)؛
     MYKET_PACKAGE اختیاری — پیش‌فرض پکیج واقعی بازی com.worlddominion.game. راستی‌آزمایی با API رسمی
     developer.myket.ir برای SKU دلخواه انجام می‌شود (جم‌ها و پک شروع).
   - zarinpal: فعال با ZARINPAL_MERCHANT_ID — verify با authority.
   - sandbox: فقط سرور تستی/ادمین (QA) — روی سرور واقعی هرگز گرنت نمی‌دهد.
   بدون اعتبار محیط، پاسخ صادقانه‌ی provider_unavailable است — هیچ خرید فیک اتفاق نمی‌افتد. */
async function verifyProviderReceipt(provider: string, receipt: string, user: { id: string; isAdmin: boolean }, sku = 'emperor_starter'): Promise<{ ok: true; txId: string } | { ok: false; error: string }> {
  if (!provider) return { ok: false, error: 'provider' }
  if (!receipt) return { ok: false, error: 'receipt' }
  if (provider === 'sandbox') {
    const srv = await warUserServer(user.id).catch(() => 1)
    const tests = await testSrvsGet()
    if (!user.isAdmin && !tests.includes(srv)) return { ok: false, error: 'provider_unavailable' }
    if (!/^SBX-[A-Za-z0-9-]{6,80}$/.test(receipt)) return { ok: false, error: 'receipt' }
    return { ok: true, txId: receipt }
  }
  if (provider === 'myket') {
    const accessToken = process.env.MYKET_ACCESS_TOKEN
    const cid = process.env.MYKET_CLIENT_ID
    const sec = process.env.MYKET_CLIENT_SECRET
    if (!accessToken && !(cid && sec)) return { ok: false, error: 'provider_unavailable' }
    const pkg = process.env.MYKET_PACKAGE || 'com.worlddominion.game' /* V118: پکیج واقعی بازی */
    try {
      const headers: Record<string, string> = accessToken
        ? { 'X-Access-Token': accessToken } /* مستندات فعلی مایکت */
        : { Authorization: 'Basic ' + Buffer.from(cid + ':' + sec).toString('base64') } /* سازگاری با اعتبارنامه‌ی قدیمی */
      const res = await fetch(`https://developer.myket.ir/api/application/${encodeURIComponent(pkg)}/purchases/${encodeURIComponent(sku)}/tokens/${encodeURIComponent(receipt)}`, {
        headers,
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return { ok: false, error: res.status === 404 ? 'receipt' : 'provider_error' }
      const j = (await res.json()) as { purchaseState?: number; consumptionState?: number; orderId?: string }
      if (j.purchaseState !== 0) return { ok: false, error: 'receipt_state' }
      if (j.consumptionState === 1) return { ok: false, error: 'receipt_consumed' }
      return { ok: true, txId: 'MYK-' + (j.orderId || receipt) }
    } catch {
      return { ok: false, error: 'provider_error' }
    }
  }
  if (provider === 'zarinpal') {
    const mid = process.env.ZARINPAL_MERCHANT_ID
    if (!mid) return { ok: false, error: 'provider_unavailable' }
    try {
      const res = await fetch('https://payment.zarinpal.com/pg/v4/payment/verify.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ merchant_id: mid, amount: STARTER_PACK.priceToman * 10, authority: receipt }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) return { ok: false, error: 'provider_error' }
      const j = (await res.json()) as { data?: { code?: number; ref_id?: number } }
      const code = j?.data?.code
      if (code !== 100 && code !== 101) return { ok: false, error: code === 101 ? 'receipt_consumed' : 'receipt' }
      return { ok: true, txId: 'ZAR-' + (j.data?.ref_id || receipt) }
    } catch {
      return { ok: false, error: 'provider_error' }
    }
  }
  return { ok: false, error: 'provider' }
}


/* V59 wave-2 (§8): central territory cap — ONE source of truth server-side.
   Client mirror lives in public/game/index.html as WD_MAX_COUNTRIES (same value).
   Only NEW captures are blocked; existing holders are never harmed. */
const MAX_COUNTRIES = 15

/* ============================================================
   O2 — لایه‌ی رقابتی المپیک: پروفایل مهارت + دستاوردها + شبح
   تک‌منبع: هر به‌روزرسانی از مسیر olympic_submit رسمی (و oly_verify
   تأییدشده) می‌گذرد؛ تمرین هرگز اینجا وارد نمی‌شود.
   ============================================================ */
const SIM_END_EV = new Set(['fbend', 'racend', 'rndend', 'duend'])
/* V69 §17/L6: توکن HMAC مسابقه — پیوند submit به startِ واقعی سرور.
   کلاینت توکن را در olympic_start می‌گیرد و در olympic_submit برمی‌گرداند؛
   سرور از matchId+serverSeed بازتولید و مقایسه می‌کند (بدون دیتابیس اضافه).
   این حلقه‌ی مفقود L6 بود: seed صادر می‌شد اما هیچ‌جا راستی‌آزمایی نمی‌شد. */
function olyToken(matchId: string, seed: string): string {
  const secret = process.env.OLY_HMAC_SECRET || ('wd7-oly::' + (process.env.DATABASE_URL || 'local').slice(-32))
  return crypto.createHmac('sha256', secret).update(matchId + '.' + seed).digest('hex').slice(0, 32)
}
function telModelOf(ev: TelemEvent[] | undefined): 'tap' | 'sim' {
  if (ev && ev.some((e) => Array.isArray(e) && SIM_END_EV.has(String(e[0])))) return 'sim'
  return 'tap'
}
const RING_MAX = 10
async function olyProfileBump(userId: string, edition: number, discipline: string, score: number, model: 'tap' | 'sim', pr: boolean, bullseyes: number) {
  try {
    const row = await db.olympicProfile.findUnique({ where: { userId_discipline: { userId, discipline } } })
    let ring: RecentScore[] = []
    try { ring = JSON.parse((row && row.recent) || '[]') } catch (e) { ring = [] }
    if (!Array.isArray(ring)) ring = []
    ring.push({ s: score, m: model, at: Date.now() })
    ring = ring.slice(-RING_MAX)
    if (!row) {
      await db.olympicProfile.create({ data: {
        userId, discipline, n: 1, bestEver: Math.max(0, score), bestEdition: edition,
        prCount: pr ? 1 : 0, bullseyes: Math.max(0, bullseyes), recent: JSON.stringify(ring),
      } })
      return { n: 1, nTotal: 1, bestEver: Math.max(0, score), prCount: pr ? 1 : 0, bullseyes: Math.max(0, bullseyes), ring }
    }
    const data = {
      n: row.n + 1, bestEver: Math.max(row.bestEver, score),
      bestEdition: score > row.bestEver ? edition : row.bestEdition,
      prCount: row.prCount + (pr ? 1 : 0), bullseyes: row.bullseyes + Math.max(0, bullseyes),
      recent: JSON.stringify(ring),
    }
    await db.olympicProfile.update({ where: { id: row.id }, data })
    const nTotal = await db.olympicProfile.aggregate({ where: { userId }, _sum: { n: true } })
    return { n: data.n, nTotal: (nTotal._sum.n || 0), bestEver: data.bestEver, prCount: data.prCount, bullseyes: data.bullseyes, ring }
  } catch (e) { console.log('olyProfileBump', e); return null }
}
/* دستاوردهای تازه — اول بررسی وجود، بعد create؛ فقط کلیدهای واقعاً تازه برمی‌گردند */
async function olyAchieveUnlock(userId: string, edition: number, keys: string[]) {
  const fresh: string[] = []
  for (const k of keys) {
    try {
      const exists = await db.olympicAchieve.findUnique({ where: { userId_key: { userId, key: k } }, select: { id: true } })
      if (exists) continue
      await db.olympicAchieve.create({ data: { userId, key: k, edition } })
      fresh.push(k)
    } catch (e) {}
  }
  return fresh.map((k) => achDef(k)).filter(Boolean)
}

/* ============================================================
   V89 — OLYMPICS V2: اکوسیستم رقابتی
   ویژگی‌های ورزشکار فقط از مسابقه‌ی رسمی (OlympicProfile) بازمحاسبه
   می‌شوند؛ سکه‌ی المپیک فقط زینتی خرج می‌شود (ضد P2W مطلق).
   ============================================================ */
const OLY_REG_CAP = 12 /* V89: ثبت‌نام ۱۲ رشته از ۳۶ — انتخاب استراتژیک */
const OLY_FINAL_TOP = 16 /* شب فینال: ۱۶ نفر برتر هر رشته */
const OLY_MISSIONS: { key: string; fa: string; goal: number; token: number; xp: number }[] = [
  { key: 'play3', fa: 'در ۳ رشته‌ی رسمی مسابقه بده', goal: 3, token: 6, xp: 40 },
  { key: 'play5', fa: 'در ۵ رشته‌ی رسمی مسابقه بده', goal: 5, token: 10, xp: 60 },
  { key: 'play9', fa: 'در ۹ رشته‌ی رسمی مسابقه بده', goal: 9, token: 16, xp: 100 },
  { key: 'pb1', fa: 'یک رکورد شخصی بشکن', goal: 1, token: 5, xp: 30 },
  { key: 'pb3', fa: '۳ بار رکورد شخصی بشکن', goal: 3, token: 12, xp: 70 },
  { key: 'rival1', fa: 'از رقیب شخصی‌ات پیشی بگیر', goal: 1, token: 8, xp: 45 },
  { key: 'top100', fa: 'به Top 100 جهانی یک رشته برس', goal: 1, token: 8, xp: 50 },
  { key: 'top10', fa: 'به Top 10 جهانی یک رشته برس', goal: 1, token: 12, xp: 70 },
  { key: 'final1', fa: 'به فینال یک رشته صعود کن', goal: 1, token: 12, xp: 70 },
  { key: 'medal1', fa: 'یک مدال المپیک بگیر', goal: 1, token: 14, xp: 80 },
]
const OLY_TOKEN_SHOP: { k: string; fa: string; ic: string; price: number; d: string }[] = [
  { k: 'o_badge_flame', fa: 'نشان مشعل', ic: '🔥', price: 25, d: 'نشان المپیکی کنار نام در چت' },
  { k: 'o_emblem_speed', fa: 'نشان سرعت', ic: '⚡', price: 20, d: 'نشان تخصص سرعت روی کارنامه' },
  { k: 'o_emblem_precision', fa: 'نشان دقت', ic: '🎯', price: 20, d: 'نشان تخصص دقت روی کارنامه' },
  { k: 'o_emblem_power', fa: 'نشان قدرت', ic: '💪', price: 20, d: 'نشان تخصص قدرت روی کارنامه' },
  { k: 'o_emblem_tactical', fa: 'نشان تاکتیک', ic: '🧠', price: 20, d: 'نشان تخصص تاکتیک روی کارنامه' },
  { k: 'o_frame_laurel', fa: 'قاب برگ زیتون', ic: '🌿', price: 40, d: 'قاب زینتی پروفایل المپیکی' },
  { k: 'o_banner_ring', fa: 'پرچم حلقه‌ها', ic: '🚩', price: 30, d: 'بنر المپیکی روی کارنامه' },
  { k: 'o_stadium_theme', fa: 'تم استادیوم', ic: '🏟️', price: 60, d: 'تم ویژه‌ی صحنه‌ی مسابقه (زینتی)' },
  { k: 'o_ring_champ', fa: 'انگشتر قهرمانی', ic: '💍', price: 80, d: 'یادگار قهرمانی — کاملاً زینتی' },
  { k: 'o_statue_gold', fa: 'شبه‌طلای مجسمه', ic: '🗿', price: 120, d: 'جلوه‌ی طلایی مجسمه‌ی کارنامه' },
]
const olyLevelOf = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1

async function olyAthleteEnsure(userId: string) {
  try {
    let a = await db.olympicAthlete.findUnique({ where: { userId } })
    if (!a) a = await db.olympicAthlete.create({ data: { userId } })
    return a
  } catch (e) { console.log('olyAthEnsure', e); return null }
}
/* ویژگی‌ها از OlympicProfile (فقط مسابقه‌ی رسمی) — بدون هیچ مسیر خرید */
async function olyAttrsRecompute(userId: string) {
  try {
    const profs = await db.olympicProfile.findMany({ where: { userId } })
    const rows = profs.map((p) => {
      let ring: RecentScore[] = []
      try { ring = JSON.parse(p.recent || '[]') } catch (e) { ring = [] }
      if (!Array.isArray(ring)) ring = []
      return { discipline: p.discipline, n: p.n, recent: ring }
    })
    const { attrs, spec } = attrsFromProfiles(rows)
    await db.olympicAthlete.upsert({
      where: { userId },
      create: { userId, attrsJson: JSON.stringify(attrs), spec },
      update: { attrsJson: JSON.stringify(attrs), spec },
    })
    return { attrs, spec }
  } catch (e) { console.log('olyAttrs', e); return null }
}
async function olyAthleteCard(userId: string, nick: string) {
  const a = await olyAthleteEnsure(userId)
  let attrs: Record<string, number> = {}
  let spec = ''
  if (a && a.attrsJson && a.attrsJson !== '{}') {
    try { attrs = JSON.parse(a.attrsJson) || {} } catch (e) { attrs = {} }
    spec = a.spec || ''
  } else {
    const rc = await olyAttrsRecompute(userId)
    if (rc) { attrs = rc.attrs; spec = rc.spec }
  }
  const results = await db.olympicResult.findMany({ where: { userId }, orderBy: [{ edition: 'asc' }] })
  const g = results.filter((r) => r.rank === 1).length
  const s = results.filter((r) => r.rank === 2).length
  const b = results.filter((r) => r.rank === 3).length
  /* فینالیست‌ها: شمارش از FinalAttempt (شب فینال V89) */
  const finals = await db.olympicFinalAttempt.groupBy({ by: ['discipline', 'edition'], where: { userId }, _count: { _all: true } })
  const finalsCount = new Set(finals.map((f) => f.edition + ':' + f.discipline)).size
  const champRows = await db.olympicChampion.findMany({ where: { userId } })
  const wins = await db.olympicRivalry.aggregate({ where: { userId }, _sum: { passes: true } })
  const losses = await db.olympicRivalry.aggregate({ where: { userId }, _sum: { falls: true } })
  const seasons = new Set(results.map((r) => r.edition)).size
  const xp = a ? a.xp : 0
  /* V90 §36: رده‌بندی المپیکی — نمایش در شناسنامه */
  const rating = await olyRatingBlock(userId)
  return {
    nick, attrs, spec, token: a ? a.token : 0, owned: a ? (function () { try { return JSON.parse(a.ownedJson || '[]') } catch (e) { return [] } })() : [],
    xp, level: olyLevelOf(xp),
    medals: { g, s, b, total: g + s + b }, finals: finalsCount,
    championships: champRows.length, seasons,
    wins: (wins._sum.passes || 0), losses: (losses._sum.falls || 0),
    rating,
  }
}

/* ============================================================
   V90 — OLYMPICS V2 §34-36: رده‌بندی المپیکی (Elo هر رشته)
   سه مسیر تغذیه — هر سه سمت سرور و فقط از نتیجه‌ی رسمی داوری‌شده:
     ۱) olyRatingPerf   — هر تلاش رسمی (پس از تأیید داور olyScore)
     ۲) olyRatingDuel   — تکمیل دوئل رقیب (seed مشترک، داوری سرور)
     ۳) olyRatingPodium — پاداش سکوی شب فینال در فریز
   تمرین/نتیجه‌ی ردشده/کلاینت هیچ اثری ندارد (ضد P2W — §22/§34).
   ============================================================ */
async function olyRatingRow(userId: string, discipline: string) {
  try {
    let row = await db.olympicRating.findUnique({ where: { userId_discipline: { userId, discipline } } })
    if (!row) row = await db.olympicRating.create({ data: { userId, discipline } })
    return row
  } catch (e) { return null }
}
/* ۱) نوجه‌ی عملکردی — امتیاز به‌سمت «رده‌ی عملکرد» نتیجه‌ی رسمی نرم می‌شود */
async function olyRatingPerf(userId: string, discipline: string, score: number, model: 'tap' | 'sim') {
  try {
    const row = await olyRatingRow(userId, discipline)
    if (!row) return
    const nr = ratingPerfStep(row.rating, perfRatingOf(discipline, score, model))
    await db.olympicRating.update({
      where: { userId_discipline: { userId, discipline } },
      data: { rating: nr, peak: Math.max(row.peak, nr), games: { increment: 1 } },
    })
  } catch (e) { console.log('olyRdPerf', e) }
}
/* ۲) دوئل — Elo دوطرفه؛ برنده/بازنده/تساوی از داوری سرور */
async function olyRatingDuel(discipline: string, uidA: string, uidB: string, winnerUid: string | null) {
  try {
    const a = await olyRatingRow(uidA, discipline)
    const b = await olyRatingRow(uidB, discipline)
    if (!a || !b) return
    const sA: 0 | 0.5 | 1 = winnerUid == null ? 0.5 : winnerUid === uidA ? 1 : 0
    const sB: 0 | 0.5 | 1 = winnerUid == null ? 0.5 : winnerUid === uidB ? 1 : 0
    const ra = ratingDuelStep(a.rating, b.rating, sA, a.games)
    const rb = ratingDuelStep(b.rating, a.rating, sB, b.games)
    await db.olympicRating.update({ where: { userId_discipline: { userId: uidA, discipline } }, data: { rating: ra.rating, peak: Math.max(a.peak, ra.rating), games: { increment: 1 }, wins: sA === 1 ? { increment: 1 } : undefined } })
    await db.olympicRating.update({ where: { userId_discipline: { userId: uidB, discipline } }, data: { rating: rb.rating, peak: Math.max(b.peak, rb.rating), games: { increment: 1 }, wins: sB === 1 ? { increment: 1 } : undefined } })
  } catch (e) { console.log('olyRdDuel', e) }
}
/* ۳) پاداش سکو — طلا +۴۰ / نقره +۲۰ / برنز +۱۰ (سقف RD_MAX محافظت می‌کند) */
const RD_PODIUM_BONUS = [40, 20, 10]
async function olyRatingPodium(discipline: string, ranked: { userId: string }[]) {
  try {
    for (let i = 0; i < ranked.length && i < 3; i++) {
      const uid = ranked[i] && ranked[i].userId
      if (!uid) continue
      const row = await olyRatingRow(uid, discipline)
      if (!row) continue
      const nr = Math.min(RD_MAX, row.rating + RD_PODIUM_BONUS[i])
      await db.olympicRating.update({ where: { userId_discipline: { userId: uid, discipline } }, data: { rating: nr, peak: Math.max(row.peak, nr), wins: i === 0 ? { increment: 1 } : undefined } })
    }
  } catch (e) { console.log('olyRdPodium', e) }
}
/* بلوک رده‌بندی برای شناسنامه‌ی ورزشکار + پروفایل (§36) */
async function olyRatingBlock(userId: string) {
  try {
    const rows = await db.olympicRating.findMany({ where: { userId } })
    const ov = overallRatingOf(rows)
    const ti = tierIndex(ov.rating, ov.games)
    const next = ti + 1 < OLY_TIERS.length ? OLY_TIERS[ti + 1] : null
    const top = rows.filter((r) => r.games > 0).sort((x, y) => y.rating - x.rating).slice(0, 3)
      .map((r) => ({ discipline: r.discipline, rating: r.rating, peak: r.peak, games: r.games, tier: tierOf(r.rating, r.games).key }))
    return {
      overall: ov.rating, games: ov.games, tier: OLY_TIERS[ti].key,
      next_tier: next ? next.key : null,
      next_at: next ? next.min : null,
      peak: rows.length ? Math.max(...rows.map((r) => r.peak)) : RD_START,
      top,
    }
  } catch (e) { console.log('olyRdBlock', e); return null }
}
/* ماموریت‌های دوره — ساخت تنبل + پیشرفت فقط از رویداد رسمی */
async function olyMissionEnsureAll(userId: string, edition: number) {
  try {
    const have = await db.olympicMission.findMany({ where: { userId, edition } })
    const haveSet = new Set(have.map((h) => h.key))
    for (const def of OLY_MISSIONS) {
      if (haveSet.has(def.key)) continue
      await db.olympicMission.create({ data: { edition, userId, key: def.key, goal: def.goal, rewardJson: JSON.stringify({ token: def.token, xp: def.xp }) } }).catch(() => {})
    }
    return await db.olympicMission.findMany({ where: { userId, edition } })
  } catch (e) { console.log('olyMisEns', e); return [] }
}
async function olyMissionBump(userId: string, edition: number, key: string, inc = 1) {
  try {
    const m = await db.olympicMission.findUnique({ where: { edition_userId_key: { edition, userId, key } } })
    if (!m || m.done) return null
    const prog = Math.min(m.goal, m.prog + inc)
    const done = prog >= m.goal
    await db.olympicMission.update({ where: { id: m.id }, data: { prog, done } })
    return { key, done, fresh: done && !m.done }
  } catch (e) { return null }
}
/* صعود به فینال: روز ۴ (آخر) — ۱۶ نفر برتر مقدماتی هر رشته + ثبت qualBest.
   مسیر lazy و race-safe: فقط زمانی اجرا می‌شود که هنوز کسی final نشده باشد.
   V89.1: اگر قبلاً اعلا شده، خودِ صدا زننده هم (ثبت‌نام دیرهنگام با رکورد در سهمیه‌ی ۱۶)
   تک‌نفره تکمیل می‌شود — هیچ‌کس به‌خاطر تاریخچه‌ی دیگران از فینال جا نمی‌ماند. */
async function olyFinalistsEnsure(edition: number, key: string, userId?: string): Promise<boolean> {
  try {
    const marked = await db.olympicEntry.count({ where: { edition, discipline: key, finalist: true } })
    if (marked > 0) {
      if (userId) {
        const me = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition, userId, discipline: key } } })
        if (me && me.best > 0 && !me.finalist) {
          const better = await db.olympicEntry.count({ where: { edition, discipline: key, best: { gt: me.best } } })
          if (better < OLY_FINAL_TOP) {
            await db.olympicEntry.update({ where: { id: me.id }, data: { finalist: true, qualBest: me.best } }).catch(() => {})
            await olyMissionBump(userId, edition, 'final1', 1)
          }
        }
      }
      return true
    }
    const top = await db.olympicEntry.findMany({
      where: { edition, discipline: key, best: { gt: 0 } },
      orderBy: [{ best: 'desc' }, { lastAt: 'asc' }], take: OLY_FINAL_TOP,
    })
    if (!top.length) return false
    for (const t of top) {
      await db.olympicEntry.update({ where: { id: t.id }, data: { finalist: true, qualBest: t.best } }).catch(() => {})
      await olyMissionBump(t.userId, edition, 'final1', 1)
    }
    await addNews(0, 'olympic_finals', key, null, null)
    return true
  } catch (e) { console.log('olyFinalists', e); return false }
}
/* اختتامیه V89: تالار افتخارات + سکه‌ی مدال + ماموریت مدال */
async function olyV89Close(edition: number, results: { rank: number; userId: string; nick: string; country: string | null; countryFa: string | null; discipline: string; score: number }[]) {
  try {
    const byP: Record<string, { nick: string; userId: string; g: number; s: number; b: number; total: number; discs: Set<string> }> = {}
    for (const r of results) {
      const p = byP[r.userId] || (byP[r.userId] = { nick: r.nick, userId: r.userId, g: 0, s: 0, b: 0, total: 0, discs: new Set<string>() })
      if (r.rank === 1) p.g++; else if (r.rank === 2) p.s++; else if (r.rank === 3) p.b++
      p.total++; p.discs.add(r.discipline)
    }
    for (const p of Object.values(byP)) {
      /* سکه‌ی مدال‌ها — فقط زینتی */
      const tok = p.g * 25 + p.s * 15 + p.b * 10
      await db.olympicAthlete.upsert({
        where: { userId: p.userId },
        create: { userId: p.userId, token: tok, xp: p.total * 20 },
        update: { token: { increment: tok }, xp: { increment: p.total * 20 } },
      }).catch(() => {})
      for (let i = 0; i < p.g + p.s + p.b; i++) await olyMissionBump(p.userId, edition, 'medal1', 1)
      /* تالار افتخارات — upsert بر پایه‌ی value حداکثری */
      const hofPut = async (key: string, value: number, detail: string) => {
        try {
          const ex = await db.olympicHof.findUnique({ where: { key_userId: { key, userId: p.userId } } })
          if (ex && ex.value >= value) return
          await db.olympicHof.upsert({
            where: { key_userId: { key, userId: p.userId } },
            create: { key, userId: p.userId, nick: p.nick, value, detail, edition },
            update: { value, detail, edition },
          })
        } catch (e) {}
      }
      if (p.g > 0) await hofPut('golds', p.g, 'طلای دوره‌ی ' + edition)
      if (p.total > 0) await hofPut('medals', p.total, 'مدال دوره‌ی ' + edition)
      if (p.discs.size >= 3 && p.total >= 3) await hofPut('multisport', p.discs.size, 'مدال در ' + p.discs.size + ' رشته')
      const finalsP = await db.olympicFinalAttempt.groupBy({ by: ['discipline'], where: { userId: p.userId, edition }, _count: { _all: true } }).catch(() => [] as { discipline: string; _count: { _all: number } }[])
      if (finalsP.length) await hofPut('finals', finalsP.length, 'فینال دوره‌ی ' + edition)
    }
    /* رکوردداران — دفاع از رکورد (روزهای نگهداری) */
    const recs = await db.olympicRecord.findMany()
    for (const r of recs) {
      if (!r.nick) continue
      const u = await db.user.findFirst({ where: { nickLower: r.nick.toLowerCase() } })
      if (!u) continue
      const days = Math.max(0, Math.floor((Date.now() - new Date(r.updatedAt).getTime()) / 86400000))
      try {
        await db.olympicHof.upsert({
          where: { key_userId: { key: 'record', userId: u.id } },
          create: { key: 'record', userId: u.id, nick: r.nick, value: r.score, detail: 'رکورددار ' + r.discipline, edition: r.edition },
          update: { value: r.score, detail: 'رکورددار ' + r.discipline + ' • ' + days + ' روز دفاع', edition: r.edition },
        })
      } catch (e) {}
    }
    /* رقابت تاریخی — بیشترین دیدار */
    const rivs = await db.olympicRivalry.findMany({ where: { edition }, orderBy: [{ passes: 'desc' }], take: 5 })
    for (const rv of rivs) {
      const meetings = rv.passes + rv.falls
      if (meetings < 3) continue
      try {
        await db.olympicHof.upsert({
          where: { key_userId: { key: 'rivalry', userId: rv.userId } },
          create: { key: 'rivalry', userId: rv.userId, nick: rv.rivalNick, value: meetings, detail: 'دیدار با ' + rv.rivalNick, edition },
          update: { value: Math.max(meetings, 0), detail: 'دیدار با ' + rv.rivalNick, edition },
        })
      } catch (e) {}
    }
  } catch (e) { console.log('olyV89Close', e) }
}
/* کش ۳۰ ثانیه‌ای تله‌متری شبح جهانی هر رشته (PHASE 9) */
const OL_GHOST_CC: Record<string, { at: number; v: unknown }> = {}
async function olyGhostGlobal(discipline: string) {
  const c = OL_GHOST_CC[discipline]
  if (c && Date.now() - c.at < 30000) return c.v
  let v: unknown = null
  const rec = await db.olympicRecord.findUnique({ where: { discipline } })
  if (rec && rec.matchId) {
    const m = await db.olympicMatch.findUnique({ where: { id: rec.matchId } })
    if (m && m.logJson) v = { nick: rec.nick, score: rec.score, edition: rec.edition, tel: m.logJson }
  }
  if (!v) {
    /* fallback برای رکوردهای پیش از O2: بالاترین مسابقه‌ی رسمیِ دارای replay */
    const m = await db.olympicMatch.findFirst({
      where: { discipline, status: 'scored', mode: 'official', logJson: { not: null } },
      orderBy: [{ score: 'desc' }],
    })
    if (m && m.logJson) v = { nick: (rec && rec.nick) || m.userId, score: (rec && rec.score) || m.score, edition: m.edition, tel: m.logJson }
  }
  OL_GHOST_CC[discipline] = { at: Date.now(), v }
  return v
}
async function territoryCount(userId: number | string, server: number): Promise<number> {
  try { return await db.territory.count({ where: { userId: userId as string, server } }) } catch { return 0 }
}

/* V54 — عملیات‌های حمله‌ای جم (جای کودتا/شهاب): قیمت، کول‌داون شخصی و سقف هفتگی کل سرور.
   قیمت‌ها باید با OPS سمت کلاینت یکی باشد. V72: به src/lib/balance.ts منتقل شد (PHASE 4). */

/* V55 — اثر واقعی عملیات‌ها روی PvP (قبلاً فقط افکت محلی کلاینت بود و بازیکن حس می‌کرد عملیات بی‌اثر است)
   در GameSetting('wd_ops_eff_<server>'): { [country]: { k, pct, until, by } }
     cyber/missile/nuke → دفاع آن کشور در pvp_attack تا پایان مدت pct٪ ضعیف می‌شود
     commando          → حمله‌ی مهاجم روی همان کشور +۲۰٪ قدرت می‌گیرد (bump خاک همچنان سمت کلاینت) */
const OPS_EFF_KEY = (server: number) => 'wd_ops_eff_' + server
type OpsEffMap = Record<string, { k: string; pct: number; until: number; by: string }>
let OPS_EFF_CACHE: { at: number; byServer: Record<number, OpsEffMap> } = { at: 0, byServer: {} }
async function opsEffGet(server: number): Promise<OpsEffMap> {
  const c = OPS_EFF_CACHE.byServer[server]
  if (c && Date.now() - OPS_EFF_CACHE.at < 10_000) return c
  let m: OpsEffMap = {}
  try { m = await getSetting<OpsEffMap>(OPS_EFF_KEY(server), {}) } catch (e) { console.log('opseff', e) }
  /* prune expired so the blob stays small */
  const now = Date.now()
  for (const k of Object.keys(m)) { if (!m[k] || !(m[k].until > now)) delete m[k] }
  OPS_EFF_CACHE.byServer[server] = m
  OPS_EFF_CACHE.at = Date.now()
  return m
}
async function opsEffSet(server: number, country: string, eff: { k: string; pct: number; until: number; by: string }) {
  try {
    const m = await opsEffGet(server)
    m[country] = eff
    OPS_EFF_CACHE.byServer[server] = m
    OPS_EFF_CACHE.at = Date.now()
    await setSetting(OPS_EFF_KEY(server), m)
  } catch (e) { console.log('opseffset', e) }
}

function weekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${week}`
}

/* ================= U7 — عملیات هفتگی اتحاد (جنگ اتحاد) =================
   امتیاز فقط از رویدادهای واقعی سرور: فتح PvP +۱۲۰ • برد دوئل +۵۰ • المپیک رسمی امتیاز÷۱۰۰ (سقف ۳۰ در هر ثبت).
   سقف سهم هفتگی هر عضو ۶۰۰ (ضد مونوپولی) — هدف ۲۰۰۰ — تکمیل = خبر جهانی + ۳۰ جم برای هر عضو (یک‌بار). */
const OP_GOAL = 2000
const OP_CAP = 600
const opWeekKey = () => {
  const d = new Date()
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const wd = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() - wd + 1)
  return t.toISOString().slice(0, 10)
}
async function opAccrue(userId: string, pts: number) {
  try {
    pts = Math.max(1, Math.min(200, Math.round(pts)))
    const mem = await db.allianceMember.findFirst({ where: { userId } })
    if (!mem) return
    const wk = opWeekKey()
    const op = await db.allianceOp.upsert({ where: { allianceId_weekKey: { allianceId: mem.allianceId, weekKey: wk } }, create: { allianceId: mem.allianceId, weekKey: wk, goal: OP_GOAL }, update: {} })
    if (op.doneAt) return
    const contribs = JSON.parse(op.contribs || '{}') as Record<string, number>
    const old = contribs[userId] || 0
    const mine = Math.min(OP_CAP, old + pts)
    const add = mine - old
    if (add <= 0) return
    contribs[userId] = mine
    const progress = Math.min(OP_GOAL, op.progress + add)
    const done = progress >= OP_GOAL && !op.doneAt
    await db.allianceOp.update({ where: { id: op.id }, data: { contribs: JSON.stringify(contribs), progress, doneAt: done ? new Date() : undefined } })
    if (done) {
      const a = await db.alliance.findUnique({ where: { id: mem.allianceId } })
      if (a) { try { await addNews(a.server, 'alliance_war', null, a.name + ' [' + a.tag + ']', 'هدف جنگی هفته کامل شد') } catch (e) {} }
    }
  } catch (e) { console.log('opAccrue', e) }
}
async function addNews(server: number, action: string, country: string | null, actorNick: string | null, targetNick: string | null) {
  try {
    await db.worldNews.create({ data: { server, action, country, actorNick, targetNick } })
    /* keep the table small (V33.1): the olympic/aggregation scans read it every cycle */
    const cnt = await db.worldNews.count()
    if (cnt > 500) {
      const old = await db.worldNews.findMany({ orderBy: { createdAt: 'asc' }, take: cnt - 300, select: { id: true } })
      if (old.length) await db.worldNews.deleteMany({ where: { id: { in: old.map((r) => r.id) } } })
    }
  } catch (e) { console.log('addNews', e) }
}

/* V108 §21 — رصد/مشاهده‌پذیری: رویدادهای سرور (نمایش/خرید/استفاده) با فراخوانی
   fire-and-forget و try/catch — هیچ‌وقت مسیر اصلی خرید/جنگ را نمی‌شکند.
   کلیدهای مجاز بسته‌اند؛ هیچ داده‌ی حساس شخصی ذخیره نمی‌شود. */
async function telem(key: string, userId: string | null, server: number, itemId: string | null, meta: Record<string, unknown> = {}) {
  try {
    await db.telemEvent.create({ data: { key, userId, server, itemId, meta: JSON.stringify(meta) } })
  } catch (e) { console.log('telem', key, e) }
}

async function ensureWallet(userId: string) {
  let w = await db.wallet.findUnique({ where: { userId } })
  if (!w) w = await db.wallet.create({ data: { userId, gems: 0 } })
  return w
}

/* V86 — پاداش یک‌بارمصرف عضویت در کانال تلگرام (مبلغ فقط همین‌جا — تک‌منبع) */
const TG_GEMS = 20

/* V86 — سرورهای تستی: درِ ورود بازیکنان تازه بسته است؛ [] یعنی حالت عرضه‌ی مایکت (همه از سرور ۱ شروع می‌کنند).
   تک‌منبع: GameSetting('wd_test_srvs') — کلاینت فقط برای نمایش/انتخاب می‌خواند (srv_meta)، گارد واقعی این‌جاست */
const TEST_SRV_KEY = 'wd_test_srvs'
let TST_CACHE: { at: number; list: number[] } = { at: 0, list: [] }
async function testSrvsGet(): Promise<number[]> {
  if (Date.now() - TST_CACHE.at < 30_000) return TST_CACHE.list
  let list: number[] = [1]
  try { list = await getSetting<number[]>(TEST_SRV_KEY, [1]) } catch { /* پیش‌فرض: سرور ۱ تستی */ }
  list = [...new Set((list || []).map(Number).filter((n) => n >= 1 && n <= 20))]
  TST_CACHE = { at: Date.now(), list }
  return list
}
async function testSrvsSet(list: number[]) {
  await setSetting(TEST_SRV_KEY, list)
  TST_CACHE = { at: Date.now(), list }
}

/** daily login bonus: +20 gems per calendar day (atomic — no double-claim race) */
async function dailyBonus(userId: string) {
  await ensureWallet(userId)
  const today = new Date().toISOString().slice(0, 10)
  const dayStart = new Date(today + 'T00:00:00.000Z')
  const upd = await db.wallet.updateMany({
    where: { userId, OR: [{ lastDaily: null }, { lastDaily: { lt: dayStart } }] },
    data: { gems: { increment: 20 }, lastDaily: new Date() },
  })
  const w = await ensureWallet(userId)
  /* V66 Shop V2: بونوس جم روزانه‌ی VIP — سمت سرور (مزیت جدید؛ هدیه‌ی طلای قدیمی VIP کلاینت دست نخورده) */
  let vipGranted = 0
  if (upd.count > 0 && w.vipUntil && w.vipUntil.getTime() > Date.now()) {
    const vupd = await db.wallet.updateMany({ where: { userId, gems: { gte: 0 } }, data: { gems: { increment: 10 } } })
    vipGranted = vupd.count > 0 ? 10 : 0
  }
  const w2 = vipGranted ? await ensureWallet(userId) : w
  return { w: w2, granted: upd.count > 0 ? 20 : 0, vipGranted }
}

/* ============================================================
   V43 — جهان زنده: ساعت آخرالزمان مشترک + بحران فصلی
   - doom: متغیر سراسری سرور در GameSetting('doom_v43')
     جنگ‌ها کم می‌کنند، آرامش ساعتی جبران می‌کند؛ رسیدن به صفر
     = ۴۸ ساعت بحران سراسری (افت تولید، نه حذف دارایی) و ریست.
   - crisis: هر پنجره‌ی ۱۰ روزه به‌صورت قطعی (بدون تایمر) از تاریخ
     مشتق می‌شود؛ ۴ روز فعال، ۶ روز آرامش.
   ============================================================ */
const DOOM_KEY = 'doom_v43'
type DoomState = { value: number; firedAt: number | null; ts: number }
const DOOM_HIT_MIN = 5 * 60_000 /* دست‌کم ۵ دقیقه فاصله بین دو کسر — ضد اسپم */

async function getSetting<T>(key: string, def: T): Promise<T> {
  try {
    const r = await db.gameSetting.findUnique({ where: { key } })
    return r ? (JSON.parse(r.value) as T) : def
  } catch { return def }
}
async function setSetting(key: string, val: unknown) {
  await db.gameSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(val) }, update: { value: JSON.stringify(val) } })
}

const CRISIS_KINDS = [
  { k: 'oil', fa: 'بحران نفت', d: 'بازار جهانی نفت را خالی کرده — تولید نفت ۲۵٪ افت می‌کند', ic: '🛢️' },
  { k: 'drought', fa: 'خشکسالی جهانی', d: 'مزارع می‌سوزند — تولید غذا ۲۵٪ افت می‌کند', ic: '🌾' },
  { k: 'recession', fa: 'رکود جهانی', d: 'بازارها ریزش کرده‌اند — درآمد طلا ۲۰٪ افت می‌کند', ic: '📉' },
  { k: 'diplomat', fa: 'بحران دیپلماتیک', d: 'تنش جهانی بالا می‌رود — تحریم نزدیک‌تر است', ic: '⚔️' },
  { k: 'unrest', fa: 'موج ناآرامی', d: 'شورش در سراسر جهان — ناآرامی قلمروها تندتر رشد می‌کند', ic: '🔥' },
]
const CRISIS_PERIOD_MS = 10 * 864e5
const CRISIS_ACTIVE_MS = 4 * 864e5
const CRISIS_ANCHOR = Date.UTC(2026, 0, 1)

async function doomHit(amount: number) {
  try {
    const s = await getSetting<DoomState>(DOOM_KEY, { value: 100, firedAt: null, ts: Date.now() })
    const now = Date.now()
    if (s.firedAt && now - s.firedAt < 48 * 3600_000) return /* در فاجعه‌ی فعال» ضربه بی‌اثر */
    if (now - (s.ts || 0) < DOOM_HIT_MIN) return /* ضد اسپم */
    const v = Math.max(0, s.value - amount)
    if (v <= 0) {
      await setSetting(DOOM_KEY, { value: 100, firedAt: now, ts: now } satisfies DoomState)
      await db.gameSetting.upsert({
        where: { key: 'apocalypse_v43' }, create: { key: 'apocalypse_v43', value: String(now) }, update: { value: String(now) },
      }).catch(() => {})
    } else {
      await setSetting(DOOM_KEY, { value: v, firedAt: s.firedAt, ts: now } satisfies DoomState)
    }
  } catch (e) { console.log('doomHit', e) }
}

function crisisFor(now = Date.now()) {
  const into = now - CRISIS_ANCHOR
  if (into < 0) return null
  const win = Math.floor(into / CRISIS_PERIOD_MS)
  const dayIn = into - win * CRISIS_PERIOD_MS
  if (dayIn >= CRISIS_ACTIVE_MS) return null
  const c = CRISIS_KINDS[win % CRISIS_KINDS.length]
  return { ...c, until: CRISIS_ANCHOR + win * CRISIS_PERIOD_MS + CRISIS_ACTIVE_MS }
}

async function worldState() {
  const now = Date.now()
  let s = await getSetting<DoomState>(DOOM_KEY, { value: 100, firedAt: null, ts: now })
  const hours = Math.max(0, (now - (s.ts || now)) / 3600_000)
  let value = Math.min(100, s.value + hours * 2) /* آرامش: +۲ در ساعت */
  let firedAt = s.firedAt
  if (firedAt && now - firedAt > 48 * 3600_000) firedAt = null /* فاجعه تمام شد */
  const fired = !!firedAt && now - firedAt <= 48 * 3600_000
  if (Math.abs(value - s.value) > 0.5 || firedAt !== s.firedAt) {
    s = { value, firedAt, ts: now }
    await setSetting(DOOM_KEY, s).catch(() => {})
  }
  const crisis = fired
    ? { k: 'apocalypse', fa: 'ساعت آخرالزمان صفر شد', d: 'فاجعه‌ی جهانی: تولید همه‌ی منابع ۱۵٪ افت می‌کند تا ۴۸ ساعت', ic: '☄️', until: firedAt! + 48 * 3600_000 }
    : crisisFor(now)
  return { doom: Math.round(value), fired: fired, crisis, server_time: now }
}

/* ============================================================
   V43 — مسیر فصلی (Battle Pass اخلاقی)
   XP فقط با بازی کردن: ورود روزانه/مالیات/فتح/المپیک/تبلیغ/تجارت.
   سقف روزانه سرور-محور (ضد تقلب). ۲۰ پله × ۱۰۰XP.
   جایزه‌ها: طلا/غذا (داخل Save سرور-محور) + جم کوچک (کیف پول)
   + آیتم زینتی (کلاینت بعد از تایید سرور باز می‌کند).
   ============================================================ */
const seasonKey = () => 'S' + new Date().toISOString().slice(0, 7)
const PASS_TIER_XP = 100
const PASS_TIERS: { g?: number; f?: number; gem?: number; cos?: string; fa?: string }[] = [
  { g: 2000, fa: '۲٬۰۰۰ طلا' },
  { g: 3000, f: 800, fa: '۳٬۰۰۰ طلا + ۸۰۰ غذا' },
  { gem: 2, fa: '۲ جم' },
  { g: 5000, fa: '۵٬۰۰۰ طلا' },
  { cos: 'announce', fa: '🎁 صدای اعلام‌کننده‌ی اختصاصی' },
  { g: 6000, f: 1500, fa: '۶٬۰۰۰ طلا + ۱٬۵۰۰ غذا' },
  { gem: 3, fa: '۳ جم' },
  { g: 8000, fa: '۸٬۰۰۰ طلا' },
  { gem: 4, fa: '۴ جم' },
  { cos: 'entrance', fa: '🎁 صحنه‌ی ورود سینمایی' },
  { g: 12000, f: 2500, fa: '۱۲٬۰۰۰ طلا + ۲٬۵۰۰ غذا' },
  { gem: 5, fa: '۵ جم' },
  { g: 15000, fa: '۱۵٬۰۰۰ طلا' },
  { gem: 6, fa: '۶ جم' },
  { g: 20000, f: 4000, fa: '۲۰٬۰۰۰ طلا + ۴٬۰۰۰ غذا' },
  { gem: 8, fa: '۸ جم' },
  { g: 30000, fa: '۳۰٬۰۰۰ طلا' },
  { gem: 12, fa: '۱۲ جم' },
  { g: 50000, f: 8000, fa: '۵۰٬۰۰۰ طلا + ۸٬۰۰۰ غذا' },
  { cos: 'frame', fa: '🖼️ قاب پروفایل پویا (افسانه‌ای)' },
]
const PASS_MISSIONS: Record<string, { xp: number; cap: number; fa: string; ic: string }> = {
  login: { xp: 10, cap: 1, fa: 'ورود روزانه به بازی', ic: '📅' },
  tax: { xp: 5, cap: 3, fa: 'جمع‌آوری مالیات (۳ بار در روز)', ic: '💰' },
  conquest: { xp: 25, cap: 4, fa: 'فتح کشور جدید', ic: '🏴' },
  olympic: { xp: 40, cap: 1, fa: 'شرکت در یک رشته‌ی المپیک', ic: '🏅' },
  prop: { xp: 10, cap: 2, fa: 'سخنرانی رادیویی (۲ بار در روز)', ic: '📻' },
  trade: { xp: 15, cap: 2, fa: 'انجام معامله‌ی تجاری', ic: '🤝' },
}
type PassDlog = { d?: string; c?: Record<string, number> }

async function ensurePass(userId: string) {
  const season = seasonKey()
  let row = await db.seasonPass.findUnique({ where: { userId_season: { userId, season } } })
  if (!row) {
    try { row = await db.seasonPass.create({ data: { userId, season } }) } catch (e) {
      row = await db.seasonPass.findUnique({ where: { userId_season: { userId, season } } })
    }
  }
  return row!
}

async function passAddXp(userId: string, mission: string) {
  const m = PASS_MISSIONS[mission]
  if (!m) return null
  const row = await ensurePass(userId)
  const today = new Date().toISOString().slice(0, 10)
  let dlog: PassDlog = {}
  try { dlog = JSON.parse(row.dlog || '{}') || {} } catch { dlog = {} }
  if (dlog.d !== today) dlog = { d: today, c: {} }
  const cnt = dlog.c || {}
  if ((cnt[mission] || 0) >= m.cap) return { ok: false, reason: 'cap', xp: row.xp, claimed: row.claimed, gain: 0 }
  cnt[mission] = (cnt[mission] || 0) + 1
  const xp = row.xp + m.xp
  const upd = await db.seasonPass.updateMany({ where: { userId, season: seasonKey(), xp: row.xp }, data: { xp, dlog: JSON.stringify({ d: today, c: cnt }) } })
  if (upd.count === 0) return { ok: false, reason: 'race', xp: row.xp, claimed: row.claimed, gain: 0 }
  return { ok: true, xp, tier: Math.floor(xp / PASS_TIER_XP), gain: m.xp, mission, fa: m.fa }
}

/* ---------- capture transfer shared by pvp_attack success & pvp_capture_territory ---------- */
const lastCapture = new Map<string, number>()
/* V75 — P4: کول‌داون حمله‌ی PvP سمت سرور (کلید: userId — پاک‌سازی وقتی بزرگ شد) */
const lastPvpAtk = new Map<string, number>()
let lastReleaseRun = 0

async function transferTerritory(server: number, country: string, uid: string, nick: string): Promise<{ ok: boolean; error?: string; prevOwner?: string }> {
  const t = await db.territory.findUnique({ where: { server_country: { server, country } } })
  if (!t) return { ok: false, error: 'not found' }
  if (t.userId === uid) return { ok: false, error: 'own' }
  const prevOwner = t.userId
  /* V83sec (AUDIT-C P2): آپدیت شرطی — دو مهاجم همزمان هر دو «برد» نمی‌گیرند
     (پیروزی مشروط به مالکیتِ همان prevOwner در لحظه‌ی نوشتن)
     V86fix: server_country فقط در findUnique معتبر است؛ در updateMany فیلدها مستقیم می‌آیند
     (قبلاً PrismaClientValidationError می‌داد و مسیر فتح PvP خراب بود) */
  const upd = await db.territory.updateMany({ where: { server, country, userId: prevOwner }, data: { userId: uid, nick, isCapital: false } })
  if (upd.count === 0) return { ok: false, error: 'race' }
  const cnt = await db.territory.count({ where: { server, userId: prevOwner } })
  if (cnt === 0) {
    // the defender lost everything: free the capital too so they can restart
    await db.territory.deleteMany({ where: { server, userId: prevOwner } })
  }
  const rows = await db.territory.groupBy({ by: ['userId'], where: { server } })
  const taken = await db.territory.count({ where: { server } })
  await db.serverStat.upsert({
    where: { server },
    create: { server, taken, players: rows.length },
    update: { taken, players: rows.length },
  })
  await addNews(server, 'pvp_capture', country, nick, t.nick)
  await doomHit(4) /* V43: هر فتح بزرگ ساعت آخرالزمان مشترک را ۴ واحد جلو می‌برد */
  /* V69 §26: XP مسیر فصل برای فتح PvP — مستقیم از داور سرور (territory_sync دیگر دوباره اعطا نمی‌کند
     چون کشور همین حالا مالِ همین کاربر شده و در حلقه‌ی grant نمی‌افتد) */
  passAddXp(uid, 'conquest').catch(() => {})
  try { await opAccrue(uid, 120) } catch (e) {} /* U7 — فتح PvP = +۱۲۰ امتیاز جنگ اتحاد */
  return { ok: true, prevOwner }
}

/* ---------- P2P trade offers (V28) ----------
   Resources live inside each player's save.state JSON ({res:{gold,oil,food}}).
   Offers are validated server-side at create AND at accept time, so neither
   side can cheat. A small fee is burned on every completed trade. */
const TRADE_FEE = 0.03
const TRADE_RES = new Set(['gold', 'oil', 'food'])

const resNum = (v: unknown): number => Math.max(0, Math.round(Number(v) || 0))

function tradeRes(stateJson: string): { obj: Record<string, unknown>; res: Record<string, number> } {
  let obj: Record<string, unknown> = {}
  try { obj = JSON.parse(stateJson || '{}') || {} } catch { obj = {} }
  const res = (obj.res || {}) as Record<string, number>
  return { obj, res }
}

async function tradeApply(uid: string, mut: (res: Record<string, number>) => void, tx?: Prisma.TransactionClient): Promise<boolean> {
  const conn = tx || db
  const save = await conn.save.findUnique({ where: { userId: uid } })
  if (!save) return false
  const { obj, res } = tradeRes(save.state)
  mut(res)
  for (const k of ['gold', 'oil', 'food']) {
    if (res[k] === undefined) res[k] = 0
    if (!Number.isFinite(res[k]) || res[k] < 0) return false
  }
  obj.res = res
  await conn.save.update({ where: { userId: uid }, data: { state: JSON.stringify(obj) } })
  return true
}

/* ============================================================
   V32 — Olympic Champion (تاج‌گذاری هفتگی + جایزه‌ی واقعی)
   Every 7 days the medal-table #1 is crowned automatically:
   💎 4 gems + 🪙 100,000 gold + 10k oil + 10k food + 5k steel
   + 24h production boost + permanent champion medal (visible to all).
   Crowning is lazy (triggered by olympics/olympic_status/season_reset)
   and race-safe via the unique (server, cycle) constraint.
   ============================================================ */
const CYCLE_MS = 7 * 86400000
/* V72: OL_REWARDS به src/lib/balance.ts منتقل شد (PHASE 4) */
const olCycle = (ms = Date.now()) => Math.floor(ms / CYCLE_MS)

type OlAgg = { server: number; players: number; disciplines: { key: string; top: { nick: string; val: number }[] }[]; medals: { nick: string; g: number; s: number; b: number; total: number; score: number }[] }

/* ============ O1 — پرفورمنس المپیک (PHASE 8/53) ============
   کش TTL حافظه برای payloadهای سنگین صفحه‌ها؛ ذخیره‌گاه serverless هر نمونه
   مستقل است اما همین هم بار DB را در ترافیک واقعی ده‌ها برابر کم می‌کند. */
const OL_NEWS_ACTIONS = ['pvp_capture', 'cyber', 'commando', 'missile', 'nuke', 'trade', 'capture', 'conquer', 'pvp_attack']
let OL_WORLD_CC: { k: number; at: number; v: OlAgg } | null = null
let OL_GAMES_CC: { k: string; at: number; v: {
  table: { country: string; countryFa: string; g: number; s: number; b: number; total: number }[]
  records: Awaited<ReturnType<typeof db.olympicRecord.findMany>>
  career: Record<string, { nick: string; g: number; s: number; b: number; total: number; eds: number[] }>
  rivals: { nick: string; medals: number }[]
  live_feed: { nick: string; discipline: string; best: number; countryFa: string; at: string }[]
  torch: { edition: number; nick: string | null; country: string | null } | null
  archives: Awaited<ReturnType<typeof db.olympicArchive.findMany>>
} | null } | null = null

/* بخش مشترک سنگین olympic_games — با کش ۱۰s (در فاز live جدول مدال تا ۱۰s عقب است: قابل قبول) */
async function olyShared(edition: number, live: boolean) {
  const ck0 = edition + ':' + (live ? 'l' : 'f')
  if (OL_GAMES_CC && OL_GAMES_CC.k === ck0 && Date.now() - OL_GAMES_CC.at < 10000 && OL_GAMES_CC.v) return OL_GAMES_CC.v
  /* live medal table by COUNTRY: during the games standings come straight from
     entry bests (top-3 per discipline, same ranking as the freeze), after close
     they come from the frozen olympicResult rows */
  const byC: Record<string, { country: string; countryFa: string; g: number; s: number; b: number; total: number }> = {}
  if (live) {
    const ents = await db.olympicEntry.findMany({ where: { edition, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }] })
    const picked: Record<string, number> = {}
    for (const e of ents) {
      const n = picked[e.discipline] || 0
      if (n >= 3) continue
      picked[e.discipline] = n + 1
      const ck = e.country || '?'
      const c = byC[ck] || (byC[ck] = { country: ck, countryFa: e.countryFa || ck, g: 0, s: 0, b: 0, total: 0 })
      if (n === 0) c.g++; else if (n === 1) c.s++; else c.b++
      c.total++
    }
  } else {
    const results = await db.olympicResult.findMany({ where: { edition } })
    for (const r of results) {
      const ck = r.country || '?'
      const c = byC[ck] || (byC[ck] = { country: ck, countryFa: r.countryFa || ck, g: 0, s: 0, b: 0, total: 0 })
      if (r.rank === 1) c.g++; else if (r.rank === 2) c.s++; else c.b++
      c.total++
    }
  }
  /* O4-final / PHASE 22: امتیاز کشوری وزن‌دار (G=5, S=2, B=1) — ستون نمایشی؛
     ترتیب رسمی همان کنوانسیون المپیک (طلا اول) می‌ماند */
  const table = Object.values(byC).map((c) => ({ ...c, pts: c.g * 5 + c.s * 2 + c.b })).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.total - a.total)
  const records = await db.olympicRecord.findMany({ take: 12 })
  const allResults = await db.olympicResult.findMany({ orderBy: [{ edition: 'asc' }], take: 250 })
  const career: Record<string, { nick: string; g: number; s: number; b: number; total: number; eds: number[] }> = {}
  for (const r of allResults) {
    const c2 = career[r.nick] || (career[r.nick] = { nick: r.nick, g: 0, s: 0, b: 0, total: 0, eds: [] })
    if (r.rank === 1) c2.g++; else if (r.rank === 2) c2.s++; else c2.b++
    c2.total++
    if (c2.eds.indexOf(r.edition) < 0) c2.eds.push(r.edition)
  }
  const rivals = Object.values(career).sort((a, b) => b.total - a.total || b.g - a.g).slice(0, 8).map((c3) => ({ nick: c3.nick, medals: c3.total }))
  const torch = await db.olympicArchive.findFirst({ where: { championNick: { not: null } }, orderBy: [{ edition: 'desc' }] })
  const archives = await db.olympicArchive.findMany({ orderBy: [{ edition: 'desc' }], take: 8 })
  /* V40: پخش زنده — آخرین نتایج واقعی بازیکنان برای تیکر زنده‌ی المپیک */
  const feedRows = await db.olympicEntry.findMany({ where: { edition, best: { gt: 0 } }, orderBy: [{ lastAt: 'desc' }], take: 10 })
  const live_feed = feedRows.map((f) => ({ nick: f.nick, discipline: f.discipline, best: f.best, countryFa: f.countryFa || f.country || '', at: f.lastAt.toISOString() }))
  const v = {
    table, records, career, rivals, live_feed,
    torch: torch ? { edition: torch.edition, nick: torch.championNick, country: torch.championCountry } : null,
    archives,
  }
  OL_GAMES_CC = { k: ck0, at: Date.now(), v }
  return v
}

/* ============ O4-final / PHASE 34: لایه‌ی انگیزش — فقط با داده‌ی واقعی ============
   برای هر رشته‌ی ثبت‌شده‌ی کاربر: فاصله تا رتبه‌ی بعدی، صدرنشینی، فاصله تا PR،
   تلاش رسمی مانده. صفر عدد ساختگی — همه از جدول‌های رسمی داور.
   کش ۳۰ ثانیه‌ای per-user (این بخش سنگین نیست ولی بی‌خودی تکرار نشود). */
const OL_MOTIVE_CC: Record<string, { at: number; v: { discipline: string; kind: string; gap: number }[] }> = {}
async function olyMotive(edition: number, userId: string, ents: { discipline: string; best: number; attempts: number }[], hostMax: number) {
  const ck = edition + ':' + userId
  const cc = OL_MOTIVE_CC[ck]
  if (cc && Date.now() - cc.at < 30000) return cc.v
  const lines: { discipline: string; kind: string; gap: number }[] = []
  for (const e of ents) {
    if (!(e.best > 0)) continue
    const nb = await db.olympicEntry.findFirst({ where: { edition, discipline: e.discipline, best: { gt: e.best } }, orderBy: [{ best: 'asc' }], select: { best: true } })
    if (nb) lines.push({ discipline: e.discipline, kind: 'chase', gap: nb.best - e.best })
    else lines.push({ discipline: e.discipline, kind: 'lead', gap: 0 })
    const prof = await db.olympicProfile.findUnique({ where: { userId_discipline: { userId, discipline: e.discipline } } })
    if (prof && prof.bestEver > e.best) lines.push({ discipline: e.discipline, kind: 'pr', gap: prof.bestEver - e.best })
    if (hostMax > e.attempts) lines.push({ discipline: e.discipline, kind: 'attempts', gap: hostMax - e.attempts })
  }
  /* چِیس‌های نزدیک اول؛ بعد PR؛ بعد بقیه */
  lines.sort((a, b) => (a.kind === 'chase' ? 0 : a.kind === 'lead' ? 1 : a.kind === 'pr' ? 2 : 3) - (b.kind === 'chase' ? 0 : b.kind === 'lead' ? 1 : b.kind === 'pr' ? 2 : 3) || a.gap - b.gap)
  const v = lines.slice(0, 3)
  OL_MOTIVE_CC[ck] = { at: Date.now(), v }
  return v
}

/* medal-table computation shared by the olympics page and the crowning (V31 logic, extracted) */
async function olympicCompute(server: number): Promise<OlAgg> {
  const rows = await db.score.findMany({
    where: { server },
    orderBy: [{ score: 'desc' }, { conquered: 'desc' }],
    take: 200,
  })
  const since = new Date(Date.now() - 7 * 86400000)
  /* O1/PHASE 53: هرس اسکن news — فقط اکشن‌های مصرف‌شده + سقف ۲۰۰۰ (قبلاً ۵۰۰۰ بدون فیلتر) */
  const news = await db.worldNews.findMany({
    where: { server, createdAt: { gte: since }, action: { in: OL_NEWS_ACTIONS } },
    select: { action: true, actorNick: true, createdAt: true },
    take: 2000,
  })
  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)
  const cnt: Record<string, Record<string, number>> = { warrior: {}, cyber: {}, commando: {}, missile: {}, nuke: {}, trade: {}, today: {} }
  const bump = (k: string, who: string | null) => {
    const w = (who || '').trim()
    if (!w) return
    cnt[k][w] = (cnt[k][w] || 0) + 1
  }
  for (const n of news) {
    if (n.action === 'pvp_capture') bump('warrior', n.actorNick)
    else if (n.action === 'cyber') bump('cyber', n.actorNick)
    else if (n.action === 'commando') bump('commando', n.actorNick)
    else if (n.action === 'missile') bump('missile', n.actorNick)
    else if (n.action === 'nuke') bump('nuke', n.actorNick)
    else if (n.action === 'trade') bump('trade', n.actorNick)
    if (n.createdAt >= todayUTC && ['capture', 'conquer', 'pvp_capture', 'pvp_attack'].indexOf(n.action) > -1) bump('today', n.actorNick)
  }
  const topOf = (c: Record<string, number>) =>
    Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nick, val]) => ({ nick, val }))
  const disc = [
    { key: 'empire', top: [...rows].sort((a, b) => b.conquered - a.conquered).slice(0, 3).map((r) => ({ nick: r.nick, val: r.conquered })) },
    { key: 'power', top: rows.slice(0, 3).map((r) => ({ nick: r.nick, val: r.score })) },
    { key: 'warrior', top: topOf(cnt.warrior) },
    { key: 'cyber', top: topOf(cnt.cyber) },
    { key: 'commando', top: topOf(cnt.commando) },
    { key: 'missile', top: topOf(cnt.missile) },
    { key: 'nuke', top: topOf(cnt.nuke) },
    { key: 'trade', top: topOf(cnt.trade) },
    { key: 'today', top: topOf(cnt.today) },
  ]
  const medals: Record<string, { nick: string; g: number; s: number; b: number }> = {}
  const give = (who: string | undefined, k: 'g' | 's' | 'b') => {
    if (!who) return
    const m = medals[who] || (medals[who] = { nick: who, g: 0, s: 0, b: 0 })
    m[k]++
  }
  for (const d of disc) {
    give(d.top[0]?.nick, 'g')
    give(d.top[1]?.nick, 's')
    give(d.top[2]?.nick, 'b')
  }
  const scoreOf = (nick: string) => rows.find((x) => x.nick === nick)?.score || 0
  const table = Object.values(medals)
    .map((m) => ({ ...m, total: m.g + m.s + m.b, score: scoreOf(m.nick) }))
    .sort((a, b) => b.total - a.total || b.g - a.g || b.score - a.score)
  return { server, players: rows.length, disciplines: disc, medals: table.slice(0, 20) }
}

/* champion rewards land directly in the wallet (gems + boost) and in the saved state (gold/oil/food/steel) */
async function applyOlympicRewards(uid: string) {
  const w = await ensureWallet(uid)
  const base = w.boostUntil && w.boostUntil.getTime() > Date.now() ? w.boostUntil.getTime() : Date.now()
  await db.wallet.update({
    where: { userId: uid },
    data: { gems: { increment: OL_REWARDS.gems }, boostUntil: new Date(base + OL_REWARDS.boost_hours * 3600000) },
  })
  const save = await db.save.findUnique({ where: { userId: uid } })
  if (save) {
    let obj: Record<string, unknown> = {}
    try { obj = JSON.parse(save.state || '{}') || {} } catch { obj = {} }
    const res = (obj.res || {}) as Record<string, number>
    const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0))
    res.gold = num(res.gold) + OL_REWARDS.gold
    res.oil = num(res.oil) + OL_REWARDS.oil
    res.food = num(res.food) + OL_REWARDS.food
    res.steel = num(res.steel) + OL_REWARDS.steel
    obj.res = res
    await db.save.update({ where: { userId: uid }, data: { state: JSON.stringify(obj) } })
  }
}

/* V32 weekly crowning was superseded in V33 by the Olympic Games closing ceremony
   (closeGamesEdition → crowns the Games champion into the same OlympicChampion table). */

/* ============================================================
   V33 — OLYMPIC GAMES (ایونت کامل سه‌پرده‌ای)
   30-day cycle anchored to Jan 1 2026 UTC (same as war season):
     day 16 → registration opens (pick 3 of 10 disciplines)
     day 25 → opening ceremony, Games LIVE for 5 days (truce!) — ALL 10 disciplines open
     day 30 → closing: freeze medals, crown champion, archive, rewards
   10 mini-game disciplines (all playable through the whole live window,
   "today" pair is just the featured match). Medals by COUNTRY, live table
   computed from entries during the games.
   Deterministic host city (hash of edition) so all clients agree.
   OL_OFFSET env shifts time (E2E testing only).
   ============================================================ */
const ED_ANCHOR = Date.UTC(2026, 0, 1)
const ED_LEN = 30 * 86400000
const ED_REG = 15 * 86400000
const ED_OPEN = 24 * 86400000
const ED_CLOSE = 29 * 86400000
/* V89 — Olympics V2: ۳۶ رشته در ۵ روز (۸+۷+۷+۷+۷) — توزیع خانواده‌ها بین روزها */
/* V91 — BOX5: خروجی استاندارد پروفایل بوکس (تک‌منبع برای load/save) */
type BoxingSaveRow = NonNullable<Awaited<ReturnType<typeof db.boxingSave.findUnique>>>
function boxingOut(r: BoxingSaveRow) {
  return {
    name: r.name, act: r.act, actClear: (r.actClear || '').split(',').filter(Boolean).map(Number),
    xp: r.xp, wins: r.wins, losses: r.losses, kos: r.kos, counters: r.counters, dodges: r.dodges,
    perfectRounds: r.perfectRounds, gloves: r.gloves, shorts: r.shorts, buff: r.buff,
  }
}
const GD_DAY: Record<string, number> = {
  sprint: 0, archery: 0, hurdles: 0, highjump: 0, javelin: 0, discus: 0, shotput: 0, reaction: 0,
  swim: 1, gym: 1, swim50: 1, diving: 1, rowing: 1, kayak: 1, boxing: 1,
  weight: 2, cycling: 2, moto: 2, rally: 2, formula: 2, boat: 2, fencing: 2,
  chess: 3, volley: 3, shooting: 3, movingtarget: 3, sniper: 3, rapidtarget: 3, judo: 3,
  lj: 4, wrestle: 4, football: 4, balance: 4, timing: 4, memory: 4, run400: 4,
}
/* O1: GD_MAX حذف شد — سقف ۱۰۰۰ دیگر وجود ندارد؛ مرز امتیاز = خروجی بازمحاسبه‌ی
   تله‌متری در src/lib/olyScore.ts (PHASE 2/3: حذف سقف سخت، امتیاز skill-based) */
const HOSTS: { c: string; n: string; f: string }[] = [
  { c: 'توکیو', n: 'ژاپن', f: 'jp' }, { c: 'پاریس', n: 'فرانسه', f: 'fr' }, { c: 'لس‌آنجلس', n: 'آمریکا', f: 'us' },
  { c: 'لندن', n: 'بریتانیا', f: 'gb' }, { c: 'ریودوژانیرو', n: 'برزیل', f: 'br' }, { c: 'پکن', n: 'چین', f: 'cn' },
  { c: 'آتن', n: 'یونان', f: 'gr' }, { c: 'سیدنی', n: 'استرالیا', f: 'au' }, { c: 'بارسلونا', n: 'اسپانیا', f: 'es' },
  { c: 'سئول', n: 'کره‌ی جنوبی', f: 'kr' }, { c: 'مسکو', n: 'روسیه', f: 'ru' }, { c: 'مونترال', n: 'کانادا', f: 'ca' },
  { c: 'مونیخ', n: 'آلمان', f: 'de' }, { c: 'مکزیکوسیتی', n: 'مکزیک', f: 'mx' }, { c: 'رم', n: 'ایتالیا', f: 'it' },
  { c: 'هلزینکی', n: 'فنلاند', f: 'fi' }, { c: 'آمستردام', n: 'هلند', f: 'nl' }, { c: 'استکهلم', n: 'سوئد', f: 'se' },
  { c: 'استانبول', n: 'ترکیه', f: 'tr' }, { c: 'قاهره', n: 'مصر', f: 'eg' }, { c: 'دهلی‌نو', n: 'هند', f: 'in' },
  { c: 'بوئنوس‌آیرس', n: 'آرژانتین', f: 'ar' }, { c: 'نایروبی', n: 'کنیا', f: 'ke' }, { c: 'دبی', n: 'امارات', f: 'ae' },
  { c: 'سنگاپور', n: 'سنگاپور', f: 'sg' }, { c: 'کیپ‌تاون', n: 'آفریقای جنوبی', f: 'za' }, { c: 'لیما', n: 'پرو', f: 'pe' },
  { c: 'ورشو', n: 'لهستان', f: 'pl' }, { c: 'لیسبون', n: 'پرتغال', f: 'pt' }, { c: 'لاگوس', n: 'نیجریه', f: 'ng' },
  { c: 'کوالالامپور', n: 'مالزی', f: 'my' }, { c: 'دوحه', n: 'قطر', f: 'qa' },
]
const olNow = () => Date.now() + (Number(process.env.OL_OFFSET || 0) || 0)
const hashEd = (e: number) => { let h = (e * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return h >>> 0 }
const hostOf = (edition: number) => HOSTS[hashEd(edition) % HOSTS.length]

/* ============ V53 — کنترل ادمین المپیک + مزایده‌ی میزبانی بازیکن با جم ============
   بدون تغییر اسکیما: شیفت برنامه در GameSetting('oly_shift')، مزایده در GameSetting('oly_host_e<edition>').
   gamesPhase سینک می‌ماند (مسیر داغ PvP)؛ حافظه با تاخیر حداکثر ۱۵ ثانیه از DB تازه می‌شود. */
let olyShiftMem: { edition?: number; openAt?: number; closeAt?: number } = {}
let olyShiftAt = 0
/* V58: شمارنده‌ی دورهای دستی — وقتی ادمین از فاز after دکمه‌ی افتتاحیه را می‌زند، یک دور واقعاً جدید
   شروع می‌شود: شماره‌ی دوره جلو می‌رود تا جدول مدال‌ها، رکوردها، آرشیو و مزایده‌ی میزبان همه از صفر */
let olyEdOffMem = 0
async function olyShiftRefresh(force = false) {
  if (!force && Date.now() - olyShiftAt < 15000) return
  try {
    const v = await getSetting<{ edition?: number; openAt?: number; closeAt?: number } | null>('oly_shift', null)
    olyShiftMem = v || {}
    try { olyEdOffMem = Math.max(0, Number(await getSetting<number>('oly_edoff', 0)) || 0) } catch (e) {}
    olyShiftAt = Date.now()
  } catch (e) { console.log('olyshift', e) }
}
let olyHostCache: { ed: number; v: { uid: string; nick: string; amount: number; city: string; country: string } | null; at: number } | null = null
async function olyHostGet(ed: number) {
  if (olyHostCache && olyHostCache.ed === ed && Date.now() - olyHostCache.at < 15000) return olyHostCache.v
  let v: { uid: string; nick: string; amount: number; city: string; country: string } | null = null
  try { v = await getSetting<typeof v>('oly_host_e' + ed, null) } catch (e) { console.log('olyhost', e) }
  olyHostCache = { ed, v, at: Date.now() }
  return v
}

function gamesPhase(now = olNow()) {
  /* V58: edition مؤثر = دوره‌ی زمانی + شمارنده‌ی دورهای دستی ادمین (دور جدید واقعی) */
  const edition = Math.floor((now - ED_ANCHOR) / ED_LEN) + 1 + (olyEdOffMem | 0)
  const start = ED_ANCHOR + (edition - 1) * ED_LEN
  const regAt = start + ED_REG
  /* V53: شیفت ادمین فقط برای همان دوره اعمال می‌شود — شروع فوری (openAt=now) یا پایان فوری (closeAt=now) */
  const sh = (olyShiftMem && olyShiftMem.edition === edition) ? olyShiftMem : {}
  const openAt = (typeof sh.openAt === 'number' && sh.openAt > 0) ? sh.openAt : start + ED_OPEN
  const closeAt = (typeof sh.closeAt === 'number' && sh.closeAt > 0) ? Math.max(sh.closeAt, openAt + 60000) : start + ED_CLOSE
  const nextReg = start + ED_LEN + ED_REG
  let phase: 'pre' | 'reg' | 'live' | 'after' = 'pre'
  if (now >= closeAt) phase = 'after'
  else if (now >= openAt) phase = 'live'
  else if (now >= regAt) phase = 'reg'
  const gameDay = Math.min(4, Math.max(0, Math.floor((now - openAt) / 86400000)))
  const today = phase === 'live' ? Object.keys(GD_DAY).filter((k) => GD_DAY[k] === gameDay) : []
  return { edition, phase, gameDay, regAt, openAt, closeAt, nextReg, host: hostOf(edition), today }
}

/* ============ V36 — admin event switches ============
   The game owner (isAdmin) turns global events on/off from the admin panel.
   Keys: olympic | elections | duels. Cached 15s so the hot PvP path stays cheap;
   every toggle invalidates the cache instantly. */
const EV_KEYS = ['olympic', 'elections', 'duels'] as const
type EvMap = Record<string, boolean>
let EV_CACHE: { at: number; map: EvMap } = { at: 0, map: {} }
async function eventSwitches(): Promise<EvMap> {
  if (Object.keys(EV_CACHE.map).length && Date.now() - EV_CACHE.at < 15000) return EV_CACHE.map
  const map: EvMap = { olympic: true, elections: true, duels: true }
  try {
    const rows = await db.gameSetting.findMany({ where: { key: { in: EV_KEYS.map((k) => 'event_' + k) } } })
    for (const r of rows) {
      const k = r.key.replace('event_', '')
      if ((EV_KEYS as readonly string[]).indexOf(k) > -1) map[k] = r.value === '1'
    }
  } catch (e) { console.log('evsw', e) }
  EV_CACHE = { at: Date.now(), map }
  return map
}
async function evOn(key: 'olympic' | 'elections' | 'duels'): Promise<boolean> {
  return (await eventSwitches())[key] !== false
}

/* per-discipline podium freeze (race-safe via unique (edition,discipline,rank)) */
async function freezeDiscipline(edition: number, key: string) {
  const done = await db.olympicResult.findFirst({ where: { edition, discipline: key } })
  if (done) return
  /* V89: اگر شب فینال برگزار شده، سکو از تلاش‌های فینال می‌آید — نه مقدماتی */
  const finals = await db.olympicFinalAttempt.findMany({ where: { edition, discipline: key }, orderBy: [{ score: 'desc' }], take: 3 })
  if (finals.length >= 2) {
    for (let i = 0; i < finals.length; i++) {
      try {
        await db.olympicResult.create({ data: { edition, discipline: key, rank: i + 1, userId: finals[i].userId, nick: finals[i].nick, country: null, countryFa: finals[i].countryFa, score: finals[i].score } })
      } catch (e) {
        const c = (e as { code?: string })?.code
        if (c !== 'P2002') console.log('freeze', e)
      }
    }
    await addNews(0, 'olympic_podium', key, finals[0].nick, null)
    /* V90 §36: پاداش رده‌بندی سکو (طلا/نقره/برنز) — یک‌بار چون فریز idempotent است */
    await olyRatingPodium(key, finals.map((f) => ({ userId: f.userId })))
    return
  }
  const rows = await db.olympicEntry.findMany({ where: { edition, discipline: key, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }], take: 3 })
  for (let i = 0; i < rows.length; i++) {
    try {
      await db.olympicResult.create({ data: { edition, discipline: key, rank: i + 1, userId: rows[i].userId, nick: rows[i].nick, country: rows[i].country, countryFa: rows[i].countryFa, score: rows[i].best } })
    } catch (e) {
      const c = (e as { code?: string })?.code
      if (c !== 'P2002') console.log('freeze', e)
    }
  }
  if (rows.length) {
    await addNews(0, 'olympic_podium', key, rows[0].nick, null)
    await olyRatingPodium(key, rows.map((r) => ({ userId: r.userId })))
  }
}

/* closing ceremony: freeze all, medal table by country, crown champion player,
   rewards (4 gems + 100k gold + resources + boost), participant gems, archive row.
   V33.1: the archive row is written BEFORE any reward is paid — its unique(edition)
   constraint makes concurrent lazy closes safe (only the claim winner pays out). */
async function closeGamesEdition(edition: number) {
  const exists = await db.olympicArchive.findUnique({ where: { edition } })
  if (exists) return exists
  const host = hostOf(edition)
  for (const k of Object.keys(GD_DAY)) { try { await freezeDiscipline(edition, k) } catch (e) { console.log('frz', e) } }
  const results = await db.olympicResult.findMany({ where: { edition } })
  const byC: Record<string, { country: string; countryFa: string; g: number; s: number; b: number; total: number }> = {}
  const byP: Record<string, { nick: string; userId: string; g: number; s: number; b: number; total: number }> = {}
  for (const r of results) {
    const ck = r.country || '?'
    const c = byC[ck] || (byC[ck] = { country: ck, countryFa: r.countryFa || ck, g: 0, s: 0, b: 0, total: 0 })
    if (r.rank === 1) c.g++; else if (r.rank === 2) c.s++; else c.b++
    c.total++
    const p = byP[r.userId] || (byP[r.userId] = { nick: r.nick, userId: r.userId, g: 0, s: 0, b: 0, total: 0 })
    if (r.rank === 1) p.g++; else if (r.rank === 2) p.s++; else p.b++
    p.total++
  }
  /* O4-final / PHASE 22: امتیاز کشوری وزن‌دار (G=5, S=2, B=1) — ستون نمایشی؛
     ترتیب رسمی همان کنوانسیون المپیک (طلا اول) می‌ماند */
  const table = Object.values(byC).map((c) => ({ ...c, pts: c.g * 5 + c.s * 2 + c.b })).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.total - a.total)
  const players = Object.values(byP).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b || b.total - a.total)
  const champ = players[0] || null
  const champCountry = table[0] || null
  const parts = await db.olympicEntry.findMany({ where: { edition, attempts: { gt: 0 } }, select: { userId: true } })
  const uids = [...new Set(parts.map((p) => p.userId))]
  const recs = await db.olympicRecord.findMany({ take: 10, orderBy: [{ discipline: 'asc' }] })
  const podiums: Record<string, { rank: number; nick: string; country: string; countryFa: string; score: number }[]> = {}
  for (const r of results) {
    const arr = podiums[r.discipline] || (podiums[r.discipline] = [])
    arr.push({ rank: r.rank, nick: r.nick, country: r.country || '?', countryFa: r.countryFa || r.country || '?', score: r.score })
  }
  /* CLAIM the close atomically — a second concurrent closer exits here */
  try {
    await db.olympicArchive.create({
      data: {
        edition, hostCity: host.c, hostCountry: host.n, hostCc: host.f,
        championCountry: champCountry ? champCountry.countryFa : null, championNick: champ ? champ.nick : null,
        medalsJson: JSON.stringify(podiums), tableJson: JSON.stringify(table.slice(0, 12)),
        recordsJson: JSON.stringify(recs), participants: uids.length,
      },
    })
  } catch (e) {
    const c = (e as { code?: string })?.code
    if (c === 'P2002') return await db.olympicArchive.findUnique({ where: { edition } })
    console.log('arch', e)
  }
  /* V53: جایزه‌ی میزبان دوره در اختتامیه — برنده‌ی مزایده ۵۰ جم هدیه می‌گیرد (فقط یک‌بار، مسیر برنده‌ی بستن) */
  try {
    const hst = await getSetting<{ uid: string; nick: string; amount: number } | null>('oly_host_e' + edition, null)
    if (hst && hst.uid) {
      const hw = await db.wallet.updateMany({ where: { userId: hst.uid }, data: { gems: { increment: 50 } } })
      if (hw.count === 0) console.log('olyhostpay-miss')
    }
  } catch (e) { console.log('olyhostpay', e) }
  /* ---- rewards: only the close-winner reaches this line ---- */
  if (champ) {
    const u = await db.user.findFirst({ where: { nickLower: champ.nick.toLowerCase() } })
    if (u) {
      await applyOlympicRewards(u.id)
      const terr = (await db.territory.findFirst({ where: { userId: u.id, isCapital: true } }))
        || (await db.territory.findFirst({ where: { userId: u.id } }))
      for (let s = 1; s <= 5; s++) {
        try {
          await db.olympicChampion.create({ data: { server: s, cycle: edition, userId: u.id, nick: champ.nick, country: terr ? terr.country : null, medals: champ.total, golds: champ.g, rewardGold: OL_REWARDS.gold, rewardGems: OL_REWARDS.gems } })
        } catch (e) {
          const c = (e as { code?: string })?.code
          if (c !== 'P2002') console.log('champrow', e)
        }
      }
      await addNews(0, 'olympic_champion', null, champ.nick, null)
      /* O2 / PHASE 27: دستاورد قهرمانی المپیک — از داده‌ی واقعی اختتامیه */
      try { await olyAchieveUnlock(u.id, edition, ['champion']) } catch (e) {}
    }
  }
  /* participation reward: +3 gems for everyone who actually played (atomic increment)
     V58: اگر ردیف کیف پول هنوز ساخته نشده بود، اول ساخته شود — جم شرکت‌کنندگان هیچ‌وقت گم نشود */
  /* V89: اکوسیستم رقابتی — تالار افتخارات + سکه‌ی مدال + ماموریت‌ها */
  try { await olyV89Close(edition, results) } catch (e) { console.log('olyv89close', e) }
  for (const uid of uids) {
    try {
      const inc = await db.wallet.updateMany({ where: { userId: uid }, data: { gems: { increment: OL_PARTICIPATION_GEMS } } })
      if (inc.count === 0) { await ensureWallet(uid); await db.wallet.update({ where: { userId: uid }, data: { gems: { increment: OL_PARTICIPATION_GEMS } } }) }
    } catch (e) { console.log('partgem', e) }
  }
  /* V58: جایزه‌ی نقره و برنز — قبلاً فقط قهرمان جایزه داشت؛ حالا سکوی کامل جایزه می‌گیرد:
     نقره: ۲ جم + ۳۰٬۰۰۰ طلا | برنز: ۱ جم + ۱۰٬۰۰۰ طلا (idempotent — فقط برنده‌ی claim اینجا می‌رسد) */
  const podRewards: [number, number, number][] = OL_PODIUM_REWARDS /* V72: از balance.ts */
  for (const [idx, gems, gold] of podRewards) {
    const p = players[idx]
    if (!p) continue
    try {
      const u2 = await db.user.findFirst({ where: { nickLower: p.nick.toLowerCase() } })
      if (!u2 || (champ && p.nick.toLowerCase() === champ.nick.toLowerCase())) continue
      const inc2 = await db.wallet.updateMany({ where: { userId: u2.id }, data: { gems: { increment: gems } } })
      if (inc2.count === 0) { await ensureWallet(u2.id); await db.wallet.update({ where: { userId: u2.id }, data: { gems: { increment: gems } } }) }
      const sv2 = await db.save.findUnique({ where: { userId: u2.id } })
      if (sv2) {
        let ob: Record<string, unknown> = {}
        try { ob = JSON.parse(sv2.state || '{}') || {} } catch { ob = {} }
        const rs = (ob.res || {}) as Record<string, number>
        rs.gold = Math.max(0, Math.round(Number(rs.gold) || 0)) + gold
        ob.res = rs
        await db.save.update({ where: { userId: u2.id }, data: { state: JSON.stringify(ob) } })
      }
    } catch (e) { console.log('podreward', e) }
  }
  await addNews(0, 'olympic_close', null, champ ? champ.nick : null, champCountry ? champCountry.countryFa : null)
  return { edition, table, champ }
}

/* lazy trigger: close any edition whose time has come (also covers missed closes) */
async function ensureGamesClosed() {
  const now = olNow()
  const cur = gamesPhase(now)
  const prev = gamesPhase(now - ED_LEN)
  const cands = new Set<number>()
  if (now >= cur.closeAt) cands.add(cur.edition)
  if (prev.edition < cur.edition && now >= prev.closeAt) cands.add(prev.edition)
  for (const e of [...cands].sort((a, b) => a - b).slice(-2)) {
    try { await closeGamesEdition(e) } catch (err) { console.log('closeEd', err) }
  }
}

async function latestChampion(server: number) {
  return db.olympicChampion.findFirst({ where: { server, nick: { not: '' } }, orderBy: [{ cycle: 'desc' }] })
}

/* keep the crown on the champion's CURRENT capital: refresh country on every status poll
   (cheap — only runs for the latest champion row; covers capital moves after crowning) */
async function refreshChampCountry(server: number, latest: Awaited<ReturnType<typeof latestChampion>>) {
  if (!latest || !latest.nick) return latest
  try {
    const u = await db.user.findFirst({ where: { nickLower: latest.nick.toLowerCase() } })
    if (!u) return latest
    const terr = (await db.territory.findFirst({ where: { server, userId: u.id, isCapital: true } }))
      || (await db.territory.findFirst({ where: { server, userId: u.id } }))
    if (terr && terr.country !== latest.country) {
      await db.olympicChampion.update({ where: { id: latest.id }, data: { country: terr.country } })
      return { ...latest, country: terr.country }
    }
  } catch (e) { console.log('olcc', e) }
  return latest
}

const olPublic = (r: { nick: string; country: string | null; medals: number; golds: number; cycle: number; createdAt: Date } | null) =>
  r ? { nick: r.nick, country: r.country || null, medals: r.medals, golds: r.golds, cycle: r.cycle, at: r.createdAt.toISOString() } : null

/* ============================================================
   V34 — social & competitive layer
   daily streak · duels (+bets/spectate) · revenge · battle heatmap
   world elections · mentorship · alliances
   ============================================================ */
const DAY_MS = 86400000
const dayKey = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10)

/* 7-day escalating streak cycle (auto-claimed on first wallet fetch of the day) */
const STREAK_CYCLE = [
  { gold: 5000, oil: 0, food: 0, gems: 0, boost_h: 0 },
  { gold: 9000, oil: 0, food: 0, gems: 0, boost_h: 0 },
  { gold: 12000, oil: 3000, food: 0, gems: 0, boost_h: 0 },
  { gold: 15000, oil: 0, food: 3000, gems: 0, boost_h: 0 },
  { gold: 20000, oil: 4000, food: 0, gems: 0, boost_h: 0 },
  { gold: 25000, oil: 0, food: 4000, gems: 0, boost_h: 0 },
  { gold: 40000, oil: 0, food: 0, gems: 5, boost_h: 12 },
]

async function streakTick(userId: string, server: number, nick: string) {
  const today = dayKey()
  const row = await db.dailyStreak.findUnique({ where: { userId } })
  if (row && row.lastDay === today) {
    return { streak: row.streak, best: row.best, total: row.totalClaims, claimed: false, day_in_cycle: ((row.streak - 1) % 7) + 1, reward: null as null | typeof STREAK_CYCLE[number] }
  }
  const yest = dayKey(Date.now() - DAY_MS)
  const streak = row && row.lastDay === yest ? row.streak + 1 : 1
  const best = Math.max(streak, row ? row.best : 0)
  const rw = STREAK_CYCLE[(streak - 1) % 7]
  if (!row) {
    try { await db.dailyStreak.create({ data: { userId, server, streak, best, lastDay: today, totalClaims: 1 } }) } catch (e) {
      /* concurrent first-claim: re-read and bail — the winner already granted today */
      const cur = await db.dailyStreak.findUnique({ where: { userId } })
      if (cur && cur.lastDay === today) return { streak: cur.streak, best: cur.best, total: cur.totalClaims, claimed: false, day_in_cycle: ((cur.streak - 1) % 7) + 1, reward: null }
      throw e
    }
  } else {
    /* V83sec (AUDIT-C P2): آپدیت شرطی — دو get_wallet همزمان هر دو جایزه نمی‌گیرند
       (قبلاً گارد read-then-write بود؛ پیروزی مشروط به lastDay≠today) */
    const upd = await db.dailyStreak.updateMany({ where: { userId, NOT: { lastDay: today } }, data: { streak, best, lastDay: today, totalClaims: { increment: 1 } } })
    if (upd.count === 0) {
      const cur = await db.dailyStreak.findUnique({ where: { userId } })
      if (cur && cur.lastDay === today) return { streak: cur.streak, best: cur.best, total: cur.totalClaims, claimed: false, day_in_cycle: ((cur.streak - 1) % 7) + 1, reward: null as null | typeof STREAK_CYCLE[number] }
    }
  }
  /* deliver the reward: resources into the save (server-authoritative), gems/boost into wallet */
  if (rw.gold || rw.oil || rw.food) {
    await tradeApply(userId, (r) => {
      r.gold = resNum(r.gold) + rw.gold
      if (rw.oil) r.oil = resNum(r.oil) + rw.oil
      if (rw.food) r.food = resNum(r.food) + rw.food
    }).catch(() => {})
  }
  if (rw.gems) await db.wallet.updateMany({ where: { userId }, data: { gems: { increment: rw.gems } } }).catch(() => {})
  if (rw.boost_h) {
    try {
      const w = await ensureWallet(userId)
      const until = new Date(Math.max(Date.now(), w.boostUntil ? w.boostUntil.getTime() : 0) + rw.boost_h * 3600_000)
      await db.wallet.update({ where: { userId }, data: { boostUntil: until } })
    } catch (e) { console.log('streakboost', e) }
  }
  await addNews(server, 'streak_day', null, nick, String(streak))
  return { streak, best, total: (row ? row.totalClaims : 0) + 1, claimed: true, day_in_cycle: ((streak - 1) % 7) + 1, reward: rw }
}

/* ---------- duels: 30-min invite window → 2h live war window (works DURING the olympic truce) ---------- */
const DUEL_INVITE_MS = 30 * 60_000
const DUEL_LIVE_MS = 2 * 3600_000
const DUEL_PRIZE_GOLD = 15000
const DUEL_PRIZE_GEMS = 2
const BET_RAKE = 0.05

async function sweepDuels(server: number) {
  const now = new Date()
  const dead = await db.duel.findMany({ where: { server, status: { in: ['open', 'live'] }, expiresAt: { lt: now } }, select: { id: true, status: true } })
  for (const d of dead) {
    const cl = await db.duel.updateMany({ where: { id: d.id, status: d.status }, data: { status: 'expired' } })
    if (cl.count) await settleDuelBets(d.id, null)
  }
}

async function settleDuelBets(duelId: string, winnerUid: string | null) {
  const bets = await db.duelBet.findMany({ where: { duelId, settled: false } })
  if (!bets.length) return
  const pool = bets.reduce((s, b) => s + b.amount, 0)
  const winBets = winnerUid ? bets.filter((b) => b.onUid === winnerUid) : []
  const winPool = winBets.reduce((s, b) => s + b.amount, 0)
  for (const b of bets) {
    let paid = 0
    if (!winnerUid) paid = b.amount /* nobody won → full refund */
    else if (winPool > 0 && b.onUid === winnerUid) paid = Math.floor(b.amount * (1 - BET_RAKE) * pool / winPool)
    if (paid > 0) await tradeApply(b.userId, (r) => { r.gold = resNum(r.gold) + paid }).catch(() => {})
    await db.duelBet.update({ where: { id: b.id }, data: { settled: true, paid } }).catch(() => {})
  }
}

async function resolveDuel(server: number, aUid: string, bUid: string, winnerUid: string, winnerNick: string, loserNick: string) {
  const duel = await db.duel.findFirst({
    where: { server, status: 'live', OR: [{ fromUid: aUid, toUid: bUid }, { fromUid: bUid, toUid: aUid }] },
    orderBy: { createdAt: 'desc' },
  })
  if (!duel) return null
  const cl = await db.duel.updateMany({ where: { id: duel.id, status: 'live' }, data: { status: 'done', winnerUid, winnerNick } })
  if (cl.count === 0) return null
  /* winner prize */
  await tradeApply(winnerUid, (r) => { r.gold = resNum(r.gold) + DUEL_PRIZE_GOLD }).catch(() => {})
  await db.wallet.updateMany({ where: { userId: winnerUid }, data: { gems: { increment: DUEL_PRIZE_GEMS } } }).catch(() => {})
  await settleDuelBets(duel.id, winnerUid)
  await addNews(server, 'duel_done', null, winnerNick, loserNick)
  return { duel_id: duel.id, prize_gold: DUEL_PRIZE_GOLD, prize_gems: DUEL_PRIZE_GEMS }
}

/* ---------- world elections: 10-day cycles (anchored to epoch, all clients agree) ---------- */
const ELEC_MS = 10 * DAY_MS
const elecCycle = (ms = Date.now()) => Math.floor(ms / ELEC_MS)
const ELEC_PRIZE_GEMS = 30

async function electionFinalize(server: number, cycle: number) {
  const done = await db.electionWinner.findUnique({ where: { server_cycle: { server, cycle } } })
  if (done) return done
  const votes = await db.electionVote.groupBy({ by: ['toUid'], where: { server, cycle }, _count: { toUid: true } })
  if (!votes.length) return null
  votes.sort((a, b) => b._count.toUid - a._count.toUid)
  const top = votes[0]
  const cand = await db.electionCandidate.findFirst({ where: { server, cycle, userId: top.toUid } })
  try {
    const w = await db.electionWinner.create({ data: { server, cycle, userId: top.toUid, nick: cand ? cand.nick : '—', votes: top._count.toUid } })
    await db.wallet.updateMany({ where: { userId: top.toUid }, data: { gems: { increment: ELEC_PRIZE_GEMS } } }).catch(() => {})
    await addNews(server, 'election_win', null, w.nick, String(top._count.toUid))
    return w
  } catch (e) {
    const c = (e as { code?: string })?.code
    if (c !== 'P2002') console.log('elec', e)
    return db.electionWinner.findUnique({ where: { server_cycle: { server, cycle } } })
  }
}

/* every status call lazily finalizes the previous cycle before reporting the current one */
async function electionSweep(server: number) {
  const cur = elecCycle()
  for (const c of [cur - 2, cur - 1]) { try { await electionFinalize(server, c) } catch (e) { console.log('elecsweep', e) } }
}

const elecPublic = (w: { nick: string; cycle: number; votes: number } | null) => w ? { nick: w.nick, cycle: w.cycle, votes: w.votes } : null

/* ---------- alliance badge map (chat/leaderboard tags) ---------- */
async function allianceTagMap(server: number): Promise<Record<string, string>> {
  const mem = await db.allianceMember.findMany({
    where: { alliance: { server } },
    select: { userId: true, alliance: { select: { tag: true } } },
    take: 400,
  })
  const out: Record<string, string> = {}
  for (const m of mem) out[m.userId] = m.alliance.tag
  return out
}

/* ============================================================
   V67 — COUNTRY VIEW ENGINE (Server-Authoritative)
   قواعد سخت این بخش:
   1. Layout استان‌ها فقط سرور (cvGeo از GeoJSON واقعی) — یک‌بار صادر و ذخیره.
   2. هزینه/زمان/سطح/قواعد جغرافیا فقط از cvCatalog سمت سرور؛ کلاینت فقط p_type/p_province/p_slot می‌فرستد.
   3. مالکیت کشور پیش از هر اقدام از جدول territories (منبع حقیقت) چک می‌شود.
   4. هزینه از استخراج منابع واقعی بازی (saves.state.res) با گارد کسر می‌شود — نه جم، نه آرایه‌ی جعلی کلاینت.
   5. تولید lazy-at-read + سقف ۸ ساعت آفلاین + باقیمانده‌ی کسری (rem) تا چیزی گم نشود.
   6. Idempotency: reqId یکتا در cv_build/cv_upgrade — دبل‌کلیک و ریتِرای دوباره کسر نمی‌کند.
   7. قفل درون‌حافظه‌ای هر کاربر برای جلوگیری از دو-خرج‌کردن همزمان (حتی با چند تب).
   8. کشورِ باخته: ساختمان‌ها فریز می‌شوند (تولید صفر، مدیریت قفل) و با بازپس‌گیری زنده می‌شوند.
   ============================================================ */
type CvProv = { i: number; lat: number; lng: number; type: string; terrain: string; coastal: boolean; slots: number }
type CvTechState = { eco?: number; mil?: number; log?: number }
type CvCountryRow = { userId: string; country: string; server: number; seed: number; provinces: string; tech: string; rp: number; rem: string; lastTick: Date; createdAt: Date; updatedAt: Date }
type CvBuildingRow = { id: string; userId: string; country: string; server: number; province: number; slot: number; type: string; level: number; status: string; startedAt: Date; doneAt: Date | null; reqId: string | null }

function cvJson<T>(s: string | null | undefined, fb: T): T {
  try { const v = JSON.parse(s || '') ; return (v == null ? fb : v) as T } catch { return fb }
}

/* قفل هر کاربر — هر اقدام CV داخل این می‌رود تا read-modify-write روی منابع/lastTick امن باشد */
const CV_LOCKS = new Map<string, Promise<unknown>>()
async function cvWithLock<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  const prev = CV_LOCKS.get(uid) || Promise.resolve()
  const run = prev.then(fn, fn)
  CV_LOCKS.set(uid, run.catch(() => {}))
  return run
}

async function cvEnsure(userId: string, server: number, country: string): Promise<{ cv: CvCountryRow; provinces: CvProv[]; owned: boolean }> {
  /* V74: گارد کشور — فقط کشورهای موجود در GeoJSON رسمی ردیف می‌گیرند (ضد ردیف‌های بی‌معنا) */
  if (!cvCountryExists(country)) return { cv: null as unknown as CvCountryRow, provinces: [], owned: false }
  let cv = await db.cvCountry.findUnique({ where: { userId_country: { userId, country } } }) as CvCountryRow | null
  if (!cv) {
    const { seed, provinces } = cvGenerateLayout(country)
    const created = await db.cvCountry.create({ data: { userId, country, server, seed, provinces: JSON.stringify(provinces) } }).catch(() => null)
    cv = (created || await db.cvCountry.findUnique({ where: { userId_country: { userId, country } } })) as CvCountryRow | null
  }
  if (!cv) throw new Error('cv_ensure_failed')
  const terr = await db.territory.findUnique({ where: { server_country: { server, country } } })
  return { cv, provinces: cvJson<CvProv[]>(cv.provinces, []), owned: !!terr && terr.userId === userId }
}

async function cvReadRes(userId: string): Promise<{ gold: number; oil: number; food: number }> {
  const save = await db.save.findUnique({ where: { userId }, select: { state: true } })
  const st = cvJson<Record<string, unknown>>(save?.state || '{}', {})
  const res = cvJson<Record<string, number>>(typeof st.res === 'string' ? st.res : JSON.stringify(st.res || {}), {})
  return { gold: Math.round(Number(res.gold) || 0), oil: Math.round(Number(res.oil) || 0), food: Math.round(Number(res.food) || 0) }
}

/* کسر هزینه‌ی ساخت — با گارد؛ داخل cvWithLock صدا زده می‌شود */
async function cvSpend(userId: string, cost: { g: number; o: number; f: number }): Promise<boolean> {
  const save = await db.save.findUnique({ where: { userId } })
  if (!save) return false
  const { obj, res } = tradeRes(save.state)
  const g = Number(res.gold) || 0, o = Number(res.oil) || 0, f = Number(res.food) || 0
  if (g < cost.g || o < cost.o || f < cost.f) return false
  res.gold = g - cost.g; res.oil = o - cost.o; res.food = f - cost.f
  obj.res = res
  await db.save.update({ where: { userId }, data: { state: JSON.stringify(obj) } })
  return true
}

/* انباشت تولید — lazy-at-read؛ ساخت‌وسازهای تمام‌شده هم اینجا نهایی می‌شوند */
async function cvAccrue(userId: string, cv: CvCountryRow, buildings: CvBuildingRow[]) {
  const now = Date.now()
  const finished = buildings.filter((b) => b.status === 'building' && b.doneAt && b.doneAt.getTime() <= now)
  if (finished.length) await db.cvBuilding.updateMany({ where: { id: { in: finished.map((b) => b.id) } }, data: { status: 'active' } })
  const doneIds = new Set(finished.map((b) => b.id))
  const tech = cvJson<CvTechState>(cv.tech, {})
  const mults = cvTechMults(tech)
  const focus = cvFocusMap(tech) /* V74: تخصصی‌سازی استان — ذخیره در همان JSON فناوری */
  const rates = { gold: 0, oil: 0, food: 0, rp: 0 }
  let goldPct = 0, atkPct = 0, defPct = 0, oilCap = 0, ports = 0, airports = 0
  for (const b of buildings) {
    if (b.status !== 'active' && !doneIds.has(b.id)) continue
    const def = cvDef(b.type)
    if (!def) continue
    const fm = cvFocusMult(b.type, focus[String(b.province)]) /* V74: ×۱٫۱ اگر استان تخصص همان گروه باشد */
    const p = cvProdPerMin(def, b.level)
    rates.gold += (p.gold || 0) * fm; rates.oil += (p.oil || 0) * fm; rates.food += (p.food || 0) * fm; rates.rp += (p.rp || 0) * fm
    if (def.goldPct) goldPct += def.goldPct * b.level
    if (def.atkPct) atkPct += def.atkPct * b.level * (fm > 1 ? 1.1 : 1)
    if (def.defPct) defPct += def.defPct * b.level * (fm > 1 ? 1.1 : 1)
    if (def.oilCap) oilCap += def.oilCap * b.level
    if (b.type === 'port') ports++
    if (b.type === 'airport') airports++
  }
  rates.gold = Math.round(rates.gold * mults.eco * 100) / 100
  rates.oil = Math.round(rates.oil * mults.eco * 100) / 100
  rates.food = Math.round(rates.food * mults.eco * 100) / 100
  const elapsed = Math.min(CV_OFFLINE_CAP_MS, Math.max(0, now - cv.lastTick.getTime()))
  const mins = elapsed / 60000
  const rem = cvJson<Record<string, number>>(cv.rem, {})
  const gain = { gold: 0, oil: 0, food: 0 }
  for (const k of ['gold', 'oil', 'food'] as const) {
    const tot = rates[k] * mins * (k === 'gold' ? 1 + goldPct / 100 : 1) + (rem[k] || 0)
    gain[k] = Math.floor(tot)
    rem[k] = Math.round((tot - gain[k]) * 100) / 100
  }
  const rpGain = Math.round(rates.rp * mins * 100) / 100
  /* V68 — §7 دستور کار: سقف ذخیره روی انباشت CV اعمال می‌شود (قبلاً oilCap محاسبه می‌شد ولی هیچ‌جا clamp نمی‌شد).
     فرمول نفت = همان oilStorageCap کلاینت (۶۰۰۰ + ۱۲۰۰×قلمرو + ۶۰۰۰×انبار لابی) + ۲۵۰۰×سطح انبار CV همان کشور.
     غذا = ۹۰۰۰ + ۲۵۰۰×قلمرو (هم‌فرمول fc کلاینت). تولید مازاد بر سقف اتلاف می‌شود — مثل رفتار زنده‌ی نقشه. */
  let capOil = 0, capFood = 0
  try {
    const terrN = await territoryCount(userId, cv.server)
    const saveRow = await db.save.findUnique({ where: { userId }, select: { state: true } })
    const stJ = cvJson<Record<string, unknown>>(saveRow?.state || '{}', {})
    const infraJ = cvJson<Record<string, number>>(typeof stJ.infra === 'string' ? stJ.infra : JSON.stringify(stJ.infra || {}), {})
    let cvStorageLvl = 0
    for (const b of buildings) {
      if (b.type !== 'storage') continue
      if (b.status !== 'active' && !(b.doneAt && b.doneAt.getTime() <= now)) continue
      cvStorageLvl += b.level
    }
    capOil = 6000 + 1200 * terrN + 6000 * (Number(infraJ.storage) || 0) + 2500 * cvStorageLvl
    capFood = 9000 + 2500 * terrN
  } catch (e) { console.log('cvcap', e) }
  if (gain.gold || gain.oil || gain.food || rpGain > 0 || finished.length) {
    await db.$transaction(async (tx) => {
      if (gain.gold || gain.oil || gain.food) {
        await tradeApply(userId, (r) => {
          if (capOil > 0) gain.oil = Math.max(0, Math.min(gain.oil, Math.max(0, capOil - (Number(r.oil) || 0))))
          if (capFood > 0) gain.food = Math.max(0, Math.min(gain.food, Math.max(0, capFood - (Number(r.food) || 0))))
          r.gold = (Number(r.gold) || 0) + gain.gold
          r.oil = (Number(r.oil) || 0) + gain.oil
          r.food = (Number(r.food) || 0) + gain.food
        }, tx)
      }
      await tx.cvCountry.update({
        where: { userId_country: { userId, country: cv.country } },
        data: { lastTick: new Date(), ...(rpGain > 0 ? { rp: { increment: rpGain } } : {}), rem: JSON.stringify(rem) },
      })
    })
  }
  return {
    rates, goldPct, oilCap, ports, airports, accrued: gain, rpAccrued: rpGain, elapsedMs: elapsed,
    mil: { atkPct: Math.round(atkPct * mults.mil * 10) / 10, defPct: Math.round(defPct * 10) / 10 },
  }
}

type CvSum = Awaited<ReturnType<typeof cvAccrue>>
function cvPublicState(owned: boolean, country: string, server: number, provinces: CvProv[], buildings: CvBuildingRow[], cv: CvCountryRow, rpLive: number, sum: CvSum, res: { gold: number; oil: number; food: number }) {
  const techJ = cvJson<CvTechState>(cv.tech, {})
  return {
    ok: true, owned, country, server,
    /* V74: هویت استان‌ها (آمار + شهرها) از روی seed قطعی — بدون تغییر DB، ردیف‌های قدیمی هم هویت می‌گیرند */
    provinces: cvEnrich(country, cv.seed, provinces),
    seed: cv.seed,
    focus: cvFocusMap(techJ),
    focusCat: CV_FOCUS,
    buildings: owned ? buildings : [],
    cat: cvCatalogPublic(), techCat: CV_TECH,
    tech: techJ, rp: Math.round(rpLive * 100) / 100,
    rates: { gold: Math.round(sum.rates.gold), oil: Math.round(sum.rates.oil), food: Math.round(sum.rates.food), rp: sum.rates.rp },
    mil: sum.mil, goldPct: sum.goldPct, oilCapAdd: sum.oilCap, counts: { ports: sum.ports, airports: sum.airports },
    res, accrued: sum.accrued, offlineCapMs: CV_OFFLINE_CAP_MS, maxLevel: CV_MAX_LEVEL, now: Date.now(),
  }
}

/* ============================================================
   V68 — §9 دستور کار: اثر واقعی Country View روی نبرد سرور.
   مهاجم: جمع atkPct همه‌ی کشورهای CV او (پادگان فعال × سطح × ضریب فناوری mil —
   همان زنجیره‌ی cvAccrue.mil) — سقف ۲۵٪.
   مدافع: defPct خطوط دفاعی فعال در همان کشورِ زیر حمله — سقف ۳۰٪.
   فقط ساختمان‌های فعال (status=active یا doneAt گذشته)؛ ساخت ناتمام اثری ندارد.
   سرور مرجع است؛ کلاینت هیچ عددی به این زنجیره نمی‌فرستد.
   ============================================================ */
const CV_PVP_ATK_CAP = 25
const CV_PVP_DEF_CAP = 30
async function cvMilBonus(userId: string, country?: string): Promise<{ atkPct: number; defPct: number }> {
  const now = Date.now()
  const cvs = (await db.cvCountry.findMany({ where: { userId, ...(country ? { country } : {}) } })) as CvCountryRow[]
  if (!cvs.length) return { atkPct: 0, defPct: 0 }
  const blds = (await db.cvBuilding.findMany({ where: { userId, ...(country ? { country } : {}) } })) as CvBuildingRow[]
  let atk = 0, def = 0
  for (const cv of cvs) {
    const mults = cvTechMults(cvJson<CvTechState>(cv.tech, {}))
    const focus = cvFocusMap(cvJson<CvTechState>(cv.tech, {})) /* V74: تخصص نظامی استان — بونوس ۱۰٪ */
    for (const b of blds) {
      if (b.country !== cv.country) continue
      if (b.status !== 'active' && !(b.doneAt && b.doneAt.getTime() <= now)) continue
      const d = cvDef(b.type)
      if (!d) continue
      const fm = cvFocusMult(b.type, focus[String(b.province)])
      if (d.atkPct) atk += d.atkPct * b.level * mults.mil * fm
      if (d.defPct) def += d.defPct * b.level * fm
    }
  }
  return {
    atkPct: Math.min(CV_PVP_ATK_CAP, Math.round(atk * 10) / 10),
    defPct: Math.min(CV_PVP_DEF_CAP, Math.round(def * 10) / 10),
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ fn: string }> }) {
  const { fn } = await ctx.params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ data: null, error: { message: 'not authenticated', code: '401' } })
  /* V59 wave-2 (§17): global RPC flood guard — 240 calls / minute / user (pollers use ~40) */
  const rl = rateLimit(req, 'rpc:' + user.id, 240, 60_000)
  if (rl) return rl
  let args: Record<string, unknown> = {}
  try { args = await req.json() } catch {}
  const R = (data: unknown) => NextResponse.json({ data, error: null })

  try {
    switch (fn) {
      /* ---------------- wallet / shop ---------------- */
      /* U7 — وضعیت عملیات هفتگی اتحاد + واریز جایزه‌ی تکمیل (هر عضو یک‌بار، اتمیک) */
      case 'alliance_op': {
        const memOp = await db.allianceMember.findFirst({ where: { userId: user.id } })
        if (!memOp) return R({ ok: true, has_alliance: false })
        const wk = opWeekKey()
        const op = await db.allianceOp.findUnique({ where: { allianceId_weekKey: { allianceId: memOp.allianceId, weekKey: wk } } })
        if (!op) return R({ ok: true, has_alliance: true, op: null })
        const rewarded = JSON.parse(op.rewarded || '[]') as string[]
        let rewardedNow = 0
        if (op.doneAt && !rewarded.includes(user.id)) {
          try {
            await db.$transaction([
              db.wallet.updateMany({ where: { userId: user.id }, data: { gems: { increment: 30 } } }),
              db.allianceOp.update({ where: { id: op.id }, data: { rewarded: JSON.stringify([...rewarded, user.id]) } }),
            ])
            rewardedNow = 30
          } catch (e) { console.log('alliance_op reward', e) }
        }
        const members = await db.allianceMember.count({ where: { allianceId: memOp.allianceId } })
        const contribs = JSON.parse(op.contribs || '{}') as Record<string, number>
        const top = Object.entries(contribs).sort((a, b) => (b[1] || 0) - (a[1] || 0)).slice(0, 10).map(([u, v]) => ({ u, v }))
        return R({ ok: true, has_alliance: true, op: { week_key: wk, goal: op.goal, progress: op.progress, done: !!op.doneAt, my: contribs[user.id] || 0, members, rewarded_now: rewardedNow, top } })
      }
      /* U8 — تلومتری پرفورمنس واقعی-دستگاه: فلاش ۶۰ثانیه‌ای کلاینت، مرزها سخت، سقف ۴۸ نمونه در روز */
      case 'perf_push': {
        const avg = Math.max(0, Math.min(240, Math.round(Number(args.p_avg) || 0)))
        const min = Math.max(0, Math.min(240, Math.round(Number(args.p_min) || 0)))
        const worst = ['map', 'oly3d', 'box5'].indexOf(String(args.p_worst)) >= 0 ? String(args.p_worst) : 'map'
        const device = String(args.p_device || '').slice(0, 60)
        let samples: Array<{ e: string; a: number; m: number; n: number }> = []
        try {
          const rawPf = args.p_samples
          const parsedPf: Array<Record<string, unknown>> = Array.isArray(rawPf) ? (rawPf as Array<Record<string, unknown>>) : (typeof rawPf === 'string' ? JSON.parse(rawPf) : [])
          samples = parsedPf
            .filter((s) => s && ['map', 'oly3d', 'box5'].indexOf(String(s.e)) >= 0 && Number(s.a) > 0 && Number(s.a) <= 240)
            .slice(-48)
            .map((s) => ({ e: String(s.e).slice(0, 8), a: Math.round(Number(s.a)), m: Math.min(240, Math.max(0, Math.round(Number(s.m) || Number(s.a)))), n: Math.min(120, Math.max(1, Math.round(Number(s.n) || 1))) }))
        } catch {}
        if (!avg && !samples.length) return R({ ok: true, stored: 0 })
        const dayKey = new Date(olNow()).toISOString().slice(0, 10)
        const prev = await db.perfDaily.findUnique({ where: { userId_dayKey: { userId: user.id, dayKey } } })
        let merged = samples
        if (prev) { try { const old = JSON.parse(prev.samples || '[]') as Array<{ e: string; a: number; m: number; n: number }>; merged = [...old, ...samples].slice(-48) } catch {} }
        const avgFps = merged.length ? Math.round(merged.reduce((s, x) => s + x.a, 0) / merged.length) : avg
        const minFps = merged.length ? merged.reduce((m, x) => Math.min(m, x.m), 240) : min
        const worstEngine = merged.length ? merged.slice().sort((a, b) => a.m - b.m)[0].e : worst
        await db.perfDaily.upsert({ where: { userId_dayKey: { userId: user.id, dayKey } }, create: { userId: user.id, dayKey, samples: JSON.stringify(merged), avgFps, minFps, worstEngine, device }, update: { samples: JSON.stringify(merged), avgFps, minFps, worstEngine, device } })
        return R({ ok: true, stored: merged.length })
      }
      /* U8 — گزارش تجمیعی ۱۴ روز اخیر (فقط ادمین) */
      case 'perf_report': {
        if (!user.isAdmin) return R({ ok: false, reason: 'admin' })
        const since = new Date(Date.now() - 14 * 86400000)
        const rows = await db.perfDaily.findMany({ where: { updatedAt: { gte: since } }, orderBy: { updatedAt: 'desc' }, take: 400 })
        const byDay: Record<string, { n: number; sum: number; min: number; eng: Record<string, number> }> = {}
        for (const r2 of rows) {
          const d = r2.dayKey
          byDay[d] = byDay[d] || { n: 0, sum: 0, min: 240, eng: {} }
          byDay[d].n++; byDay[d].sum += r2.avgFps; byDay[d].min = Math.min(byDay[d].min, r2.minFps)
          byDay[d].eng[r2.worstEngine] = (byDay[d].eng[r2.worstEngine] || 0) + 1
        }
        return R({ ok: true, days: Object.entries(byDay).map(([day, v]) => ({ day, users: v.n, avg: Math.round(v.sum / v.n), min: v.min, worst: v.eng })).sort((a, b) => a.day.localeCompare(b.day)) })
      }
      case 'get_wallet': {
        const serverW = Math.max(1, Number(args.p_server) || 1)
        const { w, granted, vipGranted } = await dailyBonus(user.id)
        /* V34: the daily streak ticks on the first wallet fetch of the day (atomic, race-safe) */
        let streak: Awaited<ReturnType<typeof streakTick>> | null = null
        try { streak = await streakTick(user.id, serverW, user.nick) } catch (e) { console.log('streak', e) }
        return R({ ok: true, gems: w.gems, boost_until: w.boostUntil ? w.boostUntil.toISOString() : null, daily_granted: granted, vip_granted: vipGranted ?? 0,
          vip_until: w.vipUntil ? w.vipUntil.toISOString() : null,
          tg_bonus: w.tgBonus,
          streak: streak ? { streak: streak.streak, best: streak.best, claimed: streak.claimed, day_in_cycle: streak.day_in_cycle, reward: streak.reward } : null })
      }
      /* ---------------- V86 — پاداش یک‌بارمصرف عضویت تلگرام (+۲۰ جم) ----------------
         ادعا با updateMany اتمی روی tgBonus:false — حتی درخواست‌های همزمان هم فقط یکی پاس می‌شود */
      case 'tg_bonus': {
        await ensureWallet(user.id)
        const tupd = await db.wallet.updateMany({ where: { userId: user.id, tgBonus: false }, data: { tgBonus: true, gems: { increment: TG_GEMS } } })
        const tw = await ensureWallet(user.id)
        if (tupd.count === 0) return R({ ok: false, error: 'claimed', gems: tw.gems })
        return R({ ok: true, gems: tw.gems, granted: TG_GEMS })
      }
      /* V86 — متادیتای سرورها: لیست سرورهای تستی (کلاینت درب ورود را می‌بندد؛ گارد واقعی در territory_sync/pvp_capture است) */
      case 'srv_meta':
        return R({ test_srvs: await testSrvsGet() })
      case 'spend_gems':
      case 'shop_buy': {
        /* V66: موتور واحد خرید — هر دو مسیر RPC همین‌جا می‌روند.
           قیمت/موجودیت/مالکیت/پنجره/قرعه فقط سمت سرور؛ کلاینت فقط p_item می‌فرستد.
           p_request_id اختیاری: Idempotency ضد دبل-پرداخت (کلاینت UUID یک‌بارمصرف می‌سازد). */
        const rb = await shopBuy(user.id, String(args.p_item || ''), args.p_request_id ? String(args.p_request_id).slice(0, 80) : null)
        return R(rb)
      }

      /* V118 — شارژ جم از خرید واقعی مایکت (IAB v3).
         ورودی: p_sku (gems_*) + p_token (purchaseToken خام مایکت) + p_order_id اختیاری.
         امنیت: مبلغ جم هرگز از کلاینت پذیرفته نمی‌شود (SHOP_PACKS سرور = تنها منبع)؛
         رسید با API رسمی مایکت راستی‌آزمایی می‌شود؛ ضد دوباره‌اعمال با id قطعی
         «MYKTX-<token>» در shop_purchases — توکن تکراری در سطح دیتابیس رد می‌شود (P2002). */
      case 'shop_gem_topup': {
        const sku = String(args.p_sku || '').trim()
        const token = String(args.p_token || '').trim()
        if (!/^gems_[a-z0-9_]{2,40}$/.test(sku)) return R({ ok: false, error: 'sku' })
        if (!/^[\w.\-]{8,256}$/.test(token)) return R({ ok: false, error: 'receipt' })
        const pack = SHOP_PACKS.find((p) => p.id === sku)
        if (!pack) return R({ ok: false, error: 'sku' })
        /* رسیدِ تکراری: اگر همین توکن قبلاً برای هر حسابی گرنت خورده باشد اینجا پیدایش می‌کنیم */
        const prior = await db.shopPurchase.findFirst({ where: { requestId: token, status: 'ok' } })
        if (prior && prior.userId !== user.id) return R({ ok: false, error: 'receipt' }) /* رسید متعلق به حساب دیگری است */
        if (prior) return R({ ok: true, duplicate: true, gems_added: 0, wallet: { gems: (await ensureWallet(user.id)).gems } })
        const ver = await verifyProviderReceipt('myket', token, user, sku)
        if (!ver.ok) return R({ ok: false, error: ver.error })
        try {
          await db.$transaction(async (tx) => {
            await tx.shopPurchase.create({ data: { id: 'MYKTX-' + token, userId: user.id, itemId: sku, price: 0, currency: 'toman', status: 'ok', provider: 'myket', requestId: token, meta: JSON.stringify({ kind: 'gem_topup', gems: pack.gems, order_id: String(args.p_order_id || '').slice(0, 80) }) } })
            await tx.wallet.update({ where: { userId: user.id }, data: { gems: { increment: pack.gems } } })
          })
        } catch (e: unknown) {
          const code = (e as { code?: string })?.code
          if (code === 'P2002') return R({ ok: true, duplicate: true, gems_added: 0, wallet: { gems: (await ensureWallet(user.id)).gems } })
          throw e
        }
        const wTop = await ensureWallet(user.id)
        const srvT = await warUserServer(user.id).catch(() => 1)
        void telem('gem_topup_purchased', user.id, srvT, sku, { gems: pack.gems })
        return R({ ok: true, duplicate: false, gems_added: pack.gems, wallet: { gems: wTop.gems }, consume: true })
      }

      /* ---------------- V66 Shop V2 — catalog / inventory / history / collection claim ---------------- */
      case 'shop_catalog': {
        const { w } = await dailyBonus(user.id)
        const inv = await shopOwnedRows(user.id)
        const nowC = Date.now()
        /* V114 — وضعیت پک شروع (برای همه‌ی بازیکنان تا لحظه‌ی خرید) */
        const stC = await starterStateOf(user.id)
        const starterBlock = {
          phase: stC.phase,
          /* V114: پنجره‌ی زمانی حذف شد — آفر نامحدود است تا وقتی خریداری نشود */
          unlimited: true,
          ends_in_ms: 0,
          price_fa: STARTER_PACK.priceFa,
          price_toman: STARTER_PACK.priceToman,
          contents: starterContents(),
        }
        return R({
          ok: true,
          items: SHOP_ITEMS.filter((x) => !x.hidden).map((x) => ({
            id: x.id, fa: x.fa, d: x.d, icon: x.icon, price: x.price, kind: x.kind, cat: x.cat, rar: x.rar,
            slot: x.slot || null, days: x.days || null,
            window: x.window ? { from: x.window.from, to: x.window.to } : (x.expands === 'season' ? { to: shopSeasonSlug().to } : null),
          })),
          packs: SHOP_PACKS,
          collections: SHOP_COLLECTIONS,
          mystery: Object.fromEntries(Object.entries(SHOP_MYSTERY).map(([k, m]) => [k, {
            fa: m.fa,
            odds: m.tiers.map((t) => ({ pct: Math.round((t.w / m.tiers.reduce((a, q) => a + q.w, 0)) * 100), kind: t.kind, min: t.min || null, max: t.max || null, fa: t.fa, items: t.ids || [] })),
          }])),
          wallet: { gems: w.gems, boost_until: w.boostUntil ? w.boostUntil.toISOString() : null, vip_until: w.vipUntil ? w.vipUntil.toISOString() : null },
          war_cfg: { atk_types: ATK_TYPES, orders: WAR_ORDERS, intel_fa: WAR_INTEL_FA, supply_max: SUPPLY_MAX, regen_ms: SUPPLY_REGEN_MS, war_items: WAR_ITEMS },
          /* V108 — پک شروع امپراتور: وضعیت فقط از سرور */
          starter: starterBlock,
          season: shopSeasonSlug(),
          now: nowC,
          owned: inv.map((r) => ({ item_id: r.itemId, source: r.source, rarity: r.rarity, expires_at: r.expiresAt ? r.expiresAt.toISOString() : null, created_at: r.createdAt.toISOString() })),
        })
      }
      case 'shop_inventory': {
        const w = await ensureWallet(user.id)
        const inv = await shopOwnedRows(user.id)
        return R({
          ok: true,
          items: inv.map((r) => ({ item_id: r.itemId, source: r.source, rarity: r.rarity, expires_at: r.expiresAt ? r.expiresAt.toISOString() : null, created_at: r.createdAt.toISOString() })),
          vip_until: w.vipUntil ? w.vipUntil.toISOString() : null,
        })
      }
      case 'shop_history': {
        const lim = Math.min(50, Math.max(5, Number(args.p_limit) || 30))
        const rows = await db.shopPurchase.findMany({
          where: { userId: user.id, status: 'ok' }, orderBy: { createdAt: 'desc' }, take: lim,
          select: { itemId: true, price: true, currency: true, status: true, provider: true, createdAt: true, meta: true },
        })
        return R({ ok: true, rows: rows.map((r) => ({ item_id: r.itemId, price: r.price, currency: r.currency, provider: r.provider, created_at: r.createdAt.toISOString(), meta: r.meta })) })
      }
      case 'shop_collection_claim': {
        const cid = String(args.p_collection || '')
        const col = SHOP_COLLECTIONS.find((c) => c.id === cid)
        if (!col) return R({ ok: false, error: 'collection' })
        const inv = await shopOwnedRows(user.id)
        const ownedIds = new Set(inv.map((r) => r.itemId))
        const missing = col.members.filter((mid) => {
          if (mid.endsWith('*')) {
            const base = mid.slice(0, -1)
            return ![...ownedIds].some((o) => o === base || o.startsWith(base + '@'))
          }
          return !ownedIds.has(mid)
        })
        if (missing.length) return R({ ok: false, error: 'incomplete', missing })
        const rewardDef = SHOP_ITEM_MAP.get(col.reward)
        if (!rewardDef) return R({ ok: false, error: 'reward' })
        const already = ownedIds.has(col.reward)
        if (!already) {
          await shopGrant(user.id, col.reward, 'collection', rewardDef.rar, null, { collection: cid })
          await db.shopPurchase.create({ data: { userId: user.id, itemId: col.reward, price: 0, status: 'ok', provider: 'collection', meta: JSON.stringify({ collection: cid }) } })
          /* V88 — تکمیل مجموعه خبر جهانی دارد (ضد اسپم: فقط هنگام تکمیل واقعی) */
          try { await addNews(await warUserServer(user.id), 'col_done', null, user.nick, col.fa) } catch (e) { console.log('colnews', e) }
        }
        return R({ ok: true, already, reward: col.reward, fa: rewardDef.fa, icon: rewardDef.icon })
      }

      /* ---------------- V88 — WAR DEPTH RPCs (سرور-مأخذ، ضدتقلب) ---------------- */
      case 'war_state': {
        const { data } = await warStateOf(user.id)
        const now = Date.now()
        const inv = await db.shopInventory.findMany({ where: { userId: user.id, itemId: { in: ['tactical_slot'] } }, select: { itemId: true } })
        return R({
          ok: true,
          supply: Math.max(0, Math.min(SUPPLY_MAX, Math.round(data.supply || SUPPLY_MAX))),
          supply_max: SUPPLY_MAX,
          atk_type: data.atkt || 'balanced',
          fx: (data.fx || []).filter((f) => f.until > now).map((f) => ({ k: f.k, until: f.until, data: f.data || null })),
          cd: Object.fromEntries(Object.entries(data.cd || {}).filter(([, t]) => t > now)),
          blk: Object.fromEntries(Object.entries(data.blk || {}).filter(([, t]) => t > now)),
          slots: inv.length ? 2 : 1,
          /* V108 — انبار شمارشی + پیکربندی نمایشی (عدد واقعی همیشه سرور) */
          stock: Object.fromEntries(Object.entries(data.stock || {}).filter(([, n]) => n > 0)),
          war_items: WAR_ITEMS,
          cfg: { atk_types: ATK_TYPES, orders: WAR_ORDERS, intel_fa: WAR_INTEL_FA },
        })
      }
      case 'war_order': {
        const key = String(args.p_key || '')
        const target = String(args.p_target || '').trim()
        const od = WAR_ORDERS[key]
        if (!od) return R({ ok: false, error: 'order' })
        /* مالکیت: هر سفارش باید قبلاً از فروشگاه باز شده باشد (آیتم wo_* / intel_l2 برای خرابکاری) */
        const unlockId = key === 'sabotage' ? 'intel_l2' : 'wo_' + key
        const owned = await db.shopInventory.findUnique({ where: { userId_itemId: { userId: user.id, itemId: unlockId } } })
        if (!owned || (owned.expiresAt && owned.expiresAt.getTime() < Date.now())) return R({ ok: false, error: 'locked' })
        const { data } = await warStateOf(user.id)
        const now = Date.now()
        const cdAt = (data.cd || {})[key] || 0
        if (now < cdAt) return R({ ok: false, error: 'cd', cd_ms: cdAt - now })
        /* هدف‌محورها (محاصره/خرابکاری) به nick واقعی نیاز دارند */
        let targetUid: string | null = null
        if (od.target) {
          if (!target) return R({ ok: false, error: 'target' })
          const tu = await db.user.findFirst({ where: { nickLower: target.toLowerCase() }, select: { id: true, nick: true } })
          if (!tu || tu.id === user.id) return R({ ok: false, error: 'target' })
          targetUid = tu.id
          if (key === 'sabotage') {
            const def = await warStateOf(tu.id)
            if (warFxOf(def.data, now).ewar) return R({ ok: false, error: 'counterintel' }) /* قابل دفاع — هزینه‌ای پرداخت نمی‌شود */
          }
        }
        /* هزینه‌ی منابع از خزانه‌ی واقعی (تک‌نویسنده tradeApply) */
        if (od.gold || od.oil || od.food) {
          const paid = await tradeApply(user.id, (r) => {
            if (od.gold) r.gold = resNum(r.gold) - od.gold
            if (od.oil) r.oil = resNum(r.oil) - od.oil
            if (od.food) r.food = resNum(r.food) - od.food
          })
          if (!paid) return R({ ok: false, error: 'res' })
        }
        data.cd = { ...(data.cd || {}), [key]: now + od.cd }
        let report: Record<string, unknown> | null = null
        if (od.supply) data.supply = Math.min(SUPPLY_MAX, (data.supply || 0) + od.supply)
        if (od.fx && od.dur) {
          data.fx = (data.fx || []).filter((f) => f.k !== od.fx)
          data.fx.push({ k: od.fx, until: now + od.dur })
        }
        if (key === 'blockade' && target) {
          data.blk = { ...(data.blk || {}), [target.toLowerCase()]: now + 12 * 3600_000 }
          try { await addNews(await warUserServer(user.id), 'war_blockade', null, user.nick, target) } catch (e) {}
        }
        if (key === 'sabotage' && targetUid && target) {
          const def = await warStateOf(targetUid)
          def.data.fx = (def.data.fx || []).filter((f) => f.k !== 'sabotaged')
          def.data.fx.push({ k: 'sabotaged', until: now + 6 * 3600_000 })
          await warStateSave(targetUid, def.data)
          try { await addNews(await warUserServer(user.id), 'war_sabotage', null, user.nick, target) } catch (e) {}
        }
        if (key === 'reconsweep') report = { intel: 4, fa: 'گزارش کامل سطح ۴ — در پنل اطلاعات استفاده کن' }
        await warStateSave(user.id, data)
        return R({ ok: true, key, supply: data.supply, cd_until: now + od.cd, fx: data.fx, report })
      }
      case 'war_intel': {
        const targetNick = String(args.p_target || '').trim()
        if (!targetNick || targetNick.toLowerCase() === String(user.nick).toLowerCase()) return R({ ok: false, error: 'target' })
        const tu = await db.user.findFirst({
          where: { nickLower: targetNick.toLowerCase() },
          select: { id: true, nick: true, score: { select: { score: true, conquered: true, kills: true, economy: true } } },
        })
        if (!tu) return R({ ok: false, error: 'target' })
        const now = Date.now()
        /* سطح اطلاعات: پایه ۱ + intel_l1 + intel_l2 + اثر شناسایی هوایی (سقف ۴) */
        const mine = await warStateOf(user.id)
        const mfx = warFxOf(mine.data, now)
        const invRows = await db.shopInventory.findMany({ where: { userId: user.id, itemId: { in: ['intel_l1', 'intel_l2'] } }, select: { itemId: true } })
        const ownedIntel = new Set(invRows.map((r) => r.itemId))
        let level = 1
        if (ownedIntel.has('intel_l1')) level++
        if (ownedIntel.has('intel_l2')) level++
        if (mfx.airrecon) level++
        level = Math.min(4, level)
        /* ضداطلاعات مدافع → دقت کمتر و پنهان‌شدن آمادگی */
        const def = await warStateOf(tu.id)
        const dfx = warFxOf(def.data, now)
        const counter = !!dfx.ewar
        const band = (v: number, pct: number) => {
          const w = Math.max(1, Math.round(v * pct))
          const lo = Math.max(0, v - w), hi = v + w
          return { lo, hi }
        }
        const terrCount = await db.territory.count({ where: { userId: tu.id } })
        const rep: Record<string, unknown> = { nick: tu.nick, level, level_fa: WAR_INTEL_FA[level], counterintel: counter, territories: terrCount }
        const score = tu.score?.score || 0
        const bandPct = (counter ? 0.45 : [0.4, 0.25, 0.15, 0.08][level] || 0.08)
        rep.army = band(score, bandPct)
        if (level >= 2) {
          rep.defense = band(score, bandPct)
          rep.economy = band(tu.score?.economy || 0, counter ? 0.5 : 0.3)
        }
        if (level >= 3) {
          /* استحکامات واقعی = ساختمان‌های دفاعی CV در کشورهای مدافع + آمادگی لجستیک خودش */
          const forts = await db.cvBuilding.count({ where: { userId: tu.id, type: 'fort', status: 'active' } })
          rep.fortifications = counter ? null : forts
          rep.readiness = counter ? null : Math.round(def.data.supply ?? 100)
          const ds = await db.save.findUnique({ where: { userId: tu.id }, select: { state: true } })
          try {
            const st = ds ? JSON.parse(ds.state || '{}') : {}
            const res = st.res || {}
            if (!counter) rep.oil = band(resNum(res.oil), 0.35)
          } catch {}
        }
        if (level >= 4) {
          const recent = await db.battleLog.findMany({
            where: { OR: [{ attacker: tu.nick }, { defender: tu.nick }] },
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { kind: true, country: true, win: true, createdAt: true, attacker: true, defender: true },
          })
          rep.recent = recent.map((r) => ({ kind: r.kind, country: r.country, win: r.win, at: r.createdAt.toISOString(), vs: r.attacker === tu.nick ? (r.defender || '—') : r.attacker, as: r.attacker === tu.nick ? 'attacker' : 'defender' }))
        }
        /* کول‌داون شناسایی رایگان (هر ساعت یک‌بار بدون هزینه) — سطح ۴ رایگان نیست */
        const suKey = 'intel_' + tu.id
        const lastSu = await db.specialUse.findFirst({ where: { userId: user.id, item: suKey }, orderBy: { usedAt: 'desc' } })
        if (lastSu && now - lastSu.usedAt.getTime() < 3600_000) return R({ ok: false, error: 'cd', cd_ms: 3600_000 - (now - lastSu.usedAt.getTime()), report: rep, free: true })
        await db.specialUse.create({ data: { userId: user.id, item: suKey } }).catch(() => {})
        return R({ ok: true, report: rep })
      }
      /* ---------------- V108 — WAR ITEMS V1: استفاده‌ی سرور-مأخذ از انبار ----------------
         کلاینت فقط p_item/p_target می‌فرستد؛ مالکیت/موجودی/هدف/کول‌داون/سقف/مقاومت/
         افکت/اخبار — همه سمت سرور. هیچ کسری از کلاینت قابل اعتماد نیست. */
      case 'war_use_item': {
        if (gamesPhase().phase === 'live' && (await evOn('olympic'))) return R({ ok: false, error: 'truce' })
        const item = String(args.p_item || '')
        const wdef = WAR_ITEMS[item]
        if (!wdef) return R({ ok: false, error: 'item' })
        const nowU = Date.now()

        /* ۱) هدف و حفاظت‌ها — قبل از هر کسری */
        let targetUid: string | null = null
        let targetNick = ''
        if (wdef.target) {
          targetNick = String(args.p_target || '').trim()
          if (!targetNick) return R({ ok: false, error: 'target' })
          const tu = await db.user.findFirst({ where: { nickLower: targetNick.toLowerCase() }, select: { id: true, nick: true, createdAt: true } })
          if (!tu || tu.id === user.id) return R({ ok: false, error: 'target' })
          targetUid = tu.id
          targetNick = tu.nick
          if (Date.now() - tu.createdAt.getTime() < PROTECTION_MIN_AGE_MS) return R({ ok: false, error: 'protected' })
          /* ضد سوءاستفاده‌ی اتحاد: عضو همان اتحاد هدف نمی‌شود */
          try {
            const myAl = await db.allianceMember.findFirst({ where: { userId: user.id }, select: { allianceId: true } })
            if (myAl) {
              const tgAl = await db.allianceMember.findFirst({ where: { userId: tu.id, allianceId: myAl.allianceId }, select: { id: true } })
              if (tgAl) return R({ ok: false, error: 'alliance' })
            }
          } catch (e) { console.log('wi_all', e) }
        }

        /* ۲) موجودی انبار سرور */
        const myRow = await warStateRow(user.id)
        const myData = warParse(myRow.data)
        if (((myData.stock || {})[item] || 0) < 1) return R({ ok: false, error: 'stock' })

        /* ۳) کول‌داون استفاده */
        const cdAt = (myData.cd || {})[item] || 0
        if (nowU < cdAt) return R({ ok: false, error: 'cd', cd_ms: cdAt - nowU })

        /* ۴) سقف روزانه (ضد آزار هدف — حتی با انبار پر) */
        const dayStartU = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')
        const usedToday = await db.specialUse.count({ where: { userId: user.id, item: 'wi_' + item, usedAt: { gte: dayStartU } } })
        if (usedToday >= wdef.dailyCap) return R({ ok: false, error: 'cap', cap: wdef.dailyCap })

        /* ۵) مقاومت پلکانی هدف (§8) — ضربه‌ی ۴ به بعد تا پایان پنجره بی‌اثر و رد می‌شود */
        let step = 0
        let mult = 1
        if (wdef.resist && targetUid) {
          const tRow0 = await warStateRow(targetUid)
          const tData0 = warParse(tRow0.data)
          const r0 = (tData0.res || {})[item]
          const inWindow = r0 && r0.until > nowU
          const n = inWindow ? Math.min(r0.n, WAR_RESIST_STEPS.length - 1) : 0
          mult = WAR_RESIST_STEPS[n]
          step = n
          if (mult === 0) return R({ ok: false, error: 'resistant', until: r0.until })
        }

        /* ۶) مصرف اتمیک از انبار (قفل خوش‌بینانه) */
        const take = await warStockAdjust(user.id, item, -1)
        if (!take.ok || take.now < 0) return R({ ok: false, error: 'stock' })

        /* ۷) اعمال افکت — خطا = بازگشت کامل موجودی (rollback) */
        try {
          const effKey = wdef.fxKey || item
          const untilU = nowU + Math.max(30_000, Math.round(wdef.dur * mult))
          const pct = wdef.defPct ? Math.round(wdef.defPct * mult * 10) / 10 : 0
          if (targetUid) {
            /* نوشتن محافظت‌شده روی WarState هدف: fx + res در یک تراکنش JSON */
            let applied = false
            for (let attempt = 0; attempt < 4 && !applied; attempt++) {
              const tRow = await warStateRow(targetUid)
              const raw = tRow.data
              const tData = warParse(raw)
              tData.fx = (tData.fx || []).filter((f) => f.k !== effKey)
              tData.fx.push({ k: effKey, until: untilU, data: pct ? { pct, by: user.nick, step } : { by: user.nick, step } })
              if (wdef.resist) {
                const rPrev = (tData.res || {})[item]
                const rN = rPrev && rPrev.until > nowU ? rPrev.n + 1 : 1
                tData.res = { ...(tData.res || {}), [item]: { n: Math.min(rN, WAR_RESIST_STEPS.length), until: nowU + WAR_RESIST_WINDOW_MS } }
              }
              const upd = await db.warState.updateMany({ where: { userId: targetUid, data: raw }, data: { data: JSON.stringify(tData) } })
              if (upd.count === 1) applied = true
            }
            if (!applied) throw new Error('fx_race')
          } else {
            /* خود-افکت (جمر) — روی WarState خودم؛ بدون مقاومت */
            const mine = await warStateOf(user.id)
            mine.data.fx = (mine.data.fx || []).filter((f) => f.k !== effKey)
            mine.data.fx.push({ k: effKey, until: untilU, data: { by: user.nick } })
            await warStateSave(user.id, mine.data)
          }

          /* ۷الف) ضربه‌ی دقیق: سطح یک استحکامات فعال هدف −۱ (هرگز زیر ۱ — سقف آسیب) */
          let fortHit: { name: string; level: number } | null = null
          if (item === 'tactical_precision' && targetUid && mult > 0) {
            try {
              const fort = await db.cvBuilding.findFirst({ where: { userId: targetUid, type: 'fort', status: 'active', level: { gt: 1 } }, orderBy: { level: 'desc' } })
              if (fort) {
                const upd = await db.cvBuilding.updateMany({ where: { id: fort.id, level: { gt: 1 } }, data: { level: { decrement: 1 } } })
                if (upd.count === 1) fortHit = { name: String(fort.province ?? '') || String(fort.slot ?? ''), level: fort.level - 1 }
              }
            } catch (e) { console.log('wi_fort', e) }
          }

          /* ۸) کول‌داون + مصرف روزانه + اخبار + دفتر نبرد + تله‌متری */
          const mine2 = await warStateRow(user.id)
          const md = warParse(mine2.data)
          md.cd = { ...(md.cd || {}), [item]: nowU + wdef.cd }
          await warStateSave(user.id, md)
          await db.specialUse.create({ data: { userId: user.id, item: 'wi_' + item } }).catch(() => {})
          const newsAct = { tactical_emp: 'war_emp', tactical_jammer: 'war_jam', tactical_precision: 'war_precision', tactical_defbreak: 'war_defbreak', tactical_cyber: 'war_cyber' }[item] || 'war_item'
          const srvU = await warUserServer(user.id).catch(() => 1)
          try { await addNews(srvU, newsAct, null, user.nick, targetNick || user.nick) } catch (e) {}
          try { await db.battleLog.create({ data: { server: srvU, kind: item, country: '', attacker: user.nick, defender: targetNick || user.nick, win: true } }) } catch (e) {}
          void telem('tactical_item_used', user.id, srvU, item, { target: targetNick || null, step, mult })
          if (item === 'tactical_emp') void telem('emp_used', user.id, srvU, item, { step })
          if (item === 'tactical_jammer') void telem('jammer_used', user.id, srvU, item, {})
          if (item === 'tactical_precision') void telem('precision_used', user.id, srvU, item, { step, fort: !!fortHit })
          if (item === 'tactical_defbreak') void telem('defense_breaker_used', user.id, srvU, item, { step })
          if (item === 'tactical_cyber') void telem('cyber_disruption_used', user.id, srvU, item, { step })

          return R({
            ok: true, item, stock: take.now,
            target: targetNick || null, fx: effKey, dur_ms: Math.round(wdef.dur * mult),
            step, mult, pct, fort_hit: fortHit,
            cd_until: nowU + wdef.cd, next_ok: new Date(nowU + wdef.cd).toISOString(),
          })
        } catch (e) {
          /* rollback: افکت ثبت نشد → موجودی برمی‌گردد */
          await warStockAdjust(user.id, item, 1).catch(() => {})
          return R({ ok: false, error: 'race' })
        }
      }

      /* V108 — استفاده از تدارک جنگی: تبدیل انبار → لجستیک زنده (سقف ۱۰۰ سرور) */
      case 'war_supply_use': {
        const rowS = await warStateRow(user.id)
        const dS = warParse(rowS.data)
        const haveStock = (dS.stock || {}).war_supply || 0
        if (haveStock < 1) return R({ ok: false, error: 'stock' })
        const live = await warStateOf(user.id)
        const room = Math.max(0, Math.floor(SUPPLY_MAX - (live.data.supply || 0)))
        if (room < 1) return R({ ok: false, error: 'full', supply: Math.round(live.data.supply || 0) })
        const useN = Math.min(haveStock, room)
        const take = await warStockAdjust(user.id, 'war_supply', -useN)
        if (!take.ok) return R({ ok: false, error: 'race' })
        const after = await warStateOf(user.id)
        after.data.supply = Math.min(SUPPLY_MAX, (after.data.supply || 0) + useN)
        await warStateSave(user.id, after.data)
        const srvS = await warUserServer(user.id).catch(() => 1)
        void telem('war_supply_used', user.id, srvS, 'war_supply', { used: useN })
        return R({ ok: true, used: useN, supply: Math.round(after.data.supply), stock: take.now, supply_max: SUPPLY_MAX })
      }

      /* ---------------- V108 — پک شروع امپراتور (سرور-مأخذ) ---------------- */
      case 'starter_state': {
        const st = await starterStateOf(user.id)
        /* تله‌متری نمایش — فقط وقتی پیشنهاد واقعاً فعال است و حداقل ۱۰ دقیقه از آخرین نمایش گذشته باشد */
        if (st.phase === 'offer') {
          const rowV = await db.starterOffer.findUnique({ where: { userId: user.id }, select: { lastViewAt: true, viewCount: true } })
          if (!rowV?.lastViewAt || Date.now() - rowV.lastViewAt.getTime() > 10 * 60_000) {
            await db.starterOffer.update({ where: { userId: user.id }, data: { viewCount: { increment: 1 }, lastViewAt: new Date() } }).catch(() => {})
            const srvV = await warUserServer(user.id).catch(() => 1)
            void telem('starter_offer_viewed', user.id, srvV, 'emperor_starter', {})
          }
        }
        return R({
          ok: true, phase: st.phase,
          /* V114: آفر نامحدود — دیگر پنجره‌ی ۴۸ ساعته وجود ندارد */
          unlimited: true,
          ends_in_ms: 0,
          purchased_at: st.purchasedAt ? st.purchasedAt.toISOString() : null,
          price_fa: STARTER_PACK.priceFa,
          price_toman: STARTER_PACK.priceToman,
          contents: starterContents(),
          /* ارزش نمایشی فقط از قیمت واقعی پک‌های جم محاسبه می‌شود (ضد قیمت جعلی) */
          value_note: STARTER_PACK.gems + ' جم — ارزش جم بر اساس نرخ بهترین بسته‌ی واقعی فروشگاه',
        })
      }

      case 'starter_claim': {
        const provider = String(args.p_provider || '')
        const receipt = String(args.p_receipt || '').slice(0, 200)
        const requestId = args.p_request_id ? String(args.p_request_id).slice(0, 80) : null
        /* ۱) Idempotency — همان درخواست = همان پاسخ، بدون گرنت دوباره */
        if (requestId) {
          const prior = await db.shopPurchase.findFirst({ where: { userId: user.id, requestId, status: 'ok' }, orderBy: { createdAt: 'desc' } })
          if (prior) return R({ ok: true, duplicate: true, item_id: 'emperor_starter', gems: (await ensureWallet(user.id)).gems })
        }
        /* ۲) راستی‌آزمایی پرداخت واقعی (مایکت/زارین‌پال) — بدون اعتبار محیط، صادقانه رد می‌شود */
        const ver = await verifyProviderReceipt(provider, receipt, user)
        if (!ver.ok) return R({ ok: false, error: ver.error })
        const txId = ver.txId
        /* ۳) ضد پخش مجدد رسید — requestId = شناسه‌ی تراکنش (یکتا به‌ازای هر کاربر)؛
              پخش مجدد رسیدِ مصرف‌شده = duplicate:true (نه خرید دوم، نه خطای مبهم) */
        const finalReq = txId || requestId
        if (finalReq) {
          const dup = await db.shopPurchase.findFirst({ where: { userId: user.id, requestId: finalReq, status: 'ok' } })
          if (dup) return R({ ok: true, duplicate: true, item_id: 'emperor_starter', gems: (await ensureWallet(user.id)).gems })
        }
        /* ۴) شرایط — تایمر و وضعیت فقط از StarterOffer سرور */
        const st = await starterStateOf(user.id)
        if (st.purchasedAt) return R({ ok: false, error: 'purchased' })
        if (st.phase !== 'offer') return R({ ok: false, error: 'expired' })
        /* ۵) گرنت اتمیک همه‌ی محتویات — هر خطا = هیچ */
        try {
          const nowC = Date.now()
          await ensureWallet(user.id)
          await warStateRow(user.id)
          const out = await db.$transaction(async (tx) => {
            const claim = await tx.starterOffer.updateMany({ where: { userId: user.id, purchasedAt: null }, data: { purchasedAt: new Date(), provider, txId } })
            if (claim.count === 0) return { fail: 'purchased' as const }
            const w0 = await tx.wallet.findUnique({ where: { userId: user.id }, select: { boostUntil: true } })
            const baseB = w0?.boostUntil && w0.boostUntil.getTime() > nowC ? w0.boostUntil.getTime() : nowC
            await tx.wallet.update({ where: { userId: user.id }, data: { gems: { increment: STARTER_PACK.gems }, boostUntil: new Date(baseB + STARTER_PACK.boostMs) } })
            for (const g of STARTER_PACK.grants) {
              await tx.shopInventory.upsert({ where: { userId_itemId: { userId: user.id, itemId: g.id } }, update: {}, create: { userId: user.id, itemId: g.id, source: 'starter', rarity: 'legendary', meta: JSON.stringify({ from: 'emperor_starter' }) } })
            }
            /* تدارک جنگی پک — داخل همان تراکنش (خواندن/نوشتن JSON گارد‌شده) */
            const wRow = await tx.warState.findUnique({ where: { userId: user.id }, select: { data: true } })
            const wd = warParse(wRow?.data || '{}')
            wd.stock = { ...(wd.stock || {}), war_supply: ((wd.stock || {}).war_supply || 0) + STARTER_PACK.warSupply }
            await tx.warState.upsert({ where: { userId: user.id }, update: { data: JSON.stringify(wd) }, create: { userId: user.id, data: JSON.stringify(wd) } })
            await tx.shopPurchase.create({ data: { userId: user.id, itemId: 'emperor_starter', price: 0, currency: 'toman', status: 'ok', provider, requestId: finalReq, meta: JSON.stringify({ kind: 'starter', resources: { gold: STARTER_PACK.gold, oil: STARTER_PACK.oil, food: STARTER_PACK.food }, war_supply: STARTER_PACK.warSupply, boost_ms: STARTER_PACK.boostMs }) } })
            return { ok: true as const }
          })
          if ('fail' in out) return R({ ok: false, error: out.fail })
          const nw = await ensureWallet(user.id)
          const srvC = await warUserServer(user.id).catch(() => 1)
          void telem('starter_offer_purchased', user.id, srvC, 'emperor_starter', { provider })
          try { await addNews(srvC, 'starter_purchased', null, user.nick, 'پک شروع امپراتور') } catch (e) {}
          return R({
            ok: true, item_id: 'emperor_starter', gems: nw.gems,
            boost_until: nw.boostUntil ? nw.boostUntil.toISOString() : null,
            resources: { gold: STARTER_PACK.gold, oil: STARTER_PACK.oil, food: STARTER_PACK.food },
            tax_instant: STARTER_PACK.taxInstant,
            war_supply: STARTER_PACK.warSupply,
            grants: STARTER_PACK.grants.map((g) => ({ id: g.id, fa: g.fa, ic: g.ic })),
          })
        } catch (e) {
          console.log('starter_claim', e)
          return R({ ok: false, error: 'grant_failed' })
        }
      }

      case 'trophy_list': {
        /* تروفی فقط از داده‌ی واقعی سرور — هیچ ورودی کلاینت پذیرفته نمی‌شود */
        const defs: { key: string; fa: string; ic: string; d: string }[] = [
          { key: 'veteran', fa: 'تروفی کهنه‌کار', ic: '🎖️', d: '۱۰۰ نبرد واقعی (کشتار)' },
          { key: 'conqueror', fa: 'تروفی فاتح', ic: '🏰', d: '۵۰ کشور فتح‌شده' },
          { key: 'commander', fa: 'تروفی فرمانده', ic: '⚔️', d: '۲۵ نبرد واقعی' },
          { key: 'olympic', fa: 'تروفی المپیک', ic: '🥇', d: 'قهرمانی المپیک جهانی' },
          { key: 'economy', fa: 'تروفی اقتصاد طلایی', ic: '💰', d: '۲ میلیون اقتصاد' },
          { key: 'alliance', fa: 'تروفی اتحاد', ic: '🤝', d: 'بنیان‌گذاری اتحاد' },
          { key: 'collector', fa: 'تروفی مجموعه‌دار', ic: '🧿', d: '۳۰ آیتم در انبار' },
          { key: 'legend', fa: 'تروفی افسانه', ic: '👑', d: '۲۵۰٬۰۰۰ امتیاز قدرت' },
        ]
        const sc = await db.score.findUnique({ where: { userId: user.id } })
        const invN = await db.shopInventory.count({ where: { userId: user.id } })
        const champ = await db.olympicChampion.findFirst({ where: { userId: user.id }, select: { id: true } })
        const ally = await db.alliance.findFirst({ where: { ownerUid: user.id }, select: { id: true } })
        const w88 = await ensureWallet(user.id)
        const has: Record<string, boolean> = {
          veteran: (sc?.kills || 0) >= 100,
          conqueror: (sc?.conquered || 0) >= 50,
          commander: (sc?.kills || 0) >= 25,
          olympic: !!champ,
          economy: (sc?.economy || 0) >= 2_000_000,
          alliance: !!ally,
          collector: invN >= 30,
          legend: (sc?.score || 0) >= 250_000,
        }
        const existing = await db.userTrophy.findMany({ where: { userId: user.id } })
        const haveSet = new Set(existing.map((t) => t.key))
        const fresh: string[] = []
        for (const d of defs) {
          if (has[d.key] && !haveSet.has(d.key)) {
            await db.userTrophy.upsert({ where: { userId_key: { userId: user.id, key: d.key } }, update: {}, create: { userId: user.id, key: d.key } })
            fresh.push(d.key)
          }
        }
        if (fresh.length) {
          try { await addNews(sc?.server || 1, 'trophy', null, user.nick, fresh.join(',')) } catch (e) {}
        }
        const nowT = Date.now()
        const rows = await db.userTrophy.findMany({ where: { userId: user.id } })
        return R({
          ok: true,
          trophies: defs.map((d) => {
            const r = rows.find((x) => x.key === d.key)
            return { ...d, earned: !!r, at: r ? r.at.toISOString() : null, progress_now: d.key === 'veteran' || d.key === 'commander' ? (sc?.kills || 0) : d.key === 'conqueror' ? (sc?.conquered || 0) : d.key === 'economy' ? (sc?.economy || 0) : d.key === 'collector' ? invN : d.key === 'legend' ? (sc?.score || 0) : null }
          }),
          vip_until: w88.vipUntil ? w88.vipUntil.toISOString() : null,
          now: nowT,
        })
      }

      /* ---------------- admin ---------------- */
      case 'is_admin':
        return R(user.isAdmin)
      case 'admin_list_players': {
        if (!user.isAdmin) return R(null)
        const users = await db.user.findMany({
          select: {
            id: true, nick: true, isAdmin: true, createdAt: true,
            score: { select: { server: true, conquered: true, score: true, kills: true, economy: true, recruits: true } },
            wallet: { select: { gems: true } },
            save: { select: { updatedAt: true } },
            territories: { select: { isCapital: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 300,
        })
        const rows = users.map((u) => ({
          user_id: u.id,
          nick: u.nick,
          is_admin: u.isAdmin,
          created_at: u.createdAt.toISOString(),
          server: u.score?.server ?? null,
          conquered: u.score?.conquered ?? 0,
          score: u.score?.score ?? 0,
          kills: u.score?.kills ?? 0,
          economy: u.score?.economy ?? 0,
          recruits: u.score?.recruits ?? 0,
          gems: u.wallet?.gems ?? 0,
          last_save: u.save?.updatedAt ? u.save.updatedAt.toISOString() : null,
          territories: u.territories.length,
          capitals: u.territories.filter((t) => t.isCapital).length,
        }))
        return R(rows)
      }
      case 'admin_set_gems': {
        if (!user.isAdmin) return R(null)
        const uid = String(args.p_user_id || '')
        const delta = Math.round(Number(args.p_delta) || 0)
        if (!uid || !delta) return R({ ok: false })
        const target = await db.user.findUnique({ where: { id: uid } })
        if (!target) return R({ ok: false })
        const w = await ensureWallet(uid)
        const nw = await db.wallet.update({ where: { userId: uid }, data: { gems: Math.max(0, w.gems + delta) } })
        return R({ ok: true, gems: nw.gems })
      }
      case 'claim_admin_grants': {
        const grants = await db.adminGrant.findMany({ where: { userId: user.id, claimed: false }, orderBy: { createdAt: 'asc' } })
        if (!grants.length) return R(null)
        let g = 0, o = 0, f = 0
        for (const gr of grants) { g += gr.gold; o += gr.oil; f += gr.food }
        await db.adminGrant.updateMany({ where: { id: { in: grants.map((x) => x.id) } }, data: { claimed: true } })
        /* V75 — P3: پاداش حالا سرور خودش به خزانه‌ی واقعی واریز می‌کند (tradeApply تک‌نویسنده).
           قبلاً «سرور محاسبه، کلاینت اعمال» بود — کلاینت عدد را به بلاب می‌افزود؛ همان شکار اعتماد.
           پاسخ برای «نمایش» کلاینت دست‌نخورده ماند؛ کلاینت دیگر منبع را محلی جمع نمی‌زند. */
        if (g || o || f) await tradeApply(user.id, (r) => { r.gold = resNum(r.gold) + g; r.oil = resNum(r.oil) + o; r.food = resNum(r.food) + f }).catch(() => {})
        return R([{ o_gold: g, o_oil: o, o_food: f }])
      }

      /* ---------------- weekly rewards ---------------- */
      case 'claim_weekly_rewards': {
        const wk = weekKey()
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        if (!myScore) return R([])
        const out: { rank: number; reward_gold: number; category: string }[] = []
        for (const cat of WEEKLY_CATEGORIES) {
          const top = await db.score.findMany({
            where: { server: myScore.server, [cat]: { gt: 0 } },
            orderBy: { [cat]: 'desc' },
            take: 3,
          })
          const idx = top.findIndex((x) => x.userId === user.id)
          if (idx < 0) continue
          const rank = idx + 1
          const reward = WEEKLY_REWARDS[rank] || 0
          if (!reward) continue
          const already = await db.weeklyClaim.findUnique({
            where: { userId_weekKey_category: { userId: user.id, weekKey: wk, category: cat } },
          })
          if (already) continue
          await db.weeklyClaim.create({ data: { userId: user.id, weekKey: wk, category: cat, rank, rewardGold: reward } })
          /* V75 — P3: واریز سمت سرور (تک‌نویسنده) — کلاینت فقط اعلان نشان می‌دهد */
          await tradeApply(user.id, (r) => { r.gold = resNum(r.gold) + reward }).catch(() => {})
          out.push({ rank, reward_gold: reward, category: cat })
        }
        return R(out)
      }

      /* ---------------- multiplayer housekeeping (V33.1: 60s throttle regardless of callers) ---------------- */
      case 'release_inactive_territories': {
        const nowR = Date.now()
        if (nowR - lastReleaseRun < 60_000) return R(null)
        lastReleaseRun = nowR
        const cutoff = new Date(Date.now() - 3 * 24 * 3600 * 1000)
        const stale = await db.user.findMany({
          where: {
            OR: [
              { createdAt: { lt: cutoff }, save: null },
              { save: { updatedAt: { lt: cutoff } } },
            ],
          },
          select: { id: true },
        })
        if (stale.length) {
          const servers = await db.territory.groupBy({ by: ['server'], where: { userId: { in: stale.map((u) => u.id) } } })
          await db.territory.deleteMany({ where: { userId: { in: stale.map((u) => u.id) } } })
          for (const s of servers) {
            const rows = await db.territory.groupBy({ by: ['userId'], where: { server: s.server } })
            const taken = await db.territory.count({ where: { server: s.server } })
            await db.serverStat.upsert({ where: { server: s.server }, create: { server: s.server, taken, players: rows.length }, update: { taken, players: rows.length } })
          }
        }
        return R(null)
      }

      /* ---------------- PvP ---------------- */
      /* ============================================================
         V113 — فتح‌نامه‌ی لشکر: ژنرال‌ها + کارنامه‌ی واقعی نبرد
         قرارداد کلاینت: WD105_load → {ok, generals, owned, assigned,
         glory, xp, wins, losses, class_xp, unit_xp, unit_badges,
         badges, ab_cd} | war_general_op → {ok} | {ok:false,error:'glory'}
         ============================================================ */
      case 'war_generals': {
        const c = await warCareerGet(user.id)
        return R({ ok: true, generals: WAR_GENERALS, owned: c.owned, assigned: c.assigned, glory: c.glory, xp: c.xp, wins: c.wins, losses: c.losses, class_xp: c.class_xp, unit_xp: c.unit_xp, unit_badges: {}, badges: {}, ab_cd: c.ab_cd, classes: WAR_CLS_FA_KEYS })
      }
      case 'war_general_op': {
        const op = String(args.p_op || ''), gid = String(args.p_id || ''), slot = String(args.p_slot || 'atk')
        const g = WAR_GENERALS[gid]
        if (!g) return R({ ok: false })
        const c = await warCareerGet(user.id)
        if (op === 'hire') {
          if (c.owned.indexOf(gid) > -1) return R({ ok: true, glory: c.glory, owned: c.owned, assigned: c.assigned })
          if (c.glory < g.cost) return R({ ok: false, error: 'glory' })
          c.glory -= g.cost; c.owned.push(gid)
        } else if (op === 'assign' || op === 'unassign') {
          if (c.owned.indexOf(gid) < 0) return R({ ok: false })
          const s = slot === 'def' ? 'def' : 'atk'
          if (!c.assigned) c.assigned = { atk: null, def: null }
          if (op === 'assign') c.assigned[s] = gid
          else if (c.assigned[s] === gid) c.assigned[s] = null
        } else return R({ ok: false })
        await warCareerSet(user.id, c)
        return R({ ok: true, glory: c.glory, owned: c.owned, assigned: c.assigned })
      }
      case 'pvp_attack': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '')
        /* V33.1: attacker strength comes from the SERVER-side score only — the client's
           p_attack is no longer trusted (it could be spoofed to pin the 0.85 win cap) */
        const t = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!t || t.userId === user.id) return R({ ok: false })
        /* V59 wave-2 (§8): territory cap — attacker at the cap cannot take more land */
        if ((await territoryCount(user.id, server)) >= MAX_COUNTRIES) return R({ ok: false, error: 'cap' })
        /* V34: a formal duel between the two players is a SANCTIONED match — it may be
           fought even during the sacred Olympic truce (unsanctioned wars stay blocked) */
        const duel = await db.duel.findFirst({
          where: {
            server, status: 'live', expiresAt: { gt: new Date() },
            OR: [{ fromUid: user.id, toUid: t.userId }, { fromUid: t.userId, toUid: user.id }],
          },
        })
        if (gamesPhase().phase === 'live' && (await evOn('olympic')) && !duel) return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس المپیک — با خاموشی المپیک توسط ادمین لغو می‌شود */
        /* ---------------- V75 — P4: هزینه‌ی واقعی حمله + کول‌داون سرور ----------------
           تا V74 حمله برای مهاجم رایگان بود؛ حالا:
           ۱) کول‌داون ۱۰ثانیه‌ای per-user (ضد اسپم حمله)
           ۲) کسر طلا/نفت از خزانه‌ی واقعی با tradeApply (تک‌نویسنده — پول جعلی بلاب هم جواب نمی‌دهد)
           هزینه فقط وقتی کسر می‌شود که حمله واقعاً به مرحله‌ی داوری برسد. */
        {
          const now75 = Date.now()
          const last75 = lastPvpAtk.get(user.id) || 0
          if (now75 - last75 < PVP_ATTACK.cooldownSec * 1000) return R({ ok: false, error: 'cd', cd_ms: PVP_ATTACK.cooldownSec * 1000 - (now75 - last75) })
          const paid75 = await tradeApply(user.id, (r) => {
            r.gold = resNum(r.gold) - PVP_ATTACK.costGold
            r.oil = resNum(r.oil) - PVP_ATTACK.costOil
          })
          if (!paid75) return R({ ok: false, error: 'res' })
          if (lastPvpAtk.size > 5000) lastPvpAtk.clear()
          lastPvpAtk.set(user.id, now75)
        }
        const defScore = await db.score.findUnique({ where: { userId: t.userId } })
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        let a = Math.max(1, myScore?.score || 100)
        const d0 = Math.max(1, (defScore?.score || 200))
        /* V55: اثر واقعی عملیات‌های جم — دفاع هدفِ تحت عملیات ضعیف می‌شود، راید کماندو قدرت مهاجم را بالا می‌برد */
        let opApplied: { k: string; pct: number } | null = null
        try {
          const eff = (await opsEffGet(server))[country]
          if (eff && eff.until > Date.now()) {
            if (eff.k === 'commando') { a = Math.round(a * 1.2); opApplied = { k: eff.k, pct: 0.2 } }
            else if (eff.pct > 0) { opApplied = { k: eff.k, pct: eff.pct }; }
          }
        } catch (e) { console.log('opseffr', e) }
        let d = opApplied && opApplied.pct > 0 ? Math.max(1, Math.round(d0 * (1 - opApplied.pct))) : d0
        /* V34: revenge strike — the attacker's one-shot +25% right against the player
           who took their land (72h window, consumed on use, win or lose) */
        let revenge_used = false
        const rev = await db.revengeMark.findFirst({
          where: { userId: user.id, targetUid: t.userId, used: false, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'asc' },
        })
        if (rev) { a = Math.round(a * 1.25); revenge_used = true }
        /* V65 — تاکتیک نبرد: کلاینت فقط درخواست می‌فرستد؛ اعتبارسنجی و اعمال سمت سرور (§15).
           blitz +10% • heavy +15% • precision +5% — بقیه‌ی مقادیر نادیده گرفته می‌شوند. */
        const tac65 = String(args.p_tactic || '')
        const tacMult65 = tac65 === 'blitz' ? 1.10 : tac65 === 'heavy' ? 1.15 : tac65 === 'precision' ? 1.05 : 1
        if (tacMult65 > 1) a = Math.round(a * tacMult65)
        /* V68 — §9: Country View روی نبرد واقعی سرور اثر می‌گذارد — پادگان/فناوری نظامی مهاجم → حمله،
           خط دفاعیِ مدافع در همان کشور → دفاع. سقف‌ها: +۲۵٪ حمله / +۳۰٪ دفاع. فقط ساختمان فعال. */
        let cvAtkPct = 0, cvDefPct = 0
        try {
          cvAtkPct = (await cvMilBonus(user.id)).atkPct
          if (cvAtkPct > 0) a = Math.round(a * (1 + cvAtkPct / 100))
          cvDefPct = (await cvMilBonus(t.userId, country)).defPct
          if (cvDefPct > 0) d = Math.max(1, Math.round(d * (1 + cvDefPct / 100)))
        } catch (e) { console.log('cvmil', e) }
        /* ================= V88 — WAR DEPTH (فقط وقتی کلاینت جدید p_atk_type بفرستد) =================
           دکترین حمله جای تاکتیک را می‌گیرد (تک‌منبع — بدون دوبار جمع‌شدن بونوس).
           همه‌ی اعداد سمت سرور؛ سقف سخت بونوس جم‌محور = +۲۲٪ کل. صفر instant-win. */
        let lossMult88 = 1, fxUsed88: string[] = [], supplyAfter88: number | null = null, atk88: string | null = null
        const rawAtk88 = String(args.p_atk_type || '')
        if (rawAtk88) {
          atk88 = ATK_TYPES[rawAtk88] ? rawAtk88 : 'balanced'
          const AT = ATK_TYPES[atk88]
          /* ۱) هزینه‌ی لجستیک دکترین از خزانه‌ی واقعی */
          if (AT.gold || AT.oil) {
            const paid88 = await tradeApply(user.id, (r) => {
              if (AT.gold) r.gold = resNum(r.gold) - AT.gold
              if (AT.oil) r.oil = resNum(r.oil) - AT.oil
            })
            if (!paid88) return R({ ok: false, error: 'res' })
          }
          /* ۲) تدارک (supply) — بازیابی تنبل + مصرف دکترین */
          const w88 = await warStateOf(user.id)
          const now88 = Date.now()
          const supply88 = w88.data.supply || SUPPLY_MAX
          if (supply88 < AT.supply) return R({ ok: false, error: 'supply', need: AT.supply, have: Math.round(supply88) })
          w88.data.supply = supply88 - AT.supply
          w88.data.atkt = atk88
          const fx88 = warFxOf(w88.data, now88)
          /* ۳) محاسبه‌ی بونوس با سقف سخت — ذخیره/بسیج/دکترین جمع و به +۲۲٪ محدود می‌شوند */
          let add88 = Math.max(0, AT.atk - 1)
          if (fx88.reserve) { add88 += 0.12; fxUsed88.push('reserve'); w88.data.fx = (w88.data.fx || []).filter((f) => f.k !== 'reserve') } /* یک‌بارمصرف */
          if (fx88.mobilize) { add88 += 0.08; fxUsed88.push('mobilize') }
          add88 = Math.min(WAR_MAX_ADD, add88)
          a = Math.round(a * (1 + add88))
          if (AT.atk < 1) a = Math.round(a * AT.atk) /* تدافعی: جریمه‌ی حمله */
          lossMult88 = AT.loss
          if (fx88.emsupply) { lossMult88 *= 0.93; fxUsed88.push('emsupply') }
          if (fx88.convoy) { lossMult88 *= 0.96; fxUsed88.push('convoy') }
          if (supply88 < 30) { a = Math.round(a * 0.90); lossMult88 *= 1.10 } /* لجستیک بحرانی */
          /* ۴) دکترین تدافعی → سپر ۶ساعته برای خودم | هوایی → شناسایی ۶ساعته */
          if (AT.selfDefFx) {
            const k = atk88 === 'defensive' ? 'edef' : 'airrecon'
            w88.data.fx = (w88.data.fx || []).filter((f) => f.k !== k)
            w88.data.fx.push({ k, until: now88 + AT.selfDefFx, data: atk88 === 'defensive' ? { pct: 25 } : {} })
            fxUsed88.push(k)
          }
          /* ۵) دفاع هدف: اثرات واقعی مدافع + محاصره‌ی دریایی مهاجم + فشار اقتصادی + نفوذ محاصره در استحکامات */
          try {
            const dState = await warStateOf(t.userId)
            const dfx88 = warFxOf(dState.data, now88)
            if (dfx88.edef) { const pct = Number((dfx88.edef.data || {}).pct) || 15; d = Math.max(1, Math.round(d * (1 + pct / 100))); fxUsed88.push('def_edef') }
            if (dfx88.sabotaged) { d = Math.max(1, Math.round(d * 0.94)); fxUsed88.push('def_sabotaged') }
            /* V108 — سلاح‌های تاکتیکی روی مدافع: EMP (آمادگی −۱۵٪ سقف‌دار پلکانی) + شکستن دفاع (۱۰۰٪→۸۰٪).
               هرگز صفر نمی‌شوند؛ مقاومت پلکانی هدف در war_use_item اعمال شده و این‌جا فقط اثر خوانده می‌شود. */
            if (dfx88.emp) { const ep = Math.min(15, Number((dfx88.emp.data || {}).pct) || 0); if (ep > 0) { d = Math.max(1, Math.round(d * (1 - ep / 100))); fxUsed88.push('def_emp') } }
            if (dfx88.defbreak) { const dp = Math.min(20, Number((dfx88.defbreak.data || {}).pct) || 0); if (dp > 0) { d = Math.max(1, Math.round(d * (1 - dp / 100))); fxUsed88.push('def_defbreak') } }
          } catch (e) { console.log('war88def', e) }
          if (AT.defDown) { d = Math.max(1, Math.round(d * (1 - AT.defDown))); fxUsed88.push('eco_pressure') }
          if (AT.blockTarget) {
            const blk = (w88.data.blk || {})[String(t.nick).toLowerCase()]
            if (blk && blk > now88) { d = Math.max(1, Math.round(d * 0.95)); fxUsed88.push('blockade') }
          }
          if (AT.defPen && cvDefPct > 0) {
            d = Math.max(1, Math.round(d / (1 + cvDefPct / 100) * (1 + cvDefPct * AT.defPen / 100)))
            fxUsed88.push('def_pen')
          }
          supplyAfter88 = Math.round(w88.data.supply || 0)
          await warStateSave(user.id, w88.data)
        }
        /* ================= پایان V88 ================= */
        const chance = Math.min(0.85, Math.max(0.2, 0.5 + (a - d) / (2 * (a + d + 500))))
        const win = Math.random() < chance
        /* V113 — کارنامه‌ی واقعی جنگ (فتح‌نامه): فقط از PvP داوری‌شده‌ی سرور */
        warCareerPostBattle(user.id, t.userId, win, atk88).catch(() => {})
        if (rev) await db.revengeMark.update({ where: { id: rev.id }, data: { used: true } })
        let duelWon: { duel_id: string; prize_gold: number; prize_gems: number } | null = null
        if (win) {
          const r = await transferTerritory(server, country, user.id, user.nick)
          if (!r.ok) return R({ ok: false })
          /* V58: امتیاز رتبه‌بندی همان لحظه جلو می‌رود — بدون انتظار برای سیکل سیو کلاینت (۸ ثانیه‌ای)
             recompute سیو بعدی همان مقدار مطلق را می‌گذارد؛ این فقط سرعت دیده‌شدن رویداد در رنکینگ است */
          try { await db.score.update({ where: { userId: user.id }, data: { conquered: { increment: 1 }, score: { increment: 1000 } } }) } catch (e) { console.log('pvpscore', e) }
          /* V65 — جهان زنده: سقوط امپراتوری — اگر مدافع آخرین خاکش را از دست داد، خبر فوری */
          try {
            const left = await territoryCount(t.userId, server)
            if (left === 0) await addNews(server, 'empire_fall', country, t.nick, user.nick)
          } catch (e) { console.log('empfall', e) }
          /* V34: the defender who just lost land earns a 72h revenge right (+25%, once) */
          try { await db.revengeMark.create({ data: { server, userId: t.userId, targetUid: user.id, targetNick: user.nick, expiresAt: new Date(Date.now() + 72 * 3600_000) } }) } catch (e) { console.log('revmk', e) }
          if (duel) { try { duelWon = await resolveDuel(server, user.id, t.userId, user.id, user.nick, t.nick) } catch (e) { console.log('duelres', e) } }
        } else {
          await addNews(server, 'pvp_failed', country, user.nick, t.nick)
        }
        /* V34: battle log feeds the 48h war-heatmap layer */
        try { await db.battleLog.create({ data: { server, kind: 'attack', country, attacker: user.nick, defender: t.nick, win } }) } catch (e) { console.log('blog', e) }
        /* rich payload (V33.1): the tactical drawer consumes occupation/gain/ratio/
           defense/captured — before this it always computed 0% and 60% losses and
           syncTerr deleted the just-won territory */
        return R({ ok: win, captured: win, busy: false, occupation: win ? 100 : 0, gain: win ? 100 : 0, defense: d, ratio: a / d, duel_won: duelWon, revenge_used, op_applied: opApplied, tactic: tac65 || null, cv_atk_pct: cvAtkPct, cv_def_pct: cvDefPct, atk_type: atk88, loss_mult: Math.round(lossMult88 * 100) / 100, fx_used: fxUsed88, supply_after: supplyAfter88 })
      }
      case 'pvp_capture_territory': {
        if (gamesPhase().phase === 'live' && (await evOn('olympic'))) return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس — با سوئیچ ادمین لغو می‌شود */
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '')
        /* V86 — قفل سرور تستی: تصرف آزاد برای ورودِ تازه (کسی که در این سرور قلمرو ندارد) روی سرور تستی رد می‌شود */
        if ((await testSrvsGet()).includes(server) && !user.isAdmin && (await territoryCount(user.id, server)) === 0) return R({ ok: false, error: 'test' })
        /* V33.1: free capture is for NEUTRAL land only — owned territories must be
           fought for via pvp_attack (this was a free-steal of any player's land) */
        const t0 = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!t0) return R(false)
        if (t0.userId && t0.userId !== user.id) return R({ ok: false, error: 'owned' })
        /* V59 wave-2 (§8): territory cap on free capture too */
        if ((await territoryCount(user.id, server)) >= MAX_COUNTRIES) return R({ ok: false, error: 'cap' })
        const now = Date.now()
        const last = lastCapture.get(user.id) || 0
        if (now - last < 15_000) return R(false)
        lastCapture.set(user.id, now)
        const r = await transferTerritory(server, country, user.id, user.nick)
        /* V58: تصرف سرزمین آزاد هم فوراً در رتبه‌بندی دیده شود */
        if (r.ok) { try { await db.score.update({ where: { userId: user.id }, data: { conquered: { increment: 1 }, score: { increment: 1000 } } }) } catch (e) { console.log('capscore', e) } }
        return R(r.ok)
      }

      /* ---------------- V60sec — فتح تک‌نفره‌ی سرورمحرر (تک‌مسیر نوشتن قلمرو) ----------------
         تا V60 کلاینت ردیف‌های territories را مستقیم می‌نوشت (insert/delete از shim جدول) —
         مسیری که آتش‌بس المپیک، سقف ۱۵ کشور، نرخ تصرف و یکنواختی سیو را دور می‌زد.
         حالا تنها مسیر نوشتن همین RPC است؛ سیاست‌ها:
         ۱) اثبات: هر ادعای تازه باید در سیوی که سرور ذخیره کرده باشد (conq ∪ my)
         ۲) آتش‌بس المپیک: فقط بوت‌استرپ نخستین کشور (پایتخت) مجاز است
         ۳) سقف MAX_COUNTRIES + بودجه ۵ فتح تازه در هر فراخوانی (سیک ۳۰ثانیه‌ای سینک)
         ۴) رهاکردن زمین‌هایی که کلاینت دیگر نگه نمی‌دارد (فقط ردیف‌های خود کاربر)
         ۵) first-come-first-served با قید یکتا (P2002 → lost) + بیرق پایتخت تک‌تایی */
      case 'territory_sync': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const capital = args.p_capital ? String(args.p_capital) : null
        const heldRaw = Array.isArray(args.p_held)
          ? [...new Set((args.p_held as unknown[]).map((c) => String(c || '').trim()).filter(Boolean))].slice(0, MAX_COUNTRIES + 2)
          : []
        const current = await db.territory.findMany({ where: { userId: user.id, server } })
        /* V86 — قفل سرور تستی: ورودِ تازه (بدون هیچ قلمرو در این سرور) برای غیرادمین رد می‌شود —
           کسی که از قبل زمین دارد (حساب‌های تست/ادمین) دست‌نخورده به کارش ادامه می‌دهد */
        if ((await testSrvsGet()).includes(server) && !user.isAdmin && current.length === 0) {
          return R({ ok: false, test_server: true, granted: [], denied: [], lost: [], mine: [] })
        }
        const mine = new Set(current.map((t) => t.country))
        /* releases — زمین‌هایی که دیگر نگه نمی‌دارم (فقط ردیف‌های خودم) */
        const gone = [...mine].filter((c) => !heldRaw.includes(c))
        if (gone.length) await db.territory.deleteMany({ where: { userId: user.id, server, country: { in: gone } } })
        for (const g of gone) mine.delete(g)
        /* proof — سیوی که سرور خودش ذخیره کرده، مرجع اثبات مالکیت است */
        const save = await db.save.findUnique({ where: { userId: user.id } })
        let st: { conq?: unknown; my?: unknown } = {}
        try { st = save ? JSON.parse(save.state || '{}') : {} } catch { /* no proof available */ }
        const proof = new Set<string>(Array.isArray(st.conq) ? (st.conq as unknown[]).map((c) => String(c)) : [])
        if (st.my) proof.add(String(st.my))
        const truce = gamesPhase().phase === 'live' && (await evOn('olympic'))
        /* پایتخت اولویت داوری — بوت‌استرپ حتی وسط آتش‌بس فقط یک کشور می‌دهد */
        const ordered = capital && heldRaw.includes(capital) ? [capital, ...heldRaw.filter((c) => c !== capital)] : heldRaw
        const bootstrap = mine.size === 0
        let budget = truce ? (bootstrap ? 1 : 0) : 5
        const granted: string[] = [], denied: string[] = [], lost: string[] = []
        let cnt = mine.size
        for (const c of ordered) {
          if (mine.has(c)) continue
          if (!proof.has(c)) { denied.push(c); continue }
          if (cnt >= MAX_COUNTRIES || budget <= 0) { denied.push(c); continue }
          try {
            await db.territory.create({ data: { server, country: c, userId: user.id, nick: user.nick, isCapital: !!capital && c === capital } })
            budget--; cnt++; mine.add(c); granted.push(c)
          } catch (e) {
            if ((e as { code?: string })?.code === 'P2002') lost.push(c)
            else throw e
          }
        }
        /* بیرق پایتخت تک‌تایی — جابه‌جایی پایتخت میان کشورهایِ همین بازیکن هم درست می‌نشیند */
        if (capital && mine.has(capital)) {
          await db.territory.updateMany({ where: { userId: user.id, server, isCapital: true, country: { not: capital } }, data: { isCapital: false } }).catch(() => {})
          await db.territory.updateMany({ where: { userId: user.id, server, country: capital, isCapital: false }, data: { isCapital: true } }).catch(() => {})
        }
        /* V69 §26: XP مسیر فصل فقط برای فتحِ تأییدشده‌ی سرور — همین‌جا که grant واقعی رخ داد.
           bootstrap (کشور اول) فتح نیست؛ XP نمی‌گیرد. سقف روزانه (۴/روز) در passAddXp اعمال می‌شود. */
        if (granted.length && !bootstrap) { for (let gi = 0; gi < granted.length; gi++) passAddXp(user.id, 'conquest').catch(() => {}) }
        /* serverStat فقط وقتی وضعیت واقعاً عوض شد — سینک ۳۰ثانیه‌ای هر بازیکن نباید اسکن بیندازد */
        if (granted.length || gone.length) {
          const rows = await db.territory.groupBy({ by: ['userId'], where: { server } })
          const taken = await db.territory.count({ where: { server } })
          await db.serverStat.upsert({ where: { server }, create: { server, taken, players: rows.length }, update: { taken, players: rows.length } }).catch(() => {})
        }
        const mineRows = await db.territory.findMany({ where: { userId: user.id, server }, select: { country: true, isCapital: true } })
        return R({ ok: true, granted, denied, lost, gone, truce, mine: mineRows.map((r) => ({ country: r.country, is_capital: r.isCapital })) })
      }

      /* ---------------- V86/V87 — حالت عرضه‌ی مایکت: ریست کامل جهان (فقط ادمین) ----------------
         همه‌چیز صفر: رکوردها، سیوها، قلمروها، المپیک و مدال‌ها، چت/اخبار، دوئل/انتخابات/اتحاد/پاس فصل.
         حفظ می‌شود: حساب‌ها، جم/والت، انبار خریدهای پرداخت‌شده (ShopInventory/Purchase)، نشست‌ها.
         V87: جدول‌به‌جدول با گارد خطا — شکست یک جدول کل ریست را نمی‌شکند و آمار واقعی برمی‌گردد.
         در پایان wd_test_srvs=[] ⇒ همه از سرور ۱ با نقشه‌ی خالی شروع می‌کنند. */
      case 'admin_launch_reset': {
        if (!user.isAdmin) return R(null)
        try { await ensureGamesClosed() } catch (e) { console.log('olclose-launch', e) }
        const wipeList: Array<[string, () => Promise<unknown>]> = [
          ['territory', () => db.territory.deleteMany({})],
          ['score', () => db.score.deleteMany({})],
          ['save', () => db.save.deleteMany({})], /* V87: سیوها هم صفر — شروع واقعی از اول */
          ['serverStat', () => db.serverStat.deleteMany({})],
          ['worldChat', () => db.worldChat.deleteMany({})],
          ['worldNews', () => db.worldNews.deleteMany({})],
          ['duelBet', () => db.duelBet.deleteMany({})],
          ['duel', () => db.duel.deleteMany({})],
          ['revengeMark', () => db.revengeMark.deleteMany({})],
          ['battleLog', () => db.battleLog.deleteMany({})],
          ['electionVote', () => db.electionVote.deleteMany({})],
          ['electionCandidate', () => db.electionCandidate.deleteMany({})],
          ['electionWinner', () => db.electionWinner.deleteMany({})],
          ['mentorOffer', () => db.mentorOffer.deleteMany({})],
          ['mentorLink', () => db.mentorLink.deleteMany({})],
          ['allianceMember', () => db.allianceMember.deleteMany({})],
          ['alliance', () => db.alliance.deleteMany({})],
          ['hofTitle', () => db.hofTitle.deleteMany({})],
          ['adminGrant', () => db.adminGrant.deleteMany({})], /* V87: هدیه‌های قدیمی ادمین هم پاک */
          ['dailyStreak', () => db.dailyStreak.deleteMany({})],
          ['weeklyClaim', () => db.weeklyClaim.deleteMany({})],
          ['specialUse', () => db.specialUse.deleteMany({})],
          ['tradeOffer', () => db.tradeOffer.deleteMany({})],
          ['cvBuilding', () => db.cvBuilding.deleteMany({})],
          ['cvCountry', () => db.cvCountry.deleteMany({})],
          ['olympicResult', () => db.olympicResult.deleteMany({})],
          ['olympicSuspicious', () => db.olympicSuspicious.deleteMany({})],
          ['olympicMatch', () => db.olympicMatch.deleteMany({})],
          ['olympicEntry', () => db.olympicEntry.deleteMany({})],
          ['olympicAchieve', () => db.olympicAchieve.deleteMany({})],
          ['olympicRecord', () => db.olympicRecord.deleteMany({})],
          ['olympicProfile', () => db.olympicProfile.deleteMany({})],
          ['olympicRivalry', () => db.olympicRivalry.deleteMany({})],
          ['olympicChampion', () => db.olympicChampion.deleteMany({})],
          ['olympicArchive', () => db.olympicArchive.deleteMany({})],
          ['seasonPass', () => db.seasonPass.deleteMany({})],
          /* V88: وضعیت جنگ و تروفی‌ها هم گیم‌پلی‌اند — ریست کامل عرضه */
          ['warState', () => db.warState.deleteMany({})],
          ['userTrophy', () => db.userTrophy.deleteMany({})],
        ]
        const wiped: Record<string, number> = {}
        const failed: string[] = []
        for (const [name, run] of wipeList) {
          try {
            const r = await run()
            wiped[name] = (r as { count?: number })?.count ?? 0
          } catch (e) { failed.push(name); console.log('launch-reset', name, e) }
        }
        try {
          await db.gameSetting.deleteMany({ where: { OR: [
            { key: { startsWith: 'wd33' } }, { key: { startsWith: 'wdol' } }, { key: { startsWith: 'oly' } },
            { key: { startsWith: 'wd_ops_eff' } }, { key: 'doom_v43' }, { key: TEST_SRV_KEY },
          ] } })
        } catch (e) { console.log('launch-reset settings', e) }
        try { await testSrvsSet([]) } catch (e) { console.log('launch-reset testsrv', e) } /* ⇒ همه از سرور ۱ صفر شروع می‌کنند */
        return R({ ok: true, wiped, failed })
      }

      /* ---------------- V54 special ops (server-enforced limits) ----------------
         کودتا و شهاب‌سنگ حذف شدند. چهار عملیات جدید (قیمت ۲۰۰ تا ۵۰۰ جم، سقف هفتگی سرور):
         cyber    نفوذ سایبری        ۲۰۰ جم، هر ۱۲ ساعت، حداکثر ۶۰ در هفته
         commando راید کماندویی     ۲۸۰ جم، هر ۲۴ ساعت، حداکثر ۴۰ در هفته
         missile  موشک پنچر           ۳۵۰ جم، هر ۲۴ ساعت، حداکثر ۳۰ در هفته
         nuke     ضربه‌ی هسته‌ای      ۵۰۰ جم، هر ۴۸ ساعت، حداکثر ۲۰ در هفته */
      case 'use_special': {
        if (gamesPhase().phase === 'live' && (await evOn('olympic'))) return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس — با سوئیچ ادمین لغو می‌شود */
        const item = String(args.p_item || '')
        const country = String(args.p_country || '')
        const server = Math.max(1, Number(args.p_server) || 1)
        if (!Object.keys(SPECIAL_OPS).includes(item)) return R({ ok: false, error: 'item' })
        if (!country) return R({ ok: false, error: 'country' })
        const cost = SPECIAL_OPS[item].cost
        const cooldownMs = SPECIAL_OPS[item].cd
        /* V33.1: validate the TARGET before any charge — gems were burning on no-op strikes */
        const terr = await db.territory.findUnique({ where: { server_country: { server, country } } })
        if (!terr) return R({ ok: false, error: 'country' })
        if (terr.userId === user.id) return R({ ok: false, error: 'own' })
        const w = await ensureWallet(user.id)
        if (w.gems < cost) return R({ ok: false, error: 'funds' })
        const last = await db.specialUse.findFirst({ where: { userId: user.id, item }, orderBy: { usedAt: 'desc' } })
        if (last && Date.now() - last.usedAt.getTime() < cooldownMs) {
          return R({ ok: false, error: 'cooldown', next_ok: new Date(last.usedAt.getTime() + cooldownMs).toISOString() })
        }
        /* V54: rolling-week global cap per op (سقف هفتگی هر عملیات روی کل سرور) */
        {
          const weekly = SPECIAL_OPS[item].weekly
          const since = new Date(Date.now() - 7 * 24 * 3600_000)
          const used = await db.specialUse.count({ where: { item, usedAt: { gte: since } } })
          if (used >= weekly) {
            const oldest = await db.specialUse.findFirst({ where: { item, usedAt: { gte: since } }, orderBy: { usedAt: 'asc' } })
            return R({ ok: false, error: 'weekly_cap', next_ok: oldest ? new Date(oldest.usedAt.getTime() + 7 * 24 * 3600_000).toISOString() : null })
          }
        }
        const dec = await db.wallet.updateMany({ where: { userId: user.id, gems: { gte: cost } }, data: { gems: { decrement: cost } } })
        if (dec.count === 0) return R({ ok: false, error: 'funds' })
        try {
          await db.specialUse.create({ data: { userId: user.id, item } })
        } catch (e) {
          await db.wallet.update({ where: { userId: user.id }, data: { gems: { increment: cost } } }).catch(() => {})
          throw e
        }
        const nw = await ensureWallet(user.id)
        await addNews(server, item, country, user.nick, terr.nick ? terr.nick : null)
        /* V55: اثر واقعی عملیات ثبت می‌شود — pvp_attack همین کشور تا پایان مدت از آن استفاده می‌کند */
        const OP_DUR: Record<string, number> = { cyber: 90, commando: 120, missile: 120, nuke: 180 }
        const OP_PCT: Record<string, number> = { cyber: 0.2, missile: 0.3, nuke: 0.4 }
        const durMin = OP_DUR[item] || 90
        try {
          await opsEffSet(server, country, { k: item, pct: OP_PCT[item] || 0, until: Date.now() + durMin * 60_000, by: user.nick })
        } catch (e) { console.log('opseffw', e) }
        /* V34: special strikes also feed the war-heatmap */
        try { await db.battleLog.create({ data: { server, kind: item, country, attacker: user.nick, defender: terr.nick || null, win: true } }) } catch (e) { console.log('blog', e) }
        return R({ ok: true, gems: nw.gems, owner_nick: terr.nick ? terr.nick : null, next_ok: new Date(Date.now() + cooldownMs).toISOString(), op_dur: durMin, op_pct: OP_PCT[item] || 0 })
      }

      /* ---------------- V54 special ops live status (کول‌داون/سقف واقعی برای هر ۴ عملیات) ---------------- */
      case 'special_status': {
        const server = Math.max(1, Number(args.p_server) || 1)
        void server
        const since = new Date(Date.now() - 7 * 24 * 3600_000)
        const out: Record<string, unknown> = { ok: true }
        for (const [kind, cfg] of Object.entries(SPECIAL_OPS)) {
          const last = await db.specialUse.findFirst({ where: { userId: user.id, item: kind }, orderBy: { usedAt: 'desc' } })
          const usedWeek = await db.specialUse.count({ where: { item: kind, usedAt: { gte: since } } })
          let reset: string | null = null
          if (usedWeek >= cfg.weekly) {
            const oldest = await db.specialUse.findFirst({ where: { item: kind, usedAt: { gte: since } }, orderBy: { usedAt: 'asc' } })
            reset = oldest ? new Date(oldest.usedAt.getTime() + 7 * 24 * 3600_000).toISOString() : null
          }
          out[kind + '_next'] = last ? new Date(last.usedAt.getTime() + cfg.cd).toISOString() : null
          out[kind + '_left'] = Math.max(0, cfg.weekly - usedWeek)
          out[kind + '_reset'] = reset
        }
        return R(out)
      }

      /* ---------------- V30 season reset (admin only) ----------------
         Crowns the champion (top-3 by score), archives it into world_news,
         then wipes the map so a new season starts fair for everyone. */
      case 'season_reset': {
        if (!user.isAdmin) return R(null)
        const server = Math.max(1, Number(args.p_server) || 1)
        /* V33: close pending Games editions BEFORE the wipe so medals still count */
        try { await ensureGamesClosed() } catch (e) { console.log('olclose-reset', e) }
        const top = await db.score.findMany({ where: { server }, orderBy: { score: 'desc' }, take: 3 })
        const top3: { nick: string; score: number }[] = []
        for (const s of top) {
          const u = await db.user.findUnique({ where: { id: s.userId } })
          if (u) top3.push({ nick: u.nick, score: s.score })
        }
        await addNews(server, 'season_champion', null, top3[0] ? top3[0].nick : null, top3[1] ? top3[1].nick : null)
        await db.territory.deleteMany({ where: { server } })
        await db.score.updateMany({ where: { server }, data: { score: 0, conquered: 0, kills: 0 } })
        const players = await db.score.groupBy({ by: ['userId'], where: { server } })
        await db.serverStat.upsert({ where: { server }, create: { server, taken: 0, players: players.length }, update: { taken: 0, players: players.length } })
        return R({ ok: true, top3 })
      }

      /* ---------------- P2P trade offers (V28, escrow) ----------------
         create: give_qty is deducted from the owner's SAVED state immediately (escrow)
                 and from the owner's live resources by the client → no double-spend.
         accept: escrowed goods move to the acceptor; the owner receives want_qty.
         cancel: escrow refunded to the owner's saved state. */
      case 'trade_offer_create': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const giveRes = String(args.p_give_res || ''), wantRes = String(args.p_want_res || '')
        /* V108 — اختلال سایبری: یک عملیات اقتصادی (ساخت پیشنهاد بازار) موقتاً کند/مسدود می‌شود.
           هیچ منبعی حذف/دزدیده نمی‌شود — فقط توقف موقت سمت سرور. */
        try {
          const myW = await warStateOf(user.id)
          if (warFxOf(myW.data, Date.now()).cyberdis) return R({ ok: false, reason: 'cyber_disrupted' })
        } catch (e) { console.log('wi_cyber', e) }
        const giveQty = Math.round(Number(args.p_give_qty) || 0), wantQty = Math.round(Number(args.p_want_qty) || 0)
        if (!TRADE_RES.has(giveRes) || !TRADE_RES.has(wantRes) || giveRes === wantRes || giveQty < 10 || wantQty < 10)
          return R({ ok: false, reason: 'bad' })
        const mine = await db.save.findUnique({ where: { userId: user.id } })
        if (!mine) return R({ ok: false, reason: 'nosave' })
        const okEscrow = await tradeApply(user.id, (r) => { r[giveRes] = resNum(r[giveRes]) - giveQty })
        if (!okEscrow) return R({ ok: false, reason: 'funds' })
        const open = await db.tradeOffer.count({ where: { ownerUid: user.id, status: 'open' } })
        if (open >= 5) {
          await tradeApply(user.id, (r) => { r[giveRes] = resNum(r[giveRes]) + giveQty })
          return R({ ok: false, reason: 'limit' })
        }
        await db.tradeOffer.create({
          data: { server, ownerUid: user.id, ownerNick: user.nick, giveRes, giveQty, wantRes, wantQty },
        })
        return R({ ok: true })
      }
      case 'trade_offer_list': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const rows = await db.tradeOffer.findMany({
          where: { server, status: 'open', createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } },
          orderBy: { createdAt: 'desc' },
          take: 60,
        })
        return R(rows.map((r) => ({
          id: r.id, mine: r.ownerUid === user.id, nick: r.ownerNick,
          give_res: r.giveRes, give_qty: r.giveQty, want_res: r.wantRes, want_qty: r.wantQty,
          created_at: r.createdAt.toISOString(),
        })))
      }
      case 'trade_offer_cancel': {
        const id = String(args.p_id || '')
        const off = await db.tradeOffer.findUnique({ where: { id } })
        if (!off || off.ownerUid !== user.id) return R({ ok: false })
        /* atomic claim: cancel only wins if the offer is still open (no accept/cancel race) */
        const cl = await db.tradeOffer.updateMany({ where: { id, status: 'open' }, data: { status: 'cancelled' } })
        if (cl.count === 0) return R({ ok: false })
        await tradeApply(user.id, (r) => { r[off.giveRes] = resNum(r[off.giveRes]) + off.giveQty }) /* refund escrow */
        return R({ ok: true })
      }
      case 'trade_offer_accept': {
        const id = String(args.p_id || '')
        const off = await db.tradeOffer.findUnique({ where: { id } })
        if (!off || off.status !== 'open' || off.ownerUid === user.id) return R({ ok: false, reason: 'gone' })
        const acceptor = await db.save.findUnique({ where: { userId: user.id } })
        if (!acceptor) return R({ ok: false, reason: 'nosave' })
        const aRes = tradeRes(acceptor.state).res
        if (resNum(aRes[off.wantRes]) < off.wantQty) return R({ ok: false, reason: 'funds' })
        const fee = Math.max(1, Math.round(off.giveQty * TRADE_FEE))
        const acceptorGot = Math.max(0, off.giveQty - fee)
        /* V33.1: claim the offer ATOMICALLY first (two concurrent accepts/cancels can no
           longer double-pay the owner), then move resources inside one transaction */
        const cl = await db.tradeOffer.updateMany({ where: { id, status: 'open' }, data: { status: 'done' } })
        if (cl.count === 0) return R({ ok: false, reason: 'gone' })
        let moved = false
        try {
          moved = await db.$transaction(async (tx) => {
            const okA = await tradeApply(user.id, (r) => {
              r[off.wantRes] = resNum(r[off.wantRes]) - off.wantQty
              r[off.giveRes] = resNum(r[off.giveRes]) + acceptorGot
            }, tx)
            if (!okA) return false
            const okO = await tradeApply(off.ownerUid, (r) => {
              r[off.wantRes] = resNum(r[off.wantRes]) + off.wantQty /* escrowed give already left the owner at create */
            }, tx)
            return okO
          })
        } catch (e) { moved = false }
        if (!moved) {
          /* release the claim so the offer is not lost */
          await db.tradeOffer.updateMany({ where: { id, status: 'done' }, data: { status: 'open' } }).catch(() => {})
          return R({ ok: false, reason: 'apply' })
        }
        await addNews(off.server, 'trade', null, user.nick, off.ownerNick)
        passAddXp(user.id, 'trade').catch(() => {})
        passAddXp(off.ownerUid, 'trade').catch(() => {})
        return R({ ok: true, got: acceptorGot, fee, give_res: off.giveRes })
      }
      case 'trade_offer_mine': {
        /* offers I own that finished in the last 24h — client credits itself once */
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000)
        const rows = await db.tradeOffer.findMany({
          where: { ownerUid: user.id, status: { in: ['done', 'cancelled'] }, createdAt: { gt: cutoff } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
        return R(rows.map((r) => ({
          id: r.id, status: r.status, give_res: r.giveRes, give_qty: r.giveQty,
          want_res: r.wantRes, want_qty: r.wantQty,
        })))
      }

      /* ---------------- V31/V32 olympics: disciplines + medal table + crowned champion ---------------- */
      case 'olympics': {
        const server = Math.max(1, Number(args.p_server || 1))
        await olyShiftRefresh()
        /* V32: lazy weekly crowning — also runs here so page viewers trigger it */
        let champRow: Awaited<ReturnType<typeof latestChampion>> = null
        champRow = await latestChampion(server)
        try { await ensureGamesClosed() } catch (e) { console.log('olensure', e) }
        /* O1: کش ۳۰s — اسکن news/امتیازها فقط هر ۳۰ ثانیه */
        let agg: OlAgg
        if (OL_WORLD_CC && OL_WORLD_CC.k === server && Date.now() - OL_WORLD_CC.at < 30000) agg = OL_WORLD_CC.v
        else { agg = await olympicCompute(server); OL_WORLD_CC = { k: server, at: Date.now(), v: agg } }
        const latest = champRow && champRow.nick ? champRow : await latestChampion(server)
        return R({
          ...agg, ts: Date.now(),
          champ: champRow && champRow.nick ? olPublic(champRow) : olPublic(latest),
          cycle: { cur: olCycle(), next_at: new Date((olCycle() + 1) * CYCLE_MS).toISOString() },
          rewards: OL_REWARDS,
        })
      }

      /* ---------------- V32/V33 olympic_status: badges/crown + games phase (all clients, 90s) ---------------- */
      case 'olympic_status': {
        const server = Math.max(1, Number(args.p_server || 1))
        try { await ensureGamesClosed() } catch (e) { console.log('olstatus', e) }
        /* V54 FIX: وضعیت شیفت ادمین را از DB تازه کن (کش ۱۵s) — بدون این، روی نمونه‌های serverless
           فاز بعد از شروع/پایان فوری ممکن بود تا همیشه کهنه بماند و دکمه‌های ادمین بی‌اثر به نظر برسند */
        try { await olyShiftRefresh() } catch (e) { console.log('olstatus-shift', e) }
        const latest = await refreshChampCountry(server, await latestChampion(server))
        const g = gamesPhase()
        const evs = await eventSwitches()
        return R({
          champion: olPublic(latest),
          cycle: { cur: olCycle(), next_at: new Date((olCycle() + 1) * CYCLE_MS).toISOString() },
          rewards: OL_REWARDS,
          events: evs,
          games: {
            phase: g.phase, edition: g.edition, game_day: g.gameDay, today: g.today,
            host: g.host, host_player: await olyHostGet(g.edition), truce: g.phase === 'live' && evs.olympic !== false,
            reg_at: new Date(g.regAt).toISOString(), open_at: new Date(g.openAt).toISOString(),
            close_at: new Date(g.closeAt).toISOString(), next_reg: new Date(g.nextReg).toISOString(),
          },
        })
      }

      /* ---------------- V33 olympic_games: full hub payload (state, schedule, table, records, archive) ---------------- */
      case 'olympic_games': {
        await olyShiftRefresh()
        try { await ensureGamesClosed() } catch (e) { console.log('olgames', e) }
        if (!(await evOn('olympic'))) {
          /* V38: disabled payload carries records+archive so the "disabled" hub page still shows history */
          const records = await db.olympicRecord.findMany({ take: 12 })
          const archives = await db.olympicArchive.findMany({ orderBy: [{ edition: 'desc' }], take: 8 })
          return R({
            disabled: true, edition: gamesPhase().edition, records,
            archive: archives.map((a) => ({
              edition: a.edition, host_city: a.hostCity, host_country: a.hostCountry, host_cc: a.hostCc,
              champion_country: a.championCountry, champion_nick: a.championNick, participants: a.participants,
              podiums: JSON.parse(a.medalsJson || '{}'), table: JSON.parse(a.tableJson || '[]'),
            })),
          })
        }
        const g = gamesPhase()
        const edition = g.edition
        if (g.phase === 'after') for (const k of Object.keys(GD_DAY)) { try { await freezeDiscipline(edition, k) } catch (e) {} }
        const myEntries = await db.olympicEntry.findMany({ where: { edition, userId: user.id } })
        /* O1: کش ۱۰s برای بخش مشترک سنگین (جدول مدال/رکورد/کارنامه/فید زنده/آرشیو) */
        const sh = await olyShared(edition, g.phase === 'live')
        const myReg = myEntries.map((e) => e.discipline)
        const myE: Record<string, { best: number; attempts: number; finalist: boolean; qual_best: number }> = {}
        for (const e of myEntries) myE[e.discipline] = { best: e.best, attempts: e.attempts, finalist: e.finalist, qual_best: e.qualBest }
        const champRow = await latestChampion(Math.max(1, Number(args.p_server || 1)))
        /* O4-final / PHASE 34: انگیزه‌های واقعی امروز — فقط در فاز زنده (قبل/بعد معنا ندارد) */
        const _hO4 = await olyHostGet(edition)
        const hostMaxO4 = (_hO4 && _hO4.uid === user.id) ? 6 : 5
        let motive: { discipline: string; kind: string; gap: number }[] = []
        if (g.phase === 'live' && myEntries.length) {
          try { motive = await olyMotive(edition, user.id, myEntries.map((e) => ({ discipline: e.discipline, best: e.best, attempts: e.attempts })), hostMaxO4) } catch (e) { motive = [] }
        }
        return R({
          edition, phase: g.phase, game_day: g.gameDay, today: g.today, host: g.host,
          host_player: _hO4,
          reg_at: new Date(g.regAt).toISOString(), open_at: new Date(g.openAt).toISOString(),
          close_at: new Date(g.closeAt).toISOString(), next_reg: new Date(g.nextReg).toISOString(),
          truce: g.phase === 'live',
          reg_cap: OLY_REG_CAP, final_top: OLY_FINAL_TOP, missions_def: OLY_MISSIONS, token_shop: OLY_TOKEN_SHOP,
          my: { reg: myReg, entries: myE, /* P1-V73: سقف تلاش رسمی (میزبان ۶ / بقیه ۵) — هاب دیگر حدس نمی‌زند */ att_max: hostMaxO4, country: (myEntries[0] && myEntries[0].countryFa) || null,
            /* O2 / PHASE 28: رشته‌هایی که الان رکورددار جهانی‌شان خودت هستی — کلاینت با
               مقایسه با آخرین وضعیت ذخیره‌شده، بنر RECORD BROKEN + [پس بگیر] می‌سازد */
            my_records: (sh.records || []).filter((r) => r.nick === user.nick).map((r) => r.discipline),
            /* O4-final / PHASE 34: انگیزه‌های امروز از داده‌ی واقعی */
            motive },
          /* V89: شناسنامه‌ی ورزشکار + ماموریت‌ها — lazy در تب‌های پروفایل/ماموریت/جوایز
             (کاهش بار RPC هاب؛ قبلاً inline بود و روی داده‌ی سنگین از گارد ۱۰s عبور می‌کرد) */
          athlete: null, missions: null,
          table: sh.table, records: sh.records, career: sh.career, rivals: sh.rivals, live_feed: sh.live_feed,
          torch: sh.torch,
          archive: sh.archives.map((a) => ({
            edition: a.edition, host_city: a.hostCity, host_country: a.hostCountry, host_cc: a.hostCc,
            champion_country: a.championCountry, champion_nick: a.championNick, participants: a.participants,
            podiums: JSON.parse(a.medalsJson || '{}'), table: JSON.parse(a.tableJson || '[]'),
          })),
          reigning: champRow ? { nick: champRow.nick, medals: champRow.medals, cycle: champRow.cycle } : null,
          rewards: OL_REWARDS,
          events: await eventSwitches(),
        })
      }

      /* ============ O1 — olympic_start: نشست مسابقه (L1/L6) ============
         هر مسابقه match_id + serverSeed + زمان سرور می‌گیرد؛ submit بدون match
         معتبر رد می‌شود. حالت train برای تمرین نامحدود (بدون اثر رتبه‌ای) است. */
      case 'olympic_start': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const g = gamesPhase()
        const key = String(args.p_discipline || '')
        const mode = String(args.p_mode || 'official') === 'train' ? 'train' : 'official'
        if (GD_DAY[key] === undefined || !hasRecalc(key)) return R({ ok: false, reason: 'discipline' })
        if (mode === 'official' && g.phase !== 'live') return R({ ok: false, reason: 'window' })
        const _h0 = await olyHostGet(g.edition)
        const hostMax = (_h0 && _h0.uid === user.id) ? 6 : 5
        let ent0: Awaited<ReturnType<typeof db.olympicEntry.findUnique>> = null
        if (mode === 'official') {
          ent0 = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
          if (!ent0) return R({ ok: false, reason: 'not_registered' })
          if (ent0.attempts >= hostMax) return R({ ok: false, reason: 'attempts' })
        }
        /* ضد سوءاستفاده: هر بار بیش از ۴ نشست باز برای یک کاربر → قدیمی‌ها منقضی */
        const open = await db.olympicMatch.findMany({ where: { userId: user.id, status: 'open' }, orderBy: [{ startedAt: 'asc' }] })
        if (open.length >= 4) {
          for (const o of open.slice(0, open.length - 3)) {
            await db.olympicMatch.update({ where: { id: o.id }, data: { status: 'expired', finishedAt: new Date() } }).catch(() => {})
          }
        }
        /* V89: چالش رقیب — نشست با seed مشترک چالش؛ داوری دوطرفه سمت سرور */
        let chalFlag: string | null = null, chalSeed: string | null = null
        const chalId = String(args.p_challenge_id || '')
        if (chalId && mode === 'official') {
          try {
            const ch = await db.olympicChallenge.findUnique({ where: { id: chalId } })
            if (ch && ch.status === 'open' && ch.edition === g.edition && ch.discipline === key && (ch.fromUid === user.id || ch.toUid === user.id)) {
              chalFlag = 'chal:' + ch.id
              chalSeed = ch.seed
            }
          } catch (e) {}
        }
        const seed = chalSeed || (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
        const m = await db.olympicMatch.create({ data: { edition: g.edition, userId: user.id, discipline: key, mode, serverSeed: seed, status: 'open', flags: chalFlag } })
        /* OLY3 PHASE 3: آخرین تلاش رسمی = فینال — بدون تغییر اسکیما */
        /* V89: شب فینال (روز ۵) — آخرین تلاشِ فینالیست‌ها = تلاش فینال رسمی */
        let isFinal = mode === 'official' && !!ent0 && ent0.attempts === hostMax - 1
        if (mode === 'official' && g.phase === 'live' && g.gameDay === 4 && ent0) {
          await olyFinalistsEnsure(g.edition, key, user.id)
          const entF = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
          if (entF && entF.finalist) isFinal = true
        }
        return R({ ok: true, match_id: m.id, seed, token: olyToken(m.id, seed), server_ms: Date.now(), mode, att_max: mode === 'official' ? hostMax : 0, edition: g.edition, is_final: isFinal })
      }

      /* ---------------- V33 olympic_register: pick 3 of 10 (reg window + late entry while live) ----------------
         Late registration during live keeps existing rows (best/attempts preserved)
         so editing your pick mid-games never wipes scores. */
      case 'olympic_register': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const g = gamesPhase()
        if (g.phase !== 'reg' && g.phase !== 'live') return R({ ok: false, reason: 'window' })
        const list = Array.isArray(args.p_disciplines) ? args.p_disciplines.map((x) => String(x)) : []
        const keys = [...new Set(list)].filter((k) => GD_DAY[k] !== undefined)
        if (!keys.length || keys.length > OLY_REG_CAP) return R({ ok: false, reason: 'quota' }) /* V89: هر ۱۲ رشته از ۳۶ */
        const cap = (await db.territory.findFirst({ where: { userId: user.id, isCapital: true } }))
          || (await db.territory.findFirst({ where: { userId: user.id } }))
        if (!cap) return R({ ok: false, reason: 'capital' })
        const prior = await db.olympicEntry.findMany({ where: { edition: g.edition, userId: user.id } })
        for (const p of prior) { if (keys.indexOf(p.discipline) < 0) await db.olympicEntry.delete({ where: { id: p.id } }) }
        const keep = new Set(prior.map((p) => p.discipline).filter((k) => keys.indexOf(k) > -1))
        const cfa = String(args.p_country_fa || cap.country).slice(0, 40)
        for (const k of keys) {
          if (keep.has(k)) continue
          await db.olympicEntry.create({ data: { edition: g.edition, userId: user.id, nick: user.nick, country: cap.country, countryFa: cfa, discipline: k } })
        }
        return R({ ok: true, keys })
      }

      /* ============ O1 — olympic_submit v2: Server Authority + آنتی‌چیت L2/L3/L4/L5/L8/L9 ============
         امتیاز نهایی هرگز از کلاینت پذیرفته نمی‌شود؛ سرور از روی تله‌متری
         (توالی ورودی + زمان‌بندی) با همان فرمول بازی بازمحاسبه می‌کند.
         train: نامحدود، بدون اثر رتبه‌ای. official: گیت اتمی تلاش + رکورد/رتبه. */
      case 'olympic_submit': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const g = gamesPhase()
        const key = String(args.p_discipline || '')
        if (GD_DAY[key] === undefined || !hasRecalc(key)) return R({ ok: false, reason: 'discipline' })
        const mid = String(args.p_match_id || '')
        if (!mid) return R({ ok: false, reason: 'match' })
        const m = await db.olympicMatch.findUnique({ where: { id: mid } })
        if (!m || m.userId !== user.id || m.discipline !== key || m.edition !== g.edition) return R({ ok: false, reason: 'match' })
        if (m.status === 'scored' || m.status === 'closed') return R({ ok: false, reason: 'duplicate' }) /* L8 */
        if (m.status !== 'open') return R({ ok: false, reason: 'match' })
        const startedMs = m.startedAt ? new Date(m.startedAt).getTime() : 0
        if (!startedMs || Date.now() - startedMs > 300000) { /* نشست کهنه — منقضی */
          await db.olympicMatch.update({ where: { id: m.id }, data: { status: 'expired', finishedAt: new Date() } }).catch(() => {})
          return R({ ok: false, reason: 'expired' })
        }
        const nonce = String(args.p_nonce || '').slice(0, 80)
        /* V69 §17/L6: nonce باید توکن HMAC صادره‌ی همان مسابقه باشد — تلاش بدون توکن
           یا با توکن مسابقه‌ی دیگر = رد و علامت‌گذاری bad_nonce (بدون سوزاندن تلاش رسمی) */
        if (!m.serverSeed || nonce !== olyToken(m.id, m.serverSeed)) {
          await db.olympicMatch.update({ where: { id: m.id }, data: { status: 'rejected', flags: 'bad_nonce', clientNonce: nonce, finishedAt: new Date() } }).catch(() => {})
          return R({ ok: false, reason: 'nonce' })
        }
        let tel = args.p_telemetry as Telemetry | string | null | undefined
        if (typeof tel === 'string') { try { tel = JSON.parse(tel) as Telemetry } catch (e) { tel = null } }
        /* L2/L3/L4: بازمحاسبه + قوانین فیزیکی — رد شدن = تلاش سوخت (official) */
        /* O3: نسخه‌ی امتیازدهی بر اساس دوره — دوره‌ی جاری v1، دوره‌های بعدی v2 (بدون کف، مهارت‌محور) */
        /* OLY3: seed نشست + mode به داور نسل ۳ پاس می‌شود (بازمحاسبه‌ی فیزیک seed-محور) */
        const res = computeScore(key, tel, g.edition, { seed: m.serverSeed, mode: m.mode })
        if (!res.ok) {
          await db.olympicMatch.update({ where: { id: m.id }, data: { status: 'rejected', flags: res.reason || 'invalid', clientNonce: nonce, finishedAt: new Date() } }).catch(() => {})
          if (m.mode === 'official') {
            const rateCutR = new Date(Date.now() - 8000)
            await db.olympicEntry.updateMany({ where: { edition: g.edition, userId: user.id, discipline: key, attempts: { lt: 9 }, lastAt: { lte: rateCutR } }, data: { attempts: { increment: 1 }, lastAt: new Date() } }).catch(() => {})
          }
          return R({ ok: false, reason: 'invalid', flags: res.reason || 'invalid' })
        }
        const score = res.score
        await db.olympicMatch.update({ where: { id: m.id }, data: { status: 'scored', score, clientNonce: nonce, finishedAt: new Date(), flags: (res.flags && res.flags.join(',')) || null } })
        if (m.mode !== 'official') {
          /* TRAINING — نامحدود، بدون رکورد/رتبه/تلاش (PHASE 11/12) */
          return R({ ok: true, mode: 'train', train: true, score, best: 0, attempts: 0, rank: null, record_broken: false })
        }
        /* OFFICIAL — گیت اتمی تلاش + ۸s (بدون تغییر از V33.1) */
        const rateCut = new Date(Date.now() - 8000)
        const _h53 = await olyHostGet(g.edition)
        const hostMax = (_h53 && _h53.uid === user.id) ? 6 : 5
        const gate = await db.olympicEntry.updateMany({
          where: { edition: g.edition, userId: user.id, discipline: key, attempts: { lt: hostMax }, lastAt: { lte: rateCut } },
          data: { attempts: { increment: 1 }, lastAt: new Date() },
        })
        if (gate.count === 0) {
          const entG = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
          return R({ ok: false, reason: entG && entG.attempts >= hostMax ? 'attempts' : 'rate' })
        }
        const ent = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
        if (!ent) return R({ ok: false, reason: 'not_registered' })
        const cfa = ent.countryFa || ent.country || null
        /* L9 / PHASE 29: رکورد پرتابی → صف راستی‌آزمایی؛ تا تأیید ادمین وارد رتبه رسمی نمی‌شود */
        const record = await db.olympicRecord.findUnique({ where: { discipline: key } })
        const prevRec = record ? record.score : 0
        const prevHolderNick = record ? record.nick : null
        const suspicious = prevRec > 0 && score > prevRec * 1.35 + 150
        const evArr = Array.isArray((tel as Telemetry).ev) ? ((tel as Telemetry).ev as TelemEvent[]) : undefined
        const model = telModelOf(evArr)
        const bulls = bullseyesFromTelemetry(key, evArr)
        let recordBroken = false
        let recordPending = false
        if (!record || score > prevRec) {
          if (record && score > prevRec) recordBroken = true
          if (suspicious) {
            recordPending = true
            await db.olympicSuspicious.create({ data: { matchId: m.id, edition: g.edition, discipline: key, userId: user.id, nick: user.nick, countryFa: cfa, score, reason: 'outlier', logJson: JSON.stringify(tel).slice(0, 19000) } }).catch(() => {})
          } else {
            if (recordBroken) {
              await addNews(0, 'olympic_record', key, user.nick, null)
              /* O2 / PHASE 28 — حلقه‌ی Retention: رکورددار قبلی خبر هدفمند می‌گیرد؛
                 کلاینت برای او بنر RECORD BROKEN + دکمه‌ی [پس بگیر!] می‌سازد */
              await addNews(0, 'olympic_record_lost', key, user.nick, prevHolderNick)
            }
            await db.olympicRecord.upsert({
              where: { discipline: key },
              create: { discipline: key, score, nick: user.nick, country: cfa, edition: g.edition, matchId: m.id, sv: g.edition >= SIM_V2_ED ? 2 : 1 },
              update: { score, nick: user.nick, country: cfa, edition: g.edition, matchId: m.id, sv: g.edition >= SIM_V2_ED ? 2 : 1 },
            })
            /* L5 / PHASE 44: replay رکورد رسمی ذخیره می‌شود (تله‌متری ورودی، نه ویدیو) */
            await db.olympicMatch.update({ where: { id: m.id }, data: { logJson: JSON.stringify(tel).slice(0, 19000) } }).catch(() => {})
            delete OL_GHOST_CC[key] /* شبح جهانی تازه شود */
          }
        }
        /* O2 — پروفایل مهارت + دستاوردها (فقط رسمی؛ PHASE 50 ضد sandbagging) */
        const prevBest = ent.best
        const best = Math.max(ent.best, score)
        await db.olympicEntry.update({ where: { id: ent.id }, data: { best } })
        const isPr = prevBest > 0 && score > prevBest
        const prof = await olyProfileBump(user.id, g.edition, key, score, model, isPr, bulls)
        const better = await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best: { gt: best } } })
        /* O2 فیکس off-by-one نمایش تلاش (gate خودش increment کرده) + رتبه‌ی tie-break با lastAt
           (هم‌راستا با ترتیب جدول: best desc, lastAt asc — دو امتیاز مساوی هرگز هر دو #۱ نمی‌شوند) */
        const ties = await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best, lastAt: { lt: ent.lastAt } } })
        const myRank = better + ties + 1
        /* دستاوردها از داده‌ی واقعی همین نتیجه (PHASE 27) */
        let newBadges: ReturnType<typeof achDef>[] = []
        if (prof) {
          const keys = evalAchievements({ n: prof.n, nTotal: prof.nTotal, bestEver: prof.bestEver, prCount: prof.prCount, bullseyes: prof.bullseyes, rank: myRank, discipline: key, score, model })
          newBadges = await olyAchieveUnlock(user.id, g.edition, keys)
        }
        /* PHASE 33: نتیجه‌ی کامل — رکورد قبلی، پریدن از X نفر، فاصله تا رتبه‌ی بعد */
        const passed = prevBest > 0
          ? await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best: { gt: prevBest, lt: score } } })
          : 0
        const nextRow = await db.olympicEntry.findFirst({ where: { edition: g.edition, discipline: key, best: { gt: score } }, orderBy: [{ best: 'asc' }], select: { best: true } })
        /* O4-final / PHASE 10: دفتر رقابت ماندگار (تک‌منبع سروری).
           رقیب = نفرِ دقیقاً بالای سرت در همین رشته/دوره (tie-break با lastAt).
           pass  = امتیاز جدیدم از رکوردِ رقیبِ ذخیره‌شده‌ی قبلی رد شد (او را رد کردم)
           fall  = رقیبِ ذخیره‌شده دوباره از من جلو زده (وقتی او بهتر شد و بالا برگشت)
           همه‌ی اعداد از مسابقه‌ی رسمی داور می‌آیند — کلاینت نقشی ندارد. */
        let rival: { nick: string; best: number; ahead: boolean; passes: number; falls: number; gap: number } | null = null
        let rivalPassEvent = false /* V89: برای ماموریت rival1 */
        {
          const above = await db.olympicEntry.findFirst({
            where: { edition: g.edition, discipline: key, best: { gt: best } },
            orderBy: [{ best: 'asc' }, { lastAt: 'asc' }],
            select: { userId: true, nick: true, best: true },
          })
          const ex = await db.olympicRivalry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
          let passes = ex ? ex.passes : 0
          let falls = ex ? ex.falls : 0
          let hist: { t: number; ev: string; vs: string; my: number; rv: number }[] = []
          try { hist = JSON.parse((ex && ex.historyJson) || '[]') } catch (e) { hist = [] }
          if (!Array.isArray(hist)) hist = []
          /* رویداد نسبت به رقیبِ ذخیره‌شده‌ی قبلی (قبل از جابه‌جایی نشانگر):
             pass  = داشتم تعقیبش می‌کردم (ahead=false) و امتیازم از رکوردِ ذخیره‌شده‌اش رد شد
                     و او دیگر بالای سرم نیست (اگر هنوز بالای سرم باشد یعنی او هم بهتر شد — رد نشده)
             fall  = جلویش بودم (ahead=true) و حالا همان نفر دوباره بالای سرم برگشته */
          if (ex && !ex.ahead && best > ex.rivalBest && (!above || above.userId !== ex.rivalUserId)) {
            passes++
            rivalPassEvent = true
            hist.push({ t: Date.now(), ev: 'pass', vs: ex.rivalNick, my: best, rv: ex.rivalBest })
          } else if (ex && ex.ahead && above && above.userId === ex.rivalUserId) {
            falls++
            hist.push({ t: Date.now(), ev: 'fall', vs: ex.rivalNick, my: best, rv: above.best })
          }
          if (above) {
            /* رقیب تازه = نفر فعلی بالای سرم */
            while (hist.length > 12) hist.shift()
            await db.olympicRivalry.upsert({
              where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } },
              create: { edition: g.edition, discipline: key, userId: user.id, rivalUserId: above.userId, rivalNick: above.nick, myBest: best, rivalBest: above.best, passes, falls, ahead: false, historyJson: JSON.stringify(hist) },
              update: { rivalUserId: above.userId, rivalNick: above.nick, myBest: best, rivalBest: above.best, passes, falls, ahead: false, historyJson: JSON.stringify(hist) },
            })
            rival = { nick: above.nick, best: above.best, ahead: false, passes, falls, gap: above.best - best }
          } else if (ex) {
            /* صدر نشسته‌ام — رقیب قبلی را نگه می‌داریم تا fallهای بعدی‌اش ثبت بماند */
            const exEnt = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: ex.rivalUserId, discipline: key } } })
            const exBest = exEnt ? exEnt.best : ex.rivalBest
            while (hist.length > 12) hist.shift()
            await db.olympicRivalry.update({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } }, data: { myBest: best, rivalBest: exBest, passes, falls, ahead: true, historyJson: JSON.stringify(hist) } }).catch(() => {})
            rival = { nick: ex.rivalNick, best: exBest, ahead: true, passes, falls, gap: 0 }
          }
        }
        passAddXp(user.id, 'olympic').catch(() => {}) /* V43: مسیر فصلی — XP المپیک */
        /* ============ V89 — Olympics V2: ورزشکار + ماموریت + فینال + چالش ============ */
        let isFinalRow = false
        let challengeInfo: { id: string; role: string; done: boolean; result?: string } | null = null
        try {
          /* سکه‌ی المپیک: شرکت رسمی +۱ (سقف طبیعی = سقف تلاش) • رکورد جهانی +۵۰ */
          await db.olympicAthlete.upsert({
            where: { userId: user.id },
            create: { userId: user.id, token: recordBroken ? 51 : 1, xp: 12 },
            update: { token: { increment: recordBroken ? 51 : 1 }, xp: { increment: 12 } },
          })
          /* ویژگی‌ها — بازمحاسبه از مسابقه‌ی رسمی (ضد P2W) */
          olyAttrsRecompute(user.id).catch(() => {})
          /* V90 §36: رده‌بندی المپیکی — فقط نتیجه‌ی رسمی داوری‌شده؛ تمرین/ردشده اثری ندارد.
             تلاشِ چالش = رویداد Elo دوطرفه (olyRatingDuel) — نوجه‌ی عملکردی اجرا نمی‌شود تا یک رویداد دوبار نشمارد */
          if (m.mode === 'official' && !(m.flags && String(m.flags).startsWith('chal:'))) olyRatingPerf(user.id, key, score, model).catch(() => {})
          /* ماموریت‌ها — فقط از داده‌ی واقعی همین نتیجه */
          await olyMissionEnsureAll(user.id, g.edition)
          const played = await db.olympicEntry.count({ where: { edition: g.edition, userId: user.id, attempts: { gt: 0 } } })
          for (const mk of ['play3', 'play5', 'play9']) {
            const def = OLY_MISSIONS.find((x) => x.key === mk)
            if (def) await db.olympicMission.updateMany({ where: { edition: g.edition, userId: user.id, key: mk, done: false }, data: { prog: Math.min(def.goal, played), done: played >= def.goal } })
          }
          if (isPr) { await olyMissionBump(user.id, g.edition, 'pb1'); await olyMissionBump(user.id, g.edition, 'pb3') }
          if (rivalPassEvent) await olyMissionBump(user.id, g.edition, 'rival1')
          if (myRank <= 100) await olyMissionBump(user.id, g.edition, 'top100')
          if (myRank <= 10) await olyMissionBump(user.id, g.edition, 'top10')
        } catch (e) { console.log('olyv89sub', e) }
        /* شب فینال (روز ۵): تلاش فینالیست‌ها ثبت می‌شود — رتبه‌ی مدال از همین جدول */
        if (g.phase === 'live' && g.gameDay === 4 && ent.finalist) {
          try {
            await db.olympicFinalAttempt.create({ data: { edition: g.edition, discipline: key, userId: user.id, nick: user.nick, countryFa: cfa, score, matchId: m.id } })
            isFinalRow = true
          } catch (e) {}
        }
        /* چالش رقیب: نشستِ برچسب‌خورده → امتیاز این طرف ثبت، تکمیل دوئل با هر دو امتیاز */
        if (m.flags && String(m.flags).startsWith('chal:')) {
          const cid = String(m.flags).slice(5)
          try {
            const ch0 = await db.olympicChallenge.findUnique({ where: { id: cid } })
            if (ch0 && ch0.status === 'open') {
              const isFrom = ch0.fromUid === user.id
              await db.olympicChallenge.update({ where: { id: cid }, data: isFrom ? { fromScore: score } : { toScore: score } })
              const ch = await db.olympicChallenge.findUnique({ where: { id: cid } })
              if (ch && ch.fromScore > 0 && ch.toScore > 0) {
                const winnerUid = ch.fromScore > ch.toScore ? ch.fromUid : ch.toScore > ch.fromScore ? ch.toUid : null
                await db.olympicChallenge.update({ where: { id: cid }, data: { status: 'done', winnerUid } })
                await addNews(0, 'olympic_challenge_done', ch.discipline, user.nick, isFrom ? ch.toNick : ch.fromNick)
                /* V90 §35: دوئل رسمی = رویداد Elo دوطرفه */
                await olyRatingDuel(ch.discipline, ch.fromUid, ch.toUid, winnerUid)
                challengeInfo = { id: cid, role: isFrom ? 'from' : 'to', done: true, result: winnerUid == null ? 'tie' : winnerUid === user.id ? 'win' : 'loss' }
              } else challengeInfo = { id: cid, role: isFrom ? 'from' : 'to', done: false }
            }
          } catch (e) {}
        }
        try { await opAccrue(user.id, Math.min(30, Math.round(score / 100))) } catch (e) {} /* U7 — المپیک رسمی */
        try { if (typeof challengeInfo !== 'undefined' && challengeInfo && challengeInfo.done && challengeInfo.result === 'win') await opAccrue(user.id, 50) } catch (e2) {} /* U7 — برد دوئل */
        return R({ ok: true, best, attempts: ent.attempts, rank: myRank, record_broken: recordBroken, record_pending: recordPending, score, att_max: hostMax,
          prev_best: prevBest, pr: isPr, passed, next_best: nextRow ? nextRow.best : null, new_badges: newBadges, rival,
          final_row: isFinalRow, challenge: challengeInfo })
      }

      /* ============ O2 — olympic_profile: پروفایل مهارت من (PHASE 49) ============
         هر رشته: Skill/Consistency/Potential + PB همه‌ی دوره‌ها + تاریخچه‌ی
         نتایج رسمی اخیر (برای نمودار رشد) + دستاوردها */
      case 'olympic_profile': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const gP = gamesPhase()
        const profs = await db.olympicProfile.findMany({ where: { userId: user.id } })
        const entsP = await db.olympicEntry.findMany({ where: { edition: gP.edition, userId: user.id } })
        const achs = await db.olympicAchieve.findMany({ where: { userId: user.id }, orderBy: [{ at: 'desc' }] })
        const per: Record<string, unknown> = {}
        for (const p of profs) {
          let ring: RecentScore[] = []
          try { ring = JSON.parse(p.recent || '[]') } catch (e) { ring = [] }
          if (!Array.isArray(ring)) ring = []
          const entP = entsP.find((x) => x.discipline === p.discipline)
          per[p.discipline] = {
            n: p.n, best_ever: p.bestEver, best_edition: p.bestEdition, pr_count: p.prCount, bullseyes: p.bullseyes,
            skill: skillOf(p.discipline, ring), consistency: consistencyOf(p.discipline, ring),
            potential: potentialOf(p.discipline, ring), recent: ring.slice(-10),
            edition_best: entP ? entP.best : 0, edition_attempts: entP ? entP.attempts : 0,
          }
        }
        return R({ ok: true, edition: gP.edition,
          per, n_total: profs.reduce((s, p) => s + p.n, 0),
          achievements: achs.map((a) => ({ key: a.key, edition: a.edition, at: a.at.toISOString() })) })
      }
      /* ============ O2 — olympic_ghost: شبح رقیب (PHASE 9) ============
         جهانی: تله‌متری مسابقه‌ی رکورددار همه‌ی دوران (L5) —
         شخصی: تله‌متری بهترین مسابقه‌ی رسمی خودت */
      case 'olympic_ghost': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const keyG = String(args.p_discipline || '')
        if (GD_DAY[keyG] === undefined) return R({ ok: false, reason: 'discipline' })
        const glob = await olyGhostGlobal(keyG)
        let personal: unknown = null
        const mine = await db.olympicMatch.findFirst({
          where: { userId: user.id, discipline: keyG, status: 'scored', mode: 'official', logJson: { not: null } },
          orderBy: [{ score: 'desc' }],
        })
        if (mine && mine.logJson) personal = { nick: user.nick, score: mine.score, edition: mine.edition, tel: mine.logJson }
        return R({ ok: true, global: glob, personal })
      }
/* ============ V89 — RPCهای اکوسیستم رقابتی المپیک ============ */
      /* شناسنامه‌ی ورزشکار: ویژگی‌ها + تخصص + مدال‌ها + توکن + سطح */
      case 'olympic_athlete': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const card = await olyAthleteCard(user.id, user.nick)
        return R({ ok: true, athlete: card })
      }
      /* ============ V91 — BOX5: پروفایل بوکس (کمپین «دور آخر») ============
         سرور مرجع مطلق: XP/پیشرفت/آمار فقط با کپ‌های سخت اعتبارسنجی می‌شود.
         هیچ پرداختی/جیمی در مسیر نیست — ضد P2W مطلق. */
      case 'boxing_load': {
        const rowB = await db.boxingSave.findUnique({ where: { userId: user.id } })
        return R({ ok: true, profile: rowB ? boxingOut(rowB) : null })
      }
      case 'boxing_save': {
        const kindB = String(args.p_kind || '')
        const pB = (args.p_payload && typeof args.p_payload === 'object' && !Array.isArray(args.p_payload)) ? (args.p_payload as Record<string, unknown>) : {}
        const ci = (v: unknown, lo: number, hi: number) => { const n = Math.round(Number(v) || 0); return n < lo ? lo : n > hi ? hi : n }
        let rowB = await db.boxingSave.findUnique({ where: { userId: user.id } })
        if (!rowB) rowB = await db.boxingSave.create({ data: { userId: user.id } })
        let xpGain = 0
        if (kindB === 'intro') {
          const name = String(pB.name || '').trim().slice(0, 14)
          const gloves = ci(pB.gloves, 0, 0xffffff), shorts = ci(pB.shorts, 0, 0xffffff)
          rowB = await db.boxingSave.update({ where: { userId: user.id }, data: { name: name || rowB.name, gloves, shorts, act: Math.max(rowB.act, 1) } })
        } else if (kindB === 'act') {
          const act = ci(pB.act, 1, 5)
          const win = !!pB.win
          if (act > rowB.act) return R({ ok: false, reason: 'locked' }) /* فقط پرده‌ی بازشده */
          const durMs = ci(pB.durMs, 8000, 600000)
          const thrown = ci(pB.thrown, 0, Math.floor((durMs / 1000) * 4))
          const landed = ci(pB.landed, 0, thrown)
          const counters = ci(pB.counters, 0, landed)
          const dodges = ci(pB.dodges, 0, 80)
          ci(pB.kd, 0, 4) /* اعتبارسنجی ناک‌داون دریافتی — کپ سخت */
          const maxCombo = ci(pB.maxCombo, 0, 12)
          const perfect = ci(pB.perfectRounds, 0, 1)
          const byKo = !!pB.byKo
          let actClear = rowB.actClear ? rowB.actClear.split(',').map(Number).filter((n) => !Number.isNaN(n)) : []
          const firstClear = win && actClear.indexOf(act) < 0
          if (firstClear) actClear.push(act)
          actClear = [...new Set(actClear)].sort()
          const ACT_XP: Record<number, number> = { 1: 150, 2: 220, 3: 280, 4: 360, 5: 520 }
          if (firstClear) {
            xpGain = (ACT_XP[act] || 100) + (perfect ? 40 : 0) + (byKo ? 30 : 0)
          }
          rowB = await db.boxingSave.update({
            where: { userId: user.id },
            data: {
              wins: win ? { increment: 1 } : undefined,
              losses: win ? undefined : { increment: 1 },
              kos: win && byKo ? { increment: 1 } : undefined,
              counters: { increment: counters },
              dodges: { increment: dodges },
              perfectRounds: { increment: perfect },
              xp: { increment: xpGain },
              act: win && act === rowB.act ? Math.min(5, rowB.act + 1) : rowB.act,
              actClear: actClear.join(','),
            },
          })
        } else if (kindB === 'train') {
          const type = String(pB.type || '')
          if (['reaction', 'power', 'stamina', 'defense'].indexOf(type) < 0) return R({ ok: false, reason: 'type' })
          const act = ci(pB.act, 1, 5)
          if (act > rowB.act) return R({ ok: false, reason: 'locked' })
          const score = ci(pB.score, 0, 200)
          let train: Record<string, Record<string, number>> = {}
          try { train = JSON.parse(rowB.trainJson || '{}') } catch (e) { train = {} }
          if (!train[act] || typeof train[act] !== 'object') train[act] = {}
          const prevBest = Number(train[act][type]) || 0
          const improved = score > prevBest
          train[act][type] = Math.max(prevBest, score)
          xpGain = Math.min(30, Math.floor(score / 10))
          const buff = (score >= 60 && improved) ? type : rowB.buff
          rowB = await db.boxingSave.update({ where: { userId: user.id }, data: { trainJson: JSON.stringify(train), xp: { increment: xpGain }, buff } })
        } else if (kindB === 'cos') {
          const gloves = ci(pB.gloves, 0, 0xffffff), shorts = ci(pB.shorts, 0, 0xffffff)
          rowB = await db.boxingSave.update({ where: { userId: user.id }, data: { gloves, shorts } })
        } else {
          return R({ ok: false, reason: 'kind' })
        }
        return R({ ok: true, xpGain, profile: boxingOut(rowB) })
      }
      /* ماموریت‌های دوره + اهراز جایزه (idempotent) */
      case 'olympic_missions': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const gM = gamesPhase()
        if (String(args.p_action || 'list') === 'claim') {
          const key = String(args.p_key || '')
          const m = await db.olympicMission.findUnique({ where: { edition_userId_key: { edition: gM.edition, userId: user.id, key } } })
          if (!m) return R({ ok: false, reason: 'mission' })
          if (!m.done) return R({ ok: false, reason: 'not_done' })
          if (m.claimed) return R({ ok: false, reason: 'claimed' })
          let rw: { token?: number; xp?: number } = {}
          try { rw = JSON.parse(m.rewardJson || '{}') } catch (e) {}
          const token = Number(rw.token) || 0, xp = Number(rw.xp) || 0
          await db.olympicMission.update({ where: { id: m.id }, data: { claimed: true } })
          await db.olympicAthlete.upsert({
            where: { userId: user.id },
            create: { userId: user.id, token, xp },
            update: { token: { increment: token }, xp: { increment: xp } },
          })
          return R({ ok: true, claimed: key, token, xp })
        }
        const rows = await olyMissionEnsureAll(user.id, gM.edition)
        return R({ ok: true, edition: gM.edition, missions: rows.map((m) => ({ key: m.key, prog: m.prog, goal: m.goal, done: m.done, claimed: m.claimed, reward: (function () { try { return JSON.parse(m.rewardJson || '{}') } catch (e) { return {} } })() })) })
      }
      /* فروشگاه سکه‌ی المپیک — فقط زینتی (ضد P2W) */
      case 'olympic_token_spend': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const k = String(args.p_item || '')
        const item = OLY_TOKEN_SHOP.find((x) => x.k === k)
        if (!item) return R({ ok: false, reason: 'item' })
        const a = await olyAthleteEnsure(user.id)
        if (!a) return R({ ok: false, reason: 'athlete' })
        let owned: { k: string; at: number }[] = []
        try { owned = JSON.parse(a.ownedJson || '[]') } catch (e) { owned = [] }
        if (!Array.isArray(owned)) owned = []
        if (owned.some((o) => o && o.k === k)) return R({ ok: false, reason: 'owned' })
        if (a.token < item.price) return R({ ok: false, reason: 'token' })
        owned.push({ k, at: Date.now() })
        await db.olympicAthlete.update({ where: { userId: user.id }, data: { token: { decrement: item.price }, ownedJson: JSON.stringify(owned) } })
        return R({ ok: true, bought: k, token: a.token - item.price, catalog: OLY_TOKEN_SHOP })
      }
      /* تالار افتخارات دائمی */
      case 'olympic_hof': {
        const rows = await db.olympicHof.findMany({ orderBy: [{ value: 'desc' }], take: 120 })
        const byKey: Record<string, unknown[]> = {}
        for (const r of rows) {
          const arr = byKey[r.key] || (byKey[r.key] = [])
          if (arr.length < 10) arr.push({ nick: r.nick, countryFa: r.countryFa, value: r.value, detail: r.detail, edition: r.edition, at: r.at.toISOString() })
        }
        return R({ ok: true, hof: byKey })
      }
      /* رکوردهای ۷گانه: جهانی/فینال/دوره/کشوری/شخصی/الملی */
      case 'olympic_records': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const gR = gamesPhase()
        const world = await db.olympicRecord.findMany({ take: 40 })
        /* رکورد فینال: برنده‌ی هر دوره از OlympicResult (رتبه‌ی ۱) — بهترین در طول تاریخ */
        const golds = await db.olympicResult.findMany({ where: { rank: 1 }, orderBy: [{ score: 'desc' }], take: 300 })
        const finalRec: Record<string, { nick: string; countryFa: string | null; score: number; edition: number }> = {}
        for (const g0 of golds) { if (!finalRec[g0.discipline]) finalRec[g0.discipline] = { nick: g0.nick, countryFa: g0.countryFa, score: g0.score, edition: g0.edition } }
        /* رکورد ملی دوره‌ی جاری: بهترین هر کشور */
        const ents = await db.olympicEntry.findMany({ where: { edition: gR.edition, best: { gt: 0 } }, orderBy: [{ best: 'desc' }], take: 4000 })
        const nat: Record<string, Record<string, { nick: string; best: number }>> = {}
        for (const e of ents) {
          const ck = e.countryFa || e.country || '?'
          if (!nat[e.discipline]) nat[e.discipline] = {}
          if (!nat[e.discipline][ck]) nat[e.discipline][ck] = { nick: e.nick, best: e.best }
        }
        const profs = await db.olympicProfile.findMany({ where: { userId: user.id }, select: { discipline: true, bestEver: true } })
        const minePB: Record<string, number> = {}
        for (const p of profs) minePB[p.discipline] = p.bestEver
        const myEd = await db.olympicEntry.findMany({ where: { edition: gR.edition, userId: user.id }, select: { discipline: true, best: true } })
        const mineSeason: Record<string, number> = {}
        for (const e of myEd) mineSeason[e.discipline] = e.best
        return R({ ok: true, edition: gR.edition, world, final: finalRec, national: nat,
          mine: { personal: minePB, season: mineSeason } })
      }
      /* رقیب پایدار: تجمیع دفتر رقابت بین‌دوره‌ای + چالش‌های باز */
      case 'olympic_rivals': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const rows = await db.olympicRivalry.findMany({ where: { userId: user.id }, orderBy: [{ updatedAt: 'desc' }], take: 200 })
        const agg: Record<string, { nick: string; meetings: number; passes: number; falls: number; discs: string[]; last: number }> = {}
        for (const r of rows) {
          const a = agg[r.rivalUserId] || (agg[r.rivalUserId] = { nick: r.rivalNick, meetings: 0, passes: 0, falls: 0, discs: [], last: 0 })
          a.meetings += r.passes + r.falls
          a.passes += r.passes; a.falls += r.falls
          if (a.discs.indexOf(r.discipline) < 0 && a.discs.length < 8) a.discs.push(r.discipline)
          a.last = Math.max(a.last, new Date(r.updatedAt).getTime())
        }
        const rivals = Object.values(agg).sort((x, y) => y.meetings - x.meetings).slice(0, 8)
        const incoming = await db.olympicChallenge.findMany({ where: { toUid: user.id, status: 'open' }, take: 5 })
        const outgoing = await db.olympicChallenge.findMany({ where: { fromUid: user.id, status: 'open' }, take: 5 })
        const recent = await db.olympicChallenge.findMany({ where: { status: 'done', fromUid: user.id }, orderBy: [{ updatedAt: 'desc' }], take: 5 })
        const fmt = (c: typeof incoming[0]) => ({ id: c.id, edition: c.edition, discipline: c.discipline, from: c.fromNick, to: c.toNick, fromScore: c.fromScore, toScore: c.toScore, winner: c.winnerUid === user.id ? 'me' : c.winnerUid ? 'rival' : null, mine: c.fromUid === user.id ? c.fromScore : c.toScore, theirs: c.fromUid === user.id ? c.toScore : c.fromScore })
        return R({ ok: true, rivals, incoming: incoming.map(fmt), outgoing: outgoing.map(fmt), recent: recent.map(fmt) })
      }
      /* چالش رقیب: ساخت/لغو — دوئل رسمی با seed مشترک؛ نتیجه فقط از مسابقه‌ی رسمی */
      case 'olympic_challenge': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const gC = gamesPhase()
        const act = String(args.p_action || '')
        if (act === 'create') {
          const key = String(args.p_discipline || '')
          const nick = String(args.p_nick || '').trim()
          if (GD_DAY[key] === undefined) return R({ ok: false, reason: 'discipline' })
          if (!nick || nick === user.nick) return R({ ok: false, reason: 'nick' })
          const target = await db.user.findFirst({ where: { nickLower: nick.toLowerCase() } })
          if (!target) return R({ ok: false, reason: 'nick' })
          if (gC.phase !== 'live') return R({ ok: false, reason: 'window' })
          /* سقف چالش باز: حداکثر ۳ چالش فعال از هر نفر */
          const openMine = await db.olympicChallenge.count({ where: { fromUid: user.id, status: 'open' } })
          if (openMine >= 3) return R({ ok: false, reason: 'limit' })
          const dup = await db.olympicChallenge.findFirst({ where: { fromUid: user.id, toUid: target.id, status: 'open', discipline: key } })
          if (dup) return R({ ok: false, reason: 'dup' })
          const seed = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
          const ch = await db.olympicChallenge.create({ data: { edition: gC.edition, discipline: key, seed, fromUid: user.id, fromNick: user.nick, toUid: target.id, toNick: target.nick } })
          return R({ ok: true, challenge: { id: ch.id, discipline: key, to: target.nick } })
        }
        if (act === 'decline') {
          const id = String(args.p_id || '')
          const ch = await db.olympicChallenge.findUnique({ where: { id } })
          if (!ch || ch.toUid !== user.id || ch.status !== 'open') return R({ ok: false, reason: 'challenge' })
          await db.olympicChallenge.update({ where: { id }, data: { status: 'declined' } })
          return R({ ok: true, declined: id })
        }
        return R({ ok: false, reason: 'action' })
      }
      /* ============ V90 — olympic_match: جفت‌یاب المپیکی (§34-35) ============
         پیشنهاد حریف بر پایه‌ی رده‌ی همان رشته — بدون هیچ پرداختی (§35: no Gems):
         پنجره‌ی ±۸۰ → ±۱۶۰ → ±۳۲۰ → ±۶۴۰ → هرکسی؛ اولویت با هم‌پله‌ای‌ها (tier pool).
         p_action=auto: نزدیک‌ترین حریف را انتخاب و مستقیم چالش رسمی می‌سازد
         (همان مسیر olympic_challenge — هیچ سیستم دوئل دوم و موازی‌ای وجود ندارد). */
      case 'olympic_match': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const gMm = gamesPhase()
        const actMm = String(args.p_action || 'suggest')
        const mineMm = await db.olympicRating.findMany({ where: { userId: user.id } })
        const ovMm = overallRatingOf(mineMm)
        const myTierI = tierIndex(ovMm.rating, ovMm.games)
        /* رشته‌ی مبنا: صریح ← پرتکرارترین رشته‌ی من ← اسپرینت */
        let discMm = String(args.p_discipline || '')
        if (!discMm || GD_DAY[discMm] === undefined) {
          discMm = (mineMm.filter((r) => r.games > 0).sort((x, y) => y.games - x.games)[0] || { discipline: 'sprint' }).discipline
          if (GD_DAY[discMm] === undefined) discMm = 'sprint'
        }
        const myRow = mineMm.find((r) => r.discipline === discMm)
        const myR = myRow ? myRow.rating : RD_START
        const myG = myRow ? myRow.games : 0
        const windowsMm = [80, 160, 320, 640, 4000]
        let cands: { userId: string; rating: number; games: number; wins: number; peak: number }[] = []
        for (const w of windowsMm) {
          const rows = await db.olympicRating.findMany({
            where: { discipline: discMm, userId: { not: user.id }, rating: { gte: myR - w, lte: myR + w }, games: { gt: 0 } },
            orderBy: [{ rating: 'desc' }],
            take: 60,
          })
          /* امتیاز نزدیکی: فاصله‌ی رده + جریمه‌ی پله‌ی دورتر (استخر هم‌پله §34) */
          cands = rows
            .map((r) => ({ ...r, d: Math.abs(r.rating - myR) + Math.abs(tierIndex(r.rating, r.games) - myTierI) * 45 }))
            .sort((x, y) => x.d - y.d)
            .slice(0, 8)
          if (cands.length >= 6) break /* پنجره‌ی بازشونده: تا شش نامزد، هرچه earlier شد کافی است */
        }
        const uidsMm = [...new Set(cands.map((c) => c.userId))]
        const usersMm = uidsMm.length ? await db.user.findMany({ where: { id: { in: uidsMm } }, select: { id: true, nick: true } }) : []
        const nickOf = (uid: string) => { const u = usersMm.find((x) => x.id === uid); return u ? u.nick : '—' }
        const suggMm = cands.map((c) => ({ uid: c.userId, nick: nickOf(c.userId), rating: c.rating, peak: c.peak, games: c.games, wins: c.wins, tier: tierOf(c.rating, c.games).key, gap: c.rating - myR }))
        if (actMm !== 'auto') {
          return R({
            ok: true,
            match: {
              discipline: discMm, my_rating: myR, my_games: myG, my_tier: OLY_TIERS[myTierI].key,
              overall: ovMm.rating, overall_games: ovMm.games,
              /* V90: چیپ‌های انتخاب رشته در UI — تا ۶ رشته‌ی رده‌دار خودم */
              my_discs: mineMm.filter((r) => r.games > 0).sort((x, y) => y.games - x.games).slice(0, 6).map((r) => ({ discipline: r.discipline, rating: r.rating, games: r.games })),
              suggestions: suggMm, window_used: cands.length >= 6 ? 'wide-enough' : 'widest',
            },
          })
        }
        /* auto — ساخت چالش رسمی با نزدیک‌ترین نامزد (همان قوانین olympic_challenge) */
        if (gMm.phase !== 'live') return R({ ok: false, reason: 'window' })
        const bestMm = suggMm[0]
        if (!bestMm) return R({ ok: false, reason: 'no_candidate' })
        const openMineMm = await db.olympicChallenge.count({ where: { fromUid: user.id, status: 'open' } })
        if (openMineMm >= 3) return R({ ok: false, reason: 'limit' })
        const recentMineMm = await db.olympicChallenge.findFirst({ where: { fromUid: user.id }, orderBy: [{ createdAt: 'desc' }], select: { createdAt: true } })
        if (recentMineMm && Date.now() - new Date(recentMineMm.createdAt).getTime() < 15000) return R({ ok: false, reason: 'rate' })
        const dupMm = await db.olympicChallenge.findFirst({ where: { fromUid: user.id, toUid: bestMm.uid, status: 'open', discipline: discMm } })
        if (dupMm) return R({ ok: true, match: { discipline: discMm, my_rating: myR, my_tier: OLY_TIERS[myTierI].key, suggestions: suggMm, auto_existing: dupMm.id } })
        const targetMm = await db.user.findUnique({ where: { id: bestMm.uid }, select: { id: true, nick: true } })
        if (!targetMm) return R({ ok: false, reason: 'no_candidate' })
        const seedMm = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
        const chMm = await db.olympicChallenge.create({ data: { edition: gMm.edition, discipline: discMm, seed: seedMm, fromUid: user.id, fromNick: user.nick, toUid: targetMm.id, toNick: targetMm.nick } })
        return R({ ok: true, match: { discipline: discMm, my_rating: myR, my_tier: OLY_TIERS[myTierI].key, suggestions: suggMm, auto: { id: chMm.id, to: targetMm.nick } } })
      }
      /* ============ O1 — oly_verify: رسیدگی به صف رکوردهای مشکوک (L9) ============ */
      case 'oly_verify': {
        if (!user.isAdmin) return R({ ok: false, reason: 'admin' })
        const act = String(args.p_action || 'list')
        if (act === 'list') {
          const rows = await db.olympicSuspicious.findMany({ where: { status: 'pending' }, orderBy: [{ createdAt: 'asc' }], take: 30 })
          return R({ ok: true, rows: rows.map((r) => ({ id: r.id, edition: r.edition, discipline: r.discipline, nick: r.nick, countryFa: r.countryFa, score: r.score, reason: r.reason, at: r.createdAt.toISOString() })) })
        }
        const id = String(args.p_id || '')
        /* O2: پیش‌نمایش تله‌متری صف مشکوک + بازمحاسبه‌ی سروری برای تصمیم ادمین */
        if (act === 'tel') {
          const rowT = await db.olympicSuspicious.findUnique({ where: { id } })
          if (!rowT) return R({ ok: false, reason: 'row' })
          let recalc: { ok: boolean; score: number; reason?: string } | null = null
          try {
            let seedT: string | undefined
            if (rowT.matchId) { const mm = await db.olympicMatch.findUnique({ where: { id: rowT.matchId }, select: { serverSeed: true } }); seedT = mm ? mm.serverSeed : undefined }
            recalc = computeScore(rowT.discipline, rowT.logJson ? (JSON.parse(rowT.logJson) as Telemetry) : null, rowT.edition, { seed: seedT })
          } catch (e) { recalc = null }
          return R({ ok: true, log: rowT.logJson || null, recalc })
        }
        const row = await db.olympicSuspicious.findUnique({ where: { id } }).catch(() => null)
        if (!row || row.status !== 'pending') return R({ ok: false, reason: 'row' })
        if (act === 'reject') {
          await db.olympicSuspicious.update({ where: { id }, data: { status: 'rejected' } })
          return R({ ok: true, action: 'rejected' })
        }
        if (act !== 'confirm') return R({ ok: false, reason: 'action' })
        await db.olympicSuspicious.update({ where: { id }, data: { status: 'confirmed' } })
        const entV = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: row.edition, userId: row.userId, discipline: row.discipline } } })
        if (entV) await db.olympicEntry.update({ where: { id: entV.id }, data: { best: Math.max(entV.best, row.score) } })
        await db.olympicRecord.upsert({
          where: { discipline: row.discipline },
          create: { discipline: row.discipline, score: row.score, nick: row.nick, country: row.countryFa, edition: row.edition, matchId: row.matchId, sv: row.edition >= SIM_V2_ED ? 2 : 1 },
          update: { score: row.score, nick: row.nick, country: row.countryFa, edition: row.edition, matchId: row.matchId, sv: row.edition >= SIM_V2_ED ? 2 : 1 },
        })
        /* O2: رکورد تأییدشده وارد پروفایل مهارت هم می‌شود (ring + bestEver) */
        try {
          let telV: Telemetry | null = null
          try { telV = row.logJson ? (JSON.parse(row.logJson) as Telemetry) : null } catch (e) { telV = null }
          const evV = telV && Array.isArray(telV.ev) ? (telV.ev as TelemEvent[]) : undefined
          await olyProfileBump(row.userId, row.edition, row.discipline, row.score, telModelOf(evV), true, bullseyesFromTelemetry(row.discipline, evV))
        } catch (e) {}
        await addNews(0, 'olympic_record', row.discipline, row.nick, null)
        /* replay تأییدشده به مسابقه منتقل می‌شود */
        if (row.logJson) await db.olympicMatch.update({ where: { id: row.matchId }, data: { logJson: row.logJson } }).catch(() => {})
        OL_GAMES_CC = null /* کش جدول مدال را تازه کن */
        return R({ ok: true, action: 'confirmed' })
      }

      /* ============ V36 — admin event switches (owner-controlled on/off) ============ */
      case 'event_switches':
        return R(await eventSwitches())
      case 'event_switch_set': {
        if (!user.isAdmin) return R({ ok: false, reason: 'admin' })
        const k = String(args.p_key || '')
        if ((EV_KEYS as readonly string[]).indexOf(k) < 0) return R({ ok: false, reason: 'key' })
        const on = !!args.p_on
        await db.gameSetting.upsert({
          where: { key: 'event_' + k },
          create: { key: 'event_' + k, value: on ? '1' : '0' },
          update: { value: on ? '1' : '0' },
        })
        EV_CACHE = { at: 0, map: {} }
        return R({ ok: true, key: k, on })
      }

      /* ============ V53 — کنترل ادمین المپیک: شروع فوری / پایان فوری / بازگشت به برنامه ============ */
      case 'oly_admin_shift': {
        if (!user.isAdmin) return R({ ok: false, reason: 'admin' })
        await olyShiftRefresh(true)
        const mode = String(args.p_mode || '')
        const g0 = gamesPhase()
        if (mode === 'reset') {
          await setSetting('oly_shift', null)
          olyShiftMem = {}; olyShiftAt = Date.now()
          const g = gamesPhase()
          return R({ ok: true, phase: g.phase, edition: g.edition })
        }
        if (mode === 'open') {
          /* V58: افتتاحیه‌ی واقعی — از فاز after هم مجاز است و یک «دور جدید» واقعی شروع می‌کند:
             شماره‌ی دوره جلو می‌رود (جدول مدال/رکورد/آرشیو/میزبان از صفر) و بازی‌ها همان لحظه زنده می‌شوند.
             از pre/reg مثل قبل فقط شروع زودتر همان دوره است. */
          if (g0.phase === 'live') return R({ ok: false, reason: 'phase' })
          if (g0.phase === 'after') {
            const off = await getSetting<number>('oly_edoff', 0).catch(() => 0)
            const nextOff = Math.max(0, Number(off) || 0) + 1
            await setSetting('oly_edoff', nextOff)
            olyEdOffMem = nextOff
            const newEd = g0.edition + 1
            await setSetting('oly_shift', { edition: newEd, openAt: olNow(), closeAt: null })
            olyShiftMem = { edition: newEd, openAt: olNow() }; olyShiftAt = Date.now()
            olyHostCache = null
          } else {
            await setSetting('oly_shift', { edition: g0.edition, openAt: olNow(), closeAt: null })
            olyShiftMem = { edition: g0.edition, openAt: olNow() }; olyShiftAt = Date.now()
          }
        } else if (mode === 'close') {
          /* V57: در فاز after هم بسته است (idempotent) — ادمین می‌تواند مراسم را دوباره ببیند؛
             فقط از pre/reg رد می‌شود. پایان فوری باید بلافاصله اثر کند — اگر شروع چند ثانیه قبل بوده،
             بازه‌ی live به حداقل ۶۰ ثانیه فشرده می‌شود */
          if (g0.phase !== 'live' && g0.phase !== 'after') return R({ ok: false, reason: 'phase' })
          if (g0.phase === 'live') {
            const cAt = olNow()
            const oAt = Math.min((typeof olyShiftMem.openAt === 'number' && olyShiftMem.openAt > 0) ? olyShiftMem.openAt : cAt - 86400000, cAt - 60000)
            await setSetting('oly_shift', { edition: g0.edition, openAt: oAt, closeAt: cAt })
            olyShiftMem = { edition: g0.edition, openAt: oAt, closeAt: cAt }; olyShiftAt = Date.now()
          }
        } else return R({ ok: false, reason: 'mode' })
        try { await ensureGamesClosed() } catch (e) { console.log('olyshiftclose', e) }
        const g = gamesPhase()
        /* V57: داده‌ی اختتامیه در همان پاسخ — کلاینت ادمین مراسم را «همان لحظه» با قهرمان واقعی
           این دوره پخش می‌کند (حتی وقتی دوره قبلاً بسته شده و دکمه فقط پخش‌دوباره است) */
        let close: {
          edition: number; champ_nick: string | null; champ_country: string | null;
          host_city: string; host_country: string; host_cc: string;
          table: { country: string; countryFa: string; g: number; s: number; b: number; total: number }[]
        } | null = null
        if (mode === 'close') {
          try {
            const arch = await db.olympicArchive.findUnique({ where: { edition: g.edition } })
            if (arch) close = {
              edition: arch.edition, champ_nick: arch.championNick, champ_country: arch.championCountry,
              host_city: arch.hostCity, host_country: arch.hostCountry, host_cc: arch.hostCc,
              table: JSON.parse(arch.tableJson || '[]').slice(0, 3),
            }
          } catch (e) { console.log('olyshiftarch', e) }
        }
        return R({ ok: true, phase: g.phase, edition: g.edition, close })
      }

      /* ============ V53 — مزایده‌ی میزبانی المپیک با جم (هر دوره جدا) ============
         پیشنهاد = افزایش روی بالاترین پیشنهاد؛ پیشنهاددهنده‌ی قبلی کامل پس گرفته می‌شود؛
         برداشت با گارد موجودی اتمی است. در فاز live برنده میزبان رسمی دوره است. */
      case 'oly_host_state': {
        const g0 = gamesPhase()
        const cur = await olyHostGet(g0.edition)
        return R({ ok: true, edition: g0.edition, phase: g0.phase, auction_open: g0.phase === 'pre' || g0.phase === 'reg', host: cur ? { uid: cur.uid, nick: cur.nick, amount: cur.amount } : null, min_next: (cur ? cur.amount : 0) + 5 })
      }
      case 'oly_host_bid': {
        const g0 = gamesPhase()
        if (g0.phase !== 'pre' && g0.phase !== 'reg') return R({ ok: false, reason: 'window' })
        const delta = Math.round(Number(args.p_delta) || 0)
        if (!(delta > 0 && delta <= 100000)) return R({ ok: false, reason: 'delta' })
        const key = 'oly_host_e' + g0.edition
        /* V83sec (AUDIT-C P1-2): خواندن→refund→کسر→ثبت داخل یک تراکنش Serializable — قبلاً دو
           رِیس همزمان هر دو همان prev را refund می‌کردند (ضرب جم) و decrement بدون گاردِ gte
           کیف را منفی می‌کرد. P2034 = شکست قفل‌بندی → تا ۳ بار تلاش.
           نکته: ensureWallet داخل تراکنش صدا زده نمی‌شود (کانکشن جدا = بن‌بست قفل با همان ردیف). */
        let bidRes: { ok: boolean; reason?: string; top?: { nick: string; amount: number }; gems?: number; need?: number } | null = null
        for (let att = 0; att < 3 && !bidRes; att++) {
          try {
            bidRes = await db.$transaction(async (tx) => {
              const row = await tx.gameSetting.findUnique({ where: { key } })
              const cur = row ? (JSON.parse(row.value) as { uid: string; nick: string; amount: number; city: string; country: string } | null) : null
              const prevUid = cur && cur.amount > 0 ? cur.uid : null
              const prevAmt = cur ? cur.amount : 0
              if (prevUid) await tx.wallet.update({ where: { userId: prevUid }, data: { gems: { increment: prevAmt } } }).catch(() => {})
              const dec = await tx.wallet.updateMany({ where: { userId: user.id, gems: { gte: delta } }, data: { gems: { decrement: delta } } })
              if (dec.count === 0) {
                if (prevUid) await tx.wallet.update({ where: { userId: prevUid }, data: { gems: { decrement: prevAmt } } }).catch(() => {})
                return { ok: false, reason: 'funds', need: prevAmt + 5 }
              }
              const next = { uid: user.id, nick: user.nick, amount: prevAmt + delta, city: g0.host.c, country: g0.host.n }
              await tx.gameSetting.upsert({ where: { key }, create: { key, value: JSON.stringify(next) }, update: { value: JSON.stringify(next) } })
              const nw = await tx.wallet.findUnique({ where: { userId: user.id } })
              return { ok: true, top: { nick: next.nick, amount: next.amount }, gems: nw ? nw.gems : 0 }
            }, { isolationLevel: 'Serializable' })
          } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code !== 'P2034' || att === 2) {
              console.log('olyhostbid', e)
              bidRes = { ok: false, reason: 'race' }
            }
          }
        }
        if (bidRes && bidRes.ok) {
          olyHostCache = { ed: g0.edition, v: { uid: user.id, nick: user.nick, amount: bidRes.top?.amount || 0, city: g0.host.c, country: g0.host.n }, at: Date.now() }
        }
        return R(bidRes || { ok: false, reason: 'race' })
      }

      /* ============ V36 — per-discipline leaderboard with MY progress ============
        (the hub ranking button used to show only the country medal table — no per-section
         standings, no personal progress; this RPC powers the new per-discipline panel) */
      case 'olympic_rank': {
        if (!(await evOn('olympic'))) return R({ ok: false, reason: 'disabled' })
        const key = String(args.p_discipline || '')
        if (GD_DAY[key] === undefined) return R({ ok: false, reason: 'discipline' })
        const g = gamesPhase()
        if (g.phase === 'after') {
          /* final standings from the frozen podium rows of this edition */
          const res = await db.olympicResult.findMany({ where: { edition: g.edition, discipline: key }, orderBy: [{ rank: 'asc' }], take: 20 })
          const total = await db.olympicResult.count({ where: { edition: g.edition, discipline: key } })
          const mine = await db.olympicResult.findFirst({ where: { edition: g.edition, discipline: key, userId: user.id } })
          return R({ ok: true, edition: g.edition, frozen: true, total, page: 1, pages: 1,
            rows: res.map((r) => ({ rank: r.rank, nick: r.nick, countryFa: r.countryFa || r.country, best: r.score, attempts: 0 })),
            my: mine ? { rank: mine.rank, best: mine.score, attempts: 0, in_podium: true } : null })
        }
        /* O4-final / PHASE 53: صفحه‌بندی واقعی برای مقیاس ۱۰۰هزار بازیکن —
           هر صفحه ۲۰ ردیف، سقف ۵۰ صفحه (top-1000) تا deep-scan ممکن نشود */
        const PAGE_SIZE = 20
        const total = await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best: { gt: 0 } } })
        const page = Math.min(50, Math.max(1, Math.floor(Number(args.p_page) || 1)))
        const pages = Math.min(50, Math.max(1, Math.ceil(total / PAGE_SIZE)))
        const ents = page === 1
          ? await db.olympicEntry.findMany({ where: { edition: g.edition, discipline: key, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }], take: PAGE_SIZE })
          : await db.olympicEntry.findMany({ where: { edition: g.edition, discipline: key, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE })
        const mineRow = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
        let myRank: number | null = null
        if (mineRow && mineRow.best > 0) {
          /* O2: رتبه با همان tie-break جدول (best desc, lastAt asc) — مساوی‌ها ترتیبی می‌شوند */
          const better2 = await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best: { gt: mineRow.best } } })
          const ties2 = await db.olympicEntry.count({ where: { edition: g.edition, discipline: key, best: mineRow.best, lastAt: { lt: mineRow.lastAt } } })
          myRank = better2 + ties2 + 1
        }
        const leader = ents.length ? ents[0].best : 0
        /* O2 / PHASE 7: فاصله تا رتبه‌ی بعدی (فقط ۸ امتیاز!) + صدر کشور خودت */
        let nextBest: number | null = null
        if (mineRow && mineRow.best > 0) {
          const nb = await db.olympicEntry.findFirst({ where: { edition: g.edition, discipline: key, best: { gt: mineRow.best } }, orderBy: [{ best: 'asc' }], select: { best: true } })
          nextBest = nb ? nb.best : null
        }
        let countryBest: number | null = null
        const myC = mineRow ? (mineRow.country || null) : null
        if (myC) {
          const cb = await db.olympicEntry.findFirst({ where: { edition: g.edition, discipline: key, country: myC, best: { gt: 0 } }, orderBy: [{ best: 'desc' }], select: { best: true, nick: true } })
          countryBest = cb ? cb.best : null
        }
        /* O4-final / PHASE 10: رقیب فعلی از دفتر رقابت (پایدار بین submitها) */
        const rivRow = await db.olympicRivalry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
        const rivalOut = rivRow ? { nick: rivRow.rivalNick, best: rivRow.rivalBest, ahead: rivRow.ahead, passes: rivRow.passes, falls: rivRow.falls, gap: Math.max(0, rivRow.rivalBest - rivRow.myBest) } : null
        /* rank ها نسبت به صفحه‌ی درخواستی (rank جهانی = offset + i + 1) */
        return R({ ok: true, edition: g.edition, frozen: false, total, leader, page, pages,
          rows: ents.map((e, i) => ({ rank: (page - 1) * PAGE_SIZE + i + 1, nick: e.nick, countryFa: e.countryFa || e.country, best: e.best, attempts: e.attempts })),
          my: (mineRow && mineRow.best > 0)
            ? { rank: myRank, best: mineRow.best, attempts: mineRow.attempts, in_podium: myRank !== null && myRank <= 20, next_best: nextBest, country_best: countryBest, rival: rivalOut }
            : (mineRow ? { rank: null, best: 0, attempts: mineRow.attempts, in_podium: false, next_best: null, country_best: countryBest, rival: rivalOut } : null) })
      }

      /* ============ V34 — social & competitive layer ============ */

      /* daily streak status (the reward itself auto-grants on get_wallet) */
      case 'streak_status': {
        const row = await db.dailyStreak.findUnique({ where: { userId: user.id } })
        const today = dayKey(), yest = dayKey(Date.now() - DAY_MS)
        const claimedToday = !!row && row.lastDay === today
        const nextStreak = row ? (row.lastDay === today ? row.streak : (row.lastDay === yest ? row.streak + 1 : 1)) : 1
        const rw = STREAK_CYCLE[(nextStreak - 1) % 7]
        return R({
          streak: claimedToday ? row!.streak : 0, /* current banked streak (shown as 🔥) */
          if_claim_now: nextStreak, best: row ? row.best : 0, total: row ? row.totalClaims : 0,
          claimed_today: claimedToday, day_in_cycle: ((nextStreak - 1) % 7) + 1,
          next: rw, cycle_len: STREAK_CYCLE.length,
        })
      }

      /* ---------- duels: two-way challenge → 2h sanctioned war window (bypasses truce) ---------- */
      case 'duel_send': {
        if (!(await evOn('duels'))) return R({ ok: false, error: 'disabled' })
        const server = Math.max(1, Number(args.p_server) || 1)
        const toNick = String(args.p_to_nick || '').trim()
        if (!toNick) return R({ ok: false, error: 'nick' })
        const target = await db.user.findFirst({ where: { nickLower: toNick.toLowerCase() } })
        if (!target || target.id === user.id) return R({ ok: false, error: 'player' })
        const tsc = await db.score.findUnique({ where: { userId: target.id } })
        if (!tsc || tsc.server !== server) return R({ ok: false, error: 'server' })
        const openCnt = await db.duel.count({ where: { fromUid: user.id, status: 'open' } })
        if (openCnt >= 5) return R({ ok: false, error: 'limit' })
        const exists = await db.duel.findFirst({
          where: { server, status: { in: ['open', 'live'] }, OR: [{ fromUid: user.id, toUid: target.id }, { fromUid: target.id, toUid: user.id }] },
        })
        if (exists) return R({ ok: false, error: 'exists' })
        const d = await db.duel.create({ data: { server, fromUid: user.id, fromNick: user.nick, toUid: target.id, toNick: target.nick, expiresAt: new Date(Date.now() + DUEL_INVITE_MS) } })
        await addNews(server, 'duel_open', null, user.nick, target.nick)
        return R({ ok: true, id: d.id })
      }
      case 'duel_list': {
        const server = Math.max(1, Number(args.p_server) || 1)
        await sweepDuels(server)
        const now = new Date()
        const mine = await db.duel.findMany({ where: { server, status: { in: ['open', 'live'] }, OR: [{ fromUid: user.id }, { toUid: user.id }] }, orderBy: { createdAt: 'desc' }, take: 20 })
        const live = await db.duel.findMany({ where: { server, status: 'live', expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' }, take: 15 })
        const recent = await db.duel.findMany({ where: { server, status: { in: ['done', 'expired', 'declined'] } }, orderBy: { createdAt: 'desc' }, take: 12 })
        const ids = [...new Set([...mine, ...live, ...recent].map((d) => d.id))]
        const bets = ids.length ? await db.duelBet.findMany({ where: { duelId: { in: ids } } }) : []
        const potOf = (id: string) => bets.filter((b) => b.duelId === id).reduce((s, b) => s + b.amount, 0)
        const myBet = (id: string) => bets.find((b) => b.duelId === id && b.userId === user.id) || null
        const fmt = (d: typeof mine[number]) => {
          const mb = myBet(d.id)
          return {
            id: d.id, from: d.fromNick, to: d.toNick, from_uid: d.fromUid, to_uid: d.toUid, status: d.status, winner: d.winnerNick || null,
            pot: potOf(d.id), ends: d.expiresAt.toISOString(), mine: d.fromUid === user.id,
            incoming: d.toUid === user.id && d.status === 'open',
            my_bet: mb ? { on: mb.onUid, amount: mb.amount, paid: mb.paid, settled: mb.settled } : null,
          }
        }
        return R({ mine: mine.map(fmt), live: live.map(fmt), recent: recent.map(fmt) })
      }
      case 'duel_accept': {
        if (!(await evOn('duels'))) return R({ ok: false, error: 'disabled' })
        const id = String(args.p_id || '')
        const d = await db.duel.findUnique({ where: { id } })
        if (!d || d.toUid !== user.id || d.status !== 'open') return R({ ok: false, error: 'gone' })
        if (d.expiresAt.getTime() < Date.now()) return R({ ok: false, error: 'expired' })
        const cl = await db.duel.updateMany({ where: { id, status: 'open' }, data: { status: 'live', expiresAt: new Date(Date.now() + DUEL_LIVE_MS) } })
        if (cl.count === 0) return R({ ok: false, error: 'gone' })
        await addNews(d.server, 'duel_live', null, d.fromNick, d.toNick)
        return R({ ok: true })
      }
      case 'duel_decline': {
        const id = String(args.p_id || '')
        const d = await db.duel.findUnique({ where: { id } })
        if (!d || d.status !== 'open' || (d.fromUid !== user.id && d.toUid !== user.id)) return R({ ok: false })
        const cl = await db.duel.updateMany({ where: { id, status: 'open' }, data: { status: 'declined' } })
        if (cl.count) await settleDuelBets(id, null) /* refund any early bets */
        return R({ ok: cl.count > 0 })
      }
      case 'duel_bet': {
        if (!(await evOn('duels'))) return R({ ok: false, error: 'disabled' })
        const id = String(args.p_id || '')
        const amount = Math.round(Number(args.p_amount) || 0)
        const d = await db.duel.findUnique({ where: { id } })
        if (!d || !['open', 'live'].includes(d.status) || d.expiresAt.getTime() < Date.now()) return R({ ok: false, error: 'gone' })
        if (d.fromUid === user.id || d.toUid === user.id) return R({ ok: false, error: 'fighter' })
        const onUid = String(args.p_on_uid || '')
        if (onUid !== d.fromUid && onUid !== d.toUid) return R({ ok: false, error: 'side' })
        if (amount < 100 || amount > 50000) return R({ ok: false, error: 'amount' })
        const already = await db.duelBet.findUnique({ where: { duelId_userId: { duelId: id, userId: user.id } } })
        if (already) return R({ ok: false, error: 'already' })
        const okPay = await tradeApply(user.id, (r) => { r.gold = resNum(r.gold) - amount })
        if (!okPay) return R({ ok: false, error: 'funds' })
        try {
          await db.duelBet.create({ data: { duelId: id, userId: user.id, nick: user.nick, onUid, amount } })
        } catch (e) {
          await tradeApply(user.id, (r) => { r.gold = resNum(r.gold) + amount }).catch(() => {})
          return R({ ok: false, error: 'already' })
        }
        await db.duel.update({ where: { id }, data: { pot: { increment: amount } } })
        return R({ ok: true })
      }

      /* ---------- revenge rights ---------- */
      case 'revenge_list': {
        const rows = await db.revengeMark.findMany({ where: { userId: user.id, used: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, take: 20 })
        return R(rows.map((r) => ({ id: r.id, target: r.targetNick, target_uid: r.targetUid, expires: r.expiresAt.toISOString() })))
      }

      /* ---------- war heatmap (48h battle intensity per country) ---------- */
      case 'heatmap_data': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const since = new Date(Date.now() - 48 * 3600_000)
        const rows = await db.battleLog.groupBy({ by: ['country'], where: { server, createdAt: { gte: since } }, _count: { country: true } })
        const max = rows.reduce((m, r) => Math.max(m, r._count.country), 0)
        return R({ since: since.toISOString(), max, cells: rows.filter((r) => r.country).map((r) => ({ country: r.country as string, n: r._count.country })).sort((a, b) => b.n - a.n).slice(0, 120) })
      }

      /* ---------- world elections: 10-day cycle (4d candidacy + 6d voting) ---------- */
      case 'election_status': {
        const server = Math.max(1, Number(args.p_server) || 1)
        await electionSweep(server)
        const now = Date.now()
        const cycle = elecCycle()
        const dayIn = (now - cycle * ELEC_MS) / DAY_MS
        const phase = dayIn < 4 ? 'cand' : 'vote'
        const endsAt = new Date(cycle * ELEC_MS + (phase === 'cand' ? 4 * DAY_MS : ELEC_MS))
        const cands = await db.electionCandidate.findMany({ where: { server, cycle } })
        const votes = await db.electionVote.findMany({ where: { server, cycle } })
        const myVote = votes.find((v) => v.userId === user.id) || null
        const tally: Record<string, number> = {}
        for (const v of votes) tally[v.toUid] = (tally[v.toUid] || 0) + 1
        /* the serving president is the winner of the previous cycle (or an instant-finalized current one) */
        const curWinner = await db.electionWinner.findUnique({ where: { server_cycle: { server, cycle } } })
        const prevWinner = curWinner || await db.electionWinner.findFirst({ where: { server, cycle: cycle - 1 } })
        return R({
          cycle, phase, ends_at: endsAt.toISOString(),
          candidates: cands.map((c) => ({ uid: c.userId, nick: c.nick, slogan: c.slogan, votes: tally[c.userId] || 0 })).sort((a, b) => b.votes - a.votes),
          my_vote: myVote ? myVote.toUid : null,
          president: prevWinner ? { nick: prevWinner.nick, cycle: prevWinner.cycle, votes: prevWinner.votes, until: new Date((prevWinner.cycle + 2) * ELEC_MS).toISOString() } : null,
        })
      }
      case 'election_candidacy': {
        if (!(await evOn('elections'))) return R({ ok: false, error: 'disabled' })
        const server = Math.max(1, Number(args.p_server) || 1)
        const cycle = elecCycle()
        const dayIn = (Date.now() - cycle * ELEC_MS) / DAY_MS
        if (dayIn >= 4) return R({ ok: false, error: 'phase' })
        const cap = await db.territory.findFirst({ where: { userId: user.id, server, isCapital: true } })
        if (!cap) return R({ ok: false, error: 'capital' })
        const slogan = String(args.p_slogan || '').slice(0, 80)
        await db.electionCandidate.upsert({
          where: { server_cycle_userId: { server, cycle, userId: user.id } },
          create: { server, cycle, userId: user.id, nick: user.nick, slogan },
          update: { slogan, nick: user.nick },
        })
        return R({ ok: true })
      }
      case 'election_vote': {
        if (!(await evOn('elections'))) return R({ ok: false, error: 'disabled' })
        const server = Math.max(1, Number(args.p_server) || 1)
        const cycle = elecCycle()
        const dayIn = (Date.now() - cycle * ELEC_MS) / DAY_MS
        if (dayIn < 4) return R({ ok: false, error: 'phase' })
        const toUid = String(args.p_to_uid || '')
        const cand = await db.electionCandidate.findUnique({ where: { server_cycle_userId: { server, cycle, userId: toUid } } })
        if (!cand) return R({ ok: false, error: 'candidate' })
        await db.electionVote.upsert({
          where: { server_cycle_userId: { server, cycle, userId: user.id } },
          create: { server, cycle, userId: user.id, toUid },
          update: { toUid },
        })
        return R({ ok: true })
      }

      /* ---------- mentorship: veterans (score>=600 or 3+ lands) bond with newcomers ---------- */
      case 'mentor_status': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const today = dayKey()
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        const myTerr = await db.territory.count({ where: { userId: user.id, server } })
        const isVet = (myScore?.score || 0) >= 600 || myTerr >= 3
        const offers = await db.mentorOffer.findMany({ where: { server }, take: 30, orderBy: { createdAt: 'desc' } })
        const myLinks = await db.mentorLink.findMany({ where: { OR: [{ mentorUid: user.id }, { menteeUid: user.id }], status: { in: ['pending', 'active'] } } })
        const myOffer = await db.mentorOffer.findUnique({ where: { userId: user.id } })
        const asMentee = myLinks.find((l) => l.menteeUid === user.id) || null
        return R({
          is_vet: isVet, today,
          my_offer: myOffer ? { bio: myOffer.bio } : null,
          offers: offers.filter((o) => o.userId !== user.id).map((o) => ({ uid: o.userId, nick: o.nick, bio: o.bio })),
          as_mentor: myLinks.filter((l) => l.mentorUid === user.id).map((l) => ({ id: l.id, mentee: l.menteeNick, status: l.status, days: l.days, claimable: l.status === 'active' && l.lastDay !== today })),
          as_mentee: asMentee ? { id: asMentee.id, mentor: asMentee.mentorNick, status: asMentee.status, days: asMentee.days, claimable: asMentee.status === 'active' && asMentee.lastDay !== today } : null,
        })
      }
      case 'mentor_offer_set': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const on = !!args.p_on
        if (!on) { await db.mentorOffer.deleteMany({ where: { userId: user.id } }); return R({ ok: true, on: false }) }
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        const myTerr = await db.territory.count({ where: { userId: user.id, server } })
        if ((myScore?.score || 0) < 600 && myTerr < 3) return R({ ok: false, error: 'vet' })
        const bio = String(args.p_bio || '').slice(0, 100)
        await db.mentorOffer.upsert({ where: { userId: user.id }, create: { userId: user.id, server, nick: user.nick, bio }, update: { bio, nick: user.nick } })
        return R({ ok: true, on: true })
      }
      case 'mentor_request': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const toUid = String(args.p_to_uid || '')
        const offer = await db.mentorOffer.findUnique({ where: { userId: toUid } })
        if (!offer || offer.server !== server) return R({ ok: false, error: 'offer' })
        if (toUid === user.id) return R({ ok: false, error: 'self' })
        const exist = await db.mentorLink.findFirst({ where: { menteeUid: user.id, status: { in: ['pending', 'active'] } } })
        if (exist) return R({ ok: false, error: 'exists' })
        await db.mentorLink.create({ data: { server, mentorUid: toUid, mentorNick: offer.nick, menteeUid: user.id, menteeNick: user.nick } })
        return R({ ok: true })
      }
      case 'mentor_accept': {
        const id = String(args.p_id || '')
        const ok = args.p_ok !== false
        const link = await db.mentorLink.findUnique({ where: { id } })
        if (!link || link.mentorUid !== user.id || link.status !== 'pending') return R({ ok: false })
        if (ok) { await db.mentorLink.update({ where: { id }, data: { status: 'active' } }); return R({ ok: true, status: 'active' }) }
        await db.mentorLink.delete({ where: { id } })
        return R({ ok: true, status: 'rejected' })
      }
      case 'mentor_daily': {
        const today = dayKey()
        let gems = 0, gold = 0, links = 0
        const active = await db.mentorLink.findMany({ where: { OR: [{ mentorUid: user.id }, { menteeUid: user.id }], status: 'active' } })
        for (const l of active) {
          if (l.lastDay === today) continue
          /* the bond only pays when the MENTEE actually played today (a save touch) */
          const sv = await db.save.findUnique({ where: { userId: l.menteeUid }, select: { updatedAt: true } })
          if (!sv || dayKey(sv.updatedAt.getTime()) !== today) continue
          const cl = await db.mentorLink.updateMany({ where: { id: l.id, lastDay: l.lastDay ?? null }, data: { days: { increment: 1 }, lastDay: today } })
          if (!cl.count) continue
          links++
          /* ONE atomic tick pays BOTH sides — mentor +3💎, mentee +8k gold —
             so either side's claim covers the day and the other side is credited too */
          await db.wallet.updateMany({ where: { userId: l.mentorUid }, data: { gems: { increment: MENTOR_REWARDS.mentorGems } } }).catch(() => {})
          await tradeApply(l.menteeUid, (r) => { r.gold = resNum(r.gold) + MENTOR_REWARDS.menteeGold }).catch(() => {})
          if (l.mentorUid === user.id) gems += MENTOR_REWARDS.mentorGems
          else gold += MENTOR_REWARDS.menteeGold
        }
        return R({ ok: true, gems, gold, links })
      }

      /* ---------- alliances: tag, member cap 10, collective power ---------- */
      case 'alliance_create': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const name = String(args.p_name || '').trim().slice(0, 20)
        const tag = String(args.p_tag || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
        if (name.length < 3 || tag.length < 2) return R({ ok: false, error: 'bad' })
        const mine = await db.allianceMember.findUnique({ where: { userId: user.id } })
        if (mine) return R({ ok: false, error: 'member' })
        const cost = 10000
        const okPay = await tradeApply(user.id, (r) => { r.gold = resNum(r.gold) - cost })
        if (!okPay) return R({ ok: false, error: 'funds' })
        try {
          const a = await db.alliance.create({ data: { server, name, tag, ownerUid: user.id, ownerNick: user.nick } })
          await db.allianceMember.create({ data: { allianceId: a.id, userId: user.id, nick: user.nick, role: 'owner' } })
          await addNews(server, 'alliance_new', null, name + ' [' + tag + ']', user.nick)
          return R({ ok: true, id: a.id, tag })
        } catch (e) {
          const c = (e as { code?: string })?.code
          if (c === 'P2002') { await tradeApply(user.id, (r) => { r.gold = resNum(r.gold) + cost }).catch(() => {}); return R({ ok: false, error: 'tag' }) }
          throw e
        }
      }
      case 'alliance_list': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const rows = await db.alliance.findMany({ where: { server }, take: 50, orderBy: { createdAt: 'asc' } })
        const mem = await db.allianceMember.findMany({ where: { alliance: { server } } })
        const scores = await db.score.findMany({ where: { server }, select: { userId: true, score: true } })
        const scOf: Record<string, number> = {}
        for (const s of scores) scOf[s.userId] = s.score
        const myMem = mem.find((m) => m.userId === user.id) || null
        const list = rows.map((a) => {
          const ms = mem.filter((m) => m.allianceId === a.id)
          return { id: a.id, name: a.name, tag: a.tag, owner: a.ownerNick, members: ms.length, power: ms.reduce((s, m) => s + (scOf[m.userId] || 0), 0) }
        }).sort((x, y) => y.power - x.power)
        return R({ list, tags: await allianceTagMap(server), mine_tag: myMem ? (rows.find((a) => a.id === myMem.allianceId)?.tag || null) : null, mine_id: myMem ? myMem.allianceId : null })
      }
      case 'alliance_info': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const me = await db.allianceMember.findUnique({ where: { userId: user.id }, include: { alliance: true } })
        if (!me || me.alliance.server !== server) return R(null)
        const ms = await db.allianceMember.findMany({ where: { allianceId: me.allianceId }, orderBy: { id: 'asc' } })
        const scores = await db.score.findMany({ where: { server }, select: { userId: true, score: true, conquered: true } })
        const scOf: Record<string, { score: number; conquered: number }> = {}
        for (const s of scores) scOf[s.userId] = { score: s.score, conquered: s.conquered }
        return R({
          id: me.alliance.id, name: me.alliance.name, tag: me.alliance.tag, owner: me.alliance.ownerNick,
          i_am_owner: me.alliance.ownerUid === user.id,
          members: ms.map((m) => ({ uid: m.userId, nick: m.nick, role: m.role, score: scOf[m.userId]?.score || 0, terr: scOf[m.userId]?.conquered || 0 })).sort((a, b) => b.score - a.score),
          power: ms.reduce((s, m) => s + (scOf[m.userId]?.score || 0), 0),
        })
      }
      case 'alliance_join': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const id = String(args.p_id || '')
        const a = await db.alliance.findUnique({ where: { id } })
        if (!a || a.server !== server) return R({ ok: false, error: 'gone' })
        const mine = await db.allianceMember.findUnique({ where: { userId: user.id } })
        if (mine) return R({ ok: false, error: 'member' })
        const cnt = await db.allianceMember.count({ where: { allianceId: id } })
        if (cnt >= 10) return R({ ok: false, error: 'full' })
        try { await db.allianceMember.create({ data: { allianceId: id, userId: user.id, nick: user.nick } }) } catch (e) {
          const c = (e as { code?: string })?.code
          if (c === 'P2002') return R({ ok: false, error: 'member' })
          throw e
        }
        await addNews(server, 'alliance_join', null, user.nick, a.tag)
        return R({ ok: true, tag: a.tag })
      }
      case 'alliance_leave': {
        const me = await db.allianceMember.findUnique({ where: { userId: user.id }, include: { alliance: true } })
        if (!me) return R({ ok: false })
        const others = await db.allianceMember.findMany({ where: { allianceId: me.allianceId, userId: { not: user.id } }, orderBy: { id: 'asc' } })
        await db.allianceMember.delete({ where: { id: me.id } })
        if (me.alliance.ownerUid === user.id) {
          if (others.length) await db.alliance.update({ where: { id: me.allianceId }, data: { ownerUid: others[0].userId, ownerNick: others[0].nick } })
          else {
            await db.alliance.delete({ where: { id: me.allianceId } })
            await addNews(me.alliance.server, 'alliance_gone', null, me.alliance.name, null)
          }
        }
        return R({ ok: true })
      }

      /* ---------------- news / chat ---------------- */
      case 'get_world_news': {
        const server = Number(args.p_server || 1)
        const limit = Math.min(200, Math.max(1, Number(args.p_limit || 60)))
        /* server 0 = global channel (V33 olympic games) — visible on every server's ticker */
        const rows = await db.worldNews.findMany({ where: { server: { in: [server, 0] } }, orderBy: { createdAt: 'desc' }, take: limit })
        return R(rows.map((r) => ({
          action: r.action,
          country: r.country,
          actor_nick: r.actorNick,
          target_nick: r.targetNick,
          created_at: r.createdAt.toISOString(),
        })))
      }
      case 'get_world_chat': {
        const server = Number(args.p_server || 1)
        const limit = Math.min(200, Math.max(1, Number(args.p_limit || 100)))
        const rows = await db.worldChat.findMany({ where: { server }, orderBy: { createdAt: 'desc' }, take: limit })
        return R(rows.map((r) => ({
          user_id: r.userId,
          nick: r.nick,
          message: r.message,
          created_at: r.createdAt.toISOString(),
        })))
      }

      /* ---------------- v23 server bridge ---------------- */
      case 'wd_init_player': {
        /* V33.1: nick is FORCED to the session user's nick — a client-chosen p_nick let
           anyone impersonate arbitrary players on leaderboards and medal tables */
        /* V86: اگر سرورِ درخواستی تستی باشد، ورودِ تازه به نخستین سرور غیرتستی می‌رود؛
           ضمناً server دیگر در هر بوت بازنویسی نمی‌شود (تخصیص نهایی با pickServer/territory_sync است) */
        const tst86 = await testSrvsGet()
        let server = Math.max(1, Number(args.p_server) || 1)
        if (tst86.includes(server)) {
          server = 1
          for (let k = 1; k <= 20; k++) { if (!tst86.includes(k)) { server = k; break } }
        }
        await db.score.upsert({
          where: { userId: user.id },
          create: { userId: user.id, nick: user.nick, server },
          update: { nick: user.nick },
        })
        return R({ ok: true })
      }
      case 'wd_get_state': {
        const save = await db.save.findUnique({ where: { userId: user.id } })
        const st = save ? JSON.parse(save.state || '{}') : {}
        const units = (st.units || {}) as Record<string, number>
        const infra = (st.infra || {}) as Record<string, number>
        const res = (st.res || {}) as Record<string, number>
        const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
        const myScore = await db.score.findUnique({ where: { userId: user.id } })
        return R({
          player: {
            gold: num(res.gold),
            oil: num(res.oil),
            food: num(res.food),
            score: myScore?.score || 0,
          },
          army: {
            infantry: num(units.infantry),
            tanks: num(units.tank),
            aircraft: num(units.fighter),
            artillery: num(units.missile),
            navy: num(units.destroyer),
            special: num(units.drone),
          },
          buildings: {
            farms: 0,
            oil_wells: num(infra.oil),
            factories: num(infra.arms),
            power_plants: 0,
            barracks: 0,
            research: 0,
            storage: num(infra.storage),
          },
        })
      }

      /* ---------------- V43: جهان زنده + مسیر فصلی + ضدتقلب ---------------- */
      case 'world_state':
        return R(await worldState())

      case 'pass_state': {
        const row = await ensurePass(user.id)
        let dlog: PassDlog = {}
        try { dlog = JSON.parse(row.dlog || '{}') || {} } catch { dlog = {} }
        const today = new Date().toISOString().slice(0, 10)
        const counts = dlog.d === today ? (dlog.c || {}) : {}
        return R({
          ok: true, season: row.season, xp: row.xp, tier: Math.floor(row.xp / PASS_TIER_XP),
          tier_xp: PASS_TIER_XP, claimed: row.claimed, missions: counts, mission_defs: PASS_MISSIONS, tiers: PASS_TIERS,
        })
      }

      case 'pass_xp': {
        const m = String(args.p_mission || '')
        /* V69 §26: مأموریت‌های سروری فقط از مسیر داورِ سرور اعطا می‌شوند —
           conquest ← territory_sync/transferTerritory، olympic ← olympic_submit.
           درخواست مستقیم کلاینت برای این‌ها رد می‌شود (rpc43 کلاینت بی‌صدا null می‌گیرد). */
        if (m === 'conquest' || m === 'olympic') return R({ ok: false, error: 'mission' })
        const r = await passAddXp(user.id, m)
        if (!r) return R({ ok: false, error: 'mission' })
        return R(r)
      }

      case 'pass_claim': {
        const tier = Math.max(0, Math.min(PASS_TIERS.length - 1, Number(args.p_tier) || 0))
        const row = await ensurePass(user.id)
        const myTier = Math.floor(row.xp / PASS_TIER_XP)
        if (tier > myTier) return R({ ok: false, error: 'locked' })
        const bit = 1 << tier
        if (row.claimed & bit) return R({ ok: false, error: 'claimed' })
        /* atomic: only one claimer wins the bit flip */
        const upd = await db.seasonPass.updateMany({ where: { userId: user.id, season: seasonKey(), claimed: row.claimed }, data: { claimed: row.claimed | bit } })
        if (upd.count === 0) return R({ ok: false, error: 'race' })
        const rw = PASS_TIERS[tier]
        let gems = 0
        if (rw.gem) {
          await ensureWallet(user.id)
          await db.wallet.updateMany({ where: { userId: user.id }, data: { gems: { increment: rw.gem } } })
          gems = rw.gem
        }
        if (rw.g || rw.f) {
          await tradeApply(user.id, (r2) => {
            if (rw.g) r2.gold = resNum(r2.gold) + rw.g
            if (rw.f) r2.food = resNum(r2.food) + rw.f
          }).catch(() => {})
        }
        return R({ ok: true, tier, reward: rw, gems_added: gems })
      }

      case 'abuse_report': {
        const target = String(args.p_target || '').trim().slice(0, 32)
        const reason = String(args.p_reason || '').trim().slice(0, 300) || 'unspecified'
        if (!target || target.toLowerCase() === String(user.nick || '').toLowerCase()) return R({ ok: false, error: 'target' })
        const since = new Date(Date.now() - 24 * 3600_000)
        const mine = await db.abuseReport.count({ where: { reporterId: user.id, createdAt: { gte: since } } })
        if (mine >= 5) return R({ ok: false, error: 'rate' })
        const dup = await db.abuseReport.findFirst({ where: { reporterId: user.id, targetNick: { equals: target }, createdAt: { gte: since } } })
        if (dup) return R({ ok: false, error: 'dup' })
        const exists = await db.user.findFirst({ where: { nickLower: target.toLowerCase() }, select: { id: true } })
        if (!exists) return R({ ok: false, error: 'no_user' })
        const rep = await db.abuseReport.create({ data: { server: Math.max(1, Number(args.p_server) || 1), reporterId: user.id, targetNick: target, reason } })
        return R({ ok: true, id: rep.id })
      }

      case 'abuse_list': {
        if (!user.isAdmin) return R(null)
        const open = await db.abuseReport.findMany({ where: { status: 'open' }, orderBy: { createdAt: 'desc' }, take: 60 })
        const byTarget: Record<string, number> = {}
        for (const r of open) byTarget[r.targetNick] = (byTarget[r.targetNick] || 0) + 1
        const flagged: Record<string, string[]> = {}
        for (const nick of Object.keys(byTarget)) {
          if (byTarget[nick] < 2) continue
          const u = await db.user.findFirst({
            where: { nickLower: nick.toLowerCase() }, select: { id: true, createdAt: true, score: { select: { conquered: true, score: true } }, wallet: { select: { gems: true } } },
          })
          if (!u) continue
          const days = Math.max(1, (Date.now() - u.createdAt.getTime()) / 864e5)
          const fl: string[] = []
          if ((u.score?.conquered || 0) > (days + 2) * 8) fl.push('growth: ' + (u.score?.conquered || 0) + ' کشور در ' + Math.round(days) + ' روز')
          if ((u.score?.score || 0) > days * 25000) fl.push('power-spike')
          flagged[nick] = fl
        }
        return R({ ok: true, total: open.length, reports: open.map((r) => ({ id: r.id, target: r.targetNick, reason: r.reason, at: r.createdAt, count: byTarget[r.targetNick], flags: flagged[r.targetNick] || [] })) })
      }

      case 'abuse_resolve': {
        if (!user.isAdmin) return R(null)
        const id = Number(args.p_id) || 0
        const action = String(args.p_action || '') /* clear | actioned */
        if (!id || ['clear', 'actioned'].indexOf(action) < 0) return R({ ok: false, error: 'args' })
        await db.abuseReport.updateMany({ where: { id }, data: { status: action === 'clear' ? 'cleared' : 'actioned' } })
        return R({ ok: true })
      }

      /* ============ V65 — جهان زنده: رقیب، اهداف بلندمدت، تالار افتخارات ============
         همه از داده‌ی واقعی سرور محاسبه می‌شوند؛ کلاینت هیچ عددی نمی‌فرستد (§15). */

      /* رقیب شخصی: نزدیک‌ترین بازیکن بالای سرت در رتبه‌ی امتیاز همان سرور
         (اگر اول باشی، نزدیک‌ترین نفر پشت سرت). مقایسه‌ی کامل + اختلاف درصدی. */
      case 'rival_get': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const rows = await db.score.findMany({ where: { server }, orderBy: [{ score: 'desc' }], take: 400 })
        const meIdx = rows.findIndex((r) => r.userId === user.id)
        if (meIdx < 0) return R({ ok: false, error: 'no_score' })
        let rivalIdx = meIdx - 1
        if (rivalIdx < 0) rivalIdx = meIdx + 1 < rows.length ? meIdx + 1 : -1
        if (rivalIdx < 0) return R({ ok: true, rival: null, me_rank: 1, msg: 'top' })
        const rv = rows[rivalIdx]
        const mine = rows[meIdx]
        const cmp = (a: number, b: number) => ({ me: a, rival: b, pct: Math.round(((b - a) / Math.max(1, Math.min(a, b))) * 100) })
        return R({
          ok: true,
          me_rank: meIdx + 1,
          rival_rank: rivalIdx + 1,
          ahead: rivalIdx > meIdx,
          rival: {
            nick: rv.nick,
            score: cmp(mine.score, rv.score),
            conquered: cmp(mine.conquered, rv.conquered),
            kills: cmp(mine.kills, rv.kills),
            economy: cmp(mine.economy, rv.economy),
            recruits: cmp(mine.recruits, rv.recruits),
          },
        })
      }

      /* اهداف بلندمدت: ۷ هدف از داده‌ی سرور (رتبه‌ها از یک query واحد ساخته می‌شود — بدون N+1 سنگین) */
      case 'goals_get': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const rows = await db.score.findMany({ where: { server }, orderBy: [{ score: 'desc' }], take: 400 })
        const meIdx = rows.findIndex((r) => r.userId === user.id)
        const rankBy = (pick: (r: typeof rows[number]) => number) => {
          const sorted = rows.map(pick).sort((a, b) => b - a)
          const my = meIdx >= 0 ? pick(rows[meIdx]) : 0
          return { my, top: sorted[0] || 0, rank: my > 0 ? sorted.indexOf(my) + 1 : rows.length + 1 }
        }
        const terr = { my: await territoryCount(user.id, server), top: 0, rank: 0 }
        const terrAgg = await db.territory.groupBy({ by: ['userId'], where: { server }, _count: { _all: true } })
        const terrSorted = terrAgg.map((t) => ({ uid: t.userId, n: t._count._all })).sort((a, b) => b.n - a.n)
        terr.top = terrSorted[0]?.n || 0
        terr.rank = terrSorted.findIndex((t) => t.uid === user.id) + 1 || terrSorted.length + 1
        /* قهرمان المپیک: مجموع طلاهای رسمی (rank=1) در همه‌ی ادیشن‌ها */
        const goldsAgg = await db.olympicResult.groupBy({ by: ['userId'], where: { rank: 1 }, _count: { _all: true } })
        const golds = goldsAgg.map((g) => ({ uid: g.userId, n: g._count._all })).sort((a, b) => b.n - a.n)
        const myGolds = golds.find((g) => g.uid === user.id)?.n || 0
        /* پیشرفته‌ترین فناوری: دارنده‌ی رکوردهای المپیک (قدیمی‌ترین نسل مهارت) + PR کل */
        const recRows = await db.olympicRecord.findMany()
        const recNick = new Map(recRows.map((r) => [r.nick, r.discipline] as const))
        const prAgg = await db.olympicProfile.groupBy({ by: ['userId'], _sum: { prCount: true } })
        const prSorted = prAgg.map((p) => ({ uid: p.userId, n: p._sum.prCount || 0 })).sort((a, b) => b.n - a.n)
        const myPr = prSorted.find((p) => p.uid === user.id)?.n || 0
        /* قوی‌ترین اتحاد: اندازه‌ی اتحاد من در برابر بزرگ‌ترین */
        const sizes = await db.allianceMember.groupBy({ by: ['allianceId'], _count: { _all: true } })
        const sizeMap = new Map(sizes.map((s) => [s.allianceId, s._count._all] as const))
        const myMembership = await db.allianceMember.findFirst({ where: { userId: user.id } })
        const myAlliance = myMembership ? await db.alliance.findUnique({ where: { id: myMembership.allianceId } }) : null
        const myAllySize = myAlliance ? (sizeMap.get(myAlliance.id) || 1) : 0
        const topAllySize = Math.max(0, ...Array.from(sizeMap.values()))
        const g = (key: string, r: { my: number; top: number; rank: number }, topNick: string | null) => ({ key, ...r, top_nick: topNick })
        const topNickOf = (pick: (r: typeof rows[number]) => number) => {
          let best: { n: number; nick: string } | null = null
          for (const r of rows) { const v = pick(r); if (v > 0 && (!best || v > best.n)) best = { n: v, nick: r.nick } }
          return best ? best.nick : null
        }
        const goldTopUser = golds[0]?.uid ? await db.user.findUnique({ where: { id: golds[0].uid }, select: { nick: true } }) : null
        const prTopUser = prSorted[0]?.uid ? await db.user.findUnique({ where: { id: prSorted[0].uid }, select: { nick: true } }) : null
        return R({
          ok: true,
          goals: [
            g('empire', rankBy((r) => r.conquered), topNickOf((r) => r.conquered)),
            g('military', rankBy((r) => r.kills), topNickOf((r) => r.kills)),
            g('economy', rankBy((r) => r.economy), topNickOf((r) => r.economy)),
            g('power', rankBy((r) => r.score), topNickOf((r) => r.score)),
            { key: 'territory', ...terr, top_nick: terrSorted[0] ? (await db.user.findUnique({ where: { id: terrSorted[0].uid }, select: { nick: true } }))?.nick || null : null },
            { key: 'olympic', my: myGolds, top: golds[0]?.n || 0, rank: golds.findIndex((x) => x.uid === user.id) + 1 || golds.length + 1, top_nick: goldTopUser?.nick || null },
            { key: 'tech', my: myPr, top: prSorted[0]?.n || 0, rank: prSorted.findIndex((x) => x.uid === user.id) + 1 || prSorted.length + 1, top_nick: prTopUser?.nick || null },
            { key: 'alliance', my: myAllySize, top: topAllySize, rank: 0, top_nick: myAlliance ? myAlliance.name : null, has: !!myAlliance, rec_held: recNick.size ? Array.from(recNick.values()).length && (recRows.filter((r) => r.nick === user.nick).length) : 0 },
          ],
        })
      }

      /* تالار افتخارات: ۶ عنوان دائمی، فقط از داده‌ی واقعی. تغییر نگهدارنده => خبر hof_new */
      case 'hof_list': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const rows = await db.score.findMany({ where: { server }, orderBy: [{ score: 'desc' }], take: 400 })
        const topBy = (pick: (r: typeof rows[number]) => number) => {
          let best: { uid: string; nick: string; v: number } | null = null
          for (const r of rows) { const v = pick(r); if (v > 0 && (!best || v > best.v)) best = { uid: r.userId, nick: r.nick, v } }
          return best
        }
        const goldsAgg = await db.olympicResult.groupBy({ by: ['userId'], where: { rank: 1 }, _count: { _all: true } })
        const goldTop = goldsAgg.sort((a, b) => b._count._all - a._count._all)[0]
        const goldUser = goldTop ? await db.user.findUnique({ where: { id: goldTop.userId }, select: { nick: true } }) : null
        const sizes = await db.allianceMember.groupBy({ by: ['allianceId'], _count: { _all: true } })
        let dip: { uid: string; nick: string; v: number } | null = null
        if (sizes.length) {
          const topAlly = sizes.sort((a, b) => b._count._all - a._count._all)[0]
          const al = await db.alliance.findUnique({ where: { id: topAlly.allianceId } })
          if (al) dip = { uid: al.ownerUid, nick: al.ownerNick, v: topAlly._count._all }
        }
        const defs: Array<{ cat: string; fa: string; w: { uid: string; nick: string; v: number } | null }> = [
          { cat: 'conqueror', fa: 'فتح‌گر افسانه‌ای', w: topBy((r) => r.conquered) },
          { cat: 'commander', fa: 'بزرگ‌ترین فرمانده', w: topBy((r) => r.kills) },
          { cat: 'war_master', fa: 'استاد جنگ', w: topBy((r) => r.score) },
          { cat: 'titan', fa: 'غول اقتصادی', w: topBy((r) => r.economy) },
          { cat: 'champion', fa: 'قهرمان المپیک', w: goldTop && goldUser ? { uid: goldTop.userId, nick: goldUser.nick, v: goldTop._count._all } : null },
          { cat: 'diplomat', fa: 'رهبر دیپلمات', w: dip },
        ]
        const out: Array<{ category: string; fa: string; nick: string | null; value: number; earned_at: string | null; mine: boolean }> = []
        for (const d of defs) {
          const prev = await db.hofTitle.findUnique({ where: { server_category: { server, category: d.cat } } })
          if (d.w) {
            if (!prev || prev.userId !== d.w.uid) {
              await db.hofTitle.upsert({
                where: { server_category: { server, category: d.cat } },
                create: { server, category: d.cat, userId: d.w.uid, nick: d.w.nick, value: d.w.v, detail: d.fa, earnedAt: new Date() },
                update: { userId: d.w.uid, nick: d.w.nick, value: d.w.v, detail: d.fa, earnedAt: new Date() },
              })
              if (prev) await addNews(server, 'hof_new', d.cat, d.w.nick, prev.nick)
              else await addNews(server, 'hof_new', d.cat, d.w.nick, null)
            }
            out.push({ category: d.cat, fa: d.fa, nick: d.w.nick, value: d.w.v, earned_at: (prev && prev.userId === d.w.uid ? prev.earnedAt : new Date()).toISOString(), mine: d.w.uid === user.id })
          } else {
            out.push({ category: d.cat, fa: d.fa, nick: prev ? prev.nick : null, value: prev ? prev.value : 0, earned_at: prev ? prev.earnedAt.toISOString() : null, mine: !!prev && prev.userId === user.id })
          }
        }
        return R({ ok: true, titles: out })
      }

      /* ---------------- V67 — Country View Engine ---------------- */
      case 'cv_state': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '').slice(0, 64)
        if (!country) return R({ ok: false, error: 'country' })
        const { cv, provinces, owned } = await cvEnsure(user.id, server, country)
        /* V74: کشور ناموجود در GeoJSON (cv=null) — پاسخ امنِ not-owned بدون ساخت ردیف */
        if (!cv) {
          return R({ ok: true, owned: false, country, server, provinces: [], buildings: [], seed: 0, focus: {}, focusCat: CV_FOCUS,
            cat: cvCatalogPublic(), techCat: CV_TECH, tech: {}, rp: 0,
            rates: { gold: 0, oil: 0, food: 0, rp: 0 }, mil: { atkPct: 0, defPct: 0 }, goldPct: 0, oilCapAdd: 0, counts: { ports: 0, airports: 0 },
            res: { gold: 0, oil: 0, food: 0 }, accrued: { gold: 0, oil: 0, food: 0 }, offlineCapMs: CV_OFFLINE_CAP_MS, maxLevel: CV_MAX_LEVEL, now: Date.now() })
        }
        const out = await cvWithLock(user.id, async () => {
          const buildings = owned
            ? (await db.cvBuilding.findMany({ where: { userId: user.id, country }, orderBy: [{ province: 'asc' }, { slot: 'asc' }] })) as CvBuildingRow[]
            : []
          const sum = await cvAccrue(user.id, cv, buildings)
          /* ساخت‌وسازهای همان‌حالا تمام‌شده در پاسخ هم active دیده شوند (نه فقط در DB) */
          const nowMs = Date.now()
          for (const b of buildings) if (b.status === 'building' && b.doneAt && b.doneAt.getTime() <= nowMs) b.status = 'active'
          const res = await cvReadRes(user.id)
          return cvPublicState(owned, country, server, provinces, buildings, cv, cv.rp + sum.rpAccrued, sum, res)
        })
        return R(out)
      }

      case 'cv_build': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '').slice(0, 64)
        const type = String(args.p_type || '').slice(0, 32)
        const province = Number(args.p_province)
        const slot = Number(args.p_slot)
        const reqId = args.p_request_id ? String(args.p_request_id).slice(0, 80) : null
        if (!country || !type || !Number.isInteger(province) || !Number.isInteger(slot)) return R({ ok: false, error: 'args' })
        const def = cvDef(type)
        if (!def) return R({ ok: false, error: 'type' })
        if (reqId) {
          const prior = await db.cvBuilding.findFirst({ where: { userId: user.id, reqId } })
          if (prior) return R({ ok: true, duplicate: true, building: prior })
        }
        const out = await cvWithLock(user.id, async () => {
          const { cv, provinces, owned } = await cvEnsure(user.id, server, country)
          if (!owned) return { ok: false, error: 'not_owned' } as const
          const prov = provinces[province]
          if (!prov) return { ok: false, error: 'province' } as const
          if (slot < 0 || slot >= prov.slots) return { ok: false, error: 'slot' } as const
          if (def.capitalOnly && prov.type !== 'capital') return { ok: false, error: 'capital_only' } as const
          if (def.coastal && !prov.coastal) return { ok: false, error: 'coastal' } as const
          if (def.terrains[0] !== 'any' && !def.terrains.includes(prov.terrain)) return { ok: false, error: 'terrain' } as const
          const existing = (await db.cvBuilding.findMany({ where: { userId: user.id, country } })) as CvBuildingRow[]
          const inProv = existing.filter((b) => b.province === province)
          if (inProv.some((b) => b.slot === slot)) return { ok: false, error: 'occupied' } as const
          if (existing.filter((b) => b.type === type).length >= def.empireCap) return { ok: false, error: 'empire_cap' } as const
          if (inProv.filter((b) => b.type === type).length >= def.maxPerProvince) return { ok: false, error: 'prov_cap' } as const
          if (def.req === 'power' && !inProv.some((b) => b.type === 'power' && (b.status === 'active' || (b.doneAt && b.doneAt.getTime() <= Date.now())))) return { ok: false, error: 'need_power' } as const
          const cost = cvCost(def, 1)
          const timeSec = cvTimeSec(def, 1, cvTechMults(cvJson<CvTechState>(cv.tech, {})).log)
          const okSpend = await cvSpend(user.id, cost)
          if (!okSpend) return { ok: false, error: 'funds', cost } as const
          const doneAt = new Date(Date.now() + timeSec * 1000)
          try {
            const b = await db.cvBuilding.create({ data: { userId: user.id, country, server, province, slot, type, level: 1, status: 'building', doneAt, reqId } })
            return { ok: true as const, building: b, cost, timeSec, resNow: await cvReadRes(user.id) }
          } catch (e) {
            const code = (e as { code?: string })?.code
            if (code === 'P2002') {
              /* slot رقابت‌شده یا reqId تکراری — هیچ پولی دوباره کسر نمی‌شود؛ اگر reqId تکراری بود ردیف قبلی برمی‌گردد */
              if (reqId) {
                const prior = await db.cvBuilding.findFirst({ where: { userId: user.id, reqId } })
                if (prior) return { ok: true as const, duplicate: true, building: prior, resNow: await cvReadRes(user.id) }
              }
              return { ok: false as const, error: 'race', resNow: await cvReadRes(user.id) }
            }
            throw e
          }
        })
        return R(out)
      }

      case 'cv_upgrade': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '').slice(0, 64)
        const bid = String(args.p_id || '')
        const reqId = args.p_request_id ? String(args.p_request_id).slice(0, 80) : null
        if (!country || !bid) return R({ ok: false, error: 'args' })
        if (reqId) {
          const prior = await db.cvBuilding.findFirst({ where: { userId: user.id, reqId } })
          if (prior) return R({ ok: true, duplicate: true, building: prior })
        }
        const out = await cvWithLock(user.id, async () => {
          const { cv, owned } = await cvEnsure(user.id, server, country)
          if (!owned) return { ok: false, error: 'not_owned' } as const
          const row = (await db.cvBuilding.findFirst({ where: { id: bid, userId: user.id, country } })) as CvBuildingRow | null
          if (!row) return { ok: false, error: 'not_found' } as const
          if (row.status === 'building' && row.doneAt && row.doneAt.getTime() > Date.now()) return { ok: false, error: 'busy' } as const
          if (row.level >= CV_MAX_LEVEL) return { ok: false, error: 'max_level' } as const
          const def = cvDef(row.type)
          if (!def) return { ok: false, error: 'type' } as const
          const cost = cvCost(def, row.level + 1)
          const timeSec = cvTimeSec(def, row.level + 1, cvTechMults(cvJson<CvTechState>(cv.tech, {})).log)
          const okSpend = await cvSpend(user.id, cost)
          if (!okSpend) return { ok: false, error: 'funds', cost } as const
          const doneAt = new Date(Date.now() + timeSec * 1000)
          try {
            /* سطح همین حالا +۱ می‌شود ولی تا doneAt غیرفعال است (تولید/بونوس صفر) */
            const upd = await db.cvBuilding.updateMany({ where: { id: row.id, status: { not: 'building' } }, data: { level: row.level + 1, status: 'building', startedAt: new Date(), doneAt, reqId } })
            if (upd.count === 0) return { ok: false as const, error: 'race', resNow: await cvReadRes(user.id) }
            return { ok: true as const, level: row.level + 1, cost, timeSec, resNow: await cvReadRes(user.id) }
          } catch (e) {
            const code = (e as { code?: string })?.code
            if (code === 'P2002' && reqId) {
              const prior = await db.cvBuilding.findFirst({ where: { userId: user.id, reqId } })
              if (prior) return { ok: true as const, duplicate: true, building: prior, resNow: await cvReadRes(user.id) }
            }
            throw e
          }
        })
        return R(out)
      }

      case 'cv_cancel': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '').slice(0, 64)
        const bid = String(args.p_id || '')
        if (!country || !bid) return R({ ok: false, error: 'args' })
        const out = await cvWithLock(user.id, async () => {
          const { owned } = await cvEnsure(user.id, server, country)
          if (!owned) return { ok: false, error: 'not_owned' } as const
          const row = (await db.cvBuilding.findFirst({ where: { id: bid, userId: user.id, country } })) as CvBuildingRow | null
          if (!row) return { ok: false, error: 'not_found' } as const
          if (row.status !== 'building' || !row.doneAt) return { ok: false, error: 'not_building' } as const
          const def = cvDef(row.type)
          if (!def) return { ok: false, error: 'type' } as const
          /* بازگشت ۷۰٪ هزینه‌ی همان چیزی که در حال ساخت بود */
          const refundCost = cvCost(def, row.level)
          const refund = { g: Math.round(refundCost.g * 0.7), o: Math.round(refundCost.o * 0.7), f: Math.round(refundCost.f * 0.7) }
          if (row.level === 1) {
            await db.cvBuilding.delete({ where: { id: row.id } })
          } else {
            await db.cvBuilding.update({ where: { id: row.id }, data: { level: row.level - 1, status: 'active', doneAt: null, reqId: null } })
          }
          await tradeApply(user.id, (r) => {
            r.gold = (Number(r.gold) || 0) + refund.g
            r.oil = (Number(r.oil) || 0) + refund.o
            r.food = (Number(r.food) || 0) + refund.f
          })
          return { ok: true as const, refund, level: row.level === 1 ? 0 : row.level - 1, resNow: await cvReadRes(user.id) }
        })
        return R(out)
      }

      /* ---------------- V74 — cv_focus: تخصصی‌سازی استان (بند ۱۳ دستور) ---------------- */
      case 'cv_focus': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '').slice(0, 64)
        const province = Number(args.p_province)
        const focus = String(args.p_focus || '') as CvFocus
        if (!country || !Number.isInteger(province) || province < 0 || province > 15) return R({ ok: false, error: 'args' })
        if (focus !== '' && !(focus in CV_FOCUS)) return R({ ok: false, error: 'args' })
        const out = await cvWithLock(user.id, async () => {
          const { cv, owned } = await cvEnsure(user.id, server, country)
          if (!owned) return { ok: false as const, error: 'not_owned' as const }
          const provinces = cvJson<CvProv[]>(cv.provinces, [])
          if (!provinces[province]) return { ok: false as const, error: 'province' as const }
          const tech = cvJson<{ eco?: number; mil?: number; log?: number; focus?: Record<string, string> }>(cv.tech, {})
          const fm = { ...(tech.focus || {}) }
          if (focus === '') delete fm[String(province)]
          else fm[String(province)] = focus
          tech.focus = fm
          await db.cvCountry.update({ where: { userId_country: { userId: user.id, country } }, data: { tech: JSON.stringify(tech) } })
          return { ok: true as const, province, focus, focusAll: fm }
        })
        return R(out)
      }

      case 'cv_tech': {
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '').slice(0, 64)
        const line = String(args.p_line || '') as CvTechLine
        if (!country || !(line in CV_TECH)) return R({ ok: false, error: 'args' })
        const out = await cvWithLock(user.id, async () => {
          let cv = (await db.cvCountry.findUnique({ where: { userId_country: { userId: user.id, country } } })) as CvCountryRow | null
          if (!cv) ({ cv } = await cvEnsure(user.id, server, country))
          const tech = cvJson<CvTechState>(cv!.tech, {})
          const lvl = Math.max(0, Math.min(CV_TECH[line].max, tech[line] || 0))
          if (lvl >= CV_TECH[line].max) return { ok: false, error: 'max' } as const
          const cost = CV_TECH[line].costs[lvl]
          const live = (await db.cvCountry.findUnique({ where: { userId_country: { userId: user.id, country } }, select: { rp: true } }))?.rp || 0
          if (live < cost) return { ok: false, error: 'rp', need: cost, have: live } as const
          tech[line] = lvl + 1
          await db.cvCountry.update({ where: { userId_country: { userId: user.id, country } }, data: { rp: { decrement: cost }, tech: JSON.stringify(tech) } })
          return { ok: true as const, line, level: lvl + 1, spent: cost, rp: Math.round((live - cost) * 100) / 100 }
        })
        return R(out)
      }

      default:
        return NextResponse.json({ data: null, error: { message: `function ${fn} does not exist`, code: '42883' } })
    }
  } catch (e: unknown) {
    /* V116: کدهای قراردادیِ کوتاه (stock_race و مانند آن) عبور می‌کنند؛ هر متن دیگری
       (مثل خطای خام Prisma «The column ...») توکن پایدار می‌گیرد — جزئیات فقط در لاگ سرور */
    const rawMsg = e instanceof Error ? e.message : 'rpc failed'
    const msg = /^[a-z0-9_]{3,40}$/.test(rawMsg) ? rawMsg : 'server_busy'
    return safeErr('rpc:' + fn, e, { data: null, error: { message: msg, code: null } })
  }
}

/* V83sec (AUDIT-C P1-1): GET دیگر aliasِ POST نیست — کوکی SameSite=Lax روی ناوبری GETِ
   top-level همراه می‌شود؛ یک <a href> ساده همه‌ی mutatorهای بدون-آرگومان را شلیک می‌کرد
   (territory_sync = آزادسازی همه‌ی قلمروهای قربانی، season_reset ادمین = پاک‌شدن نقشه،
   alliance_leave، pass_claim، …). کلاینت همه‌جا POST می‌زند؛ این alias هرگز مصرف تولیدی نداشت. */
export async function GET() {
  return NextResponse.json({ data: null, error: { message: 'POST only', code: 'PGRST301' } }, { status: 405 })
}
