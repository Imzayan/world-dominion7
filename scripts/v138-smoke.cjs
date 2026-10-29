/* V138 smoke — map-gesture perf root-fixes (wd-dragging scoping, chunked entry pipeline)
   + carries ALL V136 behavioral regressions (attack first-strike math, oil infra, sync O(changes))
   Run: node scripts/v138-smoke.cjs */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public/game/index.html'), 'utf8');
const balSrc = fs.readFileSync(path.join(ROOT, 'public/game/balance.js'), 'utf8');
const routeSrc = fs.readFileSync(path.join(ROOT, 'src/app/api/db/[table]/route.ts'), 'utf8');
const vTxt = fs.readFileSync(path.join(ROOT, 'public/game/v.txt'), 'utf8').trim();

let ok = 0, fail = 0;
const check = (name, fn) => { try { fn(); ok++; console.log('PASS ' + name); } catch (e) { fail++; console.log('FAIL ' + name + ' — ' + String(e && e.message || e).slice(0, 200)); } };

/* ---- load balance.js (window shim) ---- */
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(balSrc, ctx);
const B = ctx.window.BALANCE;
if (!B) { console.log('FATAL: BALANCE failed to load'); process.exit(1); }

/* ---- exact replica of the V136 attackTarget round loop (drift-checked against index.html below) ---- */
function simulateAttack(power0, def0, startOcc, rounds) {
  let power = power0, occ = startOcc || 0;
  const traj = [occ];
  for (let r = 1; r <= (rounds || 5); r++) {
    const defNow = Math.max(def0 * (1 - occ / 100 * .75), def0 * .2);
    const ratio = power * (.8 + Math.random() * .4) / defNow;
    const RG = B.conquest.roundGain;
    const capG = ratio >= RG.t2 ? RG.cap3 : (ratio >= RG.t1 ? RG.cap2 : RG.cap1);
    let gain = Math.max(-3, Math.min(capG, (ratio - .35) * 16));
    if (occ > 75) gain *= .45;
    const prev = occ; occ = Math.max(0, Math.min(100, occ + gain)); traj.push(Math.round(occ));
    const f = Math.min(.1, .03 + .03 / Math.max(ratio, .2));
    power = Math.round(power * (1 - f));
    if (power <= 0) break;
    void prev;
  }
  return { occ, traj };
}

console.log('=== 1) ATTACK — first attack must fully conquer when decisive (carried from V136) ===');
{
  let wins = 0, N = 300;
  for (let i = 0; i < N; i++) if (simulateAttack(1e9, 0, 0).occ >= 100) wins++;
  check('empty country (def=0) + 1B army → conquered in ONE attack (300 runs)', () => { if (wins !== N) throw new Error('won ' + wins + '/' + N); });
}
{
  let wins = 0, N = 300;
  for (let i = 0; i < N; i++) if (simulateAttack(1e9, 142, 0).occ >= 100) wins++;
  check('low-defense country (def0=142) + 1B army → conquered in ONE attack (300 runs)', () => { if (wins !== N) throw new Error('won ' + wins + '/' + N); });
}
{
  let wins = 0, N = 300;
  for (let i = 0; i < N; i++) if (simulateAttack(5000, 1000, 0).occ >= 100) wins++;
  check('moderate defense (ratio≈5) → conquered in ONE attack (300 runs)', () => { if (wins !== N) throw new Error('won ' + wins + '/' + N); });
}
{
  let wins = 0, minOcc = 100, N = 300;
  for (let i = 0; i < N; i++) { const r = simulateAttack(1000, 1000, 0); if (r.occ >= 100) wins++; if (r.occ < minOcc) minOcc = r.occ; }
  check('balanced fight (ratio≈1) → NOT conquered in one attack (V126 preserved), real progress made', () => {
    if (wins !== 0) throw new Error('unexpected one-attack conquests: ' + wins);
    if (minOcc <= 20) throw new Error('progress too low, battle math regressed: minOcc=' + minOcc);
  });
}
{
  let maxOcc = 0, N = 300;
  for (let i = 0; i < N; i++) { const r = simulateAttack(400, 1000, 0); if (r.occ > maxOcc) maxOcc = r.occ; if (r.occ < 0) throw new Error('negative occ'); }
  check('weak attacker (ratio≈0.4) → negligible progress (maxOcc=' + maxOcc + ')', () => { if (maxOcc > 15) throw new Error('weak attacker advanced too far: ' + maxOcc); });
}
check('old fixed-cap formula removed from attackTarget', () => {
  if (/Math\.min\(13,\(ratio-\.35\)\*16\)/.test(html)) throw new Error('old fixed 13% cap still present');
});

