import type { Track } from './types';

export function greetingFor(hour: number): string {
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Pilihan cepat: favorit dulu, lalu riwayat, lalu sisa katalog; tanpa duplikat, maksimal n. */
export function quickPicks(tracks: Track[], favorites: string[], history: string[], n: number): Track[] {
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const order = [...favorites, ...history, ...tracks.map((t) => t.id)];
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const id of order) {
    const t = byId.get(id);
    if (t && !seen.has(id)) { seen.add(id); out.push(t); if (out.length === n) break; }
  }
  return out;
}
