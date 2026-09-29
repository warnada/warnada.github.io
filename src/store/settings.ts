import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Genre, ThemeMode } from '@/lib/types';

interface SettingsState {
  genre: Genre;
  theme: ThemeMode;
  followGenre: boolean;
  offlineMode: boolean;
  bannerDismissed: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

const prefersLight = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches;

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      genre: 'lofi', theme: prefersLight ? 'light' : 'dark', followGenre: true, offlineMode: false, bannerDismissed: false,
      set: (patch) => set(patch)
    }),
    { name: 'warnada:settings', version: 1, partialize: (s) => ({ genre: s.genre, theme: s.theme, followGenre: s.followGenre, offlineMode: s.offlineMode, bannerDismissed: s.bannerDismissed }) }
  )
);
