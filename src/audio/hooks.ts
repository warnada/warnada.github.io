import { useEffect, useReducer, useState, useSyncExternalStore } from 'react';
import { activeLine, type LyricLine } from '@/lib/lrc';
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

/** Indeks baris lirik aktif. Dihitung tiap frame, tetapi komponen hanya dirender ulang saat barisnya berganti. */
export function useLyricIndex(lines: LyricLine[] | null): number {
  const playing = usePlayer((s) => s.playing);
  const [idx, setIdx] = useState(-1);
  useEffect(() => {
    if (!lines) return;
    const update = () => setIdx(activeLine(lines, getTime()));
    update();
    const off = onTimeJump(update);
    if (!playing) return off;
    let raf = 0;
    const loop = () => { update(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { off(); cancelAnimationFrame(raf); };
  }, [lines, playing]);
  return lines ? idx : -1;
}
