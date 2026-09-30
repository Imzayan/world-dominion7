/* WD95 — SOCIAL & PLAYER IDENTITY V1 QA: دو کاربر واقعی، جریان کامل اجتماعی + رگرسیون سبک */
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const mk = async (nick) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/124.0 Mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('http://localhost:3000/game/index.html', { waitUntil: 'domcontentloaded', timeout: 90000 })
  try { await page.waitForSelector('#nick', { timeout: 40000 }) } catch (e) {}
  await page.waitForTimeout(1200)
  await page.evaluate((n) => {
    document.getElementById('nick').value = n
    document.getElementById('pw').value = 'wdtest1234'
    document.getElementById('pw2').value = 'wdtest1234'
    const b = [...document.querySelectorAll('button')].find((b) => /ثبت‌نام و شروع/.test(b.textContent || ''))
    b.click()
  }, nick)
  for (let i = 0; i < 30; i++) {
    const s = await page.evaluate(async () => { try { const x = await sb.auth.getSession(); return !!(x && x.data && x.data.session) } catch (e) { return false } })
    if (s) break
    await page.waitForTimeout(1000)
  }
  await page.waitForTimeout(2500)
  return { ctx, page, nick, errors }
}
let pass = 0, fail = 0
const check = (n, ok, info = '') => { if (ok) { pass++; console.log('PASS ' + n + (info ? ' — ' + info : '')) } else { fail++; console.log('FAIL ' + n + (info ? ' — ' + info : '')) } }
const stamp = Date.now().toString(36).slice(-6)
const A = await mk('wd95a' + stamp)
const B = await mk('wd95b' + stamp)

/* T1/T2 — ورود و بوت اجتماعی */
for (const [tag, u] of [['A', A], ['B', B]]) {
  const r = await u.page.evaluate(async () => {
    try {
      const un = await sb.rpc('social_unread'); const ss = await sb.rpc('srv_status')
      return { auth: !!(un && un.data !== null && !un.error), srv: !!(ss && ss.data && ss.data.ok && Array.isArray(ss.data.servers) && ss.data.servers.length) }
    } catch (e) { return { auth: false, srv: false, e: String(e) } }
  })
  check('T' + (tag === 'A' ? 1 : 2) + ':social-unread/srv-status authed ' + tag, r.auth && r.srv, JSON.stringify(r).slice(0, 90))
}

/* T3 — وضعیت سرورها: فیلدهای واقعی */
const srv = await A.page.evaluate(async () => { const r = await sb.rpc('srv_status'); return r.data }).catch(() => null)
const s2 = srv && srv.servers ? (srv.servers).find((s) => s.server === 2) : null
check('T3:srv_status fields', !!s2 && typeof s2.online === 'number' && typeof s2.world_day === 'number' && !!(srv.season && srv.season.fa), JSON.stringify(srv && srv.servers ? srv.servers.map((s) => s.server + ':' + s.status + ':' + s.online) : ['no-data']).slice(0, 110))

/* T4 — presence واقعی: هر دو آنلاین در srv_status */
const on2 = await B.page.evaluate(async () => { const r = await sb.rpc('srv_status'); const s = (r.data.servers || []).find((x) => x.server === 2); return s ? s.online : -1 })
check('T4:presence online>=2 on server2', on2 >= 2, 'online=' + on2)

/* T5 — چت جهانی: ارسال A، دیدن B با نشانگر آنلاین */
const sentChat = await A.page.evaluate(async (n) => { const r = await sb.from('world_chat').insert({ server: 2, user_id: ACC.uid, nick: ACC.nick, message: 'سلام از ' + n }).select().single(); return { ok: !r.error, id: r.data && r.data.id } }, A.nick)
check('T5a:world chat send', !!sentChat.ok)
const seen = await B.page.evaluate(async (id) => { const r = await sb.rpc('get_world_chat', { p_server: 2, p_limit: 50 }); const row = (r.data || []).find((x) => x.id === id || x.message.indexOf('سلام از') === 0); return row ? { found: true, online: row.online === true, state: row.state } : { found: false } }, sentChat.id)
check('T5b:chat cross-user visible + online flag', seen.found && seen.online === true, JSON.stringify(seen))

