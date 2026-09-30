# Warnada

Pemutar musik berbasis PWA dengan **lirik tersinkron**, bisa dipasang di HP dan **diputar offline**. Tampilan **"Langit Wada"**: suasana lagu adalah cuaca, dan waktu lagu adalah perjalanan matahari di busur langit. Latar krem hangat (atau ungu malam), huruf bulat (Fredoka + Nunito), dan maskot Wada, kucing berkuping headphone.

## Fitur

- **Pemutar audio** dengan lirik tersinkron (format LRC, pencarian baris biner, ketuk baris untuk lompat), antrean, acak, ulangi, dan kontrol layar kunci lewat Media Session API.
- **Offline**: service worker (Workbox) menyimpan app shell; tombol *Unduh* menyimpan audio + lirik ke Cache Storage. Seek tetap jalan offline berkat dukungan Range request. *Mode offline* hanya memutar lagu yang sudah diunduh.
- **Bisa dipasang**: web app manifest, ikon maskable, shortcut, banner pasang (Android/desktop) dan petunjuk iOS.
- **Update aman**: versi baru menunggu persetujuan lewat toast "Muat ulang".
- **Cari** (menggantikan Jelajah): satu halaman untuk mencari dan menjelajah. Cari berdasarkan judul, artis, album, genre, atau **potongan lirik** (kata yang cocok disorot); pilih genre lewat chip atau ubin tanpa mengetik, lalu "Putar semua". Menyimpan pencarian terakhir, dan keadaannya ada di URL (`/cari?q=hujan&genre=jazz`) sehingga tombol Back dan tautan bekerja. Tautan lama `/jelajah` dialihkan ke sini.
- **Melanjutkan**: riwayat putar dan lagu terakhir (beserta posisinya) dipulihkan saat aplikasi dibuka, dalam keadaan jeda.
- **Pintasan keyboard**: Spasi putar/jeda, ←/→ ±5 detik, N/P berikutnya/sebelumnya, Esc menutup pemutar.
- **Offline yang jelas**: banner saat offline, dan lagu yang belum diunduh diberi keterangan "Belum diunduh".
- **Langit Wada**: tiap genre punya cuaca (Lo-fi hujan senja, Pop cerah, Rock senja membara, Jazz remang ungu, EDM aurora, Akustik padang pagi). Sampul lagu adalah langit mini bergambar SVG, jadi ringan dan tidak perlu gambar.
- **Matahari sebagai penggeser lagu**: di pemutar, matahari (atau bulan pada aurora) bergerak di busur langit sesuai waktu putar. Geser matahari, atau fokuskan lalu tekan ←/→ (±5 dtk), Home, End, untuk melompat. Lirik tampil sebagai awan (baris aktif besar, bisa diketuk); tombol mikrofon membuka lirik penuh.
- **Animasi ringan**: hujan, kelopak, bintang, dan awan hanya memakai `transform`/`opacity` (dikerjakan compositor), dijeda saat lagu berhenti atau langit di luar layar, dan dimatikan bila pengguna memilih gerak dikurangi. Saat lagu berjalan hanya lapisan matahari yang diperbarui (~4x/detik); lapisan awan, bukit, dan partikel tidak dirender ulang.
- **Aksen halus**: enam pilihan (lilac, sage, peach, sky, rose, butter) lewat ikon palet untuk tombol dan sorotan; bila "Ikuti genre lagu" menyala, aksen mengikuti genre.
- **Wada**: maskot kucing yang bernyanyi saat lagu diputar dan tidur saat dijeda.
- **Beranda**: hero langit sesuai lagu terakhir, dengan sapaan, tombol lanjutkan, pilihan cepat (favorit → riwayat), dan rak suasana.
- **Disukai**: ikon hati di setiap lagu; filter "Disukai" di Pustaka dan rak di Beranda. Tersimpan di perangkat.
- **Antrean**: lihat, putar dari, dan hapus item antrean (sheet di HP/tablet, tab di panel desktop).
- **Gestur**: geser kiri/kanan pindah menu (Beranda, Cari, Pustaka, Unduhan); di pemutar geser atas = lagu berikutnya, bawah = sebelumnya; geser kiri/kanan pada mini player pindah lagu. Konten mengikuti jari lewat CSS variable (hanya transform/opacity), sumbu dikunci sejak awal sehingga gulir biasa tetap bekerja, dan area yang punya geser sendiri (chip, matahari, lirik penuh) dikecualikan. Tutup pemutar lewat tombol atau Esc.
- **Responsif** mobile-first sampai layar lebar (container query): bottom nav (HP) → rail (tablet) → sidebar + panel lirik (laptop). Pemutar dua kolom (langit + kontrol) di tablet/laptop, dan mode landscape pendek untuk ponsel. Menghormati `prefers-reduced-motion` dan `prefers-reduced-transparency`.

