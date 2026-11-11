// Offline support. Only the app's own files are ever cached (fonts are bundled, nothing comes from other sites);
// failed or redirected responses are never stored.
const VERSION = 'hand-v4';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './fonts/reem-kufi-arabic-500-normal.woff2', './fonts/reem-kufi-latin-500-normal.woff2', './fonts/reem-kufi-arabic-700-normal.woff2', './fonts/reem-kufi-latin-700-normal.woff2', './fonts/ibm-plex-sans-latin-400-normal.woff2', './fonts/ibm-plex-sans-latin-500-normal.woff2', './fonts/ibm-plex-sans-latin-600-normal.woff2', './fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', './fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2', './fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2', './fonts/ibm-plex-mono-latin-500-normal.woff2', './fonts/ibm-plex-mono-latin-600-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = r => r && r.ok && !r.redirected && r.type === 'basic';
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // never touch other sites
  if (req.mode === 'navigate') {                             // app page: network first so updates arrive, cache when offline
    e.respondWith(fetch(req).then(r => { if (keep(r)) { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); } return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (keep(r)) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })));
});
