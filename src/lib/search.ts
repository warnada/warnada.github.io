import { GENRES, GENRE_LABEL, type Genre, type Track } from './types';

export type Match = { kind: 'meta' } | { kind: 'lyric'; line: string };

export const RECENT_MAX = 8;
export const RECENT_TERM_MIN = 2;
export const RECENT_TERM_MAX = 60;

/** Judul/artis/album/genre didahulukan; bila tidak ada, cari di baris lirik. */
export function matchTrack(track: Track, term: string, lyricLines: readonly string[]): Match | null {
  const q = term.trim().toLowerCase();
  if (!q) return null;
  const meta = `${track.title} ${track.artist} ${track.album} ${GENRE_LABEL[track.genre]}`.toLowerCase();
  if (meta.includes(q)) return { kind: 'meta' };
  const line = lyricLines.find((l) => l.toLowerCase().includes(q));
  return line ? { kind: 'lyric', line } : null;
}

/** Rapikan spasi; null bila terlalu pendek/panjang untuk disimpan sebagai pencarian terakhir. */
export function normalizeTerm(term: string): string | null {
  const t = term.replace(/\s+/g, ' ').trim();
  return t.length >= RECENT_TERM_MIN && t.length <= RECENT_TERM_MAX ? t : null;
}

/** Pencarian terbaru di depan, tanpa duplikat (tanpa peduli huruf besar), dibatasi RECENT_MAX. Tidak mengubah array asli. */
export function pushRecent(list: string[], term: string, max = RECENT_MAX): string[] {
  const t = normalizeTerm(term);
  if (!t) return list;
  const key = t.toLowerCase();
  return [t, ...list.filter((x) => x.toLowerCase() !== key)].slice(0, max);
}

export interface Segment { text: string; hit: boolean }

/** Pecah teks menjadi bagian cocok/tidak cocok untuk disorot. Tanpa regex, jadi karakter khusus aman. */
export function splitHighlight(text: string, term: string): Segment[] {
  const q = term.trim().toLowerCase();
  const lower = text.toLowerCase();
  if (!q || lower.length !== text.length) return [{ text, hit: false }]; // huruf tertentu mengubah panjang saat lowercase: jangan salah potong
  const out: Segment[] = [];
  let from = 0;
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, from)) {
    if (at > from) out.push({ text: text.slice(from, at), hit: false });
    out.push({ text: text.slice(at, at + q.length), hit: true });
    from = at + q.length;
  }
  if (from < text.length) out.push({ text: text.slice(from), hit: false });
  return out.length ? out : [{ text, hit: false }];
}

/** Nama event untuk meminta halaman Cari memfokuskan kolomnya (klik menu Cari saat sudah berada di sana). */
export const FOCUS_SEARCH_EVENT = 'warnada:focus-search';

/** Fokus otomatis hanya saat Cari dibuka polos (dari menu). Bila URL sudah membawa tujuan (genre/kata), jangan tutupi hasil dengan keyboard. */
export function shouldAutofocus(params: URLSearchParams): boolean {
  return !readGenre(params.get('genre')) && !params.get('q')?.trim();
}

/** Nilai genre dari URL: hanya yang dikenal, selain itu null. */
export function readGenre(value: string | null): Genre | null {
  return GENRES.find((g) => g === value) ?? null;
}
