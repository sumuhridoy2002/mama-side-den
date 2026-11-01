/* Offline game shell only. Never caches sign-in routes or external data. */
const PREFIX = "brake-koi-mama:" + self.registration.scope + ":";
const CACHE = PREFIX + "final-20261101";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const path of ASSETS) {
        const response = await fetch(
          new Request(path, { cache: "reload", credentials: "same-origin" }),
        );
        if (!response.ok || response.redirected)
          throw new Error("Game cache unavailable");
        await cache.put(path, response);
      }
    }),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((n) => n.startsWith(PREFIX) && n !== CACHE)
              .map((n) => caches.delete(n)),
          ),
        ),
      self.clients.claim(),
    ]),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  let base = new URL("./", self.location.href),
    relative = url.pathname.slice(base.pathname.length);
  if (
    !ASSETS.some((p) => p.replace(/^\.\//, "") === relative) &&
    relative !== ""
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }
  event.respondWith(
    caches
      .open(CACHE)
      .then(
        async (cache) =>
          (await cache.match(event.request, { ignoreSearch: true })) ||
          fetch(event.request),
      ),
  );
});