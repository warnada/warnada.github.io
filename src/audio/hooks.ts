import { useEffect, useReducer, useSyncExternalStore } from 'react';
import { getTime, onTimeJump, usePlayer } from './engine';

/** Waktu putar. fast=true memakai rAF (untuk lirik); selain itu ~4x/detik. */
export function useTime(fast = false): number {
  const playing = usePlayer((s) => s.playing);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onTimeJump(tick), []);
  useEffect(() => {
    if (!playing) return;
    if (!fast) { const i = window.setInterval(tick, 250); return () => clearInterval(i); }
    let raf = 0;
    const loop = () => { tick(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, fast]);
  return getTime();
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => { addEventListener('online', cb); addEventListener('offline', cb); return () => { removeEventListener('online', cb); removeEventListener('offline', cb); }; },
    () => navigator.onLine
  );
}
