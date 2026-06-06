var APP_SHELL_CACHE = "ai-ggb-app-shell"; // 应用壳缓存（HTML/CSS/JS等静态资源）
var GGB_RESOURCE_CACHE = "ai-ggb-geogebra-resources"; // GeoGebra远程资源缓存（JS/图片等）
var GGB_PATH_PREFIX = "/GeoGebra/"; // GeoGebra资源URL路径前缀

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(APP_SHELL_CACHE).then(function (cache) {
      return cache.addAll([
        "/",
        "/index.html",
        "/styles.css",
        "/app.js",
        "/sw.js",
        "/favicon.svg",
        "/manifest.json"
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
          return n !== APP_SHELL_CACHE && n !== GGB_RESOURCE_CACHE;
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

  if (url.pathname.startsWith(GGB_PATH_PREFIX)) {
    e.respondWith(
      caches.open(GGB_RESOURCE_CACHE).then(function (cache) {
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
          caches.open(APP_SHELL_CACHE).then(function (cache) {
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
