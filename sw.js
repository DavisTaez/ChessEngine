const CACHE_NAME = 'ragnus-v1';

// Lista de archivos principales
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/trainer.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Guardar cada archivo individualmente para evitar que 1 fallo rompa todo
      return Promise.allSettled(
        ASSETS.map(url => 
          fetch(url).then(response => {
            if (!response.ok) throw new Error(`Fallo al cargar ${url}`);
            return cache.put(url, response);
          }).catch(err => console.warn(`[SW] No se pudo cachear: ${url}`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});