/* ============================================================
   release.mjs — تک‌منبع نسخه (U2)
   Usage: node scripts/release.mjs [nextVersion]
   - نسخه‌ی جدید = آرگومان یا v.txt+1
   - نقاط لمس: v.txt | __WD_V beacon | همه‌ی ?v= در index.html | GAME_VER در MainActivity
   - گیت‌ها: تعداد نقاط لمس + check-html-js + verify-build + schema-diff + اسکن راز
   - commit نمی‌کند — بعد از سبزی، خودت commit/push کن
   ============================================================ */
import fs from 'fs'
import { spawnSync } from 'child_process'

const VFILE = 'public/game/v.txt'
const H = 'public/game/index.html'
const MA = 'apk-build/app/java/com/worlddominion/game/MainActivity.java'
const cur = Number(fs.readFileSync(VFILE, 'utf8').trim())
if (!/^\d+$/.test(String(cur))) { console.error('FATAL: v.txt invalid'); process.exit(1) }
const next = Number(process.argv[2]) || cur + 1
if (!(next > cur)) { console.error(`FATAL: next(${next}) must be > cur(${cur})`); process.exit(1) }

let h = fs.readFileSync(H, 'utf8')
const beaconRe = new RegExp('window\\.__WD_V=' + cur + ';')
if (!beaconRe.test(h)) { console.error(`FATAL: beacon __WD_V=${cur} not found`); process.exit(1) }
const qvBefore = (h.match(new RegExp('\\?v=' + cur + '(?![0-9])', 'g')) || []).length
const qvAny = (h.match(/\?v=\d+/g) || []).length
if (qvBefore !== qvAny) { console.error(`FATAL: stale ?v refs — cur=${qvBefore} but total=${qvAny} (migrate stragglers first)`); process.exit(1) }
if (qvBefore < 3) { console.error(`FATAL: too few ?v refs (${qvBefore}) — layout changed? review manually`); process.exit(1) }

h = h.replace(beaconRe, `window.__WD_V=${next};`)
h = h.replace(new RegExp('\\?v=' + cur + '(?![0-9])', 'g'), '?v=' + next)
fs.writeFileSync(H, h)
fs.writeFileSync(VFILE, String(next))

let ma = fs.readFileSync(MA, 'utf8')
const maRe = new RegExp('GAME_VER = ' + cur + ';')
if (!maRe.test(ma)) { console.error(`FATAL: GAME_VER = ${cur}; not found in MainActivity`); process.exit(1) }
ma = ma.replace(maRe, `GAME_VER = ${next};`)
fs.writeFileSync(MA, ma)

/* ---- verify touchpoints ---- */
const h2 = fs.readFileSync(H, 'utf8')
const v2 = fs.readFileSync(VFILE, 'utf8').trim()
const bad = []
if (v2 !== String(next)) bad.push('v.txt mismatch')
if (!(h2.match(new RegExp('window\\.__WD_V=' + next + ';')))) bad.push('beacon missing')
const stale = (h2.match(new RegExp('\\?v=' + cur + '(?![0-9])', 'g')) || []).length
if (stale) bad.push(stale + ' stale ?v refs')
if (!(fs.readFileSync(MA, 'utf8').match(new RegExp('GAME_VER = ' + next + ';')))) bad.push('GAME_VER missing')
if (bad.length) { console.error('FATAL verify: ' + bad.join(' | ')); process.exit(1) }
console.log(`release: v${cur} -> v${next} | ?v refs updated: ${qvBefore} | beacon+GAME_VER synced`)

/* ---- gates ---- */
const gate = (name, cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' })
  const out = (r.stdout || '') + (r.stderr || '')
  const pass = r.status === 0
  console.log(`gate ${name}: ${pass ? 'PASS' : 'FAIL'} — ${out.trim().split('\n').slice(-2).join(' | ').slice(0, 160)}`)
  return pass
}
const g1 = gate('check-html-js', 'node', ['scripts/check-html-js.js', H])
const g2 = gate('verify-build', 'node', ['scripts/verify-build.mjs'])
const g3 = gate('schema-diff', 'node', ['scripts/schema-diff.mjs'])

/* ---- secret scan on working tree diff ---- */
const diff = spawnSync('git', ['diff'], { encoding: 'utf8' }).stdout || ''
const secrets = diff.match(/ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-|eyJhbGciOi|WDmyket2026Ks9xQz/g) || []
console.log(`gate secret-scan: ${secrets.length ? 'FAIL — ' + 'SECRET FOUND' : 'PASS'}`)
if (secrets.length) process.exit(1)

if (!(g1 && g2 && g3)) { console.error('RELEASE GATES RED — fix before commit'); process.exit(1) }
console.log(`RELEASE READY: v${next} — review diff, then commit + push`)
