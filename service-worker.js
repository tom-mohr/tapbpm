const CACHE_NAME = 'tapbpm-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/favicon.ico'
];

// install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// activate
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// fetch
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // cache refresh
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            return caches.match('/index.html');
        })
    );
});
