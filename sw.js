/* Seitenlinie – Service Worker
   Speichert alle Spieldateien auf dem Gerät, damit die App ohne Internet startet.
   Bei jedem Update: CACHE-Version erhöhen. */
const CACHE = 'seitenlinie-v0.38.0';
const ASSETS = [
  './',
  './index.html',
  './world.js',
  './engine.js',
  './matchsim.js',
  './atmo.js',
  './comps.js',
  './natcups.js',
  './contracts.js',
  './transfers.js',
  './market.js',
  './tactics.js',
  './calendar.js',
  './live.js',
  './view3d.js',
  './stats.js',
  './talk.js',
  './room.js',
  './crew.js',
  './scouting.js',
  './crewtalk.js',
  './board.js',
  './org.js',
  './press.js',
  './fans.js',
  './news.js',
  './iv.js',
  './feud.js',
  './training.js',
  './editor.js',
  './ui.js',
  './fonts/Rubik-var.woff',
  './fonts/BarlowCondensed-600.woff',
  './fonts/BarlowCondensed-700.woff',
  './fonts/Caveat-700.woff',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  // Kein skipWaiting: die neue Version wartet, bis der Spieler „Aktualisieren“ tippt.
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Offline zuerst: aus dem Gerätespeicher, sonst Netz, bei Seitenaufruf ohne Netz die Spielseite.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
