/* V163 PVP ATTACK PROBE — server-side protocol reproduction of the owner's bug:
 * "attacking a country that HAS an owner → progress bar never fills, attack never executes".
 * Calls pvp_attack over real HTTP exactly like the client does and dumps every gate's verdict.
 * Run: node scripts/v163-pvp-probe.mjs   (live server on :3000 required)
 */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

async function rpc(fn, args, ck) {
  const t0 = Date.now();
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(ck ? { Cookie: ck } : {}) },
    body: JSON.stringify(args || {}),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, ms: Date.now() - t0, body: j.data !== undefined ? j.data : j };
}
async function signup(tag) {
  for (let a = 0; a < 14; a++) {
    const r = await fetch(BASE + '/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pvp163' + tag + '@test.local', password: 'pvp163test', nick: 'PVP163' + tag }),
    });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    const ck = sc.find((c) => c.startsWith('wd_session='));
    const j = await r.json().catch(() => ({}));
    if (ck && j?.data?.user?.id) return { cookie: ck.split(';')[0], uid: j.data.user.id, nick: 'PVP163' + tag };
    await new Promise((res) => setTimeout(res, 5500));
  }
  throw new Error('signup kept failing — tag=' + tag);
}

const ts = Date.now().toString(36).slice(-6);
const SRV = 92; /* far server — untouched by real gameplay */
const COUNTRY = 'Brazil';

const A = await signup('a' + ts); /* attacker */
await new Promise((r) => setTimeout(r, 800));
const B = await signup('b' + ts); /* defender */
await new Promise((r) => setTimeout(r, 800));

/* both accounts older than the 48h sacred-peace window */
await db.user.update({ where: { id: A.uid }, data: { createdAt: new Date(Date.now() - 10 * 86400_000) } });
await db.user.update({ where: { id: B.uid }, data: { createdAt: new Date(Date.now() - 10 * 86400_000) } });

/* B owns Brazil on SRV=92 */
await db.territory.create({ data: { server: SRV, country: COUNTRY, userId: B.uid, nick: B.nick, isCapital: true } }).catch((e) => console.log('terr', e));

/* B save: small army + treasury (defender losses path writes here) */
await db.save.upsert({
  where: { userId: B.uid },
  create: { userId: B.uid, nick: B.nick, state: JSON.stringify({ my: COUNTRY, conq: [COUNTRY], res: { gold: 20000, oil: 20000, food: 20000 }, units: { infantry: 300 } }) },
  update: { state: JSON.stringify({ my: COUNTRY, conq: [COUNTRY], res: { gold: 20000, oil: 20000, food: 20000 }, units: { infantry: 300 } }) },
});
await db.save.upsert({ where: { userId: B.uid }, create: { userId: B.uid, nick: B.nick, state: '{}' }, update: {} }).catch(() => {});

/* A save: big army + deep treasury (logistics + pvpAttack cost must pass) */
const A_STATE = { my: 'AtkLand' + ts, conq: ['AtkLand' + ts], res: { gold: 500000, oil: 500000, food: 500000 }, units: { infantry: 20000, tank: 1500, bomber: 200, fighter: 200 } };
await db.save.upsert({ where: { userId: A.uid }, create: { userId: A.uid, nick: A.nick, state: JSON.stringify(A_STATE) }, update: { state: JSON.stringify(A_STATE) } });
await db.score.updateMany({ where: { userId: A.uid }, data: { server: SRV, score: 5000 } });
await db.score.updateMany({ where: { userId: B.uid }, data: { server: SRV, score: 800 } });

console.log('--- players seeded on SRV=' + SRV + ', target=' + COUNTRY + ' owned by ' + B.nick);
const scoreCheck = await db.score.findUnique({ where: { userId: A.uid }, select: { score: true, server: true } });
check('T0 attacker score row seeded (server 92, score 5000)', !!scoreCheck && scoreCheck.score === 5000 && scoreCheck.server === SRV, JSON.stringify(scoreCheck));

/* T1 — the exact call the client makes */
const r1 = await rpc('pvp_attack', { p_server: SRV, p_country: COUNTRY, p_attack: 60000, p_tactic: null, p_atk_type: null, p_gen: null }, A.cookie);
console.log('T1 pvp_attack →', JSON.stringify(r1).slice(0, 700));
check('T1 status 200 + no transport error', r1.status === 200 && r1.body && !r1.body.error, JSON.stringify(r1.body).slice(0, 200));
check('T1 adjudicated (rounds[] present — bar animation data)', Array.isArray(r1.body?.rounds) && r1.body.rounds.length >= 3, 'rounds=' + JSON.stringify(r1.body?.rounds || null).slice(0, 120));
check('T1 ok/captured boolean present', typeof r1.body?.ok === 'boolean' && typeof r1.body?.captured === 'boolean', '');
check('T1 response arrived fast enough for the 15s client race (<8s)', r1.ms < 8000, r1.ms + 'ms');

/* T2 — immediate retry hits target cooldown cdt (client handles it) */
const r2 = await rpc('pvp_attack', { p_server: SRV, p_country: COUNTRY, p_attack: 60000 }, A.cookie);
console.log('T2 pvp_attack retry →', JSON.stringify(r2).slice(0, 300));
check('T2 retry answered with a KNOWN error shape the client renders', r2.body && ['cdt', 'cd', 'res', 'weak', 'cap', 'truce', 'peace', 'rate', 'supply'].includes(r2.body.error), 'error=' + (r2.body && r2.body.error));

/* T3 — second target works after the per-user attack cooldown clears — A attacks B's SECOND country */
await db.territory.create({ data: { server: SRV, country: 'Argentina', userId: B.uid, nick: B.nick } }).catch((e) => console.log('terr2', e));
await new Promise((r) => setTimeout(r, 17500)); /* per-user attack cooldown (15s) */
const r3 = await rpc('pvp_attack', { p_server: SRV, p_country: 'Argentina', p_attack: 60000, p_atk_type: 'blitz' }, A.cookie);
console.log('T3 pvp_attack second target →', JSON.stringify(r3).slice(0, 400));
check('T3 second target adjudicated with rounds[]', Array.isArray(r3.body?.rounds) && r3.body.rounds.length >= 3, JSON.stringify(r3.body).slice(0, 200));

/* cleanup synthetic rows */
await db.territory.deleteMany({ where: { server: SRV } });
await db.battleLog.deleteMany({ where: { attacker: { in: [A.nick, B.nick] } } }).catch(() => {});
await db.save.deleteMany({ where: { userId: { in: [A.uid, B.uid] } } }).catch(() => {});
await db.user.deleteMany({ where: { email: { endsWith: 'pvp163@test.local' } } }).catch(() => {});
console.log('\nPVP163 PROBE: ' + ok + ' pass, ' + fail + ' fail');
await db.$disconnect();
process.exit(fail ? 1 : 0);
