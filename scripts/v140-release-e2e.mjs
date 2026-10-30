/* V140 E2E — real HTTP against the local dev server (:3000) + real SQLite rows.
   Covers the two V140 features end-to-end:
   (A) PAY_OFF=false → shop_catalog serves the 4 Myket gem packs + emperor_starter offer again
   (B) country_release → territories freed, save/score reset to fresh state, server move
       validated server-side (test-server door, 90-country cap), idempotent, world news row
   Run: node scripts/v140-release-e2e.mjs   (dev server must be up) */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

let cookie = '';
async function rpc(fn, args) {
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(args || {}),
  });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  for (const c of sc) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
  const j = await r.json().catch(() => ({}));
  return j.data !== undefined ? j.data : j;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- setup: real account through the real signup endpoint ---------- */
const ts = Date.now().toString(36);
const email = 'v140' + ts + '@test.local';
const nick = 'V140rel' + ts.slice(-5);
const su = await fetch(BASE + '/api/auth/signup', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'secret140', nick }),
});
for (const c of (su.headers.getSetCookie ? su.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
const suj = await su.json().catch(() => ({}));
const uid = suj?.data?.user?.id;
check('signup via /api/auth/signup returns a session + user id', !!uid && !!cookie, JSON.stringify(suj).slice(0, 120));

try {
  /* server 1 is the default test door locally — real entry door is 2 (V86 chain) */
  const ini = await rpc('wd_init_player', { p_server: 2 });
  check('wd_init_player on server 2 ok', ini && ini.ok === true);

  /* ---------- seed a real empire state (save blob + score row) ---------- */
  await db.save.upsert({
    where: { userId: uid },
    create: { userId: uid, nick, state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 }, infra: { oil: 5, arms: 3, air: 1, storage: 2 }, units: { tank: 100, infantry: 300 } }) },
    update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 }, infra: { oil: 5, arms: 3, air: 1, storage: 2 }, units: { tank: 100, infantry: 300 } }) },
  });
  await db.score.update({ where: { userId: uid }, data: { conquered: 8, score: 99999, kills: 500, economy: 12345, recruits: 300, server: 2 } });

  /* ---------- territory_sync grants the capital (proof = save blob) ---------- */
  const syn = await rpc('territory_sync', { p_server: 2, p_held: ['Iraq'], p_capital: 'Iraq' });
  check('territory_sync grants Iraq (bootstrap, proof from save)', Array.isArray(syn?.granted) && syn.granted.includes('Iraq'), JSON.stringify(syn).slice(0, 140));
  const stAfterGrant = await db.serverStat.findUnique({ where: { server: 2 } });
  check('server_stats[2].taken=1 after grant', stAfterGrant?.taken === 1, 'taken=' + stAfterGrant?.taken);

  /* ================= (B) country_release — STAY mode ================= */
  const rel = await rpc('country_release', { p_target_server: 0 });
  check('country_release(stay) ok:true released:1', rel?.ok === true && rel?.released === 1, JSON.stringify(rel).slice(0, 140));

  const terrCount = await db.territory.count({ where: { userId: uid } });
  check('territories wiped (0 rows left)', terrCount === 0, 'rows=' + terrCount);
  const stAfterRel = await db.serverStat.findUnique({ where: { server: 2 } });
  check('server_stats[2].taken back to 0 (land free for others)', stAfterRel?.taken === 0, 'taken=' + stAfterRel?.taken);
  const saveRel = await db.save.findUnique({ where: { userId: uid } });
  check('save state reset to fresh {}', (saveRel?.state || '') === '{}', 'state=' + (saveRel?.state || '').slice(0, 60));
  const scRel = await db.score.findUnique({ where: { userId: uid } });
  check('score row zeroed but server kept (2)', scRel?.score === 0 && scRel?.conquered === 0 && scRel?.kills === 0 && scRel?.economy === 0 && scRel?.recruits === 0 && scRel?.server === 2, JSON.stringify(scRel));
  const newsRel = await db.worldNews.findFirst({ where: { action: 'country_released', actorNick: nick } });
  check('world_news country_released row exists', !!newsRel);

  /* idempotency — second run is harmless */
  const rel2 = await rpc('country_release', { p_target_server: 0 });
  check('country_release idempotent (second call ok, released:0)', rel2?.ok === true && rel2?.released === 0, JSON.stringify(rel2).slice(0, 120));

  /* ================= (B) country_release — MOVE mode ================= */
  await db.save.upsert({
    where: { userId: uid },
    create: { userId: uid, nick, state: JSON.stringify({ my: 'Brazil', conq: ['Brazil'], res: { gold: 1000 }, units: {} }) },
    update: { state: JSON.stringify({ my: 'Brazil', conq: ['Brazil'], res: { gold: 1000 }, units: {} }) },
  });
  const syn2 = await rpc('territory_sync', { p_server: 2, p_held: ['Brazil'], p_capital: 'Brazil' });
  check('re-grant Brazil after fresh state (bootstrap path intact)', Array.isArray(syn2?.granted) && syn2.granted.includes('Brazil'), JSON.stringify(syn2).slice(0, 140));

  const mv = await rpc('country_release', { p_target_server: 3 });
  check('country_release(move→3) ok', mv?.ok === true && mv?.server === 3, JSON.stringify(mv).slice(0, 140));
  const scMv = await db.score.findUnique({ where: { userId: uid } });
  check('score.server moved to 3 + progress zeroed', scMv?.server === 3 && scMv?.score === 0, 'server=' + scMv?.server + ' score=' + scMv?.score);
  const terrMv = await db.territory.count({ where: { userId: uid } });
  check('old-server land freed on move', terrMv === 0, 'rows=' + terrMv);

  /* ---------- server-side refusals ---------- */
  const CAP = Number((await rpc('srv_meta', {}))?.cap) || 120; /* V158: cap from the single source */
  const ts1 = await rpc('country_release', { p_target_server: 1 });
  check('move to TEST server refused (test_server)', ts1?.ok === false && ts1?.error === 'test_server', JSON.stringify(ts1).slice(0, 120));

  /* cap-country full server: dummy user holding CAP rows on server 4 (V158: cap from srv_meta, was hardcoded 90) */
  const dummy = await db.user.create({ data: { id: 'v140dummy' + ts, email: 'v140d' + ts + '@test.local', nick: 'V140d' + ts.slice(-5), nickLower: 'v140d' + ts.slice(-5), passwordHash: 'x' } });
  const countries = Array.from({ length: CAP }, (_, i) => 'DummyLand' + i);
  await db.territory.createMany({ data: countries.map((c) => ({ server: 4, country: c, userId: dummy.id, nick: dummy.nick })) });
  const full = await rpc('country_release', { p_target_server: 4 });
  check('move to FULL (cap/cap, cap=' + CAP + ') server refused (full)', full?.ok === false && full?.error === 'full', JSON.stringify(full).slice(0, 120));
  const terrAfterRefusal = await db.territory.count({ where: { userId: dummy.id } });
  check('refusal left everything untouched (no partial wipe)', terrAfterRefusal === CAP, 'rows=' + terrAfterRefusal);
  await db.territory.deleteMany({ where: { userId: dummy.id } });
  await db.user.delete({ where: { id: dummy.id } });

  /* ================= (A) PAY back ON — shop catalog ================= */
  const cat = await rpc('shop_catalog', {});
  const packs = cat?.packs || [];
  /* V158 test-maintenance (pre-existing staleness, NOT a V158 regression): the catalog has been
     the 3-pack lineup (gems_100/800/1500, V127/V145 price sync) since V150-era shop work —
     these assertions still demanded the V140-era 4-pack shape and were red before V158. */
  check('shop_catalog serves the current 3 Myket gem packs', packs.length === 3, 'packs=' + packs.length);
  check('pack ids/SKUs = current lineup (gems_100/800/1500)', JSON.stringify(packs.map((p) => p.id)) === JSON.stringify(['gems_100', 'gems_800', 'gems_1500']), JSON.stringify(packs.map((p) => p.id)));
  check('pack gems = current shape (100/800/1500)', JSON.stringify(packs.map((p) => p.gems)) === JSON.stringify([100, 800, 1500]), JSON.stringify(packs.map((p) => p.gems)));
  const starter = cat?.starter || {};
  check('emperor_starter (پک اولیه ۲۸۰ تومانی) is back as live offer', starter.phase === 'offer' && starter.price_toman === 280, JSON.stringify({ phase: starter.phase, price: starter.price_toman }));
  check('starter contents intact (1200 gems + resources + cosmetics)', starter.contents?.gems === 1200 && Array.isArray(starter.contents?.cosmetics) && starter.contents.cosmetics.length === 5, JSON.stringify(starter.contents).slice(0, 100));
  const stState = await rpc('starter_state', {});
  check('starter_state RPC offers again (phase=offer)', stState?.phase === 'offer', JSON.stringify(stState).slice(0, 100));

  /* wallet untouched by release (account-level assets preserved) */
  const wal = await rpc('get_wallet', {});
  check('wallet (gems) survives release — account assets preserved', wal && typeof wal.gems === 'number', JSON.stringify(wal).slice(0, 100));

  console.log('\n' + ok + ' passed, ' + fail + ' failed');
  process.exitCode = fail ? 1 : 0;
} catch (e) {
  console.log('FATAL ' + (e && e.message || e));
  process.exitCode = 1;
} finally {
  try {
    await db.territory.deleteMany({ where: { userId: uid } });
    await db.worldNews.deleteMany({ where: { actorNick: nick } });
    await db.worldChat.deleteMany({ where: { userId: uid } });
    await db.save.deleteMany({ where: { userId: uid } });
    await db.score.deleteMany({ where: { userId: uid } });
    await db.starterOffer.deleteMany({ where: { userId: uid } });
    await db.wallet.deleteMany({ where: { userId: uid } });
    await db.serverStat.deleteMany({ where: { server: { in: [2, 3] } } });
    await db.user.deleteMany({ where: { email: { in: [email] } } });
  } catch (e) { console.log('cleanup: ' + (e && e.message || e)); }
  await db.$disconnect();
}
