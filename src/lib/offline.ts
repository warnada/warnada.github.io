import type { Track } from './types';
import { mediaUrl } from './media';

export const MEDIA_CACHE = 'warnada-media-v1';
const abs = (p: string) => new URL(mediaUrl(p), location.href).href;

export const cacheSupported = () => 'caches' in self;
export const canDownload = (t: Track) => t.downloadable !== false;

/** URL audio yang tersimpan di perangkat. Pencocokan ke lagu dilakukan pemanggil lewat audioKey(). */
export async function listCachedAudio(): Promise<Set<string>> {
  if (!cacheSupported()) return new Set();
  const cache = await caches.open(MEDIA_CACHE);
  return new Set((await cache.keys()).map((k) => k.url));
}
export const audioKey = (t: Track) => abs(t.audio);

export async function downloadTrack(t: Track): Promise<void> {
  if (!canDownload(t)) throw new Error('unduhan tidak diizinkan');
  const cache = await caches.open(MEDIA_CACHE);
  if (t.lyrics) {
    const lyr = await fetch(abs(t.lyrics));
    if (lyr.ok) await cache.put(abs(t.lyrics), lyr);
  }
  // mode cors: respons opaque tidak bisa dipakai untuk Range/seek. Gagal CORS = tidak dianggap terunduh.
  const res = await fetch(abs(t.audio), { mode: 'cors' });
  if (!res.ok) throw new Error(`audio ${res.status}`);
  // audio terakhir: kalau gagal di tengah, lagu tidak dianggap terunduh
  await cache.put(abs(t.audio), res);
}

export async function removeTrack(t: Track): Promise<void> {
  const cache = await caches.open(MEDIA_CACHE);
  await cache.delete(abs(t.audio));
  if (t.lyrics) await cache.delete(abs(t.lyrics));
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  const e = await navigator.storage?.estimate?.();
  return e ? { usage: e.usage ?? 0, quota: e.quota ?? 0 } : null;
}
