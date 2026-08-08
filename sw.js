const CACHE = 'mypeople-v1';
const LOCAL_ASSETS = ['./index.html', './manifest.json', './icon.svg'];

// On install: cache local files and skip waiting
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(LOCAL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Remove old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // CDN resources (Babel, esm.sh, lucide): cache then network
  if (url.includes('unpkg.com') || url.includes('esm.sh')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // Local assets: cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
