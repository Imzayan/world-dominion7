/* =====================================================================
   BALANCE — منبع واحد حقیقت اعداد توازن (Master Spec PHASE 4)
   ---------------------------------------------------------------------
   قانون: هیچ عدد توازنی نباید بیرون از این فایل به‌صورت literal بنشیند.
   جدول‌های محتوایی (ARMY_UNITS / ST / RESEARCH / MISSIONS) اعدادشان از
   همین‌جا تغذیه می‌شود؛ نام/آیکن/مختصات محتوای نمایشی‌اند و اینجا نیستند.
   توازن واقعی (rebalance) در P4 انجام می‌شود — این نسخه = مقادیر زنده‌ی V71
   بدون هیچ تغییر عددی (مهاجرت خالص + ادغام دو جریان غذا با مجموع برابر).
   ===================================================================== */
(function (W) {
  'use strict';

  W.BALANCE = {

    /* ============ economy — جریان درآمد، انبار، مالیات، تحریم ============ */
    economy: {
      tickMs: 4000,                       // دوره‌ی مشترک تمام جریان‌های منفعل

      start: { gold: 6000, oil: 2500, food: 4000 },   // بازی جدید

      /* درآمد جمعیت (هر تیک، به‌ازای هر قلمروِ تحت کنترل) — V131: کمی سخت‌تر (نرخ −۳۰٪) */
      popIncomeBase: 1.4,                 // popIncomeTick: t += 1.4 + pop*0.011
      popIncomePerPop: 0.011,

      /* غذا — ادغام دو جریان قبلی — V131: سخت‌تر (−۲۵٪) */
      foodPerTerrBoosted: 3,              // از حلقه‌ی قدیمی startIncomeLoop (بوست‌پذیر)
      foodBase: 3,                        // از حلقه‌ی تولید (بدون بوست)
      foodPerTerrPlain: 2.2,              // از حلقه‌ی تولید (بدون بوست)

      /* نفت پایه — هر تیک: ۱٫۵ + terr × oilPerTick() — V131: سخت‌تر (نرف پایه حفظ شد) */
      oilBase: 1.5,
      /* V136: ۰٫۹ (نرف V131) → ۲٫۴ — شکایت فعال بازیکن: «ارتقای نفت اثر محسوس ندارد».
         اندازه‌گیری: مصرف سوخت ارتش تا ۲۵/تیک (cap) + لجستیک حمله (۲۵۰ + ۶٪ قدرت) + تحریم،
         اثر هر سطح را نامحسوس می‌کرد (۰٫۹ = +۱۳٫۵×terr بر دقیقه). با ۲٫۴ هر سطح = +۲٫۴×terr بر تیک
         ≈ +۳۶×terr بر دقیقه — هنوز بسیار کمتر از مصرف‌کننده‌ها، ولی محسوس. پایه ۱٫۵ نرف V131 ماند. */
      oilPerInfraLevel: 2.4,              // oilPerTick: 1 + infra.oil * 2.4

      /* ضریب مقیاس تولید ساختمان‌ها (PSC) — V131: سخت‌تر */
      psc: { gold: 0.38, oil: 0.11, food: 0.38 },

      boostMult: 2,                       // ضریب بوست فعال

      /* سقف انبار — V133: ارتقای «انبار مرکزی» حالا هم غذا هم نفت را بالا می‌برد
         (قبلاً انبار فقط سقف نفت را می‌رفت و غذا در امپراتوری‌های بزرگ بن‌بست می‌شد) */
      storage: {
        oilBase: 6000, oilPerTerr: 1200,  // oilStorageCap = 6000 + 1200t + 6000×سطح + CV
        oilPerStorageLevel: 6000,
        foodBase: 9000, foodPerTerr: 2500, // سقف غذا (هم‌تراز سرور)
        foodPerStorageLevel: 5000          // V133: هر سطح انبار +۵٬۰۰۰ گنجایش غذا (سرور هم همین)
      },

      /* مالیات: هر قلمرو pop*0.72×(1−min(.6,un/150)) + ۴۵ ؛ سپس ×بوست×(تحریم؟ ۰٫۵) — V131 */
      tax: {
        foodCost: 100, cooldownSec: 120,
        perPop: 0.72, perCountryBase: 45,
        unrestCutCap: 0.6, unrestDiv: 150,
        sanctionMult: 0.5
      },

      /* کمک بشردوستانه سازمان ملل (فعلاً کلاینت‌پرداخت — مهاجرت به سرور در P3) — V131: سخت‌تر */
      unAid: { cooldownSec: 120, food: 340, gold: 190 },

      /* باج وفاداری واسال‌ها (هر تیک) */
      tribute: { perPop: 0.5, tickMs: 4000 },

      /* تحریم بین‌المللی */
      sanction: {
        goldPerTerr: 7.5, foodPerTerr: 5,
        oilCapPerTerr: 12, oilPerTickShare: 0.5,
        hoursPerStep: 4, duration: 60,
        tensionTrigger: 80, tensionRelease: 45,
        incomeMult: 0.5
      },

      customBuildMult: 1.5                 // ساخت روی سرزمین غیرپایتختی
    },

    /* ============ army — هزینه/قدرت یگان‌ها (جداول محتوایی از این تغذیه می‌شوند) ============ */
    army: {
      units: {
        /* V105B: جدول حرفه‌ای ۴ستونه — attack/def/spd/log (مقیاس ۱-۱۰) + جاودانگان (نخبه، وزن آموزش ۸) */
        infantry:  { attack: 4,   def: 3, spd: 2, log: 5, costGold: 25,   costOil: 1,   air: false },
        tank:      { attack: 40,  def: 6, spd: 4, log: 4, costGold: 150,  costOil: 30,  air: false },
        bomber:    { attack: 300, def: 2, spd: 7, log: 2, costGold: 900,  costOil: 220, air: true },
        fighter:   { attack: 120, def: 3, spd: 9, log: 3, costGold: 400,  costOil: 100, air: true },
        heli:      { attack: 65,  def: 4, spd: 6, log: 4, costGold: 220,  costOil: 50,  air: true },
        missile:   { attack: 250, def: 1, spd: 8, log: 1, costGold: 700,  costOil: 180, air: false },
        drone:     { attack: 35,  def: 1, spd: 8, log: 2, costGold: 90,   costOil: 20,  air: true },
        transport: { attack: 15,  def: 4, spd: 3, log: 9, costGold: 80,   costOil: 20,  air: false },
        destroyer: { attack: 180, def: 6, spd: 5, log: 6, costGold: 850,  costOil: 200, air: false },
        carrier:   { attack: 600, def: 7, spd: 3, log: 8, costGold: 2500, costOil: 600, air: false },
        immortal:  { attack: 55,  def: 9, spd: 2, log: 7, costGold: 400,  costOil: 60,  air: false, elite: true, weight: 8 }
      },
      /* تخفیف کارخانه‌ی تسلیحات روی استخدام */
      armsDiscountPerLevel: 0.05, armsDiscountCap: 0.35,
      /* V75 — P4: نگهداری per-unit (ضد گلوله‌برفی) — ارتشِ بزرگ ماهانه پول‌سوز است.
         freeAttack: تا این مقدار قدرت ارتش، نگهداری صفر (بازیکنان کوچک بی‌تأثیر).
         goldPerAttackMin: به‌ازای هر واحد قدرتِ مازاد بر free، هر دقیقه این‌قدر طلا.
         25,000 حذف رایگان؛ ارتشِ 200,000 قدرت = 1750 طلا/دقیقه — ارتشِ یک‌میلیونی
         9,750/دقیقه: بدون اقتصاد سالم فرو می‌پاشد. (سرور هم پول جعلی را clamp می‌کند) */
      upkeep: { freeAttack: 25000, goldPerAttackMin: 0.01 },

      /* V128 — پیاده‌نظام: خرید نیست؛ تولید خودکار از جمعیت + بازده نزولی (ضد سلطه‌ی جمعیت)
         infCapPerM: هر ۱ میلیون جمعیت ≈ ۲.۵ یگان پیاده (هر یگان ۱۰۰۰ سرباز ≈ ۰.۲۵٪ جمعیت — نسبت واقعی نیروی نظامی به جمعیت)
         autoBase + autoPerSqrtPopM: یگان/ثانیه — ایران (۸۹م): ≈۴.۶ یگان/دقیقه؛ هند (۱.۴۳ب): ≈۱۴.۸/دقیقه — نه سریع، نه کُند
         infSoftK + infSoftExp: تا K یگان قدرت خطی؛ بعد از آن ×(n/K)^E — جمعیتِ ۱۰ برابر فقط ≈ ۳ برابر قدرت می‌دهد */
      recruit: {
        infCapPerM: 2.5, infCapMin: 2,
        autoBase: 0.02, autoPerSqrtPopM: 0.006,
        infSoftK: 150, infSoftExp: 0.78
      }
    },

    /* ============ buildings — هزینه/تولید/اثر (جداول محتوایی از این تغذیه می‌شوند) ============ */
    buildings: {
      defs: {
        refinery:   { g: 1500, o: 150, p: { oil: 11 } },   /* V131: سخت‌تر */
        oilfield:   { g: 1300, o: 0,   p: { oil: 8, gold: 5 } },  /* V131: سخت‌تر */
        dam:        { g: 1400, o: 0,   p: { gold: 8, food: 12 } },
        power:      { g: 1800, o: 100, p: { gold: 18 } },
        stadium:    { g: 900,  o: 0,   p: { gold: 5 },  calm: 0.15 },
        port:       { g: 1400, o: 100, p: { gold: 9 },  sea: 0.05 },
        airport:    { g: 1400, o: 100, p: { gold: 6 },  air: 0.03 },
        mine:       { g: 1300, o: 0,   p: { gold: 8, oil: 3 } },  /* V131: سخت‌تر */
        landmark:   { g: 800,  o: 0,   p: { gold: 7 } },
        base:       { g: 2000, o: 300, p: {}, atk: 0.02 },
        university: { g: 1600, o: 0,   p: { gold: 9 } },
        hospital:   { g: 1100, o: 0,   p: { food: 6, gold: 3 }, calm: 0.2 },
        bank:       { g: 2200, o: 0,   p: { gold: 22 } },
        farm:       { g: 900,  o: 0,   p: { food: 16 } },
        datacenter: { g: 2000, o: 100, p: { gold: 14 } },
        spaceport:  { g: 3200, o: 200, p: { gold: 12 } },
        shipyard:   { g: 1700, o: 100, p: { gold: 8 } },
        telecom:    { g: 1200, o: 0,   p: { gold: 6 },  calm: 0.1 }
      }
    },

    /* ============ technology — هزینه/سقف درخت تحقیق ============ */
    technology: {
      research: {
        logistics:    { cost: 2500,  max: 5 },
        industry:     { cost: 3000,  max: 5 },
        refinery:     { cost: 3500,  max: 5 },
        armor:        { cost: 4500,  max: 5 },
        air:          { cost: 5000,  max: 5 },
        intelligence: { cost: 4500,  max: 5 },
        diplomacy:    { cost: 4000,  max: 5 },
        nuclear:      { cost: 12000, max: 1 }
      }
    },

    /* ============ conquest — بونوس‌های نبرد وابسته به ساختمان ============ */
    conquest: {
      combat: {
        ovsBase: 0.7, ovsPerPort: 0.05, ovsCap: 0.2,     // حمله‌ی دریایی ۰٫۷→۰٫۹
        airportPer: 0.03, airportCap: 0.3,               // قدرت هوایی
        basePer: 0.02, baseCap: 0.2,                     // کل قدرت ارتش
        airInfraPerLevel: 0.1                            // airBonus: 1 + infra.air*0.1
      },
      /* V75 — P4 — V126: هزینه‌ی حمله‌ی PvP (قرینه‌ی سرور src/lib/balance.ts:PVP_ATTACK — همیشه هم‌عدد) */
      pvpAttack: { costGold: 550, costOil: 70, cooldownSec: 15 },
      /* V133 — لجستیک مقیاس‌پذیر: هزینه‌ی تدارک با قدرت ارتش بالا می‌رود اما هرگز از
         ۷۵٪ ظرفیتِ کوچک‌ترِ انبار عبور نمی‌کند — قبلاً ارتشِ قوی هزینه‌ی ۷۰هزار+ می‌خواست
         در حالی که سقف انبار ۳۰هزار بود → حمله برای همیشه غیرممکن می‌شد (بن‌بست اقتصادی). */
      logisticsCapShare: 0.75,
      /* V136 — باگ «حمله‌ی اول کشور را کامل تصرف نمی‌کند»: سقف پیشروی هر دور ثابت ۱۳٪ بود ⇒
         حداکثر ۵×۱۳=۶۵٪ در یک حمله — حتی با نسبت قدرت بی‌نهایت (کشور خالی + ۱ میلیارد سرباز).
         حالا سقف وابسته به نسبت قدرت (r = قدرت مهاجم/دفاع مؤثر):
           r<۴  → ۱۳٪ (طرح سختِ V126 برای نبرد متوازن دست‌نخورده)
           r≥۴  → ۲۶٪ (دفاع ضعیف: ۲۶→۵۲→۷۸→۸۹٫۷→۱۰۰ — فتح کامل در همان حمله)
           r≥۸  → ۳۴٪ (پیروزی قاطع/کشور خالی: ۳۴→۶۸→۱۰۰ — فتح در دور سوم)
         کندیِ محاصره‌ی پایتخت (×۰٫۴۵ بعد از ۷۵٪) سر جایش است. */
      roundGain: { t1: 4, t2: 8, cap1: 13, cap2: 26, cap3: 34 }
    },

    /* ============ missions — هدف و پاداش (پرداخت واقعی = داور سرور) ============ */
    missions: {
      defs: {
        war:      { goal: 1, r: 800 },
        trade:    { goal: 2, r: 1000 },
        spy:      { goal: 1, r: 900 },
        research: { goal: 1, r: 1200 },
        empire:   { goal: 1, r: 1500 }
      }
    },

    /* ============ rewards — جوایز موردی (fallback محلی lucky؛ منبع اصلی = سرور) ============ */
    rewards: {
      lucky: {
        goldMin: 400, goldSpan: 1800,
        oilMin: 250, oilSpan: 950,
        foodMin: 300, foodSpan: 1200,
        boostMin: 20, boostSpan: 26,
        jackpotGold: 4000
      }
    },

    /* ============ maintenance — نگهداری، ناآرامی، گرسنگی (P4: per-unit upkeep اضافه می‌شود) ============ */
    maintenance: {
      oilUpkeep: { cap: 25, powerDiv: 2500, logRPerLevel: 0.12, starvationLose: 0.05 },
      unrest: {
        start: 25, gainBase: 0.6, gainPowerDiv: 8000, gainMin: 0.1,
        revoltThreshold: 100, revoltOccupationPct: 45,
        calmPerBuildingTick: 0.15
      }
    },

    /* ============ infra — هزینه‌ی ارتقای زیرساخت لابی ============ */
    infra: {
      base: { oil: 500, arms: 600, air: 800 }, perLevel: 400,
      storageBase: 1000, storagePerLevel: 750
    }
  };

  /* قفل Against accidental tampering در کنسول (فقط خواندنی عمیق نیست — کافی است هشدار بدهیم) */
  try { Object.defineProperty(W.BALANCE, '__frozenNote', { value: 'Master Spec PHASE 4 — single source of balance truth' }); } catch (e) {}
})(window);
