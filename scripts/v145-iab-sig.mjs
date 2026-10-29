/* ============================================================
   V144 E2E — مسیر راستی‌آزمایی امضای رسید مایکت با «کلید عمومی» (توکن عمومی پنل)
   ------------------------------------------------------------------
   سه مود:
     node scripts/v145-iab-sig.mjs keygen   ← ساخت جفت‌کلید آزمایشی (فقط برای تست)
     node scripts/v145-iab-sig.mjs static   ← بررسی‌های ایستا (بدون سرور)
     node scripts/v145-iab-sig.mjs e2e      ← HTTP واقعی روی سرور dev (:3000)
   برای e2e سرور باید با کلید عمومیِ آزمایشی بالا آمده باشد:
     MYKET_PUBLIC_KEY="$(cat scripts/.v144-pub.b64)" npm run dev
   (روی پروداکشن همین مسیر با کلید عمومیِ واقعیِ مایکت که پیش‌فرض lib است کار می‌کند.)
   ============================================================ */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODE = process.argv[2] || 'static';
let ok = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { ok++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); }
};
const pubPath = path.join(ROOT, 'scripts/.v144-pub.b64');
const privPath = path.join(ROOT, 'scripts/.v144-priv.pem');
const priv2Path = path.join(ROOT, 'scripts/.v144-priv2.pem');