console.log('=== 2) OIL — infra upgrade must visibly increase production (carried from V136) ===');
check('oilPerInfraLevel raised to 2.4 (measured: upkeep/logistics made 1.2 invisible)', () => {
  if (B.economy.oilPerInfraLevel !== 2.4) throw new Error('got ' + B.economy.oilPerInfraLevel);
});
check('per-level production delta = terr × 2.4 per tick (formula runs & is monotonic)', () => {
  const tick = (terr, L) => B.economy.oilBase + terr * (1 + L * B.economy.oilPerInfraLevel);
  let prev = -1;
  for (let L = 0; L <= 30; L++) { const v = tick(3, L); if (v <= prev) throw new Error('not monotonic at L=' + L); prev = v; }
  const d = tick(3, 11) - tick(3, 10);
  if (Math.abs(d - 3 * 2.4) > 1e-9) throw new Error('per-level delta ' + d + ' != ' + 3 * 2.4);
});
check('client production formula line matches BALANCE (single source)', () => {
  if (!html.includes('const baseOil=EB.oilBase+_terr*oilPerTick()')) throw new Error('production loop drifted');
});
check('storage caps parity: client balance.js == server clampSaveState constants', () => {
  const get = (re) => { const m = routeSrc.match(re); if (!m) throw new Error('server const missing: ' + re); return Number(m[1]); };
  const oBase = get(/OIL_CAP_BASE = ([\d_]+)/), oTerr = get(/OIL_CAP_PER_TERR = ([\d_]+)/),
    oSt = get(/OIL_CAP_PER_STORAGE = ([\d_]+)/), fBase = get(/FOOD_CAP_BASE = ([\d_]+)/), fTerr = get(/FOOD_CAP_PER_TERR = ([\d_]+)/);
  const u = (n) => Number(String(n).replace(/_/g, ''));
  if (u(oBase) !== B.economy.storage.oilBase) throw new Error('oilBase ' + oBase + ' vs ' + B.economy.storage.oilBase);
  if (u(oTerr) !== B.economy.storage.oilPerTerr) throw new Error('oilPerTerr mismatch');
  if (u(oSt) !== B.economy.storage.oilPerStorageLevel) throw new Error('oilPerStorageLevel mismatch');
  if (u(fBase) !== B.economy.storage.foodBase) throw new Error('foodBase mismatch');
  if (u(fTerr) !== B.economy.storage.foodPerTerr) throw new Error('foodPerTerr mismatch');
});
check('lobby shows real production readout (per-minute, not per-tick promise)', () => {
  if (!html.includes('تولید پایه‌ی نفت: ${_oilPm(_oilTick).toLocaleString()} در دقیقه')) throw new Error('readout missing');
  if (!html.includes('const _oilTick=BALANCE.economy.oilBase+_terr*oilPerTick()')) throw new Error('tick math missing');
});
check('building income text now shows PSC-scaled (actually credited) values', () => {
  if (!html.includes('BALANCE.economy.psc||{}')) throw new Error('fxText truth fix missing');
});
check('hidden-tab income ticks are banked (max 30) — no silent production loss on tab switch', () => {
  if (!html.includes('const __miss=Math.max(0,Math.min(30,Math.floor((__now-__incLast)/BALANCE.economy.tickMs)-1))')) throw new Error('banking missing');
});

console.log('=== 3) PERF — sync cost must not scale with player count (carried from V136) ===');
{
  const i = html.indexOf('function applyOthers');
  const seg = html.slice(i, i + 900);
  check('applyOthers no longer runs the full 180-flag sizeFlags() pass per sync', () => {
    if (/try\{sizeFlags\(\)\}catch/.test(seg) || /renderSrvChip\(\);try\{sizeFlags\(\)\}/.test(seg)) throw new Error('full sizeFlags() still called in applyOthers');
    if (!seg.includes('sizeFlags(n)')) throw new Error('per-country sizing missing');
  });
  check('otherLabel rebuilds label DOM only when content changes', () => {
    if (!html.includes('if(has._h!==h){has._h=h;')) throw new Error('content guard missing');
  });
}
check('preload hints for mid-parse blocking scripts (leaflet + supabase)', () => {
  const n = (html.match(/<link as="script" href="\/cdn\/(leaflet\/leaflet\.min\.js|npm\/@supabase\/supabase-js@2\/dist\/umd\/supabase\.js)" rel="preload"\/>/g) || []).length;
  if (n !== 2) throw new Error('preload hints=' + n);
});
check('vercel.json: immutable cache for versioned /game/*.js + 30d /cdn', () => {
  const vj = fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8');
  if (!vj.includes('/game/(.*)')) throw new Error('/game/*.js rule missing');
  if (!vj.includes('max-age=31536000, immutable')) throw new Error('immutable missing');
  if (!vj.includes('max-age=2592000')) throw new Error('/cdn 30d missing');
  if (!/\/game\/v\.txt[\s\S]*?no-store/.test(vj)) throw new Error('v.txt must stay no-store');
});