/* T6 — پروفایل با nick + بدون نشت ایمیل/آیدی */
const prof = await A.page.evaluate(async (n) => { const r = await sb.rpc('profile_get', { p_nick: n }); return r.data }, B.nick).catch(() => null)
const profStr = prof ? JSON.stringify(prof) : ''
check('T6:profile_get by nick', !!(prof && prof.ok && prof.p.nick === B.nick && prof.p.ranks && prof.p.ranks.military >= 1), 'lvl=' + (prof && prof.p ? prof.p.level : 'null'))
check('T6b:privacy — no email leak + uid handle', profStr.length && profStr.indexOf('"email"') < 0 && profStr.indexOf('supabase') < 0 && !!prof.p.uid, 'uid_handle=' + (prof.p.uid ? 'internal-only' : 'MISSING'))

const uidA = await A.page.evaluate(async () => { const r = await sb.rpc('profile_get'); return r.data.p.uid })

/* T7 — دوستی: درخواست → بج → تأیید */
const fa = await A.page.evaluate(async (u) => { const r = await sb.rpc('friend_add', { p_uid: u.uid }); return r.data }, { uid: prof.p.uid })
check('T7a:friend_add pending', !!(fa && fa.ok && fa.status === 'pending'), JSON.stringify(fa))
const bBadge = await B.page.evaluate(async () => { const r = await sb.rpc('social_unread'); return r.data.freq })
check('T7b:friend request badge', bBadge >= 1, 'freq=' + bBadge)
const acc = await B.page.evaluate(async (u) => { const r = await sb.rpc('friend_reply', { p_uid: u.uid, p_accept: true }); return r.data }, { uid: (await A.page.evaluate(async () => { const r = await sb.rpc('profile_get'); return r.data.p.uid })) })
check('T7c:friend accept', !!(acc && acc.ok && acc.status === 'accepted'), JSON.stringify(acc))
const fl = await A.page.evaluate(async () => { const r = await sb.rpc('friend_list'); const f = (r.data.friends || []).find((x) => x.status === 'accepted'); return f ? { ok: true, state: f.state } : { ok: false } })
check('T7d:friend_list accepted + presence', fl.ok && fl.state === 'online', JSON.stringify(fl))

/* T8 — DM: ارسال، خواندن، رسید دیده‌شد */
const dmA = await A.page.evaluate(async (u) => { const r = await sb.rpc('dm_send', { p_to_uid: u.uid, p_body: 'سلام! حمله نداری در راهه؟' }); return r.data }, { uid: prof.p.uid })
check('T8a:dm_send ok', !!(dmA && dmA.ok), JSON.stringify(dmA))
const thB = await B.page.evaluate(async () => { const r = await sb.rpc('dm_threads'); const t = (r.data.threads || [])[0]; return t ? { ok: true, unread: t.unread, nick: t.nick } : { ok: false } })
check('T8b:dm_threads unread=1', thB.ok && thB.unread === 1, JSON.stringify(thB))
const readB = await B.page.evaluate(async (u) => { const r = await sb.rpc('dm_thread', { p_uid: u.uid }); return r.data }, { uid: uidA })
check('T8c:dm_thread marks read', !!(readB && readB.ok && readB.msgs.length >= 1), 'msgs=' + (readB.msgs || []).length)
const rcptA = await A.page.evaluate(async (u) => { const r = await sb.rpc('dm_thread', { p_uid: u.uid }); const m = (r.data.msgs || []).filter((x) => x.mine); return m.length ? m[m.length - 1].read === true : false }, { uid: prof.p.uid })
check('T8d:read receipt on sender side', rcptA === true)

