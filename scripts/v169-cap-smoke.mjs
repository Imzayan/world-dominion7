/* V169 CAP = MAP SIZE — regression smoke for the owner-reported bug:
 *   «سرور ۱۲۰ کشور تمام شد ولی سرور جدید نیامد؛ رو همون سرور مونده»
 * ROOT CAUSE (fixed): SRV_CAP_GLOBAL was a hand-set 120 while the map grew to 180 —
 * newcomers were blocked at 120 (server_full) but residents kept claiming (V144
 * exemption), so production drifted to 136/120 · 116/120 · 124/120, every server
 * showed a false «پُر» label, and the wd_servers +1 spawn rule (needs ALL servers
 * ≥ cap) dead-locked forever with server 2 parked at 116.
 * FIX: cap is DERIVED from the map (Object.keys(COUNTRY_DEF).length) — single source,
 * auto-syncs with any future map growth. Client default 180, sync guard widened
 * to ≤400, social.js fallback 180, version ritual 168→169.
 * Pins (source-level, no server needed):
 *   T1  route.ts derives the cap from COUNTRY_DEF; no numeric literal remains
 *   T2  mirror equality: countryDefs count === client REAL_POWER_DATABASE count (180)
 *   T3  client default 180 + sync guard ≤400 + no stale 120 default
 *   T4  social.js fallback 180
 *   T5  rotation rule intact: allKnownFull ? maxKnown+1 : maxKnown (spawn only when every server is full)
 *   T6  pickServer/allFull still consult SRV_CAP (no hardcoded 120 in the decision paths)
 *   T7  version ritual: __WD_V=169, v.txt=169, 12×?v=169, zero ?v=168
 * Run: node scripts/v169-cap-smoke.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

const route = fs.readFileSync(path.join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'public/game/index.html'), 'utf8');
const social = fs.readFileSync(path.join(ROOT, 'public/game/social.js'), 'utf8');
const cdefs = fs.readFileSync(path.join(ROOT, 'src/lib/countryDefs.ts'), 'utf8');
const vtxt = fs.readFileSync(path.join(ROOT, 'public/game/v.txt'), 'utf8');

/* T1 — server: the cap is the map, not a hand-set number */
check('T1 route derives SRV_CAP_GLOBAL from COUNTRY_DEF', /const SRV_CAP_GLOBAL = Object\.keys\(COUNTRY_DEF\)\.length/.test(route));
check('T1 no numeric literal SRV_CAP_GLOBAL remains', !/const SRV_CAP_GLOBAL = \d+/.test(route));

/* T2 — the two map mirrors must never drift again (this drift WAS the bug) */
const srvCount = (cdefs.match(/^  "/gm) || []).length;
const dbStart = html.indexOf('const REAL_POWER_DATABASE');
const dbSeg = dbStart >= 0 ? html.slice(dbStart, dbStart + 90000) : '';
const dbEnd = dbSeg.indexOf('\n};'); /* the map object closes at column 0 */
const cliCount = dbEnd >= 0 ? [...dbSeg.slice(0, dbEnd).matchAll(/"([^"]+)":\s*\{\s*fa:/g)].length : 0;
check('T2 server map (countryDefs) = 180', srvCount === 180, 'got=' + srvCount);
check('T2 client map (REAL_POWER_DATABASE) = 180', cliCount === 180, 'got=' + cliCount);
check('T2 mirror equality client↔server (drift guard)', srvCount === cliCount && srvCount > 0);

/* T3 — client default + sync guard */
check('T3 client SRV_CAP default is 180', html.includes('let SRV_CAP=180,'), html.match(/let SRV_CAP=(\d+)/)?.[1]);
check('T3 sync guard accepts future map growth (≤400)', /mc>=10&&mc<=400\)SRV_CAP=mc/.test(html));
check('T3 stale default 120 gone', !html.includes('let SRV_CAP=120,'));

/* T4 — social.js fallback */
check('T4 social.js fallback ||180;', social.includes("(typeof SRV_CAP!=='undefined'&&SRV_CAP)||180;"));
check('T4 social.js stale fallback 120 gone', !social.includes('SRV_CAP)||120;'));

/* T5 — the rotation spawn rule itself is intact and cap-driven */
check('T5 wd_servers spawn rule present (allKnownFull ? maxKnown+1 : maxKnown)', /allKnownFull \? maxKnown \+ 1 : maxKnown/.test(route));
check('T5 wd_servers full-check consults SRV_CAP_GLOBAL', /takenOf\.get\(k\) \|\| 0\) < SRV_CAP_GLOBAL/.test(route));

/* T6 — client decision paths are cap-driven (never hardcoded) */
check('T6 allFull uses SRV_CAP', /if\(taken\(k\)<SRV_CAP\)\{allFull=false;break\}/.test(html));
check('T6 pickServer uses SRV_CAP', /function pickServer\(\)\{const N=srvListTop\(\);for\(let k=1;k<=N;k\+\+\)if\(srvOpen\(k\)&&taken\(k\)<SRV_CAP\)return k;return N\}/.test(html));
check('T6 no literal 120 in the server-window decision code', !/taken\(k\)>=120|taken\(k\)<120/.test(html));

/* T7 — version ritual 168→169 */
check('T7 __WD_V=169', html.includes('window.__WD_V=169;'));
check('T7 v.txt = 169 (exact, no newline)', vtxt === '169', JSON.stringify(vtxt));
const v169 = (html.match(/\?v=169/g) || []).length;
const v168 = (html.match(/\?v=168/g) || []).length;
check('T7 asset cache-bust: 12×?v=169, 0×?v=168', v169 === 12 && v168 === 0, 'v169=' + v169 + ' v168=' + v168);

console.log('\nV169 CAP SMOKE: ' + ok + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
