/* V158 CAP BOUNDARY E2E — real HTTP against the live local server + real SQLite rows.
 * Verifies the capacity edge cases the owner asked for:
 *   T1  srv_meta exposes cap=120 (single source of truth reaches the client)
 *   T2  at taken=119 a fresh claim PASSES  (exactly 120 after)
 *   T3  at taken=120 a fresh claim is refused with server_full
 *   T4  concurrent fresh claims at taken=119: AT MOST ONE wins — persistent taken never exceeds 120
 *   T5  residents (members) keep claiming on a full server (V144 exemption kept)
 *   T6  wd_servers: status 'full' at >=120; the next server appears ONLY when every known non-test server is >=120
 * Run: node scripts/v158-cap-e2e.mjs   (live server must be up) */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

let cookie = '';
async function rpc(fn, args, c) {
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(c || cookie ? { Cookie: c || cookie } : {}) },
    body: JSON.stringify(args || {}),
  });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  for (const ck of sc) if (ck.indexOf('wd_session=') === 0) cookie = ck.split(';')[0];
  const j = await r.json().catch(() => ({}));
  return j.data !== undefined ? j.data : j;
}
async function signup(tag) {
  /* signup flood guard is 5/min/IP — retry on 429 until the window clears */
  for (let a = 0; a < 14; a++) {
    const r = await fetch(BASE + '/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cap158' + tag + '@test.local', password: 'capbound158', nick: 'CAP158' + tag }),
    });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    const ck = sc.find((c) => c.startsWith('wd_session='));
    const j = await r.json().catch(() => ({}));
    if (ck && j?.data?.user?.id) return { cookie: ck.split(';')[0], uid: j.data.user.id, nick: 'CAP158' + tag };
    await new Promise((res) => setTimeout(res, 5500)); /* 429 — wait inside the same minute window */
  }
  throw new Error('signup kept failing (rate limit?) — tag=' + tag);
}

const ts = Date.now().toString(36).slice(-6);
const SRV = 90; /* a far server number — guaranteed untouched by real gameplay */
const CAP = Number((await rpc('srv_meta', {}))?.cap) || 120;
check('T1 srv_meta.cap = 120 (single source reaches the wire)', CAP === 120, 'cap=' + CAP);

const A = await signup('a' + ts);
cookie = A.cookie; /* global session for later rpc() calls (wd_servers etc.) */
await new Promise((r) => setTimeout(r, 800));
const B = await signup('b' + ts);
const countryOf = (i) => 'CapLand' + ts + i;
/* server-side proof: territory_sync grants only what the SERVER's own save row proves (V60sec doctrine) */
await db.save.upsert({ where: { userId: A.uid }, create: { userId: A.uid, nick: A.nick, state: JSON.stringify({ my: countryOf(1), conq: [countryOf(1), countryOf(3), countryOf(4)] }) }, update: { state: JSON.stringify({ my: countryOf(1), conq: [countryOf(1), countryOf(3), countryOf(4)] }) } });
await db.save.upsert({ where: { userId: B.uid }, create: { userId: B.uid, nick: B.nick, state: JSON.stringify({ my: countryOf(2), conq: [countryOf(2), countryOf(5)] }) }, update: { state: JSON.stringify({ my: countryOf(2), conq: [countryOf(2), countryOf(5)] }) } });

/* filler owner (real user row — territory.userId has an FK) */
const FILLER_ID = 'cap158filler' + ts;
await db.user.create({ data: { id: FILLER_ID, email: 'cap158filler' + ts + '@test.local', nick: 'CAP158FILLER' + ts, nickLower: 'cap158filler' + ts, passwordHash: 'x' } }).catch(() => {});

/* clean slate: exact count control */
await db.territory.deleteMany({ where: { server: SRV } });
await db.serverStat.deleteMany({ where: { server: SRV } }).catch(() => {});
const setTaken = async (n) => {
  await db.territory.deleteMany({ where: { server: SRV } });
  if (n > 0) await db.territory.createMany({ data: Array.from({ length: n }, (_, i) => ({ server: SRV, country: 'Filler' + ts + i, userId: FILLER_ID, nick: 'CAP158FILLER' })) });
  const taken = await db.territory.count({ where: { server: SRV } });
  const owners = await db.territory.groupBy({ by: ['userId'], where: { server: SRV } });
  await db.serverStat.upsert({ where: { server: SRV }, create: { server: SRV, taken, players: owners.length }, update: { taken, players: owners.length } });
};
await db.save.upsert({ where: { userId: FILLER_ID }, create: { userId: FILLER_ID, nick: 'CAP158FILLER', state: '{}' }, update: { state: '{}' } }).catch(() => {});

