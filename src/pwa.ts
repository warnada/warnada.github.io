import { registerSW } from 'virtual:pwa-register';
import { toast } from '@/store/ui';

export function initPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const update = registerSW({
    onNeedRefresh() { toast('Versi baru Warnada tersedia', { label: 'Muat ulang', run: () => void update(true) }, 0); },
    onOfflineReady() { toast('Siap dipakai offline'); },
    onRegisteredSW(_url, reg) { if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000); }
  });
}
