import type { Track } from './types';

/** Gabungkan lagu baru ke daftar lama tanpa duplikat id. Mengembalikan array lama bila tak ada yang baru. */
export function mergeTracks(current: Track[], incoming: Track[]): Track[] {
  const seen = new Set(current.map((t) => t.id));
  const fresh = incoming.filter((t) => !seen.has(t.id) && seen.add(t.id));
  return fresh.length ? [...current, ...fresh] : current;
}