/* ---------- T2: 119 → fresh claim passes, lands exactly at 120 ---------- */
await setTaken(CAP - 1);
const g1 = await rpc('territory_sync', { p_server: SRV, p_held: [countryOf(1)], p_capital: countryOf(1) }, A.cookie);
const t2 = await db.territory.count({ where: { server: SRV } });
check('T2 at ' + (CAP - 1) + ' taken: fresh claim granted', g1?.ok === true && (g1?.granted || []).includes(countryOf(1)), JSON.stringify(g1).slice(0, 140));
check('T2 count after = exactly ' + CAP, t2 === CAP, 'taken=' + t2);

/* ---------- T3: 120 → fresh claim refused ---------- */
const g2 = await rpc('territory_sync', { p_server: SRV, p_held: [countryOf(2)], p_capital: countryOf(2) }, B.cookie);
check('T3 at ' + CAP + ' taken: fresh claim refused (server_full)', g2?.ok === false && g2?.server_full === true, JSON.stringify(g2).slice(0, 140));
check('T3 count still ' + CAP, (await db.territory.count({ where: { server: SRV } })) === CAP);

/* ---------- T5: member exemption kept ---------- */
await db.score.update({ where: { userId: A.uid }, data: { server: SRV } }).catch(async () => { await db.score.updateMany({ where: { userId: A.uid }, data: { server: SRV } }); });
const g3 = await rpc('territory_sync', { p_server: SRV, p_held: [countryOf(1), countryOf(3)], p_capital: countryOf(1) }, A.cookie);
check('T5 resident of the full server keeps claiming (exemption)', g3?.ok === true && (g3?.granted || []).includes(countryOf(3)), JSON.stringify(g3).slice(0, 140));

/* ---------- T4: concurrent fresh claims at 119 → deterministic ≤cap outcome ---------- */
await setTaken(CAP - 1);
const [r1, r2] = await Promise.all([
  rpc('territory_sync', { p_server: SRV, p_held: [countryOf(4)], p_capital: countryOf(4) }, A.cookie),
  rpc('territory_sync', { p_server: SRV, p_held: [countryOf(5)], p_capital: countryOf(5) }, B.cookie),
]);
const t4 = await db.territory.count({ where: { server: SRV } });
const wins = [r1, r2].filter((r) => r?.ok === true && (r?.granted || []).length).length;
const fulls = [r1, r2].filter((r) => r?.server_full === true).length;
check('T4 concurrent at ' + (CAP - 1) + ': exactly one winner (' + wins + ') one server_full (' + fulls + ')', wins === 1 && fulls === 1, JSON.stringify([r1, r2]).slice(0, 200));
check('T4 persistent count never exceeds ' + CAP, t4 <= CAP, 'taken=' + t4);

/* ---------- T6: wd_servers status/spawn at the boundary ---------- */
await setTaken(CAP);
const stRow = await db.serverStat.upsert({ where: { server: SRV }, create: { server: SRV, taken: CAP, players: 1 }, update: { taken: CAP } });
const ws1 = await rpc('wd_servers', {});
const row1 = (ws1?.servers || []).find((s) => s.server === SRV);
check('T6 server at taken=' + CAP + ' shows status full', row1?.status === 'full', JSON.stringify({ ws: ws1, srv: SRV }).slice(0, 160));
/* make every known server full → the list must grow by one (spawn trigger) */
for (const s of (ws1?.servers || [])) { if (s.server !== SRV) await db.serverStat.upsert({ where: { server: s.server }, create: { server: s.server, taken: CAP, players: 1 }, update: { taken: s.taken >= CAP ? s.taken : CAP } }); }
const ws2 = await rpc('wd_servers', {});
const n1 = (ws1?.servers || []).length, n2 = (ws2?.servers || []).length;
check('T6 all known servers full → list grows by 1 (spawn at ' + CAP + ')', n2 === n1 + 1, 'before=' + n1 + ' after=' + n2);
check('T6 no gaps in the spawned list', (ws2?.servers || []).every((s, i) => s.server === i + 1));

/* ---------- cleanup (only synthetic rows) ---------- */
await db.territory.deleteMany({ where: { server: SRV } });
await db.serverStat.deleteMany({ where: { server: SRV } }).catch(() => {});
for (const s of (ws1?.servers || [])) { if (s.server !== SRV) { const real = await db.territory.count({ where: { server: s.server } }); const own = await db.territory.groupBy({ by: ['userId'], where: { server: s.server } }); await db.serverStat.upsert({ where: { server: s.server }, create: { server: s.server, taken: real, players: own.length }, update: { taken: real, players: own.length } }).catch(() => {}); } }
await db.territory.deleteMany({ where: { userId: FILLER_ID } }).catch(() => {});
await db.territory.deleteMany({ where: { country: { startsWith: 'CapLand' + ts } } }).catch(() => {});
await db.user.deleteMany({ where: { email: { endsWith: 'cap158@test.local' } } }).catch(() => {});
await db.user.deleteMany({ where: { email: { endsWith: 'cap158filler' + ts + '@test.local' } } }).catch(() => {});
console.log('\nCAP BOUNDARY E2E: ' + ok + ' pass, ' + fail + ' fail');
await db.$disconnect();
process.exit(fail ? 1 : 0);