/* ---------- keygen ---------- */
if (MODE === 'keygen') {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pub = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  fs.writeFileSync(pubPath, pub);
  fs.writeFileSync(privPath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  const k2 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  fs.writeFileSync(priv2Path, k2.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  console.log('KEYGEN OK — test keypair written (pub: ' + pub.slice(0, 24) + '…) + a second (wrong) key for negative tests');
  process.exit(0);
}

/* ---------- static ---------- */
if (MODE === 'static') {
  const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const lib = read('src/lib/myket.ts');
  const route = read('src/app/api/rpc/[fn]/route.ts');
  const shop = read('public/game/shop-v2.js');
  check('myket.ts: کلید عمومی واقعی مالک (توکن عمومی) پیش‌فرض lib است', lib.includes('MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCEA9lv4z'));
  check('myket.ts: هر دو الگوریتم RSA-SHA1 و RSA-SHA256 پذیرفته می‌شوند', lib.includes("RSA-SHA1") && lib.includes("RSA-SHA256"));
  check('myket.ts: env چرخش کلید MYKET_PUBLIC_KEY خوانده می‌شود', lib.includes('process.env.MYKET_PUBLIC_KEY'));
  check('route.ts: myketSigVerify import شده', route.includes("import { myketSigVerify } from '@/lib/myket'"));
  check('route.ts: مسیر امضا فقط وقتی اعتبار API نیست فعال است', /if \(!accessToken && !\(cid && sec\)\)/.test(route));
  check('route.ts: کنترل packageName/productId/purchaseState/purchaseToken روی json امضاشده', route.includes('j.packageName !== pkg') && route.includes('j.productId !== sku') && route.includes('j.purchaseState !== 0') && route.includes('j.purchaseToken !== receipt'));
  check('route.ts: shop_gem_topup پیام p_json/p_sig را می‌فرستد به verifyProviderReceipt', route.includes("String(args.p_json || '').slice(0, 8192)") && route.includes("String(args.p_sig || '').slice(0, 4096)"));
  check('route.ts: starter_claim هم p_json/p_sig را پاس می‌دهد', (route.match(/verifyProviderReceipt\(provider, receipt, user, 'emperor_starter', \{ json:/g) || []).length === 1);
  check('shop-v2.js: wdGemServer رسید+امضا را به shop_gem_topup می‌فرستد', shop.includes("p_json:String(o.json||''),p_sig:String(o.signature||'')"));
  check('shop-v2.js: هر دو مسیر خرید زنده (gem+starter) پوشش داده شد', (shop.match(/p_json:String\(o\.json\|\|''\)/g) || []).length === 2);
  /* کلید عمومی واقعی مایکت باید به‌عنوان RSA public key معتبر parse شود (PEM-wrap همان lib) */
  try {
    const raw = /const MYKET_PUBLIC_KEY_DEFAULT =\s*\n?\s*'([^']+)'/.exec(lib);
    const b64 = raw[1].replace(/\s+/g, '');
    const lines = b64.match(/.{1,64}/g) || [];
    const pem = '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----\n';
    crypto.createPublicKey(pem);
    check('کلید عمومی واقعی مایکت: parse معتبر RSA-SPKI', true);
  } catch (e) {
    check('کلید عمومی واقعی مایکت: parse معتبر RSA-SPKI', false, String(e && e.message));
  }
  console.log('STATIC: ' + ok + ' ok, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

/* ---------- e2e ---------- */
if (MODE === 'e2e') {
  process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
  const BASE = 'http://localhost:3000';
  if (!fs.existsSync(privPath)) { console.log('FAIL no test keys — run keygen first'); process.exit(1); }
  const priv = fs.readFileSync(privPath, 'utf8');
  const priv2 = fs.readFileSync(priv2Path, 'utf8');

  const sign = (jsonStr, keyPem, alg) => crypto.createSign(alg || 'RSA-SHA1').update(Buffer.from(jsonStr, 'utf8')).sign(keyPem, 'base64');
  const mkJson = (over) => {
    const j = Object.assign({
      orderId: 'GPA.144-' + Math.random().toString(36).slice(2, 8),
      packageName: 'com.worlddominion.game',
      productId: 'gems_100',
      purchaseTime: Date.now(),
      purchaseState: 0,
      purchaseToken: 'tkv144' + Math.random().toString(36).slice(2, 14) + '.aa' + Math.random().toString(36).slice(2, 8),
      developerPayload: 'wd-gems_100-t',
    }, over || {});
    return { j, s: JSON.stringify(j) };
  };

  let cookie = '';
  async function rpc(fn, args) {
    const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(args || {}),
    });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    for (const c of sc) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
    const jj = await r.json().catch(() => ({}));
    return jj.data !== undefined ? jj.data : jj;
  }

  /* حساب واقعی تازه */
  const ts = Date.now().toString(36);
  const email = 'v144' + ts + '@test.local';
  const nick = 'V144sig' + ts.slice(-5);
  const su = await fetch(BASE + '/api/auth/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secret144', nick }),
  });
  for (const c of (su.headers.getSetCookie ? su.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
  const suj = await su.json().catch(() => ({}));
  const uid = suj?.data?.user?.id;
  check('signup واقعی + سشن', !!uid && !!cookie, JSON.stringify(suj).slice(0, 100));

  /* (A) خرید معتبر SHA1 — gems_100 */
  const A = mkJson();
  const a = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: A.j.purchaseToken, p_order_id: A.j.orderId, p_json: A.s, p_sig: sign(A.s, priv) });
  check('A) رسید معتبر SHA1 → ok + 100 جم', a?.ok === true && a?.gems_added === 100 && a?.wallet?.gems >= 100, JSON.stringify(a).slice(0, 140));

  /* (B) پخش همان رسید → duplicate */
  const b = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: A.j.purchaseToken, p_order_id: A.j.orderId, p_json: A.s, p_sig: sign(A.s, priv) });
  check('B) پخش رسید → duplicate:true بدون گرنت دوباره', b?.ok === true && b?.duplicate === true && b?.gems_added === 0, JSON.stringify(b).slice(0, 120));

  /* (C) دستکاری json بعد از امضا */
  const C = mkJson();
  const cTampered = C.s.replace('"purchaseState":0', '"purchaseState":0,').slice(0, -1) + ' '; /* یک بایت تغییر */
  const c = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: C.j.purchaseToken, p_order_id: C.j.orderId, p_json: cTampered, p_sig: sign(C.s, priv) });
  check('C) دستکاری json → receipt', c?.ok === false && c?.error === 'receipt', JSON.stringify(c).slice(0, 120));

  /* (D) امضا با کلید اشتباه */
  const D = mkJson();
  const d = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: D.j.purchaseToken, p_order_id: D.j.orderId, p_json: D.s, p_sig: sign(D.s, priv2) });
  check('D) امضای کلید غریبه → receipt', d?.ok === false && d?.error === 'receipt', JSON.stringify(d).slice(0, 120));

  /* (E) ناهمخوانی sku و productId داخل json امضاشده */
  const E = mkJson({ productId: 'gems_300' });
  const e5 = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: E.j.purchaseToken, p_order_id: E.j.orderId, p_json: E.s, p_sig: sign(E.s, priv) });
  check('E) productId≠sku → receipt (ضد خرید پک ارزان برای پک گران)', e5?.ok === false && e5?.error === 'receipt', JSON.stringify(e5).slice(0, 120));

  /* (F) purchaseState=1 (در انتظار) با امضای درست */
  const F = mkJson({ purchaseState: 1 });
  const f = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: F.j.purchaseToken, p_order_id: F.j.orderId, p_json: F.s, p_sig: sign(F.s, priv) });
  check('F) purchaseState=1 → receipt_state', f?.ok === false && f?.error === 'receipt_state', JSON.stringify(f).slice(0, 120));

  /* (G) packageName غریبه */
  const G = mkJson({ packageName: 'com.evil.clone' });
  const g = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: G.j.purchaseToken, p_order_id: G.j.orderId, p_json: G.s, p_sig: sign(G.s, priv) });
  check('G) packageName بازی نیست → receipt', g?.ok === false && g?.error === 'receipt', JSON.stringify(g).slice(0, 120));

  /* (H) جابه‌جایی توکن — p_token متعلق به رسید دیگری است */
  const H = mkJson();
  const h = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: 'tkv144othertoken99.aa000000', p_order_id: H.j.orderId, p_json: H.s, p_sig: sign(H.s, priv) });
  check('H) purchaseToken ≠ p_token → receipt (ضد جابه‌جایی)', h?.ok === false && h?.error === 'receipt', JSON.stringify(h).slice(0, 120));

  /* (I) بدون json/sig و بدون اعتبار API → هنوز صادقانه provider_unavailable */
  const I = mkJson();
  const i9 = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: I.j.purchaseToken, p_order_id: I.j.orderId });
  check('I) بدون امضا → provider_unavailable (هیچ گرنت فیک)', i9?.ok === false && i9?.error === 'provider_unavailable', JSON.stringify(i9).slice(0, 120));

  /* (J) امضای SHA256 هم پذیرفته می‌شود */
  const J = mkJson();
  const j10 = await rpc('shop_gem_topup', { p_sku: 'gems_100', p_token: J.j.purchaseToken, p_order_id: J.j.orderId, p_json: J.s, p_sig: sign(J.s, priv, 'RSA-SHA256') });
  check('J) رسید معتبر SHA256 → ok (دو الگوریتم)', j10?.ok === true && j10?.gems_added === 100, JSON.stringify(j10).slice(0, 140));

  /* (K) پک شروع — رسید معتبر emperor_starter */
  const K = mkJson({ productId: 'emperor_starter', developerPayload: 'wd-emperor_starter-k' });
  const k11 = await rpc('starter_claim', { p_provider: 'myket', p_receipt: K.j.purchaseToken, p_request_id: 'v144k' + ts, p_json: K.s, p_sig: sign(K.s, priv) });
  check('K) پک شروع با رسید معتبر → ok', k11?.ok === true && k11?.item_id === 'emperor_starter', JSON.stringify(k11).slice(0, 160));

  /* (L) پخش پک شروع → duplicate */
  const l12 = await rpc('starter_claim', { p_provider: 'myket', p_receipt: K.j.purchaseToken, p_request_id: 'v144l' + ts, p_json: K.s, p_sig: sign(K.s, priv) });
  check('L) پخش پک شروع → duplicate:true', l12?.ok === true && l12?.duplicate === true, JSON.stringify(l12).slice(0, 120));

  /* (M) json پک جم برای starter_claim → productId mismatch → receipt */
  const M = mkJson({ purchaseToken: 'tkv144m' + Math.random().toString(36).slice(2, 12) + '.aa' + Math.random().toString(36).slice(2, 6) });
  const m13 = await rpc('starter_claim', { p_provider: 'myket', p_receipt: M.j.purchaseToken, p_request_id: 'v144m' + ts, p_json: M.s, p_sig: sign(M.s, priv) });
  check('M) رسید gems برای پک شروع → receipt', m13?.ok === false && m13?.error === 'receipt', JSON.stringify(m13).slice(0, 120));

  console.log('E2E: ' + ok + ' ok, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
