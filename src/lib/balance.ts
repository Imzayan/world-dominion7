/* =====================================================================
   BALANCE (server) — منبع واحد اعداد توازن سمت سرور (Master Spec PHASE 4)
   ---------------------------------------------------------------------
   آینه‌ی کلاینت: public/game/balance.js (اقتصاد نقشه client-advances،
   اما پاداش‌های رسمی همیشه از همین مقادیر سرور پرداخت می‌شود).
   قانون: عدد توازن جدید سرور باید اینجا اضافه شود، نه inline در route.
   ===================================================================== */

/* پاداش تاج‌گذاری قهرمان المپیک (پایان دوره‌ی ۷روزه) */
export const OL_REWARDS = {
  gems: 4,
  gold: 100000,
  oil: 10000,
  food: 10000,
  steel: 5000,
  boost_hours: 24,
} as const;

/* عملیات‌های حمله‌ای جم (V54): قیمت، کول‌داون شخصی و سقف هفتگی کل سرور.
   قیمت‌ها باید با OPS سمت کلاینت یکی باشد. */
export const SPECIAL_OPS: Record<string, { cost: number; cd: number; weekly: number }> = {
  cyber: { cost: 200, cd: 12 * 3600_000, weekly: 60 },
  commando: { cost: 280, cd: 24 * 3600_000, weekly: 40 },
  missile: { cost: 350, cd: 24 * 3600_000, weekly: 30 },
  nuke: { cost: 500, cd: 48 * 3600_000, weekly: 20 },
};

/* پاداش روزانه‌ی رابطه‌ی منتور/شاگرد — یک tick اتمی هر دو طرف را می‌پردازد */
export const MENTOR_REWARDS = { mentorGems: 3, menteeGold: 8000 } as const;

/* پاداش شرکت المپیک برای هر بازیکن واقعی */
export const OL_PARTICIPATION_GEMS = 3;

/* ============================================================
   V75 — P4: هزینه‌ی واقعی حمله‌ی PvP (ضد اسپم حمله/ضد گلوله‌برفی)
   تا V74 حمله‌ی PvP برای مهاجم رایگان بود — ارتشِ عظیم می‌توانست
   بی‌هزینه و بی‌وقفه فشار بآورد. حالا هر حمله از خزانه‌ی واقعی
   (saves.state.res — تک‌نویسنده‌ی tradeApply) کسر می‌شود + کول‌داون
   ۱۰ثانیه‌ای سمت سرور. کلاینت همین اعداد را در پنل حمله نشان می‌دهد.
   ============================================================ */
export const PVP_ATTACK = { costGold: 400, costOil: 40, cooldownSec: 10 } as const;

/* سکوی المپیک: نقره ۲جم+۳۰هزار طلا، برنز ۱جم+۱۰هزار طلا (قهرمان = OL_REWARDS) */
export const OL_PODIUM_REWARDS: [number, number, number][] = [
  [1, 2, 30000],
  [2, 1, 10000],
];

/* ============================================================
   V108 — PREMIUM MONETIZATION + WAR ITEMS V1 (تک‌منبع سرور)
   هیچ عددی از این بخش در کلاینت hardcode نمی‌شود؛ کلاینت فقط
   آینه‌ی نمایشی cfg را از war_state/shop_catalog می‌گیرد.
   ============================================================ */

/* ---- تدارک جنگی و زرادخانه تاکتیکی (مصرفیِ شمارشی — انبار در WarState.data.stock) ---- */
export type WarItemDef = {
  fa: string; ic: string; d: string;
  price: number;              /* قیمت خرید به جم */
  add: number;                /* تعداد/مقدار در هر خرید */
  dur: number;                /* مدت اثر (ms) — صفر = فوری */
  cd: number;                 /* کول‌داون استفاده (ms) */
  dailyCap: number;           /* سقف استفاده در روز (ضد آزار هدف) */
  target: boolean;            /* نیازمند بازیکن هدف */
  selfCast?: boolean;         /* روی خودی بسته می‌شود (جمر) */
  fxKey?: string;             /* کلید افکت روی WarState.fx */
  defPct?: number;            /* کاهش درصدی دفاع هدف در pvp_attack */
  resist?: boolean;           /* مشمول مقاومت پلکانی هدف */
};

