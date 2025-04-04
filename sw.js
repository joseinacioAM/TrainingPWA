const CACHE_NAME = "training-pwa-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/register.html",
  "/assets/css/style.css",
  "/assets/js/script.js",
  "/assets/js/auth.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
  );
});
