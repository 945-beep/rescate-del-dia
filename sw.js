const CACHE = 'rescate-dia-v7';
const FILES = ['./', './index.html', './manifest.json', './auth.js?v=7', './supabase-config.js', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('rescate-dia-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html', {cacheName:CACHE})));
    return;
  }
  event.respondWith(caches.match(request, {cacheName:CACHE}).then(cached => cached || fetch(request).then(response => {
    if (response.ok && new URL(request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    return response;
  })).catch(() => caches.match(request, {cacheName:CACHE})));
});
