/* WD91 — تست انتها-به-انتها: olympic_start(train) → تله‌متری v5 مشروع → olympic_submit → داوری سرور */
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/124.0 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
let pass = 0, fail = 0
const check = (n, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + n + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + n + (info ? ' — ' + info : '')) } }
await page.goto('http://localhost:3000/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 })
try { await page.waitForSelector('#nick', { timeout: 40000 }) } catch (e) {}
await page.waitForTimeout(1500)
await page.evaluate(() => {
  document.getElementById('nick').value = 'wd91e2e' + String(Date.now()).slice(-5)
  document.getElementById('pw').value = 'dgtess1234'
  document.getElementById('pw2').value = 'dgtess1234'
  const b = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
  b.click()
})
for (let i = 0; i < 25; i++) { const s = await page.evaluate(async () => { try { const x = await sb.auth.getSession(); return !!(x && x.data && x.data.session) } catch (e) { return false } }); if (s) break; await page.waitForTimeout(1000) }

/* همان شبیه‌ساز تست داور — تولید تله‌متری مشروع داخل صفحه */
const res = await page.evaluate(async () => {
  function seedOf3(str) { let h = 2166136261 >>> 0; const s = String(str || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h >>> 0 }
  function rngOf3(seed, salt) { let a = seedOf3(seed + ':' + salt) | 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
  function buildPlan(seed) { const r = rngOf3(seed, 'plan'); const plan = []; for (let rd = 0; rd < 3; rd++) { const n = 7 + Math.floor(r() * 4); const list = []; let t = 2.5 + r() * 2.5; for (let i = 0; i < n; i++) { const kind = Math.floor(r() * 6); list.push({ t, kind }); t += 2.4 + r() * 2.6; if (t > 29) break } plan.push(list) } return plan }
  const REC = [0.32, 0.51, 0.6, 0.6, 0.69, 0.53]
  function simFight(seed) {
    const R = rngOf3(seed, 'sim'); const rnd = () => R()
    const plan = buildPlan(seed)
    const ev = [['v5', 0, 3]]
    const bells = []
    const ms = (s) => Math.round(s * 1000)
    let t = 1.0
    const kdEvents = []
    for (let rd = 0; rd < 3; rd++) {
      const bellT = t
      bells.push(ms(bellT))
      ev.push(['bell', ms(bellT), rd + 1])
      const fight0 = bellT + 1.8
      let lastP = -9, lastKind = 0
      for (let i = 0; i < plan[rd].length; i++) {
        const step = plan[rd][i]
        const at = fight0 + step.t
        let res = 2
        const roll = rnd()
        if (roll < 0.35) res = 3
        else if (roll < 0.6) res = 1
        ev.push(['atk', ms(at), i, res, 0])
        if (res === 3 && rnd() < 0.5) { const ct = Math.max(at + 0.35, lastP + REC[lastKind] + 0.15); ev.push(['p', ms(ct), 1, 2, 11.2, 1]); lastP = ct; lastKind = 1 }
      }
      let pt = Math.max(fight0 + 3, lastP + REC[lastKind] + 0.2)
      let thrown = 0, landed = 0
      while (pt < bellT + 28 && thrown < 22) {
        const kind = thrown % 2 === 0 ? 0 : (thrown % 5 === 0 ? 5 : 1)
        const roll = rnd()
        let r2 = 2, dmg = kind === 0 ? 5.5 : kind === 5 ? 9 : 11.4
        if (roll < 0.2) { r2 = 0; dmg = 0 } else if (roll < 0.35) { r2 = 1; dmg = 2.4 }
        ev.push(['p', ms(pt), kind, r2, r2 === 0 ? 0 : dmg, 0])
        thrown++; if (r2 === 2) landed++
        lastP = pt; lastKind = kind
        pt += REC[kind] + 0.18 + rnd() * 0.35
      }
      if (rd === 1) kdEvents.push(['kd', ms(bellT + 25), 1, 1])
      ev.push(['rl', ms(bellT + 29.5), rd + 1, thrown, landed, 3, 0, rd === 1 ? 1 : 0])
      t = bellT + 40
    }
    ev.push(...kdEvents)
    ev.push(['end', ms(t), 1, 0])
    ev.sort((a, b) => Number(a[1]) - Number(b[1]))
    return { s: 0, e: ms(t) + 400, ev }
  }
  const out = {}
  /* ۱) تمرین: start → submit → داوری */
  const st = await sb.rpc('olympic_start', { p_discipline: 'boxing', p_mode: 'train' })
  const d = st.data
  out.start = d && d.ok ? { match: !!d.match_id, seedLen: (d.seed || '').length } : { err: st.error && st.error.message }
  const tel = simFight(d.seed)
  const sub = await sb.rpc('olympic_submit', { p_discipline: 'boxing', p_match_id: d.match_id, p_nonce: d.token, p_telemetry: tel, p_score: 999999 })
  out.trainSubmit = sub.data
  /* ۲) تامپر: امتیاز تقلبی — سرور باید امتیاز واقعی بدهد نه ۹۹۹۹۹۹ */
  return out
})
console.log(JSON.stringify(res, null, 1))
check('olympic_start train ok', res.start && res.start.match, JSON.stringify(res.start))
check('olympic_submit v5 accepted by server', res.trainSubmit && res.trainSubmit.ok === true, 'serverScore=' + (res.trainSubmit && res.trainSubmit.score))
check('server score is authoritative (not client 999999)', res.trainSubmit && res.trainSubmit.ok && res.trainSubmit.score > 100 && res.trainSubmit.score < 3000, 'score=' + (res.trainSubmit && res.trainSubmit.score))
await browser.close()
console.log('\nRESULT: ' + pass + ' pass, ' + fail + ' fail')
process.exit(fail ? 1 : 0)
