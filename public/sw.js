/* World Dominion — service worker: offline cache for game assets */
const CACHE = 'wd-v2';
const IMMUTABLE = [
  '/cdn/leaflet/leaflet.min.js',
  '/cdn/geo/countries.geo.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(IMMUTABLE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // never cache API traffic
  if (url.pathname.startsWith('/api/')) return;

  // cache-first only for big immutable libs
  if (IMMUTABLE.some((p) => url.pathname === p)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // network-first for everything else (game HTML, shim, flags) with cache fallback for offline
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && (url.pathname.startsWith('/cdn/') || url.pathname === '/game/index.html')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('/game/index.html')))
  );
});
