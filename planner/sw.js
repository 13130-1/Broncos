/* Offline cache for the app shell. Planner data itself lives in localStorage. */
const CACHE = 'planner-shell-v2';
const SHELL = ['./', 'index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest',
  'js/dates.js', 'js/store.js', 'js/templates.js', 'js/layouts.js', 'js/calendar.js', 'js/editor.js', 'js/guide.js', 'js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Network first, so updates show up right away; fall back to the cache when offline. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
