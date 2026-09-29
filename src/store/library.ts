import { create } from 'zustand';
import type { Track } from '@/lib/types';
import { staticCatalog } from '@/lib/catalog';
import { downloadTrack, listDownloaded, removeTrack } from '@/lib/offline';
import { toast } from './ui';

interface LibraryState {
  tracks: Track[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  downloaded: Set<string>;
  busy: Set<string>;
  load: () => Promise<void>;
  download: (t: Track) => Promise<void>;
  remove: (t: Track) => Promise<void>;
}

export const useLibrary = create<LibraryState>((set, get) => ({
  tracks: [], status: 'idle', downloaded: new Set(), busy: new Set(),
  async load() {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading' });
    try {
      const [tracks, downloaded] = await Promise.all([staticCatalog.tracks(), listDownloaded()]);
      set({ tracks, downloaded, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
  async download(t) {
    const flag = (on: boolean) => set((s) => { const busy = new Set(s.busy); if (on) busy.add(t.id); else busy.delete(t.id); return { busy }; });
    flag(true);
    try {
      await downloadTrack(t);
      set((s) => ({ downloaded: new Set(s.downloaded).add(t.id) }));
      toast(`“${t.title}” siap diputar offline`);
    } catch {
      toast('Gagal mengunduh. Cek koneksi lalu coba lagi.');
    } finally { flag(false); }
  },
  async remove(t) {
    await removeTrack(t);
    set((s) => { const d = new Set(s.downloaded); d.delete(t.id); return { downloaded: d }; });
  }
}));
