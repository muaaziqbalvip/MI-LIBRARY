// LuminaLib Service Worker v1.0
// Enables offline reading and PWA support

const CACHE_NAME = 'luminalib-v1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
];

// ── Install ────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { mode: 'no-cors' });
      })).catch(err => {
        console.warn('[SW] Pre-cache error (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activated.');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch Strategy: Cache-First for assets, Network-First for API ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Firebase, Google APIs, and non-GET requests
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    return;
  }

  // PDF files: Cache for offline reading
  if (url.pathname.endsWith('.pdf') || url.searchParams.has('pdf')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response('Offline – PDF not cached yet.', { status: 503 });
        }
      })
    );
    return;
  }

  // Image files: Cache-first
  if (/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request, { mode: 'no-cors' });
          cache.put(event.request, response.clone());
          return response;
        } catch {
          return cached || new Response('', { status: 204 });
        }
      })
    );
    return;
  }

  // HTML & JS: Network-first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || caches.match('/index.html');
      })
  );
});

// ── Background Sync (for offline actions) ─────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-downloads') {
    console.log('[SW] Background sync: sync-downloads');
  }
});

// ── Push Notifications (placeholder) ──────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'LuminaLib';
  const options = {
    body: data.body || 'New books available!',
    icon: 'https://i.ibb.co/d0xwVb2b/file-00000000246471fa9014d17924d4447a.png',
    badge: 'https://i.ibb.co/d0xwVb2b/file-00000000246471fa9014d17924d4447a.png',
    tag: 'luminalib-notification',
    renotify: true,
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
