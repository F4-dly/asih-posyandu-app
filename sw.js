// ==================================================================
// SERVICE WORKER ASIH — MESIN CACHE OFFLINE-FIRST (PWA V1.0)
// ==================================================================

const CACHE_NAME = 'asih-posyandu-cache-v16';

// Daftar file yang WAJIB disimpan ke memori HP agar bisa dibuka offline
const FILE_YANG_DICACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
  // (Nanti kalau ikon SVG dari Lourent sudah masuk ke folder assets, tambahkan di sini ya!)
];

// 1. TAHAP INSTALL: Menyimpan semua file static ke dalam Cache HP
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Sedang menginstall & mengunci file ke memori...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[Service Worker] Berhasil mengunci file dasar aplikasi!');
      return cache.addAll(FILE_YANG_DICACHE);
    })
  );
  self.skipWaiting();
});

// 2. TAHAP ACTIVATE: Membersihkan cache lama jika ada versi aplikasi baru
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Mengaktifkan versi terbaru...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(namaCache) {
          if (namaCache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', namaCache);
            return caches.delete(namaCache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. TAHAP FETCH: Cegat permintaan browser. Kalau Offline, ambil dari Cache!
self.addEventListener('fetch', function(event) {
  // PENTING: Jangan cache pengiriman data (POST) ke Google Sheets!
  // Biarkan request POST dan luar domain ditangani langsung oleh jaringan browser.
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(fileDariCache) {
      // Kalau file ada di cache memori HP, langsung tampilkan dalam 0.1 detik!
      if (fileDariCache) {
        return fileDariCache;
      }
      
      // Kalau tidak ada di cache, ambil dari internet normal
      return fetch(event.request).catch(function() {
        // Kalau internet mati total dan file gak ada di cache, arahkan ke index.html
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});