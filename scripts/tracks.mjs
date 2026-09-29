// Sumber katalog demo. Semua lirik karangan sendiri; audio disintesis oleh generate-audio.mjs.
// Progres akor = derajat tangga nada mayor/minor (semitone dari root).
export const tracks = [
  { id: 'rinai-senja', title: 'Rinai Senja', artist: 'Sore Pelan', album: 'Hujan di Jendela', genre: 'lofi', bpm: 76, root: 57, mode: 'minor', wave: 'triangle', drums: 'soft',
    lyrics: ['Rinai turun di kaca jendela', 'Kopi hangat menemani sore', 'Kota pelan menarik napasnya', 'Kita diam, tak perlu kata', 'Lampu jalan mulai menyala', 'Ada tenang di antara kita', 'Biar hujan bercerita panjang', 'Pulanglah pelan, aku di sini'] },
  { id: 'gula-gula', title: 'Gula-Gula Pagi', artist: 'Nona Kembang', album: 'Manis Sekali', genre: 'pop', bpm: 112, root: 60, mode: 'major', wave: 'square', drums: 'pop',
    lyrics: ['Bangun pagi senyum sendiri', 'Matahari ikut menari', 'Langkahku ringan tak terbendung', 'Dunia manis seperti permen', 'Ayo nyanyi sekeras-kerasnya', 'Biar semua ikut bahagia', 'Hari ini milik kita', 'Gula-gula di ujung lidah'] },
  { id: 'baja-menyala', title: 'Baja Menyala', artist: 'Gerbang Api', album: 'Jalan Raya Malam', genre: 'rock', bpm: 132, root: 52, mode: 'minor', wave: 'sawtooth', drums: 'rock',
    lyrics: ['Gas ditarik malam terbelah', 'Suara mesin memanggil nama', 'Aku tak takut gelap di depan', 'Api di dada tak pernah padam', 'Angkat tangan kita bersama', 'Teriakkan yang lama tertahan', 'Baja menyala di jalanan', 'Sampai pagi kita tak berhenti'] },
  { id: 'kopi-tengah-malam', title: 'Kopi Tengah Malam', artist: 'Trio Beledu', album: 'Kelab Kecil', genre: 'jazz', bpm: 92, root: 55, mode: 'dorian', wave: 'sine', drums: 'swing',
    lyrics: ['Piano pelan di sudut ruang', 'Asap tipis menari santai', 'Gelas berdenting satu-satu', 'Malam tahu apa yang kucari', 'Bass melangkah tak tergesa', 'Kita larut dalam nada', 'Biarkan waktu berhenti sebentar', 'Kopi dingin, hati hangat'] },
  { id: 'lampu-lantai', title: 'Lampu Lantai', artist: 'Denyut Kota', album: 'Pukul Dua', genre: 'edm', bpm: 128, root: 57, mode: 'minor', wave: 'sawtooth', drums: 'four',
    lyrics: ['Lampu berputar di atas kepala', 'Detak bass mengetuk dada', 'Lepaskan semua beban hari ini', 'Loncat bersama sampai pagi', 'Tangan tinggi tak ada yang diam', 'Ritme naik makin terang', 'Kita cahaya di lantai dansa', 'Jangan pulang, malam masih muda'] },
  { id: 'goyang-syahdu', title: 'Goyang Syahdu', artist: 'Orkes Senandung', album: 'Malam Minggu', genre: 'dangdut', bpm: 104, root: 57, mode: 'harmonic', wave: 'square', drums: 'dangdut',
    lyrics: ['Gendang bertalu hati berdebar', 'Suling merayu di malam minggu', 'Goyang pelan ikuti irama', 'Senyummu manis bikin rindu', 'Tepuk tangan semua bersama', 'Nyanyikan lagi bait yang tadi', 'Malam ini jangan cepat usai', 'Bersamamu aku bahagia'] },
  { id: 'teras-belakang', title: 'Teras Belakang', artist: 'Petik Damai', album: 'Sore di Desa', genre: 'akustik', bpm: 84, root: 55, mode: 'major', wave: 'pluck', drums: 'none',
    lyrics: ['Gitar tua di teras belakang', 'Ayam berkokok jauh di sana', 'Angin membawa wangi tanah', 'Kita duduk tanpa terburu', 'Daun jatuh satu per satu', 'Cerita lama kembali pulang', 'Sederhana saja sudah cukup', 'Sore ini milik kita berdua'] },
  { id: 'fajar-di-atas-awan', title: 'Fajar di Atas Awan', artist: 'Kuartet Tirai', album: 'Suite Pagi', genre: 'klasik', bpm: 66, root: 60, mode: 'major', wave: 'string', drums: 'none',
    lyrics: ['Cahaya pertama menyentuh gunung', 'Awan terbuka pelan-pelan', 'Biola menyapa langit yang biru', 'Segala sunyi berubah nada', 'Napas panjang di ketinggian', 'Bumi bangun dalam pelukan', 'Fajar berjalan di atas awan', 'Dan dunia mulai bernyanyi'] }
];