## Stack

React 19 · Vite · TypeScript (strict) · React Router · Zustand · vite-plugin-pwa/Workbox · Vitest · ESLint. Font Fredoka dan Nunito di-host sendiri (Fontsource) agar jalan offline dan tanpa request ke pihak ketiga. Pemutar penuh dimuat malas.

## Menjalankan

```bash
npm ci
npm run dev        # pengembangan (service worker nonaktif)
npm run build      # produksi + 404.html untuk SPA fallback GitHub Pages
npm run preview    # uji PWA/offline di http://localhost:4173
npm test && npm run lint
```

## Integrasi Jamendo (musik nyata)

Katalog demo digabung dengan lagu Creative Commons dari [Jamendo](https://devportal.jamendo.com): populer per genre saat aplikasi dibuka, dan pencarian langsung ke Jamendo di halaman Cari.

- Atur `VITE_JAMENDO_CLIENT_ID` (lihat `.env.example`; lokal di `.env.local`). Kosong = hanya katalog demo.
- Di CI, isi **Settings → Secrets and variables → Actions → Variables**: `JAMENDO_CLIENT_ID` dan (opsional) `JAMENDO_LICENSE_POLICY`.
- `VITE_JAMENDO_LICENSE_POLICY`: `all` (bawaan; Warnada non-komersial, jadi lagu CC-NC ikut) atau `commercial` (membuang lagu NC). **Ganti ke `commercial` sebelum menambah iklan atau langganan.** Atribusi lisensi selalu ditampilkan.
- Atribusi (penyedia + lisensi CC, tertaut) tampil di layar pemutar. Lagu yang melarang unduhan tidak bisa diunduh.
- Respons Jamendo diperlakukan sebagai data tidak tepercaya (`src/lib/jamendo.ts`): entri rusak dilewati, URL audio/gambar hanya dari domain Jamendo lewat HTTPS. Domain yang sama harus tercantum di CSP (`vite.config.ts`) dan service worker (`src/sw/sw.ts`).
- Lirik tersinkron tidak disediakan Jamendo, jadi lagu Jamendo menampilkan "Lirik belum tersedia".
- Client ID Jamendo memang publik (ikut terkirim ke browser); jangan gunakan kredensial rahasia di sini.

## Katalog & audio demo

`public/catalog.json` berisi 8 lagu demo (satu per genre). Audio **disintesis** oleh `scripts/generate-audio.mjs` dan liriknya karangan sendiri (`scripts/tracks.mjs`), sehingga bebas hak cipta. Jalankan `npm run gen:audio` untuk membuat ulang.

Untuk katalog/backend sungguhan, cukup implementasikan `CatalogSource` di `src/lib/catalog.ts` (mis. REST); UI tidak perlu berubah.

## Deploy

Workflow `.github/workflows/deploy.yml` men-deploy ke GitHub Pages dari `main`. Aktifkan sekali di **Settings → Pages → Source: GitHub Actions**.
