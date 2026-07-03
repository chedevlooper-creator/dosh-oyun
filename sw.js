const CACHE = "dosh-v7";
const ASSETS = ["./", "index.html", "three.min.js", "fx.js", "font-cyr.woff2", "font-lat.woff2",
  "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "bg-kavkaz.jpg", "bg-night.jpg", "bg-forest.jpg", "bg-autumn.jpg", "bg-winter.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const isNav = e.request.mode === "navigate" || e.request.destination === "document";
  if (isNav) {
    // güncellemeler gecikmesin: önce ağ, çevrimdışıysa önbellek
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("index.html", copy));
        return res;
      }).catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (e.request.method === "GET" && res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
