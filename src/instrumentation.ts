/*
 * World Dominion — Render free-tier keep-alive (V29)
 * ---------------------------------------------------
 * Render's free plan spins the service down after ~15 minutes without inbound
 * HTTP traffic, and every cold start costs players on slow networks 30-60s.
 * Fix: the server pings its own PUBLIC url every 9 minutes. That request goes
 * through Render's router, so it counts as activity and the instance never sleeps.
 * Runs only on Render (RENDER_EXTERNAL_URL is set there automatically).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const base = process.env.RENDER_EXTERNAL_URL;
  if (!base) return;

  let pinging = false;
  const ping = async () => {
    if (pinging) return;
    pinging = true;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(base + '/api/db/server_stats', { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      console.log('[keep-alive] ping ok', res.status);
    } catch (e) {
      console.log('[keep-alive] ping failed', String(e));
    } finally {
      pinging = false;
    }
  };

  console.log('[keep-alive] enabled →', base);
  setTimeout(ping, 45 * 1000);
  const iv = setInterval(ping, 9 * 60 * 1000);
  if (typeof iv.unref === 'function') iv.unref();
}
