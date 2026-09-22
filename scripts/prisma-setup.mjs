/* World Dominion — Prisma schema switcher
   Picks SQLite (local dev) or PostgreSQL (Render) based on DATABASE_URL.
   Both full schemas live in prisma/schema.prisma (sqlite) and
   prisma/schema.postgres.prisma (postgres) — models are identical. */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const mainSchema = path.join(root, 'prisma', 'schema.prisma');
const pgSchema = path.join(root, 'prisma', 'schema.postgres.prisma');

const url = process.env.DATABASE_URL || '';
const isPostgres = /^postgres(ql)?:/i.test(url);

if (isPostgres) {
  const src = fs.readFileSync(pgSchema, 'utf8');
  fs.writeFileSync(mainSchema, src);
  console.log('[prisma-setup] PostgreSQL schema activated from DATABASE_URL');
} else {
  // restore the committed SQLite schema if a previous build overwrote it
  const cur = fs.readFileSync(mainSchema, 'utf8');
  if (/provider\s*=\s*"postgresql"/.test(cur)) {
    const sqliteDs = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;
    const fixed = cur.replace(/datasource db \{[\s\S]*?\}/, sqliteDs);
    fs.writeFileSync(mainSchema, fixed);
    console.log('[prisma-setup] Reverted postgres datasource to SQLite');
  } else {
    console.log('[prisma-setup] SQLite schema active (no DATABASE_URL or non-postgres)');
  }
}
