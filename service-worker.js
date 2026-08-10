const CACHE_ADI = 'mugolbilgin-cache-v1';
const CACHE_DOSYALARI = [
    './index.html',
    './manifest.json',
    './logo.png'
];

// Kurulum: temel dosyaları önbelleğe al
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_ADI).then(function (cache) {
            return cache.addAll(CACHE_DOSYALARI);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// Aktivasyon: eski cache sürümlerini temizle
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (isimler) {
            return Promise.all(
                isimler.filter(function (isim) { return isim !== CACHE_ADI; })
                       .map(function (isim) { return caches.delete(isim); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// Fetch: önce ağdan dene, olmazsa cache'e düş (kendi domainimizdeki istekler için)
self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                const kopya = response.clone();
                caches.open(CACHE_ADI).then(function (cache) {
                    try { cache.put(event.request, kopya); } catch (e) {}
                });
                return response;
            })
            .catch(function () {
                return caches.match(event.request).then(function (cevap) {
                    return cevap || caches.match('./index.html');
                });
            })
    );
});
