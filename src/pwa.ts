import { registerSW } from 'virtual:pwa-register';
import { toast } from '@/store/ui';

const TOLD_KEY = 'warnada:offline-told';

export function initPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const update = registerSW({
    onNeedRefresh() { toast('Versi baru Warnada tersedia', { label: 'Muat ulang', run: () => void update(true) }, 0); },
    onOfflineReady() {
      // hanya sekali seumur perangkat; setiap kunjungan pertama pasca-update tidak perlu mengulang
      try { if (localStorage.getItem(TOLD_KEY)) return; localStorage.setItem(TOLD_KEY, '1'); } catch { /* tetap tampilkan */ }
      toast('Warnada siap dipakai offline');
    },
    onRegisteredSW(_url, reg) { if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000); }
  });
}
