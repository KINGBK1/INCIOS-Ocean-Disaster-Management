// Simple service worker for caching API responses
const CACHE_NAME = 'varuna-api-cache-v1';
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache API responses
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache GET requests to our API
  if (event.request.method === 'GET' && url.pathname.includes('/api/posts')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('cached-date'));
            const now = new Date();
            
            // Return cached response if it's less than 5 minutes old
            if (now - cachedDate < API_CACHE_DURATION) {
              console.log('📦 Serving cached API response');
              return cachedResponse;
            }
          }
          
          // Fetch fresh data
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              // Clone response and add cache date
              const responseToCache = response.clone();
              const headers = new Headers(responseToCache.headers);
              headers.set('cached-date', new Date().toISOString());
              
              const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              
              cache.put(event.request, cachedResponse);
              console.log('🔄 Cached fresh API response');
            }
            return response;
          });
        });
      })
    );
  }
});

// Clean up old cache entries
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});