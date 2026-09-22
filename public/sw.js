/* World Dominion — service worker v5: "stable on any connection" strategy
   - vendor libs + borders + flags: cache-first (same-origin, VPN-independent)
   - game HTML: fresh-first with 3s patience → cached copy instantly on slow
     networks while the fresh copy keeps downloading in the background
   - API/SSE traffic is never intercepted */
const CACHE = 'wd-v5';
const IMMUTABLE = [
  '/cdn/leaflet/leaflet.min.js',
  '/cdn/leaflet/leaflet.min.css',
  '/cdn/geo/countries.geo.json',
  '/cdn/npm/@supabase/supabase-js@2/dist/umd/supabase.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(IMMUTABLE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== location.origin) return;      // cross-origin: plain network, no interception
  if (url.pathname.startsWith('/api/')) return;    // API + realtime SSE: never cached

  // 1) immutable vendor + self-hosted flags → cache-first
  if (IMMUTABLE.indexOf(url.pathname) !== -1 || url.pathname.indexOf('/cdn/flags/') === 0) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  // 2) game HTML (any entry URL) → smart strategy
  if (url.pathname === '/' || url.pathname === '/game' || url.pathname === '/game/' || url.pathname === '/game/index.html') {
    e.respondWith(htmlStrategy(req));
    return;
  }

  // 3) other same-origin assets → network-first with cache fallback
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && url.pathname.indexOf('/cdn/') === 0) {
        const cp = res.clone();
        caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});

async function htmlStrategy(req) {
  const cache = await caches.open(CACHE);
  const target = '/game/index.html';
  const cached = await cache.match(target);
  let netSettled = false;
  const net = fetch(req).then((res) => {
    netSettled = true;
    if (res && res.ok) {
      const cp = res.clone();
      cache.put(target, cp).catch(() => {});
    }
    return res;
  }).catch(() => null);

  const slow = new Promise((r) => setTimeout(() => r('slow'), 3000));
  const winner = await Promise.race([net.then((r) => (r ? r : 'fail')), slow]);

  if (winner !== 'slow') {
    const res = winner === 'fail' ? null : winner;
    if (res) return res;
    if (cached) return cached;
    return Response.error();
  }
  // network still running after 3s → instant cached load; fresh copy lands for next visit
  if (cached) return cached;
  const res = await net;
  return res || Response.error();
}
