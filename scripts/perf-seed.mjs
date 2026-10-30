/* PERF-BASELINE SEED — deterministic world-state generator for the Phase-1
 * performance baseline (local sqlite mirror only — NEVER against production).
 *
 * Creates N synthetic players (PERFBOT###) + one probe account (PERFPROBE),
 * a fully-owned server 1 (SRV_CAP countries — V158: default 120, configurable --cap), scores, saves,
 * battle logs. All rows are wipeable: every user email ends with @perf.seed
 * and every battle-log attacker starts with PERFBOT.
 *
 * usage:
 *   node scripts/perf-seed.mjs --players 500 [--seed 157001] [--srv 1] [--cap 120]
 *   node scripts/perf-seed.mjs --wipe
 *
 * output: scripts/perf-results/seed-manifest.json
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const crypto = await import('node:crypto');
const fs = await import('node:fs');
const path = await import('node:path');
const db = new PrismaClient();

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const PLAYERS = Number(arg('players', 500));
const SEED = Number(arg('seed', 157001));
const SRV = Number(arg('srv', 1));
const CAP = Number(arg('cap', 120)); /* V158: server capacity = SRV_CAP_GLOBAL; the "full server" fixture follows it */
const WIPE = process.argv.includes('--wipe');
const EMAIL_DOMAIN = '@perf.seed';
const RESULTS = path.resolve('scripts/perf-results');
fs.mkdirSync(RESULTS, { recursive: true });

/* deterministic PRNG (mulberry32) */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/* scrypt hash identical to src/lib/auth.ts hashPassword (fixed salt for determinism) */
function hashPassword(password, salt) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

/* country names straight from the live map geojson — guarantees layersByName match */
const geo = JSON.parse(fs.readFileSync('public/cdn/geo/countries.geo.json', 'utf8'));
const allNames = geo.features
  .map((f) => f && f.properties && f.properties.name)
  .filter((n) => typeof n === 'string' && n.length > 1 && n !== 'Antarctica');
const uniq = [...new Set(allNames)].sort();

async function wipe() {
  const users = await db.user.findMany({ where: { email: { endsWith: EMAIL_DOMAIN } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.territory.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } }); /* cascades Save/Score/Wallet/Session */
  }
  await db.battleLog.deleteMany({ where: { attacker: { startsWith: 'PERFBOT' } } });
  /* serverStat for SRV reflects only the REAL (non-synthetic) rows left */
  const taken = await db.territory.count({ where: { server: SRV } });
  const owners = await db.territory.groupBy({ by: ['userId'], where: { server: SRV } });
  await db.serverStat.upsert({ where: { server: SRV }, create: { server: SRV, taken, players: owners.length }, update: { taken, players: owners.length } });
  return { removedUsers: ids.length, realTaken: taken };
}

if (WIPE) {
  const r = await wipe();
  console.log('WIPE DONE', JSON.stringify(r));
  await db.$disconnect();
  process.exit(0);
}

const t0 = Date.now();
const wipeInfo = await wipe();

/* world layout: server 1 fully owned (CAP rows — V158: cap default 120, was 90).
 * owners = min(players, 80): the first `half` owners hold 2 countries, the rest 1
 * (2*half + (owners-half) = CAP when owners+half = CAP) → exactly CAP rows when players are enough */
const OWNED_TARGET = Math.min(CAP, uniq.length);
const owners = Math.max(1, Math.min(PLAYERS, 80));
const half = Math.max(0, Math.min(owners, Math.max(0, OWNED_TARGET - owners)));
const owned = [];
for (let i = 0; i < OWNED_TARGET; i++) owned.push(uniq[Math.floor((i * uniq.length) / OWNED_TARGET)]); /* stride = whole-world spread */

const hash = hashPassword('perfbaseline' + SEED, 'a1b2c3d4e5f6a7b8c9d0e1f2'); /* one scrypt call, reused */
const mkUser = (id, email, nick) => ({ id, email, nick, nickLower: nick.toLowerCase(), passwordHash: hash });

/* ---- users + wallet + score + save ---- */
const t1 = Date.now();
let users = 0, saves = 0, scores = 0, wallets = 0;
const ownerCountries = new Map(); /* nick -> [countries] */
for (let i = 1; i <= PLAYERS; i++) {
  const nick = 'PERFBOT' + String(i).padStart(3, '0');
  const uid = 'perfbot' + String(i).padStart(4, '0') + 'seed' + SEED;
  const isOwner = i <= owners;
  const c1 = isOwner ? owned[(i - 1) % OWNED_TARGET] : null;
  /* owners 1..half get a 2nd country from the band [owners, owners+half) — zero overlap with single-country owners */
  const c2 = isOwner && i <= half ? owned[owners + ((i - 1) % half)] : null;
  const mine = c2 && c2 !== c1 ? [c1, c2] : c1 ? [c1] : [];
  if (mine.length) ownerCountries.set(nick, mine);
  await db.user.create({ data: mkUser(uid, 'perf' + String(i).padStart(4, '0') + EMAIL_DOMAIN, nick) });
  users++;
  await db.wallet.create({ data: { userId: uid, gems: 40 } }).catch(() => {}); wallets++;
  await db.score.create({
    data: {
      userId: uid, nick, server: SRV, conquered: mine.length,
      score: mine.length ? ri(4000, 150000) : ri(50, 3000),
      kills: mine.length ? ri(0, 900) : ri(0, 40),
      economy: mine.length ? ri(1000, 200000) : ri(0, 9000),
      recruits: ri(0, 500),
    },
  }); scores++;
  await db.save.create({
    data: {
      userId: uid, nick,
      state: JSON.stringify({
        my: mine[0] || null, conq: mine,
        res: { gold: ri(5000, 90000), oil: ri(500, 9000), food: ri(800, 12000) },
        units: { infantry: ri(0, 8000), tank: ri(0, 900), fighter: ri(0, 400), missile: ri(0, 200), destroyer: ri(0, 120), drone: ri(0, 60) },
        infra: { oil: ri(0, 12), arms: ri(0, 10), storage: ri(0, 8) },
      }),
    },
  }); saves++;
  if (i % 100 === 0) console.log('  users', i, '/', PLAYERS, Math.round((Date.now() - t1) / 1000) + 's');
}

