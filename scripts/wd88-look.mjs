// V88 evidence screenshots: shop war tab + vault + battle plan doctrines + map theme
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const BASE = process.env.WD_BASE || 'http://localhost:3100'
const db = new PrismaClient()
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Mobile Safari/537.36', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
const page = await ctx.newPage()
await page.goto(BASE + '/game/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
const NICK = 'q88shot' + Math.random().toString(36).slice(2, 6)
await page.evaluate(async (nk) => {
  const n = document.getElementById('nick'), p = document.getElementById('pw')
  if (n && p) { n.value = nk; p.value = 'dgtess1234'; document.getElementById('pw2').value = 'dgtess1234'
    const btn = [...document.querySelectorAll('button')].find(b => /ثبت‌نام و شروع/.test(b.textContent || ''))
    if (btn) { btn.click(); await new Promise(r => setTimeout(r, 5000)) } }
}, NICK)
await page.waitForTimeout(7000)
const u = await db.user.findUnique({ where: { nickLower: NICK } })
await db.wallet.upsert({ where: { userId: u.id }, update: { gems: 3000 }, create: { userId: u.id, gems: 3000 } })
await page.waitForTimeout(1500)
await page.evaluate(() => { try { renderShop(); openModal('m-shop') } catch (e) {} })
await page.waitForTimeout(2500)
await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /جنگ/.test(x.textContent)); b && b.click() })
await page.waitForTimeout(1200)
await page.screenshot({ path: 'download/v88-shop-war.png' })
await page.evaluate(() => { const b = [...document.querySelectorAll('.wd66-chip')].find(x => /خزانه/.test(x.textContent)); b && b.click() })
await page.waitForTimeout(1200)
await page.screenshot({ path: 'download/v88-shop-vault.png' })
await page.evaluate(() => { try { document.querySelector('#m-shop .x, #m-shop [data-close], .modal.active .x') } catch (e) {} })
await page.evaluate(() => { try { const m = document.getElementById('m-shop'); m && m.classList.remove('active') } catch (e) {} })
/* battle plan with doctrines */
try { await page.evaluate(() => { const b = document.querySelector('[data-w65="empire"]') || [...document.querySelectorAll('button')].find(x => /امپراتوری/.test(x.textContent || '')); b && b.click() }); await page.waitForTimeout(1200) } catch (e) {}
try { await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /برنامه‌ی نبرد/.test(x.textContent || '')); b && b.click() }); await page.waitForTimeout(2000) } catch (e) {}
const hasPlan = await page.evaluate(() => !!document.querySelector('.wd88-atkgrid'))
if (hasPlan) { const sh = await page.$('#wd65-sheet'); if (sh) await sh.screenshot({ path: 'download/v88-war-plan.png' }) }
console.log('plan-injected:', hasPlan)
/* map theme live */
await page.evaluate(() => { try { document.body.classList.add('wd88-shot'); map.getContainer().classList.add('wd66-map_global_night') } catch (e) {} })
await page.waitForTimeout(1500)
await page.screenshot({ path: 'download/v88-map-night.png' })
await db.$disconnect(); await browser.close()
console.log('shots done')
