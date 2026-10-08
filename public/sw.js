// Service worker — Acá falta la muni (Carlos Casares)
// Página: red primero (siempre la versión nueva) con copia offline de respaldo.
// Teselas del mapa: caché primero, para que el mapa ande con poca señal.
const CACHE = 'afm-casares-v1';
const TILES = 'afm-casares-tiles-v1';
const MAX_TILES = 600;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== TILES).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

async function trimTiles() {
  const cache = await caches.open(TILES);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.hostname.endsWith('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.open(TILES).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) {
          cache.put(request, res.clone());
          trimTiles();
        }
        return res;
      })
    );
    return;
  }

  // Solo cacheamos lo propio del sitio (nunca Firestore ni Nominatim)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('./')))
  );
});
