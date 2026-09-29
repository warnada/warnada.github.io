import { GENRES, type Genre, type License, type Track } from './types';

/** Kebijakan lisensi: 'commercial' hanya lagu tanpa klausul NC (aman untuk layanan berbayar/beriklan). */
export type LicensePolicy = 'commercial' | 'all';

/** Warnada non-komersial, jadi bawaan 'all'. Ubah ke 'commercial' bila aplikasi nanti dimonetisasi. */
export const parseLicensePolicy = (v: unknown): LicensePolicy => (v === 'commercial' ? 'commercial' : 'all');

const API = 'https://api.jamendo.com/v3.0/tracks/';
const MAX_LIMIT = 50;
const BYTES_PER_SECOND = 24_000; // perkiraan MP3 VBR mp32; API tidak memberi ukuran berkas

export const GENRE_TAGS: Record<Genre, string> = {
  lofi: 'lofi', pop: 'pop', rock: 'rock', jazz: 'jazz', edm: 'electronic', dangdut: 'dangdut', akustik: 'acoustic', klasik: 'classical'
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const httpsUrl = (v: unknown): URL | null => {
  if (typeof v !== 'string') return null;
  try { const u = new URL(v); return u.protocol === 'https:' ? u : null; } catch { return null; }
};
const hostIs = (u: URL, domain: string) => u.hostname === domain || u.hostname.endsWith(`.${domain}`);

/** Domain yang boleh menjadi sumber audio/gambar. Harus sinkron dengan CSP di vite.config.ts. */
export const TRUSTED_MEDIA_DOMAINS = ['jamendo.com', 'newjamendo.com'] as const;
export function isTrustedMediaUrl(v: unknown): boolean {
  const u = httpsUrl(v);
  return !!u && TRUSTED_MEDIA_DOMAINS.some((d) => hostIs(u, d));
}

const CC_PATH = /^\/licenses\/([a-z-]+)\/(\d\.\d)\/?$/i;
function parseLicense(v: unknown): (License & { commercial: boolean }) | null {
  const u = httpsUrl(typeof v === 'string' ? v.replace(/^http:/i, 'https:') : v);
  if (!u || !hostIs(u, 'creativecommons.org')) return null;
  const m = CC_PATH.exec(u.pathname);
  if (!m) return null;
  return { label: `CC ${m[1].toUpperCase()} ${m[2]}`, url: u.href, commercial: !m[1].toLowerCase().split('-').includes('nc') };
}
export function isCommercialLicense(url: unknown): boolean {
  return parseLicense(url)?.commercial ?? false;
}

export interface ParseOptions { genre: Genre; policy: LicensePolicy }

/** Respons eksternal = tidak tepercaya: entri rusak dilewati, hanya bentuk respons keseluruhan yang melempar. */
export function parseJamendoTracks(json: unknown, opts: ParseOptions): Track[] {
  if (!isRecord(json) || !isRecord(json.headers) || !Array.isArray(json.results)) throw new Error('respons Jamendo tidak valid');
  if (json.headers.status !== 'success') throw new Error(`Jamendo: ${String(json.headers.error_message ?? 'gagal')}`);
  const out: Track[] = [];
  for (const r of json.results) {
    if (!isRecord(r)) continue;
    const id = typeof r.id === 'string' || typeof r.id === 'number' ? String(r.id) : '';
    const duration = typeof r.duration === 'number' && Number.isFinite(r.duration) && r.duration > 0 ? Math.round(r.duration) : 0;
    const text = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : '');
    const title = text(r.name), artist = text(r.artist_name);
    const license = parseLicense(r.license_ccurl);
    if (!/^\d+$/.test(id) || !title || !artist || !duration || !isTrustedMediaUrl(r.audio) || !license) continue;
    if (opts.policy === 'commercial' && !license.commercial) continue;
    out.push({
      id: `jm-${id}`, title, artist, album: text(r.album_name) || 'Single', genre: opts.genre, duration,
      audio: r.audio as string, lyrics: null, size: duration * BYTES_PER_SECOND, source: 'jamendo',
      license: { label: license.label, url: license.url }, downloadable: r.audiodownload_allowed !== false,
      artwork: isTrustedMediaUrl(r.image) ? (r.image as string) : undefined
    });
  }
  return out;
}

export interface TracksQuery { tags?: string; search?: string; limit?: number; offset?: number }

export function buildTracksUrl(clientId: string, q: TracksQuery): string {
  const u = new URL(API);
  const limit = Math.max(1, Math.min(q.limit ?? 20, MAX_LIMIT));
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('format', 'json');
  u.searchParams.set('audioformat', 'mp32');
  u.searchParams.set('order', q.search ? 'relevance' : 'popularity_month');
  u.searchParams.set('limit', String(limit));
  u.searchParams.set('offset', String(Math.max(0, q.offset ?? 0)));
  if (q.tags) u.searchParams.set('tags', q.tags);
  if (q.search) u.searchParams.set('search', q.search);
  return u.href;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jamendo ${res.status}`);
  return res.json();
}

export interface JamendoSource {
  /** Lagu populer untuk tiap genre (gagal per genre tidak menggagalkan yang lain). */
  featured(perGenre: number, signal?: AbortSignal): Promise<Track[]>;
  /** Dengan genre, hasil dibatasi tag genre itu sehingga genre setiap lagu diketahui. */
  search(query: string, signal?: AbortSignal, genre?: Genre): Promise<Track[]>;
}

export function createJamendoSource(clientId: string, policy: LicensePolicy): JamendoSource {
  return {
    async featured(perGenre, signal) {
      const settled = await Promise.allSettled(GENRES.map(async (genre) =>
        parseJamendoTracks(await getJson(buildTracksUrl(clientId, { tags: GENRE_TAGS[genre], limit: perGenre }), signal), { genre, policy })));
      return settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []));
    },
    async search(query, signal, genre) {
      // tanpa genre, genre hasil tidak diketahui; 'pop' hanya penentu warna sampul cadangan
      const tags = genre ? GENRE_TAGS[genre] : undefined;
      return parseJamendoTracks(await getJson(buildTracksUrl(clientId, { search: query, tags, limit: 20 }), signal), { genre: genre ?? 'pop', policy });
    }
  };
}
