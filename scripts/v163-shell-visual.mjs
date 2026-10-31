/* V163 visual smoke — the mobile shell really renders as designed.
   Boots the real client (static server + mocked multiplayer, V144 harness pattern),
   passes auth like a player (guest), then asserts:
   (1) zero pageerror  (2) dock: all nav buttons on ONE row, shop button visible,
   labels 10px, orb icons  (3) HUD chips 30px + hud-terr alive  (4) wd7-btn 52px
   (5) screenshots at 360×740 and 390×844 for the human eye.
   Run: node scripts/v163-shell-visual.mjs */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = process.cwd()
let ok = 0, fail = 0
const check = (n, c, i = '') => { if (c) { ok++; console.log('PASS ' + n) } else { fail++; console.log('FAIL ' + n + ' — ' + i) } }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.geojson': 'application/json' }
const srv = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '').split('?')[0])
  if (p === '/') p = '/game/index.html'
  const f = join(ROOT, 'public', p)
  if (existsSync(f) && !f.endsWith('/')) { res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) } else { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => srv.listen(8951, r))

const errors = []
const br = await chromium.launch()
const shots = '/tmp/v163-shots'; mkdirSync(shots, { recursive: true })

for (const vp of [{ w: 390, h: 844, tag: '390' }, { w: 360, h: 740, tag: '360' }]) {
  const ctx = await br.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
  await page.goto('http://localhost:8951/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2500)

  /* mock the multiplayer layer BEFORE entering (guest flow works offline anyway) */
  await page.evaluate(() => {
    const qres = (rows) => ({ data: rows, error: null, eq() { return qres(rows) }, order() { return qres(rows) }, limit() { return qres(rows) }, maybeSingle: async () => ({ data: rows[0] || null, error: null }) })
    try {
      sb = { from(t) { return { select() { return qres([]) }, update() { return { eq() { return { select: async () => ({ data: [], error: null }) } } } }, insert: async () => ({ error: null, data: [] }) } }, rpc() { return Promise.resolve({ data: null }) } }
      MP_OK = true
    } catch (e) {}
    try { ACC.uid = 'v163'; ACC.nick = 'V163'; ACC.ready = true } catch (e) {}
  })

  /* guest entry — same door players use */
  const guest = page.locator('#auth button', { hasText: 'بازی مهمان' }).first()
  if (await guest.count()) { await guest.click().catch(() => {}) }
  await page.waitForTimeout(4000)

  /* --- shell layout assertions --- */
  const shell = await page.evaluate(() => {
    const r = (el) => el ? el.getBoundingClientRect() : null
    const dock = document.querySelector('.bottom-nav')
    const btns = dock ? [...dock.querySelectorAll('.nav-btn')] : []
    const vis = btns.filter((b) => { const x = r(b); return x && x.width > 4 && x.height > 4 })
    const rows = new Set(vis.map((b) => Math.round(r(b).top)))
    const label = (b) => { const s = b.querySelector('span:last-child'); return s ? getComputedStyle(s).fontSize : '?' }
    const labels = vis.map(label)
    const chips = [...document.querySelectorAll('#hud-strip .hchip')].map((c) => Math.round(r(c).height)).filter((h) => h > 8)
    const terr = document.getElementById('hud-terr')
    const terrDisp = terr ? getComputedStyle(terr).display : 'none'
    const fab = r(document.getElementById('wd7-btn'))
    const shop = vis.find((b) => b.id === 'btn-m-shop')
    const svgIcons = vis.filter((b) => b.querySelector('span svg')).length
    return {
      btnCount: btns.length, visCount: vis.length, rowCount: rows.size,
      labels, chipHeights: chips, terrDisp,
      terrVisible: !!terr && (terr.getBoundingClientRect().height > 8 || terrDisp === 'flex'),
      terrText: terr ? terr.textContent.slice(0, 60) : null,
      fab: fab ? { w: Math.round(fab.width), h: Math.round(fab.height), bottom: Math.round(innerHeight - fab.bottom) } : null,
      shopVisible: !!shop, svgIcons,
      dockBottomClear: dock ? Math.round(innerHeight - r(dock).bottom) : -1,
    }
  })
  check(`[${vp.tag}] zero pageerror so far`, errors.length === 0, errors.join(' | '))
  check(`[${vp.tag}] all dock buttons on ONE row (auto-fit grid)`, shell.btnCount >= 6 && shell.rowCount === 1, JSON.stringify(shell))
  check(`[${vp.tag}] shop button visible in dock (was clipped by 5-col grid)`, shell.shopVisible)
  check(`[${vp.tag}] nav labels ≥ 10px`, shell.labels.every((f) => parseFloat(f) >= 9.5), shell.labels.join(','))
  check(`[${vp.tag}] HUD chips visible ≥28px (V101b popup chips excluded)`, shell.chipHeights.length > 0 && shell.chipHeights.every((h) => h >= 28 && h <= 34), JSON.stringify(shell.chipHeights))
  check(`[${vp.tag}] hud-terr CSS alive (display:flex — v4 hide removed)`, shell.terrDisp === 'flex', shell.terrDisp)
  /* V101b groups chips into popups (.wd101b-grp.open .wd101b-pop) — open exactly like toggle() does
     and confirm the territory chip really shows (pre-V163 it stayed display:none even in an open popup) */
  const terrShown = await page.evaluate(async () => {
    const g = document.getElementById('hud-terr') && document.getElementById('hud-terr').closest('.wd101b-grp,.wd101b-g0,[class*=wd101b-g]')
    if (g) { g.classList.add('open'); document.body.classList.add('wd101b-open'); await new Promise((r2) => setTimeout(r2, 350)) }
    const t = document.getElementById('hud-terr')
    if (!t) return { ok: false, why: 'no el' }
    const h = t.getBoundingClientRect().height
    return { ok: h > 8 && getComputedStyle(t).display !== 'none', why: 'h=' + h + ' disp=' + getComputedStyle(t).display, txt: t.textContent.slice(0, 40) }
  })
  check(`[${vp.tag}] hud-terr actually visible in its group popup`, terrShown.ok, JSON.stringify(terrShown))
  check(`[${vp.tag}] wd7-btn ≈52px and above dock`, shell.fab && shell.fab.w >= 48 && shell.fab.w <= 54 && shell.fab.bottom > shell.dockBottomClear + 50, JSON.stringify(shell.fab))
  check(`[${vp.tag}] SVG orb icons on nav buttons`, shell.svgIcons >= 5, String(shell.svgIcons))

  await page.screenshot({ path: `${shots}/v163-map-${vp.tag}.png` })

  /* open the world command panel (the big sheet) */
  await page.evaluate(() => { const b = document.getElementById('wd7-btn'); if (b) b.click() })
  await page.waitForTimeout(1600)
  const panelOpen = await page.evaluate(() => { const p = document.getElementById('wd7-panel'); return p && getComputedStyle(p).display !== 'none' })
  console.log((panelOpen ? 'INFO' : 'NOTE') + ` [${vp.tag}] world command panel open=${panelOpen} (guest gate possible — wd108-smoke covers panel flows with real seeds)`)
  await page.screenshot({ path: `${shots}/v163-wd7-${vp.tag}.png` })
  await ctx.close()
}

check('zero pageerror across both viewports', errors.length === 0, errors.join(' | '))
await br.close()
srv.close()
console.log(`\n=== v163-shell-visual: ${ok} ok, ${fail} fail ===  shots: ${shots}`)
process.exit(fail ? 1 : 0)
