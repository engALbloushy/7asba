// Offline support. Only the app's own files and its Google Fonts are ever cached;
// failed or redirected responses are never stored.
const VERSION = 'hand-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = r => r && r.ok && !r.redirected && (r.type === 'basic' || r.type === 'cors');
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin, font = url.protocol === 'https:' && FONT_HOSTS.includes(url.hostname);
  if (!same && !font) return;                       // anything else: let the browser (and the page's CSP) handle it
  if (req.mode === 'navigate') {                    // app page: network first so updates arrive, cache when offline
    e.respondWith(fetch(req).then(r => { if (keep(r)) { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); } return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (keep(r)) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })));
});
