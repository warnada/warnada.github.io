import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushHistory, sanitizeSession, toggleId, type LastPlayed } from '@/lib/history';
import { pushRecent } from '@/lib/search';

interface SessionState {
  history: string[];
  favorites: string[];
  recentSearches: string[];
  last: LastPlayed | null;
  played: (id: string) => void;
  remember: (id: string, position: number) => void;
  toggleFavorite: (id: string) => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

/** Riwayat putar, favorit, pencarian terakhir, dan lagu terakhir beserta posisinya (dipulihkan saat aplikasi dibuka). */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      history: [], favorites: [], recentSearches: [], last: null,
      played: (id) => set((s) => ({ history: pushHistory(s.history, id), last: { id, position: 0 } })),
      remember: (id, position) => set({ last: { id, position } }),
      toggleFavorite: (id) => set((s) => ({ favorites: toggleId(s.favorites, id) })),
      addRecentSearch: (term) => set((s) => ({ recentSearches: pushRecent(s.recentSearches, term) })),
      removeRecentSearch: (term) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== term) })),
      clearRecentSearches: () => set({ recentSearches: [] })
    }),
    {
      name: 'warnada:session', version: 1,
      partialize: (s) => ({ history: s.history, favorites: s.favorites, recentSearches: s.recentSearches, last: s.last }),
      merge: (saved, current) => ({ ...current, ...sanitizeSession(saved) })
    }
  )
);
