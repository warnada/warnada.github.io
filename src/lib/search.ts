import { GENRE_LABEL, type Track } from './types';

export type Match = { kind: 'meta' } | { kind: 'lyric'; line: string };

/** Judul/artis/album/genre didahulukan; bila tidak ada, cari di baris lirik. */
export function matchTrack(track: Track, term: string, lyricLines: readonly string[]): Match | null {
  const q = term.trim().toLowerCase();
  if (!q) return null;
  const meta = `${track.title} ${track.artist} ${track.album} ${GENRE_LABEL[track.genre]}`.toLowerCase();
  if (meta.includes(q)) return { kind: 'meta' };
  const line = lyricLines.find((l) => l.toLowerCase().includes(q));
  return line ? { kind: 'lyric', line } : null;
}
