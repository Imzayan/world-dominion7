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

      /* درآمد جمعیت (هر تیک، به‌ازای هر قلمروِ تحت کنترل) */
      popIncomeBase: 2,                   // popIncomeTick: t += 2 + pop*0.015
      popIncomePerPop: 0.015,

      /* غذا — ادغام دو جریان قبلی: (۴×terr با بوست) + (۴ + ۳×terr بدون بوست) */
      foodPerTerrBoosted: 4,              // از حلقه‌ی قدیمی startIncomeLoop (بوست‌پذیر)
      foodBase: 4,                        // از حلقه‌ی تولید (بدون بوست)
      foodPerTerrPlain: 3,                // از حلقه‌ی تولید (بدون بوست)

      /* نفت پایه — هر تیک: ۲ + terr × oilPerTick() */
      oilBase: 2,
      oilPerInfraLevel: 1.2,              // oilPerTick: 1 + infra.oil * 1.2

      /* ضریب مقیاس تولید ساختمان‌ها (PSC) */
      psc: { gold: 0.5, oil: 0.15, food: 0.5 },

      boostMult: 2,                       // ضریب بوست فعال

      /* سقف انبار */
      storage: {
        oilBase: 6000, oilPerTerr: 1200,  // oilStorageCap = 6000 + 1200t + 6000×سطح + CV
        oilPerStorageLevel: 6000,
        foodBase: 9000, foodPerTerr: 2500 // سقف غذا (هم‌تراز سرور)
      },

      /* مالیات: هر قلمرو pop*0.9×(1−min(.6,un/150)) + ۶۰ ؛ سپس ×بوست×(تحریم؟ ۰٫۵) */
      tax: {
        foodCost: 100, cooldownSec: 120,
        perPop: 0.9, perCountryBase: 60,
        unrestCutCap: 0.6, unrestDiv: 150,
        sanctionMult: 0.5
      },

      /* کمک بشردوستانه سازمان ملل (فعلاً کلاینت‌پرداخت — مهاجرت به سرور در P3) */
      unAid: { cooldownSec: 90, food: 500, gold: 300 },

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
      upkeep: { freeAttack: 25000, goldPerAttackMin: 0.01 }
    },

    /* ============ buildings — هزینه/تولید/اثر (جداول محتوایی از این تغذیه می‌شوند) ============ */
    buildings: {
      defs: {
        refinery:   { g: 1500, o: 150, p: { oil: 14 } },
        oilfield:   { g: 1300, o: 0,   p: { oil: 10, gold: 6 } },
        dam:        { g: 1400, o: 0,   p: { gold: 8, food: 12 } },
        power:      { g: 1800, o: 100, p: { gold: 18 } },
        stadium:    { g: 900,  o: 0,   p: { gold: 5 },  calm: 0.15 },
        port:       { g: 1400, o: 100, p: { gold: 9 },  sea: 0.05 },
        airport:    { g: 1400, o: 100, p: { gold: 6 },  air: 0.03 },
        mine:       { g: 1300, o: 0,   p: { gold: 10, oil: 4 } },
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
      /* V75 — P4: هزینه‌ی حمله‌ی PvP (قرینه‌ی سرور src/lib/balance.ts:PVP_ATTACK — همیشه هم‌عدد) */
      pvpAttack: { costGold: 400, costOil: 40, cooldownSec: 10 }
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
