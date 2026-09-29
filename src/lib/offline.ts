import type { Track } from './types';
import { assetUrl } from './catalog';

export const MEDIA_CACHE = 'warnada-media-v1';
const abs = (p: string) => new URL(assetUrl(p), location.href).href;

export const cacheSupported = () => 'caches' in self;

export async function listDownloaded(): Promise<Set<string>> {
  if (!cacheSupported()) return new Set();
  const cache = await caches.open(MEDIA_CACHE);
  const keys = await cache.keys();
  return new Set(keys.map((k) => new URL(k.url).pathname).filter((p) => p.includes('/audio/')).map((p) => p.split('/').pop()!.replace(/\.[^.]+$/, '')));
}

export async function downloadTrack(t: Track): Promise<void> {
  const cache = await caches.open(MEDIA_CACHE);
  // audio terakhir: kalau gagal di tengah, lagu tidak dianggap terunduh
  const lyr = await fetch(abs(t.lyrics));
  if (lyr.ok) await cache.put(abs(t.lyrics), lyr);
  const res = await fetch(abs(t.audio));
  if (!res.ok) throw new Error(`audio ${res.status}`);
  await cache.put(abs(t.audio), res);
}

export async function removeTrack(t: Track): Promise<void> {
  const cache = await caches.open(MEDIA_CACHE);
  await cache.delete(abs(t.audio));
  await cache.delete(abs(t.lyrics));
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  const e = await navigator.storage?.estimate?.();
  return e ? { usage: e.usage ?? 0, quota: e.quota ?? 0 } : null;
}
