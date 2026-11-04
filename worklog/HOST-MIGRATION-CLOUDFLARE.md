# HOST MIGRATION — Vercel → Cloudflare Workers (OpenNext)

**Date:** 2026-11-04 · **Type:** infrastructure (NO game-file change → **no version bump**; `v.txt`/`__WD_V` untouched, clients see identical shell bytes)

## Trigger
Production `world-dominion7.vercel.app` returned **HTTP 402 `x-vercel-error: DEPLOYMENT_DISABLED`** on every path (home, `/game/v.txt`, `/api/*`).
Account-level disable on Vercel (usage/billing). Symptoms reported by owner:
1. «بازی ورود نمیخوره رو قسمت ثبت نام میکنه و وقتی ثبت نام میکنی می‌نویسه http خطای ۴۰۲» — SW-cached shell still paints; every API call hits the disabled deployment → 402.
2. Earlier: «سرور ۱۲۰ کشور انجام شد ولی سرور جدید نیومد» — root-caused + fixed as **V169** (stale `SRV_CAP_GLOBAL=120`); server-side rotation additionally could not run while the deployment was disabled.

Decision: move hosting to **Cloudflare Workers** via the official **`@opennextjs/cloudflare`** adapter (Next 16.4.5 supported), keeping the existing Postgres DB and every gameplay file byte-identical.

## What changed (additive only — Vercel/Render/self-host paths untouched)

| File | Change |
| --- | --- |
| `wrangler.jsonc` **(new)** | Worker config: `main=".open-next/worker.js"`, `assets.directory=".open-next/assets"` (binding `ASSETS`), `compatibility_flags=["nodejs_compat"]`, observability on. |
| `open-next.config.ts` **(new)** | Default `defineCloudflareConfig({})` — app has no ISR/cacheable server routes (all APIs `force-dynamic`). |
| `scripts/cf-build.mjs` **(new)** | Forces PostgreSQL schema, runs `prisma generate` + `next build` DIRECTLY (CF_BUILD=1), then `opennextjs-cloudflare build --skipNextBuild`. **Never runs `prisma db push`** (builds must not mutate prod DB). Why not let OpenNext build itself: it auto-runs npm `build`, which re-invokes `prisma-setup.mjs` (reverts schema to SQLite — Workers can never use SQLite) and `db push --accept-data-loss`. |
| `public/_headers` **(new)** | Mirrors `vercel.json` cache rules byte-for-byte (fonts immutable+CORS, `/game/:file.js` immutable, `/game/v.txt` no-store, `/cdn/*` 30d). Workers Assets supports `_headers`. |
| `src/lib/db.ts` | Additive `IS_WORKERS` branch: `@prisma/adapter-pg` over TCP (nodejs_compat), `HYPERDRIVE` binding takes priority when configured; TLS follows `sslmode` in the URL (loopback default plain TCP so dev PG works; remote default TLS). **Node/Vercel path is byte-identical to before.** Uses `OneShotPool` (fresh Client per `connect()`, closed on `release()`) — see notes below. |
| `next.config.ts` | Comment only (standalone stays — required by Render path AND the OpenNext adapter). |
| `package.json` | `cf:build` / `cf:dev` / `cf:deploy` scripts + deps `@prisma/adapter-pg`, `pg` (prod) and `@opennextjs/cloudflare`, `wrangler`, `@types/pg` (dev). `vercel-build`/`render-*` untouched. |
| `.gitignore` | `.dev.vars` (local worker secrets). |

## Verified in sandbox (workerd local dev + embedded PostgreSQL 18.6 userland)
- `cf:build` green on the V169 tree; Worker bundle saved; schema stays postgres through the whole build; zero DB writes from build.
- Static serving: `/game/v.txt` → `169` + `no-store` ✓ · `/game/social.js` → `immutable` ✓ · landing 200 ✓ · 4 `_headers` rules parsed ✓.
- API: `/api/auth/session`, `/api/rpc/*` (POST-only guard), rate-limit layer ✓.
- **Full signup e2e inside workerd**: Prisma pg-adapter read+write ×5 (user/wallet/score/session), `crypto.scryptSync` hashing, session cookie → SUCCESS. Wrong-password login correctly 400 (scrypt verify path works in workerd).
- Sandbox limitation: this environment blocks/socks outbound TCP from workerd, so *sustained* DB traffic was not repeatable locally (raw `cloudflare:sockets` connect even fails here); the one full roundtrip above plus Cloudflare's first-class TCP support covers correctness. Live verification against the real Postgres is a **post-deploy checklist item**.

## Post-deploy checklist (owner runs, assistant verifies)
1. Cloudflare dashboard → Workers & Pages → import `Imzayan/world-dominion7` (Workers Builds: build `npm run cf:build`, deploy `npx wrangler deploy`).
2. Secrets/vars on the Worker: `DATABASE_URL` (same Postgres prod URL — data untouched), optional `ADMIN_NICKS`.
3. First deploy → probe `https://<worker>.workers.dev/game/v.txt` = 169, then `/api/db/scores`, signup+login from a real device.
4. **Custom domain strongly recommended**: `*.workers.dev` / `*.pages.dev` are commonly filtered in Iran; the game must live on a domain the owner controls (Cloudflare DNS proxy). APK `MainActivity.GAME_URL` is still `world-dominion7.vercel.app` — a v1.0.16 APK with the new URL ships AFTER the domain is live.
5. Vercel (optional): once restored, add a redirect `vercel.app/* → <new-domain>/$1` so old APK/web entries self-heal to the new host.

## Cost/limits notes
- Static assets on Workers = free/unlimited; only `/api/*` dynamic invocations bill. Free plan (100k req/day) will NOT fit the game's sync/heartbeat volume (V144-PERF measured 20–40 req/min/online player); **Workers Paid ($5/mo, 10M req/mo included, ~$0.30/M over)** is the realistic plan; Hyperdrive (included in Paid) removes the per-query handshake cost of `OneShotPool`.
- `rt` hub + SSE keep their in-memory semantics (same as Vercel multi-instance behavior) — no architecture change.
