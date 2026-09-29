import { create } from 'zustand';

interface UiState {
  toast: { id: number; text: string; action?: { label: string; run: () => void } } | null;
  themeSheet: boolean;
  queueSheet: boolean;
  lyricsPanel: boolean;
  panelTab: 'lyrics' | 'queue';
  setUi: (p: Partial<Omit<UiState, 'setUi'>>) => void;
}
export const useUi = create<UiState>((set) => ({ toast: null, themeSheet: false, queueSheet: false, lyricsPanel: true, panelTab: 'lyrics', setUi: (p) => set(p) }));

let timer: number | undefined;
export function toast(text: string, action?: { label: string; run: () => void }, ms = 4000) {
  const id = Date.now();
  useUi.setState({ toast: { id, text, action } });
  clearTimeout(timer);
  if (ms > 0) timer = window.setTimeout(() => useUi.setState((s) => (s.toast?.id === id ? { toast: null } : s)), ms);
}
export const dismissToast = () => useUi.setState({ toast: null });
