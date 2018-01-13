// VERSION: 4

var static_assets = [
  './',
  'https://gitcdn.link/repo/Chalarangelo/mini.css/master/dist/mini-default.min.css',
  './css/styles.css',
  './js/localforage.min.js',
  './js/moment-duration-format.js',
  './js/moment.js',
  './js/app.js',
];

async function cahceManager (req) {
  var cachedResponse = await caches.match(req);
  return await fetch(req) || cachedResponse;
};

self.addEventListener('install', async e => {
  console.log("Installed");
  var cache = await caches.open('static');
  cache.addAll(static_assets);
});
self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith(cahceManager(req));
});
