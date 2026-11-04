/* World Dominion — Cloudflare Workers build script (OpenNext)
   ---------------------------------------------------------
   Differences from the Vercel/Render build on purpose:
     1. Forces the PostgreSQL Prisma schema — Workers has no filesystem,
        SQLite can never run there, and Workers Builds may run without
        DATABASE_URL at build time (prisma-setup.mjs would pick SQLite).
     2. NEVER runs `prisma db push` — production DB is not mutated by builds.
     3. Runs `next build` DIRECTLY with CF_BUILD=1 and then calls
        `opennextjs-cloudflare build --skipNextBuild`.
        Why not let OpenNext run the build itself? It auto-runs the project's
        npm `build` script, which re-invokes prisma-setup.mjs (reverts the
        schema to SQLite) and `prisma db push --accept-data-loss` — both
        wrong for a Workers build.
     4. Sets CF_BUILD=1 so next.config drops `output:"standalone"`
        (OpenNext produces its own worker bundle; the standalone path of
        `npm run build` for Render/self-host stays untouched). */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pgSchema = path.join(root, 'prisma', 'schema.postgres.prisma');
const mainSchema = path.join(root, 'prisma', 'schema.prisma');

/* 1) postgres schema — same model set, exactly what prisma-setup.mjs does when DATABASE_URL is postgres */
fs.writeFileSync(mainSchema, fs.readFileSync(pgSchema, 'utf8'));
console.log('[cf-build] PostgreSQL schema activated');

/* 2) next build (own env) + opennext bundling — env passed explicitly to every child */
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://cfbuild:cfbuild@localhost:5432/cfbuild',
  CF_BUILD: '1',
};

const steps = [
  ['npx', ['prisma', 'generate']],
  ['npx', ['next', 'build']],
  ['npx', ['opennextjs-cloudflare', 'build', '--skipNextBuild']],
];

for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: true });
  if (r.status !== 0) {
    console.error(`[cf-build] step failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}
console.log('[cf-build] OK → .open-next/ (deploy with: npm run cf:deploy)');
