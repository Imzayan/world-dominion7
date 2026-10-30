/* V132 smoke — ① chat entry points (dock button + menu item + unread badge) ② governor
   ③ slim geo loads ④ dual-channel chat DOM opens ⑤ zero pageerror */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' }
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '').split('?')[0])
  if (p === '/') p = '/game/index.html'
  const f = join(ROOT, 'public', p)
  if (existsSync(f) && !f.endsWith('/')) {
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' })
    res.end(readFileSync(f))
  } else { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => srv.listen(8933, r))

let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }
const errors = []
const br = await chromium.launch()
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))

await page.goto('http://localhost:8933/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(4500)

check('zero pageerror on load', errors.length === 0, errors.join(' | '))
check('V143 beacon (current version live)', await page.evaluate(() => window.__WD_V >= 142))

/* ---------- ① chat entry: dock button ---------- */
const dock = await page.evaluate(() => {
  const b = document.getElementById('wd87-b-chat')
  if (!b) return null
  const r = b.getBoundingClientRect()
  const g = document.getElementById('wd87-b-gem')
  const gr = g ? g.getBoundingClientRect() : null
  return { exists: true, inDock: !!b.closest('#wd87dock'), visible: r.width > 0 && r.height > 0, gemVisible: gr ? gr.width > 0 : null, hasBadge: !!b.querySelector('.wd87-b'), pos: b.parentNode ? [...b.parentNode.children].indexOf(b) : -1 }
})
check('dock chat button exists in wd87dock', !!dock, JSON.stringify(dock))
check('dock chat button visible (parity with gem btn — auth overlay hides both pre-login)', !!dock && (dock.visible || dock.gemVisible === false), JSON.stringify(dock))
check('dock chat button has unread badge slot', !!dock && dock.hasBadge)
check('dock chat button in prime position (first 2)', !!dock && dock.pos <= 2, 'pos=' + (dock && dock.pos))

/* click → modal opens with dual tabs */
await page.evaluate(() => document.getElementById('wd87-b-chat').click())
await page.waitForTimeout(700)
const modal = await page.evaluate(() => {
  const m = document.getElementById('wd-chat')
  if (!m) return { exists: false }
  return {
    exists: true, open: m.classList.contains('active'),
    tabs: [...m.querySelectorAll('.wdc-tab')].map((t) => t.getAttribute('data-ch')),
    hasList: !!m.querySelector('#wdc-list'),
    hasInput: !!m.querySelector('#wdc-input'),
    hasSend: !!m.querySelector('#wdc-send'),
    title: (m.querySelector('.wdc-head-t b') || {}).textContent || '',
  }
})
check('chat modal opens from dock click', !!modal && modal.open, JSON.stringify(modal))
check('chat single server channel (V143 isolation — no world tab)', !!modal && modal.tabs.length === 0, JSON.stringify(modal && modal.tabs))
check('chat composer ready (list+input+send)', !!modal && modal.hasList && modal.hasInput && modal.hasSend)

/* WD28Chat.open direct path too */
await page.evaluate(() => { try { document.getElementById('wd28-chat-x').click() } catch (e) {} })
await page.waitForTimeout(300)
const direct = await page.evaluate(() => { try { window.WD28Chat.open(); return !!document.getElementById('wd-chat').classList.contains('active') } catch (e) { return 'ERR:' + e.message } })
check('WD28Chat.open() works', direct === true, String(direct))

/* ---------- ② menu entry ---------- */
await page.evaluate(() => { try { document.getElementById('wd28-chat-x').click() } catch (e) {} })
await page.waitForTimeout(300)
await page.evaluate(() => { const b = document.getElementById('wd7-btn'); if (b) b.click() })
await page.waitForTimeout(600)
const menu = await page.evaluate(() => {
  const items = [...document.querySelectorAll('#wd-menu .wd-menu-item')]
  const chat = items.find((it) => { const b = it.querySelector('b'); return b && b.textContent.indexOf('چت سرور') > -1 })
  return { count: items.length, hasChat: !!chat, gold: chat ? chat.className.indexOf('gold') > -1 : false }
})
check('menu has چت سرور item', menu.hasChat, JSON.stringify(menu))
/* click menu item opens chat */
await page.evaluate(() => {
  const items = [...document.querySelectorAll('#wd-menu .wd-menu-item')]
  const chat = items.find((it) => { const b = it.querySelector('b'); return b && b.textContent.indexOf('چت سرور') > -1 })
  if (chat) chat.click()
})
await page.waitForTimeout(600)
const menuOpen = await page.evaluate(() => { const m = document.getElementById('wd-chat'); return !!(m && m.classList.contains('active')) })
check('menu چت سرور item opens chat', menuOpen)

/* ---------- ③ governor ---------- */
const gov = await page.evaluate(() => ({
  flag: typeof window.__WD_QUIET_TICK,
  quiet: window.__WD_QUIET_TICK,
  htmlQuiet: document.documentElement.classList.contains('wd-quiet'),
}))
check('governor flag defined', gov.flag === 'boolean', JSON.stringify(gov))
check('mobile weak-device → quiet stretch active', gov.quiet === true, JSON.stringify(gov))
/* wrapped 30s+ intervals skip when hidden: verify monkeypatch still returns numeric id */
const iv = await page.evaluate(() => new Promise((res) => { const id = setInterval(() => res(id), 30000); setTimeout(() => res(typeof id === 'number' ? 'id-ok' : 'bad'), 50) }))
check('setInterval passthrough returns id', iv === 'id-ok', String(iv))

/* ---------- ④ slim geo ---------- */
const geo = await page.evaluate(async () => {
  try {
    const r = await fetch('/cdn/geo/countries.geo.json', { cache: 'no-store' })
    const txt = await r.text()
    const j = JSON.parse(txt)
    return { ok: true, feats: j.features.length, bytes: txt.length }
  } catch (e) { return { ok: false, err: String(e) } }
})
check('slim geo serves 180 features', geo.ok && geo.feats === 180, JSON.stringify(geo))

/* ---------- ⑤ map intact ---------- */
const mapOk = await page.evaluate(() => ({ leaflet: typeof window.L !== 'undefined', container: !!document.querySelector('.leaflet-container') }))
check('map mounted', mapOk.leaflet && mapOk.container)

check('zero pageerror at end', errors.length === 0, errors.join(' | '))

console.log(`\n== ${ok}/${ok + fail} ==`)
await br.close()
srv.close()
process.exit(fail ? 1 : 0)
