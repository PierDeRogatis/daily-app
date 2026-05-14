const CACHE = 'daily-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only cache GET requests for same-origin assets; pass GitHub API through
  if (e.request.method !== 'GET' || e.request.url.includes('api.github.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(data.title || 'Daily Briefing', {
    body: data.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: '/' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(wins => {
    const open = wins.find(w => w.url === e.notification.data?.url);
    return open ? open.focus() : clients.openWindow(e.notification.data?.url || '/');
  }));
});
