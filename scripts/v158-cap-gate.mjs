/* V158 CAP GATE — capacity single-source-of-truth consistency check.
 * Fails the build/gate if the server capacity is inconsistent anywhere:
 *   1) route.ts SRV_CAP_GLOBAL value (the ONLY server-side source)
 *   2) client SRV_CAP default (index.html) — must equal the server value
 *   3) client fallbacks (||N / :N) — must equal the server value
 *   4) no hardcoded Persian «۹۰/۹۰» copy left in game files (labels must be dynamic)
 *   5) test/tooling fixtures must not hardcode 90 (v144-free-e2e/v140-release-e2e read srv_meta; perf-seed default 120)
 * Optional live check: node scripts/v158-cap-gate.mjs --base http://localhost:3000
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } };

const route = fs.readFileSync(path.join(ROOT, 'src/app/api/rpc/[fn]/route.ts'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'public/game/index.html'), 'utf8');
const social = fs.readFileSync(path.join(ROOT, 'public/game/social.js'), 'utf8');

/* 1) the single server-side source */
const m = route.match(/const SRV_CAP_GLOBAL = (\d+)/);
const CAP = m ? Number(m[1]) : 0;
check('route.ts declares SRV_CAP_GLOBAL (single server source)', !!m);
check('SRV_CAP_GLOBAL is 120 (V158 owner directive)', CAP === 120, 'got=' + CAP);
check('SRV_CAP_GLOBAL referenced by all 4 consumers (srv_meta/territory_sync/country_release/wd_servers)',
  (route.match(/SRV_CAP_GLOBAL/g) || []).length >= 5, 'refs=' + (route.match(/SRV_CAP_GLOBAL/g) || []).length);

/* 2+3) client default + fallbacks follow the server value */
check('client SRV_CAP default equals server cap', html.includes('let SRV_CAP=' + CAP + ','), 'default missing/wrong');
const fallbacks = [...html.matchAll(/SRV_CAP!=='undefined'\?\s*SRV_CAP\s*:\s*(\d+)/g)].map((x) => Number(x[1]));
fallbacks.push(...[...html.matchAll(/SRV_CAP!\=='undefined'&&SRV_CAP\)\|\|(\d+)/g)].map((x) => Number(x[1])));
fallbacks.push(...[...html.matchAll(/SRV_CAP!=='undefined'&&SRV_CAP\)\|\|(\d+)/g)].map((x) => Number(x[1])));
check('all client fallback literals equal the server cap (' + fallbacks.length + ' found)', fallbacks.length >= 3 && fallbacks.every((v) => v === CAP), JSON.stringify(fallbacks));
check('social.js fallback equals the server cap', social.includes('||' + CAP + ';'), 'social.js fallback');

/* 4) no hardcoded 90/90 Persian copy anywhere in game code */
const hard = [...html.matchAll(/۹۰\/۹۰/g)].concat([...social.matchAll(/۹۰\/۹۰/g)]);
check('no hardcoded «۹۰/۹۰» labels left (dynamic from SRV_CAP)', hard.length === 0, hard.map((x) => 'line~' + x.index).join(','));

/* 5) fixtures follow the cap */
const e1 = fs.readFileSync(path.join(ROOT, 'scripts/v144-free-e2e.mjs'), 'utf8');
const e2 = fs.readFileSync(path.join(ROOT, 'scripts/v140-release-e2e.mjs'), 'utf8');
check('v144-free-e2e reads cap from srv_meta (no hardcoded 90)', e1.includes("await rpc('srv_meta'") && !/taken: 90\b/.test(e1));
check('v140-release-e2e reads cap from srv_meta (no hardcoded 90)', e2.includes("await rpc('srv_meta'") && !/length: 90\b/.test(e2));
const seed = fs.readFileSync(path.join(ROOT, 'scripts/perf-seed.mjs'), 'utf8');
check('perf-seed full-server fixture follows --cap (default 120)', seed.includes("arg('cap', 120)") && !/Math\.min\(90,/.test(seed));

/* 6) live check (optional) */
const bi = process.argv.indexOf('--base');
if (bi >= 0) {
  const base = process.argv[bi + 1].replace(/\/$/, '');
  try {
    const r = await fetch(base + '/api/rpc/srv_meta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const j = await r.json().catch(() => ({}));
    const live = Number(j?.data?.cap ?? j?.cap);
    if (!Number.isFinite(live) && (j?.error?.code === '401' || j?.error?.message === 'not authenticated')) {
      /* srv_meta is session-gated — the authenticated live value is asserted by v158-cap-e2e T1 */
      console.log('SKIP live srv_meta.cap (session-gated; covered by v158-cap-e2e T1)');
    } else {
      check('live srv_meta.cap equals route.ts cap', live === CAP, 'live=' + live + ' code=' + CAP);
    }
  } catch (e) { check('live srv_meta.cap check', false, String(e).slice(0, 120)); }
}

console.log('\nCAP GATE: ' + ok + ' pass, ' + fail + ' fail (cap=' + CAP + ')');
process.exit(fail ? 1 : 0);
