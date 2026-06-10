/* 재무컨설턴트 PWA 서비스워커 — 오프라인 캐시 */
const CACHE = 'fin-consultant-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

/* 네트워크 우선, 실패 시 캐시 (시세 API 등 외부 요청은 캐시하지 않음) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  if (!sameOrigin) return; // 외부 API는 그대로 통과
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return r;
    }).catch(() =>
      caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
