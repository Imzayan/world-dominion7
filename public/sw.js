/* World Dominion — service worker v6: "instant boot + self-healing version" strategy
   - vendor libs + borders + flags: cache-first (same-origin, VPN-independent)
   - game HTML: stale-while-revalidate → cached copy paints instantly on ANY network,
     background fetch keeps it fresh; the page's V63 self-heal beacon swaps + reloads
     once per release (v.txt) so users never stay pinned to an old build
   - cold start (no cache): plain streaming navigation — SW never becomes a failure point
   - /game/v.txt and ?wdFresh= bypass: always straight network, never cached here
   - API/SSE traffic is never intercepted */
const CACHE = 'wd-v6';
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
  if (url.pathname === '/game/v.txt') return;      // V63 version beacon: always fresh, never intercepted

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

  // 2) game HTML (any entry URL) → SWR; ?wdFresh= bypasses so the self-heal fetches truth
  const isHtml = url.pathname === '/' || url.pathname === '/game' || url.pathname === '/game/' || url.pathname === '/game/index.html';
  if (isHtml && url.search.indexOf('wdFresh=') === -1) {
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
  if (!cached) return fetch(req); // cold: plain streaming navigation, no SW-induced failure
  // warm: instant paint + silent background refresh for the next boot
  fetch(req).then((res) => {
    if (res && res.ok) cache.put(target, res.clone()).catch(() => {});
  }).catch(() => {});
  return cached;
}
