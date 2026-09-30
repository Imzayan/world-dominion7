import { chromium } from 'playwright'
const b = await chromium.launch({ headless: true })
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage()
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text().slice(0, 120)) })
await p.goto('http://localhost:3000/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 })
try { await p.waitForSelector('#nick', { timeout: 30000 }) } catch (e) {}
await p.waitForTimeout(1000)
const nick = 'wd95p' + Date.now().toString(36).slice(-5)
const out = await p.evaluate(async (n) => {
  document.getElementById('nick').value = n
  document.getElementById('pw').value = 'wdtest1234'
  document.getElementById('pw2').value = 'wdtest1234'
  const btn = [...document.querySelectorAll('button')].find((b) => /ثبت‌نام و شروع/.test(b.textContent || ''))
  btn.click()
  let sess = null
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 800))
    try { const x = await sb.auth.getSession(); if (x && x.data && x.data.session) { sess = x.data.session; break } } catch (e) {}
  }
  let un = null, unErr = null
  try { un = await sb.rpc('social_unread') } catch (e) { unErr = String(e) }
  return {
    sessOk: !!sess,
    sessRaw: sess ? JSON.stringify(sess).slice(0, 120) : 'none',
    cookie: document.cookie.slice(0, 140),
    un: un ? JSON.stringify(un).slice(0, 200) : 'null',
    unErr, accUid: !!(window.ACC && ACC.uid), accNick: (window.ACC && ACC.nick) || '',
    srv: typeof SRV !== 'undefined' ? SRV : null,
  }
}, nick)
console.log(JSON.stringify(out, null, 1))
console.log('pageerrors:', errors.slice(0, 4).join(' | ') || 'none')
await b.close()
