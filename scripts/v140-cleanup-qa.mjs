process.env.DATABASE_URL='file:/home/z/my-project/db/custom.db';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();
const u = await db.user.findUnique({ where: { nickLower: 'v140qa' } });
if (u) {
  await db.territory.deleteMany({ where: { userId: u.id } });
  await db.worldNews.deleteMany({ where: { actorNick: 'V140QA' } });
  await db.save.deleteMany({ where: { userId: u.id } });
  await db.score.deleteMany({ where: { userId: u.id } });
  await db.starterOffer.deleteMany({ where: { userId: u.id } });
  await db.wallet.deleteMany({ where: { userId: u.id } });
  await db.serverStat.deleteMany({ where: { server: 2 } }).catch(() => {});
  await db.user.delete({ where: { id: u.id } });
  console.log('cleaned V140QA');
} else console.log('no QA user found');
await db.$disconnect();
