const CACHE = "avt-checkin-demo-test8-1.0.0-test.8";
const LOCAL_FILES = [
  "./", "index.html", "help.html", "styles.css", "manifest.webmanifest",
  "js/config.js", "js/backend.js", "js/storage.js", "js/scanner.js",
  "js/app.js", "js/jsQR.js", "icons/icon-192.png", "icons/icon-512.png",
  "icons/header-logo.png", "icons/power-icon.png", "icons/refresh-icon.svg", "icons/help-icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(LOCAL_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("avt-checkin-demo-test8-") && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
