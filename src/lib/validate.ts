import { ACCENTS, GENRES, type AccentName, type Genre, type ThemeMode, type Track } from './types';

export class CatalogError extends Error {
  constructor(message: string) { super(message); this.name = 'CatalogError'; }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, field: string): string => {
  if (typeof v !== 'string' || !v.trim() || v.length > 200) throw new CatalogError(`field "${field}" tidak valid`);
  return v;
};
const num = (v: unknown, field: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) throw new CatalogError(`field "${field}" tidak valid`);
  return v;
};
/** Hanya path relatif di origin sendiri; menolak skema, //host, path absolut, "..", dan backslash. */
const relPath = (v: unknown, field: string): string => {
  const p = str(v, field);
  if (/^[a-z][a-z0-9+.-]*:/i.test(p) || p.startsWith('/') || p.includes('\\') || p.split('/').includes('..'))
    throw new CatalogError(`path "${field}" harus relatif`);
  return p;
};

export function parseCatalog(json: unknown): Track[] {
  if (!isRecord(json) || !Array.isArray(json.tracks)) throw new CatalogError('katalog tidak valid');
  const seen = new Set<string>();
  return json.tracks.map((raw, i) => {
    if (!isRecord(raw)) throw new CatalogError(`lagu #${i} tidak valid`);
    const id = str(raw.id, 'id');
    if (seen.has(id)) throw new CatalogError(`id ganda: ${id}`);
    seen.add(id);
    if (typeof raw.genre !== 'string' || !(GENRES as readonly string[]).includes(raw.genre)) throw new CatalogError(`genre tidak dikenal pada ${id}`);
    return {
      id, title: str(raw.title, 'title'), artist: str(raw.artist, 'artist'), album: str(raw.album, 'album'), genre: raw.genre as Genre,
      duration: num(raw.duration, 'duration'), size: num(raw.size, 'size'), audio: relPath(raw.audio, 'audio'), lyrics: relPath(raw.lyrics, 'lyrics'), source: 'demo'
    };
  });
}

export interface Settings { accent: AccentName; theme: ThemeMode; followGenre: boolean; offlineMode: boolean; bannerDismissed: boolean; blurTransition: boolean }

/** Data dari localStorage bisa rusak/diubah; ambil hanya nilai valid, sisanya pakai bawaan. */
export function sanitizeSettings(raw: unknown, fallback: Settings): Settings {
  if (!isRecord(raw)) return { ...fallback };
  const bool = (k: keyof Settings) => (typeof raw[k] === 'boolean' ? (raw[k] as boolean) : (fallback[k] as boolean));
  return {
    accent: typeof raw.accent === 'string' && (ACCENTS as readonly string[]).includes(raw.accent) ? (raw.accent as AccentName) : fallback.accent,
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : fallback.theme,
    followGenre: bool('followGenre'), offlineMode: bool('offlineMode'), bannerDismissed: bool('bannerDismissed'), blurTransition: bool('blurTransition')
  };
}
