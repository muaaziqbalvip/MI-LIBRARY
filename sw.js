// LuminaLib Service Worker v3.0 — Enhanced Offline + PDF Caching
const CACHE_NAME = 'luminalib-v3.0';
const PDF_CACHE = 'luminalib-pdfs-v3.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(STATIC_ASSETS.map(url =>
        cache.add(new Request(url, { mode: 'no-cors' })).catch(() => {})
      ));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== PDF_CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseapp.com') || url.hostname.includes('gstatic.com') ||
      url.hostname.includes('ipapi.co') || url.hostname.includes('translate.google')) return;

  // PDF files go to dedicated PDF cache for offline reading
  if (url.pathname.endsWith('.pdf') || url.href.includes('drive.google.com/file') || url.href.includes('docs.google.com/viewer')) {
    event.respondWith(
      caches.open(PDF_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) {
          self.clients.matchAll().then(clients => clients.forEach(c =>
            c.postMessage({ type: 'PDF_FROM_CACHE', url: event.request.url })));
          return cached;
        }
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
            self.clients.matchAll().then(clients => clients.forEach(c =>
              c.postMessage({ type: 'PDF_CACHED', url: event.request.url })));
          }
          return response;
        } catch {
          return new Response(JSON.stringify({ error: 'PDF not available offline. Download it first.' }), 
            { status: 503, headers: { 'Content-Type': 'application/json' } });
        }
      })
    );
    return;
  }

  // Images: cache-first
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request, { mode: 'no-cors' });
          cache.put(event.request, response.clone());
          return response;
        } catch { return cached || new Response('', { status: 204 }); }
      })
    );
    return;
  }

  // HTML/JS: Network-first, cache fallback
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request);
      return cached || caches.match('/index.html');
    })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-downloads') console.log('[SW] Background sync');
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || 'LuminaLib', {
    body: data.body || 'New books available!',
    icon: 'https://i.ibb.co/d0xwVb2b/file-00000000246471fa9014d17924d4447a.png',
    badge: 'https://i.ibb.co/d0xwVb2b/file-00000000246471fa9014d17924d4447a.png',
    tag: 'luminalib-notification', renotify: true, data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

// Message from client to cache a PDF
self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_PDF') {
    const { url } = event.data;
    caches.open(PDF_CACHE).then(async cache => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          event.source.postMessage({ type: 'PDF_CACHED_SUCCESS', url });
        }
      } catch(e) { event.source.postMessage({ type: 'PDF_CACHE_FAILED', url }); }
    });
  }
  if (event.data?.type === 'GET_CACHED_PDFS') {
    caches.open(PDF_CACHE).then(async cache => {
      const keys = await cache.keys();
      event.source.postMessage({ type: 'CACHED_PDFS', urls: keys.map(r => r.url) });
    });
  }
});
