// 보안무쌍 서비스 워커 — 홈 화면 앱 + 오프라인 실행
// 게임 파일: 캐시를 먼저 보여 주고(즉시 실행) 뒤에서 새 버전을 받아 둔다 → 다음 실행부터 최신(월간 CVE 등)
// 구글 폰트: 한 번 받으면 캐시에서 사용 (오프라인이면 시스템 글꼴로 대체)
const CACHE = 'secmusou-v1';
const FONTS = 'secmusou-fonts-v1';
const CORE = [
  './', './index.html', './game.js', './render3d.js', './content.js',
  './vendor/three.min.js', './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const key = req.mode === 'navigate' ? './index.html' : req;
      const cached = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(fresh); return cached; }
      return (await fresh) || new Response('오프라인입니다. 한 번 온라인에서 실행하면 이후엔 오프라인으로도 동작합니다.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })());
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch { return new Response('', { status: 504 }); }
    })());
  }
});