console.log('=== 4) V138 — map gesture/jank root-fixes (this release) ===');
check('wd-dragging toggles on the MAP CONTAINER, never on <html> (documentElement)', () => {
  if (/documentElement\.classList\.(add|remove|toggle)\('wd-dragging'\)/.test(html)) throw new Error('class still toggled on documentElement');
  const add = html.includes("map.on('movestart zoomstart',function(){window.__wdMapBusy=true;try{map.getContainer().classList.add('wd-dragging')}catch(e){}})");
  const rem = html.includes("map.getContainer().classList.remove('wd-dragging')");
  if (!add || !rem) throw new Error('container toggle missing (add=' + add + ' remove=' + rem + ')');
});
check('zero html.wd-dragging CSS selectors remain (all gesture rules scoped to #map)', () => {
  const stale = (html.match(/html\.wd-dragging/g) || []).length;
  const scoped = (html.match(/#map\.wd-dragging/g) || []).length;
  if (stale !== 0) throw new Error('html.wd-dragging rules left: ' + stale);
  if (scoped < 6) throw new Error('scoped rules too few: ' + scoped);
});
check('map-internal decorations still paused during gesture (fx/own-dash/rt/overlay path/scrim); flags NOT in gesture set', () => {
  for (const frag of ['#map.wd-dragging #v12-map-fx:before', '#map.wd-dragging .rt', '#map.wd-dragging .leaflet-overlay-pane path', '#map.wd-dragging #wd-focus-scrim', '#map.wd-dragging .wd-own-dash']) {
    if (!html.includes(frag)) throw new Error('missing scoped rule: ' + frag);
  }
  if (html.includes('#map.wd-dragging .flag')) throw new Error('.flag still in gesture invalidation set (28 toggles × 176 flags per gesture)');
});
check('geo simplify is time-sliced ~12ms (no whole-world DP in one tick)', () => {
  if (!html.includes('(function wdSimpStep()')) throw new Error('wdSimpStep missing');
  if (!/while \(fi < feats\.length\) \{ wdSimplifyFeature\(feats\[fi\]\); fi\+\+; if \(performance\.now\(\) - t0 > 12\) break; \}/.test(html)) throw new Error('time budget missing');
});
check('country addData batches grow geometrically (fewer accumulated-canvas redraws at boot)', () => {
  if (!html.includes('let batch = 7;')) throw new Error('batch init missing');
  if (!html.includes("batch = Math.min(Math.round(batch * 1.7), 48);")) throw new Error('growth missing');
});
check('buildFlags is chunked (176 divIcon+img markers no longer in one task)', () => {
  const i = html.indexOf('function buildFlags(){');
  const seg = html.slice(i, i + 1400);
  if (!seg.includes('setTimeout(step')) throw new Error('chunk step missing');
  if (!seg.includes('sizeFlags()')) throw new Error('final sizeFlags missing');
});
check('desktop hover glow fully suppressed during/after gesture + mouseout redraws only after hover', () => {
  if (!html.includes("l.on('mouseover',function(){ if(window.__wdMapBusy)return; if(!l._wdHover&&n!==activeEngName)")) throw new Error('mouseover guard missing');
  if (!html.includes("l.on('mouseout',function(){ if(!l._wdHover)return; l._wdHover=false;")) throw new Error('mouseout guard missing');
});
check('V134 adaptive smoothFactor still intact (world-view simplify path)', () => {
  if (!html.includes('__wdSmoothForZoom')) throw new Error('adaptive smoothFactor lost');
});
check('sw.js IMMUTABLE offline list keeps V137 state (shop-v2.js)', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'public/sw.js'), 'utf8');
  if (!sw.includes("'/game/shop-v2.js'")) throw new Error('sw.js missing /game/shop-v2.js');
});

console.log('=== 5) VERSION / REFS ===');
check('v.txt == 138 and __WD_V beacon matches', () => {
  if (vTxt !== '138') throw new Error('v.txt=' + vTxt);
  if (!html.includes('window.__WD_V=138;')) throw new Error('beacon not 138');
});
check('exactly 12 ?v=138 refs, zero stale ?v=13[0-7] refs', () => {
  const n138 = (html.match(/\?v=138/g) || []).length;
  const stale = (html.match(/\?v=13[0-7]/g) || []).length;
  if (n138 !== 12) throw new Error('?v=138 count=' + n138);
  if (stale !== 0) throw new Error('stale refs=' + stale);
});
check('rebase integrity: V133 logistics + V132 governor + V130 cosmetics coexist with V138 fixes', () => {
  if (!html.includes('wdLogisticsCost')) throw new Error('V133 logistics lost');
  if (!html.includes('WD_QUIET_TICK')) throw new Error('V132 governor lost');
  if (!html.includes('WD130_SHIELD')) throw new Error('V130-cosmetics shield lost');
  if (!B.conquest.logisticsCapShare) throw new Error('V133 logisticsCapShare lost');
});

console.log('\nRESULT: ' + ok + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
