# V136 — ATTACK FIRST-STRIKE + OIL INFRA MEANINGFULNESS + PLAYER-SCALING PERF

Root-cause engineering pass driven by three player reports:
1. «حمله اول کشور خالی را کامل تصرف نمی‌کند؛ باید دوبار حمله کرد»
2. «ارتقای نفت اثر محسوس ندارد؛ تولید خیلی کم است»
3. «صفحه اول موقع باز شدن خیلی لگ دارد؛ نقشه با بیشتر شدن پلیرها کندتر می‌شود»

Rebased on V135 (V131–V135 from parallel session: econ nerf, warehouse, perf governor,
animation churn fixes — all preserved and re-verified).

## 1) Attack — root cause & fix
**Root cause (verified by measurement, not guessing):**
`attackTarget` battle loop capped per-round progress at a fixed `Math.min(13,(ratio-.35)*16)`
with max 5 rounds ⇒ max 65% per attack **regardless of force ratio** — even 1B troops vs a
defenderless country could never reach 100% in one attack. Ownership flips only at occ≥100,
so the FIRST attack genuinely did not conquer (not a display bug). PvP path (`pvp_attack`)
was already server-authoritative (win ⇒ occ=100 in one attack) — bug was neutral-country path.

**Fix (design-preserving):** ratio-aware round cap from BALANCE (single source):
`conquest.roundGain = {t1:4, t2:8, cap1:13, cap2:26, cap3:34}`
- ratio < 4 → 13%/round (V126 hard-fight design untouched)
- ratio ≥ 4 → 26%/round (weak defense: 26→52→78→89.7→100 — one attack)
- ratio ≥ 8 → 34%/round (decisive/empty: 34→68→100 by round 3)
Capital-siege slowdown (×0.45 past 75%) kept. V133 `wdLogisticsCost` / cap-share intact.

**E2E proof (live browser, rebased V136 build):** `attackTarget('Iraq')` with decisive force ⇒
`iraqConquered:true, occ:100, «🏆 عراق سقوط کرد»` in ONE attack (terr 1→2).
Balanced fight (ratio≈1.8, Turkey) ⇒ 65%, NOT conquered — old difficulty preserved.

## 2) Oil — root cause & fix
**Verified:** the formula WAS executing correctly every tick
(`baseOil = oilBase + terr×(1 + infra.oil×oilPerInfraLevel)`), infra levels persist
(client snap/restore + server clamp ≤99), client/server storage caps are in parity.
The invisibility was real though:
- per-level effect tiny vs measured sinks (fuel upkeep ≤25/tick, attack logistics 250+6%·power
  — now cap-share-capped by V133, sanctions); after the V131 nerf it was 0.9 = +13.5×terr/min;
- building income text showed RAW table values while only PSC (11% oil after V131) credited;
- hidden-tab ticks were dropped forever (short tab switch = lost production).

**Fixes:**
- `oilPerInfraLevel 0.9 → 2.4` (measured; V131 base nerf `oilBase 1.5` kept) ⇒ +36×terr/min per level.
- `fxText` now shows PSC-scaled (actually credited) values.
- Lobby oil panel shows real per-minute production + real per-level delta (live formula).
- Hidden-tab income banking: up to 30 ticks (2 min) credited on return; upkeep for paused
  ticks not charged. Server CV accrual already banks (8h) — map economy now consistent.
- Server caps/clamps unchanged (no DB/API migration needed).

**E2E proof (live browser, rebased V136 build):** 3×`buyInfra('oil')` ⇒ `oilPerTick 1→8.2`;
lobby: «تولید پایه‌ی نفت: 269 در دقیقه • این ارتقا: +36 در دقیقه (به ازای هر قلمرو)» (terr=2, exact).

## 3) Perf — load time + player-count scaling
- `vercel.json`: `/game/*.js` → `immutable, 1y` (all game JS is `?v=`-versioned) — repeat
  loads skip ~1.3 MB of JS; `/cdn/*` 1d → 30d immutable (180 flag PNGs re-fetched daily before).
- `<link rel=preload as=script>` for the two mid-parse blocking scripts (leaflet, supabase) —
  download starts in head, parallel with HTML parsing (complements V132 font preloads).
- `applyOthers`: sync repaint now O(changes) — removed the full 180-flag `sizeFlags()` pass
  that ran after every 30s sync; repaint/resize only added/removed/changed countries.
- `otherLabel`: innerHTML/border rebuilt only when content actually changes (merged with
  V130-cosmetics sigil/shield/host-tag label — guard keeps their composed label).

## Shared-root-cause check (report item 3)
No common tick/save bug: attack ownership writes go through server-arbitrated
`territory_sync` (proof-by-save, cap, first-come-first-served — intact); economy ticks are a
single 4s loop with client↔server cap parity. The two bugs were independent (battle-cap math
vs coefficient/perception), each fixed at its own root.

## Gates
- `scripts/v136-smoke.cjs` (NEW): 20/20 — 6 attack scenarios ×300 runs (empty/low/moderate/
  balanced/weak + old-formula removal), oil monotonicity + per-level delta + client↔server
  cap parity + readout/banking/patch-drift checks, perf patches, version/refs, rebase integrity.
- `check-html-js.js`: 103 blocks / 0 errors. `verify-build.mjs`: 9/9.
- Live browser (agent-browser) on rebased build: zero pageerrors, zero console errors,
  all three fixes exercised end-to-end (Iraq one-attack occ=100; Turkey 65% preserved;
  oil 1→8.2 with exact lobby readout).

## Version
v.txt=136, `__WD_V=136`, 7× `?v=136`. Deploy: push main + dev (Vercel).
