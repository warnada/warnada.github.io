/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { createPartialResponse } from 'workbox-range-requests';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;
const MEDIA_CACHE = 'warnada-media-v1'; // diisi oleh tombol Unduh di aplikasi (lib/offline.ts)

// Aplikasi baru menunggu persetujuan pengguna (toast "Muat ulang"), bukan langsung mengganti.
self.addEventListener('message', (e) => { if (e.data?.type === 'SKIP_WAITING') void self.skipWaiting(); });
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// App shell: semua navigasi SPA dijawab index.html hasil precache (bekerja offline).
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/\/audio\//, /\/lyrics\//] }));

// Katalog: tampil cepat dari cache, diperbarui di belakang layar.
registerRoute(({ url }) => url.pathname.endsWith('/catalog.json'), new StaleWhileRevalidate({ cacheName: 'warnada-catalog', plugins: [new CacheableResponsePlugin({ statuses: [200] })] }));

// Daftar lagu Jamendo: tampil dari cache saat offline, diperbarui di belakang layar.
registerRoute(({ url }) => url.origin === 'https://api.jamendo.com', new StaleWhileRevalidate({ cacheName: 'warnada-jamendo-api', plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 3600 })] }));

// Audio & lirik: lagu yang sudah diunduh dilayani dari cache (termasuk Range untuk seek),
// selain itu langsung ke jaringan (streaming, tidak disimpan diam-diam).
// Lagu Jamendo di-cache dengan URL absolutnya, jadi domainnya ikut dicocokkan (harus sinkron dengan TRUSTED_MEDIA_DOMAINS).
const isRemoteMedia = (u: URL) => /(^|\.)(jamendo|newjamendo)\.com$/.test(u.hostname);
registerRoute(
  ({ url }) => (url.origin === self.location.origin ? /\/(audio|lyrics)\//.test(url.pathname) : isRemoteMedia(url) && url.origin !== 'https://api.jamendo.com'),
  async ({ request }) => {
    const cache = await caches.open(MEDIA_CACHE);
    const hit = await cache.match(request.url);
    if (hit) return request.headers.has('range') ? createPartialResponse(request, hit) : hit;
    try { return await fetch(request); } catch { return Response.error(); }
  }
);
