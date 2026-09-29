import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushHistory, sanitizeSession, type LastPlayed } from '@/lib/history';

interface SessionState {
  history: string[];
  last: LastPlayed | null;
  played: (id: string) => void;
  remember: (id: string, position: number) => void;
}

/** Riwayat putar + lagu terakhir beserta posisinya, supaya aplikasi bisa melanjutkan dari titik terakhir. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      history: [], last: null,
      played: (id) => set((s) => ({ history: pushHistory(s.history, id), last: { id, position: 0 } })),
      remember: (id, position) => set({ last: { id, position } })
    }),
    { name: 'warnada:session', version: 1, partialize: (s) => ({ history: s.history, last: s.last }), merge: (saved, current) => ({ ...current, ...sanitizeSession(saved) }) }
  )
);
