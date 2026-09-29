# Warnada

Pemutar musik berbasis PWA dengan **lirik tersinkron**, bisa dipasang di HP dan **diputar offline**. Tampilan mengikuti design system Warnada (mesh gradient + panel kaca, 8 tema genre, gelap/terang).

## Fitur

- **Pemutar audio** dengan lirik tersinkron (format LRC, pencarian baris biner, ketuk baris untuk lompat), antrean, acak, ulangi, dan kontrol layar kunci lewat Media Session API.
- **Offline**: service worker (Workbox) menyimpan app shell; tombol *Unduh* menyimpan audio + lirik ke Cache Storage. Seek tetap jalan offline berkat dukungan Range request. *Mode offline* hanya memutar lagu yang sudah diunduh.
- **Bisa dipasang**: web app manifest, ikon maskable, shortcut, banner pasang (Android/desktop) dan petunjuk iOS.
- **Update aman**: versi baru menunggu persetujuan lewat toast "Muat ulang".
- **Cari** berdasarkan judul, artis, album, atau **potongan lirik**.
- Responsif: bottom nav (HP) → rail (tablet) → sidebar + panel lirik (desktop). Menghormati `prefers-reduced-motion` dan `prefers-reduced-transparency`.

## Stack

React 19 · Vite · TypeScript (strict) · React Router · Zustand · vite-plugin-pwa/Workbox · Vitest · ESLint. Font di-host sendiri (Fontsource) agar jalan offline dan tanpa request ke pihak ketiga. Pemutar penuh dimuat malas.

## Menjalankan

```bash
npm ci
npm run dev        # pengembangan (service worker nonaktif)
npm run build      # produksi + 404.html untuk SPA fallback GitHub Pages
npm run preview    # uji PWA/offline di http://localhost:4173
npm test && npm run lint
```

## Katalog & audio demo

`public/catalog.json` berisi 8 lagu demo (satu per genre). Audio **disintesis** oleh `scripts/generate-audio.mjs` dan liriknya karangan sendiri (`scripts/tracks.mjs`), sehingga bebas hak cipta. Jalankan `npm run gen:audio` untuk membuat ulang.

Untuk katalog/backend sungguhan, cukup implementasikan `CatalogSource` di `src/lib/catalog.ts` (mis. REST); UI tidak perlu berubah.

## Deploy

Workflow `.github/workflows/deploy.yml` men-deploy ke GitHub Pages dari `main`. Aktifkan sekali di **Settings → Pages → Source: GitHub Actions**.
