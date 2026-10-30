/* V159 WMD / GLOBAL TENSION E2E — real HTTP against the live local server + real SQLite rows.
 * Verifies the owner's WMD overhaul end-to-end:
 *   T1  special_status: cooldown/weekly world is GONE (next=null, left=9999) + tension exposed
 *   T2  nuke #1 lands: ok, tension 0→15, rogue_until set, no cooldown fields
 *   T3  nuke #2 lands IMMEDIATELY (no cooldown) → tension 15→30
 *   T4  attacker war_state: sanctioned=true + rogue_until in the future
 *   T5  sanctioned rogue CANNOT create a trade offer (reason 'sanctioned')
 *   T6  sanctioned rogue CANNOT create an alliance (error 'rogue')
 *   T7  nuke army attrition: defender save units.tank 10 → 8 (nukeArmyLossFrac=0.2, capped — not a full wipe)
 *   T8  nuke_alert arrives INSTANTLY on the server realtime channel (SSE)
 *   T9  EMP (war_use_item WMD class) bumps tension +15, no cd/cap errors
 * Run: node scripts/v159-wmd-e2e.mjs   (live server must be up) */
process.env.DATABASE_URL = 'file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const BASE = 'http://localhost:3000';
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

async function rpc(fn, args, ck) {
  const r = await fetch(BASE + '/api/rpc/' + encodeURIComponent(fn), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(ck ? { Cookie: ck } : {}) },
    body: JSON.stringify(args || {}),
  });
  const j = await r.json().catch(() => ({}));
  return j.data !== undefined ? j.data : j;
}
async function signup(tag) {
  for (let a = 0; a < 14; a++) {
    const r = await fetch(BASE + '/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wmd159' + tag + '@test.local', password: 'wmdtest159', nick: 'WMD159' + tag }),
    });
    const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
    const ck = sc.find((c) => c.startsWith('wd_session='));
    const j = await r.json().catch(() => ({}));
    if (ck && j?.data?.user?.id) return { cookie: ck.split(';')[0], uid: j.data.user.id, nick: 'WMD159' + tag };
    await new Promise((res) => setTimeout(res, 5500));
  }
  throw new Error('signup kept failing — tag=' + tag);
}

const ts = Date.now().toString(36).slice(-6);
const SRV = 91; /* far server — untouched */
const COUNTRY = 'NukeLand' + ts;

const A = await signup('a' + ts); /* attacker → rogue state */
const B = await signup('b' + ts); /* defender/victim */
await new Promise((r) => setTimeout(r, 800));

/* backdate B under the 7-day protection so WMD targeting works */
await db.user.update({ where: { id: B.uid }, data: { createdAt: new Date(Date.now() - 9 * 86400_000) } });
/* make A a member of SRV — war_state/war_use_item report the tension of the USER'S OWN server (warUserServer) */
await db.score.updateMany({ where: { userId: A.uid }, data: { server: SRV } });

/* B owns the target country on SRV (real user row → FK ok) */
await db.territory.create({ data: { server: SRV, country: COUNTRY, userId: B.uid, nick: B.nick, isCapital: true } }).catch(() => {});

/* gems for the attacker (500/op) + starter stock for EMP */
await db.wallet.upsert({ where: { userId: A.uid }, create: { userId: A.uid, gems: 5000 }, update: { gems: 5000 } });
await db.warState.upsert({ where: { userId: A.uid }, create: { userId: A.uid, data: JSON.stringify({ stock: { tactical_emp: 5 } }) }, update: { data: JSON.stringify({ stock: { tactical_emp: 5 } }) } });
/* defender army for the attrition check */
await db.save.upsert({
  where: { userId: B.uid },
  create: { userId: B.uid, nick: B.nick, state: JSON.stringify({ units: { tank: 10, infantry: 50 } }) },
  update: { state: JSON.stringify({ units: { tank: 10, infantry: 50 } }) },
});

/* ---- T1: special_status — no cooldown/weekly world + tension exposed ---- */
const st1 = await rpc('special_status', { p_server: SRV }, A.cookie);
check('T1a special_status tension exposed (number)', typeof st1.tension === 'number', JSON.stringify(st1).slice(0, 120));
check('T1b nuke_next = null (no cooldown)', st1.nuke_next === null, 'nuke_next=' + st1.nuke_next);
check('T1c nuke_left = 9999 (no weekly cap)', st1.nuke_left === 9999, 'nuke_left=' + st1.nuke_left);

/* ---- T8 pre-arm: B listens on the server SSE channel ---- */
const sseCtl = new AbortController();
const sseP = fetch(BASE + '/api/rt/wd-terr-' + SRV + '/sse', { headers: { Cookie: B.cookie }, signal: sseCtl.signal }).then((r) => r.body).catch(() => null);
await new Promise((r) => setTimeout(r, 1200));

