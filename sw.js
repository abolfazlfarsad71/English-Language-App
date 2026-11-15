/* English app — service worker.
   Network-first: whenever the phone is online the newest files are fetched and cached; offline, the last
   cached copy is served. Learner progress is in localStorage and is never touched by this worker. */
const CACHE = 'en-app-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.url.split('?')[0];
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(req, { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(t);
      if (res && res.ok && !/[?&]check=/.test(req.url)) cache.put(key, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(key) || (req.mode === 'navigate' ? await cache.match(new URL('./index.html', location).href) || await cache.match(new URL('./', location).href) : null);
      return hit || new Response('Offline and not cached yet. Open the app once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
