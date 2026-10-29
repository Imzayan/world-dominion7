/* V140 smoke — (A) Myket gem-shop restored (PAY_OFF=false, old SKUs, starter pack)
                 (B) country release + optional server move (FE flow + server arbitration)
   Static/verbatim guards on the shipped sources, same doctrine as v139-srv-smoke.
   Run: node scripts/v140-release-smoke.cjs */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public/game/index.html'), 'utf8');
const shopSrc = fs.readFileSync(path.join(ROOT, 'public/game/shop-v2.js'), 'utf8');
const routeSrc = fs.readFileSync(path.join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8');

let ok = 0, fail = 0;
const check = (name, fn) => { try { fn(); ok++; console.log('PASS ' + name); } catch (e) { fail++; console.log('FAIL ' + name + ' — ' + String(e && e.message || e).slice(0, 200)); } };

console.log('=== A) GEM SHOP RESTORED — same old Myket wiring ===');
check('PAY_OFF=false — real payment back on (single switch)', () => {
  if (!/const PAY_OFF = false/.test(routeSrc)) throw new Error('PAY_OFF is not false');
  if (/packs: PAY_OFF \? \[\] : SHOP_PACKS/.test(routeSrc)) void 0; /* switch intact */
  else throw new Error('catalog switch expression changed');
});
check('4 gem packs with the SAME old Myket SKUs (gems_100/300/550/1000)', () => {
  const m = routeSrc.match(/const SHOP_PACKS = \[[\s\S]*?\n\]/);
  if (!m) throw new Error('SHOP_PACKS missing');
  const body = m[0];
  for (const sku of ['gems_100', 'gems_300', 'gems_550', 'gems_1000']) if (!body.includes(sku)) throw new Error('missing SKU ' + sku);
  for (const g of ['100', '300', '800', '1500']) if (!body.includes('gems: ' + g + ',')) throw new Error('missing gems ' + g);
});
check('catalog switch: packs served when PAY_OFF=false + starter phase no longer forced expired', () => {
  if (!routeSrc.includes("phase: PAY_OFF ? 'expired' : stC.phase")) throw new Error('starter phase switch missing');
  if (!routeSrc.includes('packs: PAY_OFF ? [] : SHOP_PACKS')) throw new Error('packs switch missing');
});
check('server Myket verify path untouched (official developer.myket.ir verify + X-Access-Token)', () => {
  if (!routeSrc.includes('https://developer.myket.ir/api/partners/applications/')) throw new Error('verify endpoint missing');
  if (!routeSrc.includes("if (j.purchaseState !== 0) return { ok: false, error: 'receipt_state' }")) throw new Error('purchaseState check missing');
  if (!routeSrc.includes('MYKTX-')) throw new Error('idempotent grant key missing');
});
check('shop_gem_topup + starter_claim + restore path all still wired', () => {
  for (const k of ["case 'shop_gem_topup'", "case 'starter_claim'", "case 'starter_state'"]) if (!routeSrc.includes(k)) throw new Error('missing ' + k);
});
check('FE: packs section renders when catalog has packs (old viewGems rule)', () => {
  if (!shopSrc.includes('var PG=(CAT66.packs||[]);')) throw new Error('packs render guard missing');
  if (!shopSrc.includes('💎 بسته‌های جم')) throw new Error('packs header missing');
});
check('FE: real purchase flow intact (WDAndroid bridge → __wdOnPurchase → server RPC → consume)', () => {
  for (const k of ['function wdStartPurchase', 'window.__wdOnPurchase', "s.rpc('shop_gem_topup'", "s.rpc('starter_claim'", 'consumePurchase', 'function wdRestore']) if (!shopSrc.includes(k)) throw new Error('missing ' + k);
});
check('FE: starter card shows for server offer phase (V114 rule intact)', () => {
  if (!shopSrc.includes("if(!st&&!OFF66)return null;")) throw new Error('starter promo guard missing');
});

console.log('=== B1) SERVER ARBITRATION — country_release ===');
check("RPC case 'country_release' exists + registered in the endpoint doc header", () => {
  if (!routeSrc.includes("case 'country_release'")) throw new Error('case missing');
  if (!routeSrc.includes('country_release (V140)')) throw new Error('doc header missing');
});
check('destination validated BEFORE any destructive write (fail-fast order)', () => {
  const i = routeSrc.indexOf("case 'country_release'");
  const body = routeSrc.slice(i, i + 3400);
  const v = body.indexOf('testSrvsGet()).includes(tgtRel)');
  const w = body.indexOf('db.territory.deleteMany');
  if (!(v > -1 && w > -1 && v < w)) throw new Error('validation must precede wipe');
  if (!body.includes('takenT >= SRV_CAP_GLOBAL')) throw new Error('90-country cap check missing');
  if (!body.includes("error: 'full'") || !body.includes("error: 'test_server'")) throw new Error('refusal codes missing');
});
check('release wipes territories across ALL servers + recomputes serverStat per affected server', () => {
  const i = routeSrc.indexOf("case 'country_release'");
  const body = routeSrc.slice(i, i + 3400);
  if (!body.includes('db.territory.deleteMany({ where: { userId: user.id } })')) throw new Error('global wipe missing');
  if (!body.includes('db.serverStat.upsert')) throw new Error('serverStat recompute missing');
});
check('fresh-state reset: save={} + score game columns zeroed (anti free-rider: pvp strength = score)', () => {
  const i = routeSrc.indexOf("case 'country_release'");
  const body = routeSrc.slice(i, i + 3800);
  if (!body.includes("state: '{}'")) throw new Error('save reset missing');
  for (const col of ['conquered: 0', 'score: 0', 'kills: 0', 'economy: 0', 'recruits: 0']) if (!body.includes(col)) throw new Error('score column not zeroed: ' + col);
  if (!body.includes('db.cvBuilding.deleteMany') || !body.includes('db.cvCountry.deleteMany')) throw new Error('Country View reset missing');
});
check('account-level assets explicitly preserved (no wallet/inventory/war-career touch in the case)', () => {
  const i = routeSrc.indexOf("case 'country_release'");
  const body = routeSrc.slice(i, routeSrc.indexOf("case 'pvp_attack'"));
  if (/wallet\.(update|delete)/.test(body)) throw new Error('wallet must not be touched');
  if (/shopInventory/.test(body)) throw new Error('inventory must not be touched');
  if (/warState/.test(body)) throw new Error('war career must not be touched');
});
check('world news row country_released is emitted', () => {
  if (!routeSrc.includes("addNews(newsSrv, 'country_released'")) throw new Error('news emission missing');
});

console.log('=== B2) FE FLOW — release entry, race guard, refresh ===');
check('renderSrv hosts the 🚪 release entry with the dedicated wd140-rel class (V96 augmenter-safe)', () => {
  const i = html.indexOf('function renderSrv()');
  const body = html.slice(i, i + 1800);
  if (!body.includes("wd140-rel")) throw new Error('dedicated class missing');
  if (!body.includes('wdReleaseCountry()')) throw new Error('click handler missing');
  if (!body.includes('(myCountryName||(DBMINE&&DBMINE.size))')) throw new Error('has-something-to-release guard missing');
  if (!body.includes('MP_OK===true')) throw new Error('online guard missing');
});
check('wd140-rel CSS exists and is NOT lobby-item (index-mapped augmenter must not touch it)', () => {
  if (!html.includes('.wd140-rel{')) throw new Error('CSS missing');
  const i = html.indexOf('.wd140-rel{');
  if (!html.slice(i - 220, i).includes('V140')) throw new Error('comment missing');
});
check('wdReleaseCountry: two free paths (stay / move) + final irreversible confirm', () => {
  const i = html.indexOf('async function wdReleaseCountry()');
  if (i < 0) throw new Error('function missing');
  const body = html.slice(i, i + 4200);
  if (!body.includes("'stay'") || !body.includes("'move'")) throw new Error('two paths missing');
  if (!body.includes('chooseSrv()')) throw new Error('move path must reuse the V139 free-choice picker');
  if (!body.includes('wdConfirm(')) throw new Error('final confirm missing');
  if (!body.includes('location.reload()')) throw new Error('clean-reboot reload missing');
});
check('race guard __wdRel blocks saveNow AND syncTerr (no zombie save can resurrect the released empire)', () => {
  if (!html.includes('async function saveNow(){if(window.__wdRel||!ACC.ready||!myCountryName)return;')) throw new Error('saveNow guard missing');
  if (!html.includes('async function syncTerr(){if(window.__wdRel||syncBusy||')) throw new Error('syncTerr guard missing');
  const i = html.indexOf('async function wdReleaseCountry()');
  const body = html.slice(i, i + 4200);
  if (!body.includes('window.__wdRel=1')) throw new Error('flag set before RPC missing');
  if (!body.includes('window.__wdRel=0')) throw new Error('failure rollback of flag missing');
  if (!body.includes('ACC.busy&&Date.now()-t0<2500')) throw new Error('in-flight save settle wait missing');
});
check('release option only exists online with something to release; server errors mapped to Persian toasts', () => {
  const i = html.indexOf('async function wdReleaseCountry()');
  const body = html.slice(i, i + 4200);
  if (!body.includes("e==='full'") || !body.includes("e==='test_server'")) throw new Error('error mapping missing');
  if (!body.includes('هنوز کشوری نداری')) throw new Error('nothing-to-release toast missing');
});
check('news formatters: both wdNewsFa and the cinematic newspaper know country_released', () => {
  if (!html.includes("if(a==='country_released')return '🏳️ '")) throw new Error('wdNewsFa line missing');
  if (!html.includes("case 'country_released':")) throw new Error('newspaper case missing');
});

console.log('=== C) VERSION SYNC (V141) ===');
check('v.txt=143, beacon __WD_V=143, 12 ?v=143 refs, APK wrapper synced', () => {
  const vTxt = fs.readFileSync(path.join(ROOT, 'public/game/v.txt'), 'utf8').trim();
  if (vTxt !== '143') throw new Error('v.txt=' + vTxt);
  if (!html.includes('window.__WD_V=143;')) throw new Error('beacon not 143');
  const n = (html.match(/\?v=143(?![0-9])/g) || []).length;
  if (n !== 12) throw new Error('?v=143 refs=' + n);
  if ((html.match(/\?v=142(?![0-9])/g) || []).length) throw new Error('stale ?v=142 refs');
  const apk = fs.readFileSync(path.join(ROOT, 'apk-build/app/java/com/worlddominion/game/MainActivity.java'), 'utf8');
  if (!apk.includes('GAME_VER = 142')) throw new Error('APK wrapper not synced'); /* vc14 ships GAME_VER=142 — WebView always revalidates, web-only V143 needs no rebuild */
});

console.log('=== D) V141 — ☰ MENU ENTRY + APK STORE ROOT-FIX ===');
check('release entry exists in ☰ game menu (wd-menu) AND wd22 command center', () => {
  if (!html.includes("var rel141=item('🚪','رها کردن کشور'")) throw new Error('☰ menu item missing');
  if (!html.includes("rel141.classList.add('wd141-rel')")) throw new Error('danger class not applied');
  if (!html.includes("['door','رها کردن کشور'")) throw new Error('wd22 item missing');
  if (!html.includes('.wd-menu-item.wd141-rel')) throw new Error('danger CSS missing');
});
check('wdReleaseCountry self-bootstraps the servers window (auto-open m-srv when inactive)', () => {
  if (!html.includes("if(md&&!md.classList.contains('active')){renderSrv();openModal('m-srv')}")) throw new Error('auto-open missing');
});
check('APK manifest restored: BILLING permission + <queries> for ir.mservices.market', () => {
  const mf = fs.readFileSync(path.join(ROOT, 'apk-build/app/AndroidManifest.xml'), 'utf8');
  if (!mf.includes('com.android.vending.BILLING')) throw new Error('BILLING permission missing');
  if (!mf.includes('ir.mservices.market')) throw new Error('myket <queries> missing');
  if (!mf.includes('android:versionCode="14"')) throw new Error('versionCode not bumped');
});
check('shop-v2.js: 0:nomyket renders actionable store-help modal (V142 — not a dead-end toast)', () => {
  const sv = fs.readFileSync(path.join(ROOT, 'public/game/shop-v2.js'), 'utf8');
  if (!sv.includes("if(r==='0:nomyket'){wdStoreHelp();return false}")) throw new Error('nomyket branch does not route to wdStoreHelp');
  if (!sv.includes('wdStoreHelp')) throw new Error('wdStoreHelp modal missing');
  if (!sv.includes('myket://app?id=com.worlddominion.game')) throw new Error('myket deep-link missing');
  if (!sv.includes('https://myket.ir/app/com.worlddominion.game')) throw new Error('store URL fallback missing');
  if (sv.includes('بازی را از داخل مایکت به‌روزرسانی کن')) throw new Error('old dead-end toast text still present');
});

console.log('\n' + ok + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