/* T9 — دستاورد واقعی: اولین پیام + اولین دوست (server-granted) */
const achA = await A.page.evaluate(async () => { const r = await sb.rpc('profile_get'); const k = (r.data.p.achievements || []).map((a) => a.key); return { dm: k.indexOf('soc_first_dm') >= 0, fr: k.indexOf('soc_first_friend') >= 0, keys: k.length } })
check('T9:achievements granted on real events', achA.dm && achA.fr, 'keys=' + achA.keys)
const achB = await B.page.evaluate(async () => { const r = await sb.rpc('profile_get'); const k = (r.data.p.achievements || []).map((a) => a.key); return k.indexOf('soc_first_friend') >= 0 })
check('T9b:friend ach on accepter too', achB === true)

/* T10 — Title: فقط از بین earnedها */
const tBad = await A.page.evaluate(async () => { const r = await sb.rpc('title_set', { p_title: 'general' }); return r.data })
const tGood = await A.page.evaluate(async () => { const r = await sb.rpc('title_set', { p_title: 'recruit' }); return r.data })
check('T10:title server-validated', !!(tBad && tBad.ok === false && tBad.error === 'not_earned') && !!(tGood && tGood.ok), JSON.stringify({ bad: tBad, good: tGood && tGood.ok }))

/* T11 — نوتیفیکیشن‌ها: منابع واقعی + خواندن */
const nf = await B.page.evaluate(async () => { const r = await sb.rpc('notif_list'); const it = r.data.items || []; const kinds = [...new Set(it.map((x) => x.kind))]; return { n: it.length, kinds } })
check('T11a:notifications real sources', nf.n >= 2 && nf.kinds.length >= 2, JSON.stringify(nf).slice(0, 80))
const nread = await B.page.evaluate(async () => { await sb.rpc('notif_read', { p_id: 'all' }); const r = await sb.rpc('social_unread'); return r.data.notif })
check('T11b:mark all read → notif=0', nread === 0, 'notif=' + nread)

/* T12 — بلاک: enforcement سمت سرور */
const blk = await B.page.evaluate(async (u) => { const r = await sb.rpc('block_set', { p_uid: u.uid, p_on: true }); return r.data }, { uid: uidA })
check('T12a:block_set ok', !!(blk && blk.ok && blk.blocked === true))
const dmBlocked = await A.page.evaluate(async (u) => { const r = await sb.rpc('dm_send', { p_to_uid: u.uid, p_body: 'تست بلاک' }); return r.data }, { uid: prof.p.uid })
check('T12b:dm_send rejected (blocked)', !!(dmBlocked && dmBlocked.ok === false && dmBlocked.error === 'blocked'), JSON.stringify(dmBlocked))
const frBlocked = await A.page.evaluate(async (u) => { const r = await sb.rpc('friend_add', { p_uid: u.uid }); return r.data }, { uid: prof.p.uid })
check('T12c:friend_add rejected (blocked)', frBlocked && frBlocked.ok === false && frBlocked.error === 'blocked')
const chatFiltered = await A.page.evaluate(async () => { const r = await sb.rpc('get_world_chat', { p_server: 2, p_limit: 100 }); const mine = (r.data || []).some((x) => x.message.indexOf('جواب') === 0); return r.data })
/* B یک پیام بعد از بلاک بفرستد تا فیلتر تست شود */
await B.page.evaluate(async (n) => { await sb.from('world_chat').insert({ server: 2, user_id: ACC.uid, nick: ACC.nick, message: 'پیام ' + n + ' بعد از بلاک' }).select().single() }, B.nick)
const filtered = await A.page.evaluate(async (n) => { const r = await sb.rpc('get_world_chat', { p_server: 2, p_limit: 100 }); return !(r.data || []).some((x) => x.nick === n) }, B.nick)
check('T12d:world chat hides blocked user (server-side)', filtered === true)
const unf = await B.page.evaluate(async (u) => { const r = await sb.rpc('block_set', { p_uid: u.uid, p_on: false }); return r.data }, { uid: uidA })
check('T12e:unblock', unf.ok === true)

