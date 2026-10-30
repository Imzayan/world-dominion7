/* CONQUEST DIFFICULTY PROBE — measures current (and post-tune) conquest difficulty
 * with the REAL server battle engine (src/lib/battleConfig.ts via node type stripping).
 * Neutral PvE model exactly as the client's 5-round loop (index.html wd attack):
 *   minForce gate → 5 rounds of simBattle vs full garrison (HP=1, occ0) → win if occ>=100.
 * usage: node scripts/conquest-difficulty-probe.mjs [neutralK] [minForcePve]
 *   (no args = live V159 values 1.35/0.40; pass "1.0 0.30" to reproduce the pre-V159 BEFORE table)
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
/* battleConfig.ts imports './countryDefs' extensionless — node ESM needs the .ts
   extension, so materialize an import-rewritten copy in tmp (read-only transform,
   the real files are never touched). */
const _src = fs.readFileSync('src/lib/battleConfig.ts', 'utf8').replace("from './countryDefs'", "from 'file:///home/z/my-project/src/lib/countryDefs.ts'");
const _tmp = path.join(os.tmpdir(), 'probe-battleConfig.mts');
fs.writeFileSync(_tmp, _src);
const { BATTLE_CFG, garrisonOf, simBattle, armyPower, garrisonComp } = await import(_tmp);

const NEUTRAL_K = Number(process.argv[2] || 1.35);       /* 1.35 = live V159 (pre-V159: 1.0) */
const MIN_RATIO = Number(process.argv[3] || 0.40);      /* 0.40 = live V159 (pre-V159: 0.30) */
const cfg = JSON.parse(JSON.stringify(BATTLE_CFG));
cfg.garrison = { ...cfg.garrison };                      /* local tune space */

/* armies: [label, units] — starter = claimCapital grant; tiers from real build economy */
const ARMIES = [
  ['starter (10tanks+20drone+5fighter)', { tank: 10, drone: 20, fighter: 5 }],
  ['mid (30tanks+100inf+10fighter)', { tank: 30, infantry: 100, fighter: 10 }],
  ['strong (80tanks+200inf+20fighter+5heli)', { tank: 80, infantry: 200, fighter: 20, heli: 5 }],
  ['elite (150tanks+300inf+30fighter+10destroyer)', { tank: 150, infantry: 300, fighter: 30, destroyer: 10 }],
];
/* countries: real COUNTRY_DEF rows [def, popM] */
const COUNTRIES = [
  ['Belize (def500)', 'Belize'],
  ['Azerbaijan (def4100)', 'Azerbaijan'],
  ['Iran (def7600/89M)', 'Iran'],
  ['Brazil (def7400/216M)', 'Brazil'],
];

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

console.log(`NEUTRAL_K=${NEUTRAL_K}  minForce.ratioPve=${MIN_RATIO}  (1.35/0.40 = live V159)`);
console.log('garrison(full) = def×1.42×(1+0.18×popN+0.10×ecoN) cap def×2.2' + (NEUTRAL_K !== 1 ? ` × ${NEUTRAL_K} (proposed neutralK)` : ''));
const gar = {};
for (const [label, c] of COUNTRIES) gar[label] = Math.round(garrisonOf(c, cfg) * NEUTRAL_K);
console.log('garrisons:', Object.entries(gar).map(([k, v]) => `${k}=${v}`).join('  '));
console.log('');

/* campaign model: repeated attacks vs the SAME country — garrison HP persists (regen 14%/h
 * between waves is ignored = best-case for attacker), attacker losses persist, occ persists. */
function campaign(units, countryLabel, maxWaves = 6) {
  const A0 = armyPower(units, 0, cfg);
  if (A0 < MIN_RATIO * gar[countryLabel]) return { waves: 0, verdict: 'BLOCKED(minForce)', power: A0 };
  let A = A0, occ = 0, hp = 1, winWave = -1;
  for (let w = 1; w <= maxWaves; w++) {
    const r = simBattle({ A, D0: gar[countryLabel] * (cfg.garrison.regenFloor + (1 - cfg.garrison.regenFloor) * hp), atkComp: { infantry: 0.5, armor: 0.35, air: 0.15 }, defComp: garrisonComp(gar[countryLabel], cfg), occ0: occ, hp0: hp }, cfg);
    occ = r.occ; hp = Math.max(0, hp - r.dLost); A = Math.round(A * (1 - r.aLost));
    if (r.win) { winWave = w; break; }
    if (A <= 1) break;
  }
  return { waves: winWave > 0 ? winWave : maxWaves, verdict: winWave > 0 ? `WIN wave ${winWave}` : 'STALLED', power: A0 };
}

/* N repetitions → median waves */
const N = 60;
for (const [al, units] of ARMIES) {
  const cells = [];
  for (const [cl] of COUNTRIES) {
    const rs = [];
    for (let i = 0; i < N; i++) rs.push(campaign(units, cl));
    const wins = rs.filter((r) => r.verdict.startsWith('WIN')).length;
    const blocked = rs.filter((r) => r.verdict.startsWith('BLOCKED')).length;
    const mw = med(rs.filter((r) => r.verdict.startsWith('WIN')).map((r) => r.waves));
    cells.push(blocked ? 'BLOCKED' : wins ? `${wins}/${N} win (med ${mw || '-'} attack${mw > 1 ? 's' : ''})` : `0/${N} (stall)`);
  }
  console.log(al.padEnd(44), '|', cells.join(' | '));
}
console.log('');
console.log('cost per attack (live): logistics 250+6%×power food+oil + expedition ' + (NEUTRAL_K !== 1 ? '' : '120+60×(terr−1) gold, 25+10×(terr−1) oil'));
