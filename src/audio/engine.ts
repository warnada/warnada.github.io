import { create } from 'zustand';
import type { Track } from '@/lib/types';
import { assetUrl } from '@/lib/catalog';
import { pickNext, type Repeat } from '@/lib/queue';
import { useLibrary } from '@/store/library';
import { useSettings } from '@/store/settings';
import { toast } from '@/store/ui';


interface PlayerState {
  currentId: string | null;
  queue: string[];
  playing: boolean;
  buffering: boolean;
  duration: number;
  shuffle: boolean;
  repeat: Repeat;
}
export const usePlayer = create<PlayerState>(() => ({ currentId: null, queue: [], playing: false, buffering: false, duration: 0, shuffle: false, repeat: 'off' }));

const audio = new Audio();
audio.preload = 'metadata';
audio.crossOrigin = 'anonymous';

export const getTime = () => audio.currentTime;
export const isOffline = () => useSettings.getState().offlineMode || !navigator.onLine;
export const trackById = (id: string | null) => (id ? useLibrary.getState().tracks.find((t) => t.id === id) : undefined);
export const currentTrack = () => trackById(usePlayer.getState().currentId);

export function canPlay(t: Track): boolean {
  return !isOffline() || useLibrary.getState().downloaded.has(t.id);
}

export function playTrack(id: string, queue?: string[]) {
  const t = trackById(id);
  if (!t) return;
  if (!canPlay(t)) { toast('Mode offline aktif. Unduh lagunya dulu, ya.'); return; }
  if (queue) usePlayer.setState({ queue });
  else if (!usePlayer.getState().queue.includes(id)) usePlayer.setState({ queue: [id] });
  usePlayer.setState({ currentId: id, buffering: true });
  audio.src = assetUrl(t.audio);
  void audio.play().catch(() => { usePlayer.setState({ playing: false, buffering: false }); });
  setSession(t);
}

export function toggle() {
  const { currentId } = usePlayer.getState();
  if (!currentId) return;
  if (audio.paused) void audio.play().catch(() => toast('Tidak bisa memutar lagu ini.')); else audio.pause();
}
export const seek = (sec: number) => { if (Number.isFinite(sec)) audio.currentTime = Math.max(0, Math.min(sec, audio.duration || sec)); };

function step(dir: 1 | -1, auto = false) {
  const { queue, currentId, shuffle, repeat } = usePlayer.getState();
  const isPlayable = (id: string) => { const t = trackById(id); return !!t && canPlay(t); };
  const d = pickNext({ queue, currentId, shuffle, repeat, auto, isPlayable, random: Math.random }, dir);
  if (d.type === 'play') playTrack(d.id);
  else if (d.type === 'restart') { audio.currentTime = 0; void audio.play(); }
  else if (auto) usePlayer.setState({ playing: false });
}
export const next = () => step(1);
export const prev = () => { if (audio.currentTime > 3) audio.currentTime = 0; else step(-1); };
export const toggleShuffle = () => usePlayer.setState((s) => ({ shuffle: !s.shuffle }));
export const cycleRepeat = () => usePlayer.setState((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' }));

audio.addEventListener('play', () => usePlayer.setState({ playing: true }));
audio.addEventListener('pause', () => usePlayer.setState({ playing: false }));
audio.addEventListener('waiting', () => usePlayer.setState({ buffering: true }));
audio.addEventListener('playing', () => usePlayer.setState({ buffering: false, playing: true }));
audio.addEventListener('durationchange', () => usePlayer.setState({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 }));
audio.addEventListener('ended', () => step(1, true));
audio.addEventListener('error', () => {
  usePlayer.setState({ playing: false, buffering: false });
  toast(isOffline() ? 'Lagu ini belum diunduh.' : 'Lagu gagal dimuat. Coba lagi.');
});
audio.addEventListener('timeupdate', () => {
  if (!('mediaSession' in navigator) || !audio.duration) return;
  try { navigator.mediaSession.setPositionState({ duration: audio.duration, position: audio.currentTime, playbackRate: audio.playbackRate }); } catch { /* abaikan */ }
});

function setSession(t: Track) {
  if (!('mediaSession' in navigator)) return;
  const icon = (s: number) => ({ src: assetUrl(`icons/icon-${s}.png`), sizes: `${s}x${s}`, type: 'image/png' });
  navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album, artwork: [icon(192), icon(512)] });
}
if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', toggle);
  ms.setActionHandler('pause', toggle);
  ms.setActionHandler('previoustrack', prev);
  ms.setActionHandler('nexttrack', next);
  ms.setActionHandler('seekto', (d) => { if (d.seekTime != null) seek(d.seekTime); });
  ms.setActionHandler('seekbackward', (d) => seek(audio.currentTime - (d.seekOffset ?? 10)));
  ms.setActionHandler('seekforward', (d) => seek(audio.currentTime + (d.seekOffset ?? 10)));
}

/** Berlangganan peristiwa waktu yang tidak datang dari putaran normal (seek, ganti lagu). */
export function onTimeJump(cb: () => void): () => void {
  const evs = ['seeked', 'loadstart', 'emptied'] as const;
  evs.forEach((e) => audio.addEventListener(e, cb));
  return () => evs.forEach((e) => audio.removeEventListener(e, cb));
}