/* T13 — جداسازی cross-server: سرور غیرواقعی خالی */
const iso = await A.page.evaluate(async () => { const r = await sb.rpc('get_world_chat', { p_server: 999, p_limit: 100 }); return (r.data || []).length })
check('T13:cross-server isolation (server 999 empty)', iso === 0, 'rows=' + iso)

/* T14 — UI: چیپ‌های HUD، مودال سرور، مودال پروفایل، مودال پیام */
const chips = await A.page.evaluate(() => ({ msg: !!document.getElementById('hud-soc-msg'), bell: !!document.getElementById('hud-soc-bell'), dup: document.querySelectorAll('#hud-soc-msg').length }))
check('T14a:hud chips present (no dup)', chips.msg && chips.bell && chips.dup === 1, JSON.stringify(chips))
await A.page.evaluate(() => window.WDS.servers())
await A.page.waitForTimeout(1200)
const srvM = await A.page.evaluate(() => { const m = document.getElementById('wd-servers'); const cards = m.querySelectorAll('.wds-scard').length; const txt = m.textContent || ''; return { active: m.classList.contains('active'), cards, hasOnline: txt.indexOf('آنلاین') >= 0, hasSeason: txt.indexOf('فصل') >= 0 } })
check('T14b:server selector UI', srvM.active && srvM.cards >= 2 && srvM.hasOnline && srvM.hasSeason, JSON.stringify(srvM))
await A.page.evaluate((nk) => window.WDS.profile(nk, true), 'wd95b' + stamp)
await A.page.waitForTimeout(1500)
const profM = await A.page.evaluate((nk) => { const m = document.getElementById('wd-profile'); const t = m.textContent || ''; return { active: m.classList.contains('active'), nick: t.indexOf(nk) >= 0, stats: m.querySelectorAll('.wds-stat').length >= 4, btns: t.indexOf('پیام') >= 0 && t.indexOf('دوست') >= 0 } }, 'wd95b' + stamp)
check('T14c:profile UI from nick', profM.active && profM.stats && profM.btns, JSON.stringify(profM))
await A.page.evaluate(() => window.WDS.msgs())
await A.page.waitForTimeout(1200)
const msgM = await A.page.evaluate(() => { const m = document.getElementById('wd-msgs'); return { active: m.classList.contains('active'), rows: m.querySelectorAll('[data-uid]').length } })
check('T14d:messages list UI (thread exists)', msgM.active && msgM.rows >= 1, JSON.stringify(msgM))
await A.page.evaluate(() => window.WDS.notifs())
await A.page.waitForTimeout(1000)
const notM = await A.page.evaluate(() => { const m = document.getElementById('wd-notifs'); return { active: m.classList.contains('active'), rows: m.querySelectorAll('[data-nid]').length } })
check('T14e:notifications UI', notM.active && notM.rows >= 1, JSON.stringify(notM))

/* T15 — رگرسیون سبک: get_wallet و wd_get_state سالم */
const reg = await A.page.evaluate(async () => { try { const w = await sb.rpc('get_wallet', { p_server: 2 }); const s = await sb.rpc('wd_get_state'); return { wallet: !!(w.data && w.data.ok), state: !!(s.data && s.data.player) } } catch (e) { return { wallet: false, state: false } } })
check('T15:regression get_wallet/wd_get_state', reg.wallet && reg.state, JSON.stringify(reg))

/* T16 — pageerror صفر در هر دو نشست */
check('T16:zero pageerror A', A.errors.length === 0, A.errors.slice(0, 2).join('|'))
check('T17:zero pageerror B', B.errors.length === 0, B.errors.slice(0, 2).join('|'))

console.log('---')
console.log('RESULT ' + pass + '/' + (pass + fail))
await browser.close()
process.exit(fail ? 1 : 0)
