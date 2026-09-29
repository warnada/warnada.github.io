export const HISTORY_MAX = 20;
export const FAVORITES_MAX = 500;

export interface LastPlayed { id: string; position: number }
export interface SessionData { history: string[]; favorites: string[]; last: LastPlayed | null }

/** Lagu terbaru di depan, tanpa duplikat, dibatasi HISTORY_MAX. Tidak mengubah array asli. */
export function pushHistory(list: string[], id: string, max = HISTORY_MAX): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, max);
}

/** Tambah ke depan bila belum ada, hapus bila sudah ada (untuk favorit). Tidak mengubah array asli. */
export function toggleId(list: string[], id: string, max = FAVORITES_MAX): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list].slice(0, max);
}

const cleanIds = (raw: unknown, max: number): string[] => {
  const seen = new Set<string>();
  return (Array.isArray(raw) ? raw : [])
    .filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 100 && !seen.has(x) && !!seen.add(x))
    .slice(0, max);
};

/** Data dari localStorage tidak tepercaya: ambil hanya yang bentuknya benar. */
export function sanitizeSession(raw: unknown): SessionData {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const l = typeof r.last === 'object' && r.last !== null ? (r.last as Record<string, unknown>) : null;
  const last = l && typeof l.id === 'string' && l.id && typeof l.position === 'number'
    ? { id: l.id, position: Number.isFinite(l.position) ? Math.max(0, l.position) : 0 }
    : null;
  return { history: cleanIds(r.history, HISTORY_MAX), favorites: cleanIds(r.favorites, FAVORITES_MAX), last };
}