export const WAR_ITEMS: Record<string, WarItemDef> = {
  war_supply: {
    fa: 'تدارک جنگی', ic: '🪖',
    d: 'لجستیک جنگ را پر می‌کند — حمله‌های بیشتر، آماده‌سازی سریع‌تر.',
    price: 40, add: 40, dur: 0, cd: 0, dailyCap: 0, target: false,
  },
  tactical_emp: {
    fa: 'ضربه‌ی EMP', ic: '☄️',
    d: 'زیرساخت نظامی هدف را ۱۰ دقیقه مختل می‌کند: آمادگی دفاعی −۱۵٪ و توقف بازیابی تدارک. ورود/بازی عادی مختل نمی‌شود.',
    price: 90, add: 1, dur: 10 * 60_000, cd: 10 * 60_000, dailyCap: 6,
    target: true, fxKey: 'emp', defPct: 15, resist: true,
  },
  tactical_jammer: {
    fa: 'اختلال‌گر راداری', ic: '🛰️',
    d: '۸ دقیقه ضداطلاعات روی خودت: گزارش دشمن از ارتش تو بی‌دقت می‌شود و خرابکاری خنثی می‌شود.',
    price: 60, add: 1, dur: 8 * 60_000, cd: 5 * 60_000, dailyCap: 8,
    target: false, selfCast: true, fxKey: 'ewar',
  },
  tactical_precision: {
    fa: 'ضربه‌ی دقیق', ic: '🎯',
    d: 'یک استحکامات دفاعی هدف یک سطح پایین می‌آید (هرگز نابود نمی‌شود) + ۶۰ دقیقه نشان‌دار می‌شود. آسیب سقف‌دار.',
    price: 140, add: 1, dur: 60 * 60_000, cd: 30 * 60_000, dailyCap: 4,
    target: true, fxKey: 'precision', resist: true,
  },
  tactical_defbreak: {
    fa: 'شکننده‌ی دفاع', ic: '🛡️',
    d: 'یک لایه‌ی دفاعی هدف ۱۰ دقیقه ضعیف می‌شود: اثربخشی دفاع ۱۰۰٪ → ۸۰٪ (هرگز صفر نمی‌شود).',
    price: 120, add: 1, dur: 10 * 60_000, cd: 20 * 60_000, dailyCap: 4,
    target: true, fxKey: 'defbreak', defPct: 20, resist: true,
  },
  tactical_cyber: {
    fa: 'اختلال سایبری', ic: '💻',
    d: 'یک عملیات اقتصادی هدف ۱۵ دقیقه کند می‌شود: ساخت پیشنهاد بازار مسدود می‌شود. هیچ منبعی حذف یا دزدیده نمی‌شود.',
    price: 80, add: 1, dur: 15 * 60_000, cd: 15 * 60_000, dailyCap: 6,
    target: true, fxKey: 'cyberdis', resist: true,
  },
};

/* مقاومت پلکانی هدف (§8 ضد اسپم): ضربه‌ی اول ۱۰۰٪، بعد ۶۰٪، ۳۰٪، سپس مقاوم
   تا پایان پنجره — بازیکن هدف هرگز قفل دائمی نمی‌شود. */
export const WAR_RESIST_WINDOW_MS = 30 * 60_000;
export const WAR_RESIST_STEPS = [1, 0.6, 0.3, 0] as const;

/* حفاظت بازیکن (§13): حساب‌های تازه هدف سلاح تاکتیکی نمی‌شوند */
export const PROTECTION_MIN_AGE_MS = 7 * 86400_000;

/* ---- پک شروع امپراتور (§4) — تایمر فقط سمت سرور (StarterOffer.startedAt) ---- */
export const STARTER_PACK = {
  id: 'emperor_starter',
  priceToman: 140000,
  priceFa: '۱۴۰٬۰۰۰ تومان',
  windowMs: 48 * 3600_000,
  gems: 1200,
  gold: 100000,
  oil: 15000,
  food: 25000,
  boostMs: 3600_000,           /* ⚡ سرعت‌آموز: بوست تولید ۱ساعته (سمت سرور) */
  warSupply: 25,               /* 🪖 تدارک جنگی */
  taxInstant: true,            /* ⏩ مالیات فوری (راحتی، بی‌خطر) */
  /* 👑 کازمتیک‌های انحصاری — فقط از همین پک؛ در هیچ‌جای فروشگاه فروخته نمی‌شوند */
  grants: [
    { id: 'sp_frame_imperial', fa: 'قاب نام افسانه‌ای امپراتور', ic: '👑', slot: 'frame' },
    { id: 'sp_flag_imperial', fa: 'پرچم امپراتوری انحصاری', ic: '🚩', slot: 'banner' },
    { id: 'sp_fx_conquest', fa: 'افکت فتح: تاج‌گذاری', ic: '✨', slot: 'fx' },
    { id: 'sp_landmark_citadel', fa: 'بنای انحصاری: دژ امپراتور', ic: '🏛️', slot: 'landmark' },
    { id: 'sp_limited_warcrown', fa: 'کازمتیک نسخه‌ی محدود: تاج جنگ', ic: '🎖️', slot: 'title' },
  ],
} as const;
