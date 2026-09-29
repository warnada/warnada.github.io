import { create } from 'zustand';
import type { Track } from '@/lib/types';
import { staticCatalog } from '@/lib/catalog';
import { mergeTracks } from '@/lib/library';
import { audioKey, canDownload, downloadTrack, listCachedAudio, removeTrack } from '@/lib/offline';
import { createJamendoSource } from '@/lib/jamendo';
import { JAMENDO_CLIENT_ID, LICENSE_POLICY } from '@/config';
import { toast } from './ui';

const FEATURED_PER_GENRE = 8;
export const jamendo = JAMENDO_CLIENT_ID ? createJamendoSource(JAMENDO_CLIENT_ID, LICENSE_POLICY) : null;

interface LibraryState {
  tracks: Track[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** true selama lagu Jamendo masih dimuat di belakang layar */
  loadingRemote: boolean;
  cachedKeys: Set<string>;
  downloaded: Set<string>;
  busy: Set<string>;
  load: () => Promise<void>;
  retry: () => Promise<void>;
  addTracks: (incoming: Track[]) => void;
  download: (t: Track) => Promise<void>;
  remove: (t: Track) => Promise<void>;
}

const downloadedIds = (tracks: Track[], keys: Set<string>) => new Set(tracks.filter((t) => keys.has(audioKey(t))).map((t) => t.id));

export const useLibrary = create<LibraryState>((set, get) => ({
  tracks: [], status: 'idle', loadingRemote: false, cachedKeys: new Set(), downloaded: new Set(), busy: new Set(),
  async retry() { set({ status: 'idle' }); await get().load(); },
  addTracks(incoming) {
    set((s) => {
      const tracks = mergeTracks(s.tracks, incoming);
      return tracks === s.tracks ? s : { tracks, downloaded: downloadedIds(tracks, s.cachedKeys) };
    });
  },
  async load() {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading' });
    try {
      const [tracks, cachedKeys] = await Promise.all([staticCatalog.tracks(), listCachedAudio()]);
      set({ tracks, cachedKeys, downloaded: downloadedIds(tracks, cachedKeys), status: 'ready' });
    } catch {
      set({ status: 'error' });
      return;
    }
    if (!jamendo) return;
    set({ loadingRemote: true });
    try { get().addTracks(await jamendo.featured(FEATURED_PER_GENRE)); } catch { /* katalog demo tetap jalan */ }
    finally { set({ loadingRemote: false }); }
  },
  async download(t) {
    if (!canDownload(t)) { toast('Penyedia tidak mengizinkan unduhan lagu ini.'); return; }
    const flag = (on: boolean) => set((s) => { const busy = new Set(s.busy); if (on) busy.add(t.id); else busy.delete(t.id); return { busy }; });
    flag(true);
    try {
      await downloadTrack(t);
      set((s) => { const cachedKeys = new Set(s.cachedKeys).add(audioKey(t)); return { cachedKeys, downloaded: downloadedIds(s.tracks, cachedKeys) }; });
      toast(`“${t.title}” siap diputar offline`);
    } catch {
      toast('Gagal mengunduh. Cek koneksi lalu coba lagi.');
    } finally { flag(false); }
  },
  async remove(t) {
    await removeTrack(t);
    set((s) => { const cachedKeys = new Set(s.cachedKeys); cachedKeys.delete(audioKey(t)); return { cachedKeys, downloaded: downloadedIds(s.tracks, cachedKeys) }; });
  }
}));
