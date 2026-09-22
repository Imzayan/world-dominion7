#!/usr/bin/env node
/**
 * Picks the right Prisma schema for the environment:
 *  - DATABASE_URL starts with postgres  -> schema.postgres.prisma (Render PostgreSQL)
 *  - otherwise                          -> schema.prisma (SQLite, zero-config local dev)
 * Run before `prisma generate` / `prisma db push` (wired into the build script).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mainSchema = join(root, 'prisma', 'schema.prisma')
const pgSchema = join(root, 'prisma', 'schema.postgres.prisma')

const url = (process.env.DATABASE_URL || '').trim().toLowerCase()
const usePostgres = url.startsWith('postgres://') || url.startsWith('postgresql://')

if (usePostgres) {
  const src = readFileSync(pgSchema, 'utf8')
  writeFileSync(mainSchema, src)
  console.log('[prisma-setup] DATABASE_URL is PostgreSQL -> using schema.postgres.prisma')
} else {
  // keep the sqlite schema in sync if it was ever swapped
  const current = readFileSync(mainSchema, 'utf8')
  if (current.includes('provider = "postgresql"')) {
    const sqlite = current.replace('provider = "postgresql"', 'provider = "sqlite"')
    writeFileSync(mainSchema, sqlite)
    console.log('[prisma-setup] no DATABASE_URL -> using SQLite schema')
  } else {
    console.log('[prisma-setup] no DATABASE_URL -> SQLite schema already active')
  }
}
console.log('[prisma-setup] done')
