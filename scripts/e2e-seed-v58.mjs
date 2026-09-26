// V58 E2E seed — Alireza (admin) + BotOne + BotTwo, fresh olympic edition with real entries
// Goal: the user's exact journey:
//   live games → اختتامیه → round REALLY ends + FULL podium prizes (gold/silver/bronze/participants)
//   افتتاحیه from 'after' → a REAL new round starts (edition bumps, fresh table, live phase)
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const db = new PrismaClient()
const ANCHOR = Date.UTC(2026, 0, 1)
const ED_LEN = 30 * 86400000
const edition = Math.floor((Date.now() - ANCHOR) / ED_LEN) + 1

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(12).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}
const password = () => 'wd54e2e-pass'

/* V68: ایمیل باید همان pseudo-email کلاینت باشد — لاگین واقعی بازی با
   sha256('wd:'+nick)@players.worlddominion.app انجام می‌شود (index.html pseudoEmail).
   ایمیل plain (مثل bot@wd.test) فقط برای upsert قدیمی بود و لاگین را می‌شکست */
async function pseudoEmail(nick) {
  const b = crypto.createHash('sha256').update('wd:' + nick.trim().toLowerCase()).digest()
  return b.slice(0, 16).toString('hex') + '@players.worlddominion.app'
}

async function mkUser(email, nick, gems) {
  /* V68: seed idempotent — کاربر قدیمی با ایمیل دیگری ولی همان nick باعث P2002 می‌شد؛
     اول با pseudo-email (همان که کلاینت لاگین می‌زند) پیدا کن، بعد با nickLower، بعد بساز.
     پسورد همیشه ریست می‌شود تا لاگین تست قطعی باشد */
  const pseudo = await pseudoEmail(nick)
  const found = (await db.user.findUnique({ where: { email: pseudo } })) || (await db.user.findFirst({ where: { nickLower: nick.toLowerCase() } }))
  const data = { email: pseudo, nick, nickLower: nick.toLowerCase(), passwordHash: hashPassword(password()), isAdmin: nick.toLowerCase() === 'alireza' }
  const u = found
    ? await db.user.update({ where: { id: found.id }, data })
    : await db.user.create({ data: { id: crypto.randomUUID(), ...data } })
  await db.wallet.upsert({ where: { userId: u.id }, create: { userId: u.id, gems }, update: { gems } })
  await db.score.upsert({ where: { userId: u.id }, create: { userId: u.id, nick, server: 1 }, update: { nick, server: 1 } })
  return u
}

const alireza = await mkUser('alireza@wd.test', 'Alireza', 100)
const bot = await mkUser('bot@wd.test', 'BotOne', 50)
const bot2 = await mkUser('bot2@wd.test', 'BotTwo', 25)

/* territories: BotOne owns Brazil (capital) + Mongolia + China (for front-line/gray tests) */
const terr = [
  ['France', alireza, true], ['Germany', alireza, false],
  ['Brazil', bot, true], ['Mongolia', bot, false], ['China', bot, false],
  ['Japan', bot2, true],
]
for (const [c, u, cap] of terr) {
  await db.territory.upsert({
    where: { server_country: { server: 1, country: c } },
    create: { server: 1, country: c, userId: u.id, nick: u.nick, isCapital: cap },
    update: { userId: u.id, nick: u.nick, isCapital: cap },
  })
}

/* fresh olympic slate + REAL new-round counter reset */
await db.gameSetting.deleteMany({ where: { key: { in: ['oly_shift', 'oly_edoff'] } } })
await db.olympicEntry.deleteMany({ where: { edition } })
await db.olympicResult.deleteMany({ where: { edition } })
await db.olympicArchive.deleteMany({ where: { edition } })
await db.olympicChampion.deleteMany({ where: { cycle: edition } })

/* podium: Alireza 2 golds (champ) > BotOne gold+silver-tier lead (1g) > BotTwo silver-medal only (1s)
   → deterministic podium: silver=BotOne(+2💎), bronze=BotTwo(+1💎) */
await db.olympicEntry.create({ data: { edition, userId: alireza.id, nick: alireza.nick, country: 'France', countryFa: 'فرانسه', discipline: 'sprint', best: 900, attempts: 3, lastAt: new Date() } })
await db.olympicEntry.create({ data: { edition, userId: alireza.id, nick: alireza.nick, country: 'France', countryFa: 'فرانسه', discipline: 'archery', best: 800, attempts: 2, lastAt: new Date() } })
await db.olympicEntry.create({ data: { edition, userId: bot.id, nick: bot.nick, country: 'Brazil', countryFa: 'برزیل', discipline: 'swim', best: 700, attempts: 2, lastAt: new Date() } })
await db.olympicEntry.create({ data: { edition, userId: bot2.id, nick: bot2.nick, country: 'Japan', countryFa: 'ژاپن', discipline: 'swim', best: 500, attempts: 1, lastAt: new Date() } })

/* attacker power for the pvp score-bump test: Alireza dominates */
await db.score.update({ where: { userId: alireza.id }, data: { score: 50000, conquered: 20 } })
await db.score.update({ where: { userId: bot.id }, data: { score: 3000, conquered: 3 } })

console.log('seeded edition', edition, '| Alireza(admin,100💎) BotOne(50💎) BotTwo(25💎) | 4 entries | territories ready')
await db.$disconnect()
