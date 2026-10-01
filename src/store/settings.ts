import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccentName, ThemeMode } from '@/lib/types';
import { sanitizeSettings } from '@/lib/validate';

interface SettingsState {
  accent: AccentName;
  theme: ThemeMode;
  followGenre: boolean;
  offlineMode: boolean;
  bannerDismissed: boolean;
  /** blur opsional saat geser antarmenu (bawaan mati: paling mulus di HP) */
  blurTransition: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

const prefersLight = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches;

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      accent: 'lilac', theme: prefersLight ? 'light' : 'dark', followGenre: true, offlineMode: false, bannerDismissed: false, blurTransition: false,
      set: (patch) => set(patch)
    }),
    { name: 'warnada:settings', version: 2,
      // v2: blur geser antarmenu jadi opsi yang bawaannya mati, termasuk untuk yang sebelumnya menyala otomatis
      migrate: (saved, version) => (version < 2 && saved && typeof saved === 'object' ? { ...saved, blurTransition: false } : saved),
      merge: (saved, current) => ({ ...current, ...sanitizeSettings(saved, current) }), partialize: (s) => ({ accent: s.accent, theme: s.theme, followGenre: s.followGenre, offlineMode: s.offlineMode, bannerDismissed: s.bannerDismissed, blurTransition: s.blurTransition }) }
  )
);