/* ---- T2: nuke #1 ---- */
const n1 = await rpc('use_special', { p_item: 'nuke', p_country: COUNTRY, p_server: SRV }, A.cookie);
check('T2a nuke #1 ok=true (no cooldown error)', n1.ok === true, JSON.stringify(n1).slice(0, 160));
check('T2b tension 15 after first WMD', n1.tension === 15, 'tension=' + n1.tension);
check('T2c rogue_until set (48h ahead)', !!n1.rogue_until && n1.rogue_until - Date.now() > 47 * 3600_000, 'rogue_until=' + n1.rogue_until);
check('T2d next_ok=null (no cooldown on the wire)', n1.next_ok === null, 'next_ok=' + n1.next_ok);

/* ---- T3: nuke #2 immediately ---- */
const n2 = await rpc('use_special', { p_item: 'nuke', p_country: COUNTRY, p_server: SRV }, A.cookie);
check('T3a nuke #2 ok=true IMMEDIATELY (cooldown truly gone)', n2.ok === true, JSON.stringify(n2).slice(0, 160));
check('T3b tension 30 after second WMD', n2.tension === 30, 'tension=' + n2.tension);

/* ---- T7: defender army attrition (capped 20% PER nuke, not a wipe; two nukes landed = ×0.8²) ---- */
const saveB = await db.save.findUnique({ where: { userId: B.uid } });
const unitsB = (() => { try { return JSON.parse(saveB.state).units } catch { return {} } })();
check('T7 defender army attrition 2 nukes ×20% (tank 10→6, infantry 50→32)', unitsB.tank === 6 && unitsB.infantry === 32, JSON.stringify(unitsB));

/* ---- T4: attacker war_state shows sanctioned ---- */
const ws = await rpc('war_state', {}, A.cookie);
check('T4a war_state.sanctioned = true', ws.sanctioned === true, 'sanctioned=' + ws.sanctioned);
check('T4b war_state.rogue_until in the future', typeof ws.rogue_until === 'number' && ws.rogue_until > Date.now(), 'rogue_until=' + ws.rogue_until);
check('T4c war_state.tension = 30 (world truth)', ws.tension === 30, 'tension=' + ws.tension);

/* ---- T5: rogue cannot trade ---- */
const tr = await rpc('trade_offer_create', { p_server: SRV, p_give_res: 'gold', p_give_qty: 100, p_want_res: 'oil', p_want_qty: 100 }, A.cookie);
check('T5 rogue trade_offer_create refused (sanctioned)', tr.ok === false && tr.reason === 'sanctioned', JSON.stringify(tr).slice(0, 120));

/* ---- T6: rogue cannot create an alliance ---- */
const al = await rpc('alliance_create', { p_server: SRV, p_name: 'RogueAlliance' + ts, p_tag: 'RG' + ts.slice(0, 2).toUpperCase(), }, A.cookie);
check('T6 rogue alliance_create refused (rogue)', al.ok === false && al.error === 'rogue', JSON.stringify(al).slice(0, 120));

/* ---- T8: nuke_alert arrived on the SSE channel ---- */
let gotAlert = false;
try {
  const body = await sseP;
  if (body) {
    const reader = body.getReader();
    const dec = new TextDecoder();
    const deadline = Date.now() + 6000;
    let buf = '';
    while (Date.now() < deadline) {
      const t = Promise.race([reader.read(), new Promise((res) => setTimeout(() => res(null), deadline - Date.now()))]);
      const chunk = await t;
      if (!chunk || chunk.done) break;
      buf += dec.decode(chunk.value || new Uint8Array());
      if (buf.indexOf('nuke_alert') > -1) { gotAlert = true; break; }
    }
    sseCtl.abort();
  }
} catch (e) { /* stream errors = fail below */ }
check('T8 nuke_alert broadcast on wd-terr SSE (instant push)', gotAlert, 'no nuke_alert event seen');

/* ---- T9: EMP (war_use_item WMD class) bumps tension +15 on the USER'S server ---- */
const emp = await rpc('war_use_item', { p_item: 'tactical_emp', p_target: B.nick }, A.cookie);
check('T9a EMP ok (no cd/cap errors)', emp.ok === true, JSON.stringify(emp).slice(0, 160));
check('T9b tension 45 after EMP (+15)', emp.tension === 45, 'tension=' + emp.tension);

/* ---- cleanup: far-server rows + test accounts (keep the world clean like V158 did) ---- */
await db.territory.deleteMany({ where: { server: SRV } }).catch(() => {});
await db.battleLog.deleteMany({ where: { server: SRV } }).catch(() => {});
await db.specialUse.deleteMany({ where: { userId: { in: [A.uid, B.uid] } } }).catch(() => {});
await db.warState.deleteMany({ where: { userId: { in: [A.uid, B.uid] } } }).catch(() => {});
await db.save.deleteMany({ where: { userId: { in: [A.uid, B.uid] } } }).catch(() => {});
await db.wallet.deleteMany({ where: { userId: { in: [A.uid, B.uid] } } }).catch(() => {});
await db.user.deleteMany({ where: { id: { in: [A.uid, B.uid] } } }).catch(() => {});
/* reset the global tension row so other tests start clean */
await db.gameSetting.deleteMany({ where: { key: 'world_tension' } }).catch(() => {});

console.log(`\nv159-wmd-e2e: ${ok} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
