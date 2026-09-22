// One-off: reset the local admin account so E2E can register it fresh
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const u = await db.user.findUnique({ where: { nickLower: 'alireza' } });
  if (!u) { console.log('no alireza user'); return; }
  await db.user.delete({ where: { nickLower: 'alireza' } });
  console.log('deleted alireza user + cascaded data');
})().catch(e => { console.error(e.message); process.exit(1); }).finally(() => db.$disconnect());
