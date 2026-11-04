import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

/*
 * DATABASE_URL resolution:
 *  - Cloudflare Workers  : DATABASE_URL (Postgres) via @prisma/adapter-pg over TCP
 *                          (nodejs_compat). If a HYPERDRIVE binding is configured on
 *                          the Worker, its pooled connectionString takes priority.
 *                          Workers has no filesystem → the SQLite fallback must not run.
 *  - Render + PostgreSQL : set DATABASE_URL env var (Internal Database URL) -> provider auto-switched at build
 *  - everything else     : SQLite at <cwd>/db/custom.db (created on demand, zero config)
 */
const IS_WORKERS =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers'

/* One-shot pool for Cloudflare Workers
   ------------------------------------
   workerd TCP sockets do not survive pg's idle-connection reuse: after a
   WRITE on a pooled connection, the next query on that socket can hang
   forever (observed in wrangler dev: request cancelled with
   "code had hung"). This subclass hands out a BRAND-NEW Client on every
   connect() and closes it on release() — correct-by-construction, at the
   cost of a TCP/TLS handshake per query. Configure a HYPERDRIVE binding
   (Workers paid) for global pooling + caching without this overhead:
   Hyperdrive is a connection-pooling proxy, so its socket semantics are
   safe for reuse and this shim is bypassed automatically. */
class OneShotPool extends pg.Pool {
  async connect(): Promise<pg.PoolClient> {
    const cfg = (this as unknown as { options: pg.PoolConfig }).options
    const c = new pg.Client(cfg)
    await c.connect()
    let done = false
    const finish = () => {
      if (done) return
      done = true
      try { void c.end() } catch {}
    }
    const pc = {
      query: c.query.bind(c),
      release: () => finish(),
      end: () => finish(),
      on: c.on.bind(c),
      off: c.off.bind(c),
      removeListener: c.removeListener.bind(c),
    } as unknown as pg.PoolClient
    return pc
  }
}

if (!IS_WORKERS && !process.env.DATABASE_URL) {
  const dbDir = join(process.cwd(), 'db')
  if (!existsSync(dbDir)) {
    try { mkdirSync(dbDir, { recursive: true }) } catch {}
  }
  process.env.DATABASE_URL = 'file:' + join(dbDir, 'custom.db')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildClient(): PrismaClient {
  if (IS_WORKERS && (process.env.DATABASE_URL || '').startsWith('postgres')) {
    /* Workers path — Postgres only. max:5 per isolate keeps connection count sane;
       Hyperdrive (paid plan, optional) provides global pooling/caching on top. */
    const hd = (globalThis as { HYPERDRIVE?: { connectionString?: string } }).HYPERDRIVE
    const connectionString =
      hd?.connectionString || process.env.DATABASE_URL || ''
    /* TLS follows sslmode in the URL: require|prefer → TLS, no-verify → TLS without CA
       check, disable → plain TCP. Local/loopback hosts default to plain TCP so a dev
       Postgres without SSL works; remote providers default to TLS
       (rejectUnauthorized:false — Supabase/Neon/Render poolers ship their own CA chain). */
    const isLocal = /@(?:localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString)
    const sslmode = /[?&]sslmode=([\w-]+)/.exec(connectionString)?.[1] || ''
    const useSsl =
      sslmode === 'require' || sslmode === 'prefer' || sslmode === 'no-verify' ||
      (!sslmode && !isLocal)
    const pool = new OneShotPool({
      connectionString,
      max: 5,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    })
    return new PrismaClient({ adapter: new PrismaPg(pool), log: ['error'] })
  }
  return new PrismaClient({
    log: ['error'],
  })
}

export const db = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