/* ---- territories (idempotent-safe: createMany then fix capitals) ---- */
const terrRows = [];
const seenCountry = new Set();
for (const [nick, cs] of ownerCountries) {
  const uid = 'perfbot' + String(Number(nick.slice(7))).padStart(4, '0') + 'seed' + SEED;
  cs.forEach((c, k) => { if (!seenCountry.has(c)) { seenCountry.add(c); terrRows.push({ server: SRV, country: c, userId: uid, nick, isCapital: k === 0 }); } });
}
await db.territory.createMany({ data: terrRows });
const taken = await db.territory.count({ where: { server: SRV } });
const ownerRows = await db.territory.groupBy({ by: ['userId'], where: { server: SRV } });
await db.serverStat.upsert({ where: { server: SRV }, create: { server: SRV, taken, players: ownerRows.length }, update: { taken, players: ownerRows.length } });

/* ---- battle logs: 2 per player over the last 48h (heatmap/intel realism) ---- */
const bl = [];
const now = Date.now();
for (let i = 0; i < PLAYERS * 2; i++) {
  const atk = 'PERFBOT' + String(ri(1, PLAYERS)).padStart(3, '0');
  bl.push({
    server: SRV, kind: rnd() < 0.8 ? 'attack' : 'capture',
    country: owned[ri(0, owned.length - 1)], attacker: atk,
    defender: 'PERFBOT' + String(ri(1, PLAYERS)).padStart(3, '0'),
    win: rnd() < 0.55, createdAt: new Date(now - ri(0, 48 * 3600_000)),
  });
}
await db.battleLog.createMany({ data: bl });

/* ---- server 1 must be a NORMAL server in the baseline world (not a QA test server) ---- */
await db.gameSetting.upsert({
  where: { key: 'wd_test_srvs' },
  create: { key: 'wd_test_srvs', value: '[]' },
  update: { value: '[]' },
});

/* ---- probe account (owns exactly 1 free country, has a session) ---- */
const freeSet = new Set(owned);
const free = uniq.filter((n) => !freeSet.has(n));
const PREF = ['Iceland', 'Ireland', 'Bolivia', 'Paraguay', 'Uruguay', 'Laos', 'Mongolia', 'Chad', 'Mali', 'Zambia', 'Oman', 'Jordan'];
const probeCountry = PREF.find((n) => free.includes(n)) || free[0];
const probeId = 'perfprobe000seed' + SEED;
await db.user.create({ data: mkUser(probeId, 'probe' + EMAIL_DOMAIN, 'PERFPROBE') }); users++;
await db.wallet.create({ data: { userId: probeId, gems: 40 } }).catch(() => {}); wallets++;
await db.score.create({ data: { userId: probeId, nick: 'PERFPROBE', server: SRV, score: 1200, kills: 3, economy: 5000, recruits: 10, conquered: 1 } }); scores++;
await db.save.create({
  data: { userId: probeId, nick: 'PERFPROBE', state: JSON.stringify({ my: probeCountry, conq: [probeCountry], res: { gold: 60000, oil: 5000, food: 8000 }, units: { infantry: 3000 }, infra: { oil: 4, arms: 3, storage: 2 } }) },
}); saves++;
const probeToken = crypto.randomBytes(24).toString('hex');
await db.session.create({ data: { token: probeToken, userId: probeId, expiresAt: new Date(now + 30 * 86400_000) } });

const manifest = {
  seed: SEED, srv: SRV, players: PLAYERS, owners: ownerRows.length, taken, ownedCountries: owned,
  probeToken, probeNick: 'PERFPROBE', probeCountry, battleLogs: bl.length, wipeInfo,
  generatedAt: new Date().toISOString(), elapsedMs: Date.now() - t0,
};
fs.writeFileSync(path.join(RESULTS, 'seed-manifest.json'), JSON.stringify(manifest, null, 1));
console.log('SEED DONE', JSON.stringify({ users, taken, owners: ownerRows.length, battles: bl.length, probeCountry, ms: Date.now() - t0 }));
await db.$disconnect();
