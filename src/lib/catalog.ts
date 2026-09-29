import type { Track } from './types';
import { parseLrc, type LyricLine } from './lrc';
import { parseCatalog } from './validate';
import { mediaUrl } from './media';

/**
 * Sumber katalog. Saat ini berkas statis; untuk backend nanti cukup ganti
 * implementasi CatalogSource ini (mis. REST/GraphQL) tanpa menyentuh UI.
 */
export interface CatalogSource {
  tracks(): Promise<Track[]>;
  lyrics(track: Track): Promise<LyricLine[]>;
}

const url = (p: string) => `${import.meta.env.BASE_URL}${p}`;

export const staticCatalog: CatalogSource = {
  async tracks() {
    const res = await fetch(url('catalog.json'));
    if (!res.ok) throw new Error(`catalog ${res.status}`);
    return parseCatalog(await res.json());
  },
  async lyrics(track) {
    if (!track.lyrics) return [];
    const res = await fetch(url(track.lyrics));
    if (!res.ok) throw new Error(`lyrics ${res.status}`);
    return parseLrc(await res.text());
  }
};

export const assetUrl = url;
export { mediaUrl };
const lyricCache = new Map<string, Promise<LyricLine[]>>();
export function loadLyrics(track: Track): Promise<LyricLine[]> {
  let p = lyricCache.get(track.id);
  if (!p) {
    p = staticCatalog.lyrics(track).catch((e) => { lyricCache.delete(track.id); throw e; });
    lyricCache.set(track.id, p);
  }
  return p;
}
