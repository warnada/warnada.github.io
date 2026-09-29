import { useEffect, useState } from 'react';
import { useSettings } from '@/store/settings';
import { dismissToast, useUi } from '@/store/ui';
import { GenreSwatches, Switch } from './parts';
import { QueueList } from './Player';
import { Icon } from './Icon';

export function Toast() {
  const t = useUi((s) => s.toast);
  if (!t) return null;
  return (
    <div className="toast wd-glass wd-glass--pop" role="status" aria-live="polite">
      <span>{t.text}</span>
      {t.action && <button type="button" className="wd-btn wd-btn--accent" style={{ minHeight: 36, padding: '0 14px' }} onClick={() => { t.action!.run(); dismissToast(); }}>{t.action.label}</button>}
      <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} aria-label="Tutup" onClick={dismissToast}><Icon name="close" width={18} height={18} /></button>
    </div>
  );
}

export function ThemeSheet() {
  const open = useUi((s) => s.themeSheet);
  const s = useSettings();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && useUi.setState({ themeSheet: false });
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  const close = () => useUi.setState({ themeSheet: false });
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet wd-glass wd-glass--pop" role="dialog" aria-modal="true" aria-labelledby="tema-h" onClick={(e) => e.stopPropagation()}>
        <h2 id="tema-h">Suasana</h2>
        <GenreSwatches value={s.genre} onPick={(genre) => s.set({ genre, followGenre: false })} />
        <div className="seg" role="group" aria-label="Tema">
          <button type="button" aria-pressed={s.theme === 'dark'} onClick={() => s.set({ theme: 'dark' })}><Icon name="moon" />Gelap</button>
          <button type="button" aria-pressed={s.theme === 'light'} onClick={() => s.set({ theme: 'light' })}><Icon name="sun" />Terang</button>
        </div>
        <div className="setting" style={{ padding: 0 }}>
          <div className="setting__text"><strong id="fg">Ikuti genre lagu</strong><span className="caption">Warna aplikasi berganti mengikuti lagu yang diputar.</span></div>
          <Switch on={s.followGenre} onChange={(followGenre) => s.set({ followGenre })} labelId="fg" />
        </div>
        <p className="caption kbd-hint">Pintasan: Spasi putar/jeda · ←/→ ±5 detik · N/P lagu berikutnya/sebelumnya · Esc tutup pemutar</p>
        <button type="button" className="wd-btn wd-btn--ghost" onClick={close}>Selesai</button>
      </div>
    </div>
  );
}

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; listeners.forEach((l) => l()); });
addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()); });

const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => { const l = () => force((n) => n + 1); listeners.add(l); return () => void listeners.delete(l); }, []);
  const canPrompt = !!deferred && !isStandalone();
  const iosHint = isIos() && !isStandalone();
  return { canPrompt, iosHint, install: async () => { if (!deferred) return; await deferred.prompt(); await deferred.userChoice; deferred = null; force((n) => n + 1); } };
}

export function InstallBanner() {
  const { canPrompt, iosHint, install } = useInstall();
  const dismissed = useSettings((s) => s.bannerDismissed);
  if (dismissed || (!canPrompt && !iosHint)) return null;
  return (
    <div className="banner wd-glass wd-glass--raised">
      <Icon name="install" width={26} height={26} />
      <p>{canPrompt ? 'Pasang Warnada di HP' : 'Di Safari: ketuk Bagikan, lalu “Tambah ke Layar Utama”.'}</p>
      {canPrompt && <button type="button" className="wd-btn wd-btn--accent" onClick={install}>Pasang</button>}
      <button type="button" className="wd-btn" onClick={() => useSettings.getState().set({ bannerDismissed: true })}>Nanti saja</button>
    </div>
  );
}

export function QueueSheet() {
  const open = useUi((s) => s.queueSheet);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && useUi.setState({ queueSheet: false });
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  const close = () => useUi.setState({ queueSheet: false });
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet wd-glass wd-glass--pop" role="dialog" aria-modal="true" aria-labelledby="antrean-h" onClick={(e) => e.stopPropagation()}>
        <h2 id="antrean-h">Antrean</h2>
        <QueueList />
        <button type="button" className="wd-btn wd-btn--ghost" onClick={close}>Tutup</button>
      </div>
    </div>
  );
}
