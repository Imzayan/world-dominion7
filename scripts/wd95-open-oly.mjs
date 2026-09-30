/* WD95 — باز کردن پنجره‌ی رسمی المپیک برای تست‌های زمان‌گیت‌شده (admin shift واقعی، فقط دیتابیس محلی) */
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/124.0 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.goto('http://localhost:3000/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 })
try { await page.waitForSelector('#nick', { timeout: 30000 }) } catch (e) {}
await page.waitForTimeout(1000)
const nick = 'wd95adm' + Date.now().toString(36).slice(-5)
const made = await page.evaluate(async (n) => {
  document.getElementById('nick').value = n
  document.getElementById('pw').value = 'wdtest1234'
  document.getElementById('pw2').value = 'wdtest1234'
  const b = [...document.querySelectorAll('button')].find((b) => /ثبت‌نام و شروع/.test(b.textContent || ''))
  b.click()
  for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 800)); try { const x = await sb.auth.getSession(); if (x && x.data && x.data.session) return true } catch (e) {} }
  return false
}, nick)
console.log('signup:', made)
const u = await db.user.findUnique({ where: { nickLower: nick.toLowerCase() } })
await db.user.update({ where: { id: u.id }, data: { isAdmin: true } })
console.log('admin granted (local db):', u.id)
const out = await page.evaluate(async () => {
  const r = await sb.rpc('oly_admin_shift', { p_mode: 'open' })
  return JSON.stringify(r).slice(0, 160)
})
console.log('oly_admin_shift open →', out)
await db.$disconnect()
await browser.close()
