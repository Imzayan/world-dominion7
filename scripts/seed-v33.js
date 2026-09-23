/* V33 seed: give the freshly-registered test user a capital (Niger), a score row and a
   synthetic save so olympic_register/olympic_submit/closeGamesEdition rewards work E2E. */
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
const nick = process.argv[2] || 'v33test'
;(async () => {
  const u = await p.user.findFirst({ where: { nickLower: nick.toLowerCase() } })
  if (!u) { console.log('NO_USER'); process.exit(1) }
  await p.territory.upsert({
    where: { server_country: { server: 1, country: 'Niger' } },
    create: { server: 1, country: 'Niger', userId: u.id, nick, isCapital: true },
    update: { userId: u.id, nick, isCapital: true },
  })
  await p.score.upsert({
    where: { userId: u.id },
    create: { userId: u.id, nick, server: 1, score: 1500, conquered: 2 },
    update: { nick, server: 1, score: 1500, conquered: 2 },
  })
  const state = { res: { gold: 6000, oil: 2500, food: 4000, steel: 1000 }, units: {}, infra: {} }
  /* IMPORTANT: never INSERT the save row here — the client owns creation (an existing row
     makes its insert hit 23505 → conflict → ACC.ready=false → capital save lost). Update only. */
  const ex = await p.save.findUnique({ where: { userId: u.id } })
  if (ex) await p.save.update({ where: { userId: u.id }, data: { nick, state: JSON.stringify(state) } })
  console.log('SEEDED', nick, u.id, ex ? 'save-updated' : 'save-untouched')
  await p.$disconnect()
})().catch(e => { console.log('ERR', e.message); process.exit(1) })
