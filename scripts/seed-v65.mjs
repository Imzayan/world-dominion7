// V65 seed — deterministic data for the Living-World feature harness.
// Alireza score 1000 → rival = BotTwo (3000, nearest above); BotOne tops all HoF power categories.
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
const db = new PrismaClient()
function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(12).toString('hex')
  return `${salt}:${crypto.scryptSync(password, salt, 32).toString('hex')}`
}
const pw = 'wd54e2e-pass'
async function mkUser(email, nick, score, conquered, kills, economy) {
  const u = await db.user.upsert({
    where: { email },
    create: { id: crypto.randomUUID(), email, nick, nickLower: nick.toLowerCase(), passwordHash: hashPassword(pw) },
    update: {},
  })
  await db.score.upsert({
    where: { userId: u.id },
    create: { userId: u.id, nick, server: 1, score, conquered, kills, economy, recruits: Math.round(score / 100) },
    update: { nick, server: 1, score, conquered, kills, economy, recruits: Math.round(score / 100) },
  })
  await db.wallet.upsert({ where: { userId: u.id }, create: { userId: u.id, gems: 100 }, update: { gems: 100 } })
  return u
}
const alireza = await mkUser('alireza@wd.test', 'Alireza', 1000, 1, 5, 2000)
const bot = await mkUser('bot@wd.test', 'BotOne', 5000, 5, 30, 9000)
const bot2 = await mkUser('bot2@wd.test', 'BotTwo', 3000, 2, 10, 4000)
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
/* clean slate for titles so the harness sees deterministic holders */
await db.hofTitle.deleteMany({})
console.log('V65 seed OK — rival(Alireza)=BotTwo, HoF power titles=BotOne')
