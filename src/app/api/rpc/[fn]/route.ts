import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/ratelimit'
import { computeScore, hasRecalc, SIM_V2_ED, type Telemetry, type TelemEvent } from '@/lib/olyScore'
import {
  skillOf, consistencyOf, potentialOf, evalAchievements, achDef, bullseyesFromTelemetry,
  type RecentScore,
} from '@/lib/olyProfile'

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
type ShopKind = 'consumable' | 'cosmetic' | 'service' | 'mystery' | 'bundle' | 'limited'
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

/* بسته‌های جم — تنها بخشی که پرداخت واقعی دارد؛ url خالی یعنی «به‌زودی» (هیچ قیمتی سمت کلاینت اعمال نمی‌شود) */
const SHOP_PACKS = [
  { id: 'gems_100', gems: 100, price: '۹۹٬۰۰۰ تومان', perGem: '۹۹۰', name: 'شروع', tier: '', url: '' },
  { id: 'gems_300', gems: 300, price: '۲۶۹٬۰۰۰ تومان', perGem: '۸۹۷', name: 'جنگاور', tier: '✅ ارزش خرید دارد', url: '' },
  { id: 'gems_550', gems: 550, price: '۴۴۹٬۰۰۰ تومان', perGem: '۸۱۶', name: 'فاتح', tier: '✅ ارزش بیشتر', url: '' },
  { id: 'gems_1000', gems: 1000, price: '۶۹۹٬۰۰۰ تومان', perGem: '۶۹۹', name: 'امپراتور', tier: '👑 بهترین ارزش', url: '' },
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
   قیمت‌ها باید با OPS سمت کلاینت یکی باشد. */
const SPECIAL_OPS: Record<string, { cost: number; cd: number; weekly: number }> = {
  cyber: { cost: 200, cd: 12 * 3600_000, weekly: 60 },
  commando: { cost: 280, cd: 24 * 3600_000, weekly: 40 },
  missile: { cost: 350, cd: 24 * 3600_000, weekly: 30 },
  nuke: { cost: 500, cd: 48 * 3600_000, weekly: 20 },
}

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

async function ensureWallet(userId: string) {
  let w = await db.wallet.findUnique({ where: { userId } })
  if (!w) w = await db.wallet.create({ data: { userId, gems: 0 } })
  return w
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
let lastReleaseRun = 0

async function transferTerritory(server: number, country: string, uid: string, nick: string): Promise<{ ok: boolean; error?: string; prevOwner?: string }> {
  const t = await db.territory.findUnique({ where: { server_country: { server, country } } })
  if (!t) return { ok: false, error: 'not found' }
  if (t.userId === uid) return { ok: false, error: 'own' }
  const prevOwner = t.userId
  await db.territory.update({ where: { server_country: { server, country } }, data: { userId: uid, nick, isCapital: false } })
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
const OL_REWARDS = { gems: 4, gold: 100000, oil: 10000, food: 10000, steel: 5000, boost_hours: 24 }
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
const GD_DAY: Record<string, number> = { sprint: 0, archery: 0, swim: 1, gym: 1, weight: 2, cycling: 2, chess: 3, volley: 3, lj: 4, wrestle: 4, football: 4 }
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
  const rows = await db.olympicEntry.findMany({ where: { edition, discipline: key, best: { gt: 0 } }, orderBy: [{ best: 'desc' }, { lastAt: 'asc' }], take: 3 })
  for (let i = 0; i < rows.length; i++) {
    try {
      await db.olympicResult.create({ data: { edition, discipline: key, rank: i + 1, userId: rows[i].userId, nick: rows[i].nick, country: rows[i].country, countryFa: rows[i].countryFa, score: rows[i].best } })
    } catch (e) {
      const c = (e as { code?: string })?.code
      if (c !== 'P2002') console.log('freeze', e)
    }
  }
  if (rows.length) await addNews(0, 'olympic_podium', key, rows[0].nick, null)
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
  for (const uid of uids) {
    try {
      const inc = await db.wallet.updateMany({ where: { userId: uid }, data: { gems: { increment: 3 } } })
      if (inc.count === 0) { await ensureWallet(uid); await db.wallet.update({ where: { userId: uid }, data: { gems: { increment: 3 } } }) }
    } catch (e) { console.log('partgem', e) }
  }
  /* V58: جایزه‌ی نقره و برنز — قبلاً فقط قهرمان جایزه داشت؛ حالا سکوی کامل جایزه می‌گیرد:
     نقره: ۲ جم + ۳۰٬۰۰۰ طلا | برنز: ۱ جم + ۱۰٬۰۰۰ طلا (idempotent — فقط برنده‌ی claim اینجا می‌رسد) */
  const podRewards: [number, number, number][] = [[1, 2, 30000], [2, 1, 10000]]
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
    await db.dailyStreak.update({ where: { userId }, data: { streak, best, lastDay: today, totalClaims: { increment: 1 } } })
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
      case 'get_wallet': {
        const serverW = Math.max(1, Number(args.p_server) || 1)
        const { w, granted, vipGranted } = await dailyBonus(user.id)
        /* V34: the daily streak ticks on the first wallet fetch of the day (atomic, race-safe) */
        let streak: Awaited<ReturnType<typeof streakTick>> | null = null
        try { streak = await streakTick(user.id, serverW, user.nick) } catch (e) { console.log('streak', e) }
        return R({ ok: true, gems: w.gems, boost_until: w.boostUntil ? w.boostUntil.toISOString() : null, daily_granted: granted, vip_granted: vipGranted ?? 0,
          vip_until: w.vipUntil ? w.vipUntil.toISOString() : null,
          streak: streak ? { streak: streak.streak, best: streak.best, claimed: streak.claimed, day_in_cycle: streak.day_in_cycle, reward: streak.reward } : null })
      }
      case 'spend_gems':
      case 'shop_buy': {
        /* V66: موتور واحد خرید — هر دو مسیر RPC همین‌جا می‌روند.
           قیمت/موجودیت/مالکیت/پنجره/قرعه فقط سمت سرور؛ کلاینت فقط p_item می‌فرستد.
           p_request_id اختیاری: Idempotency ضد دبل-پرداخت (کلاینت UUID یک‌بارمصرف می‌سازد). */
        const rb = await shopBuy(user.id, String(args.p_item || ''), args.p_request_id ? String(args.p_request_id).slice(0, 80) : null)
        return R(rb)
      }

      /* ---------------- V66 Shop V2 — catalog / inventory / history / collection claim ---------------- */
      case 'shop_catalog': {
        const { w } = await dailyBonus(user.id)
        const inv = await shopOwnedRows(user.id)
        const nowC = Date.now()
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
        }
        return R({ ok: true, already, reward: col.reward, fa: rewardDef.fa, icon: rewardDef.icon })
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
        const d = opApplied && opApplied.pct > 0 ? Math.max(1, Math.round(d0 * (1 - opApplied.pct))) : d0
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
        const chance = Math.min(0.85, Math.max(0.2, 0.5 + (a - d) / (2 * (a + d + 500))))
        const win = Math.random() < chance
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
        return R({ ok: win, captured: win, busy: false, occupation: win ? 100 : 0, gain: win ? 100 : 0, defense: d, ratio: a / d, duel_won: duelWon, revenge_used, op_applied: opApplied, tactic: tac65 || null })
      }
      case 'pvp_capture_territory': {
        if (gamesPhase().phase === 'live' && (await evOn('olympic'))) return R({ ok: false, error: 'truce' }) /* V33 آتش‌بس — با سوئیچ ادمین لغو می‌شود */
        const server = Math.max(1, Number(args.p_server) || 1)
        const country = String(args.p_country || '')
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
        /* serverStat فقط وقتی وضعیت واقعاً عوض شد — سینک ۳۰ثانیه‌ای هر بازیکن نباید اسکن بیندازد */
        if (granted.length || gone.length) {
          const rows = await db.territory.groupBy({ by: ['userId'], where: { server } })
          const taken = await db.territory.count({ where: { server } })
          await db.serverStat.upsert({ where: { server }, create: { server, taken, players: rows.length }, update: { taken, players: rows.length } }).catch(() => {})
        }
        const mineRows = await db.territory.findMany({ where: { userId: user.id, server }, select: { country: true, isCapital: true } })
        return R({ ok: true, granted, denied, lost, gone, truce, mine: mineRows.map((r) => ({ country: r.country, is_capital: r.isCapital })) })
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
        const myE: Record<string, { best: number; attempts: number }> = {}
        for (const e of myEntries) myE[e.discipline] = { best: e.best, attempts: e.attempts }
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
          my: { reg: myReg, entries: myE, country: (myEntries[0] && myEntries[0].countryFa) || null,
            /* O2 / PHASE 28: رشته‌هایی که الان رکورددار جهانی‌شان خودت هستی — کلاینت با
               مقایسه با آخرین وضعیت ذخیره‌شده، بنر RECORD BROKEN + [پس بگیر] می‌سازد */
            my_records: (sh.records || []).filter((r) => r.nick === user.nick).map((r) => r.discipline),
            /* O4-final / PHASE 34: انگیزه‌های امروز از داده‌ی واقعی */
            motive },
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
        if (mode === 'official') {
          const ent0 = await db.olympicEntry.findUnique({ where: { edition_userId_discipline: { edition: g.edition, userId: user.id, discipline: key } } })
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
        const seed = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
        const m = await db.olympicMatch.create({ data: { edition: g.edition, userId: user.id, discipline: key, mode, serverSeed: seed, status: 'open' } })
        return R({ ok: true, match_id: m.id, seed, server_ms: Date.now(), mode, att_max: mode === 'official' ? hostMax : 0, edition: g.edition })
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
        if (!keys.length || keys.length > 6) return R({ ok: false, reason: 'quota' }) /* V40: هر ۶ رشته */
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
        let tel = args.p_telemetry as Telemetry | string | null | undefined
        if (typeof tel === 'string') { try { tel = JSON.parse(tel) as Telemetry } catch (e) { tel = null } }
        /* L2/L3/L4: بازمحاسبه + قوانین فیزیکی — رد شدن = تلاش سوخت (official) */
        /* O3: نسخه‌ی امتیازدهی بر اساس دوره — دوره‌ی جاری v1، دوره‌های بعدی v2 (بدون کف، مهارت‌محور) */
        const res = computeScore(key, tel, g.edition)
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
        return R({ ok: true, best, attempts: ent.attempts, rank: myRank, record_broken: recordBroken, record_pending: recordPending, score, att_max: hostMax,
          prev_best: prevBest, pr: isPr, passed, next_best: nextRow ? nextRow.best : null, new_badges: newBadges, rival })
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
          try { recalc = computeScore(rowT.discipline, rowT.logJson ? (JSON.parse(rowT.logJson) as Telemetry) : null, rowT.edition) } catch (e) { recalc = null }
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
        const cur = await getSetting<{ uid: string; nick: string; amount: number; city: string; country: string } | null>(key, null)
        const prevUid = cur && cur.amount > 0 ? cur.uid : null
        const prevAmt = cur ? cur.amount : 0
        if (prevUid) { try { await db.wallet.update({ where: { userId: prevUid }, data: { gems: { increment: prevAmt } } }) } catch (e) { console.log('olyhostref', e) } }
        const dec = await db.wallet.updateMany({ where: { userId: user.id, gems: { gte: delta } }, data: { gems: { decrement: delta } } })
        if (dec.count === 0) {
          if (prevUid) { try { await db.wallet.update({ where: { userId: prevUid }, data: { gems: { decrement: prevAmt } } }) } catch (e) { console.log('olyhostback', e) } }
          const w = await ensureWallet(user.id)
          return R({ ok: false, reason: 'funds', gems: w.gems, need: prevAmt + 5 })
        }
        const next = { uid: user.id, nick: user.nick, amount: prevAmt + delta, city: g0.host.c, country: g0.host.n }
        await setSetting(key, next)
        olyHostCache = { ed: g0.edition, v: next, at: Date.now() }
        const nw = await ensureWallet(user.id)
        return R({ ok: true, top: { nick: next.nick, amount: next.amount }, gems: nw.gems })
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
          await db.wallet.updateMany({ where: { userId: l.mentorUid }, data: { gems: { increment: 3 } } }).catch(() => {})
          await tradeApply(l.menteeUid, (r) => { r.gold = resNum(r.gold) + 8000 }).catch(() => {})
          if (l.mentorUid === user.id) gems += 3
          else gold += 8000
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
        const server = Math.max(1, Number(args.p_server) || 1)
        /* V33.1: nick is FORCED to the session user's nick — a client-chosen p_nick let
           anyone impersonate arbitrary players on leaderboards and medal tables */
        await db.score.upsert({
          where: { userId: user.id },
          create: { userId: user.id, nick: user.nick, server },
          update: { nick: user.nick, server },
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

      default:
        return NextResponse.json({ data: null, error: { message: `function ${fn} does not exist`, code: '42883' } })
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'rpc failed'
    return NextResponse.json({ data: null, error: { message, code: null } })
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ fn: string }> }) {
  return POST(req, ctx)
}
