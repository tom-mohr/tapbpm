const CACHE_NAME = 'tapbpm-cache-v2';
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
            return cache.match(event.request).then(cachedResponse => {
                const networkFetch = fetch(event.request).then(networkResponse => {
                    // Update the cache with a clone of the network response
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    // Network request failed; provide a fallback
                    return caches.match('/index.html');
                });
                // Return cached response if available; otherwise, return the network response
                return cachedResponse || networkFetch;
            });
        }).catch(() => {
            // Failed to open cache; provide a fallback
            return caches.match('/index.html');
        })
    );
});
