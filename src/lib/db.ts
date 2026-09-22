import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/*
 * DATABASE_URL resolution:
 *  - Render + PostgreSQL : set DATABASE_URL env var (Internal Database URL) -> provider auto-switched at build
 *  - everything else     : SQLite at <cwd>/db/custom.db (created on demand, zero config)
 */
if (!process.env.DATABASE_URL) {
  const dbDir = join(process.cwd(), 'db')
  if (!existsSync(dbDir)) {
    try { mkdirSync(dbDir, { recursive: true }) } catch {}
  }
  process.env.DATABASE_URL = 'file:' + join(dbDir, 'custom.db')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
