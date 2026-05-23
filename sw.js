var CACHE_NAME = "ai-ggb-v2.0.0";
var GGB_CACHE = "ai-ggb-geogebra-v1";
var GGB_PREFIX = "/GeoGebra/";

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/app.js",
        "/sw.js"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) {
          return n !== CACHE_NAME && n !== GGB_CACHE;
        }).map(function (n) {
          return caches.delete(n);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);

  if (url.pathname.startsWith(GGB_PREFIX)) {
    e.respondWith(
      caches.open(GGB_CACHE).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          if (cached) return cached;
          return fetch(e.request).then(function (response) {
            if (response && response.status === 200) {
              cache.put(e.request, response.clone());
            }
            return response;
          }).catch(function () {
            return new Response("GeoGebra resource not available offline", { status: 503 });
          });
        });
      })
    );
    return;
  }

  if (e.request.method !== "GET") return;

  if (url.pathname.endsWith("/chat/completions") || url.pathname.endsWith("/models")) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetchPromise = fetch(e.request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
