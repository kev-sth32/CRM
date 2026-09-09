/**
 * SalesOS Service Worker (sw.js)
 * Implements offline application shell caching and network-first data fallback
 */

const CACHE_NAME = 'salesos-pwa-v3';
const PREV_CACHE = 'salesos-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/leads',
  '/deals',
  '/quotes',
  '/contacts',
  '/companies',
  '/tasks',
  '/inbox',
  '/index.html',
  '/leads.html',
  '/deals.html',
  '/quotes.html',
  '/contacts.html',
  '/companies.html',
  '/tasks.html',
  '/inbox.html',
  '/app.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('PWA: Some static assets failed to pre-cache', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always network-first: fetch fresh asset, update cache, fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return (await caches.match('/index.html')) || (await caches.match('/'));
        }
        return new Response('Offline: Content is temporarily unavailable.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});

