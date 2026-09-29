import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushHistory, sanitizeSession, toggleId, type LastPlayed } from '@/lib/history';

interface SessionState {
  history: string[];
  favorites: string[];
  last: LastPlayed | null;
  played: (id: string) => void;
  remember: (id: string, position: number) => void;
  toggleFavorite: (id: string) => void;
}

/** Riwayat putar, favorit, dan lagu terakhir beserta posisinya (dipulihkan saat aplikasi dibuka). */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      history: [], favorites: [], last: null,
      played: (id) => set((s) => ({ history: pushHistory(s.history, id), last: { id, position: 0 } })),
      remember: (id, position) => set({ last: { id, position } }),
      toggleFavorite: (id) => set((s) => ({ favorites: toggleId(s.favorites, id) }))
    }),
    { name: 'warnada:session', version: 1, partialize: (s) => ({ history: s.history, favorites: s.favorites, last: s.last }), merge: (saved, current) => ({ ...current, ...sanitizeSession(saved) }) }
  )
);
