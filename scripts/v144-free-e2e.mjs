/* V144 E2E — real HTTP against the local dev server (:3000) + real SQLite rows.
   Owner directive under test: «پلیرهای جدید که کشور انتخاب نکردن آزادانه به سرورها رفت‌وآمد
   داشته باشن و انتخاب کنن در کدوم سرور میخوان باشن» + «الکی سرور اضافه نکن» (90-rule now
   lives ONLY in server creation, not in locking existing servers).
   Covers: signup server=0 (fresh install sees the picker) · wd_servers spawn rule ·
   free-choice fresh claim passes on ANY non-test non-full server (V143 chain refusal gone) ·
   full-server (cap/cap) fresh claim refused with server_full · member exemption · test door.
   V158: the cap is no longer a hardcoded 90 — it is read from the SAME single source the game uses (srv_meta.cap).
   Run: node scripts/v144-free-e2e.mjs   (dev server must be up) */
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

/* ---------- fresh account through the REAL signup endpoint ---------- */
const ts = Date.now().toString(36);
const email = 'v144' + ts + '@test.local';
const nick = 'V144free' + ts.slice(-5);
const su = await fetch(BASE + '/api/auth/signup', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'secret144', nick }),
});
for (const c of (su.headers.getSetCookie ? su.headers.getSetCookie() : [])) { if (c.indexOf('wd_session=') === 0) cookie = c.split(';')[0]; }
const suj = await su.json().catch(() => ({}));
const uid = suj?.data?.user?.id;
check('signup via /api/auth/signup returns a session + user id', !!uid && !!cookie, JSON.stringify(suj).slice(0, 120));

let createdServerStat = null;
try {
  /* ---------- T1: fresh install lands UNASSIGNED (server=0) → client picker fires ---------- */
  await wait(150);
  const sc0 = await db.score.findUnique({ where: { userId: uid } });
  check('fresh signup score.server = 0 (unassigned → chooser opens on first boot)', sc0?.server === 0, 'server=' + sc0?.server);

  /* ---------- T2: wd_servers spawn rule — no always-present trailing empty server ---------- */
  const CAP = Number((await rpc('srv_meta', {}))?.cap) || 120; /* V158: cap from the single source */
  const ws = await rpc('wd_servers', {});
  const tst = (ws?.test_srvs || []).map(Number);
  const stats = await db.serverStat.findMany({ select: { server: true, taken: true } });
  const bySrv = new Map((ws?.servers || []).map((s) => [s.server, s]));
  let maxKnown = 1;
  for (const s of stats) if (s.server > maxKnown) maxKnown = s.server;
  const srvCount = (ws?.servers || []).length;
  const expectedTop = srvCount; /* server-side list is 1..SRV_COUNT contiguous */
  let allFull = true;
  for (let k = 1; k <= maxKnown; k++) { if (tst.includes(k)) continue; const st = stats.find((x) => x.server === k); if ((st?.taken || 0) < CAP) { allFull = false; break } }
  const expectedCount = allFull ? maxKnown + 1 : maxKnown;
  check('wd_servers count honors the cap-rule spawn (cap=' + CAP + ') (' + (allFull ? 'all full → +' : 'world has room → no') + '1)', expectedCount === srvCount, 'expected=' + expectedCount + ' got=' + srvCount);
  check('wd_servers every listed server is contiguous from 1 (no gaps/fakes)', (ws?.servers || []).every((s, i) => s.server === i + 1));

  /* ---------- T4: FREE CHOICE — fresh claim on any non-test non-full server passes ---------- */
  const open = (ws?.servers || []).find((s) => !tst.includes(s.server) && s.status !== 'full' && s.status !== 'maintenance');
  check('a non-test open server exists to test free choice', !!open, JSON.stringify(ws?.servers));
  if (open) {
    await db.save.upsert({
      where: { userId: uid },
      create: { userId: uid, nick, state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
      update: { state: JSON.stringify({ my: 'Iraq', conq: ['Iraq'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
    });
    const syn = await rpc('territory_sync', { p_server: open.server, p_held: ['Iraq'], p_capital: 'Iraq' });
    check('FREE CHOICE: fresh claim granted on open server ' + open.server + ' (no chain lock, no membership)', Array.isArray(syn?.granted) && syn.granted.includes('Iraq'), JSON.stringify(syn).slice(0, 140));
    check('no server_locked/server_full in the response', !syn?.server_locked && !syn?.server_full);
  }

  /* ---------- T5+T6: full server refuses fresh claims, exempts members ---------- */
  let fullSrv = 0;
  for (let k = maxKnown + 1; k <= maxKnown + 6; k++) { if (!tst.includes(k) && !bySrv.has(k)) { fullSrv = k; break } }
  if (fullSrv) {
    createdServerStat = fullSrv;
    await db.serverStat.upsert({ where: { server: fullSrv }, create: { server: fullSrv, taken: CAP, players: 12 }, update: { taken: CAP, players: 12 } });
    await db.save.upsert({
      where: { userId: uid },
      create: { userId: uid, nick, state: JSON.stringify({ my: 'Brazil', conq: ['Brazil'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
      update: { state: JSON.stringify({ my: 'Brazil', conq: ['Brazil'], res: { gold: 50000, oil: 4000, food: 6000 } }) },
    });
    const ref = await rpc('territory_sync', { p_server: fullSrv, p_held: ['Brazil'], p_capital: 'Brazil' });
    check('FULL cap/cap (cap=' + CAP + '): fresh claim refused with server_full (V144 arbitration)', ref?.ok === false && ref?.server_full === true, JSON.stringify(ref).slice(0, 120));
    await db.score.update({ where: { userId: uid }, data: { server: fullSrv } });
    const mem = await rpc('territory_sync', { p_server: fullSrv, p_held: ['Brazil'], p_capital: 'Brazil' });
    check('MEMBER EXEMPTION: resident of the full server keeps claiming', Array.isArray(mem?.granted) && mem.granted.includes('Brazil'), JSON.stringify(mem).slice(0, 120));
    await db.score.update({ where: { userId: uid }, data: { server: 0 } });
  } else check('full-server probe skipped (no free server number)', false, 'no slot');

  /* ---------- T7: test-server door still closed for non-admins (V86 kept) ---------- */
  const tSrv = tst[0];
  if (tSrv) {
    const ref2 = await rpc('territory_sync', { p_server: tSrv, p_held: ['Iraq'], p_capital: 'Iraq' });
    check('test server door still refuses fresh entry (test_server)', ref2?.test_server === true, JSON.stringify(ref2).slice(0, 120));
  }

  /* ---------- wd_presence still server-scoped ---------- */
  const pr = await rpc('wd_presence', { p_server: open ? open.server : 2, p_status: 'online' });
  check('wd_presence responds with per-server online map', !!pr && Array.isArray(pr.servers), JSON.stringify(pr).slice(0, 100));
} catch (e) {
  fail++; console.log('FAIL unexpected — ' + (e && e.message));
} finally {
  /* cleanup: remove every trace of the probe user + seeded full-server stat */
  try { if (uid) await db.user.delete({ where: { id: uid } }) } catch (e) { console.log('cleanup user:', e && e.message) }
  try { if (createdServerStat) await db.serverStat.deleteMany({ where: { server: createdServerStat } }) } catch (e) {}
  const left = await db.score.findUnique({ where: { userId: uid } }).catch(() => null);
  check('cleanup: probe user + rows fully removed (cascade)', !left);
}

console.log('\nV144 e2e: ' + ok + ' pass / ' + fail + ' fail');
process.exit(fail ? 1 : 0);
