const CACHE_NAME = 'tracker-cache-v3';

// Кэшируем только статичные служебные вещи, но НЕ сам index.html
const assetsToCache = [
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Умный перехват запросов (Network First для HTML)
self.addEventListener('fetch', (event) => {
  // Если это запрос страницы (index.html или корень сайта)
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Если интернет есть — отдаем свежую версию с сервера
          return networkResponse;
        })
        .catch(() => {
          // Если интернета нет — берем последнюю рабочую версию из кэша
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Для остальных файлов (иконки, манифест) — стандартная выдача
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
